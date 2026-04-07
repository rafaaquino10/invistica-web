// ─── Valuation Router ────────────────────────────────────────
// DCF e outros modelos de valuation.

import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { router, publicProcedure } from '../trpc'
import { getAssets } from '@/lib/data-source'
import { calculateDCF, estimateFCF } from '@/lib/valuation/dcf'
import { fetchBenchmarks } from '@/lib/gateway-client'

export const valuationRouter = router({
  dcf: publicProcedure
    .input(z.object({
      ticker: z.string(),
      marginOfSafety: z.number().min(0).max(50).optional(),
      projectionYears: z.number().min(5).max(15).optional(),
      terminalGrowthRate: z.number().min(0).max(4).optional(),
    }))
    .query(async ({ input }) => {
      const assets = await getAssets()
      const asset = assets.find(a => a.ticker.toUpperCase() === input.ticker.toUpperCase())
      if (!asset) {
        throw new TRPCError({ code: 'NOT_FOUND', message: `Ativo ${input.ticker} não encontrado` })
      }

      // Buscar SELIC para risk-free rate
      let selicRate = 13
      try {
        const benchmarks = await fetchBenchmarks()
        selicRate = (benchmarks as any).selic?.rate ?? 13
      } catch { /* fallback */ }

      // Obter FCF (real CVM > brapi > estimado)
      const { fcf, source: fcfSource } = estimateFCF(asset)
      if (fcf <= 0) {
        return {
          available: false as const,
          reason: 'FCF negativo ou dados insuficientes para calcular DCF',
          ticker: asset.ticker,
        }
      }

      // Beta (do scoreBreakdown se disponível)
      const beta = (asset as any).scoreBreakdown?.metadata?.beta ?? 1.0

      // Prioridade crescimento: FCF real (CVM) > receita 5a > fallback 5%
      // FCF growth para DCF: floor em 0% (negativo destrói o modelo)
      const rawGrowth = asset.fundamentals.fcfGrowthRate ?? asset.fundamentals.crescimentoReceita5a ?? 3
      const growthRate = Math.max(0, rawGrowth)

      const result = calculateDCF({
        ticker: asset.ticker,
        sector: asset.sector,
        freeCashFlow: fcf,
        fcfGrowthRate: Math.min(growthRate, 20),
        selicRate,
        riskPremium: 5.5,
        beta,
        sharesOutstanding: asset.marketCap && asset.price > 0 ? asset.marketCap / asset.price : undefined,
        netDebt: asset.fundamentals.netDebt ?? undefined,
        totalDebt: asset.fundamentals.totalDebt ?? undefined,
        marketCap: asset.marketCap ?? undefined,
        debtCost: asset.fundamentals.debtCostEstimate ?? undefined,
        projectionYears: input.projectionYears,
        terminalGrowthRate: input.terminalGrowthRate,
        marginOfSafety: input.marginOfSafety,
        fcfSource,
      })

      result.currentPrice = asset.price
      result.upside = asset.price > 0
        ? ((result.intrinsicValue - asset.price) / asset.price) * 100
        : 0
      result.isBelowFairValue = asset.price < result.buyPrice

      return { available: true as const, ...result }
    }),
})
