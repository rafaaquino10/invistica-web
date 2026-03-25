'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const DEMO_EMAIL = 'demo@investiq.com.br'
const DEMO_PASSWORD = 'demo-investiq-2026'

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

      // Try sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: DEMO_EMAIL,
        password: DEMO_PASSWORD,
      })

      if (signInError) {
        // User might not exist — try to sign up
        if (signInError.message.includes('Invalid login') || signInError.message.includes('invalid')) {
          setStatus('Criando conta demo...')
          const { error: signUpError } = await supabase.auth.signUp({
            email: DEMO_EMAIL,
            password: DEMO_PASSWORD,
            options: {
              data: { full_name: 'Usuário Demo', plan: 'pro' },
            },
          })

          if (signUpError) {
            setError(`Erro ao criar demo: ${signUpError.message}`)
            return
          }

          // Try sign in again after signup
          const { error: retryError } = await supabase.auth.signInWithPassword({
            email: DEMO_EMAIL,
            password: DEMO_PASSWORD,
          })

          if (retryError) {
            setError(`Erro no login demo: ${retryError.message}`)
            return
          }
        } else {
          setError(`Erro: ${signInError.message}`)
          return
        }
      }

      setStatus('Redirecionando...')
      router.push(callbackUrl)
    }

    loginDemo()
  }, [callbackUrl, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
      <div className="text-center">
        {error ? (
          <div className="space-y-4">
            <p className="text-[var(--neg)] text-sm">{error}</p>
            <a href="/login" className="text-[var(--accent-1)] text-sm hover:underline">
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
