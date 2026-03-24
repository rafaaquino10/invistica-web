'use client'

import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import { cn } from '@/lib/utils'

interface AQRadarChartProps {
  valuation: number
  quality: number
  growth: number
  dividends: number
  risk: number
  showLabels?: boolean
  className?: string
}

const PILLAR_WEIGHTS: Record<string, number> = {
  Valuation: 20,
  Qualidade: 20,
  Risco: 15,
  Dividendos: 10,
  Crescimento: 10,
  Qualitativo: 25,
}

function getScoreColor(value: number): string {
  if (value >= 81) return '#1A73E8'
  if (value >= 61) return '#0D9488'
  if (value >= 31) return '#D97706'
  return '#EF4444'
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    const weight = PILLAR_WEIGHTS[data.subject] ?? 0
    const color = getScoreColor(data.value)
    return (
      <div className="bg-[var(--surface-1)] border border-[var(--border-1)] rounded-lg px-3 py-2 shadow-[var(--shadow-overlay)]">
        <div className="flex items-center justify-between gap-3">
          <p className="font-semibold text-sm">{data.subject}</p>
          <span className="text-[11px] text-[var(--text-2)]">Peso {weight}%</span>
        </div>
        <div className="flex items-baseline gap-1.5 mt-1">
          <span className="text-xl font-bold font-mono" style={{ color }}>{data.value}</span>
          <span className="text-xs text-[var(--text-2)]">/ 100</span>
        </div>
        <div className="w-full h-1 rounded-full bg-[var(--surface-2)] mt-1.5">
          <div className="h-full rounded-full transition-all" style={{ width: `${data.value}%`, backgroundColor: color }} />
        </div>
      </div>
    )
  }
  return null
}

const CustomLabel = ({ x, y, value, payload }: any) => {
  const name = payload?.value ?? ''
  const score = value ?? 0
  const color = getScoreColor(score)

  return (
    <g>
      <text
        x={x}
        y={y}
        textAnchor="middle"
        fill="var(--text-2)"
        fontSize={11}
        fontWeight={600}
      >
        {name}
      </text>
      <text
        x={x}
        y={y + 14}
        textAnchor="middle"
        fill={color}
        fontSize={12}
        fontWeight={700}
        fontFamily="ui-monospace, monospace"
      >
        {score}
      </text>
    </g>
  )
}

export function AQRadarChart({
  valuation,
  quality,
  growth,
  dividends,
  risk,
  showLabels = true,
  className,
}: AQRadarChartProps) {
  const data = [
    { subject: 'Valuation', value: valuation, benchmark: 50, fullMark: 100 },
    { subject: 'Qualidade', value: quality, benchmark: 50, fullMark: 100 },
    { subject: 'Crescimento', value: growth, benchmark: 50, fullMark: 100 },
    { subject: 'Dividendos', value: dividends, benchmark: 50, fullMark: 100 },
    { subject: 'Risco', value: risk, benchmark: 50, fullMark: 100 },
  ]

  return (
    <div className={cn('w-full h-[220px] sm:h-[300px]', className)}>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="65%" data={data}>
          <defs>
            <radialGradient id="radarGradient" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#1A73E8" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#1A73E8" stopOpacity={0.08} />
            </radialGradient>
          </defs>

          <PolarGrid
            stroke="var(--border-1)"
            strokeOpacity={0.4}
            gridType="polygon"
          />

          <PolarAngleAxis
            dataKey="subject"
            tick={showLabels ? (props: any) => {
              const { x, y, payload } = props
              const item = data.find(d => d.subject === payload.value)
              const score = item?.value ?? 0
              return <CustomLabel x={x} y={y} value={score} payload={payload} />
            } : { fill: 'var(--text-2)', fontSize: 11 }}
            tickLine={false}
          />

          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={false}
            axisLine={false}
          />

          {/* Benchmark reference (50/100) */}
          <Radar
            name="Benchmark"
            dataKey="benchmark"
            stroke="var(--text-2)"
            strokeWidth={1}
            strokeDasharray="4 4"
            strokeOpacity={0.35}
            fill="none"
            isAnimationActive={false}
          />

          {/* Actual values */}
          <Radar
            name="IQ-Score"
            dataKey="value"
            stroke="#1A73E8"
            fill="url(#radarGradient)"
            strokeWidth={2.5}
            dot={{ r: 3, fill: '#1A73E8', stroke: '#fff', strokeWidth: 1.5 }}
            isAnimationActive={true}
            animationDuration={800}
            animationEasing="ease-out"
          />

          <Tooltip content={<CustomTooltip />} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}
