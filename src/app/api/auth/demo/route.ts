import { NextRequest, NextResponse } from 'next/server'

/**
 * Demo login — redireciona para página client-side que faz signUp + signIn.
 * Sem dependência de SERVICE_ROLE_KEY.
 */
export async function GET(request: NextRequest) {
  const callbackUrl = request.nextUrl.searchParams.get('callbackUrl') || '/dashboard'
  return NextResponse.redirect(
    new URL(`/login/demo?callbackUrl=${encodeURIComponent(callbackUrl)}`, request.url)
  )
}
