// ─── Application Constants ───────────────────────────────────
// Centralized fallback values. No more magic numbers.

/** SELIC fallback rate when backend is unavailable (%) */
export const SELIC_FALLBACK = 14.25

/** CDI spread below SELIC (pp) */
export const CDI_SELIC_SPREAD = 0.1

/** IBOV fallback annual return */
export const IBOV_FALLBACK_RATE = 0.08

/** CDI fallback annual rate */
export const CDI_FALLBACK_RATE = 0.1315

/** Minimum assets required for dataset to be valid */
export const MIN_ASSETS_THRESHOLD = 50

/** Logo base URL for B3 tickers */
export const LOGO_BASE_URL = 'https://raw.githubusercontent.com/StatusInvest/Content/master/img/company'

/** Backend API URL */
export const BACKEND_URL = process.env['INVESTIQ_API_URL'] ?? 'https://investiqbackend-production.up.railway.app'
