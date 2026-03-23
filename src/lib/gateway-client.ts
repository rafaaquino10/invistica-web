// ─── Gateway API Client ──────────────────────────────────────
// Server-side HTTP client for the AQInvest Gateway.
// Used by tRPC routers to fetch live quotes, fundamentals, etc.

const GATEWAY_URL = process.env['GATEWAY_URL'] ?? 'http://localhost:4000'

// ─── Types ──────────────────────────────────────────────────

export interface GatewayQuote {
  stock: string
  name: string
  close: number
  change: number // percentage
  volume: number
  market_cap: number
  sector: string
  type: string
  logo: string
}

export interface GatewayFundamental {
  ticker: string
  cotacao: number
  peRatio: number | null
  pbRatio: number | null
  psr: number | null
  dividendYield: number | null
  pAtivo: number | null
  pCapGiro: number | null
  pEbit: number | null
  pAtivCircLiq: number | null
  evEbit: number | null
  evEbitda: number | null
  margemEbit: number | null
  margemLiquida: number | null
  liquidezCorrente: number | null
  roic: number | null
  roe: number | null
  liq2meses: number | null
  patrimLiquido: number | null
  divBrutPatrim: number | null
  crescimentoReceita5a: number | null
  netDebtEbitda: number | null
  payout: number | null
  crescLucro5a: number | null
  fiftyTwoWeekHigh: number | null
  fiftyTwoWeekLow: number | null
  freeCashflow: number | null
  ebitda: number | null
  trendScore: number | null
  roeMedia5a: number | null
  mrgLiquidaMedia5a: number | null

  // ─── Qualitative Metrics ──────────────────────────────────
  accrualsRatio: number | null
  earningsQuality: number | null
  fcfToNetIncome: number | null
  fcfFromCvm: number | null
  fcfYield: number | null
  fcfGrowthRate: number | null
  moatScore: number | null
  moatClassification: 'wide' | 'narrow' | 'none' | null
  earningsManipulationFlag: boolean | null
  managementScore: number | null
  debtSustainabilityScore: number | null
  regulatoryRiskScore: number | null
  // Live Signals
  governanceScore: number | null
  listingSegment: string | null
  listingSegmentScore: number | null
  freeFloatScore: number | null
  cvmSanctionsScore: number | null
  ceoTenureScore: number | null
  buybackSignal: number | null
  newsSentimentScore: number | null
  catalystAlertScore: number | null
  riEventVolume: number | null
  marginStability: number | null
  pricingPower: number | null
  reinvestmentRate: number | null
  interestCoverage: number | null
  shortTermDebtRatio: number | null
  debtCostEstimate: number | null
}

export interface GatewayHistoricalPrice {
  date: number
  open: number
  high: number
  low: number
  close: number
  volume: number
  adjustedClose: number
}

export interface GatewayDividend {
  assetIssued: string
  paymentDate: string | null
  rate: number
  label: string
  relatedTo: string
  lastDatePrior: string | null
}

export interface GatewayCompany {
  ticker: string
  name: string
  setor: string
  subsetor: string
  setorOriginal: string
}

// ─── HTTP Helper ────────────────────────────────────────────

async function gatewayFetch<T>(path: string, timeoutMs = 8000): Promise<T> {
  const url = `${GATEWAY_URL}${path}`
  const res = await fetch(url, {
    cache: 'no-store',
    signal: AbortSignal.timeout(timeoutMs),
  })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`Gateway ${res.status}: ${body.slice(0, 200)}`)
  }
  return res.json() as Promise<T>
}

// ─── Public API ─────────────────────────────────────────────

export async function fetchAllQuotes(): Promise<GatewayQuote[]> {
  const res = await gatewayFetch<{ data: GatewayQuote[] }>('/v1/quotes/all')
  return res.data
}

export async function fetchAllFundamentals(): Promise<GatewayFundamental[]> {
  const res = await gatewayFetch<{ data: GatewayFundamental[] }>('/v1/fundamentals/all')
  return res.data
}

export async function fetchHistory(
  ticker: string,
  range = '1mo',
  interval = '1d'
): Promise<GatewayHistoricalPrice[]> {
  const res = await gatewayFetch<{ data: GatewayHistoricalPrice[] }>(
    `/v1/history/${encodeURIComponent(ticker)}?range=${range}&interval=${interval}`
  )
  return res.data
}

export async function fetchDividends(ticker: string): Promise<GatewayDividend[]> {
  const res = await gatewayFetch<{ data: GatewayDividend[] }>(
    `/v1/dividends/${encodeURIComponent(ticker)}`
  )
  return res.data
}

export async function fetchAllCompanies(): Promise<GatewayCompany[]> {
  const res = await gatewayFetch<{ data: GatewayCompany[] }>('/v1/companies')
  return res.data
}

// ─── Sparklines ─────────────────────────────────────────────

export type SparklineMap = Record<string, number[]>

export async function fetchSparklines(): Promise<SparklineMap> {
  try {
    const res = await gatewayFetch<{ data: SparklineMap }>('/v1/sparklines')
    return res.data
  } catch {
    return {}
  }
}

// ─── Economy ────────────────────────────────────────────────

export interface InflationEntry {
  date: string
  value: number
  epochDate: number
}

export interface CurrencyEntry {
  fromCurrency: string
  toCurrency: string
  name: string
  bidPrice: number
  askPrice: number
  maxPrice: number
  minPrice: number
  variationPrice: number
  percentChange: number
  updatedAtDate: string
  updatedAtTimestamp: string
}

export async function fetchInflation(): Promise<InflationEntry[]> {
  try {
    const res = await gatewayFetch<{ data: InflationEntry[] }>('/v1/economy/inflation', 5000)
    return res.data
  } catch {
    return []
  }
}

export async function fetchCurrency(): Promise<CurrencyEntry[]> {
  try {
    const res = await gatewayFetch<{ data: CurrencyEntry[] }>('/v1/economy/currency', 5000)
    return res.data
  } catch {
    return []
  }
}

// ─── BCB Macro Indicators ────────────────────────────────────

export interface MacroIndicators {
  selic:   { valor: number; data: string }
  ipca:    { valor: number; data: string }
  ipca12m: { valor: number; data: string }
  cdi:     { valor: number; data: string }
  dolar:   { valor: number; data: string }
  euro:    { valor: number; data: string }
}

export async function fetchMacroIndicators(): Promise<MacroIndicators | null> {
  try {
    const res = await gatewayFetch<{ data: MacroIndicators }>('/v1/economy/macro', 10000)
    return res.data
  } catch {
    return null
  }
}

// ─── Momentum ────────────────────────────────────────────────

export interface GatewayMomentumResult {
  overall: { signal: number; label: 'BULL' | 'NEUTRO' | 'BEAR'; score: number }
  macro: { signal: number; label: string; factors: Array<{ name: string; signal: number; description: string; source: string }> }
  sector: { signal: number; label: string; description: string }
  asset: { signal: number; label: string; factors: string[] }
}

export async function fetchMomentum(ticker: string): Promise<GatewayMomentumResult | null> {
  try {
    const res = await gatewayFetch<{ data: GatewayMomentumResult }>(
      `/v1/momentum/${encodeURIComponent(ticker)}`,
      5000,
    )
    return res.data
  } catch {
    return null
  }
}

export interface GatewayMarketPulse {
  macro: { signal: number; label: string; factors: Array<{ name: string; signal: number; description: string }> }
  topBullSectors: Array<{ sector: string; signal: number; label: string }>
  topBearSectors: Array<{ sector: string; signal: number; label: string }>
  sectorCount: number
}

export async function fetchMarketPulse(): Promise<GatewayMarketPulse | null> {
  try {
    const res = await gatewayFetch<{ data: GatewayMarketPulse }>('/v1/momentum/pulse', 5000)
    return res.data
  } catch {
    return null
  }
}

export async function fetchMacroMomentum(): Promise<{ signal: number; label: string; factors: any[] } | null> {
  try {
    const res = await gatewayFetch<{ data: any }>('/v1/momentum/macro', 5000)
    return res.data
  } catch {
    return null
  }
}

// ─── News ────────────────────────────────────────────────────

export interface GatewayNewsItem {
  id: string
  title: string
  summary: string
  source: string
  sourceColor: string
  link: string
  tickers: string[]
  date: string
  category: string
  sentiment: string
  sentimentScore?: number       // -1.0 to +1.0 (Loughran-McDonald)
  sentimentConfidence?: number  // 0.0 to 1.0
}

export async function fetchNews(
  category?: string,
  limit = 30
): Promise<GatewayNewsItem[]> {
  const params = new URLSearchParams()
  if (category && category !== 'all') params.set('category', category)
  params.set('limit', String(limit))
  const query = params.toString()
  const res = await gatewayFetch<{ data: GatewayNewsItem[] }>(`/v1/news?${query}`, 5000)
  return res.data
}

// ─── Benchmarks ─────────────────────────────────────────────

export interface BenchmarkData {
  selic: { rate: number; date: string }
  cdi: { annualRate: number; dailyRate: number }
  ibov: { points: number; change: number }
  updatedAt: string
}

export async function fetchBenchmarks(): Promise<BenchmarkData> {
  const res = await gatewayFetch<{ data: BenchmarkData }>('/v1/benchmarks', 5000)
  return res.data
}

// ─── Beta ────────────────────────────────────────────────

export interface GatewayBeta {
  ticker: string
  beta: number
  rSquared: number
  dataPoints: number
}

/**
 * Busca betas calculados pelo gateway (rolling 12M vs IBOV).
 * Retorna [] se gateway indisponível — beta é opcional no scoring.
 */
export async function fetchBetas(): Promise<GatewayBeta[]> {
  try {
    const res = await gatewayFetch<{ data: GatewayBeta[] }>('/v1/beta?tickers=all', 10000)
    return res.data ?? []
  } catch {
    return []
  }
}

// ─── Company Profiles ───────────────────────────────────

export interface GatewayCompanyProfile {
  description: string
  founded: number
  headquarters: string
  employees: number
  segment: string
  riUrl: string
}

export async function fetchCompanyProfile(ticker: string): Promise<GatewayCompanyProfile | null> {
  try {
    const res = await gatewayFetch<{ data: GatewayCompanyProfile | null }>(
      `/v1/companies/${encodeURIComponent(ticker)}/profile`,
      3000,
    )
    return res.data
  } catch {
    return null
  }
}

// ─── Intelligence ───────────────────────────────────────────

export interface GatewayIntelligence {
  ticker: string
  companyName: string
  news: GatewayNewsItem[]
  killSwitch: { triggered: boolean; reason: string | null }
  relevantFacts: GatewayNewsItem[]
}

export interface GatewayFocusExpectation {
  indicator: string
  referenceDate: string
  median: number
  previous: number | null
  date: string
  delta: number | null
}

export interface GatewayFocusData {
  selic: GatewayFocusExpectation | null
  ipca: GatewayFocusExpectation | null
  pib: GatewayFocusExpectation | null
  cambio: GatewayFocusExpectation | null
  updatedAt: string
  insight: string | null
}

export async function fetchIntelligence(ticker: string): Promise<GatewayIntelligence | null> {
  try {
    const res = await gatewayFetch<{ data: GatewayIntelligence }>(
      `/v1/intelligence/${encodeURIComponent(ticker)}`,
      5000,
    )
    return res.data
  } catch {
    return null
  }
}

export async function fetchFocusData(): Promise<GatewayFocusData | null> {
  try {
    const res = await gatewayFetch<{ data: GatewayFocusData }>('/v1/intelligence/focus', 10000)
    return res.data
  } catch {
    return null
  }
}

// ─── RI (Relações com Investidores) ─────────────────────────

export interface CvmRiEvent {
  id: string
  companyName: string
  cnpj: string
  ticker: string | null
  type: 'fato_relevante' | 'comunicado_mercado' | 'aviso_acionistas' | 'assembleia' | 'resultado_trimestral'
  title: string
  date: string
  documentUrl: string | null
  summary: string | null
}

export async function fetchRiEvents(ticker?: string): Promise<CvmRiEvent[]> {
  try {
    const params = new URLSearchParams()
    if (ticker) params.set('ticker', ticker)
    params.set('limit', '50')
    const query = params.toString()
    const res = await gatewayFetch<{ data: CvmRiEvent[] }>(`/v1/ri/events?${query}`, 5000)
    return res.data ?? []
  } catch {
    return []
  }
}

// ─── Health ──────────────────────────────────────────────────

export async function isGatewayAvailable(): Promise<boolean> {
  try {
    const res = await fetch(`${GATEWAY_URL}/health`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(2000),
    })
    return res.ok
  } catch {
    return false
  }
}

// ─── Gateway Health ───────────────────────────────────────────────────

export interface GatewayHealth {
  status: 'ok' | 'degraded' | 'down'
  providers: Record<string, {
    status: string
    lastSuccess: string | null
    lastError: string | null
  }>
  circuitBreakers?: Record<string, {
    isOpen: boolean
    consecutiveFailures: number
    openedAt: string | null
  }>
}

export async function fetchGatewayHealth(): Promise<GatewayHealth | null> {
  try {
    return await gatewayFetch<GatewayHealth>('/health', 3000)
  } catch {
    return null
  }
}
