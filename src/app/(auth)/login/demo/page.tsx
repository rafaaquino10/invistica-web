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
    async function loginDemo() {
      const supabase = createClient()

      // Step 1: Try to sign in (user may already exist)
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: DEMO_EMAIL,
        password: DEMO_PASSWORD,
      })

      if (!signInError) {
        // Success — redirect
        setStatus('Redirecionando...')
        router.push(callbackUrl)
        return
      }

      // Step 2: User doesn't exist — create via signUp
      setStatus('Criando conta demo...')

      const { error: signUpError } = await supabase.auth.signUp({
        email: DEMO_EMAIL,
        password: DEMO_PASSWORD,
        options: {
          data: { full_name: 'Usuário Demo', plan: 'pro' },
        },
      })

      if (signUpError) {
        // signUp failed — maybe user exists with different password, or email confirmation required
        setError(
          `Não foi possível criar conta demo. ` +
          `Verifique se "Confirm email" está desligado no Supabase Dashboard → Authentication → Settings. ` +
          `Erro: ${signUpError.message}`
        )
        return
      }

      // Step 3: Wait briefly for Supabase to propagate, then sign in
      setStatus('Entrando...')
      await new Promise(resolve => setTimeout(resolve, 1500))

      const { error: retryError } = await supabase.auth.signInWithPassword({
        email: DEMO_EMAIL,
        password: DEMO_PASSWORD,
      })

      if (retryError) {
        // If still fails, the signUp probably auto-signed-in already
        // Check if we have a session
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          setStatus('Redirecionando...')
          router.push(callbackUrl)
          return
        }

        setError(
          `Conta criada mas login falhou. ` +
          `Se "Confirm email" estiver ligado no Supabase, desative-o. ` +
          `Erro: ${retryError.message}`
        )
        return
      }

      setStatus('Redirecionando...')
      router.push(callbackUrl)
    }

    loginDemo()
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
