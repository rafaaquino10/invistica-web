// ─── Intelligence Routes ─────────────────────────────────────
// Aggregated intelligence endpoints for per-ticker analysis.
// GET /v1/intelligence/focus — BCB Focus expectations
// GET /v1/intelligence/:ticker — news + kill switch + fatos relevantes

import { Router } from 'express'
import type { Request, Response } from 'express'
import { cache } from '../cache/index.js'
import type { NormalizedNewsItem } from './news.js'
import type { CompanyMetadata } from '../types.js'
import {
  getNewsForTicker,
  getRelevantFacts,
  checkKillSwitch,
  fetchFocusExpectations,
} from '../intelligence/index.js'

const router = Router()

/**
 * Get company name from companies cache.
 */
function getCompanyName(ticker: string): string {
  const companies = cache.get<Record<string, CompanyMetadata>>('companies:all')
  if (!companies) return ticker
  const company = companies[ticker.toUpperCase()]
  return company?.name ?? ticker
}

/**
 * Get all news from cache.
 */
function getAllNews(): NormalizedNewsItem[] {
  return cache.get<NormalizedNewsItem[]>('news:all') ?? []
}

// GET /v1/intelligence/focus — BCB Focus expectations
router.get('/focus', async (_req: Request, res: Response) => {
  try {
    const focus = await fetchFocusExpectations()
    res.json({ data: focus })
  } catch (err) {
    console.error('[intelligence/focus] Error:', (err as Error).message)
    res.json({
      data: {
        selic: null,
        ipca: null,
        pib: null,
        cambio: null,
        updatedAt: new Date().toISOString(),
        insight: null,
      },
    })
  }
})

// GET /v1/intelligence/:ticker — aggregated intelligence
router.get('/:ticker', (req: Request, res: Response) => {
  const ticker = (req.params['ticker'] as string | undefined)?.toUpperCase()
  if (!ticker) {
    return res.status(400).json({ error: 'Missing ticker' })
  }

  try {
    const companyName = getCompanyName(ticker)
    const allNews = getAllNews()

    const news = getNewsForTicker(ticker, companyName, allNews)
    const killSwitch = checkKillSwitch(ticker, companyName, allNews)
    const relevantFacts = getRelevantFacts(ticker, companyName, allNews)

    res.json({
      data: {
        ticker,
        companyName,
        news,
        killSwitch: {
          triggered: killSwitch.triggered,
          reason: killSwitch.reason,
        },
        relevantFacts,
      },
    })
  } catch (err) {
    console.error(`[intelligence/${ticker}] Error:`, (err as Error).message)
    res.json({
      data: {
        ticker,
        news: [],
        killSwitch: { triggered: false, reason: null },
        relevantFacts: [],
      },
    })
  }
})

export { router as intelligenceRoutes }
