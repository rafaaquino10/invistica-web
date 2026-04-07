// ─── Sector Signal ───────────────────────────────────────────
// Sector-level momentum based on macro context + sector sensitivity.

import type { MacroSignal } from './macro-signal.js'
import {
  RATE_SENSITIVE_NEGATIVE,
  RATE_SENSITIVE_POSITIVE,
  FX_EXPORTERS,
  FX_IMPORTERS,
  COMMODITY_POSITIVE,
  CYCLICAL_SECTORS,
  DEFENSIVE_SECTORS,
  isSectorIn,
} from './sector-groups.js'

export interface SectorSignal {
  signal: number
  label: 'BULL' | 'NEUTRO' | 'BEAR'
  description: string
}

export interface SectorStock {
  ticker: string
  changePercent: number
}

/**
 * Calculate sector-level momentum signal.
 * Combines macro impact on the sector + intraday rotation.
 */
export function calculateSectorSignal(
  sectorName: string,
  macroSignal: MacroSignal,
  sectorStocks: SectorStock[],
): SectorSignal {
  let signal = 0
  const descriptions: string[] = []

  // 1. Interest rate impact on sector
  const rateSignal = macroSignal.factors.find(f => f.name === 'Juros')?.signal ?? 0
  if (rateSignal < -0.3) {
    // Rates rising
    if (isSectorIn(sectorName, RATE_SENSITIVE_NEGATIVE)) {
      signal -= 0.6
      descriptions.push('Juros em alta penaliza este setor')
    }
    if (isSectorIn(sectorName, RATE_SENSITIVE_POSITIVE)) {
      signal += 0.3
      descriptions.push('Juros em alta favorece spread bancário')
    }
  } else if (rateSignal > 0.3) {
    // Rates falling
    if (isSectorIn(sectorName, RATE_SENSITIVE_NEGATIVE)) {
      signal += 0.5
      descriptions.push('Juros em queda beneficia este setor')
    }
  }

  // 2. Dollar impact on sector
  const dollarSignal = macroSignal.factors.find(f => f.name === 'Dólar')?.signal ?? 0
  if (dollarSignal < -0.3) {
    // Dollar rising
    if (isSectorIn(sectorName, FX_EXPORTERS)) {
      signal += 0.4
      descriptions.push('Dólar forte favorece exportadoras')
    }
    if (isSectorIn(sectorName, FX_IMPORTERS)) {
      signal -= 0.4
      descriptions.push('Dólar forte pressiona custos deste setor')
    }
  } else if (dollarSignal > 0.3) {
    // Dollar falling
    if (isSectorIn(sectorName, FX_EXPORTERS)) {
      signal -= 0.2
      descriptions.push('Dólar fraco reduz receita de exportação')
    }
  }

  // 3. Commodity impact on sector
  const commoditySignal = macroSignal.factors.find(f => f.name === 'Commodities')?.signal ?? 0
  if (commoditySignal !== 0 && isSectorIn(sectorName, COMMODITY_POSITIVE)) {
    signal += commoditySignal * 0.4
    descriptions.push(commoditySignal > 0
      ? 'Commodities em alta favorece este setor'
      : 'Commodities em queda pressiona este setor')
  }

  // 4. Defensive vs cyclical in bearish macro
  const overallMacro = macroSignal.signal
  if (overallMacro < -0.3) {
    if (isSectorIn(sectorName, DEFENSIVE_SECTORS)) {
      signal += 0.2
      descriptions.push('Setor defensivo — resiliente em cenário adverso')
    }
    if (isSectorIn(sectorName, CYCLICAL_SECTORS)) {
      signal -= 0.2
      descriptions.push('Setor cíclico — mais vulnerável em cenário adverso')
    }
  }

  // 5. Sector rotation (% of stocks up/down today)
  if (sectorStocks.length >= 5) {
    const upCount = sectorStocks.filter(s => s.changePercent > 0).length
    const upRatio = upCount / sectorStocks.length
    if (upRatio > 0.7) {
      signal += 0.3
      descriptions.push(`${Math.round(upRatio * 100)}% do setor em alta hoje`)
    } else if (upRatio < 0.3) {
      signal -= 0.3
      descriptions.push(`${Math.round((1 - upRatio) * 100)}% do setor em baixa hoje`)
    }
  }

  const clamped = Math.max(-1, Math.min(1, signal))

  return {
    signal: clamped,
    label: clamped > 0.3 ? 'BULL' : clamped < -0.3 ? 'BEAR' : 'NEUTRO',
    description: descriptions.join('. ') || 'Sem sinal setorial forte',
  }
}
