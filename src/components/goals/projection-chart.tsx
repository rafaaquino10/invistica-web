'use client'

import { useMemo } from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  CartesianGrid,
} from 'recharts'

interface ProjectionChartProps {
  initialAmount: number
  monthlyContribution: number
  annualReturn: number       // Decimal: 0.08 = 8%
  targetAmount: number       // Número FIRE
  years: number
}

export function ProjectionChart({
  initialAmount,
  monthlyContribution,
  annualReturn,
  targetAmount,
  years,
}: ProjectionChartProps) {
  const data = useMemo(() => {
    const points = []
    let projected = initialAmount
    let onlyContributions = initialAmount

    for (let year = 0; year <= years; year++) {
      points.push({
        year,
        projected: Math.round(projected),
        onlyContributions: Math.round(onlyContributions),
        target: targetAmount,
      })
      projected = projected * (1 + annualReturn) + monthlyContribution * 12
      onlyContributions += monthlyContribution * 12
    }
    return points
  }, [initialAmount, monthlyContribution, annualReturn, targetAmount, years])

  const crossYear = data.find(d => d.projected >= targetAmount)?.year

  const formatCurrency = (value: number) =>
    `R$ ${(value / 1000).toFixed(0)}k`

  return (
    <div>
      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="projGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--accent-1)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="var(--accent-1)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-1)" strokeOpacity={0.2} />
            <XAxis
              dataKey="year"
              tick={{ fontSize: 11, fill: 'var(--text-3)' }}
              tickFormatter={v => `${v}a`}
            />
            <YAxis
              tick={{ fontSize: 11, fill: 'var(--text-3)' }}
              tickFormatter={formatCurrency}
              width={60}
            />
            <Tooltip
              formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR')}`, '']}
              labelFormatter={label => `Ano ${label}`}
              contentStyle={{
                backgroundColor: 'var(--surface-2)',
                border: '1px solid var(--border-1)',
                borderRadius: '8px',
                fontSize: 12,
              }}
            />
            <ReferenceLine
              y={targetAmount}
              stroke="var(--neg)"
              strokeDasharray="5 5"
              label={{ value: 'FIRE', position: 'right', fontSize: 11, fill: 'var(--neg)' }}
            />
            <Area
              type="monotone"
              dataKey="projected"
              stroke="var(--accent-1)"
              fill="url(#projGrad)"
              strokeWidth={2}
              name="Projeção com retorno"
            />
            <Area
              type="monotone"
              dataKey="onlyContributions"
              stroke="var(--text-3)"
              strokeDasharray="4 4"
              fill="none"
              strokeWidth={1.5}
              name="Apenas aportes"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      {crossYear !== undefined && (
        <p className="text-center text-[var(--text-small)] mt-3 text-[var(--pos)] font-medium">
          Independência financeira em {crossYear} anos
        </p>
      )}
    </div>
  )
}
