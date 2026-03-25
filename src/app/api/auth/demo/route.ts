import { NextRequest, NextResponse } from 'next/server'

/**
 * Demo login redirect — sends user to a client-side page that handles
 * Supabase auth directly (so cookies are set correctly by @supabase/ssr).
 */
export async function GET(request: NextRequest) {
  const callbackUrl = request.nextUrl.searchParams.get('callbackUrl') || '/dashboard'
  return NextResponse.redirect(
    new URL(`/login/demo?callbackUrl=${encodeURIComponent(callbackUrl)}`, request.url)
  )
}
