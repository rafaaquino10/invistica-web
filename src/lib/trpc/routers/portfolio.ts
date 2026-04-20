import { z } from 'zod'
import { router, protectedProcedure, publicProcedure, premiumProcedure } from '../trpc'
import { fetchBenchmarks } from '@/lib/gateway-client'
import { getAssets } from '@/lib/data-source'
import { runMonteCarlo, estimateAssetParams, type MonteCarloPosition } from '@/lib/simulation/monte-carlo'
import { investiq } from '@/lib/investiq-client'

// Benchmark rates — fallback values when gateway unavailable
const FALLBACK_CDI_RATE = 0.1315
const FALLBACK_IBOV_RATE = 0.08

export const portfolioRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return ctx.repos.portfolio.list(ctx.session.user.id)
  }),

  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.repos.portfolio.get(ctx.session.user.id, input.id)
    }),

  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1).max(100),
      description: z.string().max(500).optional(),
      isDefault: z.boolean().default(false),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.repos.portfolio.create(ctx.session.user.id, input)
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      name: z.string().min(1).max(100).optional(),
      description: z.string().max(500).optional(),
      isDefault: z.boolean().optional(),
      targetAllocation: z.record(z.number()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input
      return ctx.repos.portfolio.update(ctx.session.user.id, id, data)
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.repos.portfolio.delete(ctx.session.user.id, input.id)
    }),

  addTransaction: protectedProcedure
    .input(z.object({
      portfolioId: z.string(),
      ticker: z.string(),
      type: z.enum(['BUY', 'SELL']),
      date: z.date(),
      quantity: z.number().positive(),
      price: z.number().positive(),
      fees: z.number().min(0).default(0),
      notes: z.string().max(500).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.repos.portfolio.addTransaction(ctx.session.user.id, input)
    }),

  deleteTransaction: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.repos.portfolio.deleteTransaction(ctx.session.user.id, input.id)
    }),

  performance: protectedProcedure
    .input(z.object({
      portfolioId: z.string(),
      period: z.enum(['1M', '3M', '6M', '1Y', 'YTD', 'ALL']).default('1Y'),
    }))
    .query(async ({ ctx, input }) => {
      const benchmarkData = await fetchBenchmarks()
      const cdiRate = benchmarkData.cdi.annualRate || FALLBACK_CDI_RATE
      const ibovRate = FALLBACK_IBOV_RATE
      return ctx.repos.portfolio.getPerformance(ctx.session.user.id, input.portfolioId, input.period, cdiRate, ibovRate)
    }),

  benchmarkRates: publicProcedure.query(async () => {
    const data = await fetchBenchmarks()
    return {
      cdiAnnual: data.cdi.annualRate || FALLBACK_CDI_RATE,
      ibovAnnual: FALLBACK_IBOV_RATE,
      selicRate: data.selic.rate,
      updatedAt: data.updatedAt,
    }
  }),

  // ─── Monte Carlo Simulation (Elite) ────────────────────────
  monteCarlo: premiumProcedure
    .input(z.object({
      portfolioId: z.string(),
      years: z.number().min(1).max(30).default(10),
      monthlyContribution: z.number().min(0).max(1_000_000).default(1000),
      simulations: z.number().min(100).max(5000).optional(),
    }))
    .query(async ({ ctx, input }) => {
      const portfolio = await ctx.repos.portfolio.get(ctx.session.user.id, input.portfolioId)
      if (!portfolio) return null

      const assets = await getAssets()
      const totalValue = (portfolio as any).totalValue ?? 100_000

      // Montar posições com retorno/volatilidade estimados
      const positions: MonteCarloPosition[] = []
      const transactions = (portfolio as any).transactions ?? []

      // Agrupar por ticker
      const tickerMap = new Map<string, number>()
      for (const tx of transactions) {
        const t = (tx.ticker ?? tx.asset?.ticker ?? '') as string
        if (!t) continue
        const qty = (tx.type === 'buy' ? 1 : -1) * (tx.quantity ?? 0)
        tickerMap.set(t, (tickerMap.get(t) ?? 0) + qty)
      }

      for (const [ticker, qty] of tickerMap) {
        if (qty <= 0) continue
        const asset = assets.find(a => a.ticker === ticker)
        if (!asset) continue

        const value = qty * asset.price
        const weight = totalValue > 0 ? value / totalValue : 0
        const params = estimateAssetParams(
          asset.aqScore?.scoreTotal ?? 50,
          asset.changePercent,
          asset.fundamentals.dividendYield,
          asset.sector,
        )

        positions.push({ ticker, weight, ...params })
      }

      // Fallback se portfólio vazio
      if (positions.length === 0) {
        positions.push({
          ticker: 'IBOV',
          weight: 1,
          expectedReturn: 0.10,
          volatility: 0.22,
        })
      }

      return runMonteCarlo({
        initialValue: totalValue,
        monthlyContribution: input.monthlyContribution,
        positions,
        years: input.years,
        simulations: input.simulations,
      })
    }),

  // ─── Smart Contribution (Backend Invscore) ───────────────
  smartContribution: premiumProcedure
    .input(z.object({
      portfolioId: z.string().optional(),
      amount: z.number().positive().optional(),
    }))
    .query(async ({ ctx, input }) => {
      try {
        const params: Record<string, string> = {}
        if (input.portfolioId) params['portfolio_id'] = input.portfolioId
        if (input.amount) params['amount'] = String(input.amount)

        const res = await investiq.get<{
          suggestions: Array<{
            ticker: string
            weight: number
            reason: string
            iq_score: number
            current_price: number
          }>
          rationale: string
          total_amount: number
        }>('/portfolio/smart-contribution', {
          params,
          timeout: 15000,
        })

        return {
          available: true as const,
          suggestions: (res.suggestions ?? []).map(s => ({
            ticker: s.ticker,
            weight: s.weight,
            reason: s.reason,
            iqScore: s.iq_score,
            logo: `https://raw.githubusercontent.com/StatusInvest/Content/master/img/company/${s.ticker}.jpg`,
          })),
          rationale: res.rationale,
          amount: res.total_amount,
        }
      } catch {
        return { available: false as const, suggestions: [], rationale: null, amount: null }
      }
    }),
})
