/**
 * BRAPI Client
 *
 * Client for fetching Brazilian market data from BRAPI API.
 * In development, connects to the mock server on port 4000.
 */

const BRAPI_BASE_URL = process.env['BRAPI_URL'] || 'https://investiqbackend-production.up.railway.app/api/brapi'

interface BRAPIQuote {
  symbol: string
  shortName: string
  longName: string
  currency: string
  regularMarketPrice: number
  regularMarketDayHigh: number
  regularMarketDayLow: number
  regularMarketOpen: number
  regularMarketPreviousClose: number
  regularMarketChange: number
  regularMarketChangePercent: number
  regularMarketVolume: number
  marketCap?: number
  fiftyTwoWeekHigh?: number
  fiftyTwoWeekLow?: number
}

interface BRAPIQuoteResponse {
  results: BRAPIQuote[]
  requestedAt: string
}

interface BRAPIDividend {
  type: string
  value: number
  paymentDate: string
  exDate: string
  ownershipDate?: string
}

interface BRAPIDividendsResponse {
  results: {
    symbol: string
    dividends: BRAPIDividend[]
  }
}

interface BRAPIHistoricalData {
  date: number
  open: number
  high: number
  low: number
  close: number
  volume: number
  adjustedClose: number
}

interface BRAPIHistoricalResponse {
  results: {
    symbol: string
    historicalDataPrice: BRAPIHistoricalData[]
  }[]
}

/**
 * Fetch current quote for a ticker
 */
export async function fetchQuote(ticker: string): Promise<BRAPIQuote | null> {
  try {
    const response = await fetch(`${BRAPI_BASE_URL}/quote/${ticker}`)

    if (!response.ok) {
      console.error(`Failed to fetch quote for ${ticker}: ${response.status}`)
      return null
    }

    const data: BRAPIQuoteResponse = await response.json()
    return data.results[0] ?? null
  } catch (error) {
    console.error(`Error fetching quote for ${ticker}:`, error)
    return null
  }
}

/**
 * Fetch quotes for multiple tickers
 */
export async function fetchQuotes(tickers: string[]): Promise<Map<string, BRAPIQuote>> {
  const results = new Map<string, BRAPIQuote>()

  // BRAPI allows comma-separated tickers
  const tickerList = tickers.join(',')

  try {
    const response = await fetch(`${BRAPI_BASE_URL}/quote/${tickerList}`)

    if (!response.ok) {
      console.error(`Failed to fetch quotes: ${response.status}`)
      return results
    }

    const data: BRAPIQuoteResponse = await response.json()

    for (const quote of data.results) {
      results.set(quote.symbol, quote)
    }
  } catch (error) {
    console.error('Error fetching quotes:', error)
  }

  return results
}

/**
 * Fetch dividend history for a ticker
 */
export async function fetchDividends(
  ticker: string,
  options?: { range?: '1m' | '3m' | '6m' | '1y' | '2y' | '5y' }
): Promise<BRAPIDividend[]> {
  const range = options?.range ?? '2y'

  try {
    const response = await fetch(`${BRAPI_BASE_URL}/dividends/${ticker}?range=${range}`)

    if (!response.ok) {
      console.error(`Failed to fetch dividends for ${ticker}: ${response.status}`)
      return []
    }

    const data: BRAPIDividendsResponse = await response.json()
    return data.results.dividends ?? []
  } catch (error) {
    console.error(`Error fetching dividends for ${ticker}:`, error)
    return []
  }
}

/**
 * Fetch historical price data
 */
export async function fetchHistoricalData(
  ticker: string,
  options?: { range?: '1d' | '5d' | '1mo' | '3mo' | '6mo' | '1y' | '2y' | '5y' | 'max' }
): Promise<BRAPIHistoricalData[]> {
  const range = options?.range ?? '1y'

  try {
    const response = await fetch(`${BRAPI_BASE_URL}/quote/${ticker}?range=${range}&interval=1d`)

    if (!response.ok) {
      console.error(`Failed to fetch historical data for ${ticker}: ${response.status}`)
      return []
    }

    const data: BRAPIHistoricalResponse = await response.json()
    return data.results[0]?.historicalDataPrice ?? []
  } catch (error) {
    console.error(`Error fetching historical data for ${ticker}:`, error)
    return []
  }
}

/**
 * Fetch all available tickers
 */
export async function fetchAvailableTickers(): Promise<string[]> {
  try {
    const response = await fetch(`${BRAPI_BASE_URL}/available`)

    if (!response.ok) {
      console.error(`Failed to fetch available tickers: ${response.status}`)
      return []
    }

    const data = await response.json()
    return data.stocks ?? []
  } catch (error) {
    console.error('Error fetching available tickers:', error)
    return []
  }
}
