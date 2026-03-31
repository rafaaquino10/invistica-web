// ============================================================
// InvestIQ — Ticker Models
// ============================================================

export interface Ticker {
  id: string;
  ticker: string;
  company_name: string;
  cluster_id: number;
  is_active: boolean;
}

export interface TickerListResponse {
  count: number;
  tickers: Ticker[];
}

export interface Quote {
  ticker: string;
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  market_cap: number;
}

export interface Financial {
  id: string;
  ticker_id: string;
  period: string;
  period_type: string;
  source: string;
  revenue: number | null;
  gross_profit: number | null;
  ebitda: number | null;
  ebit: number | null;
  net_income: number | null;
  total_assets: number | null;
  current_assets: number | null;
  equity: number | null;
  gross_debt: number | null;
  cash: number | null;
  net_debt: number | null;
  operating_cf: number | null;
  capex: number | null;
  free_cashflow: number | null;
  roic: number | null;
  wacc: number | null;
  roe: number | null;
  gross_margin: number | null;
  ebitda_margin: number | null;
  net_margin: number | null;
  dl_ebitda: number | null;
  icj: number | null;
  fcf_yield: number | null;
  cash_conversion: number | null;
  beneish_score: number | null;
  piotroski_score: number | null;
  raw_data: unknown;
}

export interface FinancialsResponse {
  ticker: string;
  financials: Financial[];
}

export interface TickerDividend {
  id: string;
  ticker_id: string;
  ex_date: string;
  payment_date: string | null;
  type: string;
  value_per_share: number;
}

export interface TickerDividendsResponse {
  ticker: string;
  dividends: TickerDividend[];
}

export interface Peer {
  ticker: string;
  company_name: string;
}

export interface HistoryEntry {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface HistoryResponse {
  ticker: string;
  days: number;
  data: HistoryEntry[];
}

export interface InstitutionalHolder {
  name: string;
  shares: number;
  pct: number;
  change_3m: number | null;
}

export interface InstitutionalHoldersResponse {
  ticker: string;
  holders: InstitutionalHolder[];
  count: number;
}

export interface ShortInterestEntry {
  date: string;
  short_pct: number;
  days_to_cover: number | null;
}

export interface ShortInterestResponse {
  ticker: string;
  short_interest: ShortInterestEntry[];
}

export interface FocusExpectation {
  indicator: string;
  year: number;
  median: number;
  mean: number;
  min: number;
  max: number;
  date: string;
}

export interface FocusExpectationsResponse {
  expectations: FocusExpectation[];
}

export interface TickerDetail extends Ticker {
  quote: Quote;
  peers: Peer[];
}
