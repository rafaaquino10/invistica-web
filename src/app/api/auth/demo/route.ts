import { NextRequest, NextResponse } from 'next/server'
import { signJWT } from '@/lib/auth/jwt'
import { COOKIE_NAME } from '@/lib/auth/cookies'
import { DEMO_USER } from '@/lib/auth/demo-user'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard'

  // Only allow in development or when ALLOW_DEMO is set
  if (process.env.NODE_ENV !== 'development' && process.env['ALLOW_DEMO'] !== 'true') {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  try {
    const token = await signJWT({
      userId: DEMO_USER.id,
      email: DEMO_USER.email,
      name: DEMO_USER.name,
      image: DEMO_USER.image,
      plan: DEMO_USER.plan,
      onboardingCompleted: DEMO_USER.onboardingCompleted,
      themePreference: DEMO_USER.themePreference,
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
    console.error('Demo login error:', error)
    return NextResponse.redirect(new URL('/login?error=DemoLoginFailed', request.url))
  }
}
