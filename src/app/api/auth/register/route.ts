import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email e senha obrigatórios' }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Senha deve ter pelo menos 8 caracteres' }, { status: 400 })
    }

    const admin = createAdminClient()

    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirma — sem verificação por email
      user_metadata: {
        full_name: name || '',
        plan: 'pro', // Acesso antecipado — todos são Pro
      },
    })

    if (error) {
      if (error.message.includes('already') || error.message.includes('duplicate')) {
        return NextResponse.json({ error: 'Este email já está cadastrado' }, { status: 409 })
      }
      console.error('Register error:', error.message)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({
      user: {
        id: data.user.id,
        email: data.user.email,
        name: data.user.user_metadata?.['full_name'] || '',
      },
    })
  } catch (err) {
    console.error('Register unexpected error:', err)
    return NextResponse.json({ error: 'Erro interno ao criar conta' }, { status: 500 })
  }
}
