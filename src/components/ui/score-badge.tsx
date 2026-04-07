'use client'

import { cn } from '@/lib/utils'
import { Tooltip } from '@/components/ui/tooltip'

interface ScoreBadgeProps {
  score: number | null
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  showBar?: boolean
  className?: string
  tooltip?: string
}

function getScoreColor(score: number): string {
  if (score >= 81) return 'var(--score-exceptional)'
  if (score >= 61) return 'var(--score-healthy)'
  if (score >= 31) return 'var(--score-attention)'
  return 'var(--score-critical)'
}

function getScoreLabel(score: number): string {
  if (score >= 81) return 'Excepcional'
  if (score >= 61) return 'Saudável'
  if (score >= 31) return 'Atenção'
  return 'Crítico'
}

// Ícone direcional para encoding triplo (cor + ícone + label)
function getScoreIcon(score: number): string {
  if (score >= 61) return '+'
  if (score >= 31) return '='
  return '-'
}

export function ScoreBadge({ score, size = 'md', showLabel = true, showBar = false, className, tooltip }: ScoreBadgeProps) {
  if (score === null || score === undefined) {
    return (
      <span className={cn(
        'inline-flex items-center font-mono text-[var(--text-3)]',
        size === 'sm' && 'text-[var(--text-caption)]',
        size === 'md' && 'text-[var(--text-small)]',
        size === 'lg' && 'text-[var(--text-body)]',
        className
      )}>
        n/d
      </span>
    )
  }

  const rounded = Math.round(score)
  const color = getScoreColor(rounded)

  const badge = (
    <span className={cn('inline-flex items-center gap-1.5', className)}>
      <span
        className={cn(
          'inline-flex items-center gap-0.5 font-mono font-semibold tabular-nums rounded-[var(--radius-sm)]',
          size === 'sm' && 'text-[var(--text-caption)] px-1.5 py-px',
          size === 'md' && 'text-[var(--text-small)] px-2 py-px',
          size === 'lg' && 'text-[var(--text-body)] px-2.5 py-0.5',
        )}
        style={{
          color: color,
          backgroundColor: `color-mix(in srgb, ${color} 10%, transparent)`,
        }}
      >
        <span className={cn(
          'leading-none',
          size === 'sm' && 'text-[8px]',
          size === 'md' && 'text-[9px]',
          size === 'lg' && 'text-[10px]',
        )}>{getScoreIcon(rounded)}</span>
        {rounded}
      </span>
      {showBar && (
        <span className="inline-flex w-10 h-[3px] rounded-full bg-[var(--border-1)] overflow-hidden">
          <span
            className="h-full rounded-full transition-all"
            style={{
              width: `${rounded}%`,
              backgroundColor: color,
            }}
          />
        </span>
      )}
      {showLabel && (
        <span className={cn(
          'text-[var(--text-3)]',
          size === 'sm' && 'text-[10px]',
          size === 'md' && 'text-[var(--text-caption)]',
          size === 'lg' && 'text-[var(--text-small)]',
        )}>
          {getScoreLabel(rounded)}
        </span>
      )}
    </span>
  )

  if (tooltip) {
    return <Tooltip content={tooltip}>{badge}</Tooltip>
  }

  return badge
}
