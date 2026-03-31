// ============================================================
// InvestIQ — Valuation Models
// ============================================================

export interface ValuationResult {
  ticker: string;
  company_name: string;
  reference_date: string;
  current_price: number;
  fair_value_final: number;
  fair_value_dcf: number | null;
  fair_value_gordon: number | null;
  fair_value_mult: number | null;
  fair_value_p25: number | null;
  fair_value_p75: number | null;
  safety_margin: number;
  upside_prob: number | null;
  loss_prob: number | null;
  score_valuation: number;
  dupont: number | null;
  interest_coverage: number | null;
  cash_conversion_cycle: number | null;
  merton_pd: number | null;
  roa: number | null;
  ebitda_margin: number | null;
  implied_growth: number | null;
  implied_growth_pct: number | null;
}

export interface MarginHistoryEntry {
  reference_date: string;
  fair_value_final: number;
  safety_margin: number;
  score_valuation: number;
}

export interface MarginHistory {
  ticker: string;
  current_price: number;
  history: MarginHistoryEntry[];
}

export interface ScenarioValue {
  fair_value: number;
  description: string;
}

export interface Scenarios {
  ticker: string;
  current_price: number;
  scenarios: {
    bear: ScenarioValue;
    base: ScenarioValue;
    bull: ScenarioValue;
  };
  upside_prob: number | null;
  loss_prob: number | null;
}
