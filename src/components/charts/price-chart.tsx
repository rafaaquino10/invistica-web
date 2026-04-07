'use client'

import { useState } from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/utils/formatters'

interface PriceDataPoint {
  date: string | Date
  close: number
  open?: number
  high?: number
  low?: number
  volume?: number
}

export type TimeRange = '1D' | '1S' | '1M' | '3M' | '6M' | '1A' | '5A'

interface PriceChartProps {
  data: PriceDataPoint[]
  showVolume?: boolean
  showGrid?: boolean
  height?: number
  className?: string
  range?: TimeRange
  onRangeChange?: (range: TimeRange) => void
}

function formatTimeLabel(date: Date): string {
  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

function formatTooltipLabel(date: Date, range: TimeRange): string {
  if (range === '1D') {
    return formatTimeLabel(date)
  }
  if (range === '1S') {
    return `${date.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })} ${formatTimeLabel(date)}`
  }
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
}

const CustomTooltip = ({ active, payload, range }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    if (!data.close || data.close <= 0) return null

    const isPositive = data.close >= (data.open ?? data.close)
    const date = new Date(data.date)

    return (
      <div className="bg-[var(--surface-1)] border border-[var(--border-1)] rounded-lg px-4 py-3 shadow-[var(--shadow-overlay)]">
        <p className="text-xs text-[var(--text-2)] mb-1">
          {formatTooltipLabel(date, range)}
        </p>
        <p className={cn('text-lg font-bold font-mono', isPositive ? 'text-teal' : 'text-red')}>
          {formatCurrency(data.close)}
        </p>
        {data.high && data.low && data.high > 0 && data.low > 0 && (
          <div className="mt-2 text-xs text-[var(--text-2)] space-y-0.5">
            <p>Máx: {formatCurrency(data.high)}</p>
            <p>Mín: {formatCurrency(data.low)}</p>
          </div>
        )}
        {data.volume != null && data.volume > 0 && (
          <p className="mt-1 text-xs text-[var(--text-2)]">
            Vol: {(data.volume / 1000000).toFixed(1)}M
          </p>
        )}
      </div>
    )
  }
  return null
}

export function PriceChart({
  data,
  showVolume = false,
  showGrid = true,
  height = 300,
  className,
  range: controlledRange,
  onRangeChange,
}: PriceChartProps) {
  const [internalRange, setInternalRange] = useState<TimeRange>('1M')
  const range = controlledRange ?? internalRange

  const handleRangeChange = (r: TimeRange) => {
    if (onRangeChange) {
      onRangeChange(r)
    } else {
      setInternalRange(r)
    }
  }

  // When externally controlled, use all data as-is (already fetched for the range)
  // When uncontrolled, filter client-side
  const rawData = onRangeChange ? data : (() => {
    const now = new Date()
    let daysBack = 30
    switch (range) {
      case '1D': daysBack = 1; break
      case '1S': daysBack = 7; break
      case '1M': daysBack = 30; break
      case '3M': daysBack = 90; break
      case '6M': daysBack = 180; break
      case '1A': daysBack = 365; break
      case '5A': daysBack = 365 * 5; break
    }
    const cutoff = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000)
    return data.filter((d) => new Date(d.date) >= cutoff)
  })()

  // Filter out data points with 0 or missing close prices (intraday gaps)
  const filteredData = rawData.filter((d) => d.close > 0)

  // Calculate if trend is positive
  const firstPrice = filteredData[0]?.close ?? 0
  const lastPrice = filteredData[filteredData.length - 1]?.close ?? 0
  const isPositive = lastPrice >= firstPrice

  const chartColor = isPositive ? '#0D9488' : '#EF4444'
  const gradientId = isPositive ? 'positiveGradient' : 'negativeGradient'

  // Compute Y domain with small padding to avoid flat lines at extremes
  const closes = filteredData.map(d => d.close)
  const minPrice = closes.length ? Math.min(...closes) : 0
  const maxPrice = closes.length ? Math.max(...closes) : 0
  const pricePadding = (maxPrice - minPrice) * 0.05 || maxPrice * 0.02
  const yDomain = [
    Math.max(0, minPrice - pricePadding),
    maxPrice + pricePadding,
  ]

  const ranges: TimeRange[] = ['1D', '1S', '1M', '3M', '6M', '1A', '5A']

  return (
    <div className={cn('w-full', className)}>
      {/* Range selector */}
      <div className="flex gap-1 mb-4">
        {ranges.map((r) => (
          <button
            key={r}
            onClick={() => handleRangeChange(r)}
            className={cn(
              'px-3 py-1 text-xs font-medium rounded-lg transition-colors',
              range === r
                ? 'bg-[var(--accent-1)] text-white'
                : 'bg-[var(--surface-2)] text-[var(--text-2)] hover:text-[var(--text-1)]'
            )}
          >
            {r}
          </button>
        ))}
      </div>

      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={filteredData}
            margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
          >
            <defs>
              <linearGradient id="positiveGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0D9488" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#0D9488" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="negativeGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
              </linearGradient>
            </defs>

            {showGrid && (
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--border-1)"
                vertical={false}
              />
            )}

            <XAxis
              dataKey="date"
              tickFormatter={(value) => {
                const date = new Date(value)
                const MONTHS = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez']
                if (range === '1D') return formatTimeLabel(date)
                if (range === '1S' || range === '1M') return `${date.getDate()}/${MONTHS[date.getMonth()]}`
                return `${MONTHS[date.getMonth()]}/${String(date.getFullYear()).slice(2)}`
              }}
              tick={{ fill: 'var(--text-2)', fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: 'var(--border-1)' }}
            />

            <YAxis
              domain={yDomain}
              tickFormatter={(value) => `R$${value.toFixed(0)}`}
              tick={{ fill: 'var(--text-2)', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={60}
            />

            <Tooltip content={<CustomTooltip range={range} />} />

            <ReferenceLine
              y={firstPrice}
              stroke="var(--text-2)"
              strokeDasharray="3 3"
              strokeOpacity={0.5}
            />

            <Area
              type="monotone"
              dataKey="close"
              stroke={chartColor}
              strokeWidth={2}
              fill={`url(#${gradientId})`}
              connectNulls
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
