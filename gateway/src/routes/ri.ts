// ─── RI (Relações com Investidores) Routes ────────────────────
// Endpoints para fatos relevantes e comunicados da CVM.

import { Router } from 'express'
import { getCachedRiEvents, fetchCvmRiEvents } from '../providers/cvm-ri-client.js'

export const riRoutes = Router()

/**
 * GET /v1/ri/events?ticker=PETR4&days=30&limit=50
 * Retorna eventos RI filtrados por ticker e/ou período.
 */
riRoutes.get('/events', async (req, res) => {
  try {
    let events = getCachedRiEvents()
    if (!events) {
      events = await fetchCvmRiEvents()
    }

    const ticker = (req.query['ticker'] as string)?.toUpperCase()
    const days = parseInt(req.query['days'] as string) || 30
    const limit = Math.min(parseInt(req.query['limit'] as string) || 50, 200)

    // Filtrar por ticker
    if (ticker) {
      events = events.filter(e => e.ticker === ticker)
    }

    // Filtrar por período
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - days)
    const cutoffMs = cutoff.getTime()
    events = events.filter(e => new Date(e.date).getTime() >= cutoffMs)

    // Aplicar limit
    events = events.slice(0, limit)

    res.json({ data: events, total: events.length })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    res.status(500).json({ error: 'Failed to fetch RI events', message: msg })
  }
})

/**
 * GET /v1/ri/events/latest
 * Retorna os 10 eventos mais recentes (qualquer ticker).
 */
riRoutes.get('/events/latest', async (_req, res) => {
  try {
    let events = getCachedRiEvents()
    if (!events) {
      events = await fetchCvmRiEvents()
    }

    res.json({ data: events.slice(0, 10) })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    res.status(500).json({ error: 'Failed to fetch RI events', message: msg })
  }
})
