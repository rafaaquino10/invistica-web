// ============================================================
// InvestIQ — Score Models (mirrors backend response shapes)
// ============================================================

export type Rating = 'STRONG_BUY' | 'BUY' | 'HOLD' | 'REDUCE' | 'AVOID' | 'DADOS_INSUFICIENTES';

export const RATING_LABELS: Record<Rating, string> = {
  STRONG_BUY: 'Compra Forte',
  BUY: 'Acumular',
  HOLD: 'Manter',
  REDUCE: 'Reduzir',
  AVOID: 'Evitar',
  DADOS_INSUFICIENTES: 'Dados Insuficientes',
};

export const RATING_COLORS: Record<Rating, { text: string; bg: string; border: string }> = {
  STRONG_BUY:          { text: 'var(--positive)',      bg: 'var(--positive-bg)',  border: 'var(--positive-border)' },
  BUY:                 { text: 'var(--obsidian)',       bg: 'var(--obsidian-bg)',  border: 'var(--obsidian-border)' },
  HOLD:                { text: 'var(--warning)',        bg: 'var(--warning-bg)',   border: 'var(--warning-border)' },
  REDUCE:              { text: 'var(--warning)',        bg: 'var(--warning-bg)',   border: 'var(--warning-border)' },
  AVOID:               { text: 'var(--negative)',       bg: 'var(--negative-bg)',  border: 'var(--negative-border)' },
  DADOS_INSUFICIENTES: { text: 'var(--text-tertiary)', bg: 'var(--surface-2)',    border: 'var(--border-default)' },
};

export const RATING_RANGES = [
  { min: 82, max: 100, rating: 'STRONG_BUY' as Rating },
  { min: 70, max: 81,  rating: 'BUY' as Rating },
  { min: 45, max: 69,  rating: 'HOLD' as Rating },
  { min: 30, max: 44,  rating: 'REDUCE' as Rating },
  { min: 0,  max: 29,  rating: 'AVOID' as Rating },
];

export interface SubScoreDetail {
  [key: string]: unknown;
}

export interface SubScore {
  score: number | null;
  detail: SubScoreDetail;
}

export interface ScoreBreakdown {
  ticker: string;
  company_name: string;
  cluster_id: number;
  iq_score: number;
  score_quanti: number;
  sub_scores: {
    valuation: SubScore;
    quality: SubScore;
    risk: SubScore;
    dividends: SubScore;
    growth: SubScore;
    momentum: SubScore;
  };
  regime: {
    current: string;
    kill_switch: boolean;
  };
  reference_date: string;
}

export interface ScoreDetail {
  ticker: string;
  company_name: string;
  cluster: number;
  reference_date: string;
  iq_cognit: {
    iq_score: number;
    rating: Rating;
    rating_label: string;
    score_quanti: number;
    score_quali: number;
    score_valuation: number;
    score_operational: number | null;
  };
  valuation: {
    fair_value_final: number;
    fair_value_dcf: number | null;
    fair_value_gordon: number | null;
    fair_value_mult: number | null;
    fair_value_p25: number | null;
    fair_value_p75: number | null;
    current_price: number;
    safety_margin: number;
    upside_prob: number | null;
    loss_prob: number | null;
  };
  dividends: {
    dividend_safety: number | null;
    projected_yield: number | null;
    dividend_cagr_5y: number | null;
  };
  thesis_summary: string | null;
  evidences: Evidence[];
}

export interface Evidence {
  id?: string;
  iq_score_id?: string;
  criterion_id: number;
  criterion_name: string;
  score: number;
  weight: number;
  evidence_text: string;
  source_type: string;
  source_url?: string | null;
  source_excerpt?: string | null;
  bull_points: string[];
  bear_points: string[];
}

export interface Thesis {
  ticker: string;
  thesis_text: string;
  bull_case: string[];
  bear_case: string[];
  main_risks: string[];
}

export interface DossierDimension {
  nome: string;
  veredito: string;
  narrativa: string;
  evidencias: string[];
  alertas: string[];
}

export interface Dossier {
  ticker: string;
  company_name: string;
  generated_at: string;
  dimensoes: DossierDimension[];
  veredito_geral: string;
  score_quali: number;
}

export interface ScoreHistoryEntry {
  reference_date: string;
  iq_score: number | null;
  rating: Rating | null;
  score_quanti: number | null;
  score_quali: number | null;
  score_valuation: number | null;
}

export interface ScoreHistory {
  ticker: string;
  history: ScoreHistoryEntry[];
}

export interface RiskMetrics {
  ticker: string;
  company_name: string;
  period: string;
  risk_metrics: {
    altman_z: number | null;
    altman_z_label: string | null;
    merton_pd: number | null;
    dl_ebitda: number | null;
    icj: number | null;
    piotroski_score: number | null;
    beneish_score: number | null;
    liquidity_ratio: number | null;
  };
  profitability: {
    roe: number | null;
    roic: number | null;
    wacc: number | null;
    spread_roic_wacc: number | null;
    net_margin: number | null;
    gross_margin: number | null;
    fcf_yield: number | null;
  };
}

export interface ModelPerformance {
  ic_spearman_1m: number | null;
  ic_spearman_3m: number | null;
  ic_spearman_6m: number | null;
  hit_rate_buy_6m: number | null;
  alpha_medio_buy: number | null;
  sharpe_ratio: number | null;
  max_drawdown: number | null;
  total_months: number;
  periodo: string;
  status: string;
}

export interface Catalyst {
  type: string;
  title: string;
  date: string;
  source: string;
  url: string;
}

export interface CatalystsResponse {
  catalysts: Catalyst[];
  period_days: number;
}

export interface ScreenerResult {
  ticker_id: string;
  iq_score: number;
  rating: Rating;
  score_quanti: number;
  score_quali: number;
  score_valuation: number;
  fair_value_final: number | null;
  safety_margin: number | null;
  dividend_yield_proj: number | null;
  dividend_safety: number | null;
  reference_date: string;
  ticker: string;
  company_name: string;
  cluster_id: number;
  rating_label: string;
}

export interface ScreenerResponse {
  count: number;
  results: ScreenerResult[];
}

export interface CompareItem {
  ticker: string;
  company_name: string;
  cluster_id: number;
  close: number;
  market_cap: number;
  iq_score: number;
  rating: Rating;
  rating_label: string;
  fair_value_final: number | null;
  safety_margin: number | null;
  score_quanti: number;
  score_quali: number;
  score_valuation: number;
  dividend_safety: number | null;
  dividend_yield_proj: number | null;
  roe: number | null;
  roa: number | null;
  dl_ebitda: number | null;
  ebitda_margin: number | null;
  net_margin: number | null;
  piotroski: number | null;
  interest_coverage: number | null;
  dupont_driver: string | null;
}

export interface CompareResponse {
  tickers: CompareItem[];
  count: number;
}

export interface TopResponse {
  top: ScreenerResult[];
}
