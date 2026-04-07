// ─── Pipeline 3 Camadas — Orquestrador ──────────────────────
//
// Sensoriamento → Core Quant → Síntese
//
// Este módulo coordena as 3 camadas e expõe a API pública.
// Substitui a lógica do data-orchestrator como camada de abstração.

// Re-exportar API pública das 3 camadas
export { fetchMacroData, type MacroData } from './sensors'
export { getCurrentRegime, analyzeRegime, type RegimeConfig } from './analyzers'
export { extractDrivers, type Driver, type ScoreNarrative } from './synthesizers'

// Re-exportar API existente (retrocompatibilidade)
export {
  getAssets,
  getAssetByTicker,
  getCurrentRegime as getRegime,
} from '../data/data-orchestrator'

export { getPreviousAssets, getDataSource, getCacheStatus, type AssetData } from '../data/asset-cache'
