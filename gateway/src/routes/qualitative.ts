// ─── Qualitative Analysis Route ────────────────────────────────────
// Serves qualitative metrics calculated from existing CVM data.
// No new data sources — all derived from DFP/ITR already downloaded.

import { Router } from 'express'
import type { Request, Response } from 'express'
import { cache } from '../cache/index.js'
import { logger } from '../logger.js'
import { readJsonFile, writeJsonFile } from '../persistence/index.js'
import { loadCvmData, loadCnpjTickerMap, type MarketQuote } from '../providers/cvm-financials-client.js'
import { calculateAllQualitativeMetrics, type QualitativeMetrics } from '../providers/qualitative-engine.js'

const router = Router()

const CACHE_KEY = 'qualitative:all'
const DISK_FILE = 'qualitative-metrics.json'

interface QualitativeSnapshot {
  version: number
  fetchedAt: string
  count: number
  data: QualitativeMetrics[]
}

function persistQualitative(data: QualitativeMetrics[]): void {
  if (data.length < 20) return
  writeJsonFile<QualitativeSnapshot>(DISK_FILE, {
    version: 1,
    fetchedAt: new Date().toISOString(),
    count: data.length,
    data,
  })
}

function loadFromDisk(): QualitativeMetrics[] | null {
  const snapshot = readJsonFile<QualitativeSnapshot>(DISK_FILE)
  if (!snapshot?.data?.length) return null
  return snapshot.data
}

/**
 * Build qualitative metrics from CVM data + market quotes.
 */
function buildQualitativeMetrics(): QualitativeMetrics[] {
  interface CachedQuote {
    stock: string
    close: number
    market_cap: number
  }
  const quotesCache = cache.getStale<CachedQuote[]>('quotes:all')
  if (!quotesCache || quotesCache.length === 0) {
    logger.warn('[qualitative] No quotes cache — cannot calculate metrics')
    return []
  }

  const cvmData = loadCvmData()
  const tickerMap = loadCnpjTickerMap()
  if (!cvmData || !tickerMap) {
    logger.warn('[qualitative] No CVM data or ticker map available')
    return []
  }

  const marketQuotes: MarketQuote[] = quotesCache
    .filter(q => q.close > 0 && q.market_cap > 0)
    .map(q => ({ ticker: q.stock, price: q.close, marketCap: q.market_cap }))

  // Build sector map from quotes cache (brapi provides sector)
  interface QuoteWithSector { stock: string; sector?: string }
  const quotesWithSector = quotesCache as unknown as QuoteWithSector[]
  const sectorMap = new Map<string, string>()
  for (const q of quotesWithSector) {
    if (q.sector) sectorMap.set(q.stock, q.sector)
  }

  const metricsMap = calculateAllQualitativeMetrics(
    cvmData.companies,
    tickerMap.mappings,
    marketQuotes,
    sectorMap,
  )

  return Array.from(metricsMap.values())
}

// ─── Exported helpers ───────────────────────────────────────────

export function warmQualitativeCache(): boolean {
  const diskData = loadFromDisk()
  if (diskData && diskData.length > 0) {
    cache.set(CACHE_KEY, diskData, 30 * 60 * 1000) // 30min TTL
    logger.info(`[qualitative] Warmed from disk: ${diskData.length} tickers`)
    return true
  }
  return false
}

export function refreshQualitativeCache(): QualitativeMetrics[] {
  const data = buildQualitativeMetrics()
  if (data.length > 0) {
    cache.set(CACHE_KEY, data, 30 * 60 * 1000)
    persistQualitative(data)
  }
  return data
}

/**
 * Get qualitative metrics map (ticker → metrics) from cache.
 * Used by fundamentals-unified to merge into FundamentalData.
 */
export function getQualitativeMap(): Map<string, QualitativeMetrics> {
  const cached = cache.getStale<QualitativeMetrics[]>(CACHE_KEY)
  const map = new Map<string, QualitativeMetrics>()
  if (cached) {
    for (const m of cached) {
      map.set(m.ticker, m)
    }
  }
  return map
}

// ─── Routes ─────────────────────────────────────────────────────

// GET /v1/qualitative/all — all qualitative metrics
router.get('/all', (_req: Request, res: Response) => {
  try {
    let cached = cache.get<QualitativeMetrics[]>(CACHE_KEY)
    if (cached) {
      return res.json({
        data: cached,
        source: 'qualitative-engine',
        cached: true,
        count: cached.length,
        fetchedAt: new Date().toISOString(),
      })
    }

    let data = buildQualitativeMetrics()
    if (data.length > 0) {
      cache.set(CACHE_KEY, data, 30 * 60 * 1000)
      persistQualitative(data)
    } else {
      const diskData = loadFromDisk()
      if (diskData && diskData.length > 0) {
        data = diskData
        cache.set(CACHE_KEY, data, 30 * 60 * 1000)
      }
    }

    res.json({
      data,
      source: 'qualitative-engine',
      cached: false,
      count: data.length,
      fetchedAt: new Date().toISOString(),
    })
  } catch (err) {
    logger.error({ err }, 'Qualitative route error')
    const fallback = cache.getStale<QualitativeMetrics[]>(CACHE_KEY) ?? loadFromDisk()
    if (fallback && fallback.length > 0) {
      return res.json({
        data: fallback,
        source: 'qualitative-engine',
        cached: true,
        count: fallback.length,
        fetchedAt: new Date().toISOString(),
      })
    }
    res.status(500).json({ error: 'Failed to build qualitative metrics' })
  }
})

// GET /v1/qualitative?tickers=PETR4,VALE3,...
router.get('/', (req: Request, res: Response) => {
  const tickers = (req.query['tickers'] as string)
    ?.toUpperCase()
    .split(',')
    .filter(Boolean)

  if (!tickers?.length) {
    return res.status(400).json({ error: 'Missing required parameter: tickers' })
  }

  try {
    let all = cache.get<QualitativeMetrics[]>(CACHE_KEY)
    if (!all) {
      all = buildQualitativeMetrics()
      if (all.length > 0) {
        cache.set(CACHE_KEY, all, 30 * 60 * 1000)
      }
    }

    const tickerSet = new Set(tickers)
    const data = all.filter(d => tickerSet.has(d.ticker))

    res.json({
      data,
      source: 'qualitative-engine',
      cached: true,
      count: data.length,
      totalAvailable: all.length,
      fetchedAt: new Date().toISOString(),
    })
  } catch (err) {
    logger.error({ err }, 'Qualitative filtered route error')
    res.status(500).json({ error: 'Failed to get qualitative metrics' })
  }
})

// GET /v1/qualitative/:ticker — single ticker detail
router.get('/:ticker', (req: Request, res: Response) => {
  const ticker = (req.params['ticker'] as string)?.toUpperCase()
  if (!ticker) {
    return res.status(400).json({ error: 'Missing ticker parameter' })
  }

  try {
    let all = cache.getStale<QualitativeMetrics[]>(CACHE_KEY)
    if (!all) {
      all = buildQualitativeMetrics()
      if (all.length > 0) {
        cache.set(CACHE_KEY, all, 30 * 60 * 1000)
      }
    }

    const metrics = all?.find(d => d.ticker === ticker)
    if (!metrics) {
      return res.status(404).json({ error: `No qualitative data for ${ticker}` })
    }

    res.json({
      data: metrics,
      source: 'qualitative-engine',
      fetchedAt: new Date().toISOString(),
    })
  } catch (err) {
    logger.error({ err, ticker }, 'Qualitative single ticker route error')
    res.status(500).json({ error: 'Failed to get qualitative metrics' })
  }
})

export { router as qualitativeRoutes }
