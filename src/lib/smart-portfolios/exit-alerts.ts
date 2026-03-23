// ─── Exit Alerts Engine ──────────────────────────────────────
// Analyzes user positions against current market data and score
// history to generate actionable exit/reevaluation alerts.

import type { AssetData } from '../data-source'
import type { ExitAlert, UserPosition } from './types'
import { getScoreHistory } from '../score-history'
import { getSectorBenchmarks, mapearSetor } from '../scoring/aq-score'

const THESIS_BROKEN_THRESHOLD = -15
const QUALITY_DETERIORATION_THRESHOLD = -20
const RISK_CRITICAL_THRESHOLD = 30
const HISTORY_WINDOW_DAYS = 30

/**
 * Generate exit alerts for a user's portfolio positions.
 * Checks current market data + score history for concerning signals.
 */
export function generateExitAlerts(
  positions: UserPosition[],
  assets: AssetData[],
): ExitAlert[] {
  const alerts: ExitAlert[] = []
  const assetMap = new Map(assets.map(a => [a.ticker, a]))

  for (const position of positions) {
    const asset = assetMap.get(position.ticker)
    if (!asset || !asset.aqScore) continue

    // 1. THESIS BROKEN: Score dropped > 15 pts in 30 days
    const history = getScoreHistory(position.ticker, HISTORY_WINDOW_DAYS)
    if (history.length >= 2) {
      const oldest = history[0]!
      const latest = history[history.length - 1]!
      const scoreDelta = latest.score - oldest.score

      if (scoreDelta <= THESIS_BROKEN_THRESHOLD) {
        alerts.push({
          ticker: position.ticker,
          type: 'reavaliar',
          severity: 'critical',
          title: `${position.ticker} perdeu ${Math.abs(Math.round(scoreDelta))} pontos em 30 dias`,
          description: `Score caiu de ${oldest.score.toFixed(1)} para ${latest.score.toFixed(1)}. Possível mudança fundamental — revise sua tese.`,
          data: { delta: Math.round(scoreDelta), currentScore: latest.score, previousScore: oldest.score },
        })
      }

      // 3. QUALITY DETERIORATING: Quality pillar dropped > 20 pts
      const qualityDelta = latest.quality - oldest.quality
      if (qualityDelta <= QUALITY_DETERIORATION_THRESHOLD) {
        alerts.push({
          ticker: position.ticker,
          type: 'reavaliar',
          severity: 'warning',
          title: `Qualidade de ${position.ticker} deteriorando`,
          description: `Pilar Qualidade caiu ${Math.abs(Math.round(qualityDelta))} pontos. ROE ou margens podem estar comprimindo.`,
          data: { qualityDelta: Math.round(qualityDelta) },
        })
      }
    }

    // 2. FAIR VALUE REACHED: P/L >= sector benchmark fairPE
    const setor = mapearSetor(asset.sector)
    const benchmarks = getSectorBenchmarks(setor)
    if (benchmarks.fairPE != null && asset.fundamentals.peRatio != null) {
      if (asset.fundamentals.peRatio > 0 && asset.fundamentals.peRatio >= benchmarks.fairPE) {
        alerts.push({
          ticker: position.ticker,
          type: 'realizar_lucro',
          severity: 'warning',
          title: `${position.ticker} atingiu valuation justo`,
          description: `P/L de ${asset.fundamentals.peRatio.toFixed(1)}x atingiu o benchmark de ${benchmarks.fairPE}x para ${asset.sector}. Considere realizar.`,
          data: { pl: asset.fundamentals.peRatio, fairPE: benchmarks.fairPE },
        })
      }
    }

    // 4. RISING RISK: Risk pillar below critical threshold
    if (asset.aqScore.scoreRisk < RISK_CRITICAL_THRESHOLD) {
      alerts.push({
        ticker: position.ticker,
        type: 'monitorar',
        severity: 'warning',
        title: `${position.ticker} com risco elevado`,
        description: `Score de Risco em ${asset.aqScore.scoreRisk.toFixed(0)}/100. Alavancagem ou liquidez podem estar deteriorando.`,
        data: { riskScore: asset.aqScore.scoreRisk },
      })
    }
  }

  // Sort by severity: critical first, then warning, then info
  const severityOrder: Record<string, number> = { critical: 0, warning: 1, info: 2 }
  return alerts.sort((a, b) => (severityOrder[a.severity] ?? 2) - (severityOrder[b.severity] ?? 2))
}
