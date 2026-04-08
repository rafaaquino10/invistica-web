'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { investiq } from '@/lib/investiq-client'

interface IntradayPoint { time?: string; portfolio?: number; ibov?: number; value?: number }

export function PortfolioIntradayChart() {
  const [data, setData] = useState<IntradayPoint[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    investiq.get<{ series?: IntradayPoint[] }>('/portfolio/intraday')
      .then(res => setData(res.series ?? []))
      .catch(() => setData([]))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="border border-[var(--border-1)] rounded-[var(--radius)] shadow-sm bg-[var(--surface-1)] p-4 animate-pulse">
        <div className="h-4 w-32 bg-[var(--surface-2)] rounded mb-3" />
        <div className="h-[120px] bg-[var(--surface-2)] rounded" />
      </div>
    )
  }

  if (!data.length) return null

  // Build SVG spark line
  const values = data.map(d => d.portfolio ?? d.value ?? 0)
  const minVal = Math.min(...values)
  const maxVal = Math.max(...values)
  const range = maxVal - minVal || 1
  const lastVal = values[values.length - 1] ?? 0
  const firstVal = values[0] ?? 0
  const changeSign = lastVal >= firstVal

  const points = values.map((v, i) => {
    const x = (i / (values.length - 1)) * 100
    const y = 100 - ((v - minVal) / range) * 100
    return `${x},${y}`
  }).join(' ')

  return (
    <div className="border border-[var(--border-1)] rounded-[var(--radius)] shadow-sm bg-[var(--surface-1)] p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-[11px] font-semibold text-[var(--text-3)] uppercase tracking-wider">Intraday</h3>
        <span className={cn('text-[12px] font-mono font-bold', changeSign ? 'text-teal' : 'text-red')}>
          {changeSign ? '+' : ''}{(lastVal - firstVal).toFixed(2)}%
        </span>
      </div>
      <div className="h-[100px]">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
          <defs>
            <linearGradient id="intradayGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={changeSign ? 'var(--pos)' : 'var(--neg)'} stopOpacity="0.15" />
              <stop offset="100%" stopColor={changeSign ? 'var(--pos)' : 'var(--neg)'} stopOpacity="0" />
            </linearGradient>
          </defs>
          <polygon
            fill="url(#intradayGrad)"
            points={`0,100 ${points} 100,100`}
          />
          <polyline
            fill="none"
            stroke={changeSign ? 'var(--pos)' : 'var(--neg)'}
            strokeWidth="1.5"
            points={points}
          />
        </svg>
      </div>
      <div className="flex justify-between text-[9px] text-[var(--text-3)] mt-1">
        <span>10:00</span>
        <span>13:30</span>
        <span>17:00</span>
      </div>
    </div>
  )
}
