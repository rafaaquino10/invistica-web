// ─── Smart Portfolios Types ──────────────────────────────────
// Algorithmic stock selection portfolios with transparent criteria.

import type { AssetData } from '../data-source'

// ─── Portfolio Definition ────────────────────────────────────

export interface SmartPortfolio {
  id: string
  name: string
  description: string
  icon: string
  criteria: PortfolioCriteria
  sortBy: string
  sortDirection: 'asc' | 'desc'
  maxStocks: number
  exitCriteria: ExitCriteria[]
  /** Hard filter that is NEVER relaxed by progressive relaxation. Ensures portfolio thesis integrity. */
  thesisGuard?: (asset: AssetData) => boolean
}

export interface PortfolioCriteria {
  minScore?: number
  minLensScore?: { lens: string; min: number }
  maxPL?: number
  minROE?: number
  maxDivEbitda?: number
  minDY?: number
  maxDY?: number
  minMarginLiq?: number
  minMarginEbit?: number
  minLiquidityFactor?: number
  minConfidence?: number
  minScoreRisk?: number
  minScoreQuality?: number
  maxPayout?: number
  minCrescRec5a?: number
  maxBeta?: number
  minMarketCap?: number
  maxSectorPct?: number          // Quant: max % por setor
  sectors?: string[]
  excludeSectors?: string[]
  customFilter?: string
  // Quant Puro
  topN?: number
  minLiquidity?: number
  balanceRule?: 'equal_weight' | 'score_weight'
  // ESG proxy
  governance?: string
}

export interface SmartPortfolioMeta extends SmartPortfolio {
  rebalanceFrequency?: 'monthly' | 'quarterly'
}

export interface ExitCriteria {
  condition: string
  description: string
}

// ─── Engine Results ──────────────────────────────────────────

export interface QualifiedStock {
  ticker: string
  name: string
  sector: string
  price: number
  score: number
  lensScore: number
  dy: number | null
  peRatio: number | null
  roe: number | null
  divEbitda: number | null
  confidence: number
  rank: number
  weight?: number  // Peso na carteira (ex: 5% para equal_weight)
}

export interface SmartPortfolioResult {
  portfolio: SmartPortfolio
  stocks: QualifiedStock[]
  generatedAt: Date
}

// ─── Exit Alerts ─────────────────────────────────────────────

export type ExitAlertType = 'reavaliar' | 'realizar_lucro' | 'monitorar' | 'risco_critico'
export type ExitAlertSeverity = 'info' | 'warning' | 'critical'

export interface ExitAlert {
  ticker: string
  type: ExitAlertType
  severity: ExitAlertSeverity
  title: string
  description: string
  data: Record<string, number | string | null>
}

// ─── Income Simulator ────────────────────────────────────────

export interface IncomeSimulation {
  investedAmount: number
  portfolioAvgYield: number
  monthlyIncome: number
  comparisons: {
    savings: number
    cdi: number
    selicRate: number
  }
  perStock: {
    ticker: string
    allocation: number
    annualYield: number
    monthlyIncome: number
  }[]
}

// ─── Quase Qualificados ──────────────────────────────────────

export interface AlmostQualified {
  ticker: string
  name: string
  sector: string
  price: number
  score: number
  lensScore: number
  dy: number | null
  peRatio: number | null
  roe: number | null
  divEbitda: number | null
  confidence: number
  /** Critérios que o ativo não atendeu (máx = maxMissed) */
  criteriosFaltando: string[]
}

// ─── User Position (minimal for exit alerts) ─────────────────

export interface UserPosition {
  ticker: string
  quantity: number
}
