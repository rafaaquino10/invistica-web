// ─── Score History Routes ────────────────────────────────────
// Serves score history snapshots and alerts from disk.
// Snapshots are written by the Next.js app after each buildLiveDataset().
// Files stored in gateway/data/score-history/{YYYY-MM-DD}.json.

import { Router } from 'express'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { logger } from '../logger.js'
import { getDataPath } from '../persistence/index.js'

const router = Router()
const HISTORY_DIR = getDataPath('score-history')
const ALERTS_FILE = getDataPath('score-alerts.json')

// ─── Helpers ────────────────────────────────────────────────

interface ScoreSnapshot {
  score: number
  valuation: number
  quality: number
  risk: number
  dividends: number
  growth: number
  confidence: number
}

interface DailySnapshot {
  date: string
  timestamp: number
  count: number
  scores: Record<string, ScoreSnapshot>
}

function loadSnapshot(date: string): DailySnapshot | null {
  const filePath = join(HISTORY_DIR, `${date}.json`)
  if (!existsSync(filePath)) return null
  try {
    return JSON.parse(readFileSync(filePath, 'utf-8')) as DailySnapshot
  } catch {
    return null
  }
}

function listDates(): string[] {
  if (!existsSync(HISTORY_DIR)) return []
  return readdirSync(HISTORY_DIR)
    .filter(f => f.endsWith('.json'))
    .map(f => f.replace('.json', ''))
    .sort()
}

// ─── GET /v1/scores/dates ───────────────────────────────────
// Returns list of available snapshot dates

router.get('/dates', (_req, res) => {
  const dates = listDates()
  res.json({ dates, count: dates.length })
})

// ─── GET /v1/scores/history/:ticker ─────────────────────────
// Returns score evolution for a specific ticker

router.get('/history/:ticker', (req, res) => {
  const ticker = (req.params['ticker'] ?? '').toUpperCase()
  const days = Math.min(Number(req.query['days']) || 90, 365)

  if (!ticker) {
    return res.status(400).json({ error: 'Ticker is required' })
  }

  const dates = listDates()
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - days)
  const cutoffStr = cutoff.toISOString().split('T')[0]!

  const relevantDates = dates.filter(d => d >= cutoffStr)
  const history: Array<{
    date: string
    score: number
    valuation: number
    quality: number
    risk: number
    dividends: number
    growth: number
  }> = []

  for (const date of relevantDates) {
    const snapshot = loadSnapshot(date)
    if (!snapshot) continue
    const data = snapshot.scores[ticker]
    if (!data) continue
    history.push({
      date,
      score: data.score,
      valuation: data.valuation,
      quality: data.quality,
      risk: data.risk,
      dividends: data.dividends,
      growth: data.growth,
    })
  }

  logger.info({ ticker, days, points: history.length }, 'score history served')
  res.json({ ticker, days, history })
})

// ─── GET /v1/scores/movers ──────────────────────────────────
// Returns biggest score gainers and losers over N days

router.get('/movers', (req, res) => {
  const days = Math.min(Number(req.query['days']) || 7, 90)
  const limit = Math.min(Number(req.query['limit']) || 10, 50)

  const dates = listDates()
  if (dates.length < 2) {
    return res.json({ gainers: [], losers: [], hasHistory: false })
  }

  const latestDate = dates[dates.length - 1]!
  const latest = loadSnapshot(latestDate)

  // Find snapshot closest to N days ago
  const targetDate = new Date()
  targetDate.setDate(targetDate.getDate() - days)
  const targetStr = targetDate.toISOString().split('T')[0]!
  const compareDate = dates.filter(d => d <= targetStr).pop() || dates[0]!
  const previous = loadSnapshot(compareDate)

  if (!latest || !previous) {
    return res.json({ gainers: [], losers: [], hasHistory: false })
  }

  const movers: Array<{ ticker: string; current: number; previous: number; delta: number }> = []

  for (const [ticker, currentScore] of Object.entries(latest.scores)) {
    const prevScore = previous.scores[ticker]
    if (!prevScore) continue
    const delta = Math.round((currentScore.score - prevScore.score) * 10) / 10
    if (delta !== 0) {
      movers.push({ ticker, current: currentScore.score, previous: prevScore.score, delta })
    }
  }

  movers.sort((a, b) => b.delta - a.delta)

  res.json({
    gainers: movers.filter(m => m.delta > 0).slice(0, limit),
    losers: movers.filter(m => m.delta < 0).sort((a, b) => a.delta - b.delta).slice(0, limit),
    latestDate,
    compareDate,
    hasHistory: true,
  })
})

// ─── GET /v1/scores/alerts ──────────────────────────────────
// Returns score change alerts (delta >= 5 pts)

router.get('/alerts', (req, res) => {
  const days = Math.min(Number(req.query['days']) || 30, 90)

  if (!existsSync(ALERTS_FILE)) {
    return res.json({ alerts: [], count: 0 })
  }

  try {
    interface AlertEntry {
      date: string
      ticker: string
      previousScore: number
      currentScore: number
      delta: number
      topPillarChanged: string
      topPillarDelta: number
      type: 'upgrade' | 'downgrade'
    }
    const all = JSON.parse(readFileSync(ALERTS_FILE, 'utf-8')) as AlertEntry[]
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - days)
    const cutoffStr = cutoff.toISOString().split('T')[0]!
    const filtered = all.filter(a => a.date >= cutoffStr)

    res.json({ alerts: filtered, count: filtered.length })
  } catch {
    res.json({ alerts: [], count: 0 })
  }
})

// ─── GET /v1/scores/snapshot/:date ──────────────────────────
// Returns full snapshot for a specific date

router.get('/snapshot/:date', (req, res) => {
  const date = req.params['date'] ?? ''

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD.' })
  }

  const snapshot = loadSnapshot(date)
  if (!snapshot) {
    return res.status(404).json({ error: `No snapshot found for ${date}` })
  }

  res.json(snapshot)
})

export { router as scoresRoutes }
