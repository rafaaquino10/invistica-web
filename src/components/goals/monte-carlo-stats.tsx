'use client'

import type { MonteCarloResult } from '@/lib/simulation/monte-carlo'
import { cn } from '@/lib/utils'

interface MonteCarloStatsProps {
  result: MonteCarloResult
  targetValue?: number
}

function formatCompact(value: number): string {
  if (value >= 1e6) return `R$ ${(value / 1e6).toFixed(1)}M`
  if (value >= 1e3) return `R$ ${(value / 1e3).toFixed(0)}k`
  return `R$ ${value.toFixed(0)}`
}

export function MonteCarloStats({ result, targetValue }: MonteCarloStatsProps) {
  const { finalValue, maxDrawdown } = result

  // Probabilidade de atingir meta
  const probTarget = targetValue && targetValue > 0
    ? (result.yearlyData.length > 0
        ? (() => {
            const last = result.yearlyData[result.yearlyData.length - 1]!
            // Estimativa: se p50 >= target, ~50%+. Interpolar entre percentis.
            if (last.p5 >= targetValue) return 95
            if (last.p25 >= targetValue) return 75
            if (last.p50 >= targetValue) return 50
            if (last.p75 >= targetValue) return 25
            if (last.p95 >= targetValue) return 5
            return 0
          })()
        : 0)
    : null

  const stats = [
    {
      label: 'Valor Mediano',
      value: formatCompact(finalValue.median),
      color: 'text-[var(--text-1)]',
    },
    {
      label: 'Prob. Retorno Positivo',
      value: `${(finalValue.probPositive * 100).toFixed(0)}%`,
      color: finalValue.probPositive >= 0.7 ? 'text-[var(--pos)]' : 'text-amber-400',
    },
    ...(probTarget !== null ? [{
      label: 'Prob. Atingir Meta',
      value: `${probTarget}%`,
      color: probTarget >= 50 ? 'text-[var(--pos)]' : probTarget >= 25 ? 'text-amber-400' : 'text-[var(--neg)]',
    }] : []),
    {
      label: 'Max Drawdown Médio',
      value: `-${(maxDrawdown.mean * 100).toFixed(0)}%`,
      color: maxDrawdown.mean <= 0.15 ? 'text-[var(--text-2)]' : maxDrawdown.mean <= 0.30 ? 'text-amber-400' : 'text-[var(--neg)]',
    },
  ]

  return (
    <div className={cn(
      'grid gap-2',
      stats.length === 4 ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-3'
    )}>
      {stats.map(s => (
        <div key={s.label} className="text-center p-2.5 rounded-lg bg-[var(--surface-2)]">
          <p className={cn('text-lg font-bold font-mono', s.color)}>{s.value}</p>
          <p className="text-[10px] text-[var(--text-3)] mt-0.5">{s.label}</p>
        </div>
      ))}
    </div>
  )
}
