/**
 * Demo data — user data only (portfolios, alerts, goals, insights).
 * Market data (stocks, quotes, scores) is ALWAYS real from gateway (CVM, brapi, Kalshi).
 * No mock market data allowed.
 */

export const DEMO_PORTFOLIOS = [
  {
    id: 'demo-portfolio-1',
    name: 'Minha Carteira',
    description: 'Carteira principal — diversificada entre setores',
    isDefault: true,
    positions: [
      { ticker: 'PETR4', quantity: 100, avgCost: 32.50, currentPrice: 37 },
      { ticker: 'VALE3', quantity: 50, avgCost: 72.30, currentPrice: 86.45 },
      { ticker: 'ITUB4', quantity: 200, avgCost: 38.90, currentPrice: 45.52 },
      { ticker: 'WEGE3', quantity: 133, avgCost: 48.15, currentPrice: 52.21 },
      { ticker: 'BBAS3', quantity: 150, avgCost: 22.80, currentPrice: 24.44 },
      { ticker: 'ABEV3', quantity: 300, avgCost: 14.20, currentPrice: 15.48 },
      { ticker: 'SUZB3', quantity: 106, avgCost: 44.60, currentPrice: 50.43 },
      { ticker: 'RENT3', quantity: 98, avgCost: 53.75, currentPrice: 50.07 },
      { ticker: 'BBSE3', quantity: 86, avgCost: 33.40, currentPrice: 37.21 },
      { ticker: 'EQTL3', quantity: 109, avgCost: 38.90, currentPrice: 40.43 },
    ],
  },
]

export const DEMO_ALERTS = [
  { id: '1', ticker: 'PETR4', type: 'price_below', message: 'PETR4 atingiu seu alerta de preço em R$ 38,00', time: '2h atrás', read: false },
  { id: '2', ticker: 'VALE3', type: 'score_change', message: 'Invscore de VALE3 subiu para 75 pontos', time: '5h atrás', read: false },
  { id: '3', ticker: 'ITUB4', type: 'dividend', message: 'ITUB4 anunciou dividendo de R$ 0,28/ação', time: '1 dia atrás', read: true },
  { id: '4', ticker: 'BBAS3', type: 'dividend', message: 'BBAS3 anunciou JCP de R$ 0,55/ação', time: '2 dias atrás', read: true },
  { id: '5', ticker: 'WEGE3', type: 'score_change', message: 'Invscore de WEGE3 atingiu 88 - Excepcional', time: '3 dias atrás', read: true },
]

export const DEMO_INSIGHTS = [
  { title: 'PETR4 está descontada?', description: 'P/L atual de 6.2 está 35% abaixo da média histórica do setor.', type: 'valuation' },
  { title: 'WEGE3 crescimento consistente', description: 'ROE acima de 20% por 10 trimestres consecutivos. Empresa de referência em qualidade.', type: 'quality' },
  { title: 'Concentração em Financeiro', description: 'Sua carteira tem 38% no setor financeiro. Considere diversificar para reduzir risco setorial.', type: 'risk' },
  { title: 'Oportunidade em utilities', description: 'Setor de utilidade pública oferece DY médio de 8.5% com baixa volatilidade.', type: 'opportunity' },
  { title: 'BBAS3 múltiplos atrativos', description: 'P/VP de 0.8 com ROE de 12.1%. Indicadores sugerem desconto.', type: 'valuation' },
]

export const DEMO_GOALS = {
  main: {
    name: 'R$ 500 mil até 2029',
    targetAmount: 500000,
    currentAmount: 125000,
    progress: 25.0,
    yearsRemaining: 3,
    monthlyContribution: 3000,
    expectedReturn: 0.12,
  },
  passiveIncome: {
    targetMonthly: 3000,
    currentMonthly: 680,
    progress: 22.7,
  },
  fire: {
    targetYear: 2040,
    targetAmount: 2000000,
    progress: 6.3,
  },
}

export const isDemoMode = () => !process.env['DATABASE_URL'] || process.env['ALLOW_DEMO'] === 'true'

// ─── Demo Performance (dashboard chart fallback) ────────────

export function generateDemoPerformance(): Array<{ date: string; portfolio: number; ibov: number; cdi: number }> {
  const points: Array<{ date: string; portfolio: number; ibov: number; cdi: number }> = []
  const now = new Date()
  let portfolio = 100, ibov = 100, cdi = 100
  for (let i = 365; i >= 0; i -= 3) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    portfolio += (Math.random() - 0.45) * 1.5
    ibov += (Math.random() - 0.48) * 1.8
    cdi += 0.04
    points.push({
      date: d.toISOString().split('T')[0]!,
      portfolio: Math.max(80, portfolio),
      ibov: Math.max(75, ibov),
      cdi,
    })
  }
  return points
}

export function generateDemoIntraday(): Array<{ time: string; portfolio: number; ibov: number }> {
  const points: Array<{ time: string; portfolio: number; ibov: number }> = []
  const today = new Date().toISOString().split('T')[0]
  let port = 0, ibov = 0
  for (let h = 10; h <= 17; h++) {
    for (let m = 0; m < 60; m += 5) {
      if (h === 17 && m > 0) break
      port += (Math.random() - 0.48) * 0.15
      ibov += (Math.random() - 0.5) * 0.18
      points.push({
        time: `${today}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`,
        portfolio: Math.round(port * 100) / 100,
        ibov: Math.round(ibov * 100) / 100,
      })
    }
  }
  return points
}

// ─── Sample portfolio for quick-start ───────────────────────

export const SAMPLE_PORTFOLIO_POSITIONS = [
  { ticker: 'PRIO3', quantity: 50, price: 42.50 },
  { ticker: 'WEGE3', quantity: 30, price: 35.80 },
  { ticker: 'EQTL3', quantity: 40, price: 31.20 },
  { ticker: 'ITSA4', quantity: 100, price: 10.50 },
  { ticker: 'GMAT3', quantity: 80, price: 7.90 },
]
