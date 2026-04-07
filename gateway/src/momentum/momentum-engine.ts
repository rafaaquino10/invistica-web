// ─── Momentum Engine ─────────────────────────────────────────
// Combines 3-layer signals (Macro × Sector × Asset) into
// final momentum result and score.

import type { MacroSignal } from './macro-signal.js'
import type { SectorSignal } from './sector-signal.js'
import type { AssetSignal } from './asset-signal.js'

// Weights for combining the 3 layers
const MACRO_WEIGHT = 0.40
const SECTOR_WEIGHT = 0.30
const ASSET_WEIGHT = 0.30

export interface MomentumResult {
  overall: {
    signal: number
    label: 'BULL' | 'NEUTRO' | 'BEAR'
    score: number // 0-100 for lens integration
  }
  macro: MacroSignal
  sector: SectorSignal
  asset: AssetSignal
}

/**
 * Combine 3 momentum layers into final result.
 */
export function calculateMomentum(
  macro: MacroSignal,
  sector: SectorSignal,
  asset: AssetSignal,
): MomentumResult {
  const overallSignal =
    macro.signal * MACRO_WEIGHT +
    sector.signal * SECTOR_WEIGHT +
    asset.signal * ASSET_WEIGHT

  const clamped = Math.max(-1, Math.min(1, overallSignal))

  return {
    overall: {
      signal: clamped,
      label: clamped > 0.25 ? 'BULL' : clamped < -0.25 ? 'BEAR' : 'NEUTRO',
      score: momentumToScore(clamped),
    },
    macro,
    sector,
    asset,
  }
}

/**
 * Convert signal [-1, +1] to score [0, 100] for lens integration.
 * -1 → 0, 0 → 50, +1 → 100
 */
export function momentumToScore(signal: number): number {
  return Math.round(((signal + 1) / 2) * 100)
}
