'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { AuthContext } from '@/hooks/use-auth'
import { createClient } from '@/lib/supabase/client'
import type { AuthUser } from '@/lib/auth/types'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [status, setStatus] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading')
  const supabase = useMemo(() => createClient(), [])

  const syncUser = useCallback(async () => {
    const { data: { user: sbUser } } = await supabase.auth.getUser()
    if (sbUser) {
      setUser({
        id: sbUser.id,
        email: sbUser.email || '',
        name: sbUser.user_metadata?.full_name || sbUser.user_metadata?.name || sbUser.email?.split('@')[0] || '',
        image: sbUser.user_metadata?.avatar_url || sbUser.user_metadata?.picture || null,
        plan: 'free',
        onboardingCompleted: true,
      })
      setStatus('authenticated')
    } else {
      setUser(null)
      setStatus('unauthenticated')
    }
  }, [supabase])

  useEffect(() => {
    syncUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || '',
          image: session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture || null,
          plan: 'free',
          onboardingCompleted: true,
        })
        setStatus('authenticated')
      } else {
        setUser(null)
        setStatus('unauthenticated')
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase, syncUser])

  const logout = useCallback(async () => {
    await supabase.auth.signOut()
    setUser(null)
    setStatus('unauthenticated')
    window.location.href = '/'
  }, [supabase])

  const refresh = useCallback(async () => { await syncUser() }, [syncUser])
  const update = useCallback((data: Partial<AuthUser>) => { setUser(prev => prev ? { ...prev, ...data } : null) }, [])

  const value = useMemo(() => ({ user, status, logout, refresh, update }), [user, status, logout, refresh, update])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
