// ─── Portfolio Types ─────────────────────────────────────────
// Shared between web and mobile clients.

export interface Portfolio {
  id: string
  name: string
  description: string | null
  isDefault: boolean
  createdAt: Date
}

export interface Position {
  assetId: string
  ticker: string
  name: string
  type: string
  quantity: number
  avgCost: number
  currentPrice: number
  value: number
  gain: number
  gainPercent: number
}

export interface Transaction {
  id: string
  portfolioId: string
  ticker: string
  type: 'buy' | 'sell'
  quantity: number
  price: number
  date: Date
  fees: number
}

export interface PortfolioPerformance {
  percentReturn: number
  benchmarks: {
    cdi: number
    ibov: number
  }
}

export interface PortfolioSummary {
  totalValue: number
  totalCost: number
  totalGain: number
  totalGainPercent: number
  positionsCount: number
  transactionsCount: number
}
