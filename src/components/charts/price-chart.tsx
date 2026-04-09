'use client'

import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar } from 'recharts'
import { cn } from '@/lib/utils'

export type TimeRange = '1D' | '5D' | '1M' | '3M'

interface ChartDataPoint {
  date: string | Date
  close: number
  volume?: number
}

interface PriceChartProps {
  data: ChartDataPoint[]
  height?: number
  range?: TimeRange
  onRangeChange?: (range: TimeRange) => void
  showVolume?: boolean
  className?: string
}

const RANGES: TimeRange[] = ['1D', '5D', '1M', '3M']

export function PriceChart({ data, height = 320, range = '1M', onRangeChange, showVolume = false, className }: PriceChartProps) {
  if (!data.length) return null

  const chartData = data.map(d => ({
    date: d.date instanceof Date ? d.date.toISOString().split('T')[0] : String(d.date).split('T')[0],
    close: Number(d.close),
    volume: d.volume ? Number(d.volume) : 0,
  }))

  const prices = chartData.map(d => d.close).filter(v => v > 0)
  if (!prices.length) return null
  const minPrice = Math.min(...prices) * 0.995
  const maxPrice = Math.max(...prices) * 1.005
  const isPositive = chartData.length >= 2 && chartData[chartData.length - 1]!.close >= chartData[0]!.close
  const lineColor = isPositive ? 'var(--pos)' : 'var(--neg)'

  const formatDate = (d: string) => {
    const parts = d?.split('-')
    if (parts?.length >= 3) return `${parts[2]}/${parts[1]}`
    return d ?? ''
  }

  const volumeHeight = showVolume ? 60 : 0
  const priceHeight = height - volumeHeight - 40

  return (
    <div className={className}>
      {onRangeChange && (
        <div className="flex items-center gap-1 mb-2">
          {RANGES.map(r => (
            <button key={r} onClick={() => onRangeChange(r)} className={cn('px-2.5 py-1 text-[var(--text-caption)] font-semibold rounded-md transition-colors', range === r ? 'bg-[var(--accent-1)] text-white' : 'text-[var(--text-3)] hover:text-[var(--text-1)] hover:bg-[var(--surface-2)]')}>
              {r}
            </button>
          ))}
        </div>
      )}

      <ResponsiveContainer width="100%" height={priceHeight}>
        <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={isPositive ? 'var(--pos)' : 'var(--neg)'} stopOpacity={0.12} />
              <stop offset="100%" stopColor={isPositive ? 'var(--pos)' : 'var(--neg)'} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--border-1)" strokeOpacity={0.2} strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--text-3)' }} axisLine={false} tickLine={false} tickFormatter={formatDate} interval="preserveStartEnd" />
          <YAxis domain={[minPrice, maxPrice]} tick={{ fontSize: 10, fill: 'var(--text-3)' }} axisLine={false} tickLine={false} width={55} tickFormatter={(v: number) => `R$${Number(v).toFixed(2)}`} />
          <Tooltip contentStyle={{ background: 'var(--surface-1)', border: '1px solid var(--border-1)', borderRadius: 'var(--radius-sm)', fontSize: '11px' }} labelFormatter={formatDate} formatter={(value: number) => [`R$ ${Number(value).toFixed(2)}`, 'Preço']} />
          <Area type="monotone" dataKey="close" stroke={lineColor} strokeWidth={2} fill="url(#priceGrad)" dot={false} activeDot={{ r: 3, strokeWidth: 0 }} />
        </AreaChart>
      </ResponsiveContainer>

      {showVolume && chartData.some(d => d.volume > 0) && (
        <ResponsiveContainer width="100%" height={volumeHeight}>
          <BarChart data={chartData} margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
            <Bar dataKey="volume" fill="var(--accent-1)" fillOpacity={0.15} radius={[1, 1, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
