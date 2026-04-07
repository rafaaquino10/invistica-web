import { NextRequest, NextResponse } from 'next/server'
import { getGoogleAuthURL } from '@/lib/auth/oauth-google'
import crypto from 'crypto'

export async function GET(request: NextRequest) {
  const callbackUrl = request.nextUrl.searchParams.get('callbackUrl') || '/dashboard'

  try {
    // Generate state with embedded callbackUrl
    const stateData = JSON.stringify({ callbackUrl, nonce: crypto.randomBytes(16).toString('hex') })
    const state = Buffer.from(stateData).toString('base64url')
    const url = getGoogleAuthURL(state)
    return NextResponse.redirect(url)
  } catch (error) {
    console.error('Google auth error:', error)
    return NextResponse.redirect(new URL('/login?error=OAuthConfigError', request.url))
  }
}
