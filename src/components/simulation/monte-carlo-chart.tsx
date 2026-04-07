'use client'

import { useState } from 'react'
import { trpc } from '@/lib/trpc/client'
import { Card, CardContent, Skeleton } from '@/components/ui'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/utils/formatters'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid,
} from 'recharts'

interface MonteCarloSectionProps {
  portfolioId: string
}

export function MonteCarloSection({ portfolioId }: MonteCarloSectionProps) {
  const [years, setYears] = useState(10)
  const [monthly, setMonthly] = useState(1000)

  const { data, isLoading } = trpc.portfolio.monteCarlo.useQuery(
    { portfolioId, years, monthlyContribution: monthly },
    { staleTime: 5 * 60 * 1000 },
  )

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--accent-1)]">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
            <h3 className="text-[var(--text-small)] font-semibold text-[var(--text-1)]">
              Simulação Monte Carlo
            </h3>
          </div>
          <span className="text-[var(--text-caption)] text-[var(--text-3)]">
            {data?.simulations ?? 1000} simulações
          </span>
        </div>

        {/* Controls */}
        <div className="flex gap-4 mb-4">
          <div className="flex items-center gap-2">
            <label className="text-[var(--text-caption)] text-[var(--text-2)]">Horizonte:</label>
            <select
              value={years}
              onChange={e => setYears(Number(e.target.value))}
              className="text-[var(--text-caption)] bg-[var(--surface-2)] border border-[var(--border-1)]/30 rounded px-2 py-1"
            >
              <option value={5}>5 anos</option>
              <option value={10}>10 anos</option>
              <option value={15}>15 anos</option>
              <option value={20}>20 anos</option>
              <option value={30}>30 anos</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[var(--text-caption)] text-[var(--text-2)]">Aporte mensal:</label>
            <select
              value={monthly}
              onChange={e => setMonthly(Number(e.target.value))}
              className="text-[var(--text-caption)] bg-[var(--surface-2)] border border-[var(--border-1)]/30 rounded px-2 py-1"
            >
              <option value={0}>R$ 0</option>
              <option value={500}>R$ 500</option>
              <option value={1000}>R$ 1.000</option>
              <option value={2000}>R$ 2.000</option>
              <option value={5000}>R$ 5.000</option>
            </select>
          </div>
        </div>

        {isLoading && (
          <div className="space-y-3">
            <Skeleton className="h-64 w-full" />
            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-16" />)}
            </div>
          </div>
        )}

        {data && (
          <>
            {/* Chart */}
            <div className="h-64 -mx-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.yearlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-1)" opacity={0.2} />
                  <XAxis
                    dataKey="year"
                    tick={{ fill: 'var(--text-3)', fontSize: 11 }}
                    tickFormatter={v => `Ano ${v}`}
                  />
                  <YAxis
                    tick={{ fill: 'var(--text-3)', fontSize: 11 }}
                    tickFormatter={v => `${(v / 1000).toFixed(0)}k`}
                    width={50}
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null
                      const d = payload[0]?.payload
                      return (
                        <div className="bg-[var(--surface-1)] border border-[var(--border-1)]/30 rounded-lg p-3 shadow-lg">
                          <p className="text-[var(--text-caption)] font-semibold text-[var(--text-1)] mb-1">
                            Ano {label}
                          </p>
                          <p className="text-[var(--text-caption)] text-green-500">
                            Otimista (P95): {formatCurrency(d.p95)}
                          </p>
                          <p className="text-[var(--text-caption)] text-[var(--text-1)] font-semibold">
                            Mediana (P50): {formatCurrency(d.p50)}
                          </p>
                          <p className="text-[var(--text-caption)] text-red-500">
                            Pessimista (P5): {formatCurrency(d.p5)}
                          </p>
                        </div>
                      )
                    }}
                  />

                  {/* P5-P95 band (light) */}
                  <Area
                    type="monotone"
                    dataKey="p95"
                    stroke="none"
                    fill="var(--accent-1)"
                    fillOpacity={0.08}
                  />
                  <Area
                    type="monotone"
                    dataKey="p5"
                    stroke="none"
                    fill="var(--surface-1)"
                    fillOpacity={1}
                  />

                  {/* P25-P75 band (darker) */}
                  <Area
                    type="monotone"
                    dataKey="p75"
                    stroke="none"
                    fill="var(--accent-1)"
                    fillOpacity={0.18}
                  />
                  <Area
                    type="monotone"
                    dataKey="p25"
                    stroke="none"
                    fill="var(--surface-1)"
                    fillOpacity={1}
                  />

                  {/* Median line */}
                  <Area
                    type="monotone"
                    dataKey="p50"
                    stroke="var(--accent-1)"
                    strokeWidth={2}
                    fill="none"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
              <StatBox
                label="Mediana Final"
                value={formatCurrency(data.finalValue.median)}
                color="text-[var(--text-1)]"
              />
              <StatBox
                label="Prob. Retorno +"
                value={`${(data.finalValue.probPositive * 100).toFixed(0)}%`}
                color={data.finalValue.probPositive > 0.7 ? 'text-green-500' : 'text-amber-500'}
              />
              <StatBox
                label="Prob. Dobrar"
                value={`${(data.finalValue.probDoubling * 100).toFixed(0)}%`}
                color={data.finalValue.probDoubling > 0.5 ? 'text-green-500' : 'text-[var(--text-2)]'}
              />
              <StatBox
                label="Drawdown P95"
                value={`-${(data.maxDrawdown.p95 * 100).toFixed(0)}%`}
                color="text-red-500"
              />
            </div>

            <p className="text-[var(--text-caption)] text-[var(--text-3)] mt-3">
              Total investido: {formatCurrency(data.totalInvested)}. Retorno e volatilidade estimados via IQ Score e setor.
            </p>
          </>
        )}
      </CardContent>
    </Card>
  )
}

function StatBox({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="p-3 rounded-lg bg-[var(--surface-2)]/50">
      <p className="text-[var(--text-caption)] text-[var(--text-3)]">{label}</p>
      <p className={cn('text-[var(--text-small)] font-semibold font-mono', color)}>{value}</p>
    </div>
  )
}
