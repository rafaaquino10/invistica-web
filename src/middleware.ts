import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

const COOKIE_NAME = 'iq-session'

// Routes that require authentication
const protectedRoutes = [
  '/dashboard',
  '/explorer',
  '/portfolio',
  '/dividends',
  '/radar',
  '/goals',
  '/settings',
  '/onboarding',
  '/comparar',
  '/ativo',
  '/mercado',
]

// Routes that should redirect to dashboard if already authenticated
const authRoutes = ['/login', '/register']

function getSecret() {
  const raw = process.env['AUTH_SECRET'] || process.env['NEXTAUTH_SECRET']
  if (!raw) {
    throw new Error('AUTH_SECRET environment variable is required. Generate one with: openssl rand -base64 32')
  }
  return new TextEncoder().encode(raw)
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  )
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route))

  // Get the session token from our custom cookie
  const token = request.cookies.get(COOKIE_NAME)?.value

  let isAuthenticated = false
  if (token) {
    try {
      await jwtVerify(token, getSecret(), {
        issuer: 'investiq',
        audience: 'investiq-app',
      })
      isAuthenticated = true
    } catch {
      // Invalid token — clear it
      if (isProtectedRoute) {
        const response = NextResponse.redirect(new URL('/login', request.url))
        response.cookies.delete(COOKIE_NAME)
        return response
      }
    }
  }

  // Redirect unauthenticated users from protected routes
  if (isProtectedRoute && !isAuthenticated) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Redirect authenticated users from auth routes
  if (isAuthRoute && isAuthenticated) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes (except auth)
     */
    '/((?!_next/static|_next/image|favicon.ico|public|api(?!/auth)).*)',
  ],
}
