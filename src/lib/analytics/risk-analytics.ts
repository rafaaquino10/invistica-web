/**
 * Risk Analytics
 *
 * VaR 95%, Beta vs IBOV, Concentração HHI, Factor Exposure.
 */

import { mapearSetor, type Setor } from '@/lib/scoring/aq-score'
import {
  RATE_SENSITIVE_POSITIVE,
  DEFENSIVE_SECTORS,
  isSectorIn,
} from '@/lib/scoring/sector-sensitivity'

export interface RiskPosition {
  ticker: string
  sector: string | null
  currentValue: number
  iqScore: number | null
  dividendYield: number | null
  gainLossPercent: number
}

export interface RiskResult {
  var95: number
  beta: number
  hhi: number
  concentrationLevel: 'baixa' | 'moderada' | 'alta' | 'muito_alta'
  topConcentration: Array<{ ticker: string; weight: number }>
  factorExposure: {
    value: number
    growth: number
    dividend: number
    defensive: number
    cyclical: number
  }
}

// Volatilidade setorial anualizada estimada (%)
const SECTOR_VOLATILITY: Record<string, number> = {
  bancos_financeiro: 25,
  petroleo_gas: 35,
  mineracao: 40,
  utilities_energia: 18,
  varejo_consumo: 35,
  siderurgia: 38,
  papel_celulose: 30,
  saude: 22,
  seguradoras: 20,
  construcao_civil: 32,
  transporte_logistica: 28,
  industrial: 25,
  tecnologia: 35,
  telecom: 20,
  saneamento: 16,
  agro: 30,
  educacao: 35,
  outros: 28,
}

// Beta setorial estimado vs IBOV
const SECTOR_BETA: Record<string, number> = {
  bancos_financeiro: 1.1,
  petroleo_gas: 1.3,
  mineracao: 1.4,
  utilities_energia: 0.6,
  varejo_consumo: 1.2,
  siderurgia: 1.3,
  papel_celulose: 1.0,
  saude: 0.7,
  seguradoras: 0.9,
  construcao_civil: 1.2,
  transporte_logistica: 1.1,
  industrial: 1.0,
  tecnologia: 1.3,
  telecom: 0.7,
  saneamento: 0.5,
  agro: 1.0,
  educacao: 1.1,
  outros: 1.0,
}

export function calculateRisk(positions: RiskPosition[]): RiskResult {
  const totalValue = positions.reduce((sum, p) => sum + p.currentValue, 0)

  if (totalValue === 0) {
    return {
      var95: 0, beta: 1, hhi: 0, concentrationLevel: 'baixa',
      topConcentration: [], factorExposure: { value: 0, growth: 0, dividend: 0, defensive: 0, cyclical: 0 },
    }
  }

  const weights = positions.map(p => p.currentValue / totalValue)

  // ─── VaR 95% (paramétrico simplificado) ────────────────────
  // Volatilidade ponderada da carteira (ignora correlações — conservador)
  let portfolioVol = 0
  for (let i = 0; i < positions.length; i++) {
    const sector = positions[i]!.sector ?? 'outros'
    const vol = (SECTOR_VOLATILITY[sector] ?? 28) / 100
    portfolioVol += (weights[i]! * vol) ** 2
  }
  portfolioVol = Math.sqrt(portfolioVol)
  const var95 = Math.round(portfolioVol * 1.645 * totalValue) / 100  // Em % do total

  // ─── Beta ponderado ────────────────────────────────────────
  let beta = 0
  for (let i = 0; i < positions.length; i++) {
    const sector = positions[i]!.sector ?? 'outros'
    beta += weights[i]! * (SECTOR_BETA[sector] ?? 1.0)
  }

  // ─── HHI (Herfindahl-Hirschman Index) ──────────────────────
  const hhi = Math.round(weights.reduce((sum, w) => sum + (w * 100) ** 2, 0))
  const concentrationLevel = hhi > 2500 ? 'muito_alta' : hhi > 1500 ? 'alta' : hhi > 1000 ? 'moderada' : 'baixa'

  // Top 5 concentração
  const topConcentration = positions
    .map((p, i) => ({ ticker: p.ticker, weight: weights[i]! }))
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 5)
    .map(p => ({ ticker: p.ticker, weight: Math.round(p.weight * 10000) / 100 }))

  // ─── Factor Exposure (% do portfólio em cada fator) ────────
  const factorExposure = { value: 0, growth: 0, dividend: 0, defensive: 0, cyclical: 0 }

  for (let i = 0; i < positions.length; i++) {
    const p = positions[i]!
    const w = weights[i]!
    const sector = mapearSetor(p.sector ?? 'outros')
    const score = p.iqScore ?? 50

    // Value: score alto + DY
    if (score >= 60 && (p.dividendYield ?? 0) > 4) factorExposure.value += w

    // Growth: score alto + DY baixo
    if (score >= 60 && (p.dividendYield ?? 0) < 3) factorExposure.growth += w

    // Dividend: DY > 5%
    if ((p.dividendYield ?? 0) >= 5) factorExposure.dividend += w

    // Defensive
    if (isSectorIn(sector, DEFENSIVE_SECTORS)) factorExposure.defensive += w

    // Cyclical (bancos + rate positive contam como cíclicos aqui)
    if (!isSectorIn(sector, DEFENSIVE_SECTORS) && !isSectorIn(sector, RATE_SENSITIVE_POSITIVE as Setor[]))
      factorExposure.cyclical += w
  }

  // Converter para %
  for (const key of Object.keys(factorExposure) as Array<keyof typeof factorExposure>) {
    factorExposure[key] = Math.round(factorExposure[key] * 10000) / 100
  }

  return {
    var95: Math.round(var95 * 100) / 100,
    beta: Math.round(beta * 100) / 100,
    hhi,
    concentrationLevel,
    topConcentration,
    factorExposure,
  }
}
