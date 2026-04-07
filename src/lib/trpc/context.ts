import { prisma, isDemoMode } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth/session'
import { DEMO_USER } from '@/lib/auth/demo-user'
import { createRepositories } from '@/lib/repositories'
import type { FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch'

export async function createContext(opts?: FetchCreateContextFnOptions) {
  const user = await getCurrentUser()

  // Extrair IP para rate limiting
  const headers = opts?.req.headers
  const clientIp =
    headers?.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    headers?.get('x-real-ip') ??
    '127.0.0.1'

  // Build session object compatible with existing tRPC routers
  const session = user
    ? {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          plan: user.plan,
          onboardingCompleted: user.onboardingCompleted,
          themePreference: user.themePreference,
        },
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      }
    : isDemoMode
      ? {
          user: {
            id: DEMO_USER.id,
            email: DEMO_USER.email,
            name: DEMO_USER.name,
            image: DEMO_USER.image,
            plan: DEMO_USER.plan,
            onboardingCompleted: DEMO_USER.onboardingCompleted,
            themePreference: DEMO_USER.themePreference,
          },
          expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        }
      : null

  // Repository pattern — demo or prisma based on mode
  const repos = createRepositories(isDemoMode, prisma)

  return {
    prisma,
    session,
    headers,
    isDemoMode,
    clientIp,
    repos,
  }
}

export type Context = Awaited<ReturnType<typeof createContext>>
