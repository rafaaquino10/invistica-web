// ─── Qualitative Analysis Engine v2 ───────────────────────────────
// Motor qualitativo "quantamental" — combina métricas derivadas de DFP/ITR
// com dimensões de gestão, governança e risco regulatório.
//
// 5 Blocos:
//   1. Moat Score (30%) — vantagem competitiva durável
//   2. Earnings Quality (20%) — qualidade real dos lucros (FCO real + accruals)
//   3. Management & Governance (20%) — capital allocation + previsibilidade
//   4. Debt Sustainability (15%) — perfil de dívida (substitui Altman Z-Score)
//   5. Regulatory & Catalyst Risk (15%) — risco regulatório setorial
//
// Usa FCO real (6.01) e CapEx real (6.02.01+6.02.02) quando disponíveis.
// Fallback para proxies quando DFC incompleto.

import { cache } from '../cache/index.js'
import { logger } from '../logger.js'
import type { CvmCompanyData, CvmStatementData, MarketQuote } from './cvm-financials-client.js'
import { getLiveSignals, type LiveSignals } from './live-signals-client.js'

// ─── Types ──────────────────────────────────────────────────────

export interface QualitativeMetrics {
  ticker: string

  // Bloco 1: Moat Score (0-100)
  moatScore: number | null
  moatClassification: 'wide' | 'narrow' | 'none' | null
  roicPersistence: number | null     // Anos consecutivos ROIC > 10%
  marginStability: number | null     // 0-100
  pricingPower: number | null        // Cresc. receita real acima IPCA (%)
  reinvestmentRate: number | null    // CapEx / Depreciação (real quando disponível)
  assetTurnoverTrend: number | null  // Slope tendência Receita/Ativo

  // Bloco 2: Earnings Quality (0-100)
  earningsQuality: number | null     // Score composto
  accrualsRatio: number | null       // |Accruals| / Ativo Total
  fcfToNetIncome: number | null      // FCF / Lucro Líquido
  earningsManipulationFlag: boolean  // true se accruals > 0.30 E FCF/Lucro < 0.6
  usedRealFCO: boolean              // true se usou conta 6.01, false se proxy

  // Bloco 3: Management & Governance (0-100)
  managementScore: number | null
  capitalAllocationScore: number | null   // ROE adj × ROIC track record
  shareholderFriendliness: number | null  // Payout sustentável
  earningsPredictability: number | null   // 100 - CV lucro × 50

  // Bloco 4: Debt Sustainability (0-100) — substitui Altman Z-Score
  debtSustainabilityScore: number | null
  interestCoverage: number | null    // EBIT / Desp. Financeiras
  netDebtEbitdaRatio: number | null  // Dívida Líquida / EBITDA
  shortTermDebtRatio: number | null  // Dívida CP / Dívida Total

  // Bloco 5: Regulatory & Catalyst Risk (0-100)
  regulatoryRiskScore: number | null
  sectorExposure: number | null      // 0-100 (maior = mais regulado)
  earningsVolatility: number | null  // CV do lucro 5 anos

  // FCF real (para uso em outros cálculos)
  fcf: number | null                 // FCF em BRL
  fcfYield: number | null            // FCF / Market Cap (%)
  fcfGrowthRate: number | null       // CAGR do FCF 5 anos (%)
  debtCostEstimate: number | null    // Custo estimado da dívida (%)

  // Bloco 3+: Live Signals (expandido com dados vivos)
  governanceScore: number | null         // 0-100 (novo bloco)
  listingSegment: string | null
  listingSegmentScore: number | null
  freeFloatScore: number | null
  cvmSanctionsScore: number | null
  ceoTenureScore: number | null
  buybackSignal: number | null
  newsSentimentScore: number | null
  catalystAlertScore: number | null
  riEventVolume: number | null
}

// ─── Helpers ────────────────────────────────────────────────────

const TAX_RATE = 0.34
const S = 1000  // CVM R$ mil → BRL

function round2(v: number | null): number | null {
  if (v == null || !isFinite(v)) return null
  return Math.round(v * 100) / 100
}

function getYearsSorted(company: CvmCompanyData): string[] {
  return Object.keys(company.statements).sort().reverse()
}

function getStmt(company: CvmCompanyData, year: string): CvmStatementData | null {
  return company.statements[year] ?? null
}

/** Obtém FCO real (6.01) ou proxy (EBIT×0.66+Dep) */
function getFCO(stmt: CvmStatementData): { value: number; isReal: boolean } | null {
  // Preferir FCO real do DFC (conta 6.01)
  if (stmt.fco != null) {
    return { value: stmt.fco, isReal: true }
  }
  // Fallback: proxy NOPAT + Depreciação
  if (stmt.ebit == null) return null
  const dep = stmt.depreciation != null ? Math.abs(stmt.depreciation) : 0
  return { value: stmt.ebit * (1 - TAX_RATE) + dep, isReal: false }
}

/** Obtém CapEx real (|6.02.01|+|6.02.02|) ou proxy (Dep×1.1) */
function getCapex(stmt: CvmStatementData): { value: number; isReal: boolean } {
  const imob = stmt.capexImobilizado != null ? Math.abs(stmt.capexImobilizado) : 0
  const intang = stmt.capexIntangivel != null ? Math.abs(stmt.capexIntangivel) : 0
  if (imob > 0 || intang > 0) {
    return { value: imob + intang, isReal: true }
  }
  // Fallback
  const dep = stmt.depreciation != null ? Math.abs(stmt.depreciation) : 0
  return { value: dep * 1.1, isReal: false }
}

/** Obtém IPCA 12m real do cache BCB ou fallback */
function getIPCA12m(): number {
  interface BcbIndicators { ipca12m?: { valor: number } }
  const bcb = cache.getStale<BcbIndicators>('bcb:indicators')
  if (bcb?.ipca12m?.valor && bcb.ipca12m.valor > 0) {
    return bcb.ipca12m.valor
  }
  return 5.0 // Fallback
}

// Mapeamento estático de exposição regulatória por setor
const SECTOR_REGULATORY_EXPOSURE: Record<string, number> = {
  utilities_energia: 80,
  saneamento: 75,
  telecom: 60,
  saude: 55,
  petroleo_gas: 50,
  mineracao: 45,
  bancos_financeiro: 40,
  seguradoras: 40,
  agro: 30,
  transporte_logistica: 30,
  construcao_civil: 25,
  educacao: 25,
  papel_celulose: 20,
  siderurgia: 20,
  industrial: 20,
  varejo_consumo: 15,
  tecnologia: 10,
  outros: 20,
}

// ─── Bloco 1: Moat Score (30%) ─────────────────────────────────

function calcMoatScore(
  company: CvmCompanyData,
  years: string[],
): {
  moatScore: number | null
  moatClassification: 'wide' | 'narrow' | 'none' | null
  roicPersistence: number | null
  marginStability: number | null
  pricingPower: number | null
  reinvestmentRate: number | null
  assetTurnoverTrend: number | null
} {
  const noResult = {
    moatScore: null, moatClassification: null,
    roicPersistence: null, marginStability: null,
    pricingPower: null, reinvestmentRate: null, assetTurnoverTrend: null,
  }
  if (years.length < 1) return noResult

  const ipca = getIPCA12m()

  // 1. ROIC Persistence (40%)
  let roicPersistence = 0
  for (const year of years.slice(0, 6)) {
    const stmt = getStmt(company, year)
    if (!stmt || stmt.ebit == null || stmt.patrimonioLiquido == null) break
    const netDebt = ((stmt.emprestimosCp ?? 0) + (stmt.emprestimosLp ?? 0)) - (stmt.caixaEquivalentes ?? 0)
    const investedCapital = stmt.patrimonioLiquido + netDebt
    if (investedCapital <= 0) break
    const nopat = stmt.ebit * (1 - TAX_RATE)
    const roic = (nopat / investedCapital) * 100
    if (roic >= 10) roicPersistence++
    else break
  }

  // 2. Margin Stability (30%) — multiplicador ×8 (mais tolerante para commodities)
  const margins: number[] = []
  for (const year of years.slice(0, 5)) {
    const stmt = getStmt(company, year)
    if (!stmt || stmt.ebit == null || stmt.receitaLiquida == null || stmt.receitaLiquida === 0) continue
    margins.push((stmt.ebit / stmt.receitaLiquida) * 100)
  }
  let marginStability: number | null = null
  if (margins.length >= 3) {
    const mean = margins.reduce((s, v) => s + v, 0) / margins.length
    const variance = margins.reduce((s, v) => s + (v - mean) ** 2, 0) / margins.length
    const stdDev = Math.sqrt(variance)
    marginStability = Math.max(0, Math.min(100, Math.round(100 - stdDev * 8)))
  } else if (margins.length >= 1) {
    // Menos de 3 anos: fallback neutro
    marginStability = 50
  }

  // 3. Pricing Power (30%) — IPCA real do BCB
  let pricingPower: number | null = null
  {
    const revenues: number[] = []
    for (const year of years.slice(0, 5)) {
      const stmt = getStmt(company, year)
      if (!stmt || stmt.receitaLiquida == null || stmt.receitaLiquida <= 0) continue
      revenues.push(stmt.receitaLiquida)
    }
    if (revenues.length >= 3) {
      const newest = revenues[0]!
      const oldest = revenues[revenues.length - 1]!
      const n = revenues.length - 1
      const nominalGrowth = (Math.pow(newest / oldest, 1 / n) - 1) * 100
      pricingPower = round2(nominalGrowth - ipca)
    }
    // Menos de 3 anos: pricingPower fica null, ppScore usará fallback 50
  }

  // 4. Reinvestment Rate — CapEx REAL quando disponível
  let reinvestmentRate: number | null = null
  const latestStmt = getStmt(company, years[0]!)
  if (latestStmt) {
    const capex = getCapex(latestStmt)
    const dep = latestStmt.depreciation != null ? Math.abs(latestStmt.depreciation) : 0
    if (dep > 0) {
      reinvestmentRate = round2(capex.value / dep)
    }
  }

  // 5. Asset Turnover Trend
  let assetTurnoverTrend: number | null = null
  const turnovers: number[] = []
  for (const year of years.slice(0, 5)) {
    const stmt = getStmt(company, year)
    if (!stmt || stmt.receitaLiquida == null || stmt.ativoTotal == null || stmt.ativoTotal === 0) continue
    turnovers.push(stmt.receitaLiquida / stmt.ativoTotal)
  }
  if (turnovers.length >= 3) {
    const v = [...turnovers].reverse()
    const n = v.length
    const xMean = (n - 1) / 2
    const yMean = v.reduce((s, y) => s + y, 0) / n
    let num = 0, den = 0
    for (let i = 0; i < n; i++) {
      num += (i - xMean) * (v[i]! - yMean)
      den += (i - xMean) * (i - xMean)
    }
    assetTurnoverTrend = den > 0 ? round2(num / den) : null
  }

  // Composite
  const roicScore = Math.min(100, roicPersistence * 20)
  const marginScore = marginStability ?? 50

  let ppScore = 50
  if (pricingPower != null) {
    if (pricingPower <= -5) ppScore = 0
    else if (pricingPower <= 0) ppScore = 25
    else if (pricingPower <= 5) ppScore = 50 + pricingPower * 10
    else ppScore = 100
  }

  const moatScore = Math.round(
    roicScore * 0.40 +
    marginScore * 0.30 +
    ppScore * 0.30
  )

  let moatClassification: 'wide' | 'narrow' | 'none'
  if (moatScore >= 70) moatClassification = 'wide'
  else if (moatScore >= 40) moatClassification = 'narrow'
  else moatClassification = 'none'

  return { moatScore, moatClassification, roicPersistence, marginStability, pricingPower, reinvestmentRate, assetTurnoverTrend }
}

// ─── Bloco 2: Earnings Quality (20%) ────────────────────────────

function calcEarningsQuality(
  company: CvmCompanyData,
  years: string[],
  market: MarketQuote,
): {
  earningsQuality: number | null
  accrualsRatio: number | null
  fcfToNetIncome: number | null
  earningsManipulationFlag: boolean
  usedRealFCO: boolean
  fcf: number | null
  fcfYield: number | null
  fcfGrowthRate: number | null
} {
  const noResult = {
    earningsQuality: null, accrualsRatio: null, fcfToNetIncome: null,
    earningsManipulationFlag: false, usedRealFCO: false,
    fcf: null, fcfYield: null, fcfGrowthRate: null,
  }
  if (years.length < 1) return noResult

  const latest = getStmt(company, years[0]!)
  if (!latest || latest.lucroLiquido == null || latest.ativoTotal == null || latest.ativoTotal === 0) return noResult

  const fcoResult = getFCO(latest)
  if (!fcoResult) return noResult

  const fco = fcoResult.value
  const capex = getCapex(latest)

  // Accruals = Lucro Líquido - FCO
  const accruals = latest.lucroLiquido - fco
  const accrualsRatio = Math.abs(accruals) / Math.abs(latest.ativoTotal)

  // Working capital accruals (melhor quando disponível em 2 anos)
  let wcAccrualsRatio: number | null = null
  if (years.length >= 2) {
    const prev = getStmt(company, years[1]!)
    if (prev && latest.contasAReceber != null && prev.contasAReceber != null
        && latest.estoques != null && prev.estoques != null
        && latest.fornecedores != null && prev.fornecedores != null) {
      const deltaAR = latest.contasAReceber - prev.contasAReceber
      const deltaEstoques = latest.estoques - prev.estoques
      const deltaFornecedores = latest.fornecedores - prev.fornecedores
      const avgAssets = (latest.ativoTotal + (prev.ativoTotal ?? latest.ativoTotal)) / 2
      if (avgAssets > 0) {
        wcAccrualsRatio = Math.abs(deltaAR + deltaEstoques - deltaFornecedores) / avgAssets
      }
    }
  }

  // Usar WC accruals se disponível, senão accruals simples
  const effectiveAccruals = wcAccrualsRatio ?? accrualsRatio

  // FCF = FCO - CapEx
  const fcfValue = (fco - capex.value) * S // Em BRL
  const fcfToNetIncome = latest.lucroLiquido !== 0 ? (fco - capex.value) / latest.lucroLiquido : null
  const fcfYield = market.marketCap > 0 ? (fcfValue / market.marketCap) * 100 : null

  // Earnings Quality Score = (100 - AccrualsRatio×150) × 0.6 + (FCF/Lucro × 40)
  const accrualComponent = Math.max(0, Math.min(100, 100 - effectiveAccruals * 150))
  const fcfComponent = fcfToNetIncome != null ? Math.max(0, Math.min(100, fcfToNetIncome * 40)) : 50
  const earningsQuality = Math.round(accrualComponent * 0.6 + fcfComponent * 0.4)

  // Manipulation flag
  const earningsManipulationFlag = effectiveAccruals > 0.30 && (fcfToNetIncome != null && fcfToNetIncome < 0.6)

  // FCF Growth (CAGR)
  let fcfGrowthRate: number | null = null
  if (years.length >= 3) {
    const fcfValues: number[] = []
    for (const year of years.slice(0, 5)) {
      const stmt = getStmt(company, year)
      if (!stmt) continue
      const stmtFco = getFCO(stmt)
      if (!stmtFco) continue
      const stmtCapex = getCapex(stmt)
      fcfValues.push(stmtFco.value - stmtCapex.value)
    }
    if (fcfValues.length >= 3) {
      const newest = fcfValues[0]!
      const oldest = fcfValues[fcfValues.length - 1]!
      if (oldest > 0 && newest > 0) {
        const n = fcfValues.length - 1
        fcfGrowthRate = (Math.pow(newest / oldest, 1 / n) - 1) * 100
      }
    }
  }

  return {
    earningsQuality: Math.max(0, Math.min(100, earningsQuality)),
    accrualsRatio: round2(effectiveAccruals),
    fcfToNetIncome: round2(fcfToNetIncome),
    earningsManipulationFlag,
    usedRealFCO: fcoResult.isReal,
    fcf: round2(fcfValue),
    fcfYield: round2(fcfYield),
    fcfGrowthRate: round2(fcfGrowthRate),
  }
}

// ─── Bloco 3: Management & Governance (20%) ─────────────────────

function calcManagement(
  company: CvmCompanyData,
  years: string[],
): { managementScore: number | null; capitalAllocationScore: number | null; shareholderFriendliness: number | null; earningsPredictability: number | null } {
  const noResult = { managementScore: null, capitalAllocationScore: null, shareholderFriendliness: null, earningsPredictability: null }
  if (years.length < 1) return noResult

  // 1. Capital Allocation Track Record (50%)
  // ROE médio 5a × (1 se ROIC>10% em 3+ anos, 0.7 senão)
  const roes: number[] = []
  let roicAbove10Count = 0
  for (const year of years.slice(0, 5)) {
    const stmt = getStmt(company, year)
    if (!stmt) continue
    if (stmt.lucroLiquido != null && stmt.patrimonioLiquido != null && stmt.patrimonioLiquido > 0) {
      roes.push((stmt.lucroLiquido / stmt.patrimonioLiquido) * 100)
    }
    if (stmt.ebit != null && stmt.patrimonioLiquido != null) {
      const netDebt = ((stmt.emprestimosCp ?? 0) + (stmt.emprestimosLp ?? 0)) - (stmt.caixaEquivalentes ?? 0)
      const ic = stmt.patrimonioLiquido + netDebt
      if (ic > 0) {
        const roic = (stmt.ebit * (1 - TAX_RATE) / ic) * 100
        if (roic >= 10) roicAbove10Count++
      }
    }
  }
  let capitalAllocationScore: number | null = null
  if (roes.length >= 1) {
    const avgROE = roes.reduce((s, v) => s + v, 0) / roes.length
    const multiplier = roicAbove10Count >= 3 ? 1.0 : 0.7
    const adjROE = avgROE * multiplier
    // nota10: adjROE > 20, nota5: 12, nota0: < 5
    if (adjROE >= 20) capitalAllocationScore = 100
    else if (adjROE <= 5) capitalAllocationScore = 0
    else capitalAllocationScore = Math.round(((adjROE - 5) / 15) * 100)
  }

  // 2. Shareholder Friendliness (30%)
  // Payout sustentável: 40-70% com FCF coverage = ótimo
  // Não temos payout direto do DFC, mas podemos estimar:
  // Payout proxy = 1 - (ΔPL / Lucro) se PL cresceu menos que lucro, a diferença foi distribuída
  let shareholderFriendliness: number | null = null
  if (years.length >= 2) {
    const payoutProxies: number[] = []
    for (let i = 0; i < Math.min(3, years.length - 1); i++) {
      const curr = getStmt(company, years[i]!)
      const prev = getStmt(company, years[i + 1]!)
      if (!curr || !prev || curr.lucroLiquido == null || curr.lucroLiquido <= 0) continue
      if (curr.patrimonioLiquido != null && prev.patrimonioLiquido != null) {
        const retainedEarnings = curr.patrimonioLiquido - prev.patrimonioLiquido
        const payout = Math.max(0, 1 - retainedEarnings / curr.lucroLiquido) * 100
        payoutProxies.push(Math.min(100, payout))
      }
    }
    if (payoutProxies.length >= 1) {
      const avgPayout = payoutProxies.reduce((s, v) => s + v, 0) / payoutProxies.length
      // Sweet spot: 40-70% = 100, < 10% ou > 90% = 0
      if (avgPayout >= 40 && avgPayout <= 70) shareholderFriendliness = 100
      else if (avgPayout >= 25 && avgPayout < 40) shareholderFriendliness = 70
      else if (avgPayout > 70 && avgPayout <= 85) shareholderFriendliness = 60
      else if (avgPayout >= 10 && avgPayout < 25) shareholderFriendliness = 40
      else shareholderFriendliness = 20
    }
  }

  // 3. Earnings Predictability (20%)
  // CV = stdDev(lucro) / |média(lucro)|
  const profits: number[] = []
  for (const year of years.slice(0, 5)) {
    const stmt = getStmt(company, year)
    if (!stmt || stmt.lucroLiquido == null) continue
    profits.push(stmt.lucroLiquido)
  }
  let earningsPredictability: number | null = null
  if (profits.length >= 3) {
    const mean = profits.reduce((s, v) => s + v, 0) / profits.length
    if (Math.abs(mean) > 0) {
      const variance = profits.reduce((s, v) => s + (v - mean) ** 2, 0) / profits.length
      const cv = Math.sqrt(variance) / Math.abs(mean)
      // nota10: CV < 0.15 = 100, nota0: CV > 0.60 = 0
      earningsPredictability = Math.max(0, Math.min(100, Math.round(100 - cv * 167)))
    }
  } else if (profits.length >= 1) {
    // Menos de 3 anos de dados: fallback neutro
    earningsPredictability = 50
  }

  // Composite
  const cap = capitalAllocationScore ?? 50
  const shf = shareholderFriendliness ?? 50
  const ep = earningsPredictability ?? 50
  const managementScore = Math.round(cap * 0.50 + shf * 0.30 + ep * 0.20)

  return { managementScore, capitalAllocationScore, shareholderFriendliness, earningsPredictability }
}

// ─── Bloco 4: Debt Sustainability (15%) ─────────────────────────

function calcDebtSustainability(
  company: CvmCompanyData,
  years: string[],
  setor: string,
): { debtSustainabilityScore: number | null; interestCoverage: number | null; netDebtEbitdaRatio: number | null; shortTermDebtRatio: number | null; debtCostEstimate: number | null } {
  const noResult = { debtSustainabilityScore: null, interestCoverage: null, netDebtEbitdaRatio: null, shortTermDebtRatio: null, debtCostEstimate: null }
  if (years.length < 1) return noResult

  const stmt = getStmt(company, years[0]!)
  if (!stmt) return noResult

  const debtCP = stmt.emprestimosCp ?? 0
  const debtLP = stmt.emprestimosLp ?? 0
  const totalDebt = debtCP + debtLP
  const cash = stmt.caixaEquivalentes ?? 0
  const netDebt = totalDebt - cash
  const isBank = setor === 'bancos_financeiro' || setor === 'seguradoras'

  // 1. Net Debt / EBITDA (40%) — ignorar para bancos
  let ndEbitdaScore = 50
  let netDebtEbitdaRatio: number | null = null
  if (!isBank && stmt.ebit != null) {
    const dep = stmt.depreciation != null ? Math.abs(stmt.depreciation) : 0
    const ebitda = stmt.ebit + dep
    if (ebitda > 0) {
      netDebtEbitdaRatio = round2(netDebt / ebitda)
      const ratio = netDebt / ebitda
      if (ratio <= 1.0) ndEbitdaScore = 100
      else if (ratio >= 5.0) ndEbitdaScore = 0
      else ndEbitdaScore = Math.round(100 * (5.0 - ratio) / 4.0)
    }
  }

  // 2. Interest Coverage = EBIT / Despesas Financeiras (40%)
  // Prioridade: conta CVM 3.06 (Resultado Financeiro real) > proxy NOPAT-NI
  let interestCoverage: number | null = null
  let icScore = 50
  if (stmt.ebit != null) {
    // Obter despesa financeira: 3.06 é negativo quando há despesa líquida
    let financialExpenses: number | null = null

    if (stmt.resultadoFinanceiro != null && stmt.resultadoFinanceiro < 0) {
      // Conta 3.06 real: valor negativo = despesa financeira líquida
      financialExpenses = Math.abs(stmt.resultadoFinanceiro)
    } else if (stmt.resultadoFinanceiro != null && stmt.resultadoFinanceiro >= 0) {
      // Resultado financeiro positivo = empresa ganha mais que paga de juros
      financialExpenses = 0
    } else if (stmt.lucroLiquido != null) {
      // Fallback: proxy NOPAT - Lucro Líquido
      const proxy = stmt.ebit * (1 - TAX_RATE) - stmt.lucroLiquido
      if (proxy > 0) financialExpenses = proxy
      else financialExpenses = 0
    }

    if (financialExpenses != null && financialExpenses > 0) {
      interestCoverage = round2(stmt.ebit / financialExpenses)
      const ic = stmt.ebit / financialExpenses
      if (ic >= 8.0) icScore = 100
      else if (ic <= 1.5) icScore = 0
      else icScore = Math.round(100 * (ic - 1.5) / 6.5)
    } else {
      // Sem despesa financeira líquida = excelente
      icScore = 100
      interestCoverage = 99
    }
  }

  // 3. Short-term Debt Ratio (20%)
  let shortTermDebtRatio: number | null = null
  let stdrScore = 50
  if (totalDebt > 0) {
    shortTermDebtRatio = round2(debtCP / totalDebt)
    const ratio = debtCP / totalDebt
    if (ratio <= 0.15) stdrScore = 100
    else if (ratio >= 0.65) stdrScore = 0
    else stdrScore = Math.round(100 * (0.65 - ratio) / 0.50)
  }

  // Debt cost estimate — prioriza conta 3.06 real
  let debtCostEstimate: number | null = null
  if (totalDebt > 0) {
    if (stmt.resultadoFinanceiro != null && stmt.resultadoFinanceiro < 0) {
      debtCostEstimate = round2((Math.abs(stmt.resultadoFinanceiro) / totalDebt) * 100)
    } else if (stmt.ebit != null && stmt.lucroLiquido != null) {
      const fe = stmt.ebit * (1 - TAX_RATE) - stmt.lucroLiquido
      if (fe > 0) debtCostEstimate = round2((fe / totalDebt) * 100)
    }
  }

  // Para bancos: peso maior em interest coverage, ignorar ND/EBITDA
  let debtSustainabilityScore: number
  if (isBank) {
    debtSustainabilityScore = Math.round(icScore * 0.60 + stdrScore * 0.40)
  } else {
    debtSustainabilityScore = Math.round(ndEbitdaScore * 0.40 + icScore * 0.40 + stdrScore * 0.20)
  }

  return { debtSustainabilityScore, interestCoverage, netDebtEbitdaRatio, shortTermDebtRatio, debtCostEstimate }
}

// ─── Bloco 5: Regulatory & Catalyst Risk (15%) ─────────────────

function calcRegulatoryRisk(
  company: CvmCompanyData,
  years: string[],
  setor: string,
): { regulatoryRiskScore: number | null; sectorExposure: number | null; earningsVolatility: number | null } {
  const noResult = { regulatoryRiskScore: null, sectorExposure: null, earningsVolatility: null }

  // 1. Exposição Setorial (60%)
  const sectorExposure = SECTOR_REGULATORY_EXPOSURE[setor] ?? 20
  // Inversamente proporcional: mais regulado = nota menor
  let sectorScore: number
  if (sectorExposure <= 25) sectorScore = 90
  else if (sectorExposure >= 75) sectorScore = 15
  else sectorScore = Math.round(90 - (sectorExposure - 25) * 1.5)

  // 2. Volatilidade de Resultados (40%)
  const profits: number[] = []
  for (const year of years.slice(0, 5)) {
    const stmt = getStmt(company, year)
    if (!stmt || stmt.lucroLiquido == null) continue
    profits.push(stmt.lucroLiquido)
  }
  let earningsVolatility: number | null = null
  let volScore = 50
  if (profits.length >= 3) {
    const mean = profits.reduce((s, v) => s + v, 0) / profits.length
    if (Math.abs(mean) > 0) {
      const variance = profits.reduce((s, v) => s + (v - mean) ** 2, 0) / profits.length
      const cv = Math.sqrt(variance) / Math.abs(mean)
      earningsVolatility = round2(cv)
      if (cv <= 0.15) volScore = 90
      else if (cv >= 0.60) volScore = 10
      else volScore = Math.round(90 - (cv - 0.15) * 178)
    }
  }

  const regulatoryRiskScore = Math.round(sectorScore * 0.60 + volScore * 0.40)

  return { regulatoryRiskScore, sectorExposure, earningsVolatility }
}

// ─── Bloco 3+: Governance (from Live Signals) ─────────────────────

function calcGovernance(signals: LiveSignals | null): {
  governanceScore: number | null
  listingSegment: string | null
  listingSegmentScore: number | null
  freeFloatScore: number | null
  cvmSanctionsScore: number | null
} {
  if (!signals) {
    return { governanceScore: 50, listingSegment: null, listingSegmentScore: 50, freeFloatScore: 50, cvmSanctionsScore: 100 }
  }

  const listingScore = signals.listingSegmentScore ?? 50
  // Free float: >50%=100, 30-50%=70, 20-30%=40, <20%=20
  let freeFloatScore = 50
  if (signals.freeFloatPct != null) {
    if (signals.freeFloatPct >= 50) freeFloatScore = 100
    else if (signals.freeFloatPct >= 30) freeFloatScore = 70
    else if (signals.freeFloatPct >= 20) freeFloatScore = 40
    else freeFloatScore = 20
  }
  // CVM Sanctions: 0=100, 1=50, 2+=10
  let cvmSanctionsScore = 100
  if (signals.cvmSanctions >= 2) cvmSanctionsScore = 10
  else if (signals.cvmSanctions === 1) cvmSanctionsScore = 50

  const governanceScore = Math.round(listingScore * 0.40 + freeFloatScore * 0.30 + cvmSanctionsScore * 0.30)

  return {
    governanceScore,
    listingSegment: signals.listingSegment,
    listingSegmentScore: listingScore,
    freeFloatScore,
    cvmSanctionsScore,
  }
}

function calcLiveManagement(signals: LiveSignals | null): {
  ceoTenureScore: number | null
  buybackSignal: number | null
  newsSentimentScore: number | null
} {
  if (!signals) {
    return { ceoTenureScore: 50, buybackSignal: 40, newsSentimentScore: 50 }
  }
  // CEO Tenure: >5a=100, 2-5a=70, <2a=30, sem dado=50
  let ceoTenureScore = 50
  if (signals.ceoChanged && signals.lastCeoChangeDate) {
    const ageMs = Date.now() - new Date(signals.lastCeoChangeDate).getTime()
    const ageYears = ageMs / (365.25 * 24 * 60 * 60 * 1000)
    if (ageYears > 5) ceoTenureScore = 100
    else if (ageYears > 2) ceoTenureScore = 70
    else ceoTenureScore = 30
  }
  const buybackSignal = signals.hasBuybackProgram ? 80 : 40
  const newsSentimentScore = signals.newsSentimentScore ?? 50

  return { ceoTenureScore, buybackSignal, newsSentimentScore }
}

function calcLiveRegulatoryRisk(signals: LiveSignals | null): {
  catalystAlertScore: number | null
  riEventVolume: number | null
} {
  if (!signals) {
    return { catalystAlertScore: 100, riEventVolume: 0 }
  }
  // Catalyst Alerts: 0=100, 1-2=60, 3+=20
  let catalystAlertScore = 100
  if (signals.catalystAlerts.length >= 3) catalystAlertScore = 20
  else if (signals.catalystAlerts.length >= 1) catalystAlertScore = 60

  return { catalystAlertScore, riEventVolume: signals.riEventCount30d }
}

// ─── Setor Mapping Helper ───────────────────────────────────────

const SETOR_MAP: Record<string, string> = {
  'Bancos': 'bancos_financeiro', 'Financeiro': 'bancos_financeiro',
  'Seguros': 'seguradoras',
  'Energia Elétrica': 'utilities_energia', 'Saneamento': 'saneamento',
  'Petróleo e Gás': 'petroleo_gas', 'Mineração': 'mineracao',
  'Siderurgia': 'siderurgia', 'Papel e Celulose': 'papel_celulose',
  'Imobiliário': 'construcao_civil', 'Shopping Centers': 'construcao_civil',
  'Varejo': 'varejo_consumo', 'Alimentos e Bebidas': 'varejo_consumo', 'Atacado': 'varejo_consumo',
  'Tecnologia': 'tecnologia', 'Saúde': 'saude', 'Educação': 'educacao',
  'Telecomunicações': 'telecom', 'Bens Industriais': 'industrial',
  'Agronegócio': 'agro', 'Logística': 'transporte_logistica',
  'Transporte': 'transporte_logistica', 'Locação': 'transporte_logistica',
}

function mapSetor(setorBruto: string): string {
  return SETOR_MAP[setorBruto] ?? 'outros'
}

// ─── Public API ─────────────────────────────────────────────────

export function calculateQualitativeMetrics(
  company: CvmCompanyData,
  ticker: string,
  market: MarketQuote,
  setor: string = 'outros',
): QualitativeMetrics | null {
  const years = getYearsSorted(company)
  if (years.length === 0) return null

  const latest = getStmt(company, years[0]!)
  if (!latest || (latest.ativoTotal == null && latest.ebit == null)) return null

  const mappedSetor = mapSetor(setor)

  const moat = calcMoatScore(company, years)
  const earnings = calcEarningsQuality(company, years, market)
  const management = calcManagement(company, years)
  const debt = calcDebtSustainability(company, years, mappedSetor)
  const regulatory = calcRegulatoryRisk(company, years, mappedSetor)

  // Live signals integration
  const signals = getLiveSignals(ticker)
  const governance = calcGovernance(signals)
  const liveManagement = calcLiveManagement(signals)
  const liveRegulatory = calcLiveRegulatoryRisk(signals)

  // Enriquecer management score com dados vivos (blend 60% CVM + 40% live)
  let enrichedManagementScore = management.managementScore
  if (management.managementScore != null) {
    const liveComponent = (
      (management.capitalAllocationScore ?? 50) * 0.25 +
      (management.earningsPredictability ?? 50) * 0.20 +
      (liveManagement.newsSentimentScore ?? 50) * 0.20 +
      (liveManagement.ceoTenureScore ?? 50) * 0.15 +
      (liveManagement.buybackSignal ?? 40) * 0.10 +
      (management.shareholderFriendliness ?? 50) * 0.10
    )
    enrichedManagementScore = Math.round(liveComponent)
  }

  // Enriquecer regulatory risk com dados vivos (blend)
  let enrichedRegulatory = regulatory.regulatoryRiskScore
  if (regulatory.regulatoryRiskScore != null) {
    enrichedRegulatory = Math.round(
      (regulatory.sectorExposure != null ? (100 - regulatory.sectorExposure) : 50) * 0.40 +
      (regulatory.earningsVolatility != null ? Math.max(0, 100 - regulatory.earningsVolatility * 100) : 50) * 0.25 +
      (liveRegulatory.catalystAlertScore ?? 100) * 0.20 +
      (signals?.riEventCount30d != null ? (signals.riEventCount30d > 3 ? 40 : 80) : 80) * 0.15
    )
  }

  return {
    ticker,
    ...moat,
    earningsQuality: earnings.earningsQuality,
    accrualsRatio: earnings.accrualsRatio,
    fcfToNetIncome: earnings.fcfToNetIncome,
    earningsManipulationFlag: earnings.earningsManipulationFlag,
    usedRealFCO: earnings.usedRealFCO,
    managementScore: enrichedManagementScore,
    capitalAllocationScore: management.capitalAllocationScore,
    shareholderFriendliness: management.shareholderFriendliness,
    earningsPredictability: management.earningsPredictability,
    debtSustainabilityScore: debt.debtSustainabilityScore,
    interestCoverage: debt.interestCoverage,
    netDebtEbitdaRatio: debt.netDebtEbitdaRatio,
    shortTermDebtRatio: debt.shortTermDebtRatio,
    regulatoryRiskScore: enrichedRegulatory,
    sectorExposure: regulatory.sectorExposure,
    earningsVolatility: regulatory.earningsVolatility,
    fcf: earnings.fcf,
    fcfYield: earnings.fcfYield,
    fcfGrowthRate: earnings.fcfGrowthRate,
    debtCostEstimate: debt.debtCostEstimate,
    // Live signal fields
    governanceScore: governance.governanceScore,
    listingSegment: governance.listingSegment,
    listingSegmentScore: governance.listingSegmentScore,
    freeFloatScore: governance.freeFloatScore,
    cvmSanctionsScore: governance.cvmSanctionsScore,
    ceoTenureScore: liveManagement.ceoTenureScore,
    buybackSignal: liveManagement.buybackSignal,
    newsSentimentScore: liveManagement.newsSentimentScore,
    catalystAlertScore: liveRegulatory.catalystAlertScore,
    riEventVolume: liveRegulatory.riEventVolume,
  }
}

export function calculateAllQualitativeMetrics(
  cvmCompanies: Record<string, CvmCompanyData>,
  tickerMappings: Record<string, { cnpj: string; cdCvm: string }>,
  marketQuotes: MarketQuote[],
  sectorMap: Map<string, string> = new Map(),
): Map<string, QualitativeMetrics> {
  const results = new Map<string, QualitativeMetrics>()

  const cnpjToCdCvm = new Map<string, string>()
  for (const company of Object.values(cvmCompanies)) {
    cnpjToCdCvm.set(company.cnpj, company.cdCvm)
  }

  const marketByTicker = new Map<string, MarketQuote>()
  for (const q of marketQuotes) {
    marketByTicker.set(q.ticker, q)
  }

  for (const [ticker, entry] of Object.entries(tickerMappings)) {
    const market = marketByTicker.get(ticker)
    if (!market) continue

    const cdCvm = cnpjToCdCvm.get(entry.cnpj) ?? entry.cdCvm
    const company = cvmCompanies[cdCvm]
    if (!company) continue

    const setor = sectorMap.get(ticker) ?? 'outros'
    const metrics = calculateQualitativeMetrics(company, ticker, market, setor)
    if (metrics) {
      results.set(ticker, metrics)
    }
  }

  logger.info({ calculated: results.size }, 'Qualitative metrics v2 calculated')
  return results
}
