'use client'

import { useMemo } from 'react'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/utils/formatters'

interface PerformanceChartProps {
  performance: {
    percentReturn: number
    absoluteReturn?: number
    totalReturn?: number
    dataPoints?: Array<{ date: string; value: number; benchmark?: number }>
    benchmarks?: {
      cdi: { percentReturn: number }
      ibov: { percentReturn: number }
    }
  }
}

export function PerformanceEvolutionChart({ performance }: PerformanceChartProps) {
  const points = performance.dataPoints

  if (!points?.length || points.length < 2) {
    return (
      <div className="border border-[var(--border-1)] rounded-[var(--radius)] shadow-sm bg-[var(--surface-1)] p-4">
        <h3 className="text-[11px] font-semibold text-[var(--text-3)] uppercase tracking-wider mb-2">Evolucao Patrimonial</h3>
        <div className="h-[160px] flex items-center justify-center text-[12px] text-[var(--text-3)]">
          Dados insuficientes — adicione transacoes para acompanhar a evolucao.
        </div>
      </div>
    )
  }

  // Normalize to base 100
  const baseValue = points[0]!.value || 1
  const baseBench = points[0]!.benchmark || baseValue

  const normalized = points.map(p => ({
    date: p.date,
    portfolio: (p.value / baseValue) * 100,
    benchmark: p.benchmark ? (p.benchmark / baseBench) * 100 : null,
  }))

  const maxVal = Math.max(...normalized.map(p => Math.max(p.portfolio, p.benchmark ?? 0)))
  const minVal = Math.min(...normalized.map(p => Math.min(p.portfolio, p.benchmark ?? Infinity)))
  const range = maxVal - minVal || 1

  // Downsample for rendering
  const step = Math.max(1, Math.floor(normalized.length / 100))
  const sampled = normalized.filter((_, i) => i % step === 0 || i === normalized.length - 1)

  const lastPortfolio = normalized[normalized.length - 1]!.portfolio
  const portfolioReturn = lastPortfolio - 100

  return (
    <div className="border border-[var(--border-1)] rounded-[var(--radius)] shadow-sm bg-[var(--surface-1)] p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[11px] font-semibold text-[var(--text-3)] uppercase tracking-wider">Evolucao Patrimonial (Base 100)</h3>
        <span className={cn(
          'text-[13px] font-mono font-bold',
          portfolioReturn >= 0 ? 'text-teal' : 'text-red'
        )}>
          {portfolioReturn >= 0 ? '+' : ''}{portfolioReturn.toFixed(1)}%
        </span>
      </div>

      {/* SVG line chart */}
      <div className="relative h-[160px]">
        <svg viewBox={`0 0 ${sampled.length - 1} 100`} preserveAspectRatio="none" className="w-full h-full">
          {/* Benchmark line */}
          {sampled[0]?.benchmark != null && (
            <polyline
              fill="none"
              stroke="var(--text-3)"
              strokeWidth="0.8"
              strokeOpacity="0.4"
              strokeDasharray="2 2"
              points={sampled.map((p, i) => `${i},${100 - ((p.benchmark! - minVal) / range) * 100}`).join(' ')}
            />
          )}

          {/* Portfolio area */}
          <defs>
            <linearGradient id="perfGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={portfolioReturn >= 0 ? 'var(--pos)' : 'var(--neg)'} stopOpacity="0.2" />
              <stop offset="100%" stopColor={portfolioReturn >= 0 ? 'var(--pos)' : 'var(--neg)'} stopOpacity="0" />
            </linearGradient>
          </defs>
          <polygon
            fill="url(#perfGrad)"
            points={`0,100 ${sampled.map((p, i) => `${i},${100 - ((p.portfolio - minVal) / range) * 100}`).join(' ')} ${sampled.length - 1},100`}
          />

          {/* Portfolio line */}
          <polyline
            fill="none"
            stroke={portfolioReturn >= 0 ? 'var(--pos)' : 'var(--neg)'}
            strokeWidth="1.5"
            points={sampled.map((p, i) => `${i},${100 - ((p.portfolio - minVal) / range) * 100}`).join(' ')}
          />
        </svg>

        {/* Y axis labels */}
        <div className="absolute top-0 right-0 h-full flex flex-col justify-between text-[9px] font-mono text-[var(--text-3)]">
          <span>{maxVal.toFixed(0)}</span>
          <span>{minVal.toFixed(0)}</span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-2 text-[10px] text-[var(--text-3)]">
        <span className="flex items-center gap-1">
          <span className={cn('w-3 h-0.5 rounded', portfolioReturn >= 0 ? 'bg-[var(--pos)]' : 'bg-[var(--neg)]')} />
          Portfolio
        </span>
        {sampled[0]?.benchmark != null && (
          <span className="flex items-center gap-1">
            <span className="w-3 h-0.5 bg-[var(--text-3)]/40 rounded" style={{ borderBottom: '1px dashed' }} />
            Benchmark
          </span>
        )}
        <span className="ml-auto">{sampled.length} pontos</span>
      </div>
    </div>
  )
}
