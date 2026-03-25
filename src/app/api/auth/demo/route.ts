import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createAdminClient } from '@/lib/supabase/admin'

const DEMO_EMAIL = 'demo@investiq.com.br'
const DEMO_PASSWORD = 'Demo-InvestIQ-2026!'

/**
 * Demo login — cria user demo se não existe, faz login, seta cookies.
 * Tudo server-side para evitar problemas de CORS e confirmação de email.
 */
export async function GET(request: NextRequest) {
  const callbackUrl = request.nextUrl.searchParams.get('callbackUrl') || '/dashboard'

  try {
    // 1. Ensure demo user exists (admin client)
    const admin = createAdminClient()

    const { data: existingUsers } = await admin.auth.admin.listUsers()
    const demoExists = existingUsers?.users?.some(u => u.email === DEMO_EMAIL)

    if (!demoExists) {
      const { error: createError } = await admin.auth.admin.createUser({
        email: DEMO_EMAIL,
        password: DEMO_PASSWORD,
        email_confirm: true,
        user_metadata: { full_name: 'Usuário Demo', plan: 'pro' },
      })
      if (createError && !createError.message.includes('already')) {
        console.error('Demo user creation failed:', createError.message)
        return NextResponse.redirect(new URL('/login?error=demo_create', request.url))
      }
    }

    // 2. Sign in via server client (sets cookies correctly)
    const cookieStore = await cookies()

    const supabase = createServerClient(
      process.env['NEXT_PUBLIC_SUPABASE_URL']!,
      process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          },
        },
      },
    )

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
    })

    if (signInError) {
      console.error('Demo sign in failed:', signInError.message)
      return NextResponse.redirect(new URL('/login?error=demo_signin', request.url))
    }

    // 3. Redirect to callback
    return NextResponse.redirect(new URL(callbackUrl, request.url))
  } catch (err) {
    console.error('Demo login error:', err)
    return NextResponse.redirect(new URL('/login?error=demo', request.url))
  }
}
