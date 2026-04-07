/**
 * Google OAuth 2.0 Code Flow
 */

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth'
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'
const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v2/userinfo'

function getBaseUrl(): string {
  return process.env['APP_URL'] || process.env['NEXTAUTH_URL'] || 'http://localhost:3000'
}

export function getGoogleAuthURL(state: string): string {
  const clientId = process.env['GOOGLE_CLIENT_ID']
  if (!clientId) throw new Error('GOOGLE_CLIENT_ID not configured')

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: `${getBaseUrl()}/api/auth/callback/google`,
    response_type: 'code',
    scope: 'openid email profile',
    state,
    access_type: 'offline',
    prompt: 'consent',
  })
  return `${GOOGLE_AUTH_URL}?${params}`
}

export async function handleGoogleCallback(code: string): Promise<{
  email: string
  name: string | null
  image: string | null
  provider: 'google'
  providerAccountId: string
}> {
  const clientId = process.env['GOOGLE_CLIENT_ID']!
  const clientSecret = process.env['GOOGLE_CLIENT_SECRET']!
  const redirectUri = `${getBaseUrl()}/api/auth/callback/google`

  // Exchange code for tokens
  const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  })

  if (!tokenRes.ok) {
    const err = await tokenRes.text()
    throw new Error(`Google token exchange failed: ${err}`)
  }

  const tokens = await tokenRes.json()

  // Fetch user profile
  const userRes = await fetch(GOOGLE_USERINFO_URL, {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  })

  if (!userRes.ok) {
    throw new Error('Failed to fetch Google user profile')
  }

  const profile = await userRes.json()

  return {
    email: profile.email,
    name: profile.name ?? null,
    image: profile.picture ?? null,
    provider: 'google',
    providerAccountId: String(profile.id),
  }
}
