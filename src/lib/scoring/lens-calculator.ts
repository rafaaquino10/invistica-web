// ─── Multi-Lens Score Calculator ─────────────────────────────────
// Calculates scores for all 6 lenses using pre-computed pillar scores.
// Pillar scores come from calcularAqScore() (with sector calibration).
// Only pillar WEIGHTS change per lens.
//
// The same multiplicative adjustments (liquidity × confidence × macro)
// are applied to all lenses.

import { LENSES, type MultiLensScores, type PillarWeights } from './lenses'
import type { AqScoreResult } from './iq-score'

interface PillarScores {
  valuation: number
  quality: number
  risk: number
  dividends: number
  growth: number
}

/**
 * Calculate a single lens score from pillar scores + weights + adjustment factors.
 */
function calculateSingleLens(
  pillars: PillarScores,
  weights: PillarWeights,
  fatorLiquidez: number,
  fatorConfianca: number,
  fatorMacro: number,
  caps: { penalPatrimNegativo: boolean; penalTriploNegativo: boolean }
): number {
  // Weights are in percentages (e.g., 40 = 40%), divide by 100
  const raw =
    pillars.valuation * (weights.valuation / 100) +
    pillars.quality * (weights.quality / 100) +
    pillars.risk * (weights.risk / 100) +
    pillars.dividends * (weights.dividends / 100) +
    pillars.growth * (weights.growth / 100)

  // Apply same multiplicative factors
  let score = raw * fatorLiquidez * fatorConfianca * fatorMacro

  // Apply same caps
  if (caps.penalPatrimNegativo) score = Math.min(score, 25)
  if (caps.penalTriploNegativo) score = Math.min(score, 15)

  // Clamp and round
  score = Math.max(0, Math.min(100, score))
  return Math.round(score * 10) / 10
}

/**
 * Calculate scores for all lenses using a pre-computed AqScoreResult.
 *
 * The 'general' lens score comes directly from the main AqScoreResult
 * (which already uses sector-calibrated pillar weights).
 *
 * Other lenses reweight the pillar scores per their configuration.
 *
 * Momentum lens combines fundamental pillar scores (50%) + momentum signal score (50%).
 * If momentumScore is null/undefined, momentum lens returns null.
 */
export function calculateLensScores(
  scoreResult: AqScoreResult,
  momentumScore?: number | null,
): MultiLensScores {
  const pillars: PillarScores = {
    valuation: scoreResult.pilares.valuation.nota,
    quality: scoreResult.pilares.qualidade.nota,
    risk: scoreResult.pilares.risco.nota,
    dividends: scoreResult.pilares.dividendos.nota,
    growth: scoreResult.pilares.crescimento.nota,
  }

  const { fatorLiquidez, fatorConfianca, fatorMacro, penalPatrimNegativo, penalTriploNegativo } = scoreResult.ajustes
  const caps = { penalPatrimNegativo, penalTriploNegativo }

  const result: Record<string, number | null> = {}

  for (const lens of LENSES) {
    if (lens.id === 'general') {
      // General lens = main Invscore (already sector-calibrated)
      result[lens.id] = scoreResult.score
    } else if (lens.id === 'momentum') {
      if (momentumScore == null) {
        result[lens.id] = null
      } else {
        // Momentum lens: 50% fundamental (from pillar weights) + 50% momentum score
        const fundamentalPart = calculateSingleLens(
          pillars,
          lens.pillarWeights,
          fatorLiquidez,
          fatorConfianca,
          fatorMacro,
          caps,
        )
        const technicalWeight = lens.technicalWeight ?? 50
        const fundamentalWeight = 100 - technicalWeight
        let combined = (fundamentalPart * fundamentalWeight + momentumScore * technicalWeight) / 100
        if (caps.penalPatrimNegativo) combined = Math.min(combined, 25)
        if (caps.penalTriploNegativo) combined = Math.min(combined, 15)
        result[lens.id] = Math.round(Math.max(0, Math.min(100, combined)) * 10) / 10
      }
    } else {
      result[lens.id] = calculateSingleLens(
        pillars,
        lens.pillarWeights,
        fatorLiquidez,
        fatorConfianca,
        fatorMacro,
        caps
      )
    }
  }

  return {
    general: result['general'] as number,
    value: result['value'] as number,
    dividends: result['dividends'] as number,
    growth: result['growth'] as number,
    defensive: result['defensive'] as number,
    momentum: result['momentum'] as number | null,
  }
}
