'use client'

import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts'
import type { MonteCarloResult } from '@/lib/simulation/monte-carlo'

interface MonteCarloChartProps {
  result: MonteCarloResult
  years: number
  initialValue: number
  targetValue?: number
}

function formatCompact(value: number): string {
  if (value >= 1e6) return `R$ ${(value / 1e6).toFixed(1)}M`
  if (value >= 1e3) return `R$ ${(value / 1e3).toFixed(0)}k`
  return `R$ ${value.toFixed(0)}`
}

const currentYear = new Date().getFullYear()

export function MonteCarloChart({ result, years, initialValue, targetValue }: MonteCarloChartProps) {
  const data = result.yearlyData.map(yd => ({
    name: `${currentYear + yd.year}`,
    p5: Math.round(yd.p5),
    p25: Math.round(yd.p25),
    p50: Math.round(yd.p50),
    p75: Math.round(yd.p75),
    p95: Math.round(yd.p95),
  }))

  return (
    <div className="border border-[var(--border-1)]/20 rounded-[var(--radius)] bg-[var(--surface-1)] overflow-hidden">
      <div className="px-3 py-2 border-b border-[var(--border-1)] flex items-center justify-between">
        <div>
          <span className="text-sm font-semibold">Monte Carlo</span>
          <span className="text-xs text-[var(--text-2)] ml-2">{result.simulations.toLocaleString()} cenários</span>
        </div>
      </div>
      <div className="p-3">
        <div className="h-52 sm:h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 5, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="mc-outer" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--text-3)" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="var(--text-3)" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="mc-mid" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--accent-1)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="var(--accent-1)" stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="mc-inner" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--accent-1)" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="var(--accent-1)" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="name"
                tick={{ fontSize: 10, fill: 'var(--text-3)' }}
                axisLine={false}
                tickLine={false}
                interval={Math.max(0, Math.floor(years / 6))}
              />
              <YAxis
                tick={{ fontSize: 10, fill: 'var(--text-3)' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={formatCompact}
              />
              <Tooltip
                formatter={(value: number, name: string) => {
                  const labels: Record<string, string> = {
                    p95: 'Otimista (p95)',
                    p75: 'Provável alto (p75)',
                    p50: 'Mediana (p50)',
                    p25: 'Provável baixo (p25)',
                    p5: 'Pessimista (p5)',
                  }
                  return [formatCompact(value), labels[name] ?? name]
                }}
                contentStyle={{
                  backgroundColor: 'var(--surface-1)',
                  border: '1px solid var(--border-1)',
                  borderRadius: '8px',
                  fontSize: '11px',
                }}
              />
              {/* Banda p5-p95 (cinza) */}
              <Area type="monotone" dataKey="p95" stackId="none" stroke="none" fill="url(#mc-outer)" />
              <Area type="monotone" dataKey="p5" stackId="none" stroke="none" fill="transparent" />
              {/* Banda p25-p75 (azul médio) */}
              <Area type="monotone" dataKey="p75" stackId="none" stroke="none" fill="url(#mc-mid)" />
              <Area type="monotone" dataKey="p25" stackId="none" stroke="none" fill="transparent" />
              {/* Linha mediana */}
              <Area
                type="monotone"
                dataKey="p50"
                stackId="none"
                stroke="var(--accent-1)"
                strokeWidth={2}
                fill="url(#mc-inner)"
              />
              {/* Linha de meta FIRE */}
              {targetValue && targetValue > 0 && (
                <ReferenceLine
                  y={targetValue}
                  stroke="var(--pos)"
                  strokeDasharray="6 4"
                  strokeWidth={1.5}
                  label={{
                    value: `Meta ${formatCompact(targetValue)}`,
                    position: 'right',
                    fontSize: 10,
                    fill: 'var(--pos)',
                  }}
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>
        {/* Legenda */}
        <div className="flex flex-wrap items-center justify-center gap-3 mt-2 text-[10px] text-[var(--text-3)]">
          <span className="flex items-center gap-1">
            <span className="w-3 h-2 rounded-sm bg-[var(--text-3)]/15 inline-block" /> p5–p95
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-2 rounded-sm bg-[var(--accent-1)]/30 inline-block" /> p25–p75
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-0.5 bg-[var(--accent-1)] inline-block" /> Mediana
          </span>
          {targetValue && targetValue > 0 && (
            <span className="flex items-center gap-1">
              <span className="w-3 h-0.5 bg-[var(--pos)] inline-block border-dashed" /> Meta FIRE
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
