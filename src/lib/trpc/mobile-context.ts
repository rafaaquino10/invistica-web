/**
 * Mobile tRPC Context
 *
 * Creates a tRPC context from a mobile request using Bearer token auth.
 * The mobile app sends JWT in the Authorization header (not cookies).
 * This produces the same Context shape as the web context so all
 * routers work without modification.
 */

import { verifyJWT } from '@/lib/auth/jwt'
import { prisma, isDemoMode } from '@/lib/prisma'
import { DEMO_USER } from '@/lib/auth/demo-user'
import { createRepositories } from '@/lib/repositories'
import type { Context } from './context'

export async function createMobileContext(req: Request): Promise<Context> {
  // Extract Bearer token from Authorization header
  const authHeader = req.headers.get('Authorization')
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null

  let session: Context['session'] = null

  if (token) {
    const payload = await verifyJWT(token)
    if (payload) {
      session = {
        user: {
          id: payload.userId,
          email: payload.email,
          name: payload.name,
          image: payload.image,
          plan: payload.plan,
          onboardingCompleted: payload.onboardingCompleted,
          themePreference: payload.themePreference,
        },
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      }
    }
  }

  // In demo mode without auth, provide demo user
  if (!session && isDemoMode) {
    session = {
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
  }

  // Extrair IP para rate limiting
  const clientIp =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    '127.0.0.1'

  const repos = createRepositories(isDemoMode, prisma)

  return {
    prisma,
    session,
    headers: req.headers,
    isDemoMode,
    clientIp,
    repos,
  }
}
