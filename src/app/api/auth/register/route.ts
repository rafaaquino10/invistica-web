import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma, isDemoMode } from '@/lib/prisma'
import { signJWT } from '@/lib/auth/jwt'
import { setAuthCookie } from '@/lib/auth/cookies'

export async function POST(request: NextRequest) {
  if (isDemoMode) {
    return NextResponse.json(
      { error: 'Registro não disponível no modo demo' },
      { status: 400 }
    )
  }

  try {
    const { name, email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email e senha são obrigatórios' },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'A senha deve ter no mínimo 8 caracteres' },
        { status: 400 }
      )
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json(
        { error: 'Este email já está cadastrado' },
        { status: 409 }
      )
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    const user = await prisma.user.create({
      data: {
        name: name || null,
        email,
        password: hashedPassword,
        plan: 'free',
      },
    })

    // Create default portfolio
    await prisma.portfolio.create({
      data: {
        userId: user.id,
        name: 'Minha Carteira',
        description: 'Carteira principal',
        isDefault: true,
      },
    })

    // Auto-login: create JWT and set cookie
    const token = await signJWT({
      userId: user.id,
      email: user.email!,
      name: user.name,
      image: user.image,
      plan: 'free',
      onboardingCompleted: false,
      themePreference: 'system',
    })

    await setAuthCookie(token)

    return NextResponse.json({ success: true, user: { id: user.id, email: user.email } })
  } catch (error) {
    console.error('Register error:', error)
    return NextResponse.json(
      { error: 'Erro ao criar conta. Tente novamente.' },
      { status: 500 }
    )
  }
}
