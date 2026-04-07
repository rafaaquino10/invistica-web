import { z } from 'zod'
import { router, publicProcedure } from '../trpc'
import {
  getScoreHistory,
  getScoreAlerts,
  getScoreMovers,
  getSnapshotCount,
  listAvailableDates,
} from '@/lib/score-history'
import { generateFeedbackReport } from '@/lib/scoring/feedback-loop'
import { getAssets } from '@/lib/data-source'

export const scoreHistoryRouter = router({
  // Get score evolution for a specific ticker
  history: publicProcedure
    .input(z.object({
      ticker: z.string(),
      days: z.number().min(1).max(365).default(90),
    }))
    .query(({ input }) => {
      const history = getScoreHistory(input.ticker.toUpperCase(), input.days)
      return {
        ticker: input.ticker.toUpperCase(),
        history,
        hasHistory: history.length > 0,
      }
    }),

  // Get score change alerts (significant moves >= 5 pts)
  alerts: publicProcedure
    .input(z.object({
      days: z.number().min(1).max(90).default(30),
    }))
    .query(({ input }) => {
      const alerts = getScoreAlerts(input.days)
      return {
        alerts,
        count: alerts.length,
      }
    }),

  // Get biggest score gainers/losers over N days
  movers: publicProcedure
    .input(z.object({
      days: z.number().min(1).max(90).default(7),
    }))
    .query(({ input }) => {
      const result = getScoreMovers(input.days)
      return {
        ...result,
        hasHistory: result.gainers.length > 0 || result.losers.length > 0,
      }
    }),

  // Get metadata about available history
  meta: publicProcedure.query(() => {
    const dates = listAvailableDates()
    return {
      snapshotCount: getSnapshotCount(),
      firstDate: dates[0] ?? null,
      lastDate: dates.length > 0 ? dates[dates.length - 1]! : null,
      dates,
    }
  }),

  // Feedback loop: score vs retorno real (Item 37)
  feedbackLoop: publicProcedure
    .input(z.object({
      horizonMonths: z.number().min(1).max(12).default(3),
    }))
    .query(async ({ input }) => {
      const assets = await getAssets()
      const report = generateFeedbackReport(assets, input.horizonMonths)
      return report
    }),
})
