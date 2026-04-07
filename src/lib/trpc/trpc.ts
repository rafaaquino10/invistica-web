import { initTRPC, TRPCError } from '@trpc/server'
import * as Sentry from '@sentry/nextjs'
import superjson from 'superjson'
import type { Context } from './context'
import { rateLimiter, RATE_LIMITS } from '@/lib/middleware/rate-limiter'

const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    // Report internal server errors to Sentry
    if (error.code === 'INTERNAL_SERVER_ERROR') {
      Sentry.captureException(error.cause ?? error)
    }
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof Error ? error.cause.message : null,
      },
    }
  },
})

export const router = t.router
export const createCallerFactory = t.createCallerFactory

// ─── Rate Limiting Middleware ────────────────────────────────

/** Rate limit para endpoints públicos: 60 req/min por IP */
const publicRateLimit = t.middleware(({ ctx, next }) => {
  const key = `pub:${ctx.clientIp}`
  const result = rateLimiter.check(key, RATE_LIMITS.public)

  if (!result.allowed) {
    console.warn(`[rate-limit] Público bloqueado: IP=${ctx.clientIp} (retry em ${result.retryAfterSeconds}s)`)
    Sentry.addBreadcrumb({
      category: 'rate-limit',
      message: `Public rate limit hit: ${ctx.clientIp}`,
      level: 'warning',
    })
    throw new TRPCError({
      code: 'TOO_MANY_REQUESTS',
      message: `Limite de requisições excedido. Tente novamente em ${result.retryAfterSeconds} segundos.`,
    })
  }

  return next()
})

/** Rate limit para endpoints protegidos: 120 req/min por userId */
const protectedRateLimit = t.middleware(({ ctx, next }) => {
  const userId = ctx.session?.user?.id
  if (!userId) return next() // auth middleware tratará

  const key = `auth:${userId}`
  const result = rateLimiter.check(key, RATE_LIMITS.protected)

  if (!result.allowed) {
    console.warn(`[rate-limit] Protegido bloqueado: userId=${userId} (retry em ${result.retryAfterSeconds}s)`)
    Sentry.addBreadcrumb({
      category: 'rate-limit',
      message: `Protected rate limit hit: ${userId}`,
      level: 'warning',
    })
    throw new TRPCError({
      code: 'TOO_MANY_REQUESTS',
      message: `Limite de requisições excedido. Tente novamente em ${result.retryAfterSeconds} segundos.`,
    })
  }

  return next()
})

/** Rate limit para mutations: 20 req/min por userId */
const mutationRateLimit = t.middleware(({ ctx, next }) => {
  const userId = ctx.session?.user?.id
  if (!userId) return next()

  const key = `mut:${userId}`
  const result = rateLimiter.check(key, RATE_LIMITS.mutation)

  if (!result.allowed) {
    console.warn(`[rate-limit] Mutation bloqueada: userId=${userId} (retry em ${result.retryAfterSeconds}s)`)
    Sentry.addBreadcrumb({
      category: 'rate-limit',
      message: `Mutation rate limit hit: ${userId}`,
      level: 'warning',
    })
    throw new TRPCError({
      code: 'TOO_MANY_REQUESTS',
      message: `Limite de requisições excedido. Tente novamente em ${result.retryAfterSeconds} segundos.`,
    })
  }

  return next()
})

/** Rate limit para premium: 180 req/min por userId */
const premiumRateLimit = t.middleware(({ ctx, next }) => {
  const userId = ctx.session?.user?.id
  if (!userId) return next()

  const key = `prem:${userId}`
  const result = rateLimiter.check(key, RATE_LIMITS.premium)

  if (!result.allowed) {
    console.warn(`[rate-limit] Premium bloqueado: userId=${userId} (retry em ${result.retryAfterSeconds}s)`)
    throw new TRPCError({
      code: 'TOO_MANY_REQUESTS',
      message: `Limite de requisições excedido. Tente novamente em ${result.retryAfterSeconds} segundos.`,
    })
  }

  return next()
})

// ─── Auth Middleware ────────────────────────────────────────

const enforceUserIsAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }
  return next({
    ctx: {
      session: { ...ctx.session, user: ctx.session.user },
    },
  })
})

// Middleware for premium users — verifies plan in database (source of truth)
// This prevents stale JWTs from granting access after plan cancellation.
const enforceUserIsPremium = t.middleware(async ({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }

  // In demo mode, grant full elite access
  if (ctx.isDemoMode) {
    return next({
      ctx: {
        session: { ...ctx.session, user: ctx.session.user },
        userPlan: 'elite' as const,
      },
    })
  }

  // Verify plan in database (not just JWT) to handle post-cancellation access
  const dbUser = await ctx.prisma.user.findUnique({
    where: { id: ctx.session.user.id },
    select: { plan: true },
  })

  const dbPlan = (dbUser?.plan as 'free' | 'pro' | 'elite') ?? 'free'

  if (dbPlan === 'free') {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Este recurso requer um plano Pro ou Elite. Faça upgrade em Configurações.',
    })
  }

  return next({
    ctx: {
      session: { ...ctx.session, user: { ...ctx.session.user, plan: dbPlan } },
      userPlan: dbPlan,
    },
  })
})

// ─── Exported Procedures ────────────────────────────────────

/** Endpoint público: rate limit por IP (60 req/min) */
export const publicProcedure = t.procedure.use(publicRateLimit)

/** Endpoint protegido: auth + rate limit por userId (120 req/min) */
export const protectedProcedure = t.procedure
  .use(protectedRateLimit)
  .use(enforceUserIsAuthed)

/** Endpoint de mutation: auth + rate limit por userId (20 req/min) */
export const mutationProcedure = t.procedure
  .use(mutationRateLimit)
  .use(enforceUserIsAuthed)

/** Endpoint premium: auth + plan check + rate limit por userId (180 req/min) */
export const premiumProcedure = t.procedure
  .use(premiumRateLimit)
  .use(enforceUserIsPremium)
