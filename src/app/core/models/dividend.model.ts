// ============================================================
// InvestIQ — Dividend Models
// ============================================================

export interface DividendCalendarEntry {
  ticker: string;
  company_name: string;
  ex_date: string;
  payment_date: string | null;
  type: string;
  value_per_share: number;
}

export interface DividendCalendarResponse {
  days: number;
  entries: DividendCalendarEntry[];
}

export interface DividendRadarEntry {
  ticker: string;
  company_name: string;
  cluster_id: number;
  dividend_yield: number;
  dividend_safety: number;
  projected_yield: number | null;
  cagr_5y: number | null;
  payout_ratio: number | null;
}

export interface DividendRadarResponse {
  min_safety: number;
  results: DividendRadarEntry[];
}

export interface DividendSummary {
  total_received: number;
  monthly_avg: number;
  yield_on_cost: number;
  months: number;
  by_ticker: DividendSummaryByTicker[];
}

export interface DividendSummaryByTicker {
  ticker: string;
  total: number;
  pct_of_total: number;
}

export interface DividendProjectionEntry {
  month: string;
  projected_value: number;
  tickers: string[];
}

export interface DividendProjectionResponse {
  months: number;
  projections: DividendProjectionEntry[];
  total_projected: number;
}

export interface SimulateRequest {
  tickers: string[];
  amounts: number[];
}

export interface SimulateResult {
  tickers: string[];
  monthly_income: number;
  annual_income: number;
  yield_avg: number;
  by_ticker: SimulateByTicker[];
}

export interface SimulateByTicker {
  ticker: string;
  amount_invested: number;
  monthly_income: number;
  annual_income: number;
  yield_pct: number;
}

export interface TrapRisk {
  ticker: string;
  company_name: string;
  trap_score: number;
  signals: TrapSignal[];
  verdict: string;
}

export interface TrapSignal {
  name: string;
  triggered: boolean;
  description: string;
}

export interface DividendSafety {
  ticker: string;
  company_name: string;
  safety_score: number;
  payout_ratio: number | null;
  coverage_ratio: number | null;
  consistency_years: number | null;
  cagr_5y: number | null;
}
