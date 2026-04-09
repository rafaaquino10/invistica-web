import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

const protectedRoutes = [
  '/dashboard', '/explorer', '/portfolio', '/dividends', '/radar',
  '/settings', '/onboarding', '/comparar', '/ativo',
  '/mapa', '/estrategias', '/analytics', '/lab', '/backtest-lab',
]

const authRoutes = ['/login', '/register']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const { user, response } = await updateSession(request)

  // Protected routes — redirect to login if not authenticated
  const isProtected = protectedRoutes.some(r => pathname.startsWith(r))
  if (isProtected && !user) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Auth routes — redirect to dashboard if already authenticated
  const isAuthRoute = authRoutes.some(r => pathname === r)
  if (isAuthRoute && user) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/|brand/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}
