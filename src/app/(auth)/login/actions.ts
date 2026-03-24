'use server'

import { redirect } from 'next/navigation'

/**
 * Demo login — creates a Supabase session for the demo user.
 * Only available in development or when ALLOW_DEMO=true.
 *
 * In production, auth is handled entirely by Supabase GoTrue
 * via the login page form → supabase.auth.signInWithPassword().
 */
export async function demoLogin() {
  if (process.env.NODE_ENV !== 'development' && process.env['ALLOW_DEMO'] !== 'true') {
    redirect('/login')
  }

  // Demo mode: redirect directly to explorer (Supabase middleware
  // will handle session in dev mode via useAuth hook)
  redirect('/explorer')
}
