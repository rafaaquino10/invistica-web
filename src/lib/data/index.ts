// ─── Data Module (Public API) ────────────────────────────────
// Re-exports for backward compatibility with data-source.ts consumers.

export { getAssets, getAssetByTicker, getCurrentRegime } from './data-orchestrator'
export { getPreviousAssets, getDataSource, getCacheStatus } from './asset-cache'
export type { AssetData } from './asset-cache'
