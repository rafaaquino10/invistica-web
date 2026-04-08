// ─── Valuation Router ────────────────────────────────────────
// DCF local + dados ricos do backend (Gordon, Multiples, Monte Carlo).
// Onda 1: Enriquecido com /valuation/{ticker} do backend.

import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { router, publicProcedure } from '../trpc'
import { getAssets } from '@/lib/data-source'
import { calculateDCF, estimateFCF } from '@/lib/valuation/dcf'
import { fetchBenchmarks } from '@/lib/gateway-client'
import { investiq } from '@/lib/investiq-client'

// Backend valuation response shape
interface BackendValuation {
  ticker: string
  current_price: number | null
  fair_value_final: number | null
  fair_value_dcf: number | null
  fair_value_gordon: number | null
  fair_value_mult: number | null
  fair_value_p25: number | null
  fair_value_p75: number | null
  safety_margin: number | null
  upside_prob: number | null
  loss_prob: number | null
  score_valuation: number | null
  dupont: {
    margin: number | null
    turnover: number | null
    leverage: number | null
    driver: string | null
  } | null
  interest_coverage: number | null
  merton_pd: number | null
  roa: number | null
  ebitda_margin: number | null
  implied_growth: number | null
  implied_growth_pct: string | null
}

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

      // Fetch backend valuation + SELIC in parallel
      const [backendVal, benchmarks] = await Promise.allSettled([
        investiq.get<BackendValuation>(`/valuation/${input.ticker.toUpperCase()}`),
        fetchBenchmarks(),
      ])

      const bv = backendVal.status === 'fulfilled' ? backendVal.value : null
      let selicRate = 13
      try {
        const bm = benchmarks.status === 'fulfilled' ? benchmarks.value : null
        selicRate = (bm as any)?.selic?.rate ?? 13
      } catch { /* fallback */ }

      // Local DCF calculation (for projected cash flows chart)
      const { fcf, source: fcfSource } = estimateFCF(asset)
      if (fcf <= 0 && !bv) {
        return {
          available: false as const,
          reason: 'FCF negativo ou dados insuficientes para calcular DCF',
          ticker: asset.ticker,
        }
      }

      // If local FCF is viable, compute local DCF for the chart
      let localDcf: ReturnType<typeof calculateDCF> | null = null
      if (fcf > 0) {
        const beta = (asset as any).scoreBreakdown?.metadata?.beta ?? 1.0
        const rawGrowth = asset.fundamentals.fcfGrowthRate ?? asset.fundamentals.crescimentoReceita5a ?? 3
        const growthRate = Math.max(0, rawGrowth)

        localDcf = calculateDCF({
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

        localDcf.currentPrice = asset.price
        localDcf.upside = asset.price > 0
          ? ((localDcf.intrinsicValue - asset.price) / asset.price) * 100
          : 0
        localDcf.isBelowFairValue = asset.price < localDcf.buyPrice
      }

      // If we only have backend data (no local DCF), build a compatible response
      if (!localDcf && bv) {
        return {
          available: true as const,
          intrinsicValue: bv.fair_value_dcf ?? bv.fair_value_final ?? 0,
          currentPrice: asset.price,
          upside: asset.price > 0 && bv.fair_value_final
            ? ((bv.fair_value_final - asset.price) / asset.price) * 100
            : 0,
          marginOfSafety: (bv.safety_margin ?? 0.25) * 100,
          buyPrice: (bv.fair_value_final ?? 0) * (1 - (bv.safety_margin ?? 0.25)),
          isBelowFairValue: asset.price < (bv.fair_value_final ?? 0),
          wacc: 0,
          ke: 0,
          projectedCashFlows: [],
          terminalValue: 0,
          terminalPctOfEV: 0,
          enterpriseValue: 0,
          equityValue: 0,
          confidence: 'media' as const,
          fcfSource: 'estimado' as const,
          // ─── Backend enrichment ──────────────────────────
          backend: {
            fairValueFinal: bv.fair_value_final,
            fairValueDcf: bv.fair_value_dcf,
            fairValueGordon: bv.fair_value_gordon,
            fairValueMult: bv.fair_value_mult,
            fairValueP25: bv.fair_value_p25,
            fairValueP75: bv.fair_value_p75,
            safetyMargin: bv.safety_margin,
            upsideProb: bv.upside_prob,
            lossProb: bv.loss_prob,
            dupont: bv.dupont,
            impliedGrowth: bv.implied_growth,
            impliedGrowthPct: bv.implied_growth_pct,
            mertonPd: bv.merton_pd,
            interestCoverage: bv.interest_coverage,
            roa: bv.roa,
            ebitdaMargin: bv.ebitda_margin,
          },
        }
      }

      if (!localDcf) {
        return {
          available: false as const,
          reason: 'FCF negativo ou dados insuficientes para calcular DCF',
          ticker: asset.ticker,
        }
      }

      return {
        available: true as const,
        ...localDcf,
        // ─── Backend enrichment (todos os métodos + MC + DuPont) ──
        backend: bv ? {
          fairValueFinal: bv.fair_value_final,
          fairValueDcf: bv.fair_value_dcf,
          fairValueGordon: bv.fair_value_gordon,
          fairValueMult: bv.fair_value_mult,
          fairValueP25: bv.fair_value_p25,
          fairValueP75: bv.fair_value_p75,
          safetyMargin: bv.safety_margin,
          upsideProb: bv.upside_prob,
          lossProb: bv.loss_prob,
          dupont: bv.dupont,
          impliedGrowth: bv.implied_growth,
          impliedGrowthPct: bv.implied_growth_pct,
          mertonPd: bv.merton_pd,
          interestCoverage: bv.interest_coverage,
          roa: bv.roa,
          ebitdaMargin: bv.ebitda_margin,
        } : null,
      }
    }),
})
