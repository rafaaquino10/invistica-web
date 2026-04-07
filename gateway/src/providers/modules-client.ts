// ─── brapi Modules Client (Incremental) ──────────────────────
// Fetches ?modules= data from brapi.dev per ticker, persists to disk.
// Derives ALL fundamental indicators that CVM doesn't cover.
//
// Pattern: incremental fetch
//   - Only fetches tickers NOT already cached
//   - Full re-fetch every 30 days
//   - Persists to gateway/data/modules.json

import { fetchModules, fetchDividends, type BrapiModulesResult, type BrapiCashDividend, type BrapiBalanceSheetItem } from './brapi-client.js'
import { readJsonFile, writeJsonFile } from '../persistence/index.js'
import { logger } from '../logger.js'

// ─── Types ──────────────────────────────────────────────────

export interface DerivedModuleData {
  ticker: string
  // Valuation
  peRatio: number | null
  pbRatio: number | null
  evEbitda: number | null
  psr: number | null
  pEbit: number | null
  evEbit: number | null
  pAtivo: number | null
  pCapGiro: number | null
  pAtivCircLiq: number | null
  // Quality
  roe: number | null
  roic: number | null
  margemEbit: number | null
  margemLiquida: number | null
  // Risk
  liquidezCorrente: number | null
  divBrutPatrim: number | null
  netDebtEbitda: number | null
  patrimLiquido: number | null
  // Dividends
  dividendYield: number | null
  payout: number | null
  // Growth
  crescLucro5a: number | null
  revenueGrowth: number | null
  earningsGrowth: number | null
  // Market data
  fiftyTwoWeekHigh: number | null
  fiftyTwoWeekLow: number | null
  enterpriseValue: number | null
  ebitda: number | null
  freeCashflow: number | null
  // Float shares
  floatShares: number | null
  sharesOutstanding: number | null
  // Sector from summaryProfile
  sector: string | null
  industry: string | null
  fetchedAt: string
}

interface ModulesFile {
  version: number
  scrapedAt: string
  count: number
  modules: Record<string, DerivedModuleData>
}

const PERSIST_FILE = 'modules.json'
const MAX_AGE_DAYS = 14    // Full rescrape every 2 weeks
const DELAY_MS = 2000      // ~30 req/min (2 requests per ticker, shared rate limit with quotes)
const MIN_QUALITY_RATIO = 0.3 // At least 30% of entries must have real data

// ─── Persistence ────────────────────────────────────────────

export function loadModulesMap(): Map<string, DerivedModuleData> {
  const file = readJsonFile<ModulesFile>(PERSIST_FILE)
  if (!file?.modules) return new Map()
  return new Map(Object.entries(file.modules))
}

function saveModules(modules: Map<string, DerivedModuleData>): void {
  const obj: Record<string, DerivedModuleData> = {}
  for (const [ticker, data] of modules) {
    obj[ticker] = data
  }
  writeJsonFile<ModulesFile>(PERSIST_FILE, {
    version: 2,
    scrapedAt: new Date().toISOString(),
    count: modules.size,
    modules: obj,
  })
}

export function isModulesStale(knownTickerCount?: number): boolean {
  const file = readJsonFile<ModulesFile>(PERSIST_FILE)
  if (!file?.scrapedAt || !file.count) return true

  // Check age
  const ageMs = Date.now() - new Date(file.scrapedAt).getTime()
  if (ageMs > MAX_AGE_DAYS * 24 * 60 * 60 * 1000) return true

  // Check coverage — if we know total tickers and modules has < 50%, it's stale
  if (knownTickerCount && knownTickerCount > 0 && file.count < knownTickerCount * 0.5) {
    logger.info(`[modules-client] Stale: only ${file.count}/${knownTickerCount} tickers scraped (< 50%)`)
    return true
  }

  // Check data quality — entries with all nulls don't count
  const entries = Object.values(file.modules || {})
  if (entries.length === 0) return true
  const populated = entries.filter(e =>
    e.dividendYield != null || e.roe != null || e.peRatio != null || e.margemLiquida != null
  ).length
  if (populated / entries.length < MIN_QUALITY_RATIO) {
    return true // Data exists but is mostly empty placeholders
  }

  return false
}

// ─── Derivation Formulas ────────────────────────────────────

function round2(v: number | null | undefined): number | null {
  if (v == null || !isFinite(v)) return null
  return Math.round(v * 100) / 100
}

/**
 * Calculate Dividend Yield from brapi dividend history.
 * Sum of dividends paid in the last 12 months / current price * 100
 */
function calculateDY(dividends: BrapiCashDividend[], currentPrice: number): number | null {
  if (!dividends.length || currentPrice <= 0) return null

  const oneYearAgo = new Date()
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
  const cutoff = oneYearAgo.toISOString().split('T')[0]!

  let totalDividends = 0
  let count = 0
  for (const div of dividends) {
    const payDate = div.paymentDate
    if (payDate && payDate >= cutoff) {
      totalDividends += div.rate
      count++
    }
  }

  if (count === 0 || totalDividends <= 0) return null
  const dy = (totalDividends / currentPrice) * 100
  // Sanity check: DY > 50% is almost certainly wrong
  return dy > 50 ? null : round2(dy)
}

function getLatestBalanceSheet(mod: BrapiModulesResult): BrapiBalanceSheetItem | null {
  const statements = mod.balanceSheetHistory?.balanceSheetStatements
  if (!statements || statements.length === 0) return null
  // Sort by date descending, return most recent
  const sorted = [...statements].sort((a, b) => b.endDate.raw - a.endDate.raw)
  return sorted[0] ?? null
}

function getLatestEbit(mod: BrapiModulesResult): number | null {
  const income = mod.incomeStatementHistory?.incomeStatementHistory
  if (!income || income.length === 0) return null
  const sorted = [...income].sort((a, b) => b.endDate.raw - a.endDate.raw)
  return sorted[0]?.ebit?.raw ?? null
}

function deriveFromModules(
  ticker: string,
  mod: BrapiModulesResult,
  dividends: BrapiCashDividend[],
  currentPrice: number,
  marketCap: number,
): DerivedModuleData {
  const stats = mod.defaultKeyStatistics
  const fin = mod.financialData
  const income = mod.incomeStatementHistory?.incomeStatementHistory
  const profile = mod.summaryProfile
  const bs = getLatestBalanceSheet(mod)
  const ebit = getLatestEbit(mod)

  // ── Valuation ──
  let peRatio: number | null = null
  if (stats?.forwardPE && stats.forwardPE > 0 && stats.forwardPE < 500) {
    peRatio = round2(stats.forwardPE)
  } else if (stats?.trailingEps && stats.trailingEps > 0 && currentPrice > 0) {
    peRatio = round2(currentPrice / stats.trailingEps)
  }

  const pbRatio = stats?.priceToBook && stats.priceToBook > 0
    ? round2(stats.priceToBook)
    : null

  const evEbitda = stats?.enterpriseToEbitda && stats.enterpriseToEbitda > 0
    ? round2(stats.enterpriseToEbitda)
    : null

  // PSR = marketCap / totalRevenue
  let psr: number | null = null
  if (marketCap > 0 && fin?.totalRevenue && fin.totalRevenue > 0) {
    psr = round2(marketCap / fin.totalRevenue)
  }

  // P/EBIT = marketCap / EBIT
  let pEbit: number | null = null
  if (marketCap > 0 && ebit && ebit > 0) {
    pEbit = round2(marketCap / ebit)
  }

  // EV/EBIT = enterpriseValue / EBIT
  let evEbit: number | null = null
  if (stats?.enterpriseValue && stats.enterpriseValue > 0 && ebit && ebit > 0) {
    evEbit = round2(stats.enterpriseValue / ebit)
  }

  // ── Quality ──
  const roe = fin?.returnOnEquity != null
    ? round2(fin.returnOnEquity * 100)
    : null

  const margemEbit = fin?.operatingMargins != null
    ? round2(fin.operatingMargins * 100)
    : null

  const margemLiquida = fin?.profitMargins != null
    ? round2(fin.profitMargins * 100)
    : null

  // ROIC = EBIT × (1 − 0.34) / (equity + netDebt)
  let roic: number | null = null
  if (ebit && ebit > 0 && bs?.totalStockholderEquity) {
    const netDebt = (fin?.totalDebt ?? 0) - (fin?.totalCash ?? 0)
    const investedCapital = bs.totalStockholderEquity + netDebt
    if (investedCapital > 0) {
      roic = round2((ebit * 0.66 / investedCapital) * 100)
    }
  }

  // ── Risk ──
  const liquidezCorrente = fin?.currentRatio != null && fin.currentRatio > 0
    ? round2(fin.currentRatio)
    : null

  const divBrutPatrim = fin?.debtToEquity != null
    ? round2(fin.debtToEquity / 100)
    : null

  let netDebtEbitda: number | null = null
  if (fin?.totalDebt != null && fin?.totalCash != null && fin?.ebitda && fin.ebitda > 0) {
    netDebtEbitda = round2((fin.totalDebt - fin.totalCash) / fin.ebitda)
  }

  // P/Cap.Giro = marketCap / (ativoCirculante − passivoCirculante)
  let pCapGiro: number | null = null
  if (marketCap > 0 && bs?.totalCurrentAssets != null && bs?.totalCurrentLiabilities != null) {
    const capitalGiro = bs.totalCurrentAssets - bs.totalCurrentLiabilities
    if (capitalGiro !== 0) {
      pCapGiro = round2(marketCap / capitalGiro)
    }
  }

  // P/Ativ.Circ.Líq = marketCap / (ativoCirculante − passivoTotal)
  let pAtivCircLiq: number | null = null
  if (marketCap > 0 && bs?.totalCurrentAssets != null && bs?.totalLiab != null) {
    const ativCircLiq = bs.totalCurrentAssets - bs.totalLiab
    if (ativCircLiq !== 0) {
      pAtivCircLiq = round2(marketCap / ativCircLiq)
    }
  }

  // P/Ativo = marketCap / ativoTotal
  let pAtivo: number | null = null
  if (marketCap > 0 && bs?.totalAssets && bs.totalAssets > 0) {
    pAtivo = round2(marketCap / bs.totalAssets)
  }

  // Patrimônio Líquido
  let patrimLiquido: number | null = null
  if (bs?.totalStockholderEquity != null) {
    patrimLiquido = bs.totalStockholderEquity
  } else if (stats?.bookValue && stats?.sharesOutstanding) {
    patrimLiquido = round2(stats.bookValue * stats.sharesOutstanding)
  }

  // ── Dividends ──
  const dividendYield = calculateDY(dividends, currentPrice)

  let payout: number | null = null
  if (stats?.netIncomeToCommon && stats.netIncomeToCommon > 0 && stats?.lastDividendValue && stats?.sharesOutstanding) {
    const totalDiv = stats.lastDividendValue * stats.sharesOutstanding
    payout = round2((totalDiv / stats.netIncomeToCommon) * 100)
    if (payout != null && (payout > 200 || payout < 0)) payout = null
  }

  // ── Growth ──
  let crescLucro5a: number | null = null
  if (income && income.length >= 2) {
    const sorted = [...income].sort((a, b) => a.endDate.raw - b.endDate.raw)
    const oldest = sorted[0]!
    const newest = sorted[sorted.length - 1]!
    const years = (newest.endDate.raw - oldest.endDate.raw) / (365.25 * 24 * 60 * 60)
    if (years > 0 && oldest.netIncome.raw > 0 && newest.netIncome.raw > 0) {
      crescLucro5a = round2((Math.pow(newest.netIncome.raw / oldest.netIncome.raw, 1 / years) - 1) * 100)
      if (crescLucro5a != null && (crescLucro5a > 500 || crescLucro5a < -100)) crescLucro5a = null
    }
  }

  return {
    ticker,
    peRatio,
    pbRatio,
    evEbitda,
    psr,
    pEbit,
    evEbit,
    pAtivo,
    pCapGiro,
    pAtivCircLiq,
    roe,
    roic,
    margemEbit,
    margemLiquida,
    liquidezCorrente,
    divBrutPatrim,
    netDebtEbitda,
    patrimLiquido,
    dividendYield,
    payout,
    crescLucro5a,
    revenueGrowth: fin?.revenueGrowth != null ? round2(fin.revenueGrowth * 100) : null,
    earningsGrowth: fin?.earningsGrowth != null ? round2(fin.earningsGrowth * 100) : null,
    fiftyTwoWeekHigh: stats?.fiftyTwoWeekHigh ?? null,
    fiftyTwoWeekLow: stats?.fiftyTwoWeekLow ?? null,
    enterpriseValue: stats?.enterpriseValue ?? null,
    ebitda: fin?.ebitda ?? null,
    freeCashflow: fin?.freeCashflow ?? null,
    floatShares: stats?.floatShares ?? null,
    sharesOutstanding: stats?.sharesOutstanding ?? null,
    sector: profile?.sector ?? null,
    industry: profile?.industry ?? null,
    fetchedAt: new Date().toISOString(),
  }
}

// ─── Incremental Scraper ────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Fetch modules + dividends for a single ticker with retry on network errors.
 * Returns null entry (all fields null + fetchedAt) for tickers not found on brapi.
 */
async function fetchTickerModules(
  ticker: string,
  price: number,
  mktCap: number,
): Promise<{ data: DerivedModuleData; success: boolean }> {
  let raw: BrapiModulesResult | null = null
  let lastError: unknown = null

  // Try up to 2 times (1 retry on network error)
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      raw = await fetchModules(ticker)
      lastError = null
      break
    } catch (err) {
      lastError = err
      // Only retry on network/timeout errors, not 404
      const msg = err instanceof Error ? err.message : String(err)
      if (msg.includes('404') || msg.includes('not found')) {
        break
      }
      if (attempt === 0) {
        logger.info(`[modules-client] Retry ${ticker} after network error`)
        await sleep(1000)
      }
    }
  }

  if (lastError && !raw) {
    // Network failure after retry — save null entry to avoid re-fetching
    return {
      data: makeNullEntry(ticker),
      success: false,
    }
  }

  if (!raw) {
    // Ticker not found on brapi — save null entry with fetchedAt
    return {
      data: makeNullEntry(ticker),
      success: false,
    }
  }

  let dividends: BrapiCashDividend[] = []
  try {
    dividends = await fetchDividends(ticker)
  } catch {
    // Dividends are optional, continue without
  }

  const derived = deriveFromModules(ticker, raw, dividends, price, mktCap)
  return { data: derived, success: true }
}

/** Create a null entry so we don't re-fetch tickers that don't exist on brapi */
function makeNullEntry(ticker: string): DerivedModuleData {
  return {
    ticker,
    peRatio: null, pbRatio: null, evEbitda: null, psr: null, pEbit: null,
    evEbit: null, pAtivo: null, pCapGiro: null, pAtivCircLiq: null,
    roe: null, roic: null, margemEbit: null, margemLiquida: null,
    liquidezCorrente: null, divBrutPatrim: null, netDebtEbitda: null,
    patrimLiquido: null, dividendYield: null, payout: null,
    crescLucro5a: null, revenueGrowth: null, earningsGrowth: null,
    fiftyTwoWeekHigh: null, fiftyTwoWeekLow: null,
    enterpriseValue: null, ebitda: null, freeCashflow: null,
    floatShares: null, sharesOutstanding: null,
    sector: null, industry: null,
    fetchedAt: new Date().toISOString(),
  }
}

/** Log summary of populated fields after scrape */
function logScrapeStats(label: string, modules: Map<string, DerivedModuleData>): void {
  let withDY = 0, withROE = 0, withPE = 0, nullEntries = 0
  for (const entry of modules.values()) {
    if (entry.dividendYield != null) withDY++
    if (entry.roe != null) withROE++
    if (entry.peRatio != null) withPE++
    if (entry.roe == null && entry.peRatio == null && entry.dividendYield == null) nullEntries++
  }
  logger.info(
    `[modules-client] ${label}: ${modules.size} total, ${withDY} with DY, ${withROE} with ROE, ${withPE} with P/E, ${nullEntries} empty`
  )
}

/**
 * Fetch modules + dividends for NEW tickers only (incremental).
 * Respects brapi rate limits.
 */
export async function scrapeNewModules(
  allTickers: string[],
  existing: Map<string, DerivedModuleData>,
  priceMap?: Map<string, number>,
  marketCapMap?: Map<string, number>,
): Promise<Map<string, DerivedModuleData>> {
  const newTickers = allTickers.filter(t => !existing.has(t))

  if (newTickers.length === 0) {
    logger.info('[modules-client] No new tickers to fetch')
    return existing
  }

  logger.info(`[modules-client] Fetching modules for ${newTickers.length} new tickers`)

  const result = new Map(existing)
  let fetched = 0
  let failed = 0

  for (const ticker of newTickers) {
    const price = priceMap?.get(ticker) ?? 0
    const mktCap = marketCapMap?.get(ticker) ?? 0

    const { data, success } = await fetchTickerModules(ticker, price, mktCap)
    result.set(ticker, data)
    if (success) fetched++
    else failed++

    if (newTickers.indexOf(ticker) < newTickers.length - 1) {
      await sleep(DELAY_MS)
    }

    if ((fetched + failed) % 25 === 0) {
      logger.info(`[modules-client] Progress: ${fetched + failed}/${newTickers.length} (${fetched} ok, ${failed} failed)`)
      saveModules(result)
    }
  }

  logScrapeStats('Scrape complete', result)
  saveModules(result)

  return result
}

/**
 * Force rescrape ALL tickers (ignores existing cache).
 * Used by admin endpoint for full re-population.
 */
export async function rescrapeAllModules(
  allTickers: string[],
  priceMap?: Map<string, number>,
  marketCapMap?: Map<string, number>,
): Promise<Map<string, DerivedModuleData>> {
  logger.info(`[modules-client] Starting FULL rescrape for ${allTickers.length} tickers`)

  const result = new Map<string, DerivedModuleData>()
  let fetched = 0
  let failed = 0

  for (const ticker of allTickers) {
    const price = priceMap?.get(ticker) ?? 0
    const mktCap = marketCapMap?.get(ticker) ?? 0

    const { data, success } = await fetchTickerModules(ticker, price, mktCap)
    result.set(ticker, data)
    if (success) fetched++
    else failed++

    if (allTickers.indexOf(ticker) < allTickers.length - 1) {
      await sleep(DELAY_MS)
    }

    if ((fetched + failed) % 25 === 0) {
      logger.info(`[modules-client] Progress: ${fetched + failed}/${allTickers.length} (${fetched} ok, ${failed} failed)`)
      saveModules(result)
    }
  }

  logScrapeStats('Rescrape complete', result)
  saveModules(result)

  return result
}
