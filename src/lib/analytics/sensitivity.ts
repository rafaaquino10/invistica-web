// ─── Sensitivity Analysis Engine ─────────────────────────────
// Calcula cenários "E se..." para SELIC, IPCA, USD no detalhe do ativo.
// Re-calcula o Invscore com pesos de regime diferentes.

import type { AssetData } from '../data-source'
import { calcularAqScore, type DadosFundamentalistas, type RegimeWeights } from '../scoring/iq-score'
import { detectRegime, type RegimeConfig } from '../scoring/regime-detector'

export interface PillarImpact {
  pillar: string
  label: string
  current: number
  scenario: number
  delta: number
}

export interface SensitivityScenario {
  id: string
  variable: string
  currentValue: number
  scenarioValue: number
  delta: number
  unit: string
  scoreImpact: number
  currentScore: number
  scenarioScore: number
  pillarImpacts: PillarImpact[]
  description: string
  regime: { from: string; to: string }
}

interface MacroInput {
  selic: number
  ipca: number
  selicReal: number
}

const PILLAR_LABELS: Record<string, string> = {
  valuation: 'Valuation',
  qualidade: 'Qualidade',
  risco: 'Risco',
  dividendos: 'Dividendos',
  crescimento: 'Crescimento',
}

/**
 * Constrói DadosFundamentalistas a partir de AssetData
 */
function buildDados(asset: AssetData): DadosFundamentalistas {
  const f = asset.fundamentals
  return {
    ticker: asset.ticker,
    cotacao: asset.price,
    P_L: f.peRatio,
    P_VP: f.pbRatio,
    PSR: f.psr,
    P_EBIT: f.pEbit,
    EV_EBIT: f.evEbit,
    EV_EBITDA: f.evEbitda,
    ROIC: f.roic,
    ROE: f.roe,
    MRG_EBIT: f.margemEbit,
    MRG_LIQUIDA: f.margemLiquida,
    LIQ_CORRENTE: f.liquidezCorrente,
    DIV_BRUT_PATRIM: f.divBrutPatrim,
    P_CAP_GIRO: f.pCapGiro,
    P_ATIV_CIRC_LIQ: f.pAtivCircLiq,
    P_ATIVO: f.pAtivo,
    PATRIM_LIQUIDO: f.patrimLiquido,
    DIV_YIELD: f.dividendYield,
    DIV_EBITDA: f.netDebtEbitda,
    PAYOUT: null,
    CRESC_REC_5A: f.crescimentoReceita5a,
    CRESC_LUCRO_5A: null,
    LIQ_2MESES: f.liq2meses,
    MARKET_CAP: asset.marketCap,
    SETOR: asset.sector,
  }
}

/**
 * Calcula score com novos pesos de regime.
 */
function scoreWithRegime(
  dados: DadosFundamentalistas,
  regime: RegimeConfig,
): { score: number; pilares: Record<string, number> } {
  const weights: RegimeWeights = regime.pillarWeights
  const result = calcularAqScore(dados, undefined, weights)
  const pilares: Record<string, number> = {}
  for (const [key, val] of Object.entries(result.pilares)) {
    pilares[key] = (val as any).nota ?? 0
  }
  return { score: result.score, pilares }
}

function diffPillars(
  current: Record<string, number>,
  scenario: Record<string, number>,
): PillarImpact[] {
  return Object.keys(PILLAR_LABELS).map(key => ({
    pillar: key,
    label: PILLAR_LABELS[key]!,
    current: current[key] ?? 0,
    scenario: scenario[key] ?? 0,
    delta: (scenario[key] ?? 0) - (current[key] ?? 0),
  }))
}

/**
 * Calcula cenários de sensibilidade macro para um ativo.
 */
export function calculateSensitivity(
  asset: AssetData,
  macro: MacroInput,
): SensitivityScenario[] {
  if (!asset.aqScore || !asset.hasFundamentals) return []

  const dados = buildDados(asset)
  const currentRegime = detectRegime(macro.selic, macro.ipca)
  const currentResult = scoreWithRegime(dados, currentRegime)

  const scenarios: SensitivityScenario[] = []

  // Cenários SELIC
  const selicDeltas = [-2, +2]
  for (const delta of selicDeltas) {
    const newSelic = macro.selic + delta
    const newRegime = detectRegime(newSelic, macro.ipca)
    const newResult = scoreWithRegime(dados, newRegime)
    const impact = newResult.score - currentResult.score
    const sign = delta > 0 ? '+' : ''

    scenarios.push({
      id: `selic_${delta > 0 ? 'up' : 'down'}_${Math.abs(delta)}`,
      variable: 'SELIC',
      currentValue: macro.selic,
      scenarioValue: newSelic,
      delta,
      unit: 'pp',
      scoreImpact: impact,
      currentScore: currentResult.score,
      scenarioScore: newResult.score,
      pillarImpacts: diffPillars(currentResult.pilares, newResult.pilares),
      description: `SELIC ${sign}${delta}pp → Score ${impact >= 0 ? 'sobe' : 'cai'} ${Math.abs(Math.round(impact))}pts`,
      regime: { from: currentRegime.regime, to: newRegime.regime },
    })
  }

  // Cenário IPCA +1pp
  {
    const newIpca = macro.ipca + 1
    const newRegime = detectRegime(macro.selic, newIpca)
    const newResult = scoreWithRegime(dados, newRegime)
    const impact = newResult.score - currentResult.score

    scenarios.push({
      id: 'ipca_up_1',
      variable: 'IPCA',
      currentValue: macro.ipca,
      scenarioValue: newIpca,
      delta: 1,
      unit: 'pp',
      scoreImpact: impact,
      currentScore: currentResult.score,
      scenarioScore: newResult.score,
      pillarImpacts: diffPillars(currentResult.pilares, newResult.pilares),
      description: `IPCA +1pp → Score ${impact >= 0 ? 'sobe' : 'cai'} ${Math.abs(Math.round(impact))}pts`,
      regime: { from: currentRegime.regime, to: newRegime.regime },
    })
  }

  // Cenário IPCA -1pp
  {
    const newIpca = Math.max(0, macro.ipca - 1)
    const newRegime = detectRegime(macro.selic, newIpca)
    const newResult = scoreWithRegime(dados, newRegime)
    const impact = newResult.score - currentResult.score

    scenarios.push({
      id: 'ipca_down_1',
      variable: 'IPCA',
      currentValue: macro.ipca,
      scenarioValue: newIpca,
      delta: -1,
      unit: 'pp',
      scoreImpact: impact,
      currentScore: currentResult.score,
      scenarioScore: newResult.score,
      pillarImpacts: diffPillars(currentResult.pilares, newResult.pilares),
      description: `IPCA -1pp → Score ${impact >= 0 ? 'sobe' : 'cai'} ${Math.abs(Math.round(impact))}pts`,
      regime: { from: currentRegime.regime, to: newRegime.regime },
    })
  }

  // Ordenar por impacto absoluto (maior primeiro)
  scenarios.sort((a, b) => Math.abs(b.scoreImpact) - Math.abs(a.scoreImpact))

  return scenarios
}
