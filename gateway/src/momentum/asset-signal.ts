// ─── Asset Signal ────────────────────────────────────────────
// Individual stock momentum from technical data + score history.

import type { TechnicalData } from './technical-calculator.js'

export interface AssetSignal {
  signal: number
  label: 'BULL' | 'NEUTRO' | 'BEAR'
  factors: string[]
}

export interface ScoreHistory {
  current: number
  previous30d: number | null
}

/**
 * Calculate individual asset momentum signal.
 * Combines 5 technical factors.
 */
export function calculateAssetSignal(
  technical: TechnicalData,
  scoreHistory: ScoreHistory,
  changePercent: number = 0,
): AssetSignal {
  let signal = 0
  const factors: string[] = []

  // 1. Price vs MM200 (long-term trend, ±0.4)
  if (technical.mm200 != null && technical.mm200 > 0) {
    const distMM200 = (technical.price - technical.mm200) / technical.mm200
    if (distMM200 > 0.05) {
      signal += 0.4
      factors.push(`Preço ${(distMM200 * 100).toFixed(1)}% acima da MM200`)
    } else if (distMM200 < -0.05) {
      signal -= 0.4
      factors.push(`Preço ${(Math.abs(distMM200) * 100).toFixed(1)}% abaixo da MM200`)
    }
  }

  // 2. Price vs MM50 (short-term trend, ±0.2)
  if (technical.mm50 != null && technical.mm50 > 0) {
    const distMM50 = (technical.price - technical.mm50) / technical.mm50
    if (distMM50 > 0.03) {
      signal += 0.2
      factors.push('Acima da MM50 — momentum de curto prazo positivo')
    } else if (distMM50 < -0.03) {
      signal -= 0.2
      factors.push('Abaixo da MM50 — momentum de curto prazo negativo')
    }
  }

  // 3. Volume vs average (confirmation, ±0.15)
  if (technical.avgVolume2m != null && technical.todayVolume != null && technical.avgVolume2m > 0) {
    const volRatio = technical.todayVolume / technical.avgVolume2m
    if (volRatio > 1.5) {
      const direction = Math.sign(changePercent)
      signal += 0.15 * direction
      factors.push(
        `Volume ${volRatio.toFixed(1)}x acima da média — ${direction > 0 ? 'confirmação de alta' : 'pressão vendedora'}`,
      )
    }
  }

  // 4. Position in 52-week range (±0.15)
  if (technical.high52w != null && technical.low52w != null) {
    const range = technical.high52w - technical.low52w
    if (range > 0) {
      const position = (technical.price - technical.low52w) / range
      if (position > 0.85) {
        signal -= 0.15
        factors.push('Próximo da máxima de 52 semanas — cautela')
      } else if (position < 0.25) {
        signal += 0.15
        factors.push('Próximo da mínima de 52 semanas — possível oportunidade')
      }
    }
  }

  // 5. Score trend 30d (±0.2)
  if (scoreHistory.previous30d != null) {
    const scoreDelta = scoreHistory.current - scoreHistory.previous30d
    if (scoreDelta >= 5) {
      signal += 0.2
      factors.push(`Score subindo (+${scoreDelta.toFixed(0)} em 30d) — fundamentos melhorando`)
    } else if (scoreDelta <= -5) {
      signal -= 0.2
      factors.push(`Score caindo (${scoreDelta.toFixed(0)} em 30d) — fundamentos deteriorando`)
    }
  }

  const clamped = Math.max(-1, Math.min(1, signal))

  return {
    signal: clamped,
    label: clamped > 0.3 ? 'BULL' : clamped < -0.3 ? 'BEAR' : 'NEUTRO',
    factors,
  }
}
