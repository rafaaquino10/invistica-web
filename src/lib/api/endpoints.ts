/**
 * InvestIQ API endpoints — typed functions for each domain.
 *
 * Organized by: Free (public) → Pro (auth required).
 * Each function maps to one FastAPI endpoint.
 */

import { apiFetch, qs } from './client'

// ════════════════════════════════════════════════════════════
// Types
// ════════════════════════════════════════════════════════════

export interface Ticker {
  id: string
  ticker: string
  company_name: string
  cluster_id: number
  is_active: boolean
}

export interface Quote {
  ticker: string
  date: string
  open: number
  high: number
  low: number
  close: number
  volume: number
  market_cap: number | null
}

export interface Financial {
  period: string
  period_type: string
  revenue: number | null
  gross_profit: number | null
  ebit: number | null
  net_income: number | null
  equity: number | null
  roe: number | null
  net_margin: number | null
  gross_margin: number | null
  dl_ebitda: number | null
  piotroski_score: number | null
}

export interface IQScore {
  ticker: string
  company_name: string
  cluster: number
  mandate: string
  mandate_source: string
  reference_date: string
  iq_cognit: {
    iq_score: number
    rating: string
    rating_label: string
    score_quanti: number
    score_quali: number
    score_valuation: number
    score_operational: number
  }
  valuation: {
    fair_value_final: number | null
    fair_value_dcf: number | null
    fair_value_gordon: number | null
    fair_value_mult: number | null
    fair_value_p25: number | null
    fair_value_p75: number | null
    current_price: number
    safety_margin: number | null
    upside_prob: number | null
    loss_prob: number | null
  }
  dividends: {
    dividend_safety: number | null
    projected_yield: number | null
    dividend_cagr_5y: number | null
  }
  thesis_summary: string | null
  evidences: Evidence[]
  _disclaimer: string
}

export interface Evidence {
  criterion_id: number
  criterion_name: string
  score: number
  weight: number
  evidence_text: string
  source_type: string
  bull_points: string[]
  bear_points: string[]
}

export interface ScreenerResult {
  ticker_id: string
  ticker: string
  company_name: string
  cluster_id: number
  iq_score: number
  rating: string
  rating_label: string
  score_quanti: number
  score_quali: number
  score_valuation: number
  fair_value_final: number | null
  safety_margin: number | null
  dividend_yield_proj: number | null
  dividend_safety: number | null
  mandate: string
}

export interface Valuation {
  ticker: string
  company_name: string
  current_price: number
  fair_value_final: number | null
  fair_value_dcf: number | null
  fair_value_gordon: number | null
  fair_value_mult: number | null
  fair_value_p25: number | null
  fair_value_p75: number | null
  safety_margin: number | null
  upside_prob: number | null
  loss_prob: number | null
  score_valuation: number | null
  _disclaimer: string
}

export interface Position {
  id: string
  ticker_id: string
  ticker: string
  company_name: string
  qty: number
  avg_price: number
  current_price: number
  iq_score: number | null
  rating: string | null
  gain_pct: number | null
  yoc_pct: number | null
  created_at: string
}

export interface Cluster {
  cluster_id: number
  name: string
  weights: { quanti: number; quali: number; valuation: number }
  kpis: string[]
}

export interface DossierDimension {
  nome: string
  veredito: string
  narrativa: string
  evidencias: string[]
  alertas: string[]
}

// ════════════════════════════════════════════════════════════
// FREE endpoints
// ════════════════════════════════════════════════════════════

export const free = {
  health: () => apiFetch<{ status: string }>('/health'),

  getTickers: (params?: { cluster_id?: number; limit?: number; offset?: number }) =>
    apiFetch<{ count: number; tickers: Ticker[] }>(`/tickers${qs(params || {})}`),

  getTicker: (ticker: string) =>
    apiFetch<Ticker & { quote?: Quote; peers?: Ticker[] }>(`/tickers/${ticker}`),

  getQuote: (ticker: string) =>
    apiFetch<Quote>(`/tickers/${ticker}/quote`),

  getFinancials: (ticker: string, limit = 8) =>
    apiFetch<{ ticker: string; financials: Financial[] }>(
      `/tickers/${ticker}/financials${qs({ limit })}`,
    ),

  getDividends: (ticker: string) =>
    apiFetch<{ ticker: string; dividends: Array<{ ex_date: string; value_per_share: number; type: string }> }>(
      `/tickers/${ticker}/dividends`,
    ),

  getPeers: (ticker: string) =>
    apiFetch<{ ticker: string; cluster_id: number; peers: Ticker[] }>(
      `/tickers/${ticker}/peers`,
    ),

  getClusters: () =>
    apiFetch<{ clusters: Cluster[] }>('/clusters'),

  searchTickers: (q: string, limit = 10) =>
    apiFetch<{ count: number; results: Ticker[] }>(
      `/tickers/search${qs({ q, limit })}`,
    ),

  getHistory: (ticker: string, days = 90) =>
    apiFetch<{ ticker: string; days: number; data: Array<{ date: string; open: number; high: number; low: number; close: number; volume: number }> }>(
      `/tickers/${ticker}/history${qs({ days })}`,
    ),
}

// ════════════════════════════════════════════════════════════
// PRO endpoints (pass token for auth)
// ════════════════════════════════════════════════════════════

export const pro = {
  // Scores
  getScore: (ticker: string, params?: { mandate?: string; portfolio_id?: string }, token?: string) =>
    apiFetch<IQScore>(`/scores/${ticker}${qs(params || {})}`, { token }),

  getScoreMandates: (ticker: string, token?: string) =>
    apiFetch<{ ticker: string; scores: Record<string, unknown> }>(`/scores/${ticker}/mandates`, { token }),

  getDossier: (ticker: string, token?: string) =>
    apiFetch<{ ticker: string; dimensoes: DossierDimension[]; veredito_geral: string; score_quali: number }>(
      `/scores/${ticker}/dossier`, { token },
    ),

  getHistory: (ticker: string, limit = 12, token?: string) =>
    apiFetch<{ ticker: string; history: Array<{ reference_date: string; iq_score: number; rating: string }> }>(
      `/scores/${ticker}/history${qs({ limit })}`, { token },
    ),

  getEvidence: (ticker: string, token?: string) =>
    apiFetch<{ ticker: string; evidences: Evidence[] }>(`/scores/${ticker}/evidence`, { token }),

  getThesis: (ticker: string, token?: string) =>
    apiFetch<{ ticker: string; thesis_text: string; bull_case: string; bear_case: string }>(
      `/scores/${ticker}/thesis`, { token },
    ),

  getTop: (params?: { limit?: number; mandate?: string }, token?: string) =>
    apiFetch<{ top: ScreenerResult[] }>(`/scores/top${qs(params || {})}`, { token }),

  getScreener: (
    params?: {
      cluster_id?: number
      min_score?: number
      rating?: string
      min_yield?: number
      min_margin?: number
      mandate?: string
      limit?: number
    },
    token?: string,
  ) => apiFetch<{ count: number; results: ScreenerResult[] }>(
    `/scores/screener${qs(params || {})}`,
    { token },
  ),

  getPerformance: (token?: string) =>
    apiFetch<Record<string, unknown>>('/scores/performance', { token }),

  // Valuation
  getValuation: (ticker: string, token?: string) =>
    apiFetch<Valuation>(`/valuation/${ticker}`, { token }),

  getScenarios: (ticker: string, token?: string) =>
    apiFetch<{ ticker: string; scenarios: Record<string, unknown> }>(
      `/valuation/${ticker}/scenarios`, { token },
    ),

  // Portfolio
  getPortfolio: (token?: string) =>
    apiFetch<{ positions: Position[] }>('/portfolio', { token }),

  addPosition: (data: { ticker: string; qty: number; avg_price: number }, token?: string) =>
    apiFetch<{ position: Position }>('/portfolio/positions', {
      method: 'POST',
      body: JSON.stringify(data),
      token,
    }),

  updatePosition: (id: string, data: { qty: number; avg_price: number }, token?: string) =>
    apiFetch<{ position: Position }>(`/portfolio/positions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
      token,
    }),

  deletePosition: (id: string, token?: string) =>
    apiFetch<{ deleted: boolean }>(`/portfolio/positions/${id}`, {
      method: 'DELETE',
      token,
    }),

  getSmartContribution: (aporte_total = 1000, token?: string) =>
    apiFetch<{ aporte_total: number; suggestions: Array<{ ticker: string; percentual: number; valor_recomendado: number; motivo: string }> }>(
      `/portfolio/smart-contribution${qs({ aporte_total })}`, { token },
    ),

  // News
  getNews: (ticker: string, limit = 10, token?: string) =>
    apiFetch<{ ticker: string; news: Array<{ id: string; title: string; summary: string | null; url: string | null; source: string | null; published_at: string; sentiment: string | null; sentiment_score: number | null; relevance_score: number | null }>; count: number }>(
      `/news/${ticker}${qs({ limit })}`, { token },
    ),

  // Dividends
  getDividendSafety: (ticker: string, token?: string) =>
    apiFetch<{ ticker: string; dividend_safety: number; dividend_yield_proj: number }>(
      `/dividends/${ticker}/safety`, { token },
    ),

  getDividendRadar: (min_safety = 70, token?: string) =>
    apiFetch<{ count: number; radar: ScreenerResult[] }>(
      `/dividends/radar${qs({ min_safety })}`, { token },
    ),

  // Mandate
  suggestMandate: (
    portfolioId: string,
    profile: {
      horizonte_meses: number
      tolerancia_dd_pct: number
      objetivo: string
      experiencia_meses: number
      pct_patrimonio: number
    },
    token?: string,
  ) => apiFetch<{ suggested: string; score: number; confidence: string }>(
    `/portfolio/${portfolioId}/mandate/suggest`,
    { method: 'POST', body: JSON.stringify(profile), token },
  ),

  setMandate: (portfolioId: string, mandate: string, token?: string) =>
    apiFetch<{ mandate: string; recalculation_queued: boolean }>(
      `/portfolio/${portfolioId}/mandate`,
      { method: 'PATCH', body: JSON.stringify({ mandate }), token },
    ),

  getMandate: (portfolioId: string, token?: string) =>
    apiFetch<{ mandate: string; weights: Record<string, unknown> }>(
      `/portfolio/${portfolioId}/mandate`, { token },
    ),
}
