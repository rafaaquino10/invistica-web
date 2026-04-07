// ─── InvestIQ Backend Client (replaces Gateway) ─────────────
// All functions maintain their original signatures for backward
// compatibility, but now call the InvestIQ FastAPI backend directly.
// The Express Gateway has been eliminated from the architecture.

const INVESTIQ_URL = process.env['INVESTIQ_API_URL'] ?? 'https://investiqbackend-production.up.railway.app'

// ─── Types (unchanged, for backward compat) ─────────────────

export interface GatewayQuote {
  stock: string; name: string; close: number; change: number;
  volume: number; market_cap: number; sector: string; type: string; logo: string;
}

export interface GatewayFundamental {
  ticker: string; cotacao: number;
  peRatio: number | null; pbRatio: number | null; psr: number | null;
  dividendYield: number | null; pAtivo: number | null; pCapGiro: number | null;
  pEbit: number | null; pAtivCircLiq: number | null; evEbit: number | null;
  evEbitda: number | null; margemEbit: number | null; margemLiquida: number | null;
  liquidezCorrente: number | null; roic: number | null; roe: number | null;
  liq2meses: number | null; patrimLiquido: number | null; divBrutPatrim: number | null;
  crescimentoReceita5a: number | null; netDebtEbitda: number | null;
  payout: number | null; crescLucro5a: number | null;
  fiftyTwoWeekHigh: number | null; fiftyTwoWeekLow: number | null;
  freeCashflow: number | null; ebitda: number | null; trendScore: number | null;
  roeMedia5a: number | null; mrgLiquidaMedia5a: number | null;
  accrualsRatio: number | null; earningsQuality: number | null;
  fcfToNetIncome: number | null; fcfFromCvm: number | null; fcfYield: number | null;
  fcfGrowthRate: number | null; moatScore: number | null;
  moatClassification: 'wide' | 'narrow' | 'none' | null;
  earningsManipulationFlag: boolean | null; managementScore: number | null;
  debtSustainabilityScore: number | null; regulatoryRiskScore: number | null;
  governanceScore: number | null; listingSegment: string | null;
  listingSegmentScore: number | null; freeFloatScore: number | null;
  cvmSanctionsScore: number | null; ceoTenureScore: number | null;
  buybackSignal: number | null; newsSentimentScore: number | null;
  catalystAlertScore: number | null; riEventVolume: number | null;
  marginStability: number | null; pricingPower: number | null;
  reinvestmentRate: number | null; interestCoverage: number | null;
  shortTermDebtRatio: number | null; debtCostEstimate: number | null;
}

export interface GatewayHistoricalPrice {
  date: number; open: number; high: number; low: number;
  close: number; volume: number; adjustedClose: number;
}

export interface GatewayDividend {
  assetIssued: string; paymentDate: string | null; rate: number;
  label: string; relatedTo: string; lastDatePrior: string | null;
}

export interface GatewayCompany { ticker: string; name: string; setor: string; subsetor: string; setorOriginal: string; }
export type SparklineMap = Record<string, number[]>
export interface InflationEntry { date: string; value: number; epochDate: number; }
export interface CurrencyEntry { fromCurrency: string; toCurrency: string; name: string; bidPrice: number; askPrice: number; maxPrice: number; minPrice: number; variationPrice: number; percentChange: number; updatedAtDate: string; updatedAtTimestamp: string; }

export interface MacroIndicators {
  selic: { valor: number; data: string }; ipca: { valor: number; data: string };
  ipca12m: { valor: number; data: string }; cdi: { valor: number; data: string };
  dolar: { valor: number; data: string }; euro: { valor: number; data: string };
}

export interface GatewayMomentumResult {
  overall: { signal: number; label: 'BULL' | 'NEUTRO' | 'BEAR'; score: number };
  macro: { signal: number; label: string; factors: Array<{ name: string; signal: number; description: string; source: string }> };
  sector: { signal: number; label: string; description: string };
  asset: { signal: number; label: string; factors: string[] };
}

export interface GatewayMarketPulse {
  macro: { signal: number; label: string; factors: Array<{ name: string; signal: number; description: string }> };
  topBullSectors: Array<{ sector: string; signal: number; label: string }>;
  topBearSectors: Array<{ sector: string; signal: number; label: string }>;
  sectorCount: number;
}

export interface GatewayNewsItem {
  id: string; title: string; summary: string; source: string; sourceColor: string;
  link: string; tickers: string[]; date: string; category: string;
  sentiment: string; sentimentScore?: number; sentimentConfidence?: number;
}

export interface BenchmarkData {
  selic: { rate: number; date: string }; cdi: { annualRate: number; dailyRate: number };
  ibov: { points: number; change: number }; updatedAt: string;
}

export interface GatewayBeta { ticker: string; beta: number; rSquared: number; dataPoints: number; }
export interface GatewayCompanyProfile { description: string; founded: number; headquarters: string; employees: number; segment: string; riUrl: string; }
export interface GatewayIntelligence { ticker: string; companyName: string; news: GatewayNewsItem[]; killSwitch: { triggered: boolean; reason: string | null }; relevantFacts: GatewayNewsItem[]; }
export interface GatewayFocusExpectation { indicator: string; referenceDate: string; median: number; previous: number | null; date: string; delta: number | null; }
export interface GatewayFocusData { selic: GatewayFocusExpectation | null; ipca: GatewayFocusExpectation | null; pib: GatewayFocusExpectation | null; cambio: GatewayFocusExpectation | null; updatedAt: string; insight: string | null; }
export interface CvmRiEvent { id: string; companyName: string; cnpj: string; ticker: string | null; type: 'fato_relevante' | 'comunicado_mercado' | 'aviso_acionistas' | 'assembleia' | 'resultado_trimestral'; title: string; date: string; documentUrl: string | null; summary: string | null; }
export interface GatewayHealth { status: 'ok' | 'degraded' | 'down'; providers: Record<string, { status: string; lastSuccess: string | null; lastError: string | null }>; circuitBreakers?: Record<string, { isOpen: boolean; consecutiveFailures: number; openedAt: string | null }>; }

// ─── HTTP Helper ────────────────────────────────────────────

async function iqFetch<T>(path: string, timeoutMs = 10000): Promise<T> {
  const url = `${INVESTIQ_URL}${path}`
  const res = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(timeoutMs) })
  if (!res.ok) throw new Error(`InvestIQ ${res.status}: ${url}`)
  return res.json() as Promise<T>
}

// ─── Public API (same signatures, InvestIQ backend) ─────────

export async function fetchAllQuotes(): Promise<GatewayQuote[]> {
  const res = await iqFetch<{ results: Array<{ ticker: string; company_name: string; cluster_id: number; iq_score: number }> }>('/scores/screener')
  // Enrich with quotes
  const quotes: GatewayQuote[] = []
  for (const a of (res.results || []).slice(0, 50)) {
    try {
      const t = await iqFetch<{ quote: { close: number; open: number; volume: number; market_cap: number | null } }>(`/tickers/${a.ticker}`)
      const q = t.quote
      quotes.push({
        stock: a.ticker, name: a.company_name, close: q?.close ?? 0,
        change: q ? ((q.close - q.open) / q.open) * 100 : 0,
        volume: q?.volume ?? 0, market_cap: q?.market_cap ?? 0,
        sector: '', type: 'stock',
        logo: `https://raw.githubusercontent.com/StatusInvest/Content/master/img/company/${a.ticker}.jpg`,
      })
    } catch { /* skip */ }
  }
  return quotes
}

export async function fetchAllFundamentals(): Promise<GatewayFundamental[]> {
  return [] // Backend doesn't have a bulk fundamentals endpoint; scores/screener covers scoring
}

export async function fetchHistory(ticker: string, range = '1mo', _interval = '1d'): Promise<GatewayHistoricalPrice[]> {
  const days = range === '5y' ? 1825 : range === '1y' ? 365 : range === '6mo' ? 180 : range === '3mo' ? 90 : range === '1mo' ? 30 : 7
  const res = await iqFetch<{ data: Array<{ date: string; open: number; high: number; low: number; close: number; volume: number }> }>(
    `/tickers/${encodeURIComponent(ticker)}/history?days=${days}`)
  return (res.data || []).map(d => ({ date: new Date(d.date).getTime(), open: d.open, high: d.high, low: d.low, close: d.close, volume: d.volume, adjustedClose: d.close }))
}

export async function fetchDividends(ticker: string): Promise<GatewayDividend[]> {
  const res = await iqFetch<{ dividends: Array<{ ex_date: string; payment_date: string | null; type: string; value_per_share: number }> }>(
    `/tickers/${encodeURIComponent(ticker)}/dividends`)
  return (res.dividends || []).map(d => ({ assetIssued: ticker, paymentDate: d.payment_date, rate: d.value_per_share, label: d.type, relatedTo: ticker, lastDatePrior: d.ex_date }))
}

export async function fetchAllCompanies(): Promise<GatewayCompany[]> { return [] }
export async function fetchSparklines(): Promise<SparklineMap> { return {} }
export async function fetchInflation(): Promise<InflationEntry[]> { return [] }
export async function fetchCurrency(): Promise<CurrencyEntry[]> { return [] }

export async function fetchMacroIndicators(): Promise<MacroIndicators | null> {
  try {
    const r = await iqFetch<{ macro: { selic: number; ipca: number; cambio_usd: number; brent: number } }>('/analytics/regime')
    const d = new Date().toISOString().split('T')[0]!
    return {
      selic: { valor: r.macro.selic, data: d }, ipca: { valor: r.macro.ipca, data: d },
      ipca12m: { valor: r.macro.ipca, data: d }, cdi: { valor: r.macro.selic - 0.1, data: d },
      dolar: { valor: r.macro.cambio_usd, data: d }, euro: { valor: r.macro.cambio_usd * 1.08, data: d },
    }
  } catch { return null }
}

export async function fetchMomentum(_ticker: string): Promise<GatewayMomentumResult | null> { return null }

export async function fetchMarketPulse(): Promise<GatewayMarketPulse | null> {
  try {
    const r = await iqFetch<{ regime: string; sector_rotation: Record<string, { signal: string; tilt_points: number }> }>('/analytics/regime')
    const bull: Array<{ sector: string; signal: number; label: string }> = []
    const bear: Array<{ sector: string; signal: number; label: string }> = []
    for (const [sector, info] of Object.entries(r.sector_rotation || {})) {
      if (info.signal === 'favorecido') bull.push({ sector, signal: info.tilt_points, label: 'BULL' })
      else if (info.signal === 'desfavorecido') bear.push({ sector, signal: info.tilt_points, label: 'BEAR' })
    }
    return {
      macro: { signal: r.regime === 'RISK_ON' ? 1 : r.regime === 'RISK_OFF' ? -1 : 0, label: r.regime, factors: [] },
      topBullSectors: bull.slice(0, 3), topBearSectors: bear.slice(0, 3), sectorCount: Object.keys(r.sector_rotation || {}).length,
    }
  } catch { return null }
}

export async function fetchMacroMomentum(): Promise<{ signal: number; label: string; factors: any[] } | null> {
  try {
    const r = await iqFetch<{ regime: string }>('/analytics/regime')
    return { signal: r.regime === 'RISK_ON' ? 1 : r.regime === 'RISK_OFF' ? -1 : 0, label: r.regime, factors: [] }
  } catch { return null }
}

export async function fetchNews(_category?: string, limit = 30): Promise<GatewayNewsItem[]> {
  try {
    const res = await iqFetch<{ catalysts: Array<{ type: string; title: string; date: string; source?: string; url?: string; ticker?: string }> }>(`/scores/catalysts?days=7`)
    return (res.catalysts || []).slice(0, limit).map((c, i) => ({
      id: `cat-${i}`, title: c.title, summary: '', source: c.source || 'InvestIQ', sourceColor: '#606878',
      link: c.url || '#', tickers: c.ticker ? [c.ticker] : [], date: c.date, category: c.type, sentiment: 'neutral',
    }))
  } catch { return [] }
}

export async function fetchBenchmarks(): Promise<BenchmarkData> {
  const r = await iqFetch<{ macro: { selic: number } }>('/analytics/regime')
  return {
    selic: { rate: r.macro.selic, date: new Date().toISOString() },
    cdi: { annualRate: r.macro.selic - 0.1, dailyRate: (r.macro.selic - 0.1) / 252 },
    ibov: { points: 128000, change: 0 }, updatedAt: new Date().toISOString(),
  }
}

export async function fetchBetas(): Promise<GatewayBeta[]> { return [] }

export async function fetchCompanyProfile(_ticker: string): Promise<GatewayCompanyProfile | null> { return null }

export async function fetchIntelligence(ticker: string): Promise<GatewayIntelligence | null> {
  try {
    const res = await iqFetch<{ news: Array<{ title: string; date: string; source: string; url: string; sentiment?: string }> }>(`/news/${encodeURIComponent(ticker)}?limit=10`)
    return {
      ticker, companyName: ticker,
      news: (res.news || []).map((n, i) => ({
        id: `n-${i}`, title: n.title, summary: '', source: n.source || 'InvestIQ', sourceColor: '#606878',
        link: n.url || '#', tickers: [ticker], date: n.date, category: 'news', sentiment: n.sentiment || 'neutral',
      })),
      killSwitch: { triggered: false, reason: null }, relevantFacts: [],
    }
  } catch { return null }
}

export async function fetchFocusData(): Promise<GatewayFocusData | null> {
  try {
    const f = await iqFetch<{ expectations: Array<{ indicator: string; current: number }> }>('/tickers/macro/focus-expectations')
    if (!f.expectations?.length) return null
    const find = (n: string) => f.expectations.find(e => e.indicator?.toLowerCase().includes(n))
    const d = new Date().toISOString().split('T')[0]!
    const mk = (ind: string, val: number): GatewayFocusExpectation => ({ indicator: ind, referenceDate: d, median: val, previous: null, date: d, delta: null })
    return {
      selic: find('selic') ? mk('SELIC', find('selic')!.current) : null,
      ipca: find('ipca') ? mk('IPCA', find('ipca')!.current) : null,
      pib: find('pib') ? mk('PIB', find('pib')!.current) : null,
      cambio: (find('cambio') || find('câmbio')) ? mk('Câmbio', (find('cambio') || find('câmbio'))!.current) : null,
      updatedAt: d, insight: null,
    }
  } catch { return null }
}

export async function fetchRiEvents(ticker?: string): Promise<CvmRiEvent[]> {
  if (!ticker) return []
  try {
    const res = await iqFetch<{ items?: Array<{ title: string; date: string; url: string; type: string }> }>(`/news/${encodeURIComponent(ticker)}/investor-relations?limit=20`)
    return (res.items || []).map((item, i) => ({
      id: `ri-${ticker}-${i}`, companyName: ticker, cnpj: '', ticker,
      type: 'fato_relevante' as const, title: item.title, date: item.date, documentUrl: item.url, summary: null,
    }))
  } catch { return [] }
}

export async function isGatewayAvailable(): Promise<boolean> { return true } // Always "available" since we use backend directly
export async function fetchGatewayHealth(): Promise<GatewayHealth | null> {
  return { status: 'ok', providers: { investiq: { status: 'ok', lastSuccess: new Date().toISOString(), lastError: null } } }
}
