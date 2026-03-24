'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

interface AuthUser {
  id: string
  email: string | null
  name: string | null
  image: string | null
  plan: string
}

interface AuthContextValue {
  user: AuthUser | null
  status: 'loading' | 'authenticated' | 'unauthenticated'
  token: string | null
  logout: () => Promise<void>
}

function mapUser(user: User): AuthUser {
  return {
    id: user.id,
    email: user.email ?? null,
    name: user.user_metadata?.['full_name'] ?? user.user_metadata?.['name'] ?? null,
    image: user.user_metadata?.['avatar_url'] ?? null,
    plan: user.user_metadata?.['plan'] ?? 'free',
  }
}

export function useAuth(): AuthContextValue {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [status, setStatus] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading')

  useEffect(() => {
    const supabase = createClient()

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(mapUser(session.user))
        setToken(session.access_token)
        setStatus('authenticated')
      } else {
        setUser(null)
        setToken(null)
        setStatus('unauthenticated')
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(mapUser(session.user))
        setToken(session.access_token)
        setStatus('authenticated')
      } else {
        setUser(null)
        setToken(null)
        setStatus('unauthenticated')
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const logout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    setUser(null)
    setToken(null)
    setStatus('unauthenticated')
  }

  return { user, status, token, logout }
}

export function useSession() {
  const { user, status } = useAuth()
  return {
    data: user ? { user } : null,
    status,
  }
}
