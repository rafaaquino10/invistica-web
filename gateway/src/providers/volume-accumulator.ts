// ─── Volume Accumulator ──────────────────────────────────────
// Accumulates daily trading volume from brapi quotes to calculate
// liq2meses (2-month average daily volume in BRL).
// Persists rolling 60-day window to disk.

import { readJsonFile, writeJsonFile } from '../persistence/index.js'
import { logger } from '../logger.js'

// ─── Types ──────────────────────────────────────────────────

interface DailyVolumes {
  date: string // YYYY-MM-DD
  volumes: Record<string, number> // ticker → volume in BRL (volume × price)
}

interface VolumeHistoryFile {
  version: number
  updatedAt: string
  days: DailyVolumes[]
}

const PERSIST_FILE = 'volume-history.json'
const MAX_DAYS = 65 // Keep slightly more than 60 for safety

// ─── Persistence ────────────────────────────────────────────

function loadHistory(): VolumeHistoryFile | null {
  return readJsonFile<VolumeHistoryFile>(PERSIST_FILE)
}

function saveHistory(data: VolumeHistoryFile): void {
  writeJsonFile(PERSIST_FILE, data)
}

// ─── Public API ─────────────────────────────────────────────

/**
 * Record a daily volume snapshot from brapi quotes.
 * Call this once per day after fetching quotes.
 *
 * @param quotes Array of { ticker, volume, price }
 */
export function recordDailyVolume(
  quotes: Array<{ ticker: string; volume: number; price: number }>
): void {
  const today = new Date().toISOString().split('T')[0]!

  const history = loadHistory() ?? { version: 1, updatedAt: '', days: [] }

  // Don't record twice for the same day
  if (history.days.some(d => d.date === today)) {
    return
  }

  const volumes: Record<string, number> = {}
  for (const q of quotes) {
    if (q.volume > 0 && q.price > 0) {
      volumes[q.ticker] = Math.round(q.volume * q.price)
    }
  }

  history.days.push({ date: today, volumes })

  // Trim to rolling window
  if (history.days.length > MAX_DAYS) {
    history.days = history.days.slice(-MAX_DAYS)
  }

  history.updatedAt = new Date().toISOString()
  saveHistory(history)

  logger.info({
    date: today,
    tickers: Object.keys(volumes).length,
    totalDays: history.days.length,
  }, 'Volume snapshot recorded')
}

/**
 * Get 2-month average daily volume in BRL for a ticker.
 * Returns null if insufficient data (< 10 days).
 */
export function getLiq2Meses(ticker: string): number | null {
  const history = loadHistory()
  if (!history?.days.length) return null

  let total = 0
  let count = 0

  for (const day of history.days) {
    const vol = day.volumes[ticker]
    if (vol != null && vol > 0) {
      total += vol
      count++
    }
  }

  // Need at least 10 days of data for a meaningful average
  if (count < 10) return null
  return Math.round(total / count)
}

/**
 * Get liq2meses for all tickers at once (bulk).
 */
export function getAllLiq2Meses(): Map<string, number> {
  const history = loadHistory()
  if (!history?.days.length) return new Map()

  // Accumulate totals and counts per ticker
  const totals = new Map<string, number>()
  const counts = new Map<string, number>()

  for (const day of history.days) {
    for (const [ticker, vol] of Object.entries(day.volumes)) {
      if (vol > 0) {
        totals.set(ticker, (totals.get(ticker) ?? 0) + vol)
        counts.set(ticker, (counts.get(ticker) ?? 0) + 1)
      }
    }
  }

  const result = new Map<string, number>()
  for (const [ticker, total] of totals) {
    const count = counts.get(ticker) ?? 0
    if (count >= 10) {
      result.set(ticker, Math.round(total / count))
    }
  }

  return result
}

/**
 * Get number of days of volume data accumulated.
 */
export function getVolumeDataDays(): number {
  const history = loadHistory()
  return history?.days.length ?? 0
}
