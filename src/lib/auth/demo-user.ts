/**
 * Shared demo user constant used across auth config, demo route, and tRPC context.
 */
export const DEMO_USER = {
  id: 'demo-user-id',
  email: 'demo@investiq.com.br',
  name: 'Rafael Demo',
  image: null,
  plan: 'elite',
  onboardingCompleted: true,
  themePreference: 'system',
} as const
