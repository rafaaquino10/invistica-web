// ─── Scoring Types ───────────────────────────────────────────
// Shared between web and mobile clients.

export type AqClassificacao = 'Excepcional' | 'Saudável' | 'Atenção' | 'Crítico'

export interface ScoreBreakdown {
  scoreTotal: number
  scoreValuation: number
  scoreQuality: number
  scoreGrowth: number
  scoreDividends: number
  scoreRisk: number
  classificacao: AqClassificacao
  confiabilidade: number
}

export interface PillarDetail {
  nota: number
  pesoEfetivo: number
  destaque: string
  subNotas: SubNota[]
}

export interface SubNota {
  indicador: string
  valor: number | null
  nota: number
  pesoInterno: number
  direcao: 'menor_melhor' | 'maior_melhor'
  referencia: { nota10: number; nota5: number; nota0: number }
}

export const PILLAR_WEIGHTS = {
  valuation: 0.25,
  quality: 0.25,
  risk: 0.20,
  dividends: 0.15,
  growth: 0.15,
} as const
