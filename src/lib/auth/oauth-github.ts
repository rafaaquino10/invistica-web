/**
 * GitHub OAuth 2.0 Code Flow
 */

const GITHUB_AUTH_URL = 'https://github.com/login/oauth/authorize'
const GITHUB_TOKEN_URL = 'https://github.com/login/oauth/access_token'
const GITHUB_USER_URL = 'https://api.github.com/user'
const GITHUB_EMAILS_URL = 'https://api.github.com/user/emails'

function getBaseUrl(): string {
  return process.env['APP_URL'] || process.env['NEXTAUTH_URL'] || 'http://localhost:3000'
}

export function getGitHubAuthURL(state: string): string {
  const clientId = process.env['GITHUB_CLIENT_ID']
  if (!clientId) throw new Error('GITHUB_CLIENT_ID not configured')

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: `${getBaseUrl()}/api/auth/callback/github`,
    scope: 'user:email',
    state,
  })
  return `${GITHUB_AUTH_URL}?${params}`
}

export async function handleGitHubCallback(code: string): Promise<{
  email: string
  name: string | null
  image: string | null
  provider: 'github'
  providerAccountId: string
}> {
  const clientId = process.env['GITHUB_CLIENT_ID']!
  const clientSecret = process.env['GITHUB_CLIENT_SECRET']!

  // Exchange code for access token
  const tokenRes = await fetch(GITHUB_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: `${getBaseUrl()}/api/auth/callback/github`,
    }),
  })

  if (!tokenRes.ok) {
    const err = await tokenRes.text()
    throw new Error(`GitHub token exchange failed: ${err}`)
  }

  const tokens = await tokenRes.json()

  if (tokens.error) {
    throw new Error(`GitHub token error: ${tokens.error_description || tokens.error}`)
  }

  const accessToken = tokens.access_token

  // Fetch user profile
  const userRes = await fetch(GITHUB_USER_URL, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
    },
  })

  if (!userRes.ok) {
    throw new Error('Failed to fetch GitHub user profile')
  }

  const profile = await userRes.json()

  // GitHub may not return email in profile — fetch from emails endpoint
  let email = profile.email
  if (!email) {
    const emailsRes = await fetch(GITHUB_EMAILS_URL, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
    })

    if (emailsRes.ok) {
      const emails = await emailsRes.json()
      const primary = emails.find((e: { primary: boolean; verified: boolean }) => e.primary && e.verified)
      email = primary?.email ?? emails[0]?.email
    }
  }

  if (!email) {
    throw new Error('Could not retrieve email from GitHub')
  }

  return {
    email,
    name: profile.name ?? profile.login ?? null,
    image: profile.avatar_url ?? null,
    provider: 'github',
    providerAccountId: String(profile.id),
  }
}
