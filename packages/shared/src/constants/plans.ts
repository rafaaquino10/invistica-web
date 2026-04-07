// ─── Plan Constants ──────────────────────────────────────────
// Plan limits shared between web and mobile.

export const PLAN_LIMITS = {
  free: {
    portfolios: 1,
    assetsPerPortfolio: 10,
    screenerFilters: 3,
    aqScorePerDay: 3,
    explorerAssets: 15,
  },
  pro: {
    portfolios: 5,
    assetsPerPortfolio: 50,
    screenerFilters: 10,
    aqScorePerDay: 50,
    explorerAssets: 100,
  },
  elite: {
    portfolios: 20,
    assetsPerPortfolio: 200,
    screenerFilters: -1, // unlimited
    aqScorePerDay: -1,   // unlimited
    explorerAssets: -1,   // unlimited
  },
} as const
