'use client'

import { cn } from '@/lib/utils'

/**
 * Gauge circular animado para Invscore.
 * Mostra score de 0-100 com arco colorido e classificação.
 */

interface ScoreGaugeProps {
  score: number
  classification?: string
  size?: number
  className?: string
}

function getScoreColor(score: number): string {
  if (score >= 81) return 'var(--score-exceptional, #00D4AA)'
  if (score >= 61) return 'var(--score-healthy, #4ADE80)'
  if (score >= 31) return 'var(--score-attention, #FB923C)'
  return 'var(--score-critical, #EF4444)'
}

function getScoreIcon(score: number): string {
  if (score >= 61) return '+'
  if (score >= 31) return '='
  return '-'
}

function getTrailColor(): string {
  return 'var(--border-1, #E3E5EA)'
}

export function ScoreGauge({ score, classification, size = 96, className }: ScoreGaugeProps) {
  const strokeWidth = size * 0.08
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  // Gauge é 270 graus (3/4 de círculo)
  const arcLength = circumference * 0.75
  const filledLength = (score / 100) * arcLength
  const dashOffset = arcLength - filledLength

  const color = getScoreColor(score)

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)} style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="transform rotate-[135deg]"
      >
        {/* Trail (fundo) */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={getTrailColor()}
          strokeWidth={strokeWidth}
          strokeDasharray={`${arcLength} ${circumference}`}
          strokeLinecap="round"
          opacity={0.3}
        />
        {/* Arco preenchido */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={`${arcLength} ${circumference}`}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
          style={{
            filter: `drop-shadow(0 0 4px ${color}40)`,
          }}
        />
      </svg>
      {/* Conteúdo central */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="flex items-center gap-0.5">
          <span
            className="leading-none"
            style={{ fontSize: Math.max(size * 0.12, 8), color }}
          >
            {getScoreIcon(score)}
          </span>
          <span
            className="font-mono font-bold leading-none"
            style={{ fontSize: size * 0.3, color }}
          >
            {Math.round(score)}
          </span>
        </div>
        {classification && (
          <span
            className="text-center font-medium leading-tight mt-0.5"
            style={{
              fontSize: Math.max(size * 0.1, 9),
              color: 'var(--text-2)',
            }}
          >
            {classification}
          </span>
        )}
      </div>
    </div>
  )
}
