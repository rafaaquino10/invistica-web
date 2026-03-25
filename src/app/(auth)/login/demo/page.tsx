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

      // User was pre-created by /api/auth/demo (server-side).
      // Just sign in client-side to set cookies correctly.
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: DEMO_EMAIL,
        password: DEMO_PASSWORD,
      })

      if (signInError) {
        setError(`Erro no login demo: ${signInError.message}`)
        return
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
