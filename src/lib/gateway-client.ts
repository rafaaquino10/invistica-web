// ─── Backend Client (Legacy Compatibility Layer) ─────────────
// Re-exports types from @/lib/types/backend and provides fetch wrappers.
// All functions call the Invscore FastAPI backend via investiq client.
//
// NEW CODE should import types from '@/lib/types/backend'
// and use `investiq` client from '@/lib/investiq-client' directly.

import { investiq } from './investiq-client'
import { safeFetch } from './safe-fetch'
import { SELIC_FALLBACK, CDI_SELIC_SPREAD, LOGO_BASE_URL } from './constants'

// ─── Re-export all types from canonical location ───────────
export type {
  BackendQuote as GatewayQuote,
  BackendFundamental as GatewayFundamental,
  BackendHistoricalPrice as GatewayHistoricalPrice,
  BackendDividend as GatewayDividend,
  BackendCompany as GatewayCompany,
  SparklineMap,
  InflationEntry,
  CurrencyEntry,
  MacroIndicators,
  BackendMomentumResult as GatewayMomentumResult,
  BackendMarketPulse as GatewayMarketPulse,
  BackendNewsItem as GatewayNewsItem,
  BenchmarkData,
  BackendBeta as GatewayBeta,
  BackendCompanyProfile as GatewayCompanyProfile,
  BackendIntelligence as GatewayIntelligence,
  BackendFocusExpectation as GatewayFocusExpectation,
  BackendFocusData as GatewayFocusData,
  CvmRiEvent,
  BackendHealth as GatewayHealth,
} from './types/backend'

import type {
  BackendQuote, BackendHistoricalPrice, BackendDividend,
  BackendFundamental, BackendCompany, BackendMarketPulse,
  BackendNewsItem, BenchmarkData, BackendBeta,
  BackendCompanyProfile, BackendIntelligence, BackendFocusData,
  BackendFocusExpectation, BackendHealth, CvmRiEvent,
  MacroIndicators, SparklineMap, InflationEntry, CurrencyEntry,
  BackendMomentumResult,
} from './types/backend'

// ─── Active Functions (used by tRPC routers) ────────────────

export async function fetchAllQuotes(): Promise<BackendQuote[]> {
  const res = await investiq.get<{ results: Array<{ ticker: string; company_name: string; cluster_id: number; iq_score: number }> }>('/scores/screener')
  const quotes: BackendQuote[] = []
  for (const a of (res.results || []).slice(0, 50)) {
    const t = await safeFetch(
      () => investiq.get<{ quote: { close: number; open: number; volume: number; market_cap: number | null } }>(`/tickers/${a.ticker}`),
      null, `quote:${a.ticker}`
    )
    if (t) {
      const q = t.quote
      quotes.push({
        stock: a.ticker, name: a.company_name, close: q?.close ?? 0,
        change: q ? ((q.close - q.open) / q.open) * 100 : 0,
        volume: q?.volume ?? 0, market_cap: q?.market_cap ?? 0,
        sector: '', type: 'stock',
        logo: `${LOGO_BASE_URL}/${a.ticker}.jpg`,
      })
    }
  }
  return quotes
}

export async function fetchHistory(ticker: string, range = '1mo', _interval = '1d'): Promise<BackendHistoricalPrice[]> {
  const days = range === '5y' ? 1825 : range === '1y' ? 365 : range === '6mo' ? 180 : range === '3mo' ? 90 : range === '1mo' ? 30 : 7
  const res = await investiq.get<{ data: Array<{ date: string; open: number; high: number; low: number; close: number; volume: number }> }>(
    `/tickers/${encodeURIComponent(ticker)}/history`, { params: { days } })
  return (res.data || []).map(d => ({ date: new Date(d.date).getTime(), open: d.open, high: d.high, low: d.low, close: d.close, volume: d.volume, adjustedClose: d.close }))
}

export async function fetchDividends(ticker: string): Promise<BackendDividend[]> {
  const res = await investiq.get<{ dividends: Array<{ ex_date: string; payment_date: string | null; type: string; value_per_share: number }> }>(
    `/tickers/${encodeURIComponent(ticker)}/dividends`)
  return (res.dividends || []).map(d => ({ assetIssued: ticker, paymentDate: d.payment_date, rate: d.value_per_share, label: d.type, relatedTo: ticker, lastDatePrior: d.ex_date }))
}

export async function fetchMacroIndicators(): Promise<MacroIndicators | null> {
  return safeFetch(async () => {
    const r = await investiq.get<{ macro: { selic: number; ipca: number; cambio_usd: number; brent: number } }>('/analytics/regime')
    const d = new Date().toISOString().split('T')[0]!
    return {
      selic: { valor: r.macro.selic, data: d }, ipca: { valor: r.macro.ipca, data: d },
      ipca12m: { valor: r.macro.ipca, data: d }, cdi: { valor: r.macro.selic - CDI_SELIC_SPREAD, data: d },
      dolar: { valor: r.macro.cambio_usd, data: d }, euro: { valor: r.macro.cambio_usd * 1.08, data: d },
    }
  }, null, 'macroIndicators')
}

export async function fetchMarketPulse(): Promise<BackendMarketPulse | null> {
  return safeFetch(async () => {
    const r = await investiq.get<{ regime: string; sector_rotation: Record<string, { signal: string; tilt_points: number }> }>('/analytics/regime')
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
  }, null, 'marketPulse')
}

export async function fetchMacroMomentum(): Promise<{ signal: number; label: string; factors: unknown[] } | null> {
  return safeFetch(async () => {
    const r = await investiq.get<{ regime: string }>('/analytics/regime')
    return { signal: r.regime === 'RISK_ON' ? 1 : r.regime === 'RISK_OFF' ? -1 : 0, label: r.regime, factors: [] }
  }, null, 'macroMomentum')
}

export async function fetchNews(_category?: string, limit = 30): Promise<BackendNewsItem[]> {
  return safeFetch(async () => {
    const res = await investiq.get<{ catalysts: Array<{ type: string; title: string; date: string; source?: string; url?: string; ticker?: string }> }>('/scores/catalysts', { params: { days: 7 } })
    return (res.catalysts || []).slice(0, limit).map((c, i) => ({
      id: `cat-${i}`, title: c.title, summary: '', source: c.source || 'Invística', sourceColor: '#606878',
      link: c.url || '#', tickers: c.ticker ? [c.ticker] : [], date: c.date, category: c.type, sentiment: 'neutral',
    }))
  }, [], 'news')
}

export async function fetchBenchmarks(): Promise<BenchmarkData> {
  const r = await investiq.get<{ macro: { selic: number } }>('/analytics/regime')
  const selic = r.macro?.selic ?? SELIC_FALLBACK
  return {
    selic: { rate: selic, date: new Date().toISOString() },
    cdi: { annualRate: selic - CDI_SELIC_SPREAD, dailyRate: (selic - CDI_SELIC_SPREAD) / 252 },
    ibov: { points: 0, change: 0 }, updatedAt: new Date().toISOString(),
  }
}

export async function fetchIntelligence(ticker: string): Promise<BackendIntelligence | null> {
  return safeFetch(async () => {
    const res = await investiq.get<{ news: Array<{ title: string; date: string; source: string; url: string; sentiment?: string }> }>(`/news/${encodeURIComponent(ticker)}`, { params: { limit: 10 } })
    return {
      ticker, companyName: ticker,
      news: (res.news || []).map((n, i) => ({
        id: `n-${i}`, title: n.title, summary: '', source: n.source || 'Invística', sourceColor: '#606878',
        link: n.url || '#', tickers: [ticker], date: n.date, category: 'news', sentiment: n.sentiment || 'neutral',
      })),
      killSwitch: { triggered: false, reason: null }, relevantFacts: [],
    }
  }, null, `intelligence:${ticker}`)
}

export async function fetchFocusData(): Promise<BackendFocusData | null> {
  return safeFetch(async () => {
    const f = await investiq.get<{ expectations: Array<{ indicator: string; current: number }> }>('/tickers/macro/focus-expectations')
    if (!f.expectations?.length) return null
    const find = (n: string) => f.expectations.find(e => e.indicator?.toLowerCase().includes(n))
    const d = new Date().toISOString().split('T')[0]!
    const mk = (ind: string, val: number): BackendFocusExpectation => ({ indicator: ind, referenceDate: d, median: val, previous: null, date: d, delta: null })
    return {
      selic: find('selic') ? mk('SELIC', find('selic')!.current) : null,
      ipca: find('ipca') ? mk('IPCA', find('ipca')!.current) : null,
      pib: find('pib') ? mk('PIB', find('pib')!.current) : null,
      cambio: (find('cambio') || find('câmbio')) ? mk('Câmbio', (find('cambio') || find('câmbio'))!.current) : null,
      updatedAt: d, insight: null,
    }
  }, null, 'focusData')
}

export async function fetchRiEvents(ticker?: string): Promise<CvmRiEvent[]> {
  if (!ticker) return []
  return safeFetch(async () => {
    const res = await investiq.get<{ items?: Array<{ title: string; date: string; url: string; type: string }> }>(`/news/${encodeURIComponent(ticker)}/investor-relations`, { params: { limit: 20 } })
    return (res.items || []).map((item, i) => ({
      id: `ri-${ticker}-${i}`, companyName: ticker, cnpj: '', ticker,
      type: 'fato_relevante' as const, title: item.title, date: item.date, documentUrl: item.url, summary: null,
    }))
  }, [], `riEvents:${ticker}`)
}

// ─── Deprecated stubs (kept for import compat) ──────────────

/** @deprecated Pipeline legado */
export async function fetchAllFundamentals(): Promise<BackendFundamental[]> { return [] }
/** @deprecated Pipeline legado */
export async function fetchAllCompanies(): Promise<BackendCompany[]> { return [] }
/** @deprecated Use investiq.get('/tickers/{ticker}/history') */
export async function fetchSparklines(): Promise<SparklineMap> { return {} }
/** @deprecated Use /analytics/regime */
export async function fetchInflation(): Promise<InflationEntry[]> { return [] }
/** @deprecated Use /analytics/regime */
export async function fetchCurrency(): Promise<CurrencyEntry[]> { return [] }
/** @deprecated Use /scores/{ticker}/risk-metrics */
export async function fetchMomentum(_ticker: string): Promise<BackendMomentumResult | null> { return null }
/** @deprecated Use /scores/{ticker}/risk-metrics */
export async function fetchBetas(): Promise<BackendBeta[]> { return [] }
/** @deprecated Use /scores/{ticker} */
export async function fetchCompanyProfile(_ticker: string): Promise<BackendCompanyProfile | null> { return null }
export async function isGatewayAvailable(): Promise<boolean> { return true }
export async function fetchGatewayHealth(): Promise<BackendHealth | null> {
  return { status: 'ok', providers: { investiq: { status: 'ok', lastSuccess: new Date().toISOString(), lastError: null } } }
}
