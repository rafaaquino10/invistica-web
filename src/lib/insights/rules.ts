/**
 * Automated Insights Engine — Rules
 *
 * Rules-based engine that detects patterns in stock data
 * and generates actionable insights for the Radar feed.
 *
 * Each rule is deterministic (no Math.random) and works
 * without score history data.
 */

import type { AssetData } from '../data-source'

// ─── Types ──────────────────────────────────────────────────

export interface Insight {
  id: string
  type: InsightType
  category: 'opportunity' | 'risk' | 'info' | 'milestone'
  severity: 'low' | 'medium' | 'high'
  ticker?: string
  sector?: string
  title: string
  description: string
  data: Record<string, unknown>
  actionable: boolean
  action?: string
  createdAt: string
  expiresAt: string
}

export type InsightType =
  | 'undervalued_quality'
  | 'dividend_opportunity'
  | 'score_upgrade'
  | 'score_downgrade'
  | 'sector_leader'
  | 'sector_rotation'
  | 'high_leverage'
  | 'market_extreme'
  | 'score_milestone'
  | 'thesis_broken'
  | 'liquidity_warning'
  | 'recovery_candidate'
  | 'kill_switch_critical'
  | 'momentum_shift'

export interface SectorStats {
  count: number
  medianScore: number
  averageScore: number
  medianDY: number
  medianDivBrutPatrim: number
}

export interface InsightContext {
  assets: AssetData[]
  sectorAverages: Record<string, SectorStats>
}

export interface InsightRule {
  name: string
  category: Insight['category']
  detect: (ctx: InsightContext) => Partial<Insight>[]
}

// ─── Rules ──────────────────────────────────────────────────

/**
 * Rule 1: Undervalued Quality
 * High quality company with good valuation score but low total score.
 * scoreQuality >= 75 AND scoreValuation >= 65 AND scoreTotal < 65
 */
const undervaluedQualityRule: InsightRule = {
  name: 'undervalued_quality',
  category: 'opportunity',
  detect(ctx) {
    const results: Partial<Insight>[] = []
    for (const a of ctx.assets) {
      if (!a.aqScore) continue
      const { scoreQuality, scoreValuation, scoreTotal } = a.aqScore
      if (scoreQuality >= 75 && scoreValuation >= 65 && scoreTotal < 65) {
        results.push({
          type: 'undervalued_quality',
          category: 'opportunity',
          severity: 'high',
          ticker: a.ticker,
          sector: a.sector,
          title: `${a.ticker} pode estar subvalorizada`,
          description: `Qualidade ${scoreQuality.toFixed(0)} e valuation ${scoreValuation.toFixed(0)} elevados, mas score total de apenas ${scoreTotal.toFixed(0)}. Pode representar uma oportunidade.`,
          data: { scoreQuality, scoreValuation, scoreTotal },
          actionable: true,
          action: `Analisar ${a.ticker}`,
        })
      }
    }
    return results
  },
}

/**
 * Rule 2: Dividend Opportunity
 * DY > 2x sector median AND scoreRisk >= 55
 */
const dividendOpportunityRule: InsightRule = {
  name: 'dividend_opportunity',
  category: 'opportunity',
  detect(ctx) {
    const results: Partial<Insight>[] = []
    for (const a of ctx.assets) {
      if (!a.aqScore || !a.fundamentals?.dividendYield) continue
      const sectorStats = ctx.sectorAverages[a.sector]
      if (!sectorStats || sectorStats.medianDY <= 0) continue
      const dy = a.fundamentals.dividendYield
      if (dy > 2 * sectorStats.medianDY && a.aqScore.scoreRisk >= 55) {
        results.push({
          type: 'dividend_opportunity',
          category: 'opportunity',
          severity: 'medium',
          ticker: a.ticker,
          sector: a.sector,
          title: `${a.ticker}: DY de ${dy.toFixed(1)}% destaca no setor`,
          description: `Dividend Yield ${(dy / sectorStats.medianDY).toFixed(1)}x acima da mediana do setor (${sectorStats.medianDY.toFixed(1)}%) com risco controlado (${a.aqScore.scoreRisk.toFixed(0)}).`,
          data: { dy, sectorMedianDY: sectorStats.medianDY, scoreRisk: a.aqScore.scoreRisk },
          actionable: true,
          action: `Ver dividendos de ${a.ticker}`,
        })
      }
    }
    return results
  },
}

/**
 * Rule 3: Sector Leader
 * Top scorer per sector if score > 70
 */
const sectorLeaderRule: InsightRule = {
  name: 'sector_leader',
  category: 'info',
  detect(ctx) {
    const results: Partial<Insight>[] = []
    // Group by sector
    const bySector: Record<string, AssetData[]> = {}
    for (const a of ctx.assets) {
      if (!a.aqScore) continue
      const sector = a.sector || 'Outros'
      if (!bySector[sector]) bySector[sector] = []
      bySector[sector]!.push(a)
    }
    for (const [sector, stocks] of Object.entries(bySector)) {
      if (stocks.length < 2) continue
      const sorted = [...stocks].sort((a, b) => (b.aqScore?.scoreTotal ?? 0) - (a.aqScore?.scoreTotal ?? 0))
      const leader = sorted[0]!
      if (leader.aqScore && leader.aqScore.scoreTotal > 70) {
        results.push({
          type: 'sector_leader',
          category: 'info',
          severity: 'low',
          ticker: leader.ticker,
          sector,
          title: `${leader.ticker} lidera o setor ${sector}`,
          description: `Com score ${leader.aqScore.scoreTotal.toFixed(0)}, ${leader.ticker} é a melhor avaliada entre ${stocks.length} ações do setor.`,
          data: { scoreTotal: leader.aqScore.scoreTotal, sectorCount: stocks.length },
          actionable: true,
          action: `Ver ${leader.ticker}`,
        })
      }
    }
    return results
  },
}

/**
 * Rule 4: Sector Rotation
 * >65% of stocks in a sector moving same direction (need >=5 stocks)
 */
const sectorRotationRule: InsightRule = {
  name: 'sector_rotation',
  category: 'info',
  detect(ctx) {
    const results: Partial<Insight>[] = []
    const bySector: Record<string, AssetData[]> = {}
    for (const a of ctx.assets) {
      const sector = a.sector || 'Outros'
      if (!bySector[sector]) bySector[sector] = []
      bySector[sector]!.push(a)
    }
    for (const [sector, stocks] of Object.entries(bySector)) {
      if (stocks.length < 5) continue
      const positiveCount = stocks.filter(s => s.changePercent > 0).length
      const negativeCount = stocks.filter(s => s.changePercent < 0).length
      const total = stocks.length
      if (positiveCount / total > 0.65) {
        results.push({
          type: 'sector_rotation',
          category: 'info',
          severity: 'medium',
          sector,
          title: `Setor ${sector} em alta generalizada`,
          description: `${positiveCount} de ${total} ações (${((positiveCount / total) * 100).toFixed(0)}%) do setor estão em alta. Pode indicar rotação setorial.`,
          data: { positiveCount, total, direction: 'up' },
          actionable: false,
        })
      } else if (negativeCount / total > 0.65) {
        results.push({
          type: 'sector_rotation',
          category: 'info',
          severity: 'medium',
          sector,
          title: `Setor ${sector} em queda generalizada`,
          description: `${negativeCount} de ${total} ações (${((negativeCount / total) * 100).toFixed(0)}%) do setor estão em queda. Pode indicar rotação setorial.`,
          data: { negativeCount, total, direction: 'down' },
          actionable: false,
        })
      }
    }
    return results
  },
}

/**
 * Rule 5: High Leverage
 * divBrutPatrim > 2x sector median AND scoreRisk < 40
 */
const highLeverageRule: InsightRule = {
  name: 'high_leverage',
  category: 'risk',
  detect(ctx) {
    const results: Partial<Insight>[] = []
    for (const a of ctx.assets) {
      if (!a.aqScore || !a.fundamentals?.divBrutPatrim) continue
      const sectorStats = ctx.sectorAverages[a.sector]
      if (!sectorStats || sectorStats.medianDivBrutPatrim <= 0) continue
      const dbp = a.fundamentals.divBrutPatrim
      if (dbp > 2 * sectorStats.medianDivBrutPatrim && a.aqScore.scoreRisk < 40) {
        results.push({
          type: 'high_leverage',
          category: 'risk',
          severity: 'high',
          ticker: a.ticker,
          sector: a.sector,
          title: `${a.ticker}: alavancagem elevada`,
          description: `Div. Bruta/Patrim. de ${dbp.toFixed(1)} e ${(dbp / sectorStats.medianDivBrutPatrim).toFixed(1)}x a mediana do setor. Score de risco baixo (${a.aqScore.scoreRisk.toFixed(0)}).`,
          data: { divBrutPatrim: dbp, sectorMedian: sectorStats.medianDivBrutPatrim, scoreRisk: a.aqScore.scoreRisk },
          actionable: true,
          action: `Avaliar risco de ${a.ticker}`,
        })
      }
    }
    return results
  },
}

/**
 * Rule 6: Market Extreme
 * Average market score < 40 (pessimistic) or > 65 (optimistic)
 */
const marketExtremeRule: InsightRule = {
  name: 'market_extreme',
  category: 'info',
  detect(ctx) {
    const results: Partial<Insight>[] = []
    const scores = ctx.assets
      .map(a => a.aqScore?.scoreTotal)
      .filter((s): s is number => s != null)
    if (scores.length === 0) return results
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length
    if (avg < 40) {
      results.push({
        type: 'market_extreme',
        category: 'info',
        severity: 'high',
        title: 'Mercado em território pessimista',
        description: `Score médio do mercado é ${avg.toFixed(1)}. Pode representar oportunidade de compra para investidores de longo prazo.`,
        data: { averageScore: avg, direction: 'pessimistic', stockCount: scores.length },
        actionable: false,
      })
    } else if (avg > 65) {
      results.push({
        type: 'market_extreme',
        category: 'info',
        severity: 'medium',
        title: 'Mercado em território otimista',
        description: `Score médio do mercado é ${avg.toFixed(1)}. Considere cautela ao abrir novas posições.`,
        data: { averageScore: avg, direction: 'optimistic', stockCount: scores.length },
        actionable: false,
      })
    }
    return results
  },
}

/**
 * Rule 7: Liquidity Warning
 * liq2meses < 100000 AND score > 60 (good company but illiquid)
 */
const liquidityWarningRule: InsightRule = {
  name: 'liquidity_warning',
  category: 'risk',
  detect(ctx) {
    const results: Partial<Insight>[] = []
    for (const a of ctx.assets) {
      if (!a.aqScore || a.fundamentals?.liq2meses == null) continue
      const liq = a.fundamentals.liq2meses
      if (liq < 100000 && a.aqScore.scoreTotal > 60) {
        results.push({
          type: 'liquidity_warning',
          category: 'risk',
          severity: 'medium',
          ticker: a.ticker,
          sector: a.sector,
          title: `${a.ticker}: baixa liquidez`,
          description: `Score de ${a.aqScore.scoreTotal.toFixed(0)} mas liquidez de apenas R$ ${(liq / 1000).toFixed(0)}k/dia. Dificuldade para entrar/sair da posição.`,
          data: { liq2meses: liq, scoreTotal: a.aqScore.scoreTotal },
          actionable: true,
          action: `Ver ${a.ticker}`,
        })
      }
    }
    return results
  },
}

/**
 * Rule 8: Score Milestone
 * scoreTotal >= 85 (exceptional stock)
 */
const scoreMilestoneRule: InsightRule = {
  name: 'score_milestone',
  category: 'milestone',
  detect(ctx) {
    const results: Partial<Insight>[] = []
    for (const a of ctx.assets) {
      if (!a.aqScore) continue
      if (a.aqScore.scoreTotal >= 85) {
        results.push({
          type: 'score_milestone',
          category: 'milestone',
          severity: 'low',
          ticker: a.ticker,
          sector: a.sector,
          title: `${a.ticker} é Excepcional (${a.aqScore.scoreTotal.toFixed(0)})`,
          description: `${a.name} atingiu score ${a.aqScore.scoreTotal.toFixed(0)}, classificação Excepcional. Uma das melhores ações avaliadas pelo aQ Score.`,
          data: { scoreTotal: a.aqScore.scoreTotal },
          actionable: true,
          action: `Analisar ${a.ticker}`,
        })
      }
    }
    return results
  },
}

/**
 * Rule 9: Kill Switch Critical
 * Triggered when critical news event zeros out an asset's score.
 */
const killSwitchCriticalRule: InsightRule = {
  name: 'kill_switch_critical',
  category: 'risk',
  detect(ctx) {
    const results: Partial<Insight>[] = []
    for (const a of ctx.assets) {
      if (!a.killSwitch?.triggered) continue
      results.push({
        type: 'kill_switch_critical',
        severity: 'high',
        ticker: a.ticker,
        sector: a.sector,
        title: `ALERTA CRÍTICO: ${a.ticker}`,
        description: a.killSwitch.reason ?? 'Evento crítico detectado nas notícias — score zerado',
        actionable: true,
        action: `Revisar posição em ${a.ticker} imediatamente`,
        data: { reason: a.killSwitch.reason },
      })
    }
    return results
  },
}

/**
 * Rule 10: Momentum Shift
 * Detects assets with strong momentum signal (BULL opportunity or BEAR warning)
 * Requires lensScores.momentum to be populated (Fase D)
 */
const momentumShiftRule: InsightRule = {
  name: 'momentum_shift',
  category: 'opportunity',
  detect(ctx) {
    const results: Partial<Insight>[] = []
    for (const a of ctx.assets) {
      if (!a.lensScores?.momentum || !a.aqScore) continue
      const mom = a.lensScores.momentum
      if (mom >= 70 && a.aqScore.scoreTotal >= 55) {
        results.push({
          type: 'momentum_shift',
          category: 'opportunity',
          severity: 'medium',
          ticker: a.ticker,
          sector: a.sector,
          title: `${a.ticker}: momento favorável`,
          description: `Momento forte (${mom.toFixed(0)}) combinado com score ${a.aqScore.scoreTotal.toFixed(0)}. Sinal positivo para entrada.`,
          data: { momentum: mom, scoreTotal: a.aqScore.scoreTotal },
          actionable: true,
          action: `Ver ${a.ticker}`,
        })
      } else if (mom <= 25 && a.aqScore.scoreTotal >= 50) {
        results.push({
          type: 'momentum_shift',
          category: 'risk',
          severity: 'medium',
          ticker: a.ticker,
          sector: a.sector,
          title: `${a.ticker}: momento desfavorável`,
          description: `Momento fraco (${mom.toFixed(0)}) apesar de score ${a.aqScore.scoreTotal.toFixed(0)}. Cautela com novas posições.`,
          data: { momentum: mom, scoreTotal: a.aqScore.scoreTotal },
          actionable: true,
          action: `Avaliar ${a.ticker}`,
        })
      }
    }
    return results
  },
}

// ─── Export All Rules ────────────────────────────────────────

export const ALL_RULES: InsightRule[] = [
  undervaluedQualityRule,
  dividendOpportunityRule,
  sectorLeaderRule,
  sectorRotationRule,
  highLeverageRule,
  marketExtremeRule,
  liquidityWarningRule,
  scoreMilestoneRule,
  killSwitchCriticalRule,
  momentumShiftRule,
]
