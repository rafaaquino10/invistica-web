// ─── Valuation Router ────────────────────────────────────────
// DCF local + dados ricos do backend (Gordon, Multiples, Monte Carlo).
// Onda 1: Enriquecido com /valuation/{ticker} do backend.

import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { router, publicProcedure } from '../trpc'
import { getAssets } from '@/lib/data-source'
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

      // Fetch backend valuation (DCF, Gordon, Multiples, Monte Carlo all come from backend)
      let bv: BackendValuation | null = null
      try {
        bv = await investiq.get<BackendValuation>(`/valuation/${input.ticker.toUpperCase()}`)
      } catch { /* backend unavailable */ }

      if (!bv) {
        return {
          available: false as const,
          reason: 'Dados de valuation indisponíveis no backend',
          ticker: asset.ticker,
        }
      }

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
        fcfSource: 'backend' as const,
        // ─── Backend valuation data (all methods + MC + DuPont) ──
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
    }),
})
