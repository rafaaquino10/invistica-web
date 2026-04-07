// ─── CVM Fundamentals Route ──────────────────────────────────────
// Serves calculated fundamental indicators derived from CVM official data.
// Same interface as unified fundamentals (FundamentalData).

import { Router } from 'express'
import { cache } from '../cache/index.js'
import { config } from '../config.js'
import { logger } from '../logger.js'
import type { FundamentalData } from '../types.js'
import {
  loadCvmData,
  loadCnpjTickerMap,
  getCvmFundamentals,
  isCvmStale,
  type MarketQuote,
} from '../providers/cvm-financials-client.js'

const router = Router()
const CACHE_KEY = 'fundamentals-cvm:all'

// ─── Helpers ────────────────────────────────────────────────────

/**
 * Build CVM fundamentals from cached data + current market quotes.
 * Market quotes are read from the quotes cache (populated by /v1/quotes/all).
 */
function buildCvmFundamentals(): FundamentalData[] {
  const cvmData = loadCvmData()
  const tickerMap = loadCnpjTickerMap()

  if (!cvmData || !tickerMap) {
    logger.warn('CVM data or ticker map not available')
    return []
  }

  // Get market quotes from cache (populated by quotes route)
  interface CachedQuote {
    stock: string
    close: number
    market_cap: number
  }
  const quotesCache = cache.getStale<CachedQuote[]>('quotes:all')
  if (!quotesCache || quotesCache.length === 0) {
    logger.warn('No quotes cache available for CVM indicator calculation')
    return []
  }

  // Build market quotes array
  const marketQuotes: MarketQuote[] = quotesCache
    .filter(q => q.close > 0 && q.market_cap > 0)
    .map(q => ({
      ticker: q.stock,
      price: q.close,
      marketCap: q.market_cap,
    }))

  return getCvmFundamentals(cvmData, tickerMap, marketQuotes)
}

// ─── Export functions for server.ts ─────────────────────────────

/**
 * Warm CVM fundamentals cache from disk on startup.
 */
export function warmCvmCache(): boolean {
  const cvmData = loadCvmData()
  if (cvmData && cvmData.companyCount > 0) {
    logger.info({ companies: cvmData.companyCount }, 'CVM data loaded from disk')
    return true
  }
  return false
}

/**
 * Check if CVM data needs refresh.
 */
export { isCvmStale } from '../providers/cvm-financials-client.js'

// ─── Routes ─────────────────────────────────────────────────────

// GET /v1/fundamentals-cvm/all
router.get('/all', (_req, res) => {
  try {
    // Try cache first (SWR pattern)
    const cached = cache.get<FundamentalData[]>(CACHE_KEY)
    if (cached) {
      return res.json({
        data: cached,
        source: 'cvm',
        cached: true,
        count: cached.length,
        fetchedAt: new Date().toISOString(),
      })
    }

    // Build from CVM data + market quotes
    const fundamentals = buildCvmFundamentals()

    if (fundamentals.length > 0) {
      cache.set(CACHE_KEY, fundamentals, config.cache.fundamentals)
    }

    res.json({
      data: fundamentals,
      source: 'cvm',
      cached: false,
      count: fundamentals.length,
      fetchedAt: new Date().toISOString(),
    })
  } catch (err) {
    logger.error({ err }, 'CVM fundamentals route error')
    res.status(500).json({ error: 'Failed to calculate CVM fundamentals' })
  }
})

// GET /v1/fundamentals-cvm?tickers=PETR4,VALE3
router.get('/', (req, res) => {
  try {
    const tickersParam = req.query['tickers'] as string | undefined
    if (!tickersParam) {
      return res.status(400).json({ error: 'tickers parameter required' })
    }

    const requestedTickers = new Set(tickersParam.split(',').map(t => t.trim().toUpperCase()))

    // Try to get from cache or calculate
    let all = cache.get<FundamentalData[]>(CACHE_KEY)
    if (!all) {
      all = buildCvmFundamentals()
      if (all.length > 0) {
        cache.set(CACHE_KEY, all, config.cache.fundamentals)
      }
    }

    const filtered = all.filter(f => requestedTickers.has(f.ticker))

    res.json({
      data: filtered,
      source: 'cvm',
      cached: !!cache.get(CACHE_KEY),
      count: filtered.length,
      totalAvailable: all.length,
      fetchedAt: new Date().toISOString(),
    })
  } catch (err) {
    logger.error({ err }, 'CVM fundamentals filtered route error')
    res.status(500).json({ error: 'Failed to get CVM fundamentals' })
  }
})

// GET /v1/fundamentals-cvm/status
router.get('/status', (_req, res) => {
  const cvmData = loadCvmData()
  const tickerMap = loadCnpjTickerMap()

  res.json({
    hasData: !!cvmData,
    isStale: isCvmStale(),
    companyCount: cvmData?.companyCount ?? 0,
    yearsAvailable: cvmData?.yearsAvailable ?? [],
    lastUpdate: cvmData?.updatedAt ?? null,
    tickerMapCount: tickerMap?.count ?? 0,
  })
})

export { router as cvmFundamentalsRoutes }
