import { NextResponse } from 'next/server'

async function checkBackend(): Promise<boolean> {
  try {
    const apiUrl = process.env['NEXT_PUBLIC_API_URL'] || 'https://investiqbackend-production.up.railway.app'
    const res = await fetch(`${apiUrl}/health`, {
      signal: AbortSignal.timeout(5000),
    })
    return res.ok
  } catch {
    return false
  }
}

export async function GET() {
  const backendHealthy = await checkBackend()

  const status = backendHealthy ? 'ok' : 'degraded'

  return NextResponse.json({
    status,
    service: 'investiq-web',
    backend: backendHealthy ? 'ok' : 'down',
    timestamp: new Date().toISOString(),
  })
}
