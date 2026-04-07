/**
 * Radar tRPC Router
 *
 * Handles alerts, insights, portfolio health analysis, and weekly reports.
 * Feed unificado com notícias reais, RI CVM, exit alerts e insights do motor.
 */

import { z } from 'zod'
import { router, protectedProcedure } from '../trpc'
import { fetchNews, fetchRiEvents } from '@/lib/gateway-client'
import type { GatewayNewsItem, CvmRiEvent } from '@/lib/gateway-client'
import { getAssets } from '@/lib/data-source'
import { generateExitAlerts } from '@/lib/smart-portfolios/exit-alerts'
import type { UserPosition } from '@/lib/smart-portfolios/types'
import { isDemoMode, DEMO_PORTFOLIOS } from '@/lib/demo-data'

const alertTypeSchema = z.enum(['price_above', 'price_below', 'score_change', 'dividend'])

// ─── Tipos do feed unificado ────────────────────────────────

export interface RadarFeedItem {
  id: string
  type: 'news' | 'ri_event' | 'exit_alert' | 'insight' | 'alert' | 'focus'
  title: string
  message: string
  tickers: string[]
  date: Date
  isRead: boolean
  // News-specific
  source?: string
  link?: string
  sentiment?: string
  category?: string
  // RI-specific
  documentUrl?: string | null
  riType?: string
  // Exit alert-specific
  severity?: 'critical' | 'warning' | 'info'
  exitType?: string
  // Insight-specific
  insightType?: string
}

// ─── Helpers ─────────────────────────────────────────────────

function newsToFeedItem(n: GatewayNewsItem): RadarFeedItem {
  return {
    id: `news-${n.id}`,
    type: 'news',
    title: n.title,
    message: n.summary || '',
    tickers: n.tickers,
    date: new Date(n.date),
    isRead: true,
    source: n.source,
    link: n.link,
    sentiment: n.sentiment,
    category: n.category,
  }
}

function riToFeedItem(ri: CvmRiEvent): RadarFeedItem {
  const typeLabel: Record<string, string> = {
    fato_relevante: 'Fato Relevante',
    comunicado_mercado: 'Comunicado ao Mercado',
    aviso_acionistas: 'Aviso aos Acionistas',
    assembleia: 'Assembleia',
    resultado_trimestral: 'Resultado Trimestral',
  }
  return {
    id: `ri-${ri.id}`,
    type: 'ri_event',
    title: `${typeLabel[ri.type] ?? ri.type}: ${ri.companyName}`,
    message: ri.summary ?? `${ri.companyName} publicou ${typeLabel[ri.type] ?? ri.type}`,
    tickers: ri.ticker ? [ri.ticker] : [],
    date: new Date(ri.date),
    isRead: true,
    documentUrl: ri.documentUrl,
    riType: ri.type,
  }
}

async function getUserPositions(userId: string, prisma: any): Promise<UserPosition[]> {
  if (isDemoMode()) {
    const demo = DEMO_PORTFOLIOS[0]
    return (demo?.positions ?? []).map(p => ({ ticker: p.ticker, quantity: p.quantity }))
  }
  try {
    const portfolios = await prisma.portfolio.findMany({
      where: { userId },
      include: { positions: { where: { quantity: { gt: 0 } }, select: { asset: { select: { ticker: true } }, quantity: true } } },
    })
    return portfolios.flatMap((p: any) =>
      p.positions.map((pos: any) => ({ ticker: pos.asset.ticker, quantity: Number(pos.quantity) }))
    )
  } catch {
    return []
  }
}

export const radarRouter = router({
  alerts: protectedProcedure.query(async ({ ctx }) => {
    return ctx.repos.radar.getAlerts(ctx.session.user.id)
  }),

  createAlert: protectedProcedure
    .input(z.object({
      assetId: z.string(),
      type: alertTypeSchema,
      threshold: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.repos.radar.createAlert(ctx.session.user.id, input)
    }),

  updateAlert: protectedProcedure
    .input(z.object({
      id: z.string(),
      type: alertTypeSchema.optional(),
      threshold: z.number().optional(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.repos.radar.updateAlert(ctx.session.user.id, input)
    }),

  deleteAlert: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.repos.radar.deleteAlert(ctx.session.user.id, input.id)
    }),

  triggerAlert: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.repos.radar.triggerAlert(ctx.session.user.id, input.id)
    }),

  insights: protectedProcedure
    .input(z.object({
      type: z.enum(['valuation', 'quality', 'risk', 'opportunity', 'warning', 'all']).default('all'),
      unreadOnly: z.boolean().default(false),
      limit: z.number().min(1).max(50).default(20),
    }))
    .query(async ({ ctx, input }) => {
      return ctx.repos.radar.getInsights(ctx.session.user.id, input)
    }),

  markInsightRead: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.repos.radar.markInsightRead(ctx.session.user.id, input.id)
    }),

  markAllInsightsRead: protectedProcedure.mutation(async ({ ctx }) => {
    return ctx.repos.radar.markAllInsightsRead(ctx.session.user.id)
  }),

  portfolioHealth: protectedProcedure.query(async ({ ctx }) => {
    return ctx.repos.radar.getPortfolioHealth(ctx.session.user.id)
  }),

  latestReport: protectedProcedure.query(async ({ ctx }) => {
    return ctx.repos.radar.getLatestReport(ctx.session.user.id)
  }),

  reportHistory: protectedProcedure
    .input(z.object({ limit: z.number().min(1).max(52).default(12) }))
    .query(async ({ ctx, input }) => {
      return ctx.repos.radar.getReportHistory(ctx.session.user.id, input.limit)
    }),

  generateReport: protectedProcedure.mutation(async ({ ctx }) => {
    return ctx.repos.radar.generateReport(ctx.session.user.id)
  }),

  // Live news from gateway RSS feeds only — no mock data
  newsFeed: protectedProcedure
    .input(z.object({
      limit: z.number().min(1).max(30).default(15),
      category: z.enum(['all', 'resultados', 'dividendos', 'macro', 'corporativo', 'mercado']).default('all'),
    }))
    .query(async ({ input }) => {
      try {
        const liveNews = await fetchNews(input.category, input.limit)
        return liveNews.map(n => ({
          id: n.id, title: n.title, summary: n.summary, source: n.source,
          tickers: n.tickers, date: new Date(n.date),
          category: n.category as 'resultados' | 'dividendos' | 'macro' | 'corporativo' | 'mercado',
          link: n.link, sentiment: n.sentiment as 'positive' | 'negative' | 'neutral',
        }))
      } catch {
        return []
      }
    }),

  // Feed unificado: notícias reais + RI CVM + exit alerts + insights do motor
  feed: protectedProcedure
    .input(z.object({ limit: z.number().min(1).max(50).default(30) }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id
      const feedItems: RadarFeedItem[] = []

      // Buscar tudo em paralelo
      const [newsResult, riResult, repoFeed, allAssets, userPositions] = await Promise.all([
        fetchNews(undefined, 30).catch(() => [] as GatewayNewsItem[]),
        fetchRiEvents().catch(() => [] as CvmRiEvent[]),
        ctx.repos.radar.getFeed(userId, 20),
        getAssets().catch(() => []),
        getUserPositions(userId, (ctx as any).prisma),
      ])

      // 1. Notícias reais do gateway
      for (const n of newsResult) {
        feedItems.push(newsToFeedItem(n))
      }

      // 2. RI Events (fatos relevantes CVM, últimos 7 dias)
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      for (const ri of riResult) {
        if (new Date(ri.date) >= sevenDaysAgo) {
          feedItems.push(riToFeedItem(ri))
        }
      }

      // 3. Exit alerts (das carteiras do usuário)
      if (userPositions.length > 0 && allAssets.length > 0) {
        try {
          const exitAlerts = generateExitAlerts(userPositions, allAssets)
          for (const alert of exitAlerts) {
            feedItems.push({
              id: `exit-${alert.ticker}-${alert.type}`,
              type: 'exit_alert',
              title: alert.title,
              message: alert.description,
              tickers: [alert.ticker],
              date: new Date(),
              isRead: false,
              severity: alert.severity as 'critical' | 'warning' | 'info',
              exitType: alert.type,
            })
          }
        } catch { /* exit alerts são opcionais */ }
      }

      // 4. Insights e alertas do repositório (motor de insights)
      for (const item of (repoFeed as any[])) {
        // Evitar duplicatas — repo feed não tem news/ri/exit
        feedItems.push({
          id: item.id,
          type: item.type ?? 'insight',
          title: item.title,
          message: item.message ?? '',
          tickers: item.ticker ? [item.ticker] : [],
          date: new Date(item.date),
          isRead: item.isRead ?? false,
          insightType: item.insightType,
          category: item.category,
        })
      }

      // Ordenar por data desc e limitar
      feedItems.sort((a, b) => b.date.getTime() - a.date.getTime())
      return feedItems.slice(0, input.limit)
    }),
})
