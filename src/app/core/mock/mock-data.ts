/**
 * Mock data central — dados realistas para preview local.
 * NÃO vai para produção. Branch mock-data-preview only.
 */

// ── TICKERS POPULARES ──
const TICKERS = [
  { ticker: 'WEGE3', name: 'WEG S.A.', cluster_id: 7, cluster: 'Bens de Capital' },
  { ticker: 'ITUB4', name: 'ITAÚ UNIBANCO', cluster_id: 1, cluster: 'Financeiro' },
  { ticker: 'PETR4', name: 'PETROBRAS', cluster_id: 2, cluster: 'Commodities' },
  { ticker: 'VALE3', name: 'VALE S.A.', cluster_id: 2, cluster: 'Commodities' },
  { ticker: 'BBAS3', name: 'BANCO DO BRASIL', cluster_id: 1, cluster: 'Financeiro' },
  { ticker: 'ABEV3', name: 'AMBEV S.A.', cluster_id: 3, cluster: 'Consumo' },
  { ticker: 'RENT3', name: 'LOCALIZA', cluster_id: 7, cluster: 'Bens de Capital' },
  { ticker: 'BBDC4', name: 'BRADESCO', cluster_id: 1, cluster: 'Financeiro' },
  { ticker: 'EGIE3', name: 'ENGIE BRASIL', cluster_id: 4, cluster: 'Utilities' },
  { ticker: 'FLRY3', name: 'FLEURY S.A.', cluster_id: 5, cluster: 'Saúde' },
  { ticker: 'CPLE3', name: 'COPEL', cluster_id: 4, cluster: 'Utilities' },
  { ticker: 'EQTL3', name: 'EQUATORIAL', cluster_id: 4, cluster: 'Utilities' },
  { ticker: 'CYRE3', name: 'CYRELA', cluster_id: 6, cluster: 'Real Estate' },
  { ticker: 'COGN3', name: 'COGNA EDUCAÇÃO', cluster_id: 8, cluster: 'Educação' },
  { ticker: 'TOTS3', name: 'TOTVS S.A.', cluster_id: 9, cluster: 'TMT' },
];

function ratingFor(score: number) {
  if (score >= 82) return 'STRONG_BUY';
  if (score >= 70) return 'BUY';
  if (score >= 45) return 'HOLD';
  if (score >= 30) return 'REDUCE';
  return 'AVOID';
}

function rand(min: number, max: number) { return min + Math.random() * (max - min); }
function randInt(min: number, max: number) { return Math.round(rand(min, max)); }

function buildScreenerResults(limit = 200) {
  const results = TICKERS.map((t, i) => {
    const score = Math.max(20, Math.min(95, 85 - i * 4 + randInt(-3, 3)));
    return {
      ticker_id: `id-${t.ticker}`, ticker: t.ticker, company_name: t.name, cluster_id: t.cluster_id,
      iq_score: score, rating: ratingFor(score),
      score_quanti: randInt(30, 90), score_quali: randInt(30, 90), score_valuation: randInt(30, 90),
      fair_value_final: +(rand(10, 80)).toFixed(2), safety_margin: +(rand(-0.3, 0.4)).toFixed(4),
      dividend_yield_proj: +(rand(0, 0.12)).toFixed(4), dividend_safety: randInt(40, 95),
      reference_date: '2026-04-01', rating_label: '',
    };
  });
  return { results: results.slice(0, limit), total: results.length };
}

function buildTop(limit = 10) {
  return { top: buildScreenerResults(limit).results.sort((a: any, b: any) => b.iq_score - a.iq_score) };
}

function buildPortfolio() {
  const positions = TICKERS.slice(0, 6).map((t, i) => {
    const qty = [100, 200, 50, 300, 150, 80][i];
    const avg = +(rand(15, 60)).toFixed(2);
    const curr = +(avg * rand(0.85, 1.25)).toFixed(2);
    const mv = +(qty * curr).toFixed(2);
    const gl = +(mv - qty * avg).toFixed(2);
    const score = [85, 78, 72, 65, 55, 48][i];
    return {
      id: `pos-${i}`, ticker: t.ticker, company_name: t.name, cluster_id: t.cluster_id,
      quantity: qty, avg_price: avg, current_price: curr, market_value: mv,
      gain_loss: gl, gain_loss_pct: +(gl / (qty * avg)).toFixed(4), weight: 0,
      iq_score: score, rating: ratingFor(score),
    };
  });
  const total = positions.reduce((s, p) => s + p.market_value, 0);
  positions.forEach(p => p.weight = +(p.market_value / total).toFixed(4));
  return {
    positions, portfolio_id: 'mock-portfolio',
    total_value: +total.toFixed(2),
    total_gain_loss: +positions.reduce((s, p) => s + p.gain_loss, 0).toFixed(2),
    total_gain_loss_pct: +(positions.reduce((s, p) => s + p.gain_loss, 0) / positions.reduce((s, p) => s + p.quantity * p.avg_price, 0)).toFixed(4),
  };
}

function buildRegime() {
  return {
    regime: 'RISK_OFF', label: 'Contração',
    description: 'Ambiente defensivo — juros altos, incerteza elevada.',
    color: 'var(--negative)', kill_switch_active: false,
    macro: { selic: 14.25, ipca: 5.48, cambio_usd: 5.72, brent: 78.50 },
    weight_adjustments: {}, sector_rotation: {},
  };
}

function buildDividendSummary() {
  return { total_received: 2850.40, monthly_avg: 237.53, yield_on_cost: 0.063, months: 12, by_ticker: [] };
}

function buildDividendProjections() {
  const months = ['2026-01','2026-02','2026-03','2026-04','2026-05','2026-06','2026-07','2026-08','2026-09','2026-10','2026-11','2026-12'];
  return {
    months: 12, total_projected: 3200,
    projections: months.map(m => ({ month: m + '-01', projected_value: +(rand(150, 450)).toFixed(2), tickers: ['BBAS3','ITUB4'] })),
  };
}

function buildDividendCalendar() {
  return { days: 30, entries: [
    { ticker: 'BBAS3', company_name: 'BANCO DO BRASIL', ex_date: '2026-04-05', payment_date: '2026-04-15', type: 'JCP', value_per_share: 0.85 },
    { ticker: 'ITUB4', company_name: 'ITAÚ UNIBANCO', ex_date: '2026-04-10', payment_date: '2026-04-22', type: 'Dividendo', value_per_share: 0.42 },
    { ticker: 'EGIE3', company_name: 'ENGIE BRASIL', ex_date: '2026-04-18', payment_date: '2026-04-30', type: 'Dividendo', value_per_share: 1.15 },
    { ticker: 'CPLE3', company_name: 'COPEL', ex_date: '2026-04-25', payment_date: '2026-05-08', type: 'JCP', value_per_share: 0.32 },
  ]};
}

function buildDividendRadar() {
  return { min_safety: 70, results: TICKERS.slice(0, 8).map(t => ({
    ticker: t.ticker, company_name: t.name, cluster_id: t.cluster_id,
    dividend_yield: +(rand(0.03, 0.12)).toFixed(4), dividend_safety: randInt(65, 95),
    projected_yield: +(rand(0.03, 0.10)).toFixed(4), cagr_5y: +(rand(0.05, 0.20)).toFixed(4),
    payout_ratio: +(rand(0.3, 0.8)).toFixed(2),
  }))};
}

function buildFeed() {
  return { feed: [
    { id: 'f1', type: 'score_change', title: 'WEGE3 subiu para 90 (Compra Forte). Motor reavaliou após margem EBITDA crescer 3pp.', description: '', ticker: 'WEGE3', created_at: '2026-04-01T14:30:00Z', metadata: null },
    { id: 'f2', type: 'dividend', title: 'BBAS3 declarou JCP R$ 0,85/ação. Ex em 05/04. Safety 92/100.', description: 'Yield proj 8.2%', ticker: 'BBAS3', created_at: '2026-04-01T11:00:00Z', metadata: null },
    { id: 'f3', type: 'score_change', title: 'COGN3 caiu para 35 (Reduzir). Alavancagem subiu para 4.2x DL/EBITDA.', description: '', ticker: 'COGN3', created_at: '2026-03-31T18:00:00Z', metadata: null },
    { id: 'f4', type: 'news', title: 'BC mantém Selic em 14,25%. Próxima reunião em maio.', description: 'InfoMoney', ticker: null, created_at: '2026-03-31T15:00:00Z', metadata: null },
  ], count: 4 };
}

function buildCatalysts() {
  return { catalysts: [
    { title: 'Ata do Copom — detalhamento da decisão de juros', source: 'BCB', date: '2026-04-08', url: '#' },
    { title: 'IPCA de março — consenso 0,42%', source: 'IBGE', date: '2026-04-11', url: '#' },
    { title: 'Resultado WEGE3 1T26', source: 'RI WEG', date: '2026-04-23', url: '#' },
  ], period_days: 30 };
}

function buildScoreDetail(ticker: string) {
  const t = TICKERS.find(x => x.ticker === ticker) || TICKERS[0];
  const score = randInt(60, 92);
  return { ticker: t.ticker, company_name: t.name, cluster_id: t.cluster_id, reference_date: '2026-04-01',
    iq_cognit: { iq_score: score, rating: ratingFor(score), score_quanti: randInt(50, 90), score_quali: randInt(50, 85), score_valuation: randInt(45, 88) }};
}

function buildValuation(ticker: string) {
  const fv = +(rand(20, 70)).toFixed(2);
  return { ticker, fair_value_final: fv, fair_value_dcf: +(fv * rand(0.9, 1.1)).toFixed(2),
    fair_value_gordon: +(fv * rand(0.85, 1.05)).toFixed(2), fair_value_mult: +(fv * rand(0.95, 1.15)).toFixed(2),
    fair_value_p25: +(fv * 0.8).toFixed(2), fair_value_p75: +(fv * 1.2).toFixed(2),
    safety_margin: +(rand(-0.2, 0.35)).toFixed(4), current_price: +(fv * rand(0.7, 1.3)).toFixed(2) };
}

function buildThesis(ticker: string) {
  return { ticker,
    thesis_text: `${ticker} apresenta fundamentos sólidos com margens crescentes e posição dominante no setor. O modelo identifica upside de 15-25% baseado em DCF e múltiplos de peers.`,
    bull_case: ['Margens EBITDA em expansão — ganhos de eficiência operacional', 'Mercado endereçável crescendo 12% ao ano', 'Valuation abaixo da média histórica de 5 anos'],
    bear_case: ['Exposição cambial pode pressionar custos', 'Competição crescente de players internacionais'],
    main_risks: ['Risco regulatório no setor', 'Concentração de receita em poucos clientes'],
  };
}

function buildNews(ticker: string) {
  return { ticker, news: [
    { title: `${ticker}: resultado do 4T25 supera expectativas com receita +18% YoY`, source: 'InfoMoney', url: '#', published_at: '2026-03-28T10:00:00Z', sentiment: 0.8, sentiment_label: 'Positivo' },
    { title: `Analistas elevam preço-alvo de ${ticker} após guidance otimista`, source: 'Valor Econômico', url: '#', published_at: '2026-03-25T14:00:00Z', sentiment: 0.6, sentiment_label: 'Positivo' },
    { title: `${ticker} anuncia programa de recompra de até 5% das ações`, source: 'B3', url: '#', published_at: '2026-03-20T09:00:00Z', sentiment: 0.5, sentiment_label: 'Neutro' },
  ]};
}

function buildQuote(ticker: string) {
  const close = +(rand(10, 90)).toFixed(2);
  return { ticker, close, open: +(close * rand(0.98, 1.02)).toFixed(2), high: +(close * 1.02).toFixed(2),
    low: +(close * 0.98).toFixed(2), volume: randInt(500000, 15000000), market_cap: randInt(5e9, 300e9), date: '2026-04-01' };
}

function buildHistory(ticker: string, days = 90) {
  const entries = [];
  let close = rand(20, 60);
  const now = new Date();
  for (let i = days; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86400000);
    close = +(close * (1 + (Math.random() - 0.48) * 0.03)).toFixed(2);
    entries.push({ date: d.toISOString().substring(0, 10), open: +(close * rand(0.99, 1.01)).toFixed(2),
      high: +(close * 1.015).toFixed(2), low: +(close * 0.985).toFixed(2), close, volume: randInt(500000, 8000000) });
  }
  return { ticker, entries };
}

function buildFinancials(ticker: string) {
  return { ticker, financials: ['2025-12-31','2024-12-31','2023-12-31','2022-12-31'].map(p => ({
    period: p, period_type: 'annual', revenue: randInt(8e9, 40e9), ebit: randInt(1e9, 8e9),
    net_income: randInt(800e6, 6e9), equity: randInt(5e9, 30e9), net_debt: randInt(-2e9, 10e9),
    roe: +(rand(0.08, 0.28)).toFixed(4), net_margin: +(rand(0.05, 0.22)).toFixed(4),
    dl_ebitda: +(rand(-0.5, 3.5)).toFixed(2), ebitda_margin: +(rand(0.15, 0.40)).toFixed(4),
  }))};
}

function buildBacktest() {
  const entries = []; let val = 10000;
  for (let i = 0; i < 252; i++) { val = +(val * (1 + (Math.random() - 0.47) * 0.015)).toFixed(2); entries.push({ date: `day-${i}`, value: val }); }
  return { strategy: 'IQ-Score Top 10', initial_value: 10000, final_value: val,
    total_return: +((val - 10000) / 10000).toFixed(4), cagr: 0.182, sharpe: 1.45, max_drawdown: -0.089,
    series: entries, benchmarks: [
      { name: 'IBOV', total_return: 0.12, cagr: 0.12, sharpe: 0.85, max_drawdown: -0.15 },
      { name: 'CDI', total_return: 0.135, cagr: 0.135, sharpe: null, max_drawdown: 0 },
    ]};
}

function buildDossier(ticker: string) {
  return { ticker, dimensions: [
    { name: 'Governança', score: randInt(60, 95), summary: 'Conselho independente, tag along 100%.' },
    { name: 'Track Record', score: randInt(60, 90), summary: 'ROIC acima do WACC em 8 de 10 períodos.' },
    { name: 'Moat', score: randInt(50, 90), summary: 'Vantagem competitiva em escala e marca.' },
    { name: 'Risco Político', score: randInt(40, 80), summary: 'Exposição moderada a regulação.' },
    { name: 'Cultura', score: randInt(55, 85), summary: 'Turnover baixo, P&D acima da média.' },
    { name: 'Operacional', score: randInt(60, 90), summary: 'Cadeia diversificada, capex disciplinado.' },
  ]};
}

// ── STATIC ENDPOINTS ──
export const MOCK_DATA: Record<string, (params?: any) => any> = {
  '/scores/screener': (p) => buildScreenerResults(p?.limit || 200),
  '/scores/top': (p) => buildTop(p?.limit || 10),
  '/scores/catalysts': () => buildCatalysts(),
  '/scores/compare': () => ({ tickers: TICKERS.slice(0, 3).map(t => ({ ...buildScoreDetail(t.ticker).iq_cognit, ticker: t.ticker, company_name: t.name, cluster_id: t.cluster_id, close: +(rand(20, 60)).toFixed(2), market_cap: randInt(5e9, 100e9), fair_value_final: +(rand(20, 60)).toFixed(2), safety_margin: +(rand(-0.2, 0.3)).toFixed(4), roe: +(rand(0.08, 0.25)).toFixed(4), dl_ebitda: +(rand(0, 3)).toFixed(2), net_margin: +(rand(0.05, 0.2)).toFixed(4), dividend_yield_proj: +(rand(0.02, 0.10)).toFixed(4), piotroski: randInt(4, 9) })) }),
  '/portfolio': () => buildPortfolio(),
  '/portfolio/analytics': () => ({ portfolio_id: 'mock', total_value: 45200.50, diversification_score: 72, cluster_allocation: { '1': 0.35, '2': 0.25, '4': 0.20, '7': 0.12, '5': 0.08 }, risk_metrics: { volatility: 0.18, beta: 0.92, sharpe: 1.35, max_drawdown: -0.12 } }),
  '/portfolio/alerts': () => ({ alerts: [
    { id: 'a1', type: 'concentration', message: 'Financeiro representa 35% da carteira — acima do ideal de 25%.', ticker: null, severity: 'medium', created_at: '2026-04-01T10:00:00Z' },
    { id: 'a2', type: 'score_drop', message: 'ABEV3 caiu para score 55 (Manter). Considere reavaliar.', ticker: 'ABEV3', severity: 'low', created_at: '2026-04-01T09:00:00Z' },
  ]}),
  '/portfolio/smart-contribution': () => ({ aporte_total: 1000, suggestions: [
    { ticker: 'WEGE3', company_name: 'WEG S.A.', suggested_amount: 350, reason: 'Score 90, subexposto', iq_score: 90 },
    { ticker: 'EGIE3', company_name: 'ENGIE BRASIL', suggested_amount: 300, reason: 'DY 7.2%, safety 92', iq_score: 78 },
    { ticker: 'VALE3', company_name: 'VALE S.A.', suggested_amount: 200, reason: 'Margem de segurança 18%', iq_score: 72 },
    { ticker: 'FLRY3', company_name: 'FLEURY S.A.', suggested_amount: 150, reason: 'Saúde subexposto', iq_score: 68 },
  ]}),
  '/dividends/summary': () => buildDividendSummary(),
  '/dividends/projections': () => buildDividendProjections(),
  '/dividends/calendar': () => buildDividendCalendar(),
  '/dividends/radar': () => buildDividendRadar(),
  '/dividends/simulate': () => ({ tickers: ['BBAS3','ITUB4'], monthly_income: 420, annual_income: 5040, yield_avg: 0.072, by_ticker: [] }),
  '/radar/feed': () => buildFeed(),
  '/radar/alerts': () => [],
  '/analytics/regime': () => buildRegime(),
  '/analytics/sector-rotation': () => ({ matrix: {}, clusters: {} }),
  '/analytics/sensitivity': () => ({ factors: [{ name: 'SELIC', current: 14.25, impact_per_unit: -1.2 }, { name: 'Câmbio', current: 5.72, impact_per_unit: -0.8 }] }),
  '/analytics/ic-timeline': () => ({ entries: Array.from({ length: 12 }, (_, i) => ({ month: `2026-${String(i + 1).padStart(2, '0')}`, ic_spearman: +(rand(0.15, 0.45)).toFixed(3) })) }),
  '/clusters': () => ({ clusters: [
    { cluster_id: 1, name: 'Financeiro' }, { cluster_id: 2, name: 'Commodities' },
    { cluster_id: 3, name: 'Consumo' }, { cluster_id: 4, name: 'Utilities' },
    { cluster_id: 5, name: 'Saúde' }, { cluster_id: 6, name: 'Real Estate' },
    { cluster_id: 7, name: 'Bens de Capital' }, { cluster_id: 8, name: 'Educação' },
    { cluster_id: 9, name: 'TMT' },
  ]}),
  '/backtest': () => buildBacktest(),
  '/tickers/search': () => ({ tickers: TICKERS.slice(0, 8).map(t => ({ id: `id-${t.ticker}`, ticker: t.ticker, company_name: t.name, cluster_id: t.cluster_id, is_active: true })) }),
  '/tickers': () => ({ tickers: TICKERS.map(t => ({ id: `id-${t.ticker}`, ticker: t.ticker, company_name: t.name, cluster_id: t.cluster_id, is_active: true })) }),
};

// ── DYNAMIC PER-TICKER ENDPOINTS ──
export function getMockForTickerEndpoint(path: string): any {
  const tickerMatch = path.match(/\/(?:scores|valuation|news|dividends|tickers)\/([A-Z0-9]+)/);
  const ticker = tickerMatch?.[1] || 'WEGE3';

  if (path.includes('/breakdown')) return { ticker, sub_scores: { valuation: randInt(50, 90), quality: randInt(50, 90), risk: randInt(50, 85), dividends: randInt(40, 90), growth: randInt(40, 90), momentum: randInt(40, 85) } };
  if (path.includes('/thesis')) return buildThesis(ticker);
  if (path.includes('/dossier')) return buildDossier(ticker);
  if (path.includes('/evidence')) return { ticker, evidences: [{ category: 'quality', signal: 'ROE acima de 15%', impact: 'positive', weight: 0.12 }, { category: 'valuation', signal: 'P/L abaixo da média setorial', impact: 'positive', weight: 0.10 }] };
  if (path.includes('/history') && path.includes('/scores')) return { ticker, entries: Array.from({ length: 12 }, (_, i) => ({ date: `2026-${String(i + 1).padStart(2, '0')}-01`, iq_score: randInt(55, 90), rating: ratingFor(randInt(55, 90)) })) };
  if (path.includes('/risk-metrics')) return { ticker, merton_pd: +(rand(0.01, 0.08)).toFixed(4), beneish_m: +(rand(-3, -1.5)).toFixed(2), altman_z: +(rand(1.5, 4)).toFixed(2), var_95: +(rand(0.02, 0.08)).toFixed(4) };
  if (path.match(/\/scores\/[A-Z]/) && !path.includes('/')) return buildScoreDetail(ticker);
  if (path.match(/\/scores\/[A-Z][A-Z0-9]+$/) || path.match(/\/scores\/[A-Z][A-Z0-9]+\?/)) return buildScoreDetail(ticker);

  if (path.includes('/scenarios')) return { ticker, bear: { value: +(rand(15, 40)).toFixed(2), prob: 0.2 }, base: { value: +(rand(30, 60)).toFixed(2), prob: 0.6 }, bull: { value: +(rand(50, 90)).toFixed(2), prob: 0.2 } };
  if (path.includes('/margin') && path.includes('/valuation')) return { ticker, entries: Array.from({ length: 12 }, (_, i) => ({ date: `2026-${String(i + 1).padStart(2, '0')}`, margin: +(rand(-0.2, 0.3)).toFixed(4) })) };
  if (path.match(/\/valuation\/[A-Z]/)) return buildValuation(ticker);

  if (path.includes('/investor-relations')) return { ticker, events: [{ title: 'Fato Relevante — Programa de Recompra', date: '2026-03-15', type: 'fato_relevante', url: '#' }] };
  if (path.match(/\/news\/[A-Z]/)) return buildNews(ticker);

  if (path.includes('/trap-risk')) return { ticker, company_name: ticker, trap_score: randInt(10, 40), signals: [{ name: 'Payout sustentável', triggered: false, description: 'Payout abaixo de 80%' }], verdict: 'Baixo risco de trap' };
  if (path.includes('/safety') && path.includes('/dividends')) return { ticker, company_name: ticker, safety_score: randInt(70, 95), payout_ratio: +(rand(0.3, 0.7)).toFixed(2), coverage_ratio: +(rand(1.5, 4)).toFixed(2), consistency_years: randInt(5, 15), cagr_5y: +(rand(0.05, 0.15)).toFixed(4) };

  if (path.includes('/quote')) return buildQuote(ticker);
  if (path.includes('/history')) return buildHistory(ticker);
  if (path.includes('/financials')) return buildFinancials(ticker);
  if (path.includes('/dividends') && path.match(/\/tickers\//)) return { ticker, dividends: Array.from({ length: 8 }, (_, i) => ({ ex_date: `202${5 - Math.floor(i / 4)}-${String((i % 4) * 3 + 3).padStart(2, '0')}-15`, payment_date: null, type: i % 2 === 0 ? 'JCP' : 'Dividendo', value_per_share: +(rand(0.2, 1.5)).toFixed(2) })) };
  if (path.includes('/peers')) return { peers: TICKERS.slice(0, 5).map(t => ({ ticker: t.ticker, company_name: t.name, iq_score: randInt(50, 90) })) };
  if (path.includes('/institutional-holders')) return { ticker, holders: [{ fund_name: 'ITAÚ ASSET', shares_held: randInt(1e6, 10e6), market_value: randInt(50e6, 500e6), change_3m: +(rand(-0.1, 0.15)).toFixed(4) }] };
  if (path.includes('/short-interest')) return { ticker, entries: [{ date: '2026-04-01', shares_lent: randInt(100000, 2000000), lending_rate: +(rand(1, 15)).toFixed(2) }] };
  if (path.match(/\/tickers\/[A-Z]/)) return { ticker, company_name: TICKERS.find(t => t.ticker === ticker)?.name || ticker, cluster_id: TICKERS.find(t => t.ticker === ticker)?.cluster_id || 1, is_active: true };

  return null;
}
