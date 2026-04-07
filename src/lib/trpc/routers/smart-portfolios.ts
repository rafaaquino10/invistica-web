// ─── Smart Portfolios tRPC Router ────────────────────────────
// Exposes smart portfolio data: list, detail, income simulation, exit alerts.

import { z } from 'zod'
import { router, publicProcedure, protectedProcedure } from '../trpc'
import { getAssets } from '@/lib/data-source'
import { getAllSmartPortfolios, filterAndRankPortfolio, getClosestToQualifying } from '@/lib/smart-portfolios/engine'
import { SMART_PORTFOLIOS } from '@/lib/smart-portfolios/portfolios'
import { generateExitAlerts } from '@/lib/smart-portfolios/exit-alerts'
import { simulateIncome } from '@/lib/smart-portfolios/income-simulator'
import { fetchBenchmarks } from '@/lib/gateway-client'
import { getRegimeCalibration } from '@/lib/smart-portfolios/regime-calibration'
import { getCurrentRegime } from '@/lib/pipeline/analyzers'
import type { MacroRegime } from '@/lib/scoring/regime-detector'
import { detectRegime, REGIME_DISPLAY } from '@/lib/scoring/regime-detector'

function resolveRegime(): MacroRegime {
  const cached = getCurrentRegime()
  if (cached) return cached.regime
  // Fallback: SELIC nominal atual (~14.25%) → risk_off
  return detectRegime(14.25).regime
}

export const smartPortfoliosRouter = router({
  list: publicProcedure.query(async () => {
    const assets = await getAssets()
    const regime = resolveRegime()
    const results = getAllSmartPortfolios(assets, regime)
    return results.map(r => ({
      id: r.portfolio.id, name: r.portfolio.name, description: r.portfolio.description,
      icon: r.portfolio.icon, stockCount: r.stocks.length, maxStocks: r.portfolio.maxStocks,
      topStocks: r.stocks.slice(0, 3).map(s => ({ ticker: s.ticker, name: s.name, score: s.score, lensScore: s.lensScore })),
      criteria: r.portfolio.criteria, generatedAt: r.generatedAt,
    }))
  }),

  detail: publicProcedure
    .input(z.object({ portfolioId: z.string() }))
    .query(async ({ input }) => {
      const portfolio = SMART_PORTFOLIOS.find(p => p.id === input.portfolioId)
      if (!portfolio) return null
      const assets = await getAssets()
      const regime = resolveRegime()
      const stocks = filterAndRankPortfolio(portfolio, assets, regime)
      const closest = stocks.length < 3
        ? getClosestToQualifying(portfolio, assets, 2)
        : []
      const calibration = getRegimeCalibration(portfolio.id, regime)
      const regimeDisplay = REGIME_DISPLAY[regime]
      return {
        id: portfolio.id, name: portfolio.name, description: portfolio.description,
        icon: portfolio.icon, criteria: portfolio.criteria, exitCriteria: portfolio.exitCriteria,
        sortBy: portfolio.sortBy, sortDirection: portfolio.sortDirection,
        maxStocks: portfolio.maxStocks, stocks, closest, generatedAt: new Date(),
        regime: {
          current: regime,
          label: regimeDisplay.label,
          emoji: regimeDisplay.emoji,
          color: regimeDisplay.color,
          calibrationActive: calibration != null,
          rationale: calibration?.rationale ?? null,
        },
      }
    }),

  simulate: publicProcedure
    .input(z.object({ amount: z.number().min(1000).max(100_000_000).optional().default(100_000) }))
    .query(async ({ input }) => {
      const portfolio = SMART_PORTFOLIOS.find(p => p.id === 'passive-income')
      if (!portfolio) return null
      const assets = await getAssets()
      const stocks = filterAndRankPortfolio(portfolio, assets)
      let selicRate = 13.15
      try {
        const benchmarks = await fetchBenchmarks()
        if (benchmarks?.selic?.rate) selicRate = benchmarks.selic.rate
      } catch { /* fallback */ }
      return simulateIncome(stocks, input.amount, selicRate)
    }),

  exitAlerts: protectedProcedure.query(async ({ ctx }) => {
    const assets = await getAssets()
    const positions = await ctx.repos.portfolio.getPositionTickers(ctx.session.user.id)
    return generateExitAlerts(positions, assets)
  }),
})
