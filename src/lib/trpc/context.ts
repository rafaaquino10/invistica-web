import { prisma, isDemoMode } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { DEMO_USER } from '@/lib/auth/demo-user'
import { createRepositories } from '@/lib/repositories'
import type { FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch'

export async function createContext(opts?: FetchCreateContextFnOptions) {
  // Get user from Supabase Auth
  let user: { id: string; email: string; name: string; image: string | null; plan: string; onboardingCompleted: boolean; themePreference?: string } | null = null

  try {
    const supabase = await createClient()
    const { data: { user: sbUser } } = await supabase.auth.getUser()
    if (sbUser) {
      user = {
        id: sbUser.id,
        email: sbUser.email || '',
        name: sbUser.user_metadata?.full_name || sbUser.user_metadata?.name || '',
        image: sbUser.user_metadata?.avatar_url || null,
        plan: 'free',
        onboardingCompleted: true,
      }
    }
  } catch {
    // Supabase unavailable — continue without user
  }

  const headers = opts?.req.headers
  const clientIp =
    headers?.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    headers?.get('x-real-ip') ??
    '127.0.0.1'

  const session = user
    ? {
        user: { ...user },
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
