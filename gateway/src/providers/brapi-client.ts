// ─── brapi.dev API Client ──────────────────────────────────
// Pure HTTP client for brapi.dev — no Express dependency.
// Handles authentication, rate limiting, and batch fetching.

import { config } from '../config.js'

// ─── Types ──────────────────────────────────────────────────

export interface BrapiQuote {
  symbol: string
  shortName: string
  longName: string
  currency: string
  regularMarketPrice: number
  regularMarketChange: number
  regularMarketChangePercent: number
  regularMarketVolume: number
  regularMarketDayHigh: number
  regularMarketDayLow: number
  regularMarketOpen: number
  regularMarketPreviousClose: number
  marketCap: number
  regularMarketTime: string
  fiftyTwoWeekHigh: number
  fiftyTwoWeekLow: number
  logourl: string
}

export interface BrapiHistoricalPrice {
  date: number
  open: number
  high: number
  low: number
  close: number
  volume: number
  adjustedClose: number
}

export interface BrapiCashDividend {
  assetIssued: string
  paymentDate: string
  rate: number
  type: string
  relatedTo: string
}

export interface BrapiListStock {
  stock: string
  name: string
  close: number
  change: number
  volume: number
  market_cap: number
  logo: string
  sector: string
  type: string
}

interface BrapiQuoteResponse {
  results: BrapiQuote[]
  requestedAt: string
  took: string
}

interface BrapiHistoryResult {
  symbol: string
  shortName: string
  currency: string
  historicalDataPrice: BrapiHistoricalPrice[]
}

interface BrapiHistoryResponse {
  results: BrapiHistoryResult[]
  requestedAt: string
  took: string
}

interface BrapiDividendsResult {
  symbol: string
  shortName: string
  dividendsData: {
    cashDividends: BrapiCashDividend[]
    stockDividends: unknown[]
  }
}

interface BrapiDividendsResponse {
  results: BrapiDividendsResult[]
  requestedAt: string
  took: string
}

interface BrapiListResponse {
  stocks: BrapiListStock[]
  currentPage: number
  totalPages: number
  totalCount: number
  hasNextPage: boolean
}

// ─── Modules Types ────────────────────────────────────────

export interface BrapiBalanceSheetItem {
  endDate: { fmt: string; raw: number }
  totalAssets?: number
  totalCurrentAssets?: number
  totalCurrentLiabilities?: number
  totalStockholderEquity?: number
  totalLiab?: number
  cash?: number
  shortTermInvestments?: number
  longTermDebt?: number
  shortLongTermDebt?: number
}

export interface BrapiModulesResult {
  symbol: string
  shortName: string
  summaryProfile?: {
    sector?: string
    industry?: string
    longBusinessSummary?: string
    fullTimeEmployees?: number
    website?: string
  }
  defaultKeyStatistics?: {
    enterpriseValue?: number
    enterpriseToEbitda?: number
    enterpriseToRevenue?: number
    forwardPE?: number
    trailingEps?: number
    pegRatio?: number
    netIncomeToCommon?: number
    fiftyTwoWeekHigh?: number
    fiftyTwoWeekLow?: number
    sharesOutstanding?: number
    floatShares?: number
    bookValue?: number
    priceToBook?: number
    lastDividendValue?: number
    lastDividendDate?: string
  }
  financialData?: {
    ebitda?: number
    totalDebt?: number
    totalCash?: number
    totalRevenue?: number
    revenuePerShare?: number
    profitMargins?: number
    grossMargins?: number
    ebitdaMargins?: number
    operatingMargins?: number
    revenueGrowth?: number
    earningsGrowth?: number
    freeCashflow?: number
    returnOnEquity?: number
    returnOnAssets?: number
    currentRatio?: number
    debtToEquity?: number
  }
  incomeStatementHistory?: {
    incomeStatementHistory: Array<{
      endDate: { fmt: string; raw: number }
      netIncome: { raw: number; fmt: string }
      totalRevenue: { raw: number; fmt: string }
      ebit?: { raw: number; fmt: string }
      grossProfit?: { raw: number; fmt: string }
    }>
  }
  balanceSheetHistory?: {
    balanceSheetStatements: BrapiBalanceSheetItem[]
  }
}

interface BrapiModulesResponse {
  results: BrapiModulesResult[]
  requestedAt: string
  took: string
}

// ─── Rate Limiter ───────────────────────────────────────────

class RateLimiter {
  private timestamps: number[] = []
  private maxRequests: number
  private windowMs = 60_000

  constructor(maxPerMinute: number) {
    this.maxRequests = maxPerMinute
  }

  async waitForSlot(): Promise<void> {
    const now = Date.now()
    this.timestamps = this.timestamps.filter(t => now - t < this.windowMs)

    if (this.timestamps.length >= this.maxRequests) {
      const oldest = this.timestamps[0]!
      const waitMs = this.windowMs - (now - oldest) + 200
      console.log(`[brapi] Rate limit reached, waiting ${waitMs}ms...`)
      await new Promise(resolve => setTimeout(resolve, waitMs))
      return this.waitForSlot()
    }

    this.timestamps.push(now)
  }

  get usage() {
    const now = Date.now()
    this.timestamps = this.timestamps.filter(t => now - t < this.windowMs)
    return { used: this.timestamps.length, max: this.maxRequests }
  }
}

const rateLimiter = new RateLimiter(config.brapi.maxRequestsPerMinute)

export function getRateLimitStatus() {
  return rateLimiter.usage
}

// ─── HTTP Helper ────────────────────────────────────────────

async function brapiGet<T>(path: string, params?: Record<string, string>): Promise<T> {
  if (!config.brapi.token) {
    throw new Error('BRAPI_TOKEN not configured')
  }

  await rateLimiter.waitForSlot()

  const url = new URL(path, config.brapi.baseUrl)
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      url.searchParams.set(k, v)
    }
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${config.brapi.token}`,
  }

  const startMs = Date.now()
  console.log(`[brapi] GET ${url.pathname}${url.search}`)

  const response = await fetch(url.toString(), { headers })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`brapi ${response.status}: ${body.slice(0, 200)}`)
  }

  const data = (await response.json()) as T
  const elapsed = Date.now() - startMs
  console.log(`[brapi] <- ${response.status} (${elapsed}ms)`)

  return data
}

// ─── Public API ─────────────────────────────────────────────

/**
 * Fetch detailed quotes for specific tickers.
 * Supports batch: up to ~35 tickers per request (URL length limit).
 * Automatically splits into multiple requests if needed.
 */
export async function fetchQuotes(tickers: string[]): Promise<BrapiQuote[]> {
  if (tickers.length === 0) return []

  const batches: string[][] = []
  for (let i = 0; i < tickers.length; i += config.brapi.batchSize) {
    batches.push(tickers.slice(i, i + config.brapi.batchSize))
  }

  const allResults: BrapiQuote[] = []

  for (const batch of batches) {
    const tickerStr = batch.join(',')
    const data = await brapiGet<BrapiQuoteResponse>(`/api/quote/${tickerStr}`)
    if (data.results) {
      allResults.push(...data.results)
    }
  }

  return allResults
}

/**
 * List all available stocks with basic quote data.
 * More efficient than fetchQuotes for bulk listing (fewer API calls).
 * Returns: stock, name, close, change, volume, market_cap, sector.
 */
export async function fetchQuotesList(options?: {
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  limit?: number
  type?: 'stock' | 'fund' | 'bdr'
}): Promise<BrapiListStock[]> {
  const allStocks: BrapiListStock[] = []
  let page = 1
  let hasMore = true
  const limit = options?.limit ?? 100

  while (hasMore) {
    const params: Record<string, string> = {
      page: String(page),
      limit: String(limit),
      type: options?.type ?? 'stock',
    }
    if (options?.sortBy) params['sortBy'] = options.sortBy
    if (options?.sortOrder) params['sortOrder'] = options.sortOrder

    const data = await brapiGet<BrapiListResponse>('/api/quote/list', params)
    if (data.stocks?.length) {
      allStocks.push(...data.stocks)
    }
    hasMore = data.hasNextPage
    page++
  }

  return allStocks
}

/**
 * Fetch OHLCV historical price data for a single ticker.
 * Range: 1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, 10y, ytd, max
 * Interval: 1d (default), 1wk, 1mo
 */
export async function fetchHistory(
  ticker: string,
  range: string = '1mo',
  interval: string = '1d'
): Promise<BrapiHistoricalPrice[]> {
  const data = await brapiGet<BrapiHistoryResponse>(`/api/quote/${ticker}`, { range, interval })
  return data.results?.[0]?.historicalDataPrice ?? []
}

/**
 * Fetch dividend history for a single ticker.
 * Returns cash dividends (DIVIDENDO, JCP, RENDIMENTO).
 */
export async function fetchDividends(ticker: string): Promise<BrapiCashDividend[]> {
  const data = await brapiGet<BrapiDividendsResponse>(`/api/quote/${ticker}`, {
    dividends: 'true',
  })

  return data.results?.[0]?.dividendsData?.cashDividends ?? []
}

/**
 * Fetch financial modules for a single ticker.
 * Provides: defaultKeyStatistics, financialData, incomeStatementHistory
 * Used for deriving: netDebtEbitda, payout, crescLucro5a, 52-week range
 */
export async function fetchModules(ticker: string): Promise<BrapiModulesResult | null> {
  try {
    const data = await brapiGet<BrapiModulesResponse>(`/api/quote/${ticker}`, {
      modules: 'defaultKeyStatistics,financialData,incomeStatementHistory,summaryProfile,balanceSheetHistory',
    })
    return data.results?.[0] ?? null
  } catch {
    return null
  }
}

/**
 * Fetch inflation data (IPCA, IGP-M).
 */
export async function fetchInflation(): Promise<any[]> {
  const data = await brapiGet<{ inflation: any[] }>('/api/v2/inflation')
  return data.inflation ?? []
}

/**
 * Fetch currency exchange rates.
 */
export async function fetchCurrency(pairs = 'USD-BRL,EUR-BRL'): Promise<any[]> {
  const data = await brapiGet<{ currency: any[] }>('/api/v2/currency', { currency: pairs, fundamental: 'false' })
  return data.currency ?? []
}
