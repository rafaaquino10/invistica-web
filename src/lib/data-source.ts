// ─── Data Source (Backward Compatibility) ────────────────────
// Re-exports from the pipeline 3-layer architecture.
// All consumers can import from here or directly from '@/lib/pipeline'.

export {
  getAssets,
  getAssetByTicker,
  getPreviousAssets,
  getDataSource,
  getCacheStatus,
} from './pipeline'

export { getCurrentRegime } from './data'

export type { AssetData } from './pipeline'
