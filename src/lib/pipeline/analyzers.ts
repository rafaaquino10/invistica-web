// ─── Pipeline Camada 2: Core Quant (Analyzers) ──────────────
// Recebe dados brutos, aplica motor IQ Score, regime detection, pilares.
// Determinístico: mesmos inputs = mesmos outputs.

export { scoreAsset, assetWithoutScore, type ScoringContext } from '../data/scoring-pipeline'
export { detectRegime, type RegimeConfig, type MacroRegime, REGIME_DISPLAY } from '../scoring/regime-detector'
export type { AssetData } from '../data/asset-cache'

import type { MacroData } from './sensors'
import { detectRegime, type RegimeConfig } from '../scoring/regime-detector'

// ─── Cached Regime ──────────────────────────────────────────

let cachedRegime: RegimeConfig | null = null
let regimeFetchedAt = 0
const REGIME_TTL = 30 * 60 * 1000 // 30 min

export function getCurrentRegime(): RegimeConfig | null {
  return cachedRegime
}

/**
 * Detecta o regime macro atual com base nos dados macro.
 * Cacheia resultado por 30 minutos.
 */
export function analyzeRegime(macro: MacroData): RegimeConfig {
  const now = Date.now()
  if (cachedRegime && now - regimeFetchedAt < REGIME_TTL) return cachedRegime

  const regime = detectRegime(macro.selic, macro.ipca12m)
  cachedRegime = regime
  regimeFetchedAt = now
  return regime
}
