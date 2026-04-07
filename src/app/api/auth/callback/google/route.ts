import { NextRequest, NextResponse } from 'next/server'
import { handleGoogleCallback } from '@/lib/auth/oauth-google'
import { signJWT } from '@/lib/auth/jwt'
import { COOKIE_NAME } from '@/lib/auth/cookies'

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code')
  const state = request.nextUrl.searchParams.get('state')

  if (!code) {
    return NextResponse.redirect(new URL('/login?error=OAuthCodeMissing', request.url))
  }

  // Parse callbackUrl from state
  let callbackUrl = '/dashboard'
  if (state) {
    try {
      const stateData = JSON.parse(Buffer.from(state, 'base64url').toString())
      callbackUrl = stateData.callbackUrl || '/dashboard'
    } catch {
      // Ignore state parse errors
    }
  }

  try {
    const profile = await handleGoogleCallback(code)

    // Find or create user in database
    const user = await findOrCreateOAuthUser(profile)

    const token = await signJWT({
      userId: user.id,
      email: user.email,
      name: user.name,
      image: user.image,
      plan: user.plan,
      onboardingCompleted: user.onboardingCompleted,
      themePreference: user.themePreference,
    })

    const response = NextResponse.redirect(new URL(callbackUrl, request.url))
    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    })

    return response
  } catch (error) {
    console.error('Google callback error:', error)
    return NextResponse.redirect(new URL('/login?error=OAuthCallbackError', request.url))
  }
}

async function findOrCreateOAuthUser(profile: {
  email: string
  name: string | null
  image: string | null
  provider: string
  providerAccountId: string
}) {
  const hasDatabaseUrl = !!process.env['DATABASE_URL']

  if (!hasDatabaseUrl) {
    // Demo mode — return a mock user
    return {
      id: `oauth-${profile.providerAccountId}`,
      email: profile.email,
      name: profile.name,
      image: profile.image,
      plan: 'free' as const,
      onboardingCompleted: false,
      themePreference: 'system',
    }
  }

  const { prisma } = await import('@/lib/prisma')

  // Find existing user by email
  let user = await prisma.user.findUnique({
    where: { email: profile.email },
  })

  if (!user) {
    // Create new user
    user = await prisma.user.create({
      data: {
        email: profile.email,
        name: profile.name,
        image: profile.image,
        plan: 'free',
      },
    })

    // Create default portfolio for new users
    await prisma.portfolio.create({
      data: {
        userId: user.id,
        name: 'Minha Carteira',
        description: 'Carteira principal',
        isDefault: true,
      },
    })
  } else if (profile.image && !user.image) {
    // Update image if user doesn't have one
    user = await prisma.user.update({
      where: { id: user.id },
      data: { image: profile.image },
    })
  }

  return {
    id: user.id,
    email: user.email!,
    name: user.name,
    image: user.image,
    plan: (user.plan as 'free' | 'pro' | 'elite') ?? 'free',
    onboardingCompleted: user.onboardingCompleted ?? false,
    themePreference: user.themePreference ?? 'system',
  }
}
