/**
 * Scenario Analysis
 *
 * Estima impacto de mudanças macro na carteira.
 * Baseado em sector-sensitivity.ts existente.
 */

import { mapearSetor } from '@/lib/scoring/iq-score'
import {
  RATE_SENSITIVE_NEGATIVE,
  RATE_SENSITIVE_POSITIVE,
  FX_EXPORTERS,
  FX_IMPORTERS,
  CYCLICAL_SECTORS,
  DEFENSIVE_SECTORS,
  isSectorIn,
} from '@/lib/scoring/sector-sensitivity'
import type { Setor } from '@/lib/scoring/iq-score'

export interface ScenarioPosition {
  ticker: string
  sector: string | null
  currentValue: number
}

export interface ScenarioResult {
  scenario: string
  description: string
  totalImpactPercent: number
  totalImpactValue: number
  bySector: SectorImpact[]
}

export interface SectorImpact {
  sector: string
  weight: number
  impactPercent: number
  impactValue: number
  reason: string
}

// Sensibilidades estimadas (% de impacto por mudança unitária)
const SELIC_SENSITIVITY: Record<string, { impact: number; reason: string }> = {
  rate_negative: { impact: -3.0, reason: 'Sensível a juros — custo de capital sobe' },
  rate_positive: { impact: +2.0, reason: 'Beneficiado por spread bancário' },
  defensive:     { impact: -0.5, reason: 'Pouco sensível a juros' },
  other:         { impact: -1.5, reason: 'Impacto moderado via custo de capital' },
}

const FX_SENSITIVITY: Record<string, { impact: number; reason: string }> = {
  exporter:  { impact: +4.0, reason: 'Receita em dólar — beneficiado' },
  importer:  { impact: -3.0, reason: 'Custos em dólar — prejudicado' },
  defensive: { impact: -0.5, reason: 'Baixa exposição cambial' },
  other:     { impact: -1.0, reason: 'Impacto indireto via inflação importada' },
}

function getSelicGroup(sector: Setor): string {
  if (isSectorIn(sector, RATE_SENSITIVE_NEGATIVE)) return 'rate_negative'
  if (isSectorIn(sector, RATE_SENSITIVE_POSITIVE)) return 'rate_positive'
  if (isSectorIn(sector, DEFENSIVE_SECTORS)) return 'defensive'
  return 'other'
}

function getFxGroup(sector: Setor): string {
  if (isSectorIn(sector, FX_EXPORTERS)) return 'exporter'
  if (isSectorIn(sector, FX_IMPORTERS)) return 'importer'
  if (isSectorIn(sector, DEFENSIVE_SECTORS)) return 'defensive'
  return 'other'
}

export function analyzeSelicChange(
  positions: ScenarioPosition[],
  changeBps: number = -100,
): ScenarioResult {
  const totalValue = positions.reduce((sum, p) => sum + p.currentValue, 0)
  if (totalValue === 0) {
    return { scenario: 'selic', description: '', totalImpactPercent: 0, totalImpactValue: 0, bySector: [] }
  }

  const multiplier = changeBps / -100  // -100bps = queda = positivo pra rate_negative
  const sectorMap = new Map<string, { value: number; impact: number; reason: string }>()

  for (const p of positions) {
    const sector = mapearSetor(p.sector ?? 'outros')
    const group = getSelicGroup(sector)
    const sensitivity = SELIC_SENSITIVITY[group]!
    const existing = sectorMap.get(sector)
    if (existing) {
      existing.value += p.currentValue
    } else {
      sectorMap.set(sector, {
        value: p.currentValue,
        impact: sensitivity.impact * multiplier,
        reason: sensitivity.reason,
      })
    }
  }

  const bySector: SectorImpact[] = []
  let totalImpact = 0

  for (const [sector, data] of sectorMap) {
    const weight = data.value / totalValue
    const impactValue = data.value * (data.impact / 100)
    totalImpact += impactValue

    bySector.push({
      sector,
      weight: Math.round(weight * 10000) / 100,
      impactPercent: Math.round(data.impact * 100) / 100,
      impactValue: Math.round(impactValue),
      reason: data.reason,
    })
  }

  const direction = changeBps < 0 ? 'cair' : 'subir'

  return {
    scenario: 'selic',
    description: `Se SELIC ${direction} ${Math.abs(changeBps)}bps`,
    totalImpactPercent: Math.round((totalImpact / totalValue) * 10000) / 100,
    totalImpactValue: Math.round(totalImpact),
    bySector: bySector.sort((a, b) => Math.abs(b.impactValue) - Math.abs(a.impactValue)),
  }
}

export function analyzeFxChange(
  positions: ScenarioPosition[],
  changePercent: number = 10,
): ScenarioResult {
  const totalValue = positions.reduce((sum, p) => sum + p.currentValue, 0)
  if (totalValue === 0) {
    return { scenario: 'fx', description: '', totalImpactPercent: 0, totalImpactValue: 0, bySector: [] }
  }

  const multiplier = changePercent / 10  // 10% = base
  const sectorMap = new Map<string, { value: number; impact: number; reason: string }>()

  for (const p of positions) {
    const sector = mapearSetor(p.sector ?? 'outros')
    const group = getFxGroup(sector)
    const sensitivity = FX_SENSITIVITY[group]!
    const existing = sectorMap.get(sector)
    if (existing) {
      existing.value += p.currentValue
    } else {
      sectorMap.set(sector, {
        value: p.currentValue,
        impact: sensitivity.impact * multiplier,
        reason: sensitivity.reason,
      })
    }
  }

  const bySector: SectorImpact[] = []
  let totalImpact = 0

  for (const [sector, data] of sectorMap) {
    const weight = data.value / totalValue
    const impactValue = data.value * (data.impact / 100)
    totalImpact += impactValue

    bySector.push({
      sector,
      weight: Math.round(weight * 10000) / 100,
      impactPercent: Math.round(data.impact * 100) / 100,
      impactValue: Math.round(impactValue),
      reason: data.reason,
    })
  }

  const direction = changePercent > 0 ? 'subir' : 'cair'

  return {
    scenario: 'fx',
    description: `Se dólar ${direction} ${Math.abs(changePercent)}%`,
    totalImpactPercent: Math.round((totalImpact / totalValue) * 10000) / 100,
    totalImpactValue: Math.round(totalImpact),
    bySector: bySector.sort((a, b) => Math.abs(b.impactValue) - Math.abs(a.impactValue)),
  }
}
