/**
 * News tRPC Router
 *
 * Noticias e RI (fatos relevantes CVM) por ticker.
 * Migrado para chamadas diretas ao Invscore backend.
 */

import { z } from 'zod'
import { router, publicProcedure } from '../trpc'
import { investiq } from '@/lib/investiq-client'
import type { GatewayNewsItem, CvmRiEvent } from '@/lib/gateway-client'

export const newsRouter = router({
  /** Noticias filtradas por ticker via backend */
  forTicker: publicProcedure
    .input(z.object({
      ticker: z.string().min(1),
      companyName: z.string().default(''),
      limit: z.number().min(1).max(20).default(8),
    }))
    .query(async ({ input }): Promise<GatewayNewsItem[]> => {
      try {
        const res = await investiq.get<{
          news: Array<{
            title: string; date: string; source: string; url: string;
            summary?: string; sentiment?: string; sentiment_score?: number;
            tickers?: string[];
          }>
        }>(`/news/${encodeURIComponent(input.ticker)}`, {
          params: { limit: input.limit },
          timeout: 8000,
        })

        return (res.news ?? []).map((n, i) => ({
          id: `news-${input.ticker}-${i}`,
          title: n.title,
          summary: n.summary ?? '',
          source: n.source || 'Invística',
          sourceColor: '#606878',
          link: n.url || '#',
          tickers: n.tickers ?? [input.ticker],
          date: n.date,
          category: 'news',
          sentiment: n.sentiment ?? 'neutral',
          sentimentScore: n.sentiment_score,
        }))
      } catch {
        return []
      }
    }),

  /** Eventos RI CVM filtrados por ticker — direto do backend */
  riForTicker: publicProcedure
    .input(z.object({
      ticker: z.string().min(1),
      limit: z.number().min(1).max(20).default(5),
    }))
    .query(async ({ input }): Promise<CvmRiEvent[]> => {
      try {
        const res = await investiq.get<{
          items?: Array<{ title: string; date: string; url: string; type: string; summary?: string }>
        }>(`/news/${encodeURIComponent(input.ticker)}/investor-relations`, {
          params: { limit: input.limit },
          timeout: 8000,
        })

        return (res.items ?? []).map((item, i) => ({
          id: `ri-${input.ticker}-${i}`,
          companyName: input.ticker,
          cnpj: '',
          ticker: input.ticker,
          type: 'fato_relevante' as const,
          title: item.title,
          date: item.date,
          documentUrl: item.url,
          summary: item.summary ?? null,
        }))
      } catch {
        return []
      }
    }),
})
