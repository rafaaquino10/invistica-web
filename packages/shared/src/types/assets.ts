// ─── Asset Types ─────────────────────────────────────────────
// Shared between web and mobile clients.

export interface AssetData {
  id: string
  ticker: string
  name: string
  type: 'stock'
  sector: string
  price: number
  change: number
  changePercent: number
  logo: string | null
  volume: number | null
  marketCap: number | null
  fiftyTwoWeekHigh: number | null
  fiftyTwoWeekLow: number | null
  hasFundamentals: boolean
  aqScore: AqScoreSummary | null
  fundamentals: FundamentalsData
}

export interface AqScoreSummary {
  scoreTotal: number
  scoreValuation: number
  scoreQuality: number
  scoreGrowth: number
  scoreDividends: number
  scoreRisk: number
}

export interface FundamentalsData {
  peRatio: number | null
  pbRatio: number | null
  psr: number | null
  pEbit: number | null
  evEbit: number | null
  evEbitda: number | null
  roe: number | null
  roic: number | null
  margemEbit: number | null
  margemLiquida: number | null
  liquidezCorrente: number | null
  divBrutPatrim: number | null
  pCapGiro: number | null
  pAtivCircLiq: number | null
  pAtivo: number | null
  patrimLiquido: number | null
  dividendYield: number | null
  netDebtEbitda: number | null
  crescimentoReceita5a: number | null
  liq2meses: number | null
}

export interface AssetSearchResult {
  ticker: string
  name: string
  sector: string
  logo: string | null
}

export interface HistoricalPrice {
  date: string
  open: number
  high: number
  low: number
  close: number
  volume: number
}
