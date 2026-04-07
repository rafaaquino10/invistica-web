// ─── Macro Signal ────────────────────────────────────────────
// Market-level sentiment from Kalshi predictions + IBOV technical.
// Signal ranges from -1.0 (BEAR) to +1.0 (BULL).

export interface MacroFactor {
  name: string
  signal: number
  description: string
  source: string
}

export interface MacroSignal {
  signal: number
  label: 'BULL' | 'NEUTRO' | 'BEAR'
  factors: MacroFactor[]
}

export interface PredictionInput {
  category: string
  probability: number // 0-100
  volume: number
}

export interface IbovTechnical {
  price: number
  mm200: number | null
  change30d: number | null
}

/**
 * Calculate market-level macro momentum signal.
 * Analyzes 4 factors: SELIC, Dollar, IBOV trend, Inflation.
 */
export function calculateMacroSignal(
  predictions: PredictionInput[],
  ibovTechnical: IbovTechnical,
): MacroSignal {
  const factors: MacroFactor[] = []

  // Group predictions by category, use highest-volume contract per category
  const byCategory = new Map<string, PredictionInput>()
  for (const p of predictions) {
    const existing = byCategory.get(p.category)
    if (!existing || p.volume > existing.volume) {
      byCategory.set(p.category, p)
    }
  }

  // 1. SELIC / Interest rate trend
  const selic = byCategory.get('selic')
  if (selic) {
    const probHigherRates = selic.probability / 100
    if (probHigherRates > 0.7) {
      factors.push({
        name: 'Juros',
        signal: -0.8,
        description: `${(probHigherRates * 100).toFixed(0)}% de chance de alta — pressiona renda variável`,
        source: 'Kalshi + BCB',
      })
    } else if (probHigherRates < 0.3) {
      factors.push({
        name: 'Juros',
        signal: +0.8,
        description: `${((1 - probHigherRates) * 100).toFixed(0)}% de chance de corte — favorece bolsa`,
        source: 'Kalshi + BCB',
      })
    } else {
      factors.push({ name: 'Juros', signal: 0, description: 'Sem tendência clara de juros', source: 'Kalshi + BCB' })
    }
  }

  // 2. Dollar / Exchange rate
  const cambio = byCategory.get('cambio')
  if (cambio) {
    const probDollarUp = cambio.probability / 100
    if (probDollarUp > 0.65) {
      factors.push({ name: 'Dólar', signal: -0.5, description: 'Dólar em alta — pressão na bolsa', source: 'Kalshi' })
    } else if (probDollarUp < 0.35) {
      factors.push({ name: 'Dólar', signal: +0.5, description: 'Dólar em queda — favorece bolsa', source: 'Kalshi' })
    } else {
      factors.push({ name: 'Dólar', signal: 0, description: 'Câmbio estável', source: 'Kalshi' })
    }
  }

  // 3. IBOV vs MM200
  if (ibovTechnical.mm200 != null && ibovTechnical.mm200 > 0) {
    const ratio = ibovTechnical.price / ibovTechnical.mm200
    if (ratio > 1.03) {
      factors.push({ name: 'IBOV', signal: +0.6, description: 'Acima da MM200 — tendência de alta', source: 'brapi' })
    } else if (ratio < 0.97) {
      factors.push({ name: 'IBOV', signal: -0.6, description: 'Abaixo da MM200 — tendência de baixa', source: 'brapi' })
    } else {
      factors.push({ name: 'IBOV', signal: 0, description: 'Na região da MM200', source: 'brapi' })
    }
  }

  // 4. Inflation
  const inflacao = byCategory.get('ipca')
  if (inflacao) {
    const probHighInflation = inflacao.probability / 100
    if (probHighInflation > 0.7) {
      factors.push({ name: 'Inflação', signal: -0.4, description: 'Inflação pressionada', source: 'Kalshi + BCB' })
    } else if (probHighInflation < 0.3) {
      factors.push({ name: 'Inflação', signal: +0.3, description: 'Inflação controlada', source: 'Kalshi + BCB' })
    }
  }

  // Aggregate signal
  if (factors.length === 0) {
    return { signal: 0, label: 'NEUTRO', factors: [] }
  }

  const avgSignal = factors.reduce((sum, f) => sum + f.signal, 0) / factors.length
  const clamped = Math.max(-1, Math.min(1, avgSignal))

  return {
    signal: clamped,
    label: clamped > 0.3 ? 'BULL' : clamped < -0.3 ? 'BEAR' : 'NEUTRO',
    factors,
  }
}
