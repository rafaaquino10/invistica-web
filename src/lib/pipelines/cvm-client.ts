/**
 * CVM Data Client
 *
 * Client for fetching fundamental data from CVM (Brazilian SEC).
 * In development, connects to the mock server on port 4000.
 */

const CVM_BASE_URL = process.env['CVM_URL'] || 'http://localhost:4000/api/cvm'

interface CVMCompanyInfo {
  cnpj: string
  razaoSocial: string
  nomeComercial: string
  setor: string
  subsetor: string
  segmento: string
  codigoCVM: string
  situacaoEmissor: string
  dataInicioCVM: string
}

interface CVMFinancialStatement {
  referenceDate: string
  periodType: 'annual' | 'quarterly'
  account: string
  description: string
  value: number
  currency: string
}

interface CVMFundamentals {
  ticker: string
  referenceDate: string
  periodType: 'annual' | 'quarterly'

  // Valuation
  peRatio?: number
  pbRatio?: number
  evEbitda?: number
  priceToSales?: number

  // Profitability
  roe?: number
  roic?: number
  roa?: number
  netMargin?: number
  ebitdaMargin?: number
  grossMargin?: number

  // Per Share
  eps?: number
  bvps?: number
  dividendPerShare?: number
  revenuePerShare?: number

  // Dividends
  dividendYield?: number
  payoutRatio?: number

  // Debt
  currentRatio?: number
  quickRatio?: number
  netDebt?: number
  netDebtEbitda?: number
  debtToEquity?: number

  // Income Statement
  revenue?: number
  grossProfit?: number
  ebitda?: number
  ebit?: number
  netIncome?: number

  // Balance Sheet
  totalAssets?: number
  totalEquity?: number
  totalDebt?: number
  cash?: number
  currentAssets?: number
  currentLiabilities?: number
}

/**
 * Fetch company info from CVM
 */
export async function fetchCompanyInfo(ticker: string): Promise<CVMCompanyInfo | null> {
  try {
    const response = await fetch(`${CVM_BASE_URL}/company/${ticker}`)

    if (!response.ok) {
      console.error(`Failed to fetch company info for ${ticker}: ${response.status}`)
      return null
    }

    return await response.json()
  } catch (error) {
    console.error(`Error fetching company info for ${ticker}:`, error)
    return null
  }
}

/**
 * Fetch fundamental indicators
 */
export async function fetchFundamentals(
  ticker: string,
  options?: { periodType?: 'annual' | 'quarterly' }
): Promise<CVMFundamentals | null> {
  const periodType = options?.periodType ?? 'annual'

  try {
    const response = await fetch(`${CVM_BASE_URL}/fundamentals/${ticker}?periodType=${periodType}`)

    if (!response.ok) {
      console.error(`Failed to fetch fundamentals for ${ticker}: ${response.status}`)
      return null
    }

    return await response.json()
  } catch (error) {
    console.error(`Error fetching fundamentals for ${ticker}:`, error)
    return null
  }
}

/**
 * Fetch historical fundamentals
 */
export async function fetchFundamentalsHistory(
  ticker: string,
  options?: { years?: number; periodType?: 'annual' | 'quarterly' }
): Promise<CVMFundamentals[]> {
  const { years = 5, periodType = 'annual' } = options ?? {}

  try {
    const response = await fetch(
      `${CVM_BASE_URL}/fundamentals/${ticker}/history?years=${years}&periodType=${periodType}`
    )

    if (!response.ok) {
      console.error(`Failed to fetch fundamentals history for ${ticker}: ${response.status}`)
      return []
    }

    return await response.json()
  } catch (error) {
    console.error(`Error fetching fundamentals history for ${ticker}:`, error)
    return []
  }
}

/**
 * Fetch financial statements from CVM
 */
export async function fetchFinancialStatements(
  ticker: string,
  options?: {
    statementType?: 'income' | 'balance' | 'cashflow'
    periodType?: 'annual' | 'quarterly'
    years?: number
  }
): Promise<CVMFinancialStatement[]> {
  const { statementType = 'income', periodType = 'annual', years = 3 } = options ?? {}

  try {
    const response = await fetch(
      `${CVM_BASE_URL}/statements/${ticker}?type=${statementType}&periodType=${periodType}&years=${years}`
    )

    if (!response.ok) {
      console.error(`Failed to fetch statements for ${ticker}: ${response.status}`)
      return []
    }

    return await response.json()
  } catch (error) {
    console.error(`Error fetching statements for ${ticker}:`, error)
    return []
  }
}

/**
 * Fetch sector benchmarks for comparison
 */
export async function fetchSectorBenchmarks(sector: string): Promise<{
  sector: string
  metrics: {
    peRatio: { median: number; p25: number; p75: number }
    pbRatio: { median: number; p25: number; p75: number }
    roe: { median: number; p25: number; p75: number }
    dividendYield: { median: number; p25: number; p75: number }
  }
} | null> {
  try {
    const response = await fetch(`${CVM_BASE_URL}/benchmarks/sector/${encodeURIComponent(sector)}`)

    if (!response.ok) {
      console.error(`Failed to fetch benchmarks for sector ${sector}: ${response.status}`)
      return null
    }

    return await response.json()
  } catch (error) {
    console.error(`Error fetching benchmarks for sector ${sector}:`, error)
    return null
  }
}
