'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const DEMO_EMAIL = 'demo@investiq.com.br'
const DEMO_PASSWORD = 'Demo-InvestIQ-2026!'

export default function DemoLoginWrapper() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[var(--accent-1)] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <DemoLoginPage />
    </Suspense>
  )
}

function DemoLoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard'
  const [status, setStatus] = useState('Entrando no modo demo...')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function trySignIn(supabase: ReturnType<typeof createClient>): Promise<boolean> {
      const { error } = await supabase.auth.signInWithPassword({
        email: DEMO_EMAIL,
        password: DEMO_PASSWORD,
      })
      return !error
    }

    async function loginDemo() {
      const supabase = createClient()

      // 1. Try sign in (user may already exist with correct password)
      if (await trySignIn(supabase)) {
        if (!cancelled) { setStatus('Redirecionando...'); router.push(callbackUrl) }
        return
      }

      // 2. Sign in failed — try to create the user
      if (!cancelled) setStatus('Configurando acesso demo...')

      const { error: signUpError } = await supabase.auth.signUp({
        email: DEMO_EMAIL,
        password: DEMO_PASSWORD,
        options: { data: { full_name: 'Usuário Demo', plan: 'pro' } },
      })

      // 3. If signUp succeeded OR user already exists — try sign in again
      if (!signUpError || signUpError.message.includes('already') || signUpError.message.includes('registered')) {
        await new Promise(r => setTimeout(r, 1000))

        if (await trySignIn(supabase)) {
          if (!cancelled) { setStatus('Redirecionando...'); router.push(callbackUrl) }
          return
        }
      }

      // 4. Check if signUp auto-logged us in (some Supabase configs do this)
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        if (!cancelled) { setStatus('Redirecionando...'); router.push(callbackUrl) }
        return
      }

      // 5. Nothing worked
      if (!cancelled) {
        setError(
          signUpError
            ? `Erro: ${signUpError.message}. Verifique no Supabase: Email provider habilitado, "Confirm email" desligado.`
            : 'Não foi possível fazer login demo. Tente novamente.'
        )
      }
    }

    loginDemo()
    return () => { cancelled = true }
  }, [callbackUrl, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
      <div className="text-center max-w-md px-4">
        {error ? (
          <div className="space-y-4">
            <p className="text-red-400 text-sm leading-relaxed">{error}</p>
            <a href="/login" className="text-[var(--accent-1)] text-sm hover:underline block">
              Voltar para login
            </a>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="w-8 h-8 border-2 border-[var(--accent-1)] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-[var(--text-2)] text-sm">{status}</p>
          </div>
        )}
      </div>
    </div>
  )
}
