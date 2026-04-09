import { z } from 'zod'
import { router, premiumProcedure } from '../trpc'
import { getAssets } from '@/lib/data-source'
import { calculateQuintile } from '@/lib/analytics'
import { investiq } from '@/lib/investiq-client'

export const analyticsRouter = router({
  // Performance Attribution — Brinson-Fachler (Premium, backend-only)
  attribution: premiumProcedure
    .input(z.object({ portfolioId: z.string() }))
    .query(async ({ ctx, input }) => {
      const portfolio = await ctx.repos.portfolio.get(ctx.session.user.id, input.portfolioId)
      if (!portfolio) return null

      try {
        return await investiq.get(`/analytics/portfolio/${input.portfolioId}/attribution`)
      } catch {
        // Backend unavailable — return empty defaults
        return {
          totalReturn: 0,
          benchmarkReturn: 0,
          activeReturn: 0,
          sectorAttribution: [],
          selectionEffect: 0,
          allocationEffect: 0,
          interactionEffect: 0,
        }
      }
    }),

  // Risk Analytics — VaR, Beta, HHI, Factor Exposure (Premium, backend-only)
  risk: premiumProcedure
    .input(z.object({ portfolioId: z.string() }))
    .query(async ({ ctx, input }) => {
      const portfolio = await ctx.repos.portfolio.get(ctx.session.user.id, input.portfolioId)
      if (!portfolio) return null

      try {
        return await investiq.get(`/analytics/portfolio/${input.portfolioId}/risk`)
      } catch {
        // Backend unavailable — return empty defaults
        return {
          var95: 0,
          var99: 0,
          cvar95: 0,
          betaPortfolio: 1,
          hhi: 0,
          factorExposure: [],
          sharpeRatio: 0,
          maxDrawdown: 0,
        }
      }
    }),

  // Scenario Analysis — SELIC e FX (Premium, backend-only)
  scenario: premiumProcedure
    .input(z.object({ portfolioId: z.string() }))
    .query(async ({ ctx, input }) => {
      const portfolio = await ctx.repos.portfolio.get(ctx.session.user.id, input.portfolioId)
      if (!portfolio) return null

      try {
        return await investiq.get(`/analytics/portfolio/${input.portfolioId}/scenario`)
      } catch {
        // Backend unavailable — return empty defaults
        return {
          selicDown: { impact: 0, sectors: [] },
          selicUp: { impact: 0, sectors: [] },
          fxUp: { impact: 0, sectors: [] },
          fxDown: { impact: 0, sectors: [] },
        }
      }
    }),

  // Portfolio Quintile — Pro+
  quintile: premiumProcedure
    .input(z.object({ portfolioId: z.string() }))
    .query(async ({ ctx, input }) => {
      const portfolio = await ctx.repos.portfolio.get(ctx.session.user.id, input.portfolioId)
      if (!portfolio) return null

      const positions = portfolio.positions.map((p: any) => ({
        ticker: p.ticker,
        currentValue: p.currentValue,
        aqScore: p.aqScore,
      }))

      const allAssets = await getAssets()
      const marketAssets = allAssets.map(a => ({
        ticker: a.ticker,
        scoreTotal: a.aqScore?.scoreTotal ?? null,
      }))

      return calculateQuintile(positions, marketAssets)
    }),
})
