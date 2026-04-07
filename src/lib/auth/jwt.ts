/**
 * JWT utilities using jose (edge-compatible).
 * Replaces next-auth JWT handling.
 */

import { SignJWT, jwtVerify } from 'jose'
import type { JWTPayload } from './types'

const ISSUER = 'investiq'
const AUDIENCE = 'investiq-app'
const EXPIRATION = '7d'

function getSecret() {
  const raw = process.env['AUTH_SECRET'] || process.env['NEXTAUTH_SECRET']
  if (!raw) {
    throw new Error('AUTH_SECRET environment variable is required. Generate one with: openssl rand -base64 32')
  }
  return new TextEncoder().encode(raw)
}

export async function signJWT(payload: JWTPayload): Promise<string> {
  return new SignJWT({ ...payload } as Record<string, unknown>)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setExpirationTime(EXPIRATION)
    .sign(getSecret())
}

export async function verifyJWT(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret(), {
      issuer: ISSUER,
      audience: AUDIENCE,
    })
    return {
      userId: payload['userId'] as string,
      email: payload['email'] as string,
      name: (payload['name'] as string | null) ?? null,
      image: (payload['image'] as string | null) ?? null,
      plan: (payload['plan'] as JWTPayload['plan']) ?? 'free',
      onboardingCompleted: (payload['onboardingCompleted'] as boolean) ?? false,
      themePreference: (payload['themePreference'] as string) ?? 'system',
    }
  } catch {
    return null
  }
}

/**
 * Lightweight verification for Edge Runtime (middleware).
 * Same as verifyJWT but returns raw payload without field extraction.
 */
export async function verifyJWTEdge(token: string): Promise<Record<string, unknown> | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret(), {
      issuer: ISSUER,
      audience: AUDIENCE,
    })
    return payload as Record<string, unknown>
  } catch {
    return null
  }
}
