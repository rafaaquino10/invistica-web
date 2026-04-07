/**
 * Insights tRPC Router
 *
 * Public procedures that serve automated insights generated
 * from the current asset dataset.
 */

import { z } from 'zod'
import { router, publicProcedure } from '../trpc'
import { getAssets } from '@/lib/data-source'
import { generateInsights } from '@/lib/insights'

export const insightsRouter = router({
  list: publicProcedure
    .input(
      z.object({
        category: z.enum(['opportunity', 'risk', 'info', 'milestone', 'all']).default('all'),
        limit: z.number().min(1).max(50).default(20),
      })
    )
    .query(async ({ input }) => {
      const assets = await getAssets()
      const all = generateInsights(assets)
      const filtered =
        input.category === 'all' ? all : all.filter(i => i.category === input.category)
      return {
        insights: filtered.slice(0, input.limit),
        total: filtered.length,
      }
    }),

  forTicker: publicProcedure
    .input(z.object({ ticker: z.string() }))
    .query(async ({ input }) => {
      const assets = await getAssets()
      const all = generateInsights(assets)
      return {
        insights: all.filter(i => i.ticker === input.ticker.toUpperCase()),
      }
    }),

  summary: publicProcedure.query(async () => {
    const assets = await getAssets()
    const all = generateInsights(assets)
    return {
      total: all.length,
      byCategory: {
        opportunity: all.filter(i => i.category === 'opportunity').length,
        risk: all.filter(i => i.category === 'risk').length,
        info: all.filter(i => i.category === 'info').length,
        milestone: all.filter(i => i.category === 'milestone').length,
      },
      bySeverity: {
        high: all.filter(i => i.severity === 'high').length,
        medium: all.filter(i => i.severity === 'medium').length,
        low: all.filter(i => i.severity === 'low').length,
      },
    }
  }),
})
