// ─── Data Orchestrator ───────────────────────────────────────
// Single entry point for the asset dataset.
// Coordinates: fetch → merge → score → cache (SWR pattern).

import type { AssetData } from './asset-cache'
import {
  getCachedAssets,
  setCachedAssets,
  isFresh,
  isBeyondStaleMax,
  getIsRebuilding,
  setIsRebuilding,
  setLastBuildError,
} from './asset-cache'
import { fetchAllFromGateway } from './data-fetcher'
import { mergeAssetData } from './data-merger'
import { scoreAsset, assetWithoutScore } from './scoring-pipeline'
import type { ScoringContext } from './scoring-pipeline'
import type { GatewayFundamental } from '../gateway-client'
import { fetchBenchmarks, fetchMacroIndicators, fetchHistory } from '../gateway-client'
import { detectRegime, type RegimeConfig } from '../scoring/regime-detector'
import { saveScoreSnapshot, detectScoreAlerts } from '@/lib/score-history'
import { fetchAssetsFromInvestIQ } from './investiq-adapter'
import { investiq } from '../investiq-client'

// ─── Cached Regime ──────────────────────────────────────────
let cachedRegime: RegimeConfig | null = null
let regimeFetchedAt = 0
const REGIME_TTL = 30 * 60 * 1000 // 30 minutes

export function getCurrentRegime(): RegimeConfig | null {
  return cachedRegime
}

async function refreshRegime(): Promise<RegimeConfig> {
  const now = Date.now()
  if (cachedRegime && now - regimeFetchedAt < REGIME_TTL) return cachedRegime

  // Try InvestIQ backend first for regime
  try {
    const regimeData = await investiq.get<{
      regime: string; macro: { selic: number; ipca: number }
    }>('/analytics/regime')
    const selic = regimeData.macro?.selic ?? 14
    const ipca = regimeData.macro?.ipca ?? 4
    const regime = detectRegime(selic, ipca)
    cachedRegime = regime
    regimeFetchedAt = now
    return regime
  } catch {
    // Fallback: try Gateway
    try {
      const [benchmarks, macro, ibovHistory] = await Promise.all([
        fetchBenchmarks(),
        fetchMacroIndicators().catch(() => null),
        fetchHistory('^BVSP', '1mo', '1d').catch(() => []),
      ])
      const selic = benchmarks.selic.rate
      const ipca12m = macro?.ipca12m?.valor ?? 0
      let vol30d = 0
      if (ibovHistory.length >= 5) {
        const returns = ibovHistory.slice(1).map((d, i) => {
          const prev = ibovHistory[i]!.close
          return prev > 0 ? Math.log(d.close / prev) : 0
        })
        const mean = returns.reduce((s, r) => s + r, 0) / returns.length
        const variance = returns.reduce((s, r) => s + (r - mean) ** 2, 0) / (returns.length - 1)
        vol30d = Math.sqrt(variance) * Math.sqrt(252) * 100
      }
      const regime = detectRegime(selic, ipca12m, vol30d)
      cachedRegime = regime
      regimeFetchedAt = now
      return regime
    } catch {
      if (cachedRegime) return cachedRegime
      return detectRegime(14) // default: current high SELIC
    }
  }
}

// ─── Public API ─────────────────────────────────────────────

/**
 * Get the full asset dataset using stale-while-revalidate pattern.
 * - Fresh cache → return immediately
 * - Stale cache + not rebuilding → trigger background rebuild, return stale
 * - Stale cache + rebuilding → return stale (another rebuild is in progress)
 * - No cache or stale > STALE_MAX → synchronous rebuild (cold start)
 * Throws error if gateway unavailable and no cache exists.
 */
export async function getAssets(): Promise<AssetData[]> {
  const cached = getCachedAssets()

  // 1. Cache fresh — return immediately
  if (cached && isFresh()) return cached

  // 2. Cache stale + already rebuilding — return stale data
  if (cached && getIsRebuilding()) return cached

  // 3. Cache stale + within STALE_MAX — background revalidate
  if (cached && !isBeyondStaleMax()) {
    setIsRebuilding(true)
    buildLiveDataset()
      .then(data => {
        setCachedAssets(data)
        console.log(`[SWR] Background rebuild: ${data.length} stocks`)
        saveSnapshotQuietly(data)
      })
      .catch(async (err) => {
        // Gateway failed — try InvestIQ backend
        try {
          const iqData = await fetchAssetsFromInvestIQ()
          if (iqData.length > 0) {
            setCachedAssets(iqData)
            console.log(`[SWR] Background rebuild via InvestIQ: ${iqData.length} stocks`)
          }
        } catch {
          setLastBuildError(err as Error)
          console.error('[SWR] Background rebuild failed:', (err as Error).message)
        }
      })
      .finally(() => setIsRebuilding(false))
    return cached
  }

  // 4. Cold start OR stale beyond STALE_MAX — synchronous rebuild
  try {
    setIsRebuilding(true)
    const assets = await buildLiveDataset()
    setCachedAssets(assets)
    console.log(`[data-source] Live dataset: ${assets.length} stocks from gateway`)
    saveSnapshotQuietly(assets)
    return assets
  } catch (err) {
    // Gateway failed — try InvestIQ backend as fallback
    console.warn('[data-source] Gateway unavailable, trying InvestIQ backend...', (err as Error).message)
    try {
      const investiqAssets = await fetchAssetsFromInvestIQ()
      if (investiqAssets.length > 0) {
        setCachedAssets(investiqAssets)
        console.log(`[data-source] Live dataset: ${investiqAssets.length} stocks from InvestIQ backend`)
        return investiqAssets
      }
    } catch (iqErr) {
      console.warn('[data-source] InvestIQ backend also unavailable:', (iqErr as Error).message)
    }

    setLastBuildError(err as Error)
    if (cached) {
      console.warn('[data-source] Serving expired cache as fallback')
      return cached
    }
    throw new Error(`Both Gateway and InvestIQ backend unavailable, no cached data`)
  } finally {
    setIsRebuilding(false)
  }
}

/**
 * Find a single asset by ticker from the cached dataset.
 */
export async function getAssetByTicker(ticker: string): Promise<AssetData | undefined> {
  const assets = await getAssets()
  return assets.find((a) => a.ticker.toUpperCase() === ticker.toUpperCase())
}

// ─── Builder ────────────────────────────────────────────────

async function buildLiveDataset(): Promise<AssetData[]> {
  const [bundle, regime] = await Promise.all([
    fetchAllFromGateway(),
    refreshRegime(),
  ])

  // Build fundamentals lookup by ticker
  const fundMap = new Map<string, GatewayFundamental>()
  for (const f of bundle.fundamentals) {
    fundMap.set(f.ticker, f)
  }

  const scoringCtx: ScoringContext = {
    newsArticles: bundle.newsArticles,
    macroMomentumScore: bundle.macroMomentumScore,
    regimeWeights: regime.pillarWeights,
    betaMap: bundle.betaMap,
    cagedData: bundle.cagedData,
  }

  const assets: AssetData[] = []
  let idx = 0

  for (const q of bundle.quotes) {
    // Skip fractional shares (e.g. BBDC4F, ITUB4F)
    if (/\d+F$/i.test(q.stock)) continue

    const fund = fundMap.get(q.stock)
    const company = bundle.companies.get(q.stock)

    idx++
    const merged = mergeAssetData(q, fund, company, idx)

    if (fund) {
      assets.push(scoreAsset(merged, fund, scoringCtx))
    } else {
      assets.push(assetWithoutScore(merged))
    }
  }

  // ─── Dedup ON/PN: manter apenas o ticker mais líquido por empresa ───
  return deduplicateVariants(assets)
}

// ─── Dedup ON/PN ────────────────────────────────────────────

const TICKER_BASE_RE = /^([A-Z]{4})\d{1,2}$/

/**
 * Deduplica variantes ON/PN/UNIT da mesma empresa.
 * Para cada grupo (PETR3/PETR4, ITUB3/ITUB4), mantém apenas o ticker
 * com maior volume. Se volumes iguais, prefere PN(4) > UNIT(11) > ON(3).
 */
function deduplicateVariants(assets: AssetData[]): AssetData[] {
  const groups = new Map<string, AssetData[]>()

  for (const asset of assets) {
    const match = TICKER_BASE_RE.exec(asset.ticker)
    if (!match) {
      // Ticker fora do padrão (ex: índices) — manter sempre
      groups.set(asset.ticker, [asset])
      continue
    }
    const base = match[1]!
    const existing = groups.get(base)
    if (existing) {
      existing.push(asset)
    } else {
      groups.set(base, [asset])
    }
  }

  const result: AssetData[] = []
  for (const group of groups.values()) {
    if (group.length === 1) {
      result.push(group[0]!)
      continue
    }
    // Escolher o mais líquido; empate: PN(4) > UNIT(11) > ON(3) > outros
    group.sort((a, b) => {
      const volA = (a.volume ?? 0) * (a.price ?? 0)
      const volB = (b.volume ?? 0) * (b.price ?? 0)
      if (volB !== volA) return volB - volA
      // Empate por volume: preferir PN
      return suffixPriority(a.ticker) - suffixPriority(b.ticker)
    })
    result.push(group[0]!)
  }

  const removed = assets.length - result.length
  if (removed > 0) {
    console.log(`[dedup] Removidas ${removed} variantes ON/PN duplicadas`)
  }
  return result
}

function suffixPriority(ticker: string): number {
  if (ticker.endsWith('4')) return 0  // PN — mais líquida na B3
  if (ticker.endsWith('11')) return 1 // UNIT
  if (ticker.endsWith('3')) return 2  // ON
  return 3 // outros (5, 6, etc.)
}

// ─── Helpers ────────────────────────────────────────────────

function saveSnapshotQuietly(data: AssetData[]): void {
  try {
    saveScoreSnapshot(data)
    const today = new Date().toISOString().split('T')[0]!
    detectScoreAlerts(today)
  } catch { /* snapshot is best-effort */ }
}
