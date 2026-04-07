import { NextRequest, NextResponse } from 'next/server'
import { getGitHubAuthURL } from '@/lib/auth/oauth-github'
import crypto from 'crypto'

export async function GET(request: NextRequest) {
  const callbackUrl = request.nextUrl.searchParams.get('callbackUrl') || '/dashboard'

  try {
    const stateData = JSON.stringify({ callbackUrl, nonce: crypto.randomBytes(16).toString('hex') })
    const state = Buffer.from(stateData).toString('base64url')
    const url = getGitHubAuthURL(state)
    return NextResponse.redirect(url)
  } catch (error) {
    console.error('GitHub auth error:', error)
    return NextResponse.redirect(new URL('/login?error=OAuthConfigError', request.url))
  }
}
