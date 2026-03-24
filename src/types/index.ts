// ===========================================
// InvestIQ Core Types
// ===========================================

// User & Auth Types
export interface User {
  id: string
  name: string | null
  email: string | null
  emailVerified: Date | null
  image: string | null
  investorProfile: InvestorProfile | null
  plan: Plan
  onboardingCompleted: boolean
  themePreference: ThemePreference
  createdAt: Date
  updatedAt: Date
}

export type InvestorProfile = 'conservative' | 'moderate' | 'aggressive'
export type Plan = 'free' | 'pro' | 'elite'
export type ThemePreference = 'light' | 'dark' | 'system'

// Asset Types
export interface Asset {
  id: string
  ticker: string
  name: string
  type: AssetType
  sector: string | null
  subsector: string | null
  segment: string | null
  listingSegment: string | null
  cnpj: string | null
  isActive: boolean
}

export type AssetType = 'stock' | 'fii' | 'etf' | 'bdr'

// Quote Types
export interface Quote {
  id: string
  assetId: string
  date: Date
  open: number | null
  high: number | null
  low: number | null
  close: number
  adjustedClose: number | null
  volume: number | null
}

export interface RealtimeQuote {
  ticker: string
  price: number
  change: number
  changePercent: number
  volume: number
  high: number
  low: number
  open: number
  previousClose: number
  updatedAt: Date
}

// Fundamental Types
export interface Fundamental {
  id: string
  assetId: string
  referenceDate: Date
  periodType: 'annual' | 'quarterly'
  totalAssets: number | null
  totalEquity: number | null
  netDebt: number | null
  totalLiabilities: number | null
  revenue: number | null
  ebitda: number | null
  netIncome: number | null
  roe: number | null
  roic: number | null
  netMargin: number | null
  ebitdaMargin: number | null
  peRatio: number | null
  pbRatio: number | null
  evEbitda: number | null
  dividendYield: number | null
  payoutRatio: number | null
  netDebtEbitda: number | null
}

// IQ-Score™ Types
export interface AqScore {
  id: string
  assetId: string
  calculatedAt: Date
  scoreTotal: number
  scoreValuation: number
  scoreQuality: number
  scoreGrowth: number
  scoreDividends: number
  scoreRisk: number
  scoreQualitativo: number
  breakdown: AqScoreBreakdown
  version: string
}

export interface AqScoreBreakdown {
  valuation: {
    peRatio: { value: number; score: number }
    pbRatio: { value: number; score: number }
    evEbitda: { value: number; score: number }
    pegRatio: { value: number; score: number }
    discountToFairValue: { value: number; score: number }
  }
  quality: {
    roe: { value: number; score: number }
    roic: { value: number; score: number }
    netMargin: { value: number; score: number }
    ebitdaMargin: { value: number; score: number }
    debtToEbitda: { value: number; score: number }
    interestCoverage: { value: number; score: number }
    earningsConsistency: { value: number; score: number }
  }
  growth: {
    revenueCAGR3y: { value: number; score: number }
    revenueCAGR5y: { value: number; score: number }
    earningsCAGR3y: { value: number; score: number }
    earningsCAGR5y: { value: number; score: number }
    ebitdaGrowth: { value: number; score: number }
  }
  dividends: {
    dividendYield: { value: number; score: number }
    payoutRatio: { value: number; score: number }
    dividendConsistency: { value: number; score: number }
    dividendGrowth: { value: number; score: number }
  }
  risk: {
    volatility: { value: number; score: number }
    beta: { value: number; score: number }
    liquidity: { value: number; score: number }
    governance: { value: number; score: number }
  }
}

export type ScoreLevel = 'critical' | 'attention' | 'healthy' | 'exceptional'

// Dividend Types
export interface Dividend {
  id: string
  assetId: string
  type: DividendType
  exDate: Date | null
  paymentDate: Date | null
  valuePerShare: number
}

export type DividendType = 'dividend' | 'jcp' | 'rendimento'

// Portfolio Types
export interface Portfolio {
  id: string
  userId: string
  name: string
  description: string | null
  targetAllocation: TargetAllocation | null
  isDefault: boolean
  positions: Position[]
  transactions: Transaction[]
  createdAt: Date
  updatedAt: Date
}

export interface TargetAllocation {
  [assetType: string]: number
}

export interface Position {
  id: string
  portfolioId: string
  assetId: string
  asset: Asset
  quantity: number
  avgCost: number
  totalCost: number
  currentPrice?: number
  currentValue?: number
  gain?: number
  gainPercent?: number
}

export interface Transaction {
  id: string
  portfolioId: string
  assetId: string
  asset: Asset
  type: TransactionType
  date: Date
  quantity: number
  price: number
  total: number
  fees: number
  notes: string | null
}

export type TransactionType = 'buy' | 'sell' | 'dividend' | 'split' | 'bonus'

// Watchlist Types
export interface WatchlistItem {
  id: string
  userId: string
  assetId: string
  asset: Asset
  addedAt: Date
}

// Alert Types
export interface Alert {
  id: string
  userId: string
  assetId: string
  asset: Asset
  type: AlertType
  threshold: number | null
  isActive: boolean
  lastTriggeredAt: Date | null
  createdAt: Date
}

export type AlertType = 'price_above' | 'price_below' | 'score_change' | 'dividend'

// API Response Types
export interface ApiResponse<T> {
  data: T
  error: string | null
  requestedAt: string
  took: number
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// Filter Types
export interface ScreenerFilters {
  type?: AssetType[]
  sector?: string[]
  minScore?: number
  maxScore?: number
  minDividendYield?: number
  maxPeRatio?: number
  minRoe?: number
  minMarketCap?: number
  maxMarketCap?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

// Chart Types
export interface ChartDataPoint {
  date: string
  value: number
}

export interface RadarChartData {
  subject: string
  value: number
  fullMark: number
}
