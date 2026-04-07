// ─── Community Router ─────────────────────────────────────────
// Comentários, teses e votos por ativo.

import { z } from 'zod'
import { router, publicProcedure, protectedProcedure } from '../trpc'
import { isDemoMode, prisma } from '@/lib/prisma'

// Prisma client pode não ter os modelos Comment/Vote gerados ainda
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = prisma as any

// ─── Demo Data ────────────────────────────────────────────────

const DEMO_COMMENTS = [
  {
    id: 'demo-1',
    userId: 'demo',
    userName: 'Rafael Demo',
    ticker: 'WEGE3',
    content: 'WEGE3 segue como referência em qualidade operacional. Margens consistentes, ROIC acima de 25% e crescimento de receita sólido. Valuation esticado mas justificado pela previsibilidade.',
    type: 'thesis' as const,
    sentiment: 'bull' as const,
    upvotes: 12,
    hasVoted: false,
    createdAt: new Date('2026-02-28'),
  },
  {
    id: 'demo-2',
    userId: 'demo-2',
    userName: 'Ana Investidora',
    ticker: 'ITSA4',
    content: 'Holding de Itaú com desconto histórico. P/VP abaixo de 1.5x, DY acima de 7%. Boa opção para renda passiva com exposição ao setor financeiro.',
    type: 'analysis' as const,
    sentiment: 'bull' as const,
    upvotes: 8,
    hasVoted: false,
    createdAt: new Date('2026-02-25'),
  },
  {
    id: 'demo-3',
    userId: 'demo-3',
    userName: 'Pedro Trader',
    ticker: 'PRIO3',
    content: 'Preço do petróleo pode cair com desaceleração global. PRIO3 muito dependente de commodity sem hedge natural. Cuidado com alavancagem operacional.',
    type: 'thesis' as const,
    sentiment: 'bear' as const,
    upvotes: 5,
    hasVoted: false,
    createdAt: new Date('2026-02-20'),
  },
  {
    id: 'demo-4',
    userId: 'demo',
    userName: 'Rafael Demo',
    ticker: 'EQTL3',
    content: 'Setor elétrico defensivo com previsibilidade de receita. Equatorial tem histórico de aquisições bem executadas e ganhos de eficiência.',
    type: 'analysis' as const,
    sentiment: 'bull' as const,
    upvotes: 6,
    hasVoted: false,
    createdAt: new Date('2026-02-18'),
  },
]

// ─── Prohibited Words ─────────────────────────────────────────

const PROHIBITED_WORDS = [
  'spam', 'scam', 'golpe', 'pirâmide', 'esquema',
]

function containsProhibited(text: string): boolean {
  const lower = text.toLowerCase()
  return PROHIBITED_WORDS.some(w => lower.includes(w))
}

// ─── Router ───────────────────────────────────────────────────

export const communityRouter = router({
  /** Lista comentários de um ativo */
  listByTicker: publicProcedure
    .input(z.object({
      ticker: z.string(),
      sort: z.enum(['recent', 'top']).default('recent'),
      sentiment: z.enum(['all', 'bull', 'bear']).default('all'),
      limit: z.number().min(1).max(50).default(20),
    }))
    .query(async ({ input }) => {
      if (isDemoMode) {
        let comments = DEMO_COMMENTS.filter(c => c.ticker === input.ticker)
        if (input.sentiment !== 'all') {
          comments = comments.filter(c => c.sentiment === input.sentiment)
        }
        if (input.sort === 'top') {
          comments.sort((a, b) => b.upvotes - a.upvotes)
        } else {
          comments.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        }
        return comments.slice(0, input.limit)
      }

      const where: Record<string, unknown> = { ticker: input.ticker }
      if (input.sentiment !== 'all') where['sentiment'] = input.sentiment

      const comments = await db.comment.findMany({
        where,
        orderBy: input.sort === 'top' ? { upvotes: 'desc' } : { createdAt: 'desc' },
        take: input.limit,
        include: { user: { select: { id: true, name: true, image: true } } },
      })

      return (comments as any[]).map((c: any) => ({
        id: c.id,
        userId: c.userId,
        userName: c.user.name ?? 'Anônimo',
        ticker: c.ticker,
        content: c.content,
        type: c.type,
        sentiment: c.sentiment,
        upvotes: c.upvotes,
        hasVoted: false,
        createdAt: c.createdAt,
      }))
    }),

  /** Cria um comentário (Pro+) */
  create: protectedProcedure
    .input(z.object({
      ticker: z.string().min(4).max(6),
      content: z.string().min(10).max(500),
      type: z.enum(['thesis', 'analysis', 'question']),
      sentiment: z.enum(['bull', 'bear']).nullable(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (isDemoMode) {
        return {
          id: `demo-${Date.now()}`,
          userId: 'demo',
          userName: 'Rafael Demo',
          ticker: input.ticker,
          content: input.content,
          type: input.type,
          sentiment: input.sentiment,
          upvotes: 0,
          hasVoted: false,
          createdAt: new Date(),
        }
      }

      const userId = ctx.session.user.id

      if (containsProhibited(input.content)) {
        throw new Error('Conteúdo contém termos proibidos.')
      }

      // Rate limit: max 5 comentários/dia
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const count = await db.comment.count({
        where: { userId, createdAt: { gte: today } },
      })
      if (count >= 5) {
        throw new Error('Limite de 5 comentários por dia atingido.')
      }

      const comment = await db.comment.create({
        data: {
          userId,
          ticker: input.ticker,
          content: input.content,
          type: input.type,
          sentiment: input.sentiment,
        },
        include: { user: { select: { id: true, name: true } } },
      })

      return {
        id: comment.id,
        userId: comment.userId,
        userName: comment.user.name ?? 'Anônimo',
        ticker: comment.ticker,
        content: comment.content,
        type: comment.type,
        sentiment: comment.sentiment,
        upvotes: 0,
        hasVoted: false,
        createdAt: comment.createdAt,
      }
    }),

  /** Vota em um comentário */
  vote: protectedProcedure
    .input(z.object({ commentId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (isDemoMode) return { success: true, action: 'added' as const }

      const userId = ctx.session.user.id

      // Verifica se já votou
      const existing = await db.vote.findUnique({
        where: { userId_commentId: { userId, commentId: input.commentId } },
      })

      if (existing) {
        await db.vote.delete({ where: { id: existing.id } })
        await db.comment.update({
          where: { id: input.commentId },
          data: { upvotes: { decrement: 1 } },
        })
        return { success: true, action: 'removed' as const }
      }

      await db.vote.create({
        data: { userId, commentId: input.commentId },
      })
      await db.comment.update({
        where: { id: input.commentId },
        data: { upvotes: { increment: 1 } },
      })
      return { success: true, action: 'added' as const }
    }),

  /** Top contribuidores */
  topContributors: publicProcedure
    .query(async () => {
      if (isDemoMode) {
        return [
          { userId: 'demo', name: 'Rafael Demo', totalUpvotes: 18, commentCount: 2 },
          { userId: 'demo-2', name: 'Ana Investidora', totalUpvotes: 8, commentCount: 1 },
          { userId: 'demo-3', name: 'Pedro Trader', totalUpvotes: 5, commentCount: 1 },
        ]
      }

      const contributors = await db.comment.groupBy({
        by: ['userId'],
        _sum: { upvotes: true },
        _count: { id: true },
        orderBy: { _sum: { upvotes: 'desc' } },
        take: 10,
      })

      const userIds = (contributors as any[]).map((c: any) => c.userId)
      const users = await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, name: true },
      })
      const userMap = new Map(users.map(u => [u.id, u.name ?? 'Anônimo']))

      return (contributors as any[]).map((c: any) => ({
        userId: c.userId,
        name: userMap.get(c.userId) ?? 'Anônimo',
        totalUpvotes: c._sum.upvotes ?? 0,
        commentCount: c._count.id,
      }))
    }),
})
