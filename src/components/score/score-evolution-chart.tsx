'use client'

import { useState, useMemo } from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/hooks/use-auth'
import { pro } from '@/lib/api/endpoints'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui'

// ─── Types & Constants ──────────────────────────────────────

type Period = '7D' | '1M' | '3M' | '6M' | '1A'

const PERIOD_DAYS: Record<Period, number> = {
  '7D': 7,
  '1M': 30,
  '3M': 90,
  '6M': 180,
  '1A': 365,
}

const PILLAR_COLORS: Record<string, string> = {
  score: '#00D4AA',
  valuation: '#06B6D4',
  quality: '#8B5CF6',
  risk: '#F59E0B',
  dividends: '#10B981',
  growth: '#3B82F6',
}

const PILLAR_LABELS: Record<string, string> = {
  score: 'IQ-Score',
  valuation: 'Valuation',
  quality: 'Qualidade',
  risk: 'Risco',
  dividends: 'Dividendos',
  growth: 'Crescimento',
}

// ─── Component ──────────────────────────────────────────────

interface ScoreEvolutionChartProps {
  ticker: string
  className?: string
}

export function ScoreEvolutionChart({ ticker, className }: ScoreEvolutionChartProps) {
  const [period, setPeriod] = useState<Period>('3M')
  const [showPillars, setShowPillars] = useState(false)

  const { token } = useAuth()
  const { data, isLoading } = useQuery({
    queryKey: ['score-history', ticker, period],
    queryFn: () => pro.getHistory(ticker, Math.min(60, Math.ceil(PERIOD_DAYS[period] / 7)), token ?? undefined),
    enabled: !!ticker && !!token,
  })

  const chartData = useMemo(() => {
    if (!data?.history) return []
    return data.history.map(h => ({
      date: h.date,
      label: formatDateLabel(h.date),
      score: Math.round(h.score * 10) / 10,
      valuation: Math.round(h.valuation * 10) / 10,
      quality: Math.round(h.quality * 10) / 10,
      risk: Math.round(h.risk * 10) / 10,
      dividends: Math.round(h.dividends * 10) / 10,
      growth: Math.round(h.growth * 10) / 10,
    }))
  }, [data])

  // Calculate delta between first and last
  const delta = useMemo(() => {
    if (chartData.length < 2) return null
    const first = chartData[0]!
    const last = chartData[chartData.length - 1]!
    return Math.round((last.score - first.score) * 10) / 10
  }, [chartData])

  if (isLoading) {
    return (
      <div className={cn('space-y-3', className)}>
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-[220px] rounded-[var(--radius)]" />
      </div>
    )
  }

  if (!data?.hasHistory || chartData.length === 0) {
    return (
      <div className={cn('border border-[var(--border-1)]/20 rounded-[var(--radius)] bg-[var(--surface-1)] p-6', className)}>
        <div className="h-[180px] flex items-center justify-center text-sm text-[var(--text-2)]">
          Histórico de score ainda não disponível. Os dados serão acumulados diariamente.
        </div>
      </div>
    )
  }

  return (
    <div className={cn('space-y-3', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {delta !== null && (
            <span className={cn(
              'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold font-mono',
              delta > 0
                ? 'bg-teal/10 text-teal'
                : delta < 0
                ? 'bg-red/10 text-red'
                : 'bg-[var(--surface-2)] text-[var(--text-2)]'
            )}>
              {delta > 0 ? '+' : ''}{delta.toFixed(1)} pts
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Pillar toggle */}
          <button
            onClick={() => setShowPillars(!showPillars)}
            className={cn(
              'text-xs px-2 py-1 rounded-md transition-colors',
              showPillars
                ? 'bg-[var(--accent-1)]/10 text-[var(--accent-1)]'
                : 'text-[var(--text-2)] hover:bg-[var(--surface-2)]'
            )}
          >
            Pilares
          </button>

          {/* Period selector */}
          <div className="flex bg-[var(--surface-2)] rounded-lg p-0.5">
            {(Object.keys(PERIOD_DAYS) as Period[]).map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={cn(
                  'px-2.5 py-1 text-xs font-medium rounded-md transition-colors',
                  period === p
                    ? 'bg-[var(--surface-1)] text-[var(--text-1)]'
                    : 'text-[var(--text-2)] hover:text-[var(--text-1)]'
                )}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="border border-[var(--border-1)]/20 rounded-[var(--radius)] overflow-hidden bg-[var(--surface-1)]">
        <div className="p-4">
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00D4AA" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#00D4AA" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--border-1)"
                opacity={0.15}
                vertical={false}
              />
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: 'var(--text-2)' }}
                interval="preserveStartEnd"
              />
              <YAxis
                domain={[0, 100]}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: 'var(--text-2)' }}
                width={35}
              />
              <Tooltip content={<ScoreTooltip />} />
              {showPillars && <Legend
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: 11, color: 'var(--text-2)' }}
              />}

              {/* Main score line */}
              <Area
                type="monotone"
                dataKey="score"
                name={PILLAR_LABELS['score']}
                stroke={PILLAR_COLORS['score']!}
                strokeWidth={2}
                fill="url(#scoreGrad)"
                dot={false}
                activeDot={{ r: 4, stroke: PILLAR_COLORS['score'], strokeWidth: 2 }}
              />

              {/* Pillar lines (optional) */}
              {showPillars && (['valuation', 'quality', 'risk', 'dividends', 'growth'] as const).map(key => (
                <Area
                  key={key}
                  type="monotone"
                  dataKey={key}
                  name={PILLAR_LABELS[key]}
                  stroke={PILLAR_COLORS[key]!}
                  strokeWidth={1.5}
                  strokeDasharray="4 3"
                  fill="none"
                  dot={false}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Summary strip */}
      {chartData.length >= 2 && (
        <div className="flex items-center gap-4 text-xs text-[var(--text-2)]">
          <span>
            {chartData.length} dias de dados
          </span>
          <span className="text-[var(--border-1)]">|</span>
          <span>
            Min: <span className="font-mono font-medium text-[var(--text-1)]">
              {Math.min(...chartData.map(d => d.score)).toFixed(1)}
            </span>
          </span>
          <span>
            Max: <span className="font-mono font-medium text-[var(--text-1)]">
              {Math.max(...chartData.map(d => d.score)).toFixed(1)}
            </span>
          </span>
          <span>
            Atual: <span className="font-mono font-medium text-[var(--text-1)]">
              {chartData[chartData.length - 1]!.score.toFixed(1)}
            </span>
          </span>
        </div>
      )}
    </div>
  )
}

// ─── Tooltip ────────────────────────────────────────────────

function ScoreTooltip({ active, payload }: any) {
  if (!active || !payload || !payload.length) return null

  const data = payload[0]?.payload
  if (!data) return null

  return (
    <div className="bg-[var(--surface-1)] border border-[var(--border-1)]/30 rounded-lg shadow-[var(--shadow-overlay)] p-3 min-w-[160px]">
      <p className="text-xs text-[var(--text-2)] mb-2">
        {formatTooltipDate(data.date)}
      </p>
      <div className="space-y-1">
        {payload.map((entry: any) => {
          const key = entry.dataKey as string
          return (
            <div key={key} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-1.5">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: PILLAR_COLORS[key] ?? entry.stroke }}
                />
                <span className="text-xs text-[var(--text-2)]">
                  {PILLAR_LABELS[key] ?? key}
                </span>
              </div>
              <span className="text-xs font-mono font-semibold text-[var(--text-1)]">
                {Number(entry.value).toFixed(1)}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Helpers ────────────────────────────────────────────────

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

function formatTooltipDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
}
