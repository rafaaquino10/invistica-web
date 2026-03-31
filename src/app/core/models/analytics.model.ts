// ============================================================
// InvestIQ — Analytics Models
// ============================================================

export interface ICTimelineEntry {
  month: string;
  ic_spearman: number | null;
  hit_rate: number | null;
}

export interface ICTimeline {
  entries: ICTimelineEntry[];
  months: number;
}

export interface SignalDecayEntry {
  lag_days: number;
  ic: number | null;
  cumulative_return: number | null;
}

export interface SignalDecay {
  entries: SignalDecayEntry[];
}

export interface SensitivityFactor {
  factor: string;
  impact: number;
  direction: string;
}

export interface Sensitivity {
  factors: SensitivityFactor[];
}

export interface AttributionEntry {
  ticker: string;
  contribution: number;
  weight: number;
  return_pct: number;
}

export interface PortfolioAttribution {
  portfolio_id: string;
  entries: AttributionEntry[];
  total_return: number;
}

export interface PortfolioRisk {
  portfolio_id: string;
  volatility: number | null;
  beta: number | null;
  sharpe: number | null;
  max_drawdown: number | null;
  var_95: number | null;
  cvar_95: number | null;
  correlation_matrix: Record<string, Record<string, number>> | null;
}
