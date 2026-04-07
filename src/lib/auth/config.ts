/**
 * Auth configuration constants.
 * This file replaces the old next-auth config.
 */

export const AUTH_CONFIG = {
  /** JWT expiration time */
  tokenExpiry: '7d',
  /** Cookie max age in seconds */
  cookieMaxAge: 7 * 24 * 60 * 60,
  /** Login page path */
  loginPage: '/login',
  /** Default redirect after login */
  defaultRedirect: '/dashboard',
  /** Onboarding page path */
  onboardingPage: '/onboarding',
} as const
