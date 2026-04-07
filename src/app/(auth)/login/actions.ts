'use server'

import { redirect } from 'next/navigation'
import { signJWT } from '@/lib/auth/jwt'
import { setAuthCookie } from '@/lib/auth/cookies'
import { DEMO_USER } from '@/lib/auth/demo-user'

export async function demoLogin() {
  if (process.env.NODE_ENV !== 'development' && process.env['ALLOW_DEMO'] !== 'true') {
    redirect('/login')
  }

  const token = await signJWT({
    userId: DEMO_USER.id,
    email: DEMO_USER.email,
    name: DEMO_USER.name,
    image: DEMO_USER.image,
    plan: DEMO_USER.plan,
    onboardingCompleted: DEMO_USER.onboardingCompleted,
    themePreference: DEMO_USER.themePreference,
  })

  await setAuthCookie(token)
  redirect('/explorer')
}
