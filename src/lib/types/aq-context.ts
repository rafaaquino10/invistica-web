// ─── AQContext — Unified 4-Dimension Analysis Context ────────────
// Central interface consumed by all IQ-Score v2 subsystems (Phases B-G).
// In Phase 1, only `fundamental` is populated; other dimensions use
// defaults/null and will be filled in subsequent phases.

import type { AqScoreResult, DadosFundamentalistas, Setor } from '@/lib/scoring/aq-score'
import type { SectorBenchmarks } from '@/lib/scoring/aq-score'
/** Inline type — macro-factor module was removed */
export interface MacroFactorResult {
  factor: number
  details: { name: string; value: number; weight: number }[]
}

// ─── Dimension: Fundamental ─────────────────────────────────────

export interface FundamentalDimension {
  dados: DadosFundamentalistas
  setor: Setor
  sectorBenchmarks: SectorBenchmarks
}

// ─── Dimension: Market ──────────────────────────────────────────

export interface MarketDimension {
  price: number
  change: number
  changePercent: number
  volume: number | null
  marketCap: number | null
  fiftyTwoWeekHigh: number | null
  fiftyTwoWeekLow: number | null
  beta: number | null
  volatility30d: number | null
}

// ─── Dimension: Macro ───────────────────────────────────────────

export interface MacroDimension {
  macroFactor: MacroFactorResult
  selicRate: number | null
  ibovChange: number | null
  usdBrl: number | null
}

// ─── Dimension: Intelligence ────────────────────────────────────
// Populated in later phases (sentiment analysis, news, etc.)

export interface IntelligenceDimension {
  newsSentiment: number | null        // -1 to +1
  analystConsensus: string | null     // 'buy' | 'hold' | 'sell'
  insiderActivity: string | null      // 'buying' | 'selling' | 'neutral'
}

// ─── AQContext (unified) ────────────────────────────────────────

export interface AQContext {
  ticker: string
  fundamental: FundamentalDimension
  market: MarketDimension | null
  macro: MacroDimension | null
  intelligence: IntelligenceDimension | null
}

// ─── Analysis Result ────────────────────────────────────────────
// Full output of the v2 analysis pipeline (populated incrementally
// across phases B-G).

export interface AQAnalysisResult {
  context: AQContext
  score: AqScoreResult
  lensScores: LensScores | null
  momentum: MomentumData | null
  portfolioMatch: PortfolioMatch | null
  exitAlerts: ExitAlert[] | null
}

// ─── Placeholder types for future phases ────────────────────────

export interface LensScores {
  value: number
  growth: number
  income: number
  quality: number
  momentum: number
}

export interface MomentumData {
  shortTerm: number | null   // 1-month momentum
  mediumTerm: number | null  // 3-month momentum
  longTerm: number | null    // 12-month momentum
  trend: 'up' | 'down' | 'sideways' | null
}

export interface PortfolioMatch {
  score: number              // 0-100 fit score
  reasons: string[]
  conflicts: string[]
}

export interface ExitAlert {
  type: 'score_drop' | 'fundamentals_deterioration' | 'macro_risk' | 'valuation_stretched'
  severity: 'low' | 'medium' | 'high'
  message: string
  triggeredAt: string
}
