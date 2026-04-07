// ─── Unified Fundamentals Route ──────────────────────────────
// Serves fundamental data from CVM (primary) + brapi modules (secondary).
// Zero scraping — all data from structured APIs and official CSVs.
//
// Priority: CVM (official government data) > brapi modules (API-derived)
// Fields not in CVM: DY (brapi dividends), liq2meses (volume accumulator)

import { Router } from 'express'
import type { Request, Response } from 'express'
import { cache } from '../cache/index.js'
import { config } from '../config.js'
import { logger } from '../logger.js'
import { readJsonFile, writeJsonFile } from '../persistence/index.js'
import type { FundamentalData } from '../types.js'
import {
  loadCvmData,
  loadCnpjTickerMap,
  getCvmFundamentals,
  type MarketQuote,
} from '../providers/cvm-financials-client.js'
import { loadModulesMap, isModulesStale, scrapeNewModules, type DerivedModuleData } from '../providers/modules-client.js'
import { getAllLiq2Meses } from '../providers/volume-accumulator.js'
import { getQualitativeMap } from './qualitative.js'

const router = Router()

const CACHE_KEY = 'fundamentals-unified:all'
const DISK_FILE = 'fundamentals-unified.json'

interface FundamentalsSnapshot {
  version: number
  fetchedAt: string
  count: number
  data: FundamentalData[]
}

/** Persist unified fundamentals to disk for fast recovery after restart */
function persistFundamentals(data: FundamentalData[]): void {
  if (data.length < 50) return // Don't persist garbage data
  writeJsonFile<FundamentalsSnapshot>(DISK_FILE, {
    version: 1,
    fetchedAt: new Date().toISOString(),
    count: data.length,
    data,
  })
}

/** Load last-known-good fundamentals from disk (fallback when live build fails) */
function loadFromDisk(): FundamentalData[] | null {
  const snapshot = readJsonFile<FundamentalsSnapshot>(DISK_FILE)
  if (!snapshot?.data?.length) return null
  return snapshot.data
}

/**
 * Build unified fundamentals from CVM + brapi modules + volume accumulator.
 * CVM is the primary source; modules fill gaps for stocks without CVM data.
 */
function buildUnifiedFundamentals(): FundamentalData[] {
  // 1. Get CVM fundamentals (need market quotes from cache)
  interface CachedQuote {
    stock: string
    close: number
    market_cap: number
    volume: number
  }
  const quotesCache = cache.getStale<CachedQuote[]>('quotes:all')
  if (!quotesCache || quotesCache.length === 0) {
    logger.warn('[unified] No quotes cache — cannot calculate indicators')
    return []
  }

  // Build price/market data lookups
  const priceMap = new Map<string, number>()
  const marketCapMap = new Map<string, number>()
  for (const q of quotesCache) {
    priceMap.set(q.stock, q.close)
    marketCapMap.set(q.stock, q.market_cap)
  }

  // 2. CVM fundamentals (official, ~530 companies)
  const cvmData = loadCvmData()
  const tickerMap = loadCnpjTickerMap()
  const marketQuotes: MarketQuote[] = quotesCache
    .filter(q => q.close > 0 && q.market_cap > 0)
    .map(q => ({ ticker: q.stock, price: q.close, marketCap: q.market_cap }))

  const cvmFundamentals = getCvmFundamentals(cvmData, tickerMap, marketQuotes)
  const cvmMap = new Map<string, FundamentalData>()
  for (const f of cvmFundamentals) {
    cvmMap.set(f.ticker, f)
  }

  // 3. brapi modules (secondary, ~700+ companies)
  const modulesMap = loadModulesMap()

  // Include ALL quote tickers (units, PNB, etc.) for modules scrape coverage
  const quoteTickers = quotesCache.map(q => q.stock).filter(t => /^[A-Z]{4}\d{1,2}$/.test(t))
  const allKnownTickers = [...new Set([...cvmFundamentals.map(f => f.ticker), ...modulesMap.keys(), ...quoteTickers])]
  if (isModulesStale(allKnownTickers.length)) {
    logger.info(`[unified] Modules stale (${modulesMap.size}/${allKnownTickers.length} tickers) — triggering background rescrape`)
    scrapeNewModules(allKnownTickers, modulesMap, priceMap, marketCapMap).catch(err => {
      logger.error({ err }, '[unified] Background modules rescrape failed')
    })
  }

  // 4. Volume accumulator for liq2meses
  const liq2mesesMap = getAllLiq2Meses()

  // 4b. Qualitative metrics
  const qualitativeMap = getQualitativeMap()

  // 5. Merge: for each known ticker, build FundamentalData
  const allTickers = new Set<string>()
  for (const f of cvmFundamentals) allTickers.add(f.ticker)
  for (const [ticker] of modulesMap) allTickers.add(ticker)

  const results: FundamentalData[] = []

  for (const ticker of allTickers) {
    const cvm = cvmMap.get(ticker)
    const mod = modulesMap.get(ticker)
    const price = priceMap.get(ticker) ?? 0
    const liq2meses = liq2mesesMap.get(ticker) ?? null

    const quali = qualitativeMap.get(ticker)

    if (cvm) {
      // CVM is primary — fill ALL null gaps from brapi modules
      results.push({
        ...cvm,
        // ─── Fallback chain: CVM → brapi modules → null ──────
        peRatio: cvm.peRatio ?? mod?.peRatio ?? null,
        pbRatio: cvm.pbRatio ?? mod?.pbRatio ?? null,
        psr: cvm.psr ?? mod?.psr ?? null,
        pEbit: cvm.pEbit ?? mod?.pEbit ?? null,
        evEbit: cvm.evEbit ?? mod?.evEbit ?? null,
        evEbitda: cvm.evEbitda ?? mod?.evEbitda ?? null,
        roe: cvm.roe ?? mod?.roe ?? null,
        roic: cvm.roic ?? mod?.roic ?? null,
        margemEbit: cvm.margemEbit ?? mod?.margemEbit ?? null,
        margemLiquida: cvm.margemLiquida ?? mod?.margemLiquida ?? null,
        liquidezCorrente: cvm.liquidezCorrente ?? mod?.liquidezCorrente ?? null,
        divBrutPatrim: cvm.divBrutPatrim ?? mod?.divBrutPatrim ?? null,
        pAtivo: cvm.pAtivo ?? mod?.pAtivo ?? null,
        pCapGiro: cvm.pCapGiro ?? mod?.pCapGiro ?? null,
        pAtivCircLiq: cvm.pAtivCircLiq ?? mod?.pAtivCircLiq ?? null,
        patrimLiquido: cvm.patrimLiquido ?? mod?.patrimLiquido ?? null,
        dividendYield: cvm.dividendYield ?? mod?.dividendYield ?? null,
        netDebtEbitda: cvm.netDebtEbitda ?? mod?.netDebtEbitda ?? null,
        payout: cvm.payout ?? mod?.payout ?? null,
        crescLucro5a: cvm.crescLucro5a ?? mod?.crescLucro5a ?? null,
        crescimentoReceita5a: cvm.crescimentoReceita5a ?? mod?.revenueGrowth ?? null,
        fiftyTwoWeekHigh: cvm.fiftyTwoWeekHigh ?? mod?.fiftyTwoWeekHigh ?? null,
        fiftyTwoWeekLow: cvm.fiftyTwoWeekLow ?? mod?.fiftyTwoWeekLow ?? null,
        freeCashflow: mod?.freeCashflow ?? null,
        ebitda: mod?.ebitda ?? null,
        liq2meses: liq2meses,
        // ─── Qualitative metrics ──────────────────────────────
        accrualsRatio: quali?.accrualsRatio ?? null,
        earningsQuality: quali?.earningsQuality ?? null,
        fcfToNetIncome: quali?.fcfToNetIncome ?? null,
        fcfFromCvm: quali?.fcf ?? null,
        fcfYield: quali?.fcfYield ?? null,
        fcfGrowthRate: quali?.fcfGrowthRate ?? null,
        moatScore: quali?.moatScore ?? null,
        moatClassification: quali?.moatClassification ?? null,
        earningsManipulationFlag: quali?.earningsManipulationFlag ?? null,
        managementScore: quali?.managementScore ?? null,
        debtSustainabilityScore: quali?.debtSustainabilityScore ?? null,
        regulatoryRiskScore: quali?.regulatoryRiskScore ?? null,
        // Live signal fields
        governanceScore: quali?.governanceScore ?? null,
        listingSegment: quali?.listingSegment ?? null,
        listingSegmentScore: quali?.listingSegmentScore ?? null,
        freeFloatScore: quali?.freeFloatScore ?? null,
        cvmSanctionsScore: quali?.cvmSanctionsScore ?? null,
        ceoTenureScore: quali?.ceoTenureScore ?? null,
        buybackSignal: quali?.buybackSignal ?? null,
        newsSentimentScore: quali?.newsSentimentScore ?? null,
        catalystAlertScore: quali?.catalystAlertScore ?? null,
        riEventVolume: quali?.riEventVolume ?? null,
        marginStability: quali?.marginStability ?? null,
        pricingPower: quali?.pricingPower ?? null,
        reinvestmentRate: quali?.reinvestmentRate ?? null,
        interestCoverage: quali?.interestCoverage ?? null,
        shortTermDebtRatio: quali?.shortTermDebtRatio ?? null,
        debtCostEstimate: quali?.debtCostEstimate ?? null,
      })
    } else if (mod) {
      // No CVM data — build from modules only (no qualitative available)
      results.push(buildFromModules(ticker, mod, price, liq2meses))
    }
  }

  logger.info({
    total: results.length,
    fromCvm: cvmMap.size,
    fromModules: results.length - cvmMap.size,
    withLiq2meses: [...liq2mesesMap.keys()].length,
  }, 'Unified fundamentals built')

  return results
}

/**
 * Build FundamentalData from brapi modules when CVM is not available.
 */
function buildFromModules(
  ticker: string,
  mod: DerivedModuleData,
  price: number,
  liq2meses: number | null,
): FundamentalData {
  return {
    ticker,
    cotacao: price,
    peRatio: mod.peRatio,
    pbRatio: mod.pbRatio,
    psr: mod.psr,
    dividendYield: mod.dividendYield,
    pAtivo: mod.pAtivo,
    pCapGiro: mod.pCapGiro,
    pEbit: mod.pEbit,
    pAtivCircLiq: mod.pAtivCircLiq,
    evEbit: mod.evEbit,
    evEbitda: mod.evEbitda,
    margemEbit: mod.margemEbit,
    margemLiquida: mod.margemLiquida,
    liquidezCorrente: mod.liquidezCorrente,
    roic: mod.roic,
    roe: mod.roe,
    liq2meses,
    patrimLiquido: mod.patrimLiquido,
    divBrutPatrim: mod.divBrutPatrim,
    crescimentoReceita5a: mod.revenueGrowth,
    netDebtEbitda: mod.netDebtEbitda,
    payout: mod.payout,
    crescLucro5a: mod.crescLucro5a,
    fiftyTwoWeekHigh: mod.fiftyTwoWeekHigh,
    fiftyTwoWeekLow: mod.fiftyTwoWeekLow,
    freeCashflow: mod.freeCashflow,
    ebitda: mod.ebitda,
    trendScore: null,  // Trend only from CVM (requires historical data)
    roeMedia5a: null,
    mrgLiquidaMedia5a: null,
    // Qualitative: not available without CVM data
    accrualsRatio: null,
    earningsQuality: null,
    fcfToNetIncome: null,
    fcfFromCvm: null,
    fcfYield: null,
    fcfGrowthRate: null,
    moatScore: null,
    moatClassification: null,
    earningsManipulationFlag: null,
    managementScore: null,
    debtSustainabilityScore: null,
    regulatoryRiskScore: null,
    governanceScore: null,
    listingSegment: null,
    listingSegmentScore: null,
    freeFloatScore: null,
    cvmSanctionsScore: null,
    ceoTenureScore: null,
    buybackSignal: null,
    newsSentimentScore: null,
    catalystAlertScore: null,
    riEventVolume: null,
    marginStability: null,
    pricingPower: null,
    reinvestmentRate: null,
    interestCoverage: null,
    shortTermDebtRatio: null,
    debtCostEstimate: null,
  }
}

// ─── Exported helpers for server.ts ─────────────────────────

/**
 * Warm unified fundamentals cache from disk snapshot.
 * Returns true if data was loaded into memory.
 */
export function warmUnifiedCache(): boolean {
  const diskData = loadFromDisk()
  if (diskData && diskData.length > 0) {
    cache.set(CACHE_KEY, diskData, config.cache.fundamentals)
    logger.info(`[unified] Warmed from disk: ${diskData.length} fundamentals`)
    return true
  }
  return false
}

/**
 * Build and cache unified fundamentals. Persists to disk for restart recovery.
 */
export function refreshUnifiedCache(): FundamentalData[] {
  const data = buildUnifiedFundamentals()
  if (data.length > 0) {
    cache.set(CACHE_KEY, data, config.cache.fundamentals)
    persistFundamentals(data)
  }
  return data
}

// ─── Routes ─────────────────────────────────────────────────

// GET /v1/fundamentals/all — all unified fundamentals
router.get('/all', (_req: Request, res: Response) => {
  try {
    // Try fresh cache first
    const cached = cache.get<FundamentalData[]>(CACHE_KEY)
    if (cached) {
      return res.json({
        data: cached,
        source: 'unified',
        cached: true,
        count: cached.length,
        fetchedAt: new Date().toISOString(),
      })
    }

    // Build fresh
    let data = buildUnifiedFundamentals()
    if (data.length > 0) {
      cache.set(CACHE_KEY, data, config.cache.fundamentals)
      persistFundamentals(data)
    } else {
      // Live build returned empty — fall back to stale cache, then disk snapshot
      const staleData = cache.getStale<FundamentalData[]>(CACHE_KEY)
      if (staleData && staleData.length > 0) {
        data = staleData
        logger.warn(`[unified] Live build empty — serving ${data.length} from stale cache`)
      } else {
        const diskData = loadFromDisk()
        if (diskData && diskData.length > 0) {
          data = diskData
          cache.set(CACHE_KEY, data, config.cache.fundamentals)
          logger.warn(`[unified] Live build empty — serving ${data.length} from disk fallback`)
        }
      }
    }

    res.json({
      data,
      source: 'unified',
      cached: false,
      count: data.length,
      fetchedAt: new Date().toISOString(),
    })
  } catch (err) {
    logger.error({ err }, 'Unified fundamentals route error')
    // Last resort: serve stale cache or disk even on error
    const fallback = cache.getStale<FundamentalData[]>(CACHE_KEY) ?? loadFromDisk()
    if (fallback && fallback.length > 0) {
      return res.json({
        data: fallback,
        source: 'unified',
        cached: true,
        count: fallback.length,
        fetchedAt: new Date().toISOString(),
      })
    }
    res.status(500).json({ error: 'Failed to build unified fundamentals' })
  }
})

// GET /v1/fundamentals?tickers=PETR4,VALE3,...
router.get('/', (req: Request, res: Response) => {
  const tickers = (req.query['tickers'] as string)
    ?.toUpperCase()
    .split(',')
    .filter(Boolean)

  if (!tickers?.length) {
    return res.status(400).json({ error: 'Missing required parameter: tickers' })
  }

  try {
    let all = cache.get<FundamentalData[]>(CACHE_KEY)
    if (!all) {
      all = buildUnifiedFundamentals()
      if (all.length > 0) {
        cache.set(CACHE_KEY, all, config.cache.fundamentals)
      }
    }

    const tickerSet = new Set(tickers)
    const data = all.filter(d => tickerSet.has(d.ticker))

    res.json({
      data,
      source: 'unified',
      cached: true,
      count: data.length,
      totalAvailable: all.length,
      fetchedAt: new Date().toISOString(),
    })
  } catch (err) {
    logger.error({ err }, 'Unified fundamentals filtered route error')
    res.status(500).json({ error: 'Failed to get fundamentals' })
  }
})

export { router as unifiedFundamentalsRoutes }
