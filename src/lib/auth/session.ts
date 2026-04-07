/**
 * Server-side session helper.
 * Replaces next-auth's auth() function.
 */

import { getAuthCookie } from './cookies'
import { verifyJWT } from './jwt'
import type { AuthUser, JWTPayload } from './types'

/**
 * Get the current authenticated user from the session cookie.
 * Use this in Server Components, API routes, and tRPC context.
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const token = await getAuthCookie()
  if (!token) return null

  const payload = await verifyJWT(token)
  if (!payload) return null

  return jwtPayloadToUser(payload)
}

export function jwtPayloadToUser(payload: JWTPayload): AuthUser {
  return {
    id: payload.userId,
    email: payload.email,
    name: payload.name,
    image: payload.image,
    plan: payload.plan,
    onboardingCompleted: payload.onboardingCompleted,
    themePreference: payload.themePreference,
  }
}
