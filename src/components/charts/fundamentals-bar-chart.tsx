'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from 'recharts'
import { cn } from '@/lib/utils'

interface FundamentalDataPoint {
  name: string
  value: number
  benchmark?: number
  unit?: string
}

interface FundamentalsBarChartProps {
  data: FundamentalDataPoint[]
  title?: string
  showBenchmark?: boolean
  height?: number
  className?: string
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div className="bg-[var(--surface-1)] border border-[var(--border-1)] rounded-lg px-4 py-3 shadow-[var(--shadow-overlay)]">
        <p className="text-sm font-medium">{data.name}</p>
        <p className="text-lg font-bold font-mono text-[var(--accent-1)]">
          {data.value.toFixed(2)}{data.unit ?? ''}
        </p>
        {data.benchmark !== undefined && (
          <p className="text-xs text-[var(--text-2)]">
            Média setor: {data.benchmark.toFixed(2)}{data.unit ?? ''}
          </p>
        )}
      </div>
    )
  }
  return null
}

export function FundamentalsBarChart({
  data,
  title,
  showBenchmark = true,
  height = 250,
  className,
}: FundamentalsBarChartProps) {
  // Determine color based on comparison with benchmark
  const getBarColor = (value: number, benchmark?: number) => {
    if (benchmark === undefined) return '#1A73E8'

    // For most metrics, higher is better
    if (value >= benchmark * 1.1) return '#0D9488' // Good
    if (value >= benchmark * 0.9) return '#1A73E8' // Neutral
    return '#EF4444' // Needs attention
  }

  return (
    <div className={cn('w-full', className)}>
      {title && (
        <h4 className="text-sm font-medium mb-3 text-[var(--text-1)]">
          {title}
        </h4>
      )}

      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--border-1)"
              horizontal={true}
              vertical={false}
            />

            <XAxis
              type="number"
              tick={{ fill: 'var(--text-2)', fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: 'var(--border-1)' }}
            />

            <YAxis
              type="category"
              dataKey="name"
              tick={{ fill: 'var(--text-2)', fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              width={75}
            />

            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--surface-2)' }} />

            {showBenchmark && (
              <Bar dataKey="benchmark" fill="var(--border-1)" radius={[0, 4, 4, 0]} barSize={8} />
            )}

            <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={showBenchmark ? 12 : 20}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getBarColor(entry.value, entry.benchmark)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
