import { z } from 'zod'
import { router, publicProcedure, protectedProcedure } from '../trpc'
import { TRPCError } from '@trpc/server'
import { investiq } from '@/lib/investiq-client'

export const dividendsRouter = router({
  calendar: protectedProcedure
    .input(z.object({
      portfolioId: z.string().optional(),
      startDate: z.date().optional(),
      endDate: z.date().optional(),
    }))
    .query(async ({ ctx, input }) => {
      return ctx.repos.dividends.getCalendar(ctx.session.user.id, input)
    }),

  summary: protectedProcedure
    .input(z.object({
      portfolioId: z.string().optional(),
      period: z.enum(['1M', '3M', '6M', '1Y', 'YTD', 'ALL']).default('1Y'),
    }))
    .query(async ({ ctx, input }) => {
      return ctx.repos.dividends.getSummary(ctx.session.user.id, input)
    }),

  projections: protectedProcedure
    .input(z.object({
      portfolioId: z.string().optional(),
      months: z.number().min(1).max(24).default(12),
    }))
    .query(async ({ ctx, input }) => {
      return ctx.repos.dividends.getProjections(ctx.session.user.id, input)
    }),

  simulate: publicProcedure
    .input(z.object({
      tickers: z.array(z.string()).max(10),
      amounts: z.array(z.number().positive()),
    }))
    .query(async ({ ctx, input }) => {
      if (input.tickers.length !== input.amounts.length) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Tickers and amounts must have same length' })
      }

      // Try backend simulation first (richer projections), fallback to local
      try {
        const backendSim = await investiq.post<{
          results: Array<{
            ticker: string; name: string; found: boolean;
            shares: number; current_price: number; dividend_yield: number;
            annual_dividend: number; monthly_dividend: number;
            safety_score: number | null; projected_yield_12m: number | null;
          }>
          totals: { annual_dividend: number; monthly_dividend: number; avg_yield: number; total_invested: number }
        }>('/dividends/simulate', {
          body: {
            positions: input.tickers.map((t, i) => ({ ticker: t, amount: input.amounts[i] })),
          },
        })

        if (backendSim?.results?.length) {
          return {
            results: backendSim.results.map(r => ({
              ticker: r.ticker, name: r.name, found: r.found,
              shares: r.shares, currentPrice: r.current_price,
              dividendYield: r.dividend_yield,
              annualDividend: r.annual_dividend, monthlyDividend: r.monthly_dividend,
              safetyScore: r.safety_score, projectedYield12m: r.projected_yield_12m,
            })),
            totals: {
              annualDividend: backendSim.totals.annual_dividend,
              monthlyDividend: backendSim.totals.monthly_dividend,
              avgYield: backendSim.totals.avg_yield,
              totalInvested: backendSim.totals.total_invested,
            },
            source: 'backend' as const,
          }
        }
      } catch { /* fallback to local */ }

      const localResult = await ctx.repos.dividends.simulate(input.tickers, input.amounts)
      return { ...localResult, source: 'local' as const }
    }),

  history: publicProcedure
    .input(z.object({
      ticker: z.string(),
      years: z.number().min(1).max(10).default(5),
    }))
    .query(async ({ ctx, input }) => {
      return ctx.repos.dividends.getHistory(input.ticker, input.years)
    }),

  // ─── Backend Dividend Projections (IQ-Cognit) ─────────────
  backendProjections: publicProcedure.query(async () => {
    try {
      const res = await investiq.get<{
        projections: Array<{ month: string; projected_value: number; tickers: string[] }>
        top_payers: Array<{ ticker: string; yield: number; amount: number }>
      }>('/dividends/projections')
      return {
        projections: res.projections ?? [],
        topPayers: res.top_payers ?? [],
      }
    } catch { return { projections: [], topPayers: [] } }
  }),

  // ─── Dividend Trap Risk (Backend IQ-Cognit) ───────────────
  trapRisk: publicProcedure
    .input(z.object({ ticker: z.string() }))
    .query(async ({ input }) => {
      try {
        const res = await investiq.get<{
          ticker: string
          trap_risk_score: number
          safety_score: number
          factors: string[]
          projected_yield: number | null
          payout_ratio: number | null
          dividend_cagr_5y: number | null
        }>(`/dividends/${encodeURIComponent(input.ticker)}/trap-risk`)
        return {
          available: true as const,
          riskScore: res.trap_risk_score ?? 0,
          safetyScore: res.safety_score ?? 100,
          factors: res.factors ?? [],
          projectedYield: res.projected_yield,
          payoutRatio: res.payout_ratio,
          dividendCagr5y: res.dividend_cagr_5y,
        }
      } catch {
        return { available: false as const, riskScore: 0, safetyScore: 0, factors: [] as string[], projectedYield: null, payoutRatio: null, dividendCagr5y: null }
      }
    }),
})
