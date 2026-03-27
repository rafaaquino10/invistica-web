// ─── Smart Portfolio Engine ──────────────────────────────────
// Filters and ranks stocks based on portfolio criteria.
// All filters are AND — stock must satisfy ALL criteria.
// Progressive relaxation ensures portfolios ALWAYS return recommendations.

import type { AssetData } from '../data-source'
import type { SmartPortfolio, PortfolioCriteria, QualifiedStock, SmartPortfolioResult, AlmostQualified } from './types'
import type { MultiLensScores } from '../scoring/lenses'
import type { MacroRegime } from '../scoring/regime-detector'
import { SMART_PORTFOLIOS } from './portfolios'
import { getRegimeCalibration, applyExtraFilters, type RegimeCalibration } from './regime-calibration'

// Minimum liquidity threshold (R$ volume in 2 months)
const MIN_LIQUIDITY_VOLUME = 100_000

/**
 * Get effective liquidity for an asset.
 * Uses liq2meses when available, otherwise falls back to daily volume × price
 * from quotes data as a proxy (annualized approximation).
 */
function getEffectiveLiquidity(asset: AssetData): number {
  if (asset.fundamentals.liq2meses != null) return asset.fundamentals.liq2meses
  // Fallback: daily volume in BRL as proxy
  return (asset.volume ?? 0) * (asset.price ?? 0)
}

// Minimum results before triggering progressive relaxation
const MIN_RESULTS = 3

/**
 * Get the lens score for a given lens key from MultiLensScores.
 */
function getLensScore(lensScores: MultiLensScores | null, lens: string): number | null {
  if (!lensScores) return null
  const key = lens as keyof MultiLensScores
  const val = lensScores[key]
  return typeof val === 'number' ? val : null
}

/**
 * Get the sort value for an asset based on the portfolio's sortBy field.
 * Supports dot notation: 'lensScores.value', 'fundamentals.dividendYield', etc.
 */
function getSortValue(asset: AssetData, sortBy: string): number {
  if (sortBy.startsWith('lensScores.')) {
    const lens = sortBy.split('.')[1]!
    return getLensScore(asset.lensScores, lens) ?? 0
  }
  if (sortBy === 'scoreTotal') {
    return asset.iqScore?.scoreTotal ?? 0
  }
  if (sortBy.startsWith('fundamentals.')) {
    const field = sortBy.split('.')[1]! as keyof AssetData['fundamentals']
    return (asset.fundamentals[field] as number | null) ?? 0
  }
  return 0
}

// ─── Relaxation Levels ──────────────────────────────────────
// Each level removes a constraint to broaden results.
// Level 0: full strict criteria
// Level 1: drop minConfidence
// Level 2: drop minLensScore
// Level 3: lower minScore by 15 points
// Level 4: drop regime extra filters + lower fundamental thresholds
// Level 5: bare minimum — only hasFundamentals + score > 0

interface RelaxationOverrides {
  skipConfidence?: boolean
  skipLensScore?: boolean
  scoreReduction?: number
  skipExtraFilters?: boolean
  relaxFundamentals?: boolean
}

const RELAXATION_LEVELS: RelaxationOverrides[] = [
  {},                                                          // L0: strict
  { skipConfidence: true },                                    // L1: drop confidence
  { skipConfidence: true, skipLensScore: true },               // L2: + drop lens
  { skipConfidence: true, skipLensScore: true, scoreReduction: 15 }, // L3: + lower score
  { skipConfidence: true, skipLensScore: true, scoreReduction: 15, skipExtraFilters: true, relaxFundamentals: true }, // L4: relax all
]

/**
 * Filter and rank stocks for a single smart portfolio.
 * Uses progressive relaxation to ensure portfolios ALWAYS return results.
 */
export function filterAndRankPortfolio(
  portfolio: SmartPortfolio,
  assets: AssetData[],
  regime?: MacroRegime,
): QualifiedStock[] {
  const calibration = regime ? getRegimeCalibration(portfolio.id, regime) : null

  for (let level = 0; level < RELAXATION_LEVELS.length; level++) {
    const relaxation = RELAXATION_LEVELS[level]!
    const result = runFilter(portfolio, assets, calibration, relaxation)
    if (result.length >= MIN_RESULTS) {
      if (level > 0) {
        console.log(`[smart-portfolios] ${portfolio.id}: relaxation level ${level} → ${result.length} stocks`)
      }
      return result
    }
  }

  // Absolute fallback: top N scored assets with fundamentals
  return fallbackTopN(portfolio, assets)
}

/**
 * Absolute fallback: return top N assets sorted by the portfolio's lens.
 * Keeps portfolio differentiation even when all criteria are dropped.
 */
function fallbackTopN(portfolio: SmartPortfolio, assets: AssetData[]): QualifiedStock[] {
  const lensKey = portfolio.sortBy.startsWith('lensScores.')
    ? portfolio.sortBy.split('.')[1]!
    : 'general'
  const sortBy = portfolio.sortBy

  const scored = assets
    .filter(a => {
      if (!a.iqScore || !a.hasFundamentals || a.iqScore.scoreTotal <= 0) return false
      if (portfolio.thesisGuard && !portfolio.thesisGuard(a)) return false
      return true
    })
    .sort((a, b) => getSortValue(b, sortBy) - getSortValue(a, sortBy))
    .slice(0, portfolio.maxStocks)

  console.log(`[smart-portfolios] ${portfolio.id}: absolute fallback (sorted by ${sortBy}) → ${scored.length} stocks`)

  return scored.map((a, i) => ({
    ticker: a.ticker,
    name: a.name,
    sector: a.sector,
    price: a.price,
    score: a.iqScore!.scoreTotal,
    lensScore: getLensScore(a.lensScores, lensKey) ?? a.iqScore!.scoreTotal,
    dy: a.fundamentals.dividendYield,
    peRatio: a.fundamentals.peRatio,
    roe: a.fundamentals.roe,
    divEbitda: a.fundamentals.netDebtEbitda,
    confidence: a.iqScore!.confidence,
    rank: i + 1,
  }))
}

/**
 * Core filter with relaxation overrides applied.
 */
function runFilter(
  portfolio: SmartPortfolio,
  assets: AssetData[],
  calibration: RegimeCalibration | null,
  relaxation: RelaxationOverrides,
): QualifiedStock[] {
  const { criteria } = portfolio

  // Aplica overrides de regime nos critérios efetivos
  const baseMinScore = calibration?.adjustments.minScoreOverride ?? criteria.minScore
  const effectiveMinScore = baseMinScore != null
    ? Math.max(0, baseMinScore - (relaxation.scoreReduction ?? 0))
    : undefined
  const effectiveMaxDivEbitda = relaxation.relaxFundamentals
    ? (criteria.maxDivEbitda != null ? criteria.maxDivEbitda * 1.5 : undefined)
    : (calibration?.adjustments.maxDivEbitdaOverride ?? criteria.maxDivEbitda)
  const effectiveMinDY = relaxation.relaxFundamentals
    ? (criteria.minDY != null ? Math.max(4, criteria.minDY - 1) : undefined)
    : (calibration?.adjustments.minDYOverride ?? criteria.minDY)
  const effectiveMinROE = relaxation.relaxFundamentals
    ? (criteria.minROE != null ? Math.max(0, criteria.minROE - 5) : undefined)
    : (calibration?.adjustments.minROEOverride ?? criteria.minROE)
  const effectiveSortBy = calibration?.adjustments.sortOverride ?? portfolio.sortBy
  const useExtraFilters = !relaxation.skipExtraFilters

  // ─── Quant Puro: top N por score, sem filtros de setor ─────
  if (criteria.customFilter === 'quant_top_n') {
    const minLiq = criteria.minLiquidity ?? 1_000_000
    const minConf = relaxation.skipConfidence ? 0 : (criteria.minConfidence ?? 70)
    const topN = criteria.topN ?? 20
    const minScore = effectiveMinScore ?? 0

    let candidates = assets.filter(a => {
      if (!a.iqScore || !a.hasFundamentals) return false
      if (a.iqScore.confidence < minConf) return false
      if (a.iqScore.scoreTotal < minScore) return false
      if (getEffectiveLiquidity(a) < minLiq) return false
      return true
    })

    // Extra filters do regime
    if (useExtraFilters && calibration?.adjustments.extraFilters?.length) {
      candidates = applyExtraFilters(candidates, calibration.adjustments.extraFilters, a => a.fundamentals)
    }

    candidates.sort((a, b) => {
      const aVal = getSortValue(a, effectiveSortBy)
      const bVal = getSortValue(b, effectiveSortBy)
      return bVal - aVal
    })

    // Sector concentration limit: max N% per sector
    let selected = candidates
    if (criteria.maxSectorPct != null && criteria.maxSectorPct > 0) {
      const maxPerSector = Math.max(1, Math.ceil(topN * criteria.maxSectorPct / 100))
      const sectorCount: Record<string, number> = {}
      selected = candidates.filter(a => {
        const count = sectorCount[a.sector] ?? 0
        if (count >= maxPerSector) return false
        sectorCount[a.sector] = count + 1
        return true
      })
    }

    const result = selected.slice(0, topN)

    // Weight calculation: score-weighted or equal
    const totalScore = criteria.balanceRule === 'score_weight'
      ? result.reduce((s, a) => s + a.iqScore!.scoreTotal, 0)
      : 0

    return result.map((a, i) => ({
      ticker: a.ticker,
      name: a.name,
      sector: a.sector,
      price: a.price,
      score: a.iqScore!.scoreTotal,
      lensScore: a.iqScore!.scoreTotal,
      dy: a.fundamentals.dividendYield,
      peRatio: a.fundamentals.peRatio,
      roe: a.fundamentals.roe,
      divEbitda: a.fundamentals.netDebtEbitda,
      confidence: a.iqScore!.confidence,
      rank: i + 1,
      weight: criteria.balanceRule === 'score_weight' && totalScore > 0
        ? Math.round((a.iqScore!.scoreTotal / totalScore) * 1000) / 10
        : criteria.balanceRule === 'equal_weight'
          ? 100 / topN
          : undefined,
    }))
  }

  // Momentum portfolio: only include stocks with BULL momentum (lens score > 60)
  if (criteria.customFilter === 'momentum_bull') {
    const momentumQualified: QualifiedStock[] = []
    const momThreshold = relaxation.skipLensScore ? 40 : 60

    for (const asset of assets) {
      if (!asset.iqScore || !asset.hasFundamentals) continue
      if (!asset.lensScores || asset.lensScores.momentum == null) continue
      if (asset.lensScores.momentum < momThreshold) continue

      // Basic quality gate (regime-adjusted)
      const momMinScore = effectiveMinScore ?? 0
      if (momMinScore > 0 && asset.iqScore.scoreTotal < momMinScore) continue
      if (!relaxation.skipConfidence && criteria.minConfidence != null && asset.iqScore.confidence < criteria.minConfidence) continue

      // Liquidity filter
      if (getEffectiveLiquidity(asset) < MIN_LIQUIDITY_VOLUME) continue

      // Extra filters do regime
      if (useExtraFilters && calibration?.adjustments.extraFilters?.length) {
        const passesExtra = calibration.adjustments.extraFilters.every(f => {
          const val = (asset.fundamentals as any)[f.field]
          if (val == null) return false
          switch (f.op) {
            case 'lt': return val < f.value
            case 'gt': return val > f.value
            case 'lte': return val <= f.value
            case 'gte': return val >= f.value
            default: return true
          }
        })
        if (!passesExtra) continue
      }

      momentumQualified.push({
        ticker: asset.ticker,
        name: asset.name,
        sector: asset.sector,
        price: asset.price,
        score: asset.iqScore.scoreTotal,
        lensScore: asset.lensScores.momentum,
        dy: asset.fundamentals.dividendYield,
        peRatio: asset.fundamentals.peRatio,
        roe: asset.fundamentals.roe,
        divEbitda: asset.fundamentals.netDebtEbitda,
        confidence: asset.iqScore.confidence,
        rank: 0,
      })
    }

    // Sort by momentum lens score descending
    momentumQualified.sort((a, b) => b.lensScore - a.lensScore)
    const result = momentumQualified.slice(0, portfolio.maxStocks)
    for (let i = 0; i < result.length; i++) {
      result[i]!.rank = i + 1
    }
    return result
  }

  const qualified: QualifiedStock[] = []

  for (const asset of assets) {
    if (!asset.iqScore || !asset.hasFundamentals) continue

    // Thesis guard: hard filter that is NEVER relaxed
    if (portfolio.thesisGuard && !portfolio.thesisGuard(asset)) continue

    const { iqScore, fundamentals, lensScores } = asset

    // ─── AND filters (regime-adjusted) ────────────────────
    if (effectiveMinScore != null && iqScore?.scoreTotal < effectiveMinScore) continue
    if (!relaxation.skipConfidence && criteria.minConfidence != null && iqScore?.confidence < criteria.minConfidence) continue

    // Lens score filter
    if (!relaxation.skipLensScore && criteria.minLensScore) {
      const lensVal = getLensScore(lensScores, criteria.minLensScore.lens)
      if (lensVal == null || lensVal < criteria.minLensScore.min) continue
    }

    // Fundamental filters (regime-adjusted)
    if (criteria.maxPL != null) {
      if (fundamentals.peRatio == null || fundamentals.peRatio <= 0 || fundamentals.peRatio > criteria.maxPL) continue
    }
    if (effectiveMinROE != null) {
      if (fundamentals.roe == null || fundamentals.roe < effectiveMinROE) continue
    }
    if (effectiveMaxDivEbitda != null) {
      if (fundamentals.netDebtEbitda != null && fundamentals.netDebtEbitda > effectiveMaxDivEbitda) continue
    }
    if (effectiveMinDY != null) {
      if (fundamentals.dividendYield == null || fundamentals.dividendYield < effectiveMinDY) continue
    }
    if (criteria.maxDY != null) {
      if (fundamentals.dividendYield != null && fundamentals.dividendYield > criteria.maxDY) continue
    }
    if (criteria.minMarginLiq != null) {
      if (fundamentals.margemLiquida == null || fundamentals.margemLiquida < criteria.minMarginLiq) continue
    }
    if (criteria.minMarginEbit != null) {
      if (fundamentals.margemEbit == null || fundamentals.margemEbit < criteria.minMarginEbit) continue
    }
    if (criteria.maxPayout != null) {
      // Payout > max = insustentável (null = sem dados, passa)
      if ((fundamentals as any).payout != null && (fundamentals as any).payout > criteria.maxPayout) continue
    }
    if (criteria.minScoreRisk != null) {
      if ((iqScore as any).scoreQuanti == null || (iqScore as any).scoreQuanti < criteria.minScoreRisk) continue
    }
    if (criteria.minScoreQuality != null) {
      if ((iqScore as any).scoreQuanti == null || (iqScore as any).scoreQuanti < criteria.minScoreQuality) continue
    }
    if (criteria.minCrescRec5a != null) {
      if (fundamentals.crescimentoReceita5a == null || fundamentals.crescimentoReceita5a < criteria.minCrescRec5a) continue
    }
    if (criteria.maxBeta != null) {
      // Beta não está em fundamentals mas no scoreBreakdown — usar proxy do iqScore?
      // Se beta indisponível, não filtrar (dar o benefício da dúvida)
    }
    if (criteria.minMarketCap != null) {
      if (asset.marketCap == null || asset.marketCap < criteria.minMarketCap) continue
    }

    // Liquidity filter (proxy for minLiquidityFactor)
    if (criteria.minLiquidityFactor != null) {
      if (getEffectiveLiquidity(asset) < MIN_LIQUIDITY_VOLUME) continue
    }

    // Sector filters
    if (criteria.sectors && criteria.sectors.length > 0) {
      if (!criteria.sectors.includes(asset.sector)) continue
    }
    if (criteria.excludeSectors && criteria.excludeSectors.length > 0) {
      if (criteria.excludeSectors.includes(asset.sector)) continue
    }

    // Extra filters do regime
    if (useExtraFilters && calibration?.adjustments.extraFilters?.length) {
      const passesExtra = calibration.adjustments.extraFilters.every(f => {
        const val = (fundamentals as any)[f.field]
        if (val == null) return false
        switch (f.op) {
          case 'lt': return val < f.value
          case 'gt': return val > f.value
          case 'lte': return val <= f.value
          case 'gte': return val >= f.value
          default: return true
        }
      })
      if (!passesExtra) continue
    }

    // ─── Qualified! ──────────────────────────────────────
    const lensKey = portfolio.sortBy.startsWith('lensScores.')
      ? portfolio.sortBy.split('.')[1]!
      : 'general'

    qualified.push({
      ticker: asset.ticker,
      name: asset.name,
      sector: asset.sector,
      price: asset.price,
      score: iqScore?.scoreTotal,
      lensScore: getLensScore(lensScores, lensKey) ?? iqScore?.scoreTotal,
      dy: fundamentals.dividendYield,
      peRatio: fundamentals.peRatio,
      roe: fundamentals.roe,
      divEbitda: fundamentals.netDebtEbitda,
      confidence: iqScore?.confidence,
      rank: 0, // assigned after sort
    })
  }

  // ─── Sort (regime-adjusted) ─────────────────────────────
  const sortBy = effectiveSortBy
  const dir = portfolio.sortDirection === 'asc' ? -1 : 1

  qualified.sort((a, b) => {
    const aVal = getSortValue(
      assets.find(x => x.ticker === a.ticker)!,
      sortBy,
    )
    const bVal = getSortValue(
      assets.find(x => x.ticker === b.ticker)!,
      sortBy,
    )
    return (bVal - aVal) * dir
  })

  // ─── Limit + assign ranks ─────────────────────────────
  const result = qualified.slice(0, portfolio.maxStocks)
  for (let i = 0; i < result.length; i++) {
    result[i]!.rank = i + 1
  }

  return result
}

/**
 * Run the engine for all 7 smart portfolios.
 */
export function getAllSmartPortfolios(assets: AssetData[], regime?: MacroRegime): SmartPortfolioResult[] {
  return SMART_PORTFOLIOS.map(portfolio => ({
    portfolio,
    stocks: filterAndRankPortfolio(portfolio, assets, regime),
    generatedAt: new Date(),
  }))
}

/**
 * Retorna ativos que estão quase qualificados para uma carteira —
 * aqueles que falham em no máximo `maxMissed` critérios.
 * Útil quando a carteira está vazia ou com poucos ativos.
 */
export function getClosestToQualifying(
  portfolio: SmartPortfolio,
  assets: AssetData[],
  maxMissed: number = 2,
): AlmostQualified[] {
  const { criteria } = portfolio
  const result: AlmostQualified[] = []

  // Portfólio de momentum usa customFilter — avaliamos os critérios básicos manualmente
  const isMomentum = criteria.customFilter === 'momentum_bull'

  for (const asset of assets) {
    if (!asset.iqScore || !asset.hasFundamentals) continue

    const { iqScore, fundamentals, lensScores } = asset
    const faltando: string[] = []

    if (isMomentum) {
      // Critério principal: momentum lens > 60
      if (!lensScores || lensScores.momentum == null || lensScores.momentum < 60) {
        const atual = lensScores?.momentum != null ? lensScores.momentum.toFixed(0) : 'N/D'
        faltando.push(`Momentum: ${atual} (precisa >60)`)
      }
      // Score mínimo
      if (criteria.minScore != null && iqScore?.scoreTotal < criteria.minScore) {
        faltando.push(`Score: ${iqScore?.scoreTotal.toFixed(0)} (precisa ${criteria.minScore})`)
      }
      // Confiança
      if (criteria.minConfidence != null && iqScore?.confidence < criteria.minConfidence) {
        faltando.push(`Confiança: ${iqScore?.confidence.toFixed(0)}% (precisa ${criteria.minConfidence}%)`)
      }
    } else {
      // Score mínimo
      if (criteria.minScore != null && iqScore?.scoreTotal < criteria.minScore) {
        faltando.push(`Score: ${iqScore?.scoreTotal.toFixed(0)} (precisa ${criteria.minScore})`)
      }

      // Confiança mínima
      if (criteria.minConfidence != null && iqScore?.confidence < criteria.minConfidence) {
        faltando.push(`Confiança: ${iqScore?.confidence.toFixed(0)}% (precisa ${criteria.minConfidence}%)`)
      }

      // Lens score
      if (criteria.minLensScore) {
        const lensVal = getLensScore(lensScores, criteria.minLensScore.lens)
        if (lensVal == null || lensVal < criteria.minLensScore.min) {
          const lensNome = criteria.minLensScore.lens
          const atual = lensVal != null ? lensVal.toFixed(0) : 'N/D'
          faltando.push(`${lensNome}: ${atual} (precisa ${criteria.minLensScore.min})`)
        }
      }

      // P/L máximo
      if (criteria.maxPL != null) {
        if (fundamentals.peRatio == null || fundamentals.peRatio <= 0 || fundamentals.peRatio > criteria.maxPL) {
          const atual = fundamentals.peRatio != null ? `${fundamentals.peRatio.toFixed(1)}x` : 'N/D'
          faltando.push(`P/L: ${atual} (máx ${criteria.maxPL}x)`)
        }
      }

      // ROE mínimo
      if (criteria.minROE != null) {
        if (fundamentals.roe == null || fundamentals.roe < criteria.minROE) {
          const atual = fundamentals.roe != null ? `${fundamentals.roe.toFixed(1)}%` : 'N/D'
          faltando.push(`ROE: ${atual} (precisa ${criteria.minROE}%)`)
        }
      }

      // Dívida/EBITDA máxima
      if (criteria.maxDivEbitda != null) {
        if (fundamentals.netDebtEbitda != null && fundamentals.netDebtEbitda > criteria.maxDivEbitda) {
          faltando.push(`Dív/EBITDA: ${fundamentals.netDebtEbitda.toFixed(1)}x (máx ${criteria.maxDivEbitda}x)`)
        }
      }

      // DY mínimo
      if (criteria.minDY != null) {
        if (fundamentals.dividendYield == null || fundamentals.dividendYield < criteria.minDY) {
          const atual = fundamentals.dividendYield != null ? `${fundamentals.dividendYield.toFixed(1)}%` : 'N/D'
          faltando.push(`DY: ${atual} (precisa ${criteria.minDY}%)`)
        }
      }

      // DY máximo
      if (criteria.maxDY != null) {
        if (fundamentals.dividendYield != null && fundamentals.dividendYield > criteria.maxDY) {
          faltando.push(`DY: ${fundamentals.dividendYield.toFixed(1)}% (máx ${criteria.maxDY}%)`)
        }
      }

      // Margem líquida mínima
      if (criteria.minMarginLiq != null) {
        if (fundamentals.margemLiquida == null || fundamentals.margemLiquida < criteria.minMarginLiq) {
          const atual = fundamentals.margemLiquida != null ? `${fundamentals.margemLiquida.toFixed(1)}%` : 'N/D'
          faltando.push(`Margem Líq.: ${atual} (precisa ${criteria.minMarginLiq}%)`)
        }
      }

      // Setores permitidos
      if (criteria.sectors && criteria.sectors.length > 0) {
        if (!criteria.sectors.includes(asset.sector)) {
          faltando.push(`Setor: ${asset.sector} (fora dos setores elegíveis)`)
        }
      }

      // Setores excluídos
      if (criteria.excludeSectors && criteria.excludeSectors.length > 0) {
        if (criteria.excludeSectors.includes(asset.sector)) {
          faltando.push(`Setor: ${asset.sector} (setor excluído desta carteira)`)
        }
      }
    }

    // Liquidity — não aparece em criteriosFaltando pois é pré-requisito silencioso
    if (getEffectiveLiquidity(asset) < MIN_LIQUIDITY_VOLUME) continue

    // Incluir apenas os que faltam ≤ maxMissed critérios (e pelo menos 1)
    if (faltando.length === 0 || faltando.length > maxMissed) continue

    // Lens score para exibição
    const lensKey = portfolio.sortBy.startsWith('lensScores.')
      ? portfolio.sortBy.split('.')[1]!
      : 'general'

    result.push({
      ticker: asset.ticker,
      name: asset.name,
      sector: asset.sector,
      price: asset.price,
      score: iqScore?.scoreTotal,
      lensScore: getLensScore(lensScores, lensKey) ?? iqScore?.scoreTotal,
      dy: fundamentals.dividendYield,
      peRatio: fundamentals.peRatio,
      roe: fundamentals.roe,
      divEbitda: fundamentals.netDebtEbitda,
      confidence: iqScore?.confidence,
      criteriosFaltando: faltando,
    })
  }

  // Ordenar por menor número de critérios faltando, depois por score total desc
  result.sort((a, b) => {
    const diffMissed = a.criteriosFaltando.length - b.criteriosFaltando.length
    if (diffMissed !== 0) return diffMissed
    return b.score - a.score
  })

  // Retornar no máximo 10 quase qualificados
  return result.slice(0, 10)
}
