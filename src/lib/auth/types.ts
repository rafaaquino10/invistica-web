/**
 * Custom auth types — replaces next-auth type augmentations.
 */

export interface AuthUser {
  id: string
  email: string
  name: string | null
  image: string | null
  plan: 'free' | 'pro' | 'elite'
  onboardingCompleted: boolean
  themePreference: string
}

export interface JWTPayload {
  userId: string
  email: string
  name: string | null
  image: string | null
  plan: 'free' | 'pro' | 'elite'
  onboardingCompleted: boolean
  themePreference: string
}

export interface AuthSession {
  user: AuthUser
  expires: string
}
