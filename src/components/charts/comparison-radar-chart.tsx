'use client'

import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts'
import { cn } from '@/lib/utils'

interface DatasetEntry {
  ticker: string
  color: string
  quanti: number
  quali: number
  valuation: number
  operational: number
}

interface ComparisonRadarChartProps {
  datasets: DatasetEntry[]
  className?: string
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[var(--surface-1)] border border-[var(--border-1)] rounded-lg px-3 py-2 shadow-[var(--shadow-overlay)]">
        <p className="font-medium text-sm mb-1">{label}</p>
        {payload.map((entry: any, i: number) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-[var(--text-2)]">{entry.name}:</span>
            <span className="font-bold font-mono">{entry.value?.toFixed(0)}</span>
          </div>
        ))}
      </div>
    )
  }
  return null
}

export function ComparisonRadarChart({ datasets, className }: ComparisonRadarChartProps) {
  const subjects = ['Quantitativo', 'Qualitativo', 'Valuation', 'Operacional']
  const keys = ['quanti', 'quali', 'valuation', 'operational'] as const

  const data = subjects.map((subject, i) => {
    const entry: Record<string, any> = { subject }
    const key = keys[i]
    datasets.forEach((ds) => {
      if (key !== undefined) entry[ds.ticker] = ds[key]
    })
    return entry
  })

  return (
    <div className={cn('w-full h-[350px]', className)}>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
          <PolarGrid stroke="var(--border-1)" strokeDasharray="3 3" />
          <PolarAngleAxis
            dataKey="subject"
            tick={{ fill: 'var(--text-2)', fontSize: 12 }}
            tickLine={false}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={{ fill: 'var(--text-2)', fontSize: 10 }}
            tickCount={5}
            axisLine={false}
          />
          {datasets.map((ds) => (
            <Radar
              key={ds.ticker}
              name={ds.ticker}
              dataKey={ds.ticker}
              stroke={ds.color}
              fill={ds.color}
              fillOpacity={0.12}
              strokeWidth={2}
            />
          ))}
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: 12, color: 'var(--text-2)' }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}
