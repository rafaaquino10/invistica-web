import { NextResponse } from 'next/server'
import { isDemoMode } from '@/lib/prisma'
import { BACKEND_URL } from '@/lib/constants'

async function checkBackend(): Promise<boolean> {
  try {
    const res = await fetch(`${BACKEND_URL}/health`, {
      signal: AbortSignal.timeout(5000),
    })
    return res.ok
  } catch {
    return false
  }
}

async function checkDatabase(): Promise<boolean> {
  if (isDemoMode) return true
  try {
    const { prisma } = await import('@/lib/prisma')
    await prisma.$queryRaw`SELECT 1`
    return true
  } catch {
    return false
  }
}

export async function GET() {
  const [backendHealthy, dbHealthy] = await Promise.all([
    checkBackend(),
    checkDatabase(),
  ])

  const status = backendHealthy && dbHealthy ? 'ok' : 'degraded'

  return NextResponse.json({
    status,
    service: 'investiq-web',
    backend: backendHealthy ? 'ok' : 'down',
    database: dbHealthy ? 'ok' : (isDemoMode ? 'demo' : 'down'),
    demoMode: isDemoMode,
    timestamp: new Date().toISOString(),
  })
}
