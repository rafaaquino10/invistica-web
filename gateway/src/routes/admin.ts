// ─── Admin Routes ─────────────────────────────────────────────
// Manual triggers for maintenance operations.
// These are NOT exposed publicly — use only for local/dev admin.

import { Router } from 'express'
import { cache } from '../cache/index.js'
import { rescrapeAllModules } from '../providers/modules-client.js'
import { refreshCvmData } from '../providers/cvm-financials-client.js'
import { refreshQualitativeCache } from './qualitative.js'
import { refreshUnifiedCache } from './fundamentals-unified.js'
import { logger } from '../logger.js'

export const adminRoutes = Router()

const DELAY_MS = 700 // same as modules-client

/**
 * POST /v1/admin/rescrape-modules
 * Triggers a FULL rescrape of brapi modules for all tickers.
 * Responds immediately with 202, scrape runs in background.
 */
adminRoutes.post('/rescrape-modules', (_req, res) => {
  interface CachedQuote { stock: string; close: number; market_cap: number }
  const quotesCache = cache.getStale<CachedQuote[]>('quotes:all')

  if (!quotesCache?.length) {
    res.status(400).json({
      error: 'No quotes cache available. Start the gateway and wait for quotes to load first.',
    })
    return
  }

  const allTickers = quotesCache.map(q => q.stock)
  const priceMap = new Map<string, number>()
  const marketCapMap = new Map<string, number>()
  for (const q of quotesCache) {
    if (q.close > 0) priceMap.set(q.stock, q.close)
    if (q.market_cap > 0) marketCapMap.set(q.stock, q.market_cap)
  }

  // Estimativa: 2 requests por ticker (modules + dividends), 700ms delay
  const estimatedMinutes = Math.ceil((allTickers.length * 2 * DELAY_MS) / 60000)

  logger.info(`[admin] Rescrape triggered for ${allTickers.length} tickers (est. ${estimatedMinutes} min)`)

  // Inicia em background (fire-and-forget)
  rescrapeAllModules(allTickers, priceMap, marketCapMap).catch(err => {
    logger.error({ err }, '[admin] Rescrape failed')
  })

  res.status(202).json({
    message: 'Rescrape iniciado em background',
    tickersToScrape: allTickers.length,
    estimatedMinutes,
  })
})

/**
 * POST /v1/admin/refresh-cvm
 * Força re-download dos DFPs da CVM (6 anos), re-parse, e rebuild do qualitative + unified.
 * Demora ~2-3 minutos (download de ~6 ZIPs de ~30MB cada).
 */
adminRoutes.post('/refresh-cvm', async (_req, res) => {
  interface CachedQuote { stock: string; name?: string; close: number; market_cap: number }
  const quotesCache = cache.getStale<CachedQuote[]>('quotes:all')

  if (!quotesCache?.length) {
    res.status(400).json({ error: 'No quotes cache. Start gateway and wait for quotes first.' })
    return
  }

  const knownTickers = new Map<string, string>()
  for (const q of quotesCache) {
    knownTickers.set(q.stock, q.name ?? q.stock)
  }

  logger.info(`[admin] CVM refresh triggered — ${knownTickers.size} tickers`)

  res.status(202).json({
    message: 'CVM refresh iniciado em background. Demora ~2-3 min.',
    tickers: knownTickers.size,
  })

  // Background: download + parse + rebuild
  try {
    await refreshCvmData(knownTickers)
    logger.info('[admin] CVM data refreshed, rebuilding qualitative + unified...')
    refreshQualitativeCache()
    refreshUnifiedCache()
    logger.info('[admin] CVM refresh complete — qualitative + unified rebuilt')
  } catch (err) {
    logger.error({ err }, '[admin] CVM refresh failed')
  }
})
