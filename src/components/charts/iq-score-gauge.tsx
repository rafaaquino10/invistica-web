'use client'

import { useEffect, useState } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import { cn } from '@/lib/utils'

interface IQScoreGaugeProps {
  score: number
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  animated?: boolean
  className?: string
}

const COLORS = {
  critical: '#EF4444',
  attention: '#D97706',
  healthy: '#0D9488',
  exceptional: '#1A73E8',
}

function getScoreColor(score: number): string {
  if (score <= 30) return COLORS.critical
  if (score <= 60) return COLORS.attention
  if (score <= 80) return COLORS.healthy
  return COLORS.exceptional
}

function getScoreLabel(score: number): string {
  if (score <= 30) return 'Crítico'
  if (score <= 60) return 'Atenção'
  if (score <= 80) return 'Saudável'
  return 'Excepcional'
}

export function IQScoreGauge({
  score,
  size = 'md',
  showLabel = true,
  animated = true,
  className,
}: IQScoreGaugeProps) {
  const [displayScore, setDisplayScore] = useState(animated ? 0 : score)

  useEffect(() => {
    if (!animated) {
      setDisplayScore(score)
      return
    }

    const duration = 1000
    const steps = 60
    const increment = score / steps
    let current = 0
    const timer = setInterval(() => {
      current += increment
      if (current >= score) {
        setDisplayScore(score)
        clearInterval(timer)
      } else {
        setDisplayScore(Math.floor(current))
      }
    }, duration / steps)

    return () => clearInterval(timer)
  }, [score, animated])

  const sizes = {
    sm: { outer: 80, inner: 60, font: 'text-lg' },
    md: { outer: 120, inner: 90, font: 'text-2xl' },
    lg: { outer: 160, inner: 120, font: 'text-4xl' },
  }

  const { outer, inner, font } = sizes[size]

  const data = [
    { name: 'score', value: displayScore },
    { name: 'remaining', value: 100 - displayScore },
  ]

  const scoreColor = getScoreColor(displayScore)

  return (
    <div className={cn('relative inline-flex flex-col items-center', className)}>
      <div style={{ width: outer, height: outer }} className="relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              startAngle={180}
              endAngle={0}
              innerRadius={inner * 0.7}
              outerRadius={inner * 0.9}
              paddingAngle={0}
              dataKey="value"
              stroke="none"
            >
              <Cell fill={scoreColor} />
              <Cell fill="var(--surface-2)" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        {/* Score value in center */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn('font-bold font-mono', font)} style={{ color: scoreColor }}>
            {displayScore}
          </span>
        </div>
      </div>

      {showLabel && (
        <div className="text-center mt-1">
          <span className="text-xs font-medium" style={{ color: scoreColor }}>
            {getScoreLabel(displayScore)}
          </span>
        </div>
      )}
    </div>
  )
}
