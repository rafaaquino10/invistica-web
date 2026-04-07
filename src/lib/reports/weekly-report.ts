// ─── Relatório Semanal Automatizado ──────────────────────────
// Gera relatório semanal do portfólio do investidor.
// Pode ser consumido pela UI ou enviado por email.
// Insights gerados via IA (Claude Haiku) com fallback para templates.

import type { AssetData } from '../data-source'
import { getScoreMovers, getScoreAlerts } from '../score-history'
import { generateExitAlerts } from '../smart-portfolios/exit-alerts'
import type { UserPosition, ExitAlert } from '../smart-portfolios/types'
import { isClaudeAvailable, generateClaudeCompletion, IQ_SYSTEM_PROMPT } from '../ai/claude-client'
import { logger } from '../utils/logger'

// ─── Types ──────────────────────────────────────────────────

export interface WeeklyReportData {
  generatedAt: string
  period: { from: string; to: string }

  portfolio: {
    totalValue: number
    totalCost: number
    gainLoss: number
    gainLossPct: number
    positionCount: number
    avgScore: number
  } | null

  marketOverview: {
    avgScoreB3: number
    sectorsUp: number
    sectorsDown: number
    topGainer: { ticker: string; delta: number } | null
    topLoser: { ticker: string; delta: number } | null
  }

  alerts: ExitAlert[]

  scoreMovers: {
    gainers: Array<{ ticker: string; delta: number; current: number }>
    losers: Array<{ ticker: string; delta: number; current: number }>
  }

  insights: string[]
}

// ─── Generator ──────────────────────────────────────────────

export function generateWeeklyReport(
  assets: AssetData[],
  portfolioData: {
    totalValue: number
    totalCost: number
    positions: UserPosition[]
    avgScore: number
  } | null,
): WeeklyReportData {
  const now = new Date()
  const weekAgo = new Date(now)
  weekAgo.setDate(weekAgo.getDate() - 7)

  // Market overview
  const scoredAssets = assets.filter(a => a.aqScore)
  const avgScoreB3 = scoredAssets.length > 0
    ? scoredAssets.reduce((s, a) => s + (a.aqScore?.scoreTotal ?? 0), 0) / scoredAssets.length
    : 0

  // Sector heatmap
  const sectorMap = new Map<string, { total: number; count: number }>()
  for (const a of assets) {
    const existing = sectorMap.get(a.sector) ?? { total: 0, count: 0 }
    existing.total += a.change ?? 0
    existing.count++
    sectorMap.set(a.sector, existing)
  }
  const sectors = [...sectorMap.entries()].map(([sector, data]) => ({
    sector,
    avgChange: data.count > 0 ? data.total / data.count : 0,
  }))
  const sectorsUp = sectors.filter(s => s.avgChange > 0).length
  const sectorsDown = sectors.filter(s => s.avgChange < 0).length

  // Score movers
  const movers = getScoreMovers(7)
  const topGainer = movers.gainers[0] ?? null
  const topLoser = movers.losers[0] ?? null

  // Exit alerts
  const alerts = portfolioData?.positions
    ? generateExitAlerts(portfolioData.positions, assets)
    : []

  // Insights automáticos (fallback template)
  const templateInsights: string[] = []

  if (avgScoreB3 >= 55) {
    templateInsights.push(`Mercado saudável: score médio da B3 em ${avgScoreB3.toFixed(0)} pontos.`)
  } else if (avgScoreB3 < 45) {
    templateInsights.push(`Mercado sob pressão: score médio da B3 caiu para ${avgScoreB3.toFixed(0)} pontos.`)
  }

  if (topGainer) {
    templateInsights.push(`Destaque positivo: ${topGainer.ticker} subiu ${topGainer.delta.toFixed(0)} pontos no score.`)
  }
  if (topLoser) {
    templateInsights.push(`Alerta: ${topLoser.ticker} perdeu ${Math.abs(topLoser.delta).toFixed(0)} pontos no score.`)
  }

  if (alerts.length > 0) {
    const criticals = alerts.filter(a => a.severity === 'critical')
    if (criticals.length > 0) {
      templateInsights.push(`${criticals.length} alerta(s) crítico(s) na carteira requerem atenção imediata.`)
    }
  }

  if (portfolioData && portfolioData.totalCost > 0) {
    const pct = ((portfolioData.totalValue - portfolioData.totalCost) / portfolioData.totalCost) * 100
    if (pct > 0) {
      templateInsights.push(`Carteira acumula ganho de ${pct.toFixed(1)}% sobre o custo.`)
    }
  }

  const insights = templateInsights

  return {
    generatedAt: now.toISOString(),
    period: {
      from: weekAgo.toISOString().split('T')[0]!,
      to: now.toISOString().split('T')[0]!,
    },
    portfolio: portfolioData ? {
      totalValue: portfolioData.totalValue,
      totalCost: portfolioData.totalCost,
      gainLoss: portfolioData.totalValue - portfolioData.totalCost,
      gainLossPct: portfolioData.totalCost > 0
        ? ((portfolioData.totalValue - portfolioData.totalCost) / portfolioData.totalCost) * 100
        : 0,
      positionCount: portfolioData.positions.length,
      avgScore: portfolioData.avgScore,
    } : null,
    marketOverview: {
      avgScoreB3: Math.round(avgScoreB3),
      sectorsUp,
      sectorsDown,
      topGainer: topGainer ? { ticker: topGainer.ticker, delta: topGainer.delta } : null,
      topLoser: topLoser ? { ticker: topLoser.ticker, delta: topLoser.delta } : null,
    },
    alerts,
    scoreMovers: {
      gainers: movers.gainers.slice(0, 5).map(g => ({ ticker: g.ticker, delta: g.delta, current: g.current })),
      losers: movers.losers.slice(0, 5).map(l => ({ ticker: l.ticker, delta: l.delta, current: l.current })),
    },
    insights,
  }
}

/**
 * Enriquece os insights do relatório com narrativa gerada por IA (Claude Haiku).
 * Fallback: mantém insights template se IA indisponível.
 */
export async function enrichReportWithAI(report: WeeklyReportData): Promise<WeeklyReportData> {
  if (!isClaudeAvailable()) return report

  try {
    const prompt = `Você é um analista financeiro do InvestIQ. Gere um resumo semanal conciso (3-5 frases) sobre o mercado brasileiro de ações com base nestes dados:

- Score médio B3: ${report.marketOverview.avgScoreB3}/100
- Setores em alta: ${report.marketOverview.sectorsUp} | Em baixa: ${report.marketOverview.sectorsDown}
${report.marketOverview.topGainer ? `- Maior alta de score: ${report.marketOverview.topGainer.ticker} (+${report.marketOverview.topGainer.delta.toFixed(0)} pts)` : ''}
${report.marketOverview.topLoser ? `- Maior queda de score: ${report.marketOverview.topLoser.ticker} (${report.marketOverview.topLoser.delta.toFixed(0)} pts)` : ''}
- Alertas ativos: ${report.alerts.length}
${report.portfolio ? `- Carteira do investidor: R$ ${report.portfolio.totalValue.toLocaleString('pt-BR')}, ${report.portfolio.gainLossPct >= 0 ? '+' : ''}${report.portfolio.gainLossPct.toFixed(1)}%` : ''}

Regras: tom acessível e informativo, sem recomendar compra/venda, sem emojis. Foque em tendências e contexto.`

    const narrative = await generateClaudeCompletion(prompt, {
      model: 'haiku',
      temperature: 0.3,
      maxTokens: 400,
      systemPrompt: IQ_SYSTEM_PROMPT,
      timeoutMs: 10_000,
    })

    if (narrative && narrative.length > 50) {
      return {
        ...report,
        insights: [narrative, ...report.insights],
      }
    }
  } catch (err) {
    logger.warn('[weekly-report] Falha ao gerar insights IA, usando templates', { error: String(err) })
  }

  return report
}

/**
 * Formata o relatório como texto para email ou exibição.
 */
export function formatReportAsText(report: WeeklyReportData): string {
  const lines: string[] = []

  lines.push(`═══ Relatório Semanal InvestIQ ═══`)
  lines.push(`Período: ${report.period.from} a ${report.period.to}`)
  lines.push('')

  if (report.portfolio) {
    lines.push(`── Sua Carteira ──`)
    lines.push(`Patrimônio: R$ ${report.portfolio.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`)
    lines.push(`Rentabilidade: ${report.portfolio.gainLossPct >= 0 ? '+' : ''}${report.portfolio.gainLossPct.toFixed(2)}%`)
    lines.push(`IQ Score médio: ${report.portfolio.avgScore.toFixed(0)}`)
    lines.push(`Posições: ${report.portfolio.positionCount}`)
    lines.push('')
  }

  lines.push(`── Mercado ──`)
  lines.push(`Score médio B3: ${report.marketOverview.avgScoreB3}`)
  lines.push(`Setores em alta: ${report.marketOverview.sectorsUp} | Em baixa: ${report.marketOverview.sectorsDown}`)
  lines.push('')

  if (report.insights.length > 0) {
    lines.push(`── Insights ──`)
    for (const insight of report.insights) {
      lines.push(`• ${insight}`)
    }
    lines.push('')
  }

  if (report.alerts.length > 0) {
    lines.push(`── Alertas ──`)
    for (const alert of report.alerts.slice(0, 5)) {
      lines.push(`[${alert.severity.toUpperCase()}] ${alert.title}`)
    }
    lines.push('')
  }

  lines.push(`─────────────────────────────────`)
  lines.push(`As análises são de caráter informativo e educacional.`)
  lines.push(`Não constituem recomendação de investimento.`)

  return lines.join('\n')
}
