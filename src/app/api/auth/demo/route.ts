import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

const DEMO_EMAIL = 'demo@investiq.com.br'
const DEMO_PASSWORD = 'Demo-InvestIQ-2026!'

/**
 * Demo login — Step 1: ensure user exists server-side.
 * Step 2: redirect to client-side page that does signInWithPassword.
 * Cookies must be set client-side (Supabase SSR limitation with redirects).
 */
export async function GET(request: NextRequest) {
  const callbackUrl = request.nextUrl.searchParams.get('callbackUrl') || '/dashboard'

  try {
    // Ensure demo user exists via admin client
    const admin = createAdminClient()

    // Try to create — if already exists, that's fine
    const { error: createError } = await admin.auth.admin.createUser({
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: 'Usuário Demo', plan: 'pro' },
    })

    if (createError && !createError.message.includes('already') && !createError.message.includes('duplicate')) {
      console.error('Demo user creation failed:', createError.message)
      return NextResponse.redirect(new URL('/login?error=demo_create', request.url))
    }

    // Redirect to client-side login page (which calls signInWithPassword)
    return NextResponse.redirect(
      new URL(`/login/demo?callbackUrl=${encodeURIComponent(callbackUrl)}`, request.url)
    )
  } catch (err) {
    console.error('Demo login error:', err)
    return NextResponse.redirect(new URL('/login?error=demo', request.url))
  }
}
