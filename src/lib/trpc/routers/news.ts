/**
 * News tRPC Router
 *
 * Notícias e RI (fatos relevantes CVM) por ticker.
 */

import { z } from 'zod'
import { router, publicProcedure } from '../trpc'
import { fetchNews, fetchRiEvents } from '@/lib/gateway-client'
import type { GatewayNewsItem, CvmRiEvent } from '@/lib/gateway-client'

export const newsRouter = router({
  /** Notícias filtradas por ticker via gateway */
  forTicker: publicProcedure
    .input(z.object({
      ticker: z.string().min(1),
      companyName: z.string().default(''),
      limit: z.number().min(1).max(20).default(8),
    }))
    .query(async ({ input }): Promise<GatewayNewsItem[]> => {
      try {
        // Gateway agora aceita ?ticker= para filtro inteligente
        const params = new URLSearchParams()
        params.set('ticker', input.ticker)
        if (input.companyName) params.set('companyName', input.companyName)
        params.set('limit', String(input.limit))

        const GATEWAY_URL = process.env['GATEWAY_URL'] ?? 'http://localhost:4000'
        const res = await fetch(`${GATEWAY_URL}/v1/news?${params.toString()}`, {
          cache: 'no-store',
          signal: AbortSignal.timeout(5000),
        })
        if (!res.ok) return []
        const json = await res.json() as { data: GatewayNewsItem[] }
        return json.data ?? []
      } catch {
        return []
      }
    }),

  /** Eventos RI CVM filtrados por ticker */
  riForTicker: publicProcedure
    .input(z.object({
      ticker: z.string().min(1),
      limit: z.number().min(1).max(20).default(5),
    }))
    .query(async ({ input }): Promise<CvmRiEvent[]> => {
      try {
        const events = await fetchRiEvents(input.ticker)
        return events.slice(0, input.limit)
      } catch {
        return []
      }
    }),
})
