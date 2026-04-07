// ─── Modules Route ──────────────────────────────────────────
// Serves derived financial module data (netDebtEbitda, payout, etc.)
// Source: brapi.dev ?modules= endpoint, scraped incrementally.

import { Router } from 'express'
import type { Request, Response } from 'express'
import { loadModulesMap, type DerivedModuleData } from '../providers/modules-client.js'

const router = Router()

// GET /v1/modules/all — all derived module data
router.get('/all', (_req: Request, res: Response) => {
  const modules = loadModulesMap()
  const data = Array.from(modules.values())

  res.json({
    data,
    count: data.length,
    fetchedAt: new Date().toISOString(),
  })
})

// GET /v1/modules/:ticker — single ticker module data
router.get('/:ticker', (req: Request, res: Response) => {
  const ticker = (req.params['ticker'] as string | undefined)?.toUpperCase()
  if (!ticker) {
    return res.status(400).json({ error: 'Missing required parameter: ticker' })
  }

  const modules = loadModulesMap()
  const data = modules.get(ticker)

  if (!data) {
    return res.status(404).json({ error: `No module data for ${ticker}` })
  }

  res.json({ data })
})

export { router as modulesRoutes }
