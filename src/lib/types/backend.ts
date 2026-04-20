// ─── Backend Response Types ──────────────────────────────────
// Canonical type definitions for Invscore FastAPI responses.
// All consumers should import from here instead of gateway-client.

export interface BackendQuote {
  stock: string; name: string; close: number; change: number;
  volume: number; market_cap: number; sector: string; type: string; logo: string;
}

export interface BackendFundamental {
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

export interface BackendHistoricalPrice {
  date: number; open: number; high: number; low: number;
  close: number; volume: number; adjustedClose: number;
}

export interface BackendDividend {
  assetIssued: string; paymentDate: string | null; rate: number;
  label: string; relatedTo: string; lastDatePrior: string | null;
}

export interface BackendCompany { ticker: string; name: string; setor: string; subsetor: string; setorOriginal: string; }
export type SparklineMap = Record<string, number[]>
export interface InflationEntry { date: string; value: number; epochDate: number; }
export interface CurrencyEntry { fromCurrency: string; toCurrency: string; name: string; bidPrice: number; askPrice: number; maxPrice: number; minPrice: number; variationPrice: number; percentChange: number; updatedAtDate: string; updatedAtTimestamp: string; }

export interface MacroIndicators {
  selic: { valor: number; data: string }; ipca: { valor: number; data: string };
  ipca12m: { valor: number; data: string }; cdi: { valor: number; data: string };
  dolar: { valor: number; data: string }; euro: { valor: number; data: string };
}

export interface BackendMomentumResult {
  overall: { signal: number; label: 'BULL' | 'NEUTRO' | 'BEAR'; score: number };
  macro: { signal: number; label: string; factors: Array<{ name: string; signal: number; description: string; source: string }> };
  sector: { signal: number; label: string; description: string };
  asset: { signal: number; label: string; factors: string[] };
}

export interface BackendMarketPulse {
  macro: { signal: number; label: string; factors: Array<{ name: string; signal: number; description: string }> };
  topBullSectors: Array<{ sector: string; signal: number; label: string }>;
  topBearSectors: Array<{ sector: string; signal: number; label: string }>;
  sectorCount: number;
}

export interface BackendNewsItem {
  id: string; title: string; summary: string; source: string; sourceColor: string;
  link: string; tickers: string[]; date: string; category: string;
  sentiment: string; sentimentScore?: number; sentimentConfidence?: number;
}

export interface BenchmarkData {
  selic: { rate: number; date: string }; cdi: { annualRate: number; dailyRate: number };
  ibov: { points: number; change: number }; updatedAt: string;
}

export interface BackendBeta { ticker: string; beta: number; rSquared: number; dataPoints: number; }
export interface BackendCompanyProfile { description: string; founded: number; headquarters: string; employees: number; segment: string; riUrl: string; }
export interface BackendIntelligence { ticker: string; companyName: string; news: BackendNewsItem[]; killSwitch: { triggered: boolean; reason: string | null }; relevantFacts: BackendNewsItem[]; }
export interface BackendFocusExpectation { indicator: string; referenceDate: string; median: number; previous: number | null; date: string; delta: number | null; }
export interface BackendFocusData { selic: BackendFocusExpectation | null; ipca: BackendFocusExpectation | null; pib: BackendFocusExpectation | null; cambio: BackendFocusExpectation | null; updatedAt: string; insight: string | null; }
export interface CvmRiEvent { id: string; companyName: string; cnpj: string; ticker: string | null; type: 'fato_relevante' | 'comunicado_mercado' | 'aviso_acionistas' | 'assembleia' | 'resultado_trimestral'; title: string; date: string; documentUrl: string | null; summary: string | null; }
export interface BackendHealth { status: 'ok' | 'degraded' | 'down'; providers: Record<string, { status: string; lastSuccess: string | null; lastError: string | null }>; circuitBreakers?: Record<string, { isOpen: boolean; consecutiveFailures: number; openedAt: string | null }>; }

// ─── Legacy Aliases (backward compat during migration) ──────
// These will be removed once all consumers migrate to Backend* names.
export type GatewayQuote = BackendQuote
export type GatewayFundamental = BackendFundamental
export type GatewayHistoricalPrice = BackendHistoricalPrice
export type GatewayDividend = BackendDividend
export type GatewayCompany = BackendCompany
export type GatewayMomentumResult = BackendMomentumResult
export type GatewayMarketPulse = BackendMarketPulse
export type GatewayNewsItem = BackendNewsItem
export type GatewayBeta = BackendBeta
export type GatewayCompanyProfile = BackendCompanyProfile
export type GatewayIntelligence = BackendIntelligence
export type GatewayFocusExpectation = BackendFocusExpectation
export type GatewayFocusData = BackendFocusData
export type GatewayHealth = BackendHealth
