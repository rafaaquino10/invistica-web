// ─── Scoring Pipeline ────────────────────────────────────────
// Scores now come from the backend via /tickers enriched endpoint.
// This file is a passthrough — no local scoring is performed.

import type { GatewayFundamental, GatewayNewsItem, GatewayBeta } from '../gateway-client'
import type { CAGEDSectorData } from '../scoring/alternative-signals'
import type { RegimeWeights } from '../scoring/iq-score'
import type { AssetData } from './asset-cache'
import type { MergedAsset } from './data-merger'

// ─── Types ──────────────────────────────────────────────────

export interface ScoringContext {
  newsArticles: GatewayNewsItem[]
  macroMomentumScore: number | null
  regimeWeights?: RegimeWeights
  betaMap?: Map<string, GatewayBeta>
  cagedData?: CAGEDSectorData[]
}

// ─── Score a Single Asset ───────────────────────────────────

/**
 * Passthrough: scores already come from the backend via /tickers enriched endpoint.
 * Returns the merged asset as-is (it already contains aqScore, lensScores, scoreBreakdown, killSwitch).
 */
export function scoreAsset(
  merged: MergedAsset,
  _fund: GatewayFundamental,
  _ctx: ScoringContext,
): AssetData {
  return {
    ...merged,
    aqScore: (merged as any).aqScore ?? null,
    lensScores: (merged as any).lensScores ?? null,
    scoreBreakdown: (merged as any).scoreBreakdown ?? null,
    killSwitch: (merged as any).killSwitch ?? undefined,
  }
}

/**
 * Build an AssetData without scores (no fundamentals available).
 */
export function assetWithoutScore(merged: MergedAsset): AssetData {
  return { ...merged, aqScore: null, lensScores: null, scoreBreakdown: null }
}
