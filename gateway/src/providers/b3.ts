import { Router } from 'express'
import { mockAssets } from '../data/assets.js'

const router = Router()

// Middleware to check authorization
const authMiddleware = (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authorization header with Bearer token is required',
    })
  }

  // Mock token validation - in real implementation, validate JWT
  const token = authHeader.split(' ')[1]
  if (token.length < 10) {
    return res.status(401).json({
      error: 'Invalid token',
      message: 'The provided token is invalid',
    })
  }

  next()
}

// GET /api/b3/position - Get portfolio position
router.get('/position', authMiddleware, (_req, res) => {
  const positions = [
    { ticker: 'PETR4', quantity: 100, avgCost: 35.50, currentPrice: 38.45 },
    { ticker: 'VALE3', quantity: 50, avgCost: 62.00, currentPrice: 58.20 },
    { ticker: 'ITUB4', quantity: 200, avgCost: 32.00, currentPrice: 34.80 },
    { ticker: 'WEGE3', quantity: 30, avgCost: 48.00, currentPrice: 52.30 },
    { ticker: 'HGLG11', quantity: 10, avgCost: 155.00, currentPrice: 158.50 },
  ].map((pos) => {
    const asset = mockAssets[pos.ticker]
    const currentValue = pos.quantity * pos.currentPrice
    const totalCost = pos.quantity * pos.avgCost
    const gain = currentValue - totalCost
    const gainPercent = (gain / totalCost) * 100

    return {
      ticker: pos.ticker,
      nome: asset?.shortName ?? pos.ticker,
      tipo: asset?.type ?? 'stock',
      quantidade: pos.quantity,
      precoMedio: pos.avgCost,
      precoAtual: pos.currentPrice,
      valorAtual: Number(currentValue.toFixed(2)),
      custoTotal: Number(totalCost.toFixed(2)),
      ganho: Number(gain.toFixed(2)),
      ganhoPercent: Number(gainPercent.toFixed(2)),
    }
  })

  const totalValue = positions.reduce((sum, p) => sum + p.valorAtual, 0)
  const totalCost = positions.reduce((sum, p) => sum + p.custoTotal, 0)
  const totalGain = totalValue - totalCost
  const totalGainPercent = (totalGain / totalCost) * 100

  res.json({
    data: {
      posicoes: positions,
      resumo: {
        valorTotal: Number(totalValue.toFixed(2)),
        custoTotal: Number(totalCost.toFixed(2)),
        ganhoTotal: Number(totalGain.toFixed(2)),
        ganhoTotalPercent: Number(totalGainPercent.toFixed(2)),
        quantidadeAtivos: positions.length,
      },
    },
    atualizadoEm: new Date().toISOString(),
  })
})

// GET /api/b3/transactions - Get transaction history
router.get('/transactions', authMiddleware, (req, res) => {
  const page = parseInt(req.query['page'] as string) || 1
  const pageSize = parseInt(req.query['pageSize'] as string) || 20

  const generateTransaction = (index: number) => {
    const tickers = ['PETR4', 'VALE3', 'ITUB4', 'WEGE3', 'HGLG11', 'BBAS3', 'ITSA4']
    const ticker = tickers[index % tickers.length]!
    const asset = mockAssets[ticker]
    const type = Math.random() > 0.3 ? 'COMPRA' : 'VENDA'
    const quantity = Math.floor(Math.random() * 100) + 1
    const price = (asset?.regularMarketPrice ?? 30) * (0.9 + Math.random() * 0.2)
    const total = quantity * price
    const fees = total * 0.0003

    const date = new Date()
    date.setDate(date.getDate() - index * 3)

    return {
      id: `TXN${String(index + 1).padStart(6, '0')}`,
      data: date.toISOString().split('T')[0],
      ticker,
      nome: asset?.shortName ?? ticker,
      tipo: type,
      quantidade: quantity,
      preco: Number(price.toFixed(2)),
      valorTotal: Number(total.toFixed(2)),
      taxas: Number(fees.toFixed(2)),
      corretora: 'AQ Corretora',
    }
  }

  const transactions = Array.from({ length: 100 }, (_, i) => generateTransaction(i))

  const total = transactions.length
  const totalPages = Math.ceil(total / pageSize)
  const startIndex = (page - 1) * pageSize
  const data = transactions.slice(startIndex, startIndex + pageSize)

  res.json({
    data,
    pagination: {
      page,
      pageSize,
      total,
      totalPages,
    },
  })
})

export { router as b3Routes }
