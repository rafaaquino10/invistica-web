/**
 * Performance Attribution — Brinson-Fachler simplificado
 *
 * Decompõe retorno em: efeito de alocação setorial + efeito de seleção de ativos.
 */

export interface PortfolioPosition {
  ticker: string
  sector: string | null
  currentValue: number
  gainLossPercent: number
}

export interface AttributionResult {
  totalReturn: number
  benchmarkReturn: number
  allocationEffect: number
  selectionEffect: number
  interactionEffect: number
  bySector: SectorAttribution[]
}

export interface SectorAttribution {
  sector: string
  portfolioWeight: number
  benchmarkWeight: number
  portfolioReturn: number
  benchmarkReturn: number
  allocationEffect: number
  selectionEffect: number
}

// Pesos setoriais aproximados do IBOV (simplificado)
const IBOV_SECTOR_WEIGHTS: Record<string, number> = {
  bancos_financeiro: 0.20,
  petroleo_gas: 0.15,
  mineracao: 0.12,
  utilities_energia: 0.10,
  varejo_consumo: 0.08,
  siderurgia: 0.05,
  papel_celulose: 0.04,
  saude: 0.04,
  seguradoras: 0.03,
  construcao_civil: 0.03,
  transporte_logistica: 0.03,
  industrial: 0.03,
  tecnologia: 0.02,
  telecom: 0.02,
  saneamento: 0.02,
  agro: 0.02,
  educacao: 0.01,
  outros: 0.01,
}

// Retorno setorial estimado do IBOV (últimos 12m, simplificado)
const IBOV_SECTOR_RETURNS: Record<string, number> = {
  bancos_financeiro: 12,
  petroleo_gas: -5,
  mineracao: 8,
  utilities_energia: 15,
  varejo_consumo: -8,
  siderurgia: 3,
  papel_celulose: 10,
  saude: 5,
  seguradoras: 10,
  construcao_civil: -3,
  transporte_logistica: 2,
  industrial: 6,
  tecnologia: -2,
  telecom: 8,
  saneamento: 12,
  agro: 4,
  educacao: -5,
  outros: 0,
}

export function calculateAttribution(
  positions: PortfolioPosition[],
  benchmarkReturn: number = 8,
): AttributionResult {
  const totalValue = positions.reduce((sum, p) => sum + p.currentValue, 0)
  if (totalValue === 0) {
    return {
      totalReturn: 0, benchmarkReturn, allocationEffect: 0,
      selectionEffect: 0, interactionEffect: 0, bySector: [],
    }
  }

  // Agrupar por setor
  const sectorMap = new Map<string, { weight: number; return: number; value: number }>()
  for (const p of positions) {
    const sector = p.sector ?? 'outros'
    const existing = sectorMap.get(sector)
    if (existing) {
      existing.value += p.currentValue
      existing.return = (existing.return * (existing.value - p.currentValue) + p.gainLossPercent * p.currentValue) / existing.value
    } else {
      sectorMap.set(sector, { weight: 0, return: p.gainLossPercent, value: p.currentValue })
    }
  }

  // Calcular pesos
  for (const [, data] of sectorMap) {
    data.weight = data.value / totalValue
  }

  // Retorno total ponderado
  const totalReturn = positions.reduce((sum, p) => sum + (p.gainLossPercent * p.currentValue / totalValue), 0)

  // Brinson-Fachler por setor
  let totalAllocation = 0
  let totalSelection = 0
  let totalInteraction = 0
  const bySector: SectorAttribution[] = []

  for (const [sector, data] of sectorMap) {
    const bWeight = IBOV_SECTOR_WEIGHTS[sector] ?? 0.01
    const bReturn = IBOV_SECTOR_RETURNS[sector] ?? benchmarkReturn

    const allocation = (data.weight - bWeight) * (bReturn - benchmarkReturn)
    const selection = bWeight * (data.return - bReturn)

    totalAllocation += allocation
    totalSelection += selection

    bySector.push({
      sector,
      portfolioWeight: data.weight,
      benchmarkWeight: bWeight,
      portfolioReturn: data.return,
      benchmarkReturn: bReturn,
      allocationEffect: Math.round(allocation * 100) / 100,
      selectionEffect: Math.round(selection * 100) / 100,
    })
  }

  totalInteraction = totalReturn - benchmarkReturn - totalAllocation - totalSelection

  return {
    totalReturn: Math.round(totalReturn * 100) / 100,
    benchmarkReturn,
    allocationEffect: Math.round(totalAllocation * 100) / 100,
    selectionEffect: Math.round(totalSelection * 100) / 100,
    interactionEffect: Math.round(totalInteraction * 100) / 100,
    bySector: bySector.sort((a, b) => Math.abs(b.allocationEffect + b.selectionEffect) - Math.abs(a.allocationEffect + a.selectionEffect)),
  }
}
