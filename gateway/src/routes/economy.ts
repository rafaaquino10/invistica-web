// ─── Economy Route ──────────────────────────────────────────
// Serves economic indicators: inflation (IPCA/IGP-M) and currency rates.
// Source: brapi.dev /api/v2/inflation and /api/v2/currency

import { Router } from 'express'
import type { Request, Response } from 'express'
import { cache } from '../cache/index.js'
import {
  fetchInflation,
  fetchCurrency,
  getRateLimitStatus,
} from '../providers/brapi-client.js'
import { getBcbIndicators, type BcbIndicators } from '../providers/bcb.js'
import { logger } from '../logger.js'

const CACHE_TTL = 24 * 60 * 60 * 1000 // 24h

const router = Router()

// GET /v1/economy/inflation — IPCA / IGP-M data
router.get('/inflation', async (_req: Request, res: Response) => {
  try {
    const cacheKey = 'economy:inflation'
    const cached = cache.get<any[]>(cacheKey)

    if (cached) {
      return res.json({ data: cached, source: 'cache', cached: true })
    }

    const data = await fetchInflation()
    cache.set(cacheKey, data, CACHE_TTL)

    res.json({
      data,
      source: 'brapi',
      cached: false,
      rateLimit: getRateLimitStatus(),
      fetchedAt: new Date().toISOString(),
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[economy/inflation] Error:', message)
    res.status(502).json({ error: 'Provider error', message })
  }
})

// GET /v1/economy/currency — USD/BRL, EUR/BRL
router.get('/currency', async (_req: Request, res: Response) => {
  try {
    const cacheKey = 'economy:currency'
    const cached = cache.get<any[]>(cacheKey)

    if (cached) {
      return res.json({ data: cached, source: 'cache', cached: true })
    }

    const data = await fetchCurrency('USD-BRL,EUR-BRL')
    cache.set(cacheKey, data, CACHE_TTL)

    res.json({
      data,
      source: 'brapi',
      cached: false,
      rateLimit: getRateLimitStatus(),
      fetchedAt: new Date().toISOString(),
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[economy/currency] Error:', message)
    res.status(502).json({ error: 'Provider error', message })
  }
})

// GET /v1/economy/macro — BCB macro indicators (SELIC, IPCA, CDI, USD, EUR)
router.get('/macro', async (_req: Request, res: Response) => {
  try {
    const indicators = await getBcbIndicators()
    if (!indicators) {
      return res.status(502).json({ error: 'BCB SGS unavailable' })
    }
    res.json({
      data: indicators,
      source: 'bcb',
      fetchedAt: new Date().toISOString(),
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    logger.error({ err }, '[economy/macro] Error')
    res.status(502).json({ error: 'BCB API error', message })
  }
})

export { router as economyRoutes }
