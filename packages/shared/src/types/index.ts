// ─── Shared Types ────────────────────────────────────────────
// Re-exports all shared types for clean imports.

export type {
  AssetData,
  AqScoreSummary,
  FundamentalsData,
  AssetSearchResult,
  HistoricalPrice,
} from './assets'

export type {
  Portfolio,
  Position,
  Transaction,
  PortfolioPerformance,
  PortfolioSummary,
} from './portfolio'

export type {
  AqClassificacao,
  ScoreBreakdown,
  PillarDetail,
  SubNota,
} from './scoring'
export { PILLAR_WEIGHTS } from './scoring'

export type {
  PlanType,
  AuthUser,
  JWTPayload,
  MobileAuthResponse,
  MobileRefreshResponse,
  MobileApiResponse,
} from './auth'
