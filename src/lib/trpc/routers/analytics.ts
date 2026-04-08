import { z } from 'zod'
import { router, premiumProcedure } from '../trpc'
import { getAssets } from '@/lib/data-source'
import {
  calculateAttribution,
  calculateRisk,
  analyzeSelicChange,
  analyzeFxChange,
  calculateQuintile,
} from '@/lib/analytics'
import { investiq } from '@/lib/investiq-client'

export const analyticsRouter = router({
  // Performance Attribution — Brinson-Fachler (Premium)
  attribution: premiumProcedure
    .input(z.object({ portfolioId: z.string() }))
    .query(async ({ ctx, input }) => {
      const portfolio = await ctx.repos.portfolio.get(ctx.session.user.id, input.portfolioId)
      if (!portfolio) return null

      const positions = portfolio.positions.map((p: any) => ({
        ticker: p.ticker,
        sector: p.sector,
        currentValue: p.currentValue,
        gainLossPercent: p.gainLossPercent,
      }))

      const localResult = calculateAttribution(positions)

      // Enrich with backend attribution if available
      let backendAttribution = null
      try {
        backendAttribution = await investiq.get(`/analytics/portfolio/${input.portfolioId}/attribution`)
      } catch { /* fallback to local */ }

      return { ...localResult, backend: backendAttribution }
    }),

  // Risk Analytics — VaR, Beta, HHI, Factor Exposure (Premium)
  risk: premiumProcedure
    .input(z.object({ portfolioId: z.string() }))
    .query(async ({ ctx, input }) => {
      const portfolio = await ctx.repos.portfolio.get(ctx.session.user.id, input.portfolioId)
      if (!portfolio) return null

      const positions = portfolio.positions.map((p: any) => ({
        ticker: p.ticker,
        sector: p.sector,
        currentValue: p.currentValue,
        aqScore: p.aqScore,
        dividendYield: p.dividendYield,
        gainLossPercent: p.gainLossPercent,
      }))

      const localResult = calculateRisk(positions)

      // Enrich with backend risk analytics if available
      let backendRisk = null
      try {
        backendRisk = await investiq.get(`/analytics/portfolio/${input.portfolioId}/risk`)
      } catch { /* fallback to local */ }

      return { ...localResult, backend: backendRisk }
    }),

  // Scenario Analysis — SELIC e FX (Premium)
  scenario: premiumProcedure
    .input(z.object({ portfolioId: z.string() }))
    .query(async ({ ctx, input }) => {
      const portfolio = await ctx.repos.portfolio.get(ctx.session.user.id, input.portfolioId)
      if (!portfolio) return null

      const positions = portfolio.positions.map((p: any) => ({
        ticker: p.ticker,
        sector: p.sector,
        currentValue: p.currentValue,
      }))

      return {
        selicDown: analyzeSelicChange(positions, -100),
        selicUp: analyzeSelicChange(positions, 100),
        fxUp: analyzeFxChange(positions, 10),
        fxDown: analyzeFxChange(positions, -10),
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
