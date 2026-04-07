'use client'

import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/utils/formatters'

interface AllocationDonutProps {
  data: Array<{
    name: string
    value: number
    percent: number
  }>
  title?: string
  showLegend?: boolean
  showLabels?: boolean
  height?: number
  className?: string
}

const COLORS = [
  '#1A73E8',
  '#0D9488',
  '#7C3AED',
  '#2563EB',
  '#059669',
  '#D97706',
  '#4F46E5',
  '#0891B2',
]

export function AllocationDonut({
  data,
  title,
  height,
  className,
}: AllocationDonutProps) {
  const sortedData = [...data].sort((a, b) => b.value - a.value)
  const totalValue = data.reduce((sum, d) => sum + d.value, 0)

  if (data.length === 0 || totalValue === 0) {
    return (
      <div className={cn('flex items-center justify-center', className)} style={{ height }}>
        <p className="text-[var(--text-2)] text-sm">Sem dados de alocação</p>
      </div>
    )
  }

  // Stacked bar at top
  const segments = sortedData.map((entry, i) => ({
    ...entry,
    color: COLORS[i % COLORS.length] ?? '#1A73E8',
    width: Math.max(entry.percent, 0.5),
  }))

  return (
    <div className={cn('w-full', className)}>
      {title && (
        <h4 className="text-sm font-medium mb-3 text-[var(--text-1)]">{title}</h4>
      )}

      {/* Stacked bar */}
      <div className="flex h-2.5 rounded-full overflow-hidden gap-px bg-[var(--surface-2)]">
        {segments.map((seg, i) => (
          <div
            key={seg.name}
            className={cn('h-full transition-all', i === 0 && 'rounded-l-full', i === segments.length - 1 && 'rounded-r-full')}
            style={{ width: `${seg.width}%`, backgroundColor: seg.color }}
          />
        ))}
      </div>

      {/* Legend rows */}
      <div className="mt-4 space-y-2">
        {sortedData.map((entry, i) => {
          const color = COLORS[i % COLORS.length] ?? '#1A73E8'
          return (
            <div key={entry.name} className="flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-sm shrink-0" style={{ backgroundColor: color }} />
              <span className="text-xs text-[var(--text-2)] flex-1 truncate">{entry.name}</span>
              <span className="text-xs font-mono text-[var(--text-1)] tabular-nums">{entry.percent.toFixed(1)}%</span>
              <span className="text-[11px] font-mono text-[var(--text-3)] w-20 text-right tabular-nums">{formatCurrency(entry.value)}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
