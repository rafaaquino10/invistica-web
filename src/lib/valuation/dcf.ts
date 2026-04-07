// ─── DCF Calculator (Fluxo de Caixa Descontado) ─────────────
// Valuation intrínseca via WACC real + Gordon Growth.
// Usa FCF real (CVM DFC ou brapi) quando disponível.

export interface DCFInput {
  ticker: string
  sector: string
  freeCashFlow: number        // FCF real ou estimado (R$)
  fcfGrowthRate: number       // Crescimento FCF projetado (%)
  selicRate: number           // SELIC atual (%)
  riskPremium: number         // Prêmio de risco equity (%)
  beta: number                // Beta da ação
  sharesOutstanding?: number  // Ações em circulação
  netDebt?: number            // Dívida líquida (R$)
  totalDebt?: number          // Dívida bruta (R$) — para cálculo de WACC real
  marketCap?: number          // Market Cap (R$) — para estrutura de capital
  debtCost?: number           // Custo da dívida pré-tax (%) — se disponível
  projectionYears?: number    // Default 10
  terminalGrowthRate?: number // Crescimento perpétuo (%) — max 4%
  marginOfSafety?: number     // Margem de segurança (%) — default 25%
}

export interface DCFResult {
  intrinsicValue: number
  currentPrice: number
  upside: number
  marginOfSafety: number
  buyPrice: number
  isBelowFairValue: boolean
  wacc: number
  ke: number                   // Custo do equity (CAPM)
  projectedCashFlows: { year: number; fcf: number; discounted: number }[]
  terminalValue: number
  terminalPctOfEV: number      // % do EV que vem do terminal value
  enterpriseValue: number
  equityValue: number
  confidence: 'alta' | 'media' | 'baixa'
  fcfSource: 'cvm' | 'brapi' | 'estimado'
}

const TAX_RATE = 0.34

/**
 * Calcula WACC real ponderando custo de equity e dívida.
 * WACC = Ke × (E/V) + Kd × (1-t) × (D/V)
 *
 * Se dados de dívida indisponíveis, usa Ke como proxy (conservador).
 */
function calculateWACC(input: {
  selicRate: number
  beta: number
  riskPremium: number
  marketCap?: number
  totalDebt?: number
  debtCost?: number
}): { wacc: number; ke: number } {
  // Custo do equity via CAPM
  const ke = (input.selicRate + input.beta * input.riskPremium) / 100

  // Se não temos dados de estrutura de capital, usar Ke como proxy
  const mc = input.marketCap
  const debt = input.totalDebt
  if (!mc || mc <= 0 || !debt || debt <= 0) {
    return { wacc: ke, ke }
  }

  // Estrutura de capital
  const totalValue = mc + debt
  const equityWeight = mc / totalValue   // E/V
  const debtWeight = debt / totalValue   // D/V

  // Custo da dívida
  // Prioridade: debtCost real > estimativa via SELIC + spread
  let kd: number
  if (input.debtCost != null && input.debtCost > 0) {
    kd = input.debtCost / 100
  } else {
    // Proxy: SELIC + 2.5% spread (CDI + spread médio corporate BR)
    kd = (input.selicRate + 2.5) / 100
  }

  // WACC = Ke × (E/V) + Kd × (1-t) × (D/V)
  const wacc = ke * equityWeight + kd * (1 - TAX_RATE) * debtWeight

  return { wacc, ke }
}

/**
 * Calcula valuation DCF com WACC ponderado real.
 * Terminal growth cap 4%. Inclui sanidade do terminal value.
 */
export function calculateDCF(input: DCFInput & { fcfSource?: 'cvm' | 'brapi' | 'estimado' }): DCFResult {
  const { wacc, ke } = calculateWACC({
    selicRate: input.selicRate,
    beta: input.beta,
    riskPremium: input.riskPremium,
    marketCap: input.marketCap,
    totalDebt: input.totalDebt,
    debtCost: input.debtCost,
  })

  const years = input.projectionYears ?? 10
  const termGrowth = Math.min((input.terminalGrowthRate ?? 3) / 100, 0.04)
  const margin = (input.marginOfSafety ?? 25) / 100

  // Projetar FCFs com decaimento de crescimento (fade to terminal)
  // Ano 1-5: growth rate integral. Ano 6-10: decay linear para terminal growth.
  const cashFlows: DCFResult['projectedCashFlows'] = []
  let fcf = input.freeCashFlow
  const baseGrowth = input.fcfGrowthRate / 100

  for (let y = 1; y <= years; y++) {
    let yearGrowth: number
    if (y <= 5) {
      yearGrowth = baseGrowth
    } else {
      // Decay linear de ano 6 a 10: fade do baseGrowth para termGrowth
      const fadeRatio = (y - 5) / (years - 5)
      yearGrowth = baseGrowth * (1 - fadeRatio) + termGrowth * fadeRatio
    }
    fcf *= (1 + yearGrowth)
    const discounted = fcf / Math.pow(1 + wacc, y)
    cashFlows.push({ year: y, fcf: Math.round(fcf), discounted: Math.round(discounted) })
  }

  // Terminal Value (Gordon Growth)
  const terminalFCF = fcf * (1 + termGrowth)
  const terminalValue = wacc > termGrowth ? terminalFCF / (wacc - termGrowth) : 0
  const discountedTerminal = terminalValue / Math.pow(1 + wacc, years)

  // Enterprise Value
  const sumDiscountedFCF = cashFlows.reduce((s, cf) => s + cf.discounted, 0)
  const enterpriseValue = sumDiscountedFCF + discountedTerminal

  // Sanidade: terminal value não deve exceder 85% do EV
  const terminalPctOfEV = enterpriseValue > 0 ? (discountedTerminal / enterpriseValue) * 100 : 0

  // Equity Value (EV - Dívida Líquida)
  const netDebt = input.netDebt ?? 0
  const equityValue = Math.max(0, enterpriseValue - netDebt)

  // Valor intrínseco por ação
  const shares = input.sharesOutstanding ?? 1
  const intrinsicValue = shares > 0 ? equityValue / shares : equityValue
  const buyPrice = intrinsicValue * (1 - margin)

  // Confidence baseada na fonte do FCF e qualidade dos inputs
  const fcfSource = input.fcfSource ?? 'estimado'
  let confidence: DCFResult['confidence'] = 'media'
  if (fcfSource === 'cvm' && input.freeCashFlow > 0 && input.beta > 0 && input.beta < 3 && input.totalDebt != null) {
    confidence = 'alta'
  } else if (fcfSource === 'brapi' && input.freeCashFlow > 0) {
    confidence = 'media'
  } else if (input.freeCashFlow <= 0) {
    confidence = 'baixa'
  }

  // Rebaixar se terminal value domina demais (>85% do EV)
  if (terminalPctOfEV > 85 && confidence === 'alta') {
    confidence = 'media'
  }

  return {
    intrinsicValue: Math.round(intrinsicValue * 100) / 100,
    currentPrice: 0,
    upside: 0,
    marginOfSafety: margin * 100,
    buyPrice: Math.round(buyPrice * 100) / 100,
    isBelowFairValue: false,
    wacc: Math.round(wacc * 10000) / 100,
    ke: Math.round(ke * 10000) / 100,
    projectedCashFlows: cashFlows,
    terminalValue: Math.round(discountedTerminal),
    terminalPctOfEV: Math.round(terminalPctOfEV * 10) / 10,
    enterpriseValue: Math.round(enterpriseValue),
    equityValue: Math.round(equityValue),
    confidence,
    fcfSource,
  }
}

/**
 * Obtém FCF para cálculo DCF.
 * Prioridade:
 *   1. FCF real da CVM (DFC — Demonstração de Fluxo de Caixa)
 *   2. FCF da brapi (freeCashflow do financialData)
 *   3. Estimativa: Lucro Líquido × taxa de conversão setorial
 */
export function estimateFCF(asset: {
  marketCap: number | null
  price: number
  fundamentals: {
    peRatio: number | null
    margemLiquida: number | null
    margemEbit: number | null
    freeCashflow?: number | null
    netDebt?: number | null
    ebitda?: number | null
  }
}): { fcf: number; source: 'cvm' | 'brapi' | 'estimado' } {
  // 1. FCF real disponível (CVM priorizado no data-merger, depois brapi)
  const realFCF = asset.fundamentals.freeCashflow
  if (realFCF != null && realFCF !== 0) {
    // data-merger já prioriza fcfFromCvm > freeCashflow
    return { fcf: realFCF, source: 'cvm' }
  }

  // 2. Fallback: estimar a partir do lucro líquido
  const mc = asset.marketCap
  const pe = asset.fundamentals.peRatio
  if (!mc || !pe || pe <= 0) return { fcf: 0, source: 'estimado' }

  const netIncome = mc / pe

  // Taxa de conversão NI→FCF baseada na intensidade de capital (proxy: margem EBIT)
  // Asset-light (margens altas): CapEx baixo → FCF ≈ 85% do lucro
  // Capital-intensive (margens baixas): CapEx alto → FCF ≈ 55% do lucro
  const margemEbit = asset.fundamentals.margemEbit
  let conversionRate = 0.70
  if (margemEbit != null && margemEbit > 0) {
    if (margemEbit > 20) conversionRate = 0.85
    else if (margemEbit > 10) conversionRate = 0.70
    else conversionRate = 0.55
  }

  return { fcf: netIncome * conversionRate, source: 'estimado' }
}
