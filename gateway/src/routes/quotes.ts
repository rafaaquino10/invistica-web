// ─── Normalized Quotes Route ───────────────────────────────
// Serves unified quote data to the Next.js app.
// Source: brapi.dev provider with per-ticker cache.

import { Router } from 'express'
import type { Request, Response } from 'express'
import { cache } from '../cache/index.js'
import { config } from '../config.js'
import { readJsonFile, writeJsonFile } from '../persistence/index.js'
import { logger } from '../logger.js'
import {
  fetchQuotes,
  fetchQuotesList,
  getRateLimitStatus,
  type BrapiQuote,
  type BrapiListStock,
} from '../providers/brapi-client.js'

const router = Router()
const QUOTES_DISK_FILE = 'quotes-snapshot.json'

interface QuotesSnapshot {
  version: number
  fetchedAt: string
  count: number
  data: BrapiListStock[]
}

/** Persist quotes to disk for fast recovery after restart */
function persistQuotes(data: BrapiListStock[]): void {
  if (data.length < 50) return // Don't persist garbage
  writeJsonFile<QuotesSnapshot>(QUOTES_DISK_FILE, {
    version: 1,
    fetchedAt: new Date().toISOString(),
    count: data.length,
    data,
  })
}

/** Warm quotes cache from disk. Call at startup before backgroundRefresh. */
export function warmQuotesCache(): boolean {
  const snapshot = readJsonFile<QuotesSnapshot>(QUOTES_DISK_FILE)
  if (!snapshot?.data?.length) return false
  cache.set('quotes:all', snapshot.data, config.cache.quotes)
  logger.info(`[quotes] Warmed from disk: ${snapshot.data.length} stocks (from ${snapshot.fetchedAt})`)
  return true
}

// GET /v1/quotes?tickers=PETR4,VALE3,...
// Returns detailed quotes for specific tickers (with cache)
router.get('/', async (req: Request, res: Response) => {
  const tickers = (req.query['tickers'] as string)
    ?.toUpperCase()
    .split(',')
    .filter(Boolean)

  if (!tickers?.length) {
    return res.status(400).json({ error: 'Missing required parameter: tickers' })
  }

  try {
    const cached: Record<string, BrapiQuote> = {}
    const misses: string[] = []

    for (const ticker of tickers) {
      const entry = cache.get<BrapiQuote>(`quote:${ticker}`)
      if (entry) {
        cached[ticker] = entry
      } else {
        misses.push(ticker)
      }
    }

    if (misses.length > 0) {
      const freshQuotes = await fetchQuotes(misses)
      for (const q of freshQuotes) {
        cache.set(`quote:${q.symbol}`, q, config.cache.quotes)
        cached[q.symbol] = q
      }
    }

    const data = tickers.map(t => cached[t]).filter(Boolean)

    res.json({
      data,
      source: misses.length > 0 ? 'brapi' : 'cache',
      cached: misses.length === 0,
      count: data.length,
      rateLimit: getRateLimitStatus(),
      fetchedAt: new Date().toISOString(),
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[quotes] Error:', message)
    res.status(502).json({ error: 'Provider error', message })
  }
})

// GET /v1/quotes/all
// Returns basic quotes for ALL stocks with SWR caching
router.get('/all', async (_req: Request, res: Response) => {
  try {
    const cacheKey = 'quotes:all'

    const stocks = await cache.getOrRevalidate<BrapiListStock[]>(
      cacheKey,
      config.cache.quotes,
      async () => {
        const data = await fetchQuotesList({ type: 'stock', limit: 100 })
        // Also cache individual stock entries for quick lookup
        for (const s of data) {
          cache.set(`list:${s.stock}`, s, config.cache.quotes)
        }
        // Persist to disk for fast recovery after restart
        persistQuotes(data)
        return data
      },
      config.cache.quotes * 6 // 30 min max stale (6x 5min)
    )

    res.json({
      data: stocks,
      source: cache.isStale(cacheKey) ? 'brapi' : 'cache',
      cached: cache.has(cacheKey),
      count: stocks.length,
      rateLimit: getRateLimitStatus(),
      fetchedAt: new Date().toISOString(),
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[quotes/all] Error:', message)
    res.status(502).json({ error: 'Provider error', message })
  }
})

export { router as quotesRoutes }
