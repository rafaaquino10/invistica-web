import { Router } from 'express'
import { mockAssets } from '../data/assets.js'
import { createBrapiResponse, randomVariation, generateHistoricalDates } from '../utils/response-helpers.js'

const router = Router()

// GET /api/quote/:tickers - Get quotes for one or more tickers
router.get('/quote/:tickers', (req, res) => {
  const tickers = req.params['tickers'].toUpperCase().split(',')
  const results = tickers
    .map((ticker) => {
      const asset = mockAssets[ticker]
      if (!asset) return null

      // Add some randomness to simulate real-time data
      const price = randomVariation(asset.regularMarketPrice, 0.5)
      const change = price - asset.regularMarketPreviousClose
      const changePercent = (change / asset.regularMarketPreviousClose) * 100

      return {
        symbol: asset.ticker,
        shortName: asset.shortName,
        longName: asset.longName,
        currency: 'BRL',
        regularMarketPrice: price,
        regularMarketChange: Number(change.toFixed(2)),
        regularMarketChangePercent: Number(changePercent.toFixed(2)),
        regularMarketVolume: Math.floor(randomVariation(asset.regularMarketVolume, 10)),
        regularMarketDayHigh: randomVariation(asset.regularMarketDayHigh, 0.5),
        regularMarketDayLow: randomVariation(asset.regularMarketDayLow, 0.5),
        regularMarketOpen: asset.regularMarketOpen,
        regularMarketPreviousClose: asset.regularMarketPreviousClose,
        marketCap: asset.marketCap,
        regularMarketTime: new Date().toISOString(),
      }
    })
    .filter(Boolean)

  res.json(createBrapiResponse(results))
})

// GET /api/quote/:ticker/history - Get historical data
router.get('/quote/:ticker/history', (req, res) => {
  const ticker = req.params['ticker'].toUpperCase()
  const asset = mockAssets[ticker]

  if (!asset) {
    return res.status(404).json({
      error: 'Asset not found',
      message: `No data found for ticker: ${ticker}`,
    })
  }

  const range = (req.query['range'] as string) ?? '1mo'
  let days = 30

  switch (range) {
    case '1d':
      days = 1
      break
    case '5d':
      days = 5
      break
    case '1mo':
      days = 30
      break
    case '3mo':
      days = 90
      break
    case '6mo':
      days = 180
      break
    case '1y':
      days = 365
      break
    case '5y':
      days = 365 * 5
      break
    default:
      days = 30
  }

  const dates = generateHistoricalDates(days)
  let basePrice = asset.regularMarketPrice * (1 - (Math.random() * 0.2))

  const historicalData = dates.map((date) => {
    // Random walk simulation
    const changePercent = (Math.random() - 0.48) * 3
    basePrice = basePrice * (1 + changePercent / 100)

    const open = randomVariation(basePrice, 1)
    const close = randomVariation(basePrice, 1)
    const high = Math.max(open, close) * (1 + Math.random() * 0.02)
    const low = Math.min(open, close) * (1 - Math.random() * 0.02)
    const volume = Math.floor(randomVariation(asset.regularMarketVolume, 20))

    return {
      date: Math.floor(date.getTime() / 1000),
      open: Number(open.toFixed(2)),
      high: Number(high.toFixed(2)),
      low: Number(low.toFixed(2)),
      close: Number(close.toFixed(2)),
      volume,
      adjustedClose: Number(close.toFixed(2)),
    }
  })

  res.json(
    createBrapiResponse({
      symbol: ticker,
      shortName: asset.shortName,
      currency: 'BRL',
      historicalDataPrice: historicalData,
    })
  )
})

// GET /api/quote/:ticker/dividends - Get dividend history
router.get('/quote/:ticker/dividends', (req, res) => {
  const ticker = req.params['ticker'].toUpperCase()
  const asset = mockAssets[ticker]

  if (!asset) {
    return res.status(404).json({
      error: 'Asset not found',
      message: `No data found for ticker: ${ticker}`,
    })
  }

  // Generate mock dividend data
  const dividends = []
  const today = new Date()
  const baseDividend = asset.type === 'fii' ? asset.regularMarketPrice * 0.007 : asset.regularMarketPrice * 0.02

  for (let i = 0; i < 12; i++) {
    const paymentDate = new Date(today)
    paymentDate.setMonth(paymentDate.getMonth() - i)

    // FIIs pay monthly, stocks quarterly
    if (asset.type === 'fii' || i % 3 === 0) {
      const exDate = new Date(paymentDate)
      exDate.setDate(exDate.getDate() - 15)

      dividends.push({
        assetIssued: ticker,
        paymentDate: paymentDate.toISOString().split('T')[0],
        exDate: exDate.toISOString().split('T')[0],
        rate: Number(randomVariation(baseDividend, 15).toFixed(4)),
        type: asset.type === 'fii' ? 'RENDIMENTO' : Math.random() > 0.3 ? 'DIVIDENDO' : 'JCP',
        relatedTo: `${paymentDate.getMonth() + 1}/${paymentDate.getFullYear()}`,
      })
    }
  }

  res.json(
    createBrapiResponse({
      symbol: ticker,
      shortName: asset.shortName,
      dividends,
    })
  )
})

export { router as brapiRoutes }
