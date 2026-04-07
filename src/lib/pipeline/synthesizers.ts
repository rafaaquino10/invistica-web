// ─── Pipeline Camada 3: Síntese ─────────────────────────────
// Geração de insights, diagnósticos e narrativas.
// Usa IA (Ollama) quando disponível, fallback para templates.

export { generateNarrative, type ScoreNarrative } from '../scoring/score-narrator'
export { checkKillSwitch } from '../intelligence/kill-switch'
export { generateAIDiagnosis, assetToDiagnosisInput, type DiagnosisInput } from '../ai/synthesis-pipeline'
export { generateResearchNote } from '../ai/research-note'
export { isOllamaAvailable } from '../ai/ollama-client'
export { isClaudeAvailable, generateClaudeCompletion, CLAUDE_MODELS, IQ_SYSTEM_PROMPT } from '../ai/claude-client'
export { validateNarrative, type GuardrailContext } from '../ai/guardrail'

import type { AssetData } from '../data/asset-cache'

// ─── Driver Extraction ──────────────────────────────────────

export interface Driver {
  text: string
  pillar: string
  value?: string
  nota: number
}

const PILLAR_LABELS: Record<string, string> = {
  valuation: 'Valuation',
  qualidade: 'Qualidade',
  risco: 'Risco',
  dividendos: 'Dividendos',
  crescimento: 'Crescimento',
  qualitativo: 'Qualitativo',
}

const INDICATOR_LABELS: Record<string, string> = {
  P_L: 'P/L', P_VP: 'P/VP', PSR: 'PSR', P_EBIT: 'P/EBIT',
  EV_EBIT: 'EV/EBIT', EV_EBITDA: 'EV/EBITDA', ROIC: 'ROIC', ROE: 'ROE',
  MRG_EBIT: 'Margem EBIT', MRG_LIQUIDA: 'Margem Líquida',
  LIQ_CORRENTE: 'Liq. Corrente', DIV_BRUT_PATRIM: 'Dív/Patrimônio',
  P_CAP_GIRO: 'P/Cap. Giro', P_ATIV_CIRC_LIQ: 'P/At. Circ. Líq.',
  P_ATIVO: 'P/Ativo', DIV_YIELD: 'Dividend Yield',
  DIV_EBITDA: 'Dív. Líq./EBITDA', PAYOUT: 'Payout',
  CRESC_REC_5A: 'Cresc. Receita 5a', CRESC_LUCRO_5A: 'Cresc. Lucro 5a',
}

/**
 * Extrai drivers positivos e negativos do scoreBreakdown de um ativo.
 */
export function extractDrivers(asset: AssetData): { positive: Driver[]; negative: Driver[] } {
  const breakdown = asset.scoreBreakdown
  if (!breakdown) return { positive: [], negative: [] }

  const all: Driver[] = []
  const pctIndicators = ['ROIC', 'ROE', 'MRG_EBIT', 'MRG_LIQUIDA', 'DIV_YIELD', 'PAYOUT', 'CRESC_REC_5A', 'CRESC_LUCRO_5A']

  for (const key of Object.keys(PILLAR_LABELS)) {
    const pilar = breakdown.pilares?.[key as keyof typeof breakdown.pilares]
    if (!pilar || !('subNotas' in pilar)) continue
    for (const sub of (pilar as any).subNotas ?? []) {
      if (sub.valor === null && sub.nota === 5) continue
      const label = INDICATOR_LABELS[sub.indicador as string] ?? sub.indicador
      const valStr = sub.valor != null
        ? pctIndicators.includes(sub.indicador) ? `${Number(sub.valor).toFixed(1)}%` : Number(sub.valor).toFixed(2)
        : undefined
      all.push({
        text: `${label} ${sub.nota >= 7 ? 'acima' : sub.nota < 4 ? 'abaixo' : 'dentro'} das referências`,
        pillar: PILLAR_LABELS[key] ?? key,
        value: valStr,
        nota: sub.nota,
      })
    }
  }

  const sorted = [...all].sort((a, b) => b.nota - a.nota)
  return {
    positive: sorted.filter(s => s.nota >= 6).slice(0, 3),
    negative: sorted.filter(s => s.nota < 5).slice(-3).reverse(),
  }
}
