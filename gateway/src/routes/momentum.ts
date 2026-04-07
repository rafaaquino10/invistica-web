// ─── Momentum Routes ─────────────────────────────────────────
// 3-layer momentum engine: Macro → Sector → Asset.
// GET /v1/momentum/macro — market-level signal
// GET /v1/momentum/pulse — market pulse summary
// GET /v1/momentum/:ticker — full momentum for a ticker

import { Router } from 'express'
import type { Request, Response } from 'express'
import { cache } from '../cache/index.js'
import { fetchHistory, fetchQuotes } from '../providers/brapi-client.js'
import {
  calculateTechnicalData,
  calculateMacroSignal,
  calculateSectorSignal,
  calculateAssetSignal,
  calculateMomentum,
} from '../momentum/index.js'
import type {
  MacroSignal,
  PredictionInput,
  HistoricalPrice,
} from '../momentum/index.js'

const router = Router()

const MACRO_CACHE_KEY = 'momentum:macro'
const MACRO_CACHE_TTL = 5 * 60 * 1000 // 5 min
const TICKER_CACHE_TTL = 5 * 60 * 1000 // 5 min

// ─── Helpers ─────────────────────────────────────────────────

/**
 * Get cached macro signal or compute fresh.
 */
async function getMacroSignal(): Promise<MacroSignal> {
  const cached = cache.get<MacroSignal>(MACRO_CACHE_KEY)
  if (cached) return cached

  // Predictions removed (Kalshi US data irrelevant for BR market)
  const predictions: PredictionInput[] = []

  // Get IBOV technical data
  let ibovTechnical = { price: 130000, mm200: null as number | null, change30d: null as number | null }
  try {
    const ibovHistory = await fetchHistory('^BVSP', '1y', '1d')
    if (ibovHistory.length > 0) {
      const closes = ibovHistory.map(h => h.close)
      const latest = closes[closes.length - 1]!
      const mm200 = closes.length >= 200
        ? closes.slice(-200).reduce((s, v) => s + v, 0) / 200
        : null

      ibovTechnical = { price: latest, mm200, change30d: null }
    }
  } catch {
    // Use fallback
  }

  const macroSignal = calculateMacroSignal(predictions, ibovTechnical)
  cache.set(MACRO_CACHE_KEY, macroSignal, MACRO_CACHE_TTL)
  return macroSignal
}

/**
 * Convert brapi history to internal format.
 */
function toHistoricalPrices(data: Array<{ date: number; close: number; volume: number }>): HistoricalPrice[] {
  return data.map(d => ({ date: d.date, close: d.close, volume: d.volume }))
}

// ─── Routes ──────────────────────────────────────────────────

// GET /v1/momentum/macro
router.get('/macro', async (_req: Request, res: Response) => {
  try {
    const macro = await getMacroSignal()
    res.json({ data: macro, source: cache.get(MACRO_CACHE_KEY) ? 'cache' : 'live' })
  } catch (err) {
    console.error('[momentum/macro] Error:', (err as Error).message)
    res.json({
      data: { signal: 0, label: 'NEUTRO', factors: [] },
      source: 'fallback',
    })
  }
})

// GET /v1/momentum/pulse — market summary
router.get('/pulse', async (_req: Request, res: Response) => {
  try {
    const macro = await getMacroSignal()

    // Get all quotes for sector rotation
    const quotesData = cache.get<any[]>('quotes:all') ?? []
    const sectorMap = new Map<string, Array<{ ticker: string; changePercent: number }>>()

    for (const q of quotesData) {
      const sector = (q['sector'] ?? 'Outros') as string
      if (!sectorMap.has(sector)) sectorMap.set(sector, [])
      sectorMap.get(sector)!.push({
        ticker: q['symbol'] ?? '',
        changePercent: q['regularMarketChangePercent'] ?? 0,
      })
    }

    // Calculate sector signals
    const sectorSignals: Array<{ sector: string; signal: number; label: string }> = []
    for (const [sector, stocks] of sectorMap) {
      if (stocks.length < 3) continue
      const ss = calculateSectorSignal(sector, macro, stocks)
      sectorSignals.push({ sector, signal: ss.signal, label: ss.label })
    }

    sectorSignals.sort((a, b) => b.signal - a.signal)

    res.json({
      data: {
        macro,
        topBullSectors: sectorSignals.filter(s => s.signal > 0.2).slice(0, 5),
        topBearSectors: sectorSignals.filter(s => s.signal < -0.2).slice(-5).reverse(),
        sectorCount: sectorSignals.length,
      },
      source: 'live',
    })
  } catch (err) {
    console.error('[momentum/pulse] Error:', (err as Error).message)
    res.status(500).json({ error: 'Failed to compute market pulse' })
  }
})

// GET /v1/momentum/:ticker
router.get('/:ticker', async (req: Request, res: Response) => {
  const ticker = (req.params['ticker'] as string | undefined)?.toUpperCase()
  if (!ticker) {
    return res.status(400).json({ error: 'Missing ticker' })
  }

  const tickerCacheKey = `momentum:${ticker}`
  const cached = cache.get<any>(tickerCacheKey)
  if (cached) {
    return res.json({ data: cached, source: 'cache' })
  }

  try {
    // 1. Macro signal (shared, cached)
    const macro = await getMacroSignal()

    // 2. Get asset technical data
    let technicalData = {
      mm200: null as number | null,
      mm50: null as number | null,
      beta: null as number | null,
      avgVolume2m: null as number | null,
      todayVolume: null as number | null,
      high52w: null as number | null,
      low52w: null as number | null,
      price: 0,
    }

    try {
      const history = await fetchHistory(ticker, '1y', '1d')
      if (history.length > 0) {
        technicalData = calculateTechnicalData(toHistoricalPrices(history))
      }
    } catch {
      // Technical data unavailable
    }

    // 3. Get current quote for sector + change
    let sector = 'Outros'
    let changePercent = 0
    const quotesData = cache.get<any[]>('quotes:all') ?? []
    const quote = quotesData.find((q: any) => (q['symbol'] ?? '').toUpperCase() === ticker)
    if (quote) {
      sector = quote['sector'] ?? 'Outros'
      changePercent = quote['regularMarketChangePercent'] ?? 0
      if (technicalData.price === 0) {
        technicalData.price = quote['regularMarketPrice'] ?? 0
      }
    }

    // 4. Sector signal
    const sectorStocks = quotesData
      .filter((q: any) => (q['sector'] ?? '') === sector)
      .map((q: any) => ({
        ticker: q['symbol'] ?? '',
        changePercent: q['regularMarketChangePercent'] ?? 0,
      }))
    const sectorSignal = calculateSectorSignal(sector, macro, sectorStocks)

    // 5. Score history (from score snapshot cache)
    const scoreHistory = { current: 0, previous30d: null as number | null }
    // Score data comes from Next.js side — not directly available in gateway.
    // The gateway returns what it can; the Next.js side can augment with score history.

    // 6. Asset signal
    const assetSignal = calculateAssetSignal(technicalData, scoreHistory, changePercent)

    // 7. Combine
    const result = calculateMomentum(macro, sectorSignal, assetSignal)

    cache.set(tickerCacheKey, result, TICKER_CACHE_TTL)
    res.json({ data: result, source: 'live' })
  } catch (err) {
    console.error(`[momentum/${ticker}] Error:`, (err as Error).message)
    res.status(500).json({ error: 'Failed to compute momentum' })
  }
})

export { router as momentumRoutes }
