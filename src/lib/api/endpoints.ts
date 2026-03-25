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
    apiFetch<{
      hitRate: { excepcional: number | null; saudavel: number | null; atencao: number | null; critico: number | null; overall: number | null } | null
      ic: { value: number | null; pValue: number | null; isSignificant: boolean } | null
      avgReturn: { excepcional: number | null; saudavel: number | null; atencao: number | null; critico: number | null } | null
      quintileSpread: { q1AvgReturn: number | null; q5AvgReturn: number | null; spreadPositive: boolean } | null
    }>('/scores/performance', { token }),

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

  getDividendCalendar: (days = 30, token?: string) =>
    apiFetch<{ calendar: Array<{ ticker_id: string; ticker: string; company_name: string; ex_date: string; value_per_share: number; type: string }> }>(
      `/dividends/calendar${qs({ days })}`, { token },
    ),

  getDividendSummary: (months = 12, token?: string) =>
    apiFetch<{ months: number; summary: Array<{ month: string; entries: Array<{ ticker: string; value: number; type: string; ex_date: string }>; subtotal: number }>; total: number }>(
      `/dividends/summary${qs({ months })}`, { token },
    ),

  getDividendProjections: (months = 12, token?: string) =>
    apiFetch<{ months: number; projections: Array<{ ticker: string; company_name: string; dividend_yield_proj: number; dividend_safety: number; dividend_cagr_5y: number | null }> }>(
      `/dividends/projections${qs({ months })}`, { token },
    ),

  getRadarFeed: (limit = 30, filter = 'all', token?: string) =>
    apiFetch<{ feed: Array<{ id: string; type: string; title: string; message: string; severity: string; date: string; tickers: string[]; source?: string; url?: string; sentiment?: string }>; count: number }>(
      `/radar/feed${qs({ limit, filter })}`, { token },
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

  // Analytics
  getICTimeline: (months = 12, token?: string) =>
    apiFetch<{ snapshots: Array<{ reference_date: string; ic_spearman: number; hit_rate: number }>; metrics: Record<string, unknown> }>(
      `/analytics/ic-timeline${qs({ months })}`, { token },
    ),

  getSignalDecay: (token?: string) =>
    apiFetch<{ quintiles: Array<{ quintile: string; label: string; count: number; avg_iq_score: number; avg_quanti: number; avg_quali: number; avg_valuation: number }>; count: number }>(
      '/analytics/signal-decay', { token },
    ),

  getSensitivity: (token?: string) =>
    apiFetch<{ scenarios: Array<{ name: string; variable: string; current: number; stressed: number; impact_score: number; description: string; affected_sectors: string[] }>; macro: Record<string, unknown> }>(
      '/analytics/sensitivity', { token },
    ),

  getPortfolioAttribution: (portfolioId: string, token?: string) =>
    apiFetch<{ total_invested: number; total_current: number; total_return_pct: number; by_sector: Array<{ cluster_id: number; tickers: string[]; weight_pct: number; return_pct: number; contribution: number }> }>(
      `/analytics/portfolio/${portfolioId}/attribution`, { token },
    ),

  getPortfolioRisk: (portfolioId: string, token?: string) =>
    apiFetch<{ positions: number; hhi: number; concentration: string; top3_weight_pct: number; max_sector_weight_pct: number; weights: Array<{ ticker: string; weight: number; cluster_id: number }> }>(
      `/analytics/portfolio/${portfolioId}/risk`, { token },
    ),

  // Dividend Simulator
  simulateDividends: (tickers: string[], amounts: number[], token?: string) =>
    apiFetch<{
      totals: { annualDividend: number; monthlyDividend: number; avgYield: number }
      results: Array<{ ticker: string; found: boolean; name: string | null; shares: number; currentPrice: number; dividendYield: number; annualDividend: number; monthlyDividend: number }>
    }>('/dividends/simulate', { method: 'POST', body: JSON.stringify({ tickers, amounts }), token }),

  // Custom Alerts
  getAlerts: (token?: string) =>
    apiFetch<{ alerts: Array<{ id: string; ticker: string; type: string; threshold: number | null; is_active: boolean; created_at: string }>; count: number }>(
      '/radar/alerts', { token },
    ),

  createAlert: (assetId: string, type: string, threshold?: number, token?: string) =>
    apiFetch<{ id: string; ticker: string; type: string; threshold: number | null; is_active: boolean; created_at: string }>(
      '/radar/alerts', { method: 'POST', body: JSON.stringify({ asset_id: assetId, type, threshold }), token },
    ),

  deleteAlert: (alertId: string, token?: string) =>
    apiFetch<{ success: boolean }>(
      `/radar/alerts/${alertId}`, { method: 'DELETE', token },
    ),

  // Investor Relations
  getInvestorRelations: (ticker: string, limit = 20, token?: string) =>
    apiFetch<{
      ticker: string
      events: Array<{ id: string; title: string; summary: string | null; url: string | null; source: string; event_type: string; published_at: string; sentiment: string | null; sentiment_score: number | null; relevance_score: number | null }>
      count: number
    }>(`/news/${ticker}/investor-relations${qs({ limit })}`, { token }),

  // Backtest
  runBacktest: (params: {
    start_date: string
    end_date: string
    rebalance_freq?: string
    universe_size?: number
    long_pct?: number
    min_iq_score_buy?: number
    benchmarks?: string[]
    initial_capital?: number
    transaction_cost_bps?: number
  }, token?: string) =>
    apiFetch<{
      summary: string
      performance: {
        iq_score_total_return: string
        iq_score_cagr: string
        volatility: string | null
        sharpe_ratio: number | null
        sortino_ratio: number | null
        max_drawdown: string
        max_drawdown_date: string | null
      }
      vs_benchmarks: Record<string, {
        total_return: string
        cagr: string
        alpha_total: string
        alpha_ann: string
        years_beaten: number
      }>
      signal_quality: { ic_spearman_avg: number | null; hit_rate: string | null }
      yearly: Record<string, { iq_return: string; benchmarks: Record<string, string>; alpha_ibov: string; regime: string | null }>
      regime_analysis: any
      monthly_nav: Array<{ date: string; nav: number; return: number; n_positions: number }>
      metadata: { n_rebalances: number; config: any }
    }>('/backtest', { method: 'POST', body: JSON.stringify(params), token }),

  // Score Breakdown (6 sub-scores)
  getScoreBreakdown: (ticker: string, token?: string) =>
    apiFetch<{
      ticker: string; company_name: string; cluster_id: number
      iq_score: number; score_quanti: number
      sub_scores: Record<string, { score: number | null; detail: Record<string, any> }>
      regime: { current: string; kill_switch: boolean } | null
      reference_date: string
    }>(`/scores/${ticker}/breakdown`, { token }),

  // Risk Metrics
  getRiskMetrics: (ticker: string, token?: string) =>
    apiFetch<{
      ticker: string; company_name: string; period: string
      risk_metrics: {
        altman_z: number | null; altman_z_label: string | null
        merton_pd: number | null; dl_ebitda: number | null
        icj: number | null; piotroski_score: number | null
        beneish_score: number | null; liquidity_ratio: number | null
      }
      profitability: {
        roe: number | null; roic: number | null; wacc: number | null
        spread_roic_wacc: number | null; net_margin: number | null
        gross_margin: number | null; fcf_yield: number | null
      }
    }>(`/scores/${ticker}/risk-metrics`, { token }),

  // Macro Regime
  getMacroRegime: (token?: string) =>
    apiFetch<{
      regime: string; label: string; description: string; color: string
      kill_switch_active: boolean
      macro: { selic: number; ipca: number; cambio_usd: number; brent: number }
      weight_adjustments: Record<string, number>
      sector_rotation: Record<string, { cluster_id: number; tilt_points: number; signal: string }>
    }>('/analytics/regime', { token }),

  // Sector Rotation Matrix
  getSectorRotation: (token?: string) =>
    apiFetch<{
      matrix: Record<string, Record<string, number>>
      clusters: Record<string, string>
    }>('/analytics/sector-rotation', { token }),

  // Dividend Trap Risk
  getDividendTrapRisk: (ticker: string, token?: string) =>
    apiFetch<{
      ticker: string; company_name: string
      is_dividend_trap: boolean; risk_level: string
      reasons: string[]
      metrics: {
        dividend_safety: number | null; dividend_yield: number | null
        cash_payout_ratio: number | null; dividend_cagr_5y: number | null
        total_dividends_12m: number
      }
    }>(`/dividends/${ticker}/trap-risk`, { token }),

  // Dossier (already exists as endpoint, adding typed function)
  getDossier: (ticker: string, token?: string) =>
    apiFetch<{
      ticker: string; score_quali: number
      dimensions: Array<{
        name: string; veredito: string
        narrative: string; evidencias: string[]
        alertas: string[]
      }>
      veredito_geral: string
    }>(`/scores/${ticker}/dossier`, { token }),

  // Mandate Comparison
  getScoreMandates: (ticker: string, token?: string) =>
    apiFetch<{
      ticker: string
      mandates: Record<string, {
        iq_score: number; rating: string
        score_quanti: number; score_quali: number; score_valuation: number
      }>
    }>(`/scores/${ticker}/mandates`, { token }),
}
