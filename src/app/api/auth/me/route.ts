import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json(null, { status: 401 })
  }

  return NextResponse.json({
    id: user.id,
    email: user.email,
    name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || '',
    image: user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
    plan: 'free',
    onboardingCompleted: true,
  })
}
