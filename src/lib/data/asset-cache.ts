// ─── Asset Cache (SWR) ───────────────────────────────────────
// Stale-While-Revalidate cache for the asset dataset.
// Owns AssetData type + all cache state.

import type { AqScoreResult } from '../scoring/iq-score'
import type { MultiLensScores } from '../scoring/lenses'

// ─── Public Asset Type ──────────────────────────────────────

export interface AssetData {
  id: string
  ticker: string
  name: string
  type: 'stock'
  sector: string
  price: number
  change: number
  changePercent: number
  logo: string | null
  volume: number | null
  marketCap: number | null
  fiftyTwoWeekHigh: number | null
  fiftyTwoWeekLow: number | null
  hasFundamentals: boolean
  aqScore: {
    scoreTotal: number
    scoreBruto: number
    scoreValuation: number
    scoreQuality: number
    scoreGrowth: number
    scoreDividends: number
    scoreRisk: number
    scoreQualitativo: number
    confidence: number
  } | null
  lensScores: MultiLensScores | null
  scoreBreakdown: AqScoreResult | null
  killSwitch?: { triggered: boolean; reason: string | null }
  fundamentals: {
    peRatio: number | null
    pbRatio: number | null
    psr: number | null
    pEbit: number | null
    evEbit: number | null
    evEbitda: number | null
    roe: number | null
    roic: number | null
    margemEbit: number | null
    margemLiquida: number | null
    liquidezCorrente: number | null
    divBrutPatrim: number | null
    pCapGiro: number | null
    pAtivCircLiq: number | null
    pAtivo: number | null
    patrimLiquido: number | null
    dividendYield: number | null
    netDebtEbitda: number | null
    crescimentoReceita5a: number | null
    liq2meses: number | null
    freeCashflow: number | null
    netDebt: number | null
    ebitda: number | null
    fcfGrowthRate: number | null     // CAGR do FCF 5 anos (%)
    debtCostEstimate: number | null  // Custo estimado da dívida (%)
    totalDebt: number | null         // Dívida bruta (R$)
  }
}

// ─── Cache Config ───────────────────────────────────────────

export const CACHE_TTL = 5 * 60 * 1000       // 5 min fresh window
export const STALE_MAX = 30 * 60 * 1000      // 30 min max stale before forced sync

// ─── Cache State ────────────────────────────────────────────

let cachedAssets: AssetData[] | null = null
let previousAssets: AssetData[] | null = null
let cacheExpiry = 0
let isRebuilding = false
let lastBuildError: Error | null = null
let lastSuccessfulBuild = 0
let lastDataSource: 'live' | null = null

// ─── Cache API ──────────────────────────────────────────────

export function getCachedAssets(): AssetData[] | null {
  return cachedAssets
}

export function getPreviousAssets(): AssetData[] | null {
  return previousAssets
}

export function setCachedAssets(data: AssetData[]): void {
  if (cachedAssets) previousAssets = cachedAssets
  cachedAssets = data
  cacheExpiry = Date.now() + CACHE_TTL
  lastSuccessfulBuild = Date.now()
  lastDataSource = 'live'
  lastBuildError = null
}

export function isFresh(): boolean {
  return cachedAssets !== null && Date.now() < cacheExpiry
}

export function isStale(): boolean {
  return cachedAssets !== null && Date.now() >= cacheExpiry
}

export function isBeyondStaleMax(): boolean {
  return lastSuccessfulBuild > 0 && Date.now() >= lastSuccessfulBuild + STALE_MAX
}

export function getIsRebuilding(): boolean {
  return isRebuilding
}

export function setIsRebuilding(value: boolean): void {
  isRebuilding = value
}

export function setLastBuildError(err: Error | null): void {
  lastBuildError = err
}

export function getDataSource(): 'live' | null {
  return lastDataSource
}

export function getCacheStatus() {
  const now = Date.now()
  return {
    hasCache: cachedAssets !== null,
    isStale: cachedAssets !== null && now >= cacheExpiry,
    isRebuilding,
    cacheAge: lastSuccessfulBuild > 0 ? now - lastSuccessfulBuild : null,
    lastError: lastBuildError?.message ?? null,
    dataSource: lastDataSource,
    assetCount: cachedAssets?.length ?? 0,
  }
}
