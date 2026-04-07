// ─── Alternative Data Routes ─────────────────────────────────
// GET /v1/alternative/caged — dados setoriais CAGED

import { Router } from 'express'
import { fetchCAGEDData } from '../providers/caged-client.js'
import { logger } from '../logger.js'

const router = Router()

/**
 * GET /v1/alternative/caged
 * Retorna dados setoriais CAGED (emprego por setor mapeado B3).
 */
router.get('/caged', async (_req, res) => {
  try {
    const data = await fetchCAGEDData()
    res.json({
      source: 'caged',
      count: data.length,
      data,
      updatedAt: new Date().toISOString(),
    })
  } catch (err) {
    logger.error(`[alternative-data] Erro ao buscar CAGED: ${err}`)
    res.status(500).json({ error: 'Erro ao buscar dados CAGED' })
  }
})

export default router
