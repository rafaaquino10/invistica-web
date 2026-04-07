import { Router } from 'express'

const router = Router()

// GET /api/indicators - Macro indicators
router.get('/indicators', (_req, res) => {
  const today = new Date()

  res.json({
    data: {
      selic: {
        valor: 12.25,
        data: today.toISOString().split('T')[0],
        variacao: 0.00,
      },
      ipca: {
        valor: 4.83,
        acumulado12m: 4.83,
        data: '2026-01-01',
      },
      cdi: {
        valor: 12.15,
        acumulado12m: 12.65,
        data: today.toISOString().split('T')[0],
      },
      ibovespa: {
        valor: 128450,
        variacao: 0.85,
        variacaoPercent: 0.67,
        data: today.toISOString().split('T')[0],
      },
      ifix: {
        valor: 3245,
        variacao: 12.5,
        variacaoPercent: 0.39,
        data: today.toISOString().split('T')[0],
      },
      dolar: {
        compra: 5.12,
        venda: 5.13,
        data: today.toISOString().split('T')[0],
      },
      euro: {
        compra: 5.58,
        venda: 5.59,
        data: today.toISOString().split('T')[0],
      },
      bitcoin: {
        valor: 520000,
        variacaoPercent: 2.35,
        data: today.toISOString().split('T')[0],
      },
    },
    atualizadoEm: today.toISOString(),
  })
})

// GET /api/funds - Investment funds data
router.get('/funds', (req, res) => {
  const page = parseInt(req.query['page'] as string) || 1
  const pageSize = parseInt(req.query['pageSize'] as string) || 20
  const type = req.query['type'] as string

  const fundTypes = ['RF', 'MM', 'FIA', 'FIM', 'FIDC']

  const generateFund = (index: number) => {
    const fundType = fundTypes[index % fundTypes.length]
    return {
      cnpj: Math.random().toString().slice(2, 16),
      nome: `Fundo ${fundType} ${index + 1}`,
      tipo: fundType,
      gestor: `Gestora ${Math.floor(index / 5) + 1}`,
      patrimonioLiquido: Math.floor(Math.random() * 1000000000),
      cotistas: Math.floor(Math.random() * 10000),
      rentabilidade: {
        mes: (Math.random() - 0.3) * 5,
        ano: (Math.random() - 0.2) * 20,
        '12m': (Math.random() - 0.1) * 25,
        '24m': (Math.random()) * 40,
      },
      taxaAdministracao: Math.random() * 2,
      taxaPerformance: Math.random() > 0.5 ? 20 : 0,
      aplicacaoMinima: [1000, 5000, 10000, 50000, 100000][Math.floor(Math.random() * 5)],
    }
  }

  let funds = Array.from({ length: 100 }, (_, i) => generateFund(i))

  if (type) {
    funds = funds.filter((f) => f.tipo === type.toUpperCase())
  }

  const total = funds.length
  const totalPages = Math.ceil(total / pageSize)
  const startIndex = (page - 1) * pageSize
  const data = funds.slice(startIndex, startIndex + pageSize)

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

export { router as dadosDeMercadoRoutes }
