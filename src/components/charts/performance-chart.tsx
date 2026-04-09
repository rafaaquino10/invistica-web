'use client'

import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import { cn } from '@/lib/utils'

export interface PerformanceSeries {
  label: string
  data: { date: string; value: number }[]
  color: string
  lineWidth?: number
  lineStyle?: 'solid' | 'dashed'
}

interface Props {
  series: PerformanceSeries[]
  height?: number
  periods?: { label: string; months: number }[]
  activePeriod?: number
  onPeriodChange?: (months: number) => void
  className?: string
}

const DEFAULT_PERIODS = [
  { label: '1M', months: 1 },
  { label: '3M', months: 3 },
  { label: '6M', months: 6 },
  { label: '12M', months: 12 },
]

/**
 * Gráfico de performance — Recharts puro, sem watermark.
 * Substitui TVPerformanceChart (lightweight-charts).
 */
export function PerformanceChart({
  series,
  height = 320,
  periods = DEFAULT_PERIODS,
  activePeriod = 12,
  onPeriodChange,
  className,
}: Props) {
  if (!series.length || !series[0]?.data.length) {
    return (
      <div className={cn('flex items-center justify-center text-[var(--text-3)] text-[var(--text-caption)]', className)} style={{ height }}>
        Dados indisponíveis
      </div>
    )
  }

  // Merge all series into a single dataset by date
  const dateMap = new Map<string, Record<string, number>>()
  for (const s of series) {
    for (const point of s.data) {
      const d = point.date.split('T')[0] ?? point.date
      if (!dateMap.has(d)) dateMap.set(d, {})
      dateMap.get(d)![s.label] = point.value
    }
  }

  const chartData = Array.from(dateMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, values]) => ({ date, ...values }))

  const formatDate = (d: string) => {
    const parts = d.split('-')
    if (parts.length >= 3) return `${parts[2]}/${parts[1]}`
    return d
  }

  return (
    <div className={className}>
      {/* Period selector */}
      {onPeriodChange && (
        <div className="flex items-center gap-1 mb-3">
          {periods.map(p => (
            <button
              key={p.months}
              onClick={() => onPeriodChange(p.months)}
              className={cn(
                'px-2.5 py-1 text-[var(--text-caption)] font-semibold rounded-md transition-colors',
                activePeriod === p.months
                  ? 'bg-[var(--accent-1)] text-white'
                  : 'text-[var(--text-3)] hover:text-[var(--text-1)] hover:bg-[var(--surface-2)]'
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      )}

      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
          <defs>
            {series.map(s => (
              <linearGradient key={s.label} id={`grad-${s.label}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={s.color} stopOpacity={0.15} />
                <stop offset="100%" stopColor={s.color} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid stroke="var(--border-1)" strokeOpacity={0.3} strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: 'var(--text-3)' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={formatDate}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fontSize: 10, fill: 'var(--text-3)' }}
            axisLine={false}
            tickLine={false}
            width={45}
            tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v.toFixed(0)}
          />
          <Tooltip
            contentStyle={{
              background: 'var(--surface-1)',
              border: '1px solid var(--border-1)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '11px',
            }}
            labelFormatter={formatDate}
            formatter={(value: number, name: string) => [value.toFixed(1), name]}
          />
          {series.map((s, i) => (
            <Area
              key={s.label}
              type="monotone"
              dataKey={s.label}
              stroke={s.color}
              strokeWidth={s.lineWidth ?? 2}
              strokeDasharray={s.lineStyle === 'dashed' ? '6 3' : undefined}
              fill={i === 0 ? `url(#grad-${s.label})` : 'none'}
              dot={false}
              activeDot={{ r: 3, strokeWidth: 0 }}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
