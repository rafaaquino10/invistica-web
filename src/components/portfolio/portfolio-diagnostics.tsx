'use client'

import { cn } from '@/lib/utils'
import { SemaphoreBadge } from '@/components/score/score-semaphore'
import { getScoreBadge } from '@/lib/scoring/score-narrator'
import { ScoreBadge, Disclaimer } from '@/components/ui'
import Link from 'next/link'

// ─── Types ──────────────────────────────────────────────────────────

interface Position {
  ticker: string
  name: string
  sector: string | null
  currentValue: number
  iqScore: number | null
  gainLossPercent: number
}

interface PortfolioDiagnosticsProps {
  positions: Position[]
  totalValue: number
  avgIqScore: number
  className?: string
}

// ─── Helpers ────────────────────────────────────────────────────────

function classifyScore(score: number): string {
  if (score >= 81) return 'Excepcional'
  if (score >= 61) return 'Saudável'
  if (score >= 31) return 'Atenção'
  return 'Crítico'
}

function getDiagnosticPhrase(avgScore: number, positions: Position[]): string {
  const classification = classifyScore(avgScore)
  const weakCount = positions.filter(p => (p.iqScore ?? 0) > 0 && (p.iqScore ?? 0) < 40).length
  const strongCount = positions.filter(p => (p.iqScore ?? 0) >= 70).length

  if (classification === 'Excepcional') {
    return 'Sua carteira está excepcional — qualidade acima da média do mercado.'
  }
  if (classification === 'Saudável') {
    return `Sua carteira está saudável com ${strongCount} ativo${strongCount !== 1 ? 's' : ''} de alto score.`
  }
  if (classification === 'Atenção') {
    return `Atenção — ${weakCount} ativo${weakCount !== 1 ? 's' : ''} com score abaixo de 40 merece${weakCount !== 1 ? 'm' : ''} revisão.`
  }
  return 'Múltiplos ativos em nível crítico — considere reavaliar a composição da carteira.'
}

// ─── Pillar averages ────────────────────────────────────────────────

interface PillarAvgs {
  label: string
  avg: number
  color: string
}

// ─── Component ──────────────────────────────────────────────────────

export function PortfolioDiagnostics({ positions, totalValue, avgIqScore, className }: PortfolioDiagnosticsProps) {
  if (positions.length === 0 || avgIqScore <= 0) return null

  const badge = getScoreBadge(avgIqScore)

  // Alertas
  const alerts: Array<{ type: 'warning' | 'info'; message: string; ticker?: string }> = []

  // Ativos com score < 40
  const weakPositions = positions
    .filter(p => (p.iqScore ?? 0) > 0 && (p.iqScore ?? 0) < 40)
    .sort((a, b) => (a.iqScore ?? 0) - (b.iqScore ?? 0))

  for (const p of weakPositions.slice(0, 3)) {
    alerts.push({
      type: 'warning',
      message: `${p.ticker} tem score ${Math.round(p.iqScore!)} — considere revisar a posição`,
      ticker: p.ticker,
    })
  }

  // Concentração > 20%
  for (const p of positions) {
    const weight = totalValue > 0 ? (p.currentValue / totalValue) * 100 : 0
    if (weight > 20) {
      alerts.push({
        type: 'warning',
        message: `${p.ticker} representa ${weight.toFixed(1)}% da carteira — concentração elevada`,
        ticker: p.ticker,
      })
    }
  }

  // Setores
  const sectors = new Set(positions.map(p => p.sector).filter(Boolean))
  if (sectors.size < 3 && positions.length >= 3) {
    alerts.push({
      type: 'info',
      message: `Carteira concentrada em ${sectors.size} setor${sectors.size !== 1 ? 'es' : ''} — diversificação pode reduzir risco`,
    })
  }

  return (
    <div className={cn('border border-[var(--border-1)]/20 rounded-[var(--radius)] bg-[var(--surface-1)] p-4', className)}>
      <div className="flex items-center gap-2 mb-3">
        <h3 className="text-[11px] font-semibold text-[var(--text-3)] uppercase tracking-wider">Diagnóstico da Carteira</h3>
      </div>

      {/* Score + Semáforo + Frase */}
      <div className="flex items-center gap-3 mb-3">
        <ScoreBadge score={avgIqScore} size="lg" showBar />
        <SemaphoreBadge label={badge.label} color={badge.color} size="md" />
      </div>
      <p className="text-[13px] text-[var(--text-2)] mb-3">{getDiagnosticPhrase(avgIqScore, positions)}</p>
      <Disclaimer variant="inline" className="mb-3" />

      {/* Alertas / Oportunidades */}
      {alerts.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[11px] font-medium text-[var(--text-3)] uppercase tracking-wider mb-1">Oportunidades de Melhoria</p>
          {alerts.map((alert, i) => (
            <div
              key={i}
              className={cn(
                'flex items-start gap-2 px-3 py-2 rounded-[var(--radius-sm)] text-[12px]',
                alert.type === 'warning'
                  ? 'bg-amber-500/5 text-amber-600 dark:text-amber-400'
                  : 'bg-blue-500/5 text-blue-600 dark:text-blue-400'
              )}
            >
              <span className="mt-0.5 flex-shrink-0">
                {alert.type === 'warning' ? '!' : 'i'}
              </span>
              <span className="flex-1">{alert.message}</span>
              {alert.ticker && (
                <Link
                  href={`/ativo/${alert.ticker}`}
                  className="text-[11px] font-medium underline flex-shrink-0"
                >
                  Ver
                </Link>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
