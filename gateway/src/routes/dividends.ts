// ─── Normalized Dividends Route ────────────────────────────
// Serves dividend history data to the Next.js app.
// Source: brapi.dev provider with cache per ticker.

import { Router } from 'express'
import type { Request, Response } from 'express'
import { cache } from '../cache/index.js'
import { config } from '../config.js'
import {
  fetchDividends,
  getRateLimitStatus,
  type BrapiCashDividend,
} from '../providers/brapi-client.js'

const router = Router()

// GET /v1/dividends/:ticker
// Returns dividend history for a ticker
router.get('/:ticker', async (req: Request, res: Response) => {
  const ticker = (req.params['ticker'] as string | undefined)?.toUpperCase()

  if (!ticker) {
    return res.status(400).json({ error: 'Missing required parameter: ticker' })
  }

  try {
    const cacheKey = `dividends:${ticker}`
    const cached = cache.get<BrapiCashDividend[]>(cacheKey)

    if (cached) {
      return res.json({
        ticker,
        data: cached,
        source: 'cache',
        cached: true,
        count: cached.length,
        fetchedAt: new Date().toISOString(),
      })
    }

    const data = await fetchDividends(ticker)

    cache.set(cacheKey, data, config.cache.dividends)

    res.json({
      ticker,
      data,
      source: 'brapi',
      cached: false,
      count: data.length,
      rateLimit: getRateLimitStatus(),
      fetchedAt: new Date().toISOString(),
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error(`[dividends/${ticker}] Error:`, message)
    res.status(502).json({ error: 'Provider error', message })
  }
})

export { router as dividendsRoutes }
