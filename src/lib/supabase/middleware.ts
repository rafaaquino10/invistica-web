import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env['NEXT_PUBLIC_SUPABASE_URL']!,
    process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: Record<string, unknown> }>) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, {
              ...options,
              path: '/',
              sameSite: 'lax' as const,
              secure: process.env['NODE_ENV'] === 'production',
              httpOnly: true,
              maxAge: 60 * 60 * 24 * 7, // 7 days
            }),
          )
        },
      },
    },
  )

  // Refresh session if expired — this also refreshes the cookie
  const { data: { user } } = await supabase.auth.getUser()

  // Protected routes (dashboard area)
  const path = request.nextUrl.pathname
  const isProtected = path.startsWith('/dashboard') ||
    path.startsWith('/portfolio') ||
    path.startsWith('/ativo') ||
    path.startsWith('/explorer') ||
    path.startsWith('/dividends') ||
    path.startsWith('/comparar') ||
    path.startsWith('/radar') ||
    path.startsWith('/news') ||
    path.startsWith('/goals') ||
    path.startsWith('/settings') ||
    path.startsWith('/carteiras') ||
    path.startsWith('/backtest') ||
    path.startsWith('/analytics') ||
    path.startsWith('/mercado') ||
    path.startsWith('/glossario')

  if (!user && isProtected) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('callbackUrl', path)
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
