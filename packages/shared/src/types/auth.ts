// ─── Auth Types ──────────────────────────────────────────────
// Shared between web and mobile clients.

export type PlanType = 'free' | 'pro' | 'elite'

export interface AuthUser {
  id: string
  email: string
  name: string | null
  image: string | null
  plan: PlanType
  onboardingCompleted: boolean
  themePreference: string
}

export interface JWTPayload {
  userId: string
  email: string
  name: string | null
  image: string | null
  plan: PlanType
  onboardingCompleted: boolean
  themePreference: string
}

export interface MobileAuthResponse {
  accessToken: string
  refreshToken: string
  expiresAt: number
  user: {
    id: string
    email: string
    name: string | null
    image: string | null
    plan: PlanType
  }
}

export interface MobileRefreshResponse {
  accessToken: string
  expiresAt: number
}

export interface MobileApiResponse<T> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
  }
  meta: {
    timestamp: number
    version: string
  }
}
