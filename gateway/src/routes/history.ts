// ─── Normalized History Route ──────────────────────────────
// Serves historical price data to the Next.js app.
// Source: brapi.dev provider with cache per ticker+range.

import { Router } from 'express'
import type { Request, Response } from 'express'
import { cache } from '../cache/index.js'
import { config } from '../config.js'
import {
  fetchHistory,
  getRateLimitStatus,
  type BrapiHistoricalPrice,
} from '../providers/brapi-client.js'

const VALID_RANGES = ['1d', '5d', '1mo', '3mo', '6mo', '1y', '2y', '5y', '10y', 'ytd', 'max']
const VALID_INTERVALS = ['1m', '2m', '5m', '15m', '30m', '60m', '90m', '1h', '1d', '5d', '1wk', '1mo']
const INTRADAY_INTERVALS = new Set(['1m', '2m', '5m', '15m', '30m', '60m', '90m', '1h'])
const INTRADAY_RANGES = new Set(['1d', '5d'])

const router = Router()

// GET /v1/history/:ticker?range=1mo&interval=1d
// Returns OHLCV historical data
router.get('/:ticker', async (req: Request, res: Response) => {
  const ticker = (req.params['ticker'] as string | undefined)?.toUpperCase()
  const range = (req.query['range'] as string) ?? '1mo'
  const interval = (req.query['interval'] as string) ?? '1d'

  if (!ticker) {
    return res.status(400).json({ error: 'Missing required parameter: ticker' })
  }

  if (!VALID_RANGES.includes(range)) {
    return res.status(400).json({
      error: 'Invalid range',
      valid: VALID_RANGES,
    })
  }

  if (!VALID_INTERVALS.includes(interval)) {
    return res.status(400).json({
      error: 'Invalid interval',
      valid: VALID_INTERVALS,
    })
  }

  if (INTRADAY_INTERVALS.has(interval) && !INTRADAY_RANGES.has(range)) {
    return res.status(400).json({
      error: 'Intervalos intraday só suportam range 1d ou 5d',
      validRanges: ['1d', '5d'],
    })
  }

  try {
    const cacheKey = `history:${ticker}:${range}:${interval}`
    const cached = cache.get<BrapiHistoricalPrice[]>(cacheKey)

    if (cached) {
      return res.json({
        ticker,
        range,
        interval,
        data: cached,
        source: 'cache',
        cached: true,
        count: cached.length,
        fetchedAt: new Date().toISOString(),
      })
    }

    const data = await fetchHistory(ticker, range, interval)

    cache.set(cacheKey, data, config.cache.history)

    res.json({
      ticker,
      range,
      interval,
      data,
      source: 'brapi',
      cached: false,
      count: data.length,
      rateLimit: getRateLimitStatus(),
      fetchedAt: new Date().toISOString(),
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error(`[history/${ticker}] Error:`, message)
    res.status(502).json({ error: 'Provider error', message })
  }
})

export { router as historyRoutes }
