// ─── Score History & Alerts ──────────────────────────────────
// Persists daily IQ-Score snapshots to disk for trend analysis.
// Files stored in gateway/data/score-history/{YYYY-MM-DD}.json.
// Alerts detect significant score changes (>= 5 pts) between days.

import type { AssetData } from './data-source'

// Dynamic imports — only available on server (Node.js), not browser
const isServer = typeof window === 'undefined'
let fs: typeof import('fs') | null = null
let path: typeof import('path') | null = null

if (isServer) {
  try {
    fs = require('fs')
    path = require('path')
  } catch {
    // Browser environment — fs/path not available
  }
}

const HISTORY_DIR = isServer && path ? path.join(process.cwd(), 'gateway', 'data', 'score-history') : ''
const ALERTS_FILE = isServer && path ? path.join(process.cwd(), 'gateway', 'data', 'score-alerts.json') : ''
const ALERT_THRESHOLD = 5

// ─── Types ──────────────────────────────────────────────────

export interface ScoreSnapshot {
  score: number
  valuation: number
  quality: number
  risk: number
  dividends: number
  growth: number
  confidence: number
}

export interface DailyScoreSnapshot {
  date: string // "2026-02-14"
  timestamp: number
  count: number
  scores: Record<string, ScoreSnapshot>
}

export interface ScoreAlert {
  date: string
  ticker: string
  previousScore: number
  currentScore: number
  delta: number
  topPillarChanged: string
  topPillarDelta: number
  type: 'upgrade' | 'downgrade'
}

export interface ScoreMover {
  ticker: string
  current: number
  previous: number
  delta: number
}

// ─── Snapshot Persistence ───────────────────────────────────

function ensureHistoryDir(): void {
  if (!fs || !HISTORY_DIR) return
  if (!fs.existsSync(HISTORY_DIR)) {
    fs.mkdirSync(HISTORY_DIR, { recursive: true })
  }
}

/**
 * Save a daily score snapshot from the current asset dataset.
 * Called after each successful buildLiveDataset() in data-source.ts.
 * Only writes once per day (overwrites same-day file).
 */
export function saveScoreSnapshot(assets: AssetData[]): void {
  if (!fs || !path) return
  ensureHistoryDir()

  const today = new Date().toISOString().split('T')[0]!
  const filePath = path!.join(HISTORY_DIR, `${today}.json`)

  const scores: DailyScoreSnapshot['scores'] = {}
  let count = 0

  for (const asset of assets) {
    if (!asset.iqScore) continue
    scores[asset.ticker] = {
      score: asset.iqScore.scoreTotal,
      valuation: asset.iqScore.scoreValuation,
      quality: asset.iqScore.scoreQuanti,
      risk: asset.iqScore.scoreQuanti,
      dividends: asset.iqScore.scoreQuali,
      growth: asset.iqScore.scoreOperational,
      confidence: asset.iqScore.confidence,
    }
    count++
  }

  const snapshot: DailyScoreSnapshot = {
    date: today,
    timestamp: Date.now(),
    count,
    scores,
  }

  // Atomic write: tmp then rename
  const tmpPath = filePath + '.tmp'
  fs!.writeFileSync(tmpPath, JSON.stringify(snapshot), 'utf-8')
  fs!.renameSync(tmpPath, filePath)
  console.log(`[score-history] Snapshot saved: ${count} stocks, date: ${today}`)
}

/**
 * Load a snapshot for a specific date.
 */
export function loadScoreSnapshot(date: string): DailyScoreSnapshot | null {
  if (!fs || !path) return null
  const filePath = path.join(HISTORY_DIR, `${date}.json`)
  if (!fs.existsSync(filePath)) return null
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as DailyScoreSnapshot
  } catch {
    return null
  }
}

/**
 * List all available snapshot dates (sorted ascending).
 */
export function listAvailableDates(): string[] {
  if (!fs) return []
  if (!fs.existsSync(HISTORY_DIR)) return []
  return fs.readdirSync(HISTORY_DIR)
    .filter(f => f.endsWith('.json'))
    .map(f => f.replace('.json', ''))
    .sort()
}

// ─── Score History Query ────────────────────────────────────

/**
 * Get score history for a specific ticker over the last N days.
 */
export function getScoreHistory(
  ticker: string,
  days: number = 90
): Array<{
  date: string
  score: number
  valuation: number
  quality: number
  risk: number
  dividends: number
  growth: number
}> {
  const dates = listAvailableDates()
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
    const snapshot = loadScoreSnapshot(date)
    if (!snapshot) continue
    const tickerData = snapshot.scores[ticker]
    if (!tickerData) continue
    history.push({
      date,
      score: tickerData.score,
      valuation: tickerData.valuation,
      quality: tickerData.quality,
      risk: tickerData.risk,
      dividends: tickerData.dividends,
      growth: tickerData.growth,
    })
  }

  return history
}

// ─── Score Alerts ───────────────────────────────────────────

/**
 * Detect score alerts by comparing today's snapshot with the previous day.
 * An alert fires when |delta| >= ALERT_THRESHOLD (5 points).
 * Saves alerts to score-alerts.json, purging entries older than 90 days.
 */
export function detectScoreAlerts(todayDate: string): ScoreAlert[] {
  if (!fs) return []
  const dates = listAvailableDates()
  const todayIdx = dates.indexOf(todayDate)
  if (todayIdx <= 0) return []

  const yesterdayDate = dates[todayIdx - 1]!
  const today = loadScoreSnapshot(todayDate)
  const yesterday = loadScoreSnapshot(yesterdayDate)
  if (!today || !yesterday) return []

  const alerts: ScoreAlert[] = []

  for (const [ticker, todayScore] of Object.entries(today.scores)) {
    const yesterdayScore = yesterday.scores[ticker]
    if (!yesterdayScore) continue

    const delta = todayScore.score - yesterdayScore.score
    if (Math.abs(delta) < ALERT_THRESHOLD) continue

    // Find which pillar changed the most
    const pillarDeltas: Record<string, number> = {
      valuation: todayScore.valuation - yesterdayScore.valuation,
      quality: todayScore.quality - yesterdayScore.quality,
      risk: todayScore.risk - yesterdayScore.risk,
      dividends: todayScore.dividends - yesterdayScore.dividends,
      growth: todayScore.growth - yesterdayScore.growth,
    }

    const topPillar = Object.entries(pillarDeltas)
      .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))[0]!

    alerts.push({
      date: todayDate,
      ticker,
      previousScore: yesterdayScore.score,
      currentScore: todayScore.score,
      delta: Math.round(delta * 10) / 10,
      topPillarChanged: topPillar[0],
      topPillarDelta: Math.round(topPillar[1] * 10) / 10,
      type: delta > 0 ? 'upgrade' : 'downgrade',
    })
  }

  // Persist alerts: merge with existing, purge >90 days
  let existing: ScoreAlert[] = []
  if (fs!.existsSync(ALERTS_FILE)) {
    try {
      existing = JSON.parse(fs!.readFileSync(ALERTS_FILE, 'utf-8')) as ScoreAlert[]
    } catch {
      existing = []
    }
  }

  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 90)
  const cutoffStr = cutoff.toISOString().split('T')[0]!

  const merged = [
    ...existing.filter(a => a.date >= cutoffStr && a.date !== todayDate),
    ...alerts,
  ].sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))

  ensureHistoryDir()
  const tmpPath = ALERTS_FILE + '.tmp'
  fs!.writeFileSync(tmpPath, JSON.stringify(merged, null, 2), 'utf-8')
  fs!.renameSync(tmpPath, ALERTS_FILE)

  return alerts.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
}

/**
 * Read persisted alerts, filtered to the last N days.
 */
export function getScoreAlerts(days: number = 30): ScoreAlert[] {
  if (!fs) return []
  if (!fs.existsSync(ALERTS_FILE)) return []
  try {
    const all = JSON.parse(fs.readFileSync(ALERTS_FILE, 'utf-8')) as ScoreAlert[]
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - days)
    const cutoffStr = cutoff.toISOString().split('T')[0]!
    return all.filter(a => a.date >= cutoffStr)
  } catch {
    return []
  }
}

// ─── Score Movers (History-Based) ───────────────────────────

/**
 * Compare the latest snapshot with one from N days ago to find biggest movers.
 * Returns top 10 gainers and top 10 losers.
 */
export function getScoreMovers(days: number = 7): {
  gainers: ScoreMover[]
  losers: ScoreMover[]
  latestDate: string | null
  compareDate: string | null
} {
  const dates = listAvailableDates()
  if (dates.length < 2) return { gainers: [], losers: [], latestDate: null, compareDate: null }

  const todayDate = dates[dates.length - 1]!
  const today = loadScoreSnapshot(todayDate)

  // Find snapshot closest to N days ago
  const targetDate = new Date()
  targetDate.setDate(targetDate.getDate() - days)
  const targetStr = targetDate.toISOString().split('T')[0]!
  const previousDate = dates.filter(d => d <= targetStr).pop() || dates[0]!
  const previous = loadScoreSnapshot(previousDate)

  if (!today || !previous) return { gainers: [], losers: [], latestDate: todayDate, compareDate: previousDate }

  const movers: ScoreMover[] = []

  for (const [ticker, currentScore] of Object.entries(today.scores)) {
    const prevScore = previous.scores[ticker]
    if (!prevScore) continue
    const delta = Math.round((currentScore.score - prevScore.score) * 10) / 10
    if (delta !== 0) {
      movers.push({
        ticker,
        current: currentScore.score,
        previous: prevScore.score,
        delta,
      })
    }
  }

  movers.sort((a, b) => b.delta - a.delta)

  return {
    gainers: movers.filter(m => m.delta > 0).slice(0, 10),
    losers: movers.filter(m => m.delta < 0).sort((a, b) => a.delta - b.delta).slice(0, 10),
    latestDate: todayDate,
    compareDate: previousDate,
  }
}

/**
 * Get the number of available snapshot days.
 */
export function getSnapshotCount(): number {
  return listAvailableDates().length
}
