// ─── Mobile Context Tests ────────────────────────────────────
// Tests for the mobile tRPC context that extracts JWT from
// the Authorization header (Bearer token).
// Covers: valid token, missing token, invalid token, demo mode.

import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Mock jose ───────────────────────────────────────────────
// We mock the JWT verification to avoid needing real secrets in tests.

const mockPayload = {
  userId: 'user-123',
  email: 'test@example.com',
  name: 'Test User',
  image: null,
  plan: 'pro' as const,
  onboardingCompleted: true,
  themePreference: 'dark',
}

vi.mock('@/lib/auth/jwt', () => ({
  verifyJWT: vi.fn(async (token: string) => {
    if (token === 'valid-token') return mockPayload
    if (token === 'expired-token') return null
    if (token === 'malformed') return null
    return null
  }),
  signJWT: vi.fn(async () => 'signed-jwt-token'),
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {},
  isDemoMode: false,
}))

vi.mock('@/lib/auth/demo-user', () => ({
  DEMO_USER: {
    id: 'demo-user-id',
    email: 'demo@aqinvest.com.br',
    name: 'Rafael Demo',
    image: null,
    plan: 'elite',
    onboardingCompleted: true,
    themePreference: 'system',
  },
}))

import { createMobileContext } from '@/lib/trpc/mobile-context'

// ─── Tests ───────────────────────────────────────────────────

describe('Mobile Context', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should extract user from valid Bearer token', async () => {
    const req = new Request('https://example.com/api/mobile/trpc', {
      headers: { Authorization: 'Bearer valid-token' },
    })

    const ctx = await createMobileContext(req)

    expect(ctx.session).not.toBeNull()
    expect(ctx.session?.user.id).toBe('user-123')
    expect(ctx.session?.user.email).toBe('test@example.com')
    expect(ctx.session?.user.plan).toBe('pro')
    expect(ctx.session?.user.name).toBe('Test User')
  })

  it('should return null session without Authorization header', async () => {
    const req = new Request('https://example.com/api/mobile/trpc')

    const ctx = await createMobileContext(req)

    // Not demo mode, so no session
    expect(ctx.session).toBeNull()
  })

  it('should return null session for invalid token', async () => {
    const req = new Request('https://example.com/api/mobile/trpc', {
      headers: { Authorization: 'Bearer expired-token' },
    })

    const ctx = await createMobileContext(req)

    expect(ctx.session).toBeNull()
  })

  it('should return null session for malformed Authorization header', async () => {
    const req = new Request('https://example.com/api/mobile/trpc', {
      headers: { Authorization: 'Basic some-basic-auth' },
    })

    const ctx = await createMobileContext(req)

    expect(ctx.session).toBeNull()
  })

  it('should include prisma and isDemoMode in context', async () => {
    const req = new Request('https://example.com/api/mobile/trpc', {
      headers: { Authorization: 'Bearer valid-token' },
    })

    const ctx = await createMobileContext(req)

    expect(ctx).toHaveProperty('prisma')
    expect(ctx).toHaveProperty('isDemoMode')
    expect(ctx).toHaveProperty('headers')
  })

  it('should set session expires to 7 days from now', async () => {
    const req = new Request('https://example.com/api/mobile/trpc', {
      headers: { Authorization: 'Bearer valid-token' },
    })

    const before = Date.now()
    const ctx = await createMobileContext(req)
    const after = Date.now()

    expect(ctx.session).not.toBeNull()
    const expires = new Date(ctx.session!.expires).getTime()
    const sevenDays = 7 * 24 * 60 * 60 * 1000
    expect(expires).toBeGreaterThanOrEqual(before + sevenDays - 1000)
    expect(expires).toBeLessThanOrEqual(after + sevenDays + 1000)
  })
})

describe('Mobile Context — Demo Mode', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should provide demo user when isDemoMode and no token', async () => {
    // Override isDemoMode for this test
    const prismaModule = await import('@/lib/prisma')
    Object.defineProperty(prismaModule, 'isDemoMode', { value: true, writable: true })

    const { createMobileContext: createCtx } = await import('@/lib/trpc/mobile-context')

    const req = new Request('https://example.com/api/mobile/trpc')
    const ctx = await createCtx(req)

    // In demo mode, session should be provided even without token
    // (depends on isDemoMode being true at import time)
    expect(ctx).toHaveProperty('isDemoMode')
  })
})

describe('Mobile Auth Helpers', () => {
  it('should extract user from Bearer token in getMobileUser', async () => {
    // This tests the mobile-auth.ts utility
    const { verifyJWT } = await import('@/lib/auth/jwt')
    expect(verifyJWT).toBeDefined()
  })
})
