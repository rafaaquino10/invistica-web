import { NextResponse } from 'next/server'
import { BACKEND_URL } from '@/lib/constants'

export async function GET() {
  const results: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    BACKEND_URL,
    INVESTIQ_API_URL: process.env['INVESTIQ_API_URL'] ?? 'NOT SET',
    NEXT_PUBLIC_API_BASE_URL: process.env['NEXT_PUBLIC_API_BASE_URL'] ?? 'NOT SET',
    DATABASE_URL: process.env['DATABASE_URL'] ? 'SET (hidden)' : 'NOT SET',
    ALLOW_DEMO: process.env['ALLOW_DEMO'] ?? 'NOT SET',
    NODE_ENV: process.env['NODE_ENV'] ?? 'NOT SET',
  }

  // Test 1: Direct fetch to backend
  try {
    const healthRes = await fetch(`${BACKEND_URL}/health`, { signal: AbortSignal.timeout(5000) })
    results.backendHealth = healthRes.ok ? 'OK' : `FAIL: ${healthRes.status}`
  } catch (err) {
    results.backendHealth = `ERROR: ${(err as Error).message}`
  }

  // Test 2: Screener fetch
  try {
    const screenerRes = await fetch(`${BACKEND_URL}/scores/screener?limit=3`, { signal: AbortSignal.timeout(10000) })
    if (screenerRes.ok) {
      const data = await screenerRes.json()
      results.screenerCount = data.count ?? data.results?.length ?? 0
      results.screenerFirst = data.results?.[0]?.ticker ?? 'NONE'
    } else {
      results.screenerStatus = `FAIL: ${screenerRes.status}`
    }
  } catch (err) {
    results.screenerError = `ERROR: ${(err as Error).message}`
  }

  // Test 3: getAssets pipeline
  try {
    const { getAssets } = await import('@/lib/data-source')
    const assets = await getAssets()
    results.getAssetsCount = assets.length
    results.getAssetsFirst = assets[0]?.ticker ?? 'NONE'
  } catch (err) {
    results.getAssetsError = `ERROR: ${(err as Error).message}`
  }

  return NextResponse.json(results)
}
