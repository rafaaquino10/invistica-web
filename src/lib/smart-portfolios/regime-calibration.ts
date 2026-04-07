// ─── Regime Calibration ──────────────────────────────────────
// Recalibra filtros de cada carteira inteligente conforme regime macro.
// Risk Off → endividamento apertado, boost dividendos/risco.
// Risk On  → aceita mais alavancagem, boost crescimento.

import type { MacroRegime } from '../scoring/regime-detector'

export interface ExtraFilter {
  field: string
  op: 'lt' | 'gt' | 'lte' | 'gte'
  value: number
}

export interface RegimeAdjustments {
  minScoreOverride?: number
  maxDivEbitdaOverride?: number
  minDYOverride?: number
  minROEOverride?: number
  lensBoost?: string
  extraFilters?: ExtraFilter[]
  sortOverride?: string
}

export interface RegimeCalibration {
  mode: string
  regime: MacroRegime
  adjustments: RegimeAdjustments
  rationale: string
}

const CALIBRATIONS: Record<string, Partial<Record<MacroRegime, Omit<RegimeCalibration, 'mode' | 'regime'>>>> = {
  'deep-value': {
    risk_off: {
      adjustments: {
        minScoreOverride: 60,
        maxDivEbitdaOverride: 2.0,
        extraFilters: [{ field: 'liquidezCorrente', op: 'gte', value: 1.0 }],
      },
      rationale: 'Juros altos exigem balanços mais sólidos para value investing',
    },
    neutral: {
      adjustments: {
        minScoreOverride: 55,
      },
      rationale: 'Regime neutro — critérios equilibrados, sem ajustes extremos',
    },
    risk_on: {
      adjustments: {
        minScoreOverride: 50,
        lensBoost: 'growth',
      },
      rationale: 'Juros baixos permitem aceitar growth premium no value',
    },
  },
  'passive-income': {
    risk_off: {
      adjustments: {
        maxDivEbitdaOverride: 2.0,
        minDYOverride: 6,
        extraFilters: [{ field: 'liquidezCorrente', op: 'gte', value: 1.2 }],
      },
      rationale: 'Juros altos: exigir DY maior e dívida menor para renda passiva sustentável',
    },
    neutral: {
      adjustments: {
        minDYOverride: 5,
        maxDivEbitdaOverride: 2.5,
      },
      rationale: 'Regime neutro — DY e dívida em patamares intermediários',
    },
    risk_on: {
      adjustments: {
        minDYOverride: 4,
        minScoreOverride: 45,
      },
      rationale: 'Juros baixos: aceitar DY menor, mais opções de ativos pagadores',
    },
  },
  growth: {
    risk_off: {
      adjustments: {
        minScoreOverride: 55,
        minROEOverride: 15,
        maxDivEbitdaOverride: 2.5,
      },
      rationale: 'Juros altos: crescimento precisa ser com qualidade — ROE alto, dívida controlada',
    },
    neutral: {
      adjustments: {
        minScoreOverride: 50,
        minROEOverride: 12,
      },
      rationale: 'Regime neutro — crescimento com qualidade moderada',
    },
    risk_on: {
      adjustments: {
        minScoreOverride: 45,
        minROEOverride: 10,
      },
      rationale: 'Juros baixos: mais tolerância para empresas em expansão agressiva',
    },
  },
  fortress: {
    risk_off: {
      adjustments: {
        maxDivEbitdaOverride: 1.0,
        minScoreOverride: 60,
      },
      rationale: 'Juros altos: fortaleza precisa ser ainda mais conservadora em dívida',
    },
    neutral: {
      adjustments: {
        maxDivEbitdaOverride: 1.5,
        minScoreOverride: 55,
      },
      rationale: 'Regime neutro — fortaleza com critérios intermediários de dívida',
    },
    risk_on: {
      adjustments: {
        maxDivEbitdaOverride: 2.0,
        minScoreOverride: 50,
      },
      rationale: 'Juros baixos: permite relaxar critério de dívida na fortaleza',
    },
  },
  momentum: {
    risk_off: {
      adjustments: {
        minScoreOverride: 65,
        extraFilters: [{ field: 'netDebtEbitda', op: 'lt', value: 3.0 }],
      },
      rationale: 'Juros altos: momentum precisa de fundamentos mais fortes',
    },
    neutral: {
      adjustments: {
        minScoreOverride: 60,
      },
      rationale: 'Regime neutro — momentum com gate de qualidade moderado',
    },
    risk_on: {
      adjustments: {
        minScoreOverride: 55,
      },
      rationale: 'Juros baixos: momentum puro com gate de qualidade mais leve',
    },
  },
  'esg-sustentavel': {
    risk_off: {
      adjustments: {
        minScoreOverride: 60,
        maxDivEbitdaOverride: 2.0,
      },
      rationale: 'Juros altos: ESG com foco em solidez financeira',
    },
    neutral: {
      adjustments: {
        minScoreOverride: 55,
      },
      rationale: 'Regime neutro — ESG com critérios equilibrados',
    },
    risk_on: {
      adjustments: {
        minScoreOverride: 50,
      },
      rationale: 'Juros baixos: ESG com mais flexibilidade de score',
    },
  },
  'quant-puro': {
    risk_off: {
      adjustments: {
        minScoreOverride: 65,
        sortOverride: 'lensScores.defensive',
      },
      rationale: 'Juros altos: quant puro prioriza resiliência',
    },
    neutral: {
      adjustments: {
        minScoreOverride: 60,
      },
      rationale: 'Regime neutro — quant puro com critérios balanceados',
    },
    risk_on: {
      adjustments: {
        minScoreOverride: 55,
        sortOverride: 'lensScores.growth',
      },
      rationale: 'Juros baixos: quant puro prioriza crescimento',
    },
  },
}

/**
 * Retorna a calibração de regime para uma carteira inteligente.
 * Todos os regimes (incluindo neutral) possuem calibração definida.
 * Retorna null apenas se o portfolioId não existir em CALIBRATIONS.
 */
export function getRegimeCalibration(
  portfolioId: string,
  regime: MacroRegime,
): RegimeCalibration | null {
  const modeCalibrations = CALIBRATIONS[portfolioId]
  if (!modeCalibrations) return null

  const cal = modeCalibrations[regime]
  if (!cal) return null

  return {
    mode: portfolioId,
    regime,
    ...cal,
  }
}

/**
 * Aplica extra filters do regime sobre uma lista de ativos.
 */
export function applyExtraFilters<T extends Record<string, any>>(
  items: T[],
  filters: ExtraFilter[],
  getFundamentals: (item: T) => Record<string, any>,
): T[] {
  return items.filter(item => {
    const f = getFundamentals(item)
    return filters.every(filter => {
      const val = f[filter.field]
      if (val == null) return false
      switch (filter.op) {
        case 'lt': return val < filter.value
        case 'gt': return val > filter.value
        case 'lte': return val <= filter.value
        case 'gte': return val >= filter.value
        default: return true
      }
    })
  })
}
