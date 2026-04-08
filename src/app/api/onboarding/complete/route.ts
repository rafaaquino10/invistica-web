import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { DEMO_USER } from '@/lib/auth/demo-user'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user?.id) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const { investorProfile, sectors, goal } = await request.json()

    // Validate required fields
    if (!investorProfile || !sectors || !Array.isArray(sectors) || sectors.length === 0 || !goal) {
      return NextResponse.json(
        { error: 'Dados incompletos' },
        { status: 400 }
      )
    }

    // Skip DB update for demo user only
    if (user.email === DEMO_USER.email) {
      return NextResponse.json({ ok: true })
    }

    // Persist to database
    await prisma.user.update({
      where: { id: user.id },
      data: {
        investorProfile,
        onboardingCompleted: true,
      },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Onboarding complete error:', error)
    return NextResponse.json(
      { error: 'Erro ao salvar preferências. Tente novamente.' },
      { status: 500 }
    )
  }
}
