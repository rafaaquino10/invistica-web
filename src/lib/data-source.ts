// ─── Data Source (Backward Compatibility) ────────────────────
// Re-exports from the data module.
// All consumers can import from here or directly from '@/lib/data'.

export {
  getAssets,
  getAssetByTicker,
  getPreviousAssets,
  getDataSource,
  getCacheStatus,
  getCurrentRegime,
} from './data'

export type { AssetData } from './data'
