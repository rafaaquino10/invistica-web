import { NextRequest, NextResponse } from 'next/server'
import { loginWithEmail } from '@/lib/auth/credentials'
import { signJWT } from '@/lib/auth/jwt'
import { setAuthCookie } from '@/lib/auth/cookies'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email e senha são obrigatórios' },
        { status: 400 }
      )
    }

    const user = await loginWithEmail(email, password)

    if (!user) {
      return NextResponse.json(
        { error: 'Email ou senha incorretos' },
        { status: 401 }
      )
    }

    const token = await signJWT({
      userId: user.id,
      email: user.email,
      name: user.name,
      image: user.image,
      plan: user.plan,
      onboardingCompleted: user.onboardingCompleted,
      themePreference: user.themePreference,
    })

    await setAuthCookie(token)

    return NextResponse.json({ ok: true, user })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Erro ao fazer login. Tente novamente.' },
      { status: 500 }
    )
  }
}
