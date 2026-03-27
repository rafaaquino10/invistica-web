/**
 * Tipos e utilidades para ScoreSnapshot (feedback loop).
 *
 * Grava snapshots semanais de IQ-Scores para tracking de
 * performance preditiva ao longo do tempo.
 */

export interface ScoreSnapshotData {
  ticker: string
  snapshotDate: Date
  scoreTotal: number
  scoreValuation: number
  scoreQuanti: number
  scoreQuanti: number
  scoreQuali: number
  scoreOperational: number
  scoreQuali: number
  scoreMomentum: number | null
  classificacao: string
  regime: string | null
  macroFactor: number | null
  confidence: number | null
  sector: string | null
  price: number | null
}

/**
 * Converte um asset com score calculado para formato de snapshot.
 */
export function toSnapshotData(
  ticker: string,
  score: {
    scoreTotal: number
    valuation: number
    quality: number
    risk: number
    dividends: number
    growth: number
    qualitativo?: number
    momentum?: number
    classificacao: string
    confidence?: number
  },
  context: {
    regime?: string
    macroFactor?: number
    sector?: string
    price?: number
    date?: Date
  } = {}
): ScoreSnapshotData {
  return {
    ticker,
    snapshotDate: context.date ?? new Date(),
    scoreTotal: score.scoreTotal,
    scoreValuation: score.valuation,
    scoreQuanti: score.quality,
    scoreQuanti: score.risk,
    scoreQuali: score.dividends,
    scoreOperational: score.growth,
    scoreQuali: score.qualitativo ?? 0,
    scoreMomentum: score.momentum ?? null,
    classificacao: score.classificacao,
    regime: context.regime ?? null,
    macroFactor: context.macroFactor ?? null,
    confidence: score.confidence ?? null,
    sector: context.sector ?? null,
    price: context.price ?? null,
  }
}
