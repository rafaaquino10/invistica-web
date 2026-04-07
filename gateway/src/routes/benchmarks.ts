// ─── Benchmarks Route ───────────────────────────────────────
// Real SELIC/CDI rates from BCB + IBOV from brapi
// Cached for 1 hour — rates rarely change intraday

import { Router } from 'express'
import { cache } from '../cache/index.js'
import { config } from '../config.js'

const router = Router()

interface BenchmarkData {
  selic: { rate: number; date: string }
  cdi: { annualRate: number; dailyRate: number }
  ibov: { points: number; change: number }
  updatedAt: string
}

const CACHE_KEY = 'benchmarks:latest'
const CACHE_TTL = 60 * 60 * 1000 // 1 hour

// Fallback rates (updated periodically)
const FALLBACK: BenchmarkData = {
  selic: { rate: 13.25, date: '' },
  cdi: { annualRate: 0.1315, dailyRate: 0.1315 / 252 },
  ibov: { points: 130000, change: 0 },
  updatedAt: '',
}

// GET /v1/benchmarks
router.get('/', async (_req, res) => {
  const cached = cache.get<BenchmarkData>(CACHE_KEY)
  if (cached) {
    return res.json({ data: cached, source: 'cache' })
  }

  try {
    const benchmarks = await fetchBenchmarksFromAPIs()
    cache.set(CACHE_KEY, benchmarks, CACHE_TTL)
    res.json({ data: benchmarks, source: 'live' })
  } catch (err) {
    console.error('[benchmarks] Error:', (err as Error).message)
    res.json({ data: FALLBACK, source: 'fallback' })
  }
})

async function fetchBenchmarksFromAPIs(): Promise<BenchmarkData> {
  // 1. Fetch SELIC meta from BCB SGS API (series 432)
  let selicRate = FALLBACK.selic.rate
  let selicDate = ''

  try {
    const selicRes = await fetch(
      'https://api.bcb.gov.br/dados/serie/bcdata.sgs.432/dados/ultimos/1?formato=json',
      { signal: AbortSignal.timeout(5000) }
    )
    if (selicRes.ok) {
      const data = (await selicRes.json()) as Array<{ data: string; valor: string }>
      if (data[0]) {
        selicRate = parseFloat(data[0].valor)
        selicDate = data[0].data
        console.log(`[benchmarks] SELIC from BCB: ${selicRate}% (${selicDate})`)
      }
    }
  } catch (err) {
    console.warn('[benchmarks] BCB SELIC fetch failed:', (err as Error).message)
  }

  // CDI tracks SELIC closely
  const cdiAnnual = selicRate / 100
  const cdiDaily = cdiAnnual / 252

  // 2. Fetch IBOV from brapi (^BVSP)
  let ibovPoints = FALLBACK.ibov.points
  let ibovChange = 0

  if (config.brapi.token) {
    try {
      const ibovRes = await fetch(
        `${config.brapi.baseUrl}/api/quote/%5EBVSP?token=${config.brapi.token}`,
        { signal: AbortSignal.timeout(5000) }
      )
      if (ibovRes.ok) {
        const ibovData = (await ibovRes.json()) as {
          results?: Array<{
            regularMarketPrice?: number
            regularMarketChangePercent?: number
          }>
        }
        const result = ibovData.results?.[0]
        if (result?.regularMarketPrice) {
          ibovPoints = result.regularMarketPrice
          ibovChange = result.regularMarketChangePercent ?? 0
          console.log(`[benchmarks] IBOV from brapi: ${ibovPoints.toFixed(0)} pts (${ibovChange >= 0 ? '+' : ''}${ibovChange.toFixed(2)}%)`)
        }
      }
    } catch (err) {
      console.warn('[benchmarks] brapi IBOV fetch failed:', (err as Error).message)
    }
  }

  return {
    selic: { rate: selicRate, date: selicDate },
    cdi: { annualRate: cdiAnnual, dailyRate: cdiDaily },
    ibov: { points: ibovPoints, change: ibovChange },
    updatedAt: new Date().toISOString(),
  }
}

export { router as benchmarksRoutes }
