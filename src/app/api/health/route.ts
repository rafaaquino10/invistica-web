import { NextResponse } from 'next/server'
import { isDemoMode } from '@/lib/prisma'

async function checkGateway(): Promise<boolean> {
  try {
    const gatewayUrl = process.env['GATEWAY_URL'] || 'http://localhost:4000'
    const res = await fetch(`${gatewayUrl}/health`, {
      signal: AbortSignal.timeout(3000),
    })
    return res.ok
  } catch {
    return false
  }
}

async function checkDatabase(): Promise<boolean> {
  if (isDemoMode) return true // demo mode — no DB needed
  try {
    const { prisma } = await import('@/lib/prisma')
    await prisma.$queryRaw`SELECT 1`
    return true
  } catch {
    return false
  }
}

export async function GET() {
  const [gatewayHealthy, dbHealthy] = await Promise.all([
    checkGateway(),
    checkDatabase(),
  ])

  const status = gatewayHealthy && dbHealthy ? 'ok' : 'degraded'

  return NextResponse.json({
    status,
    service: 'investiq-web',
    gateway: gatewayHealthy ? 'ok' : 'down',
    database: dbHealthy ? 'ok' : (isDemoMode ? 'demo' : 'down'),
    demoMode: isDemoMode,
    timestamp: new Date().toISOString(),
  }, {
    status: status === 'ok' ? 200 : 200, // Still return 200 for degraded (uptime monitors can check JSON)
  })
}
