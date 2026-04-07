// ─── Technical Data Calculator ───────────────────────────────
// Calculates MM200, MM50, beta, and other technical indicators
// from historical OHLCV price data.

export interface HistoricalPrice {
  date: number
  close: number
  volume: number
}

export interface TechnicalData {
  mm200: number | null
  mm50: number | null
  beta: number | null
  avgVolume2m: number | null
  todayVolume: number | null
  high52w: number | null
  low52w: number | null
  price: number
}

/**
 * Simple Moving Average over the last `period` prices.
 */
export function calculateMA(closes: number[], period: number): number | null {
  if (closes.length < period) return null
  const slice = closes.slice(-period)
  return slice.reduce((sum, v) => sum + v, 0) / period
}

/**
 * Calculate daily returns from an array of close prices.
 */
function dailyReturns(closes: number[]): number[] {
  const returns: number[] = []
  for (let i = 1; i < closes.length; i++) {
    const prev = closes[i - 1]!
    if (prev === 0) {
      returns.push(0)
    } else {
      returns.push((closes[i]! - prev) / prev)
    }
  }
  return returns
}

/**
 * Calculate beta = cov(stock, benchmark) / var(benchmark).
 * Uses up to 252 trading days.
 */
export function calculateBeta(
  stockCloses: number[],
  benchmarkCloses: number[],
): number | null {
  const minLen = Math.min(stockCloses.length, benchmarkCloses.length)
  if (minLen < 60) return null // need at least ~60 days

  const stockR = dailyReturns(stockCloses.slice(-minLen))
  const benchR = dailyReturns(benchmarkCloses.slice(-minLen))
  const n = Math.min(stockR.length, benchR.length)
  if (n < 59) return null

  const stockSlice = stockR.slice(-n)
  const benchSlice = benchR.slice(-n)

  const meanStock = stockSlice.reduce((s, v) => s + v, 0) / n
  const meanBench = benchSlice.reduce((s, v) => s + v, 0) / n

  let cov = 0
  let varBench = 0
  for (let i = 0; i < n; i++) {
    const ds = stockSlice[i]! - meanStock
    const db = benchSlice[i]! - meanBench
    cov += ds * db
    varBench += db * db
  }

  if (varBench === 0) return null
  return cov / varBench
}

/**
 * Calculate full technical data from historical prices.
 * Requires at least 1 year of daily data for MM200.
 */
export function calculateTechnicalData(
  history: HistoricalPrice[],
  ibovHistory?: HistoricalPrice[],
): TechnicalData {
  if (history.length === 0) {
    return {
      mm200: null, mm50: null, beta: null,
      avgVolume2m: null, todayVolume: null,
      high52w: null, low52w: null, price: 0,
    }
  }

  // Sort by date ascending
  const sorted = [...history].sort((a, b) => a.date - b.date)
  const closes = sorted.map(h => h.close)
  const volumes = sorted.map(h => h.volume)
  const latest = sorted[sorted.length - 1]!

  // Moving averages
  const mm200 = calculateMA(closes, 200)
  const mm50 = calculateMA(closes, 50)

  // Beta (if IBOV data available)
  let beta: number | null = null
  if (ibovHistory && ibovHistory.length > 60) {
    const ibovSorted = [...ibovHistory].sort((a, b) => a.date - b.date)
    const ibovCloses = ibovSorted.map(h => h.close)
    beta = calculateBeta(closes, ibovCloses)
  }

  // Average volume (last 2 months ≈ 42 trading days)
  const vol2m = volumes.slice(-42)
  const avgVolume2m = vol2m.length > 0
    ? vol2m.reduce((s, v) => s + v, 0) / vol2m.length
    : null

  // 52-week range (≈ 252 trading days)
  const year = closes.slice(-252)
  const high52w = year.length > 0 ? Math.max(...year) : null
  const low52w = year.length > 0 ? Math.min(...year) : null

  return {
    mm200,
    mm50,
    beta,
    avgVolume2m,
    todayVolume: latest.volume,
    high52w,
    low52w,
    price: latest.close,
  }
}
