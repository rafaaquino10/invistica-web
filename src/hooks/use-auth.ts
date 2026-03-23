'use client'

import { createContext, useContext } from 'react'
import type { AuthUser } from '@/lib/auth/types'

interface AuthContextValue {
  user: AuthUser | null
  status: 'loading' | 'authenticated' | 'unauthenticated'
  logout: () => Promise<void>
  refresh: () => Promise<void>
  update: (data: Partial<AuthUser>) => void
}

export const AuthContext = createContext<AuthContextValue>({
  user: null,
  status: 'loading',
  logout: async () => {},
  refresh: async () => {},
  update: () => {},
})

export function useAuth(): AuthContextValue {
  return useContext(AuthContext)
}

/**
 * Compatibility alias — components that used useSession()
 * can migrate gradually by using useAuth() which returns
 * a similar shape.
 */
export function useSession() {
  const { user, status } = useAuth()
  return {
    data: user ? { user } : null,
    status,
    update: useAuth().update,
  }
}
