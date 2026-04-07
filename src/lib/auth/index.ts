/**
 * Auth module — custom JWT-based authentication.
 * Replaces next-auth.
 */

export { signJWT, verifyJWT } from './jwt'
export { setAuthCookie, getAuthCookie, clearAuthCookie, COOKIE_NAME } from './cookies'
export { getCurrentUser, jwtPayloadToUser } from './session'
export { loginWithEmail, getUserById } from './credentials'
export { getGoogleAuthURL, handleGoogleCallback } from './oauth-google'
export { getGitHubAuthURL, handleGitHubCallback } from './oauth-github'
export { DEMO_USER } from './demo-user'
export type { AuthUser, JWTPayload, AuthSession } from './types'
