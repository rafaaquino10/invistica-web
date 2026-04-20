// ─── Data Orchestrator (Invística Backend Only) ──────────────
// Fetches all asset data from the Invística FastAPI backend.
// No more Gateway dependency.

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
import { fetchAssetsFromInvestIQ } from './investiq-adapter'
import { investiq } from '../investiq-client'
import { detectRegime, type RegimeConfig } from '../scoring/regime-detector'

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

  try {
    const r = await investiq.get<{ macro: { selic: number; ipca: number } }>('/analytics/regime')
    const regime = detectRegime(r.macro?.selic ?? 14, r.macro?.ipca ?? 4)
    cachedRegime = regime
    regimeFetchedAt = now
    return regime
  } catch {
    if (cachedRegime) return cachedRegime
    return detectRegime(14) // default high SELIC
  }
}

// ─── Public API ─────────────────────────────────────────────

export async function getAssets(): Promise<AssetData[]> {
  const cached = getCachedAssets()

  // 1. Fresh cache → return immediately
  if (cached && isFresh()) return cached

  // 2. Already rebuilding → return stale
  if (cached && getIsRebuilding()) return cached

  // 3. Stale but within max → background revalidate
  if (cached && !isBeyondStaleMax()) {
    setIsRebuilding(true)
    fetchAssetsFromInvestIQ()
      .then(data => {
        if (data.length > 0) {
          setCachedAssets(data)
          console.log(`[SWR] Background rebuild: ${data.length} stocks from Invística`)
        }
      })
      .catch(err => {
        setLastBuildError(err as Error)
        console.error('[SWR] Background rebuild failed:', (err as Error).message)
      })
      .finally(() => setIsRebuilding(false))
    return cached
  }

  // 4. Cold start — synchronous fetch
  try {
    setIsRebuilding(true)
    // Fetch assets + refresh regime in parallel
    const [assets] = await Promise.all([
      fetchAssetsFromInvestIQ(),
      refreshRegime(),
    ])
    if (assets.length > 0) {
      setCachedAssets(assets)
      console.log(`[data-source] ${assets.length} stocks from Invística backend`)
    }
    return assets
  } catch (err) {
    setLastBuildError(err as Error)
    console.warn('[data-source] Invística backend unavailable:', (err as Error).message)
    if (cached) return cached
    return [] // Return empty instead of throwing — let UI show empty state
  } finally {
    setIsRebuilding(false)
  }
}

export async function getAssetByTicker(ticker: string): Promise<AssetData | undefined> {
  const assets = await getAssets()
  return assets.find((a) => a.ticker.toUpperCase() === ticker.toUpperCase())
}
