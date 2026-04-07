import { Router } from 'express'
import { mockAssets } from '../data/assets.js'

const router = Router()

// Company data derived from assets
const companies = Object.values(mockAssets)
  .filter((a) => a.type === 'stock')
  .map((asset) => ({
    cnpj: Math.random().toString().slice(2, 16),
    razaoSocial: asset.longName,
    nomeComercial: asset.shortName,
    ticker: asset.ticker,
    setor: asset.sector,
    situacao: 'ATIVO',
    dataRegistro: '2000-01-01',
    segmentoMercado: 'Novo Mercado',
  }))

// GET /api/cvm/companies - List all companies
router.get('/companies', (req, res) => {
  const page = parseInt(req.query['page'] as string) || 1
  const pageSize = parseInt(req.query['pageSize'] as string) || 20
  const search = (req.query['search'] as string)?.toUpperCase()

  let filtered = companies
  if (search) {
    filtered = companies.filter(
      (c) =>
        c.ticker.includes(search) ||
        c.razaoSocial.toUpperCase().includes(search) ||
        c.nomeComercial.toUpperCase().includes(search)
    )
  }

  const total = filtered.length
  const totalPages = Math.ceil(total / pageSize)
  const startIndex = (page - 1) * pageSize
  const data = filtered.slice(startIndex, startIndex + pageSize)

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

// GET /api/cvm/financials/:cnpj - Get company financials
router.get('/financials/:cnpj', (req, res) => {
  const { cnpj } = req.params
  const company = companies.find((c) => c.cnpj === cnpj)

  if (!company) {
    return res.status(404).json({
      error: 'Company not found',
      message: `No company found with CNPJ: ${cnpj}`,
    })
  }

  // Generate mock financial data
  const generateFinancials = (year: number, quarter?: number) => {
    const multiplier = 1 + (Math.random() - 0.5) * 0.2
    const baseRevenue = 10000000000 * multiplier
    const baseNetIncome = baseRevenue * (0.1 + Math.random() * 0.15)

    return {
      periodo: quarter ? `${year}T${quarter}` : `${year}`,
      dataReferencia: quarter
        ? `${year}-${String(quarter * 3).padStart(2, '0')}-30`
        : `${year}-12-31`,
      balancoPatrimonial: {
        ativoTotal: baseRevenue * 3,
        ativoCirculante: baseRevenue * 0.8,
        ativoNaoCirculante: baseRevenue * 2.2,
        passivoTotal: baseRevenue * 1.8,
        passivoCirculante: baseRevenue * 0.5,
        passivoNaoCirculante: baseRevenue * 1.3,
        patrimonioLiquido: baseRevenue * 1.2,
      },
      demonstracaoResultado: {
        receitaLiquida: baseRevenue,
        custoMercadoriasVendidas: baseRevenue * 0.6,
        lucroBruto: baseRevenue * 0.4,
        despesasOperacionais: baseRevenue * 0.15,
        ebitda: baseRevenue * 0.25,
        resultadoFinanceiro: -baseRevenue * 0.02,
        lucroAntesIR: baseNetIncome * 1.3,
        lucroLiquido: baseNetIncome,
      },
      fluxoCaixa: {
        caixaOperacional: baseNetIncome * 1.5,
        caixaInvestimento: -baseNetIncome * 0.8,
        caixaFinanciamento: -baseNetIncome * 0.4,
        variacaoCaixa: baseNetIncome * 0.3,
      },
    }
  }

  const currentYear = new Date().getFullYear()
  const financials = []

  // Annual data for last 5 years
  for (let i = 0; i < 5; i++) {
    financials.push(generateFinancials(currentYear - i))
  }

  // Quarterly data for last 8 quarters
  for (let y = 0; y < 2; y++) {
    for (let q = 4; q >= 1; q--) {
      financials.push(generateFinancials(currentYear - y, q))
    }
  }

  res.json({
    empresa: company,
    demonstracoesFinanceiras: financials,
    atualizadoEm: new Date().toISOString(),
  })
})

export { router as cvmRoutes }
