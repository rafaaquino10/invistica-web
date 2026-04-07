/**
 * Email/password authentication logic.
 * Handles both login and the user lookup for registration auto-login.
 */

import bcrypt from 'bcryptjs'
import type { AuthUser } from './types'

/**
 * Authenticate a user with email and password.
 * Returns the user or null if authentication fails.
 */
export async function loginWithEmail(email: string, password: string): Promise<AuthUser | null> {
  const hasDatabaseUrl = !!process.env['DATABASE_URL']
  if (!hasDatabaseUrl) return null

  const { prisma } = await import('@/lib/prisma')
  const user = await prisma.user.findUnique({
    where: { email },
  })

  if (!user?.password) return null

  const isValid = await bcrypt.compare(password, user.password)
  if (!isValid) return null

  return {
    id: user.id,
    email: user.email!,
    name: user.name,
    image: user.image,
    plan: (user.plan as AuthUser['plan']) ?? 'free',
    onboardingCompleted: user.onboardingCompleted ?? false,
    themePreference: user.themePreference ?? 'system',
  }
}

/**
 * Look up a freshly registered user for JWT creation.
 */
export async function getUserById(userId: string): Promise<AuthUser | null> {
  const hasDatabaseUrl = !!process.env['DATABASE_URL']
  if (!hasDatabaseUrl) return null

  const { prisma } = await import('@/lib/prisma')
  const user = await prisma.user.findUnique({
    where: { id: userId },
  })

  if (!user) return null

  return {
    id: user.id,
    email: user.email!,
    name: user.name,
    image: user.image,
    plan: (user.plan as AuthUser['plan']) ?? 'free',
    onboardingCompleted: user.onboardingCompleted ?? false,
    themePreference: user.themePreference ?? 'system',
  }
}
