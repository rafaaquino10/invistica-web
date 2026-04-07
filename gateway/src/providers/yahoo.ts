import { Router } from 'express'
import { randomVariation } from '../utils/response-helpers.js'

const router = Router()

// Mock international assets
const internationalAssets: Record<string, { name: string; price: number; currency: string }> = {
  AAPL: { name: 'Apple Inc.', price: 185.50, currency: 'USD' },
  MSFT: { name: 'Microsoft Corporation', price: 425.00, currency: 'USD' },
  GOOGL: { name: 'Alphabet Inc.', price: 175.20, currency: 'USD' },
  AMZN: { name: 'Amazon.com Inc.', price: 195.30, currency: 'USD' },
  NVDA: { name: 'NVIDIA Corporation', price: 875.50, currency: 'USD' },
  META: { name: 'Meta Platforms Inc.', price: 585.00, currency: 'USD' },
  TSLA: { name: 'Tesla Inc.', price: 245.80, currency: 'USD' },
  BRK_B: { name: 'Berkshire Hathaway Inc.', price: 420.50, currency: 'USD' },
  JPM: { name: 'JPMorgan Chase & Co.', price: 198.40, currency: 'USD' },
  V: { name: 'Visa Inc.', price: 285.60, currency: 'USD' },
}

// GET /api/yahoo/quote/:symbol - Get quote for international asset
router.get('/quote/:symbol', (req, res) => {
  const symbol = req.params['symbol'].toUpperCase().replace('-', '_')
  const asset = internationalAssets[symbol]

  if (!asset) {
    return res.status(404).json({
      error: 'Symbol not found',
      message: `No data found for symbol: ${symbol}`,
      availableSymbols: Object.keys(internationalAssets),
    })
  }

  const price = randomVariation(asset.price, 0.5)
  const previousClose = asset.price
  const change = price - previousClose
  const changePercent = (change / previousClose) * 100

  res.json({
    symbol: symbol.replace('_', '-'),
    shortName: asset.name,
    currency: asset.currency,
    regularMarketPrice: price,
    regularMarketChange: Number(change.toFixed(2)),
    regularMarketChangePercent: Number(changePercent.toFixed(2)),
    regularMarketPreviousClose: previousClose,
    regularMarketOpen: randomVariation(asset.price, 0.3),
    regularMarketDayHigh: randomVariation(asset.price * 1.01, 0.2),
    regularMarketDayLow: randomVariation(asset.price * 0.99, 0.2),
    regularMarketVolume: Math.floor(Math.random() * 50000000),
    marketCap: Math.floor(asset.price * (Math.random() * 5 + 2) * 1000000000),
    regularMarketTime: new Date().toISOString(),
    exchange: 'NASDAQ',
    exchangeTimezone: 'America/New_York',
  })
})

export { router as yahooRoutes }
