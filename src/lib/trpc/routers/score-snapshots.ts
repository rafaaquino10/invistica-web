/**
 * Router tRPC para ScoreSnapshot (feedback loop).
 *
 * Apenas listagem e contagem por agora.
 * O job de gravação será implementado em 1.2.2.
 */

import { z } from 'zod'
import { router, publicProcedure, premiumProcedure } from '../trpc'
import { isDemoMode } from '@/lib/prisma'
import { analyzeSignalDecay, generateDemoDecayMetrics } from '@/lib/analytics/signal-decay'

export const scoreSnapshotsRouter = router({
  /**
   * Busca histórico de snapshots de um ticker.
   */
  getByTicker: publicProcedure
    .input(z.object({
      ticker: z.string().min(4).max(6),
      limit: z.number().min(1).max(365).default(90),
    }))
    .query(async ({ input, ctx }) => {
      if (isDemoMode) {
        return [] // Sem snapshots em demo mode
      }

      const snapshots = await ctx.prisma.scoreSnapshot.findMany({
        where: { ticker: input.ticker },
        orderBy: { snapshotDate: 'desc' },
        take: input.limit,
      })

      return snapshots.map(s => ({
        ticker: s.ticker,
        date: s.snapshotDate,
        scoreTotal: Number(s.scoreTotal),
        scoreValuation: Number(s.scoreValuation),
        scoreQuality: Number(s.scoreQuality),
        scoreRisk: Number(s.scoreRisk),
        scoreDividends: Number(s.scoreDividends),
        scoreGrowth: Number(s.scoreGrowth),
        scoreMomentum: s.scoreMomentum ? Number(s.scoreMomentum) : null,
        classificacao: s.classificacao,
        regime: s.regime,
        macroFactor: s.macroFactor ? Number(s.macroFactor) : null,
        price: s.price ? Number(s.price) : null,
      }))
    }),

  /**
   * Contagem de snapshots (para health check).
   */
  count: publicProcedure.query(async ({ ctx }) => {
    if (isDemoMode) return { total: 0, tickers: 0, oldestDate: null }

    const total = await ctx.prisma.scoreSnapshot.count()
    const distinct = await ctx.prisma.scoreSnapshot.groupBy({
      by: ['ticker'],
      _count: true,
    })

    const oldest = await ctx.prisma.scoreSnapshot.findFirst({
      orderBy: { snapshotDate: 'asc' },
      select: { snapshotDate: true },
    })

    return {
      total,
      tickers: distinct.length,
      oldestDate: oldest?.snapshotDate ?? null,
    }
  }),

  /**
   * Status completo do pipeline de snapshots:
   * última data gravada, cobertura de tickers, dias sem snapshot.
   */
  status: publicProcedure.query(async ({ ctx }) => {
    if (isDemoMode) {
      return {
        total: 0,
        tickers: 0,
        newestDate: null,
        oldestDate: null,
        diasSemSnapshot: null,
        statusOk: false,
        motivo: 'demo_mode',
      }
    }

    const [total, distinct, newest, oldest] = await Promise.all([
      ctx.prisma.scoreSnapshot.count(),
      ctx.prisma.scoreSnapshot.groupBy({ by: ['ticker'], _count: true }),
      ctx.prisma.scoreSnapshot.findFirst({
        orderBy: { snapshotDate: 'desc' },
        select: { snapshotDate: true },
      }),
      ctx.prisma.scoreSnapshot.findFirst({
        orderBy: { snapshotDate: 'asc' },
        select: { snapshotDate: true },
      }),
    ])

    const newestDate = newest?.snapshotDate ?? null
    const diasSemSnapshot = newestDate
      ? Math.floor((Date.now() - newestDate.getTime()) / (1000 * 60 * 60 * 24))
      : null

    return {
      total,
      tickers: distinct.length,
      newestDate,
      oldestDate: oldest?.snapshotDate ?? null,
      diasSemSnapshot,
      statusOk: diasSemSnapshot !== null && diasSemSnapshot <= 8,
      motivo: diasSemSnapshot === null
        ? 'sem_snapshots'
        : diasSemSnapshot > 8
          ? `ultimo_snapshot_ha_${diasSemSnapshot}_dias`
          : 'ok',
    }
  }),

  /**
   * Forward returns: retorno real após N dias vs score no momento.
   */
  forwardReturns: publicProcedure
    .input(z.object({
      snapshotDate: z.date(),
      forwardDays: z.number().min(7).max(365).default(90),
      limit: z.number().min(1).max(200).default(50),
    }))
    .query(async ({ input }) => {
      if (isDemoMode) return []
      const { calcForwardReturns } = await import('@/lib/analytics/forward-returns')
      const results = await calcForwardReturns(input.snapshotDate, input.forwardDays)
      return results.slice(0, input.limit)
    }),

  /**
   * Timeline de snapshots gravados: data + contagem de ativos.
   */
  snapshotTimeline: publicProcedure
    .input(z.object({
      limit: z.number().min(1).max(52).default(12),
    }))
    .query(async ({ input, ctx }) => {
      if (isDemoMode) return []

      const snapshots = await ctx.prisma.scoreSnapshot.groupBy({
        by: ['snapshotDate'],
        _count: { ticker: true },
        orderBy: { snapshotDate: 'desc' },
        take: input.limit,
      })

      return snapshots.map(s => ({
        date: s.snapshotDate,
        count: s._count.ticker,
        status: s._count.ticker >= 350 ? 'completo' : 'parcial',
      }))
    }),

  /**
   * Métricas do feedback loop: hit rate, IC (Spearman), retorno médio por classificação.
   */
  feedbackMetrics: publicProcedure
    .input(z.object({
      startDate: z.date(),
      endDate: z.date(),
      forwardDays: z.number().min(7).max(365).default(90),
    }))
    .query(async ({ input }) => {
      if (isDemoMode) {
        return {
          period: '',
          snapshotsAnalyzed: 0,
          forwardDays: input.forwardDays,
          hitRate: { excepcional: null, saudavel: null, atencao: null, critico: null, overall: null },
          ic: { value: null, pValue: null, isSignificant: false },
          avgReturn: { excepcional: null, saudavel: null, atencao: null, critico: null },
          quintileSpread: { q1AvgReturn: null, q5AvgReturn: null, spreadPositive: false },
        }
      }
      const { calcFeedbackMetrics } = await import('@/lib/analytics/forward-returns')
      return calcFeedbackMetrics(input.startDate, input.endDate, input.forwardDays)
    }),

  /**
   * Signal Decay: analisa eficácia preditiva de cada pilar.
   */
  signalDecay: premiumProcedure.query(async ({ ctx }) => {
    if (ctx.isDemoMode) {
      return generateDemoDecayMetrics()
    }

    // Buscar snapshots dos últimos 6 meses
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const [snapshots, forwardData] = await Promise.all([
      ctx.prisma.scoreSnapshot.findMany({
        where: { snapshotDate: { gte: sixMonthsAgo } },
        orderBy: { snapshotDate: 'asc' },
        select: {
          ticker: true,
          snapshotDate: true,
          scoreTotal: true,
          scoreValuation: true,
          scoreQuality: true,
          scoreRisk: true,
          scoreDividends: true,
          scoreGrowth: true,
          scoreMomentum: true,
          price: true,
        },
      }),
      // Forward returns: buscar preços atuais vs preços no snapshot
      ctx.prisma.scoreSnapshot.findMany({
        where: {
          snapshotDate: {
            gte: sixMonthsAgo,
            lte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Pelo menos 30 dias atrás
          },
        },
        orderBy: { snapshotDate: 'asc' },
        select: { ticker: true, snapshotDate: true, price: true },
      }),
    ])

    if (snapshots.length < 12) {
      return generateDemoDecayMetrics()
    }

    // Mapear snapshots
    const snapshotEntries = snapshots.map(s => ({
      ticker: s.ticker,
      date: s.snapshotDate,
      scoreTotal: Number(s.scoreTotal),
      scoreValuation: Number(s.scoreValuation),
      scoreQuality: Number(s.scoreQuality),
      scoreRisk: Number(s.scoreRisk),
      scoreDividends: Number(s.scoreDividends),
      scoreGrowth: Number(s.scoreGrowth),
      scoreMomentum: s.scoreMomentum ? Number(s.scoreMomentum) : null,
      price: s.price ? Number(s.price) : null,
    }))

    // Calcular forward returns simplificado (preço mais recente / preço no snapshot)
    const latestPrices = new Map<string, number>()
    for (const s of snapshots) {
      if (s.price) latestPrices.set(s.ticker, Number(s.price))
    }

    const forwardReturns = forwardData
      .filter(s => s.price && latestPrices.has(s.ticker))
      .map(s => ({
        ticker: s.ticker,
        snapshotDate: s.snapshotDate,
        forwardReturn: (latestPrices.get(s.ticker)! - Number(s.price)) / Number(s.price),
      }))

    return analyzeSignalDecay(snapshotEntries, forwardReturns)
  }),
})
