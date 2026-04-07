'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { AuthContext } from '@/hooks/use-auth'
import type { AuthUser } from '@/lib/auth/types'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [status, setStatus] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading')

  const fetchUser = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me')
      if (res.ok) {
        const data = await res.json()
        setUser(data)
        setStatus('authenticated')
      } else {
        setUser(null)
        setStatus('unauthenticated')
      }
    } catch {
      setUser(null)
      setStatus('unauthenticated')
    }
  }, [])

  useEffect(() => {
    fetchUser()
  }, [fetchUser])

  // Auto-refresh session every 24 hours to keep JWT in sync with DB
  useEffect(() => {
    const REFRESH_INTERVAL = 24 * 60 * 60 * 1000 // 24h
    const interval = setInterval(async () => {
      if (status === 'authenticated') {
        try {
          const res = await fetch('/api/auth/me')
          if (res.ok) {
            const data = await res.json()
            setUser(data)
          }
        } catch {
          // Silently fail — will retry next interval
        }
      }
    }, REFRESH_INTERVAL)
    return () => clearInterval(interval)
  }, [status])

  const logout = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    setUser(null)
    setStatus('unauthenticated')
    window.location.href = '/'
  }, [])

  const refresh = useCallback(async () => {
    await fetchUser()
  }, [fetchUser])

  const update = useCallback((data: Partial<AuthUser>) => {
    setUser(prev => prev ? { ...prev, ...data } : null)
  }, [])

  const value = useMemo(() => ({
    user,
    status,
    logout,
    refresh,
    update,
  }), [user, status, logout, refresh, update])

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
