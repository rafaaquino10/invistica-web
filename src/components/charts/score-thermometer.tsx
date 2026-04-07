'use client'

import { cn } from '@/lib/utils'

interface ScoreThermometerProps {
  score: number
  showIndicator?: boolean
  showLabels?: boolean
  height?: 'sm' | 'md' | 'lg'
  className?: string
}

export function ScoreThermometer({
  score,
  showIndicator = true,
  showLabels = true,
  height = 'md',
  className,
}: ScoreThermometerProps) {
  const heights = {
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-3',
  }

  const indicatorPosition = `${Math.min(Math.max(score, 0), 100)}%`

  return (
    <div className={cn('w-full', className)}>
      <div className="relative">
        {/* Gradient bar */}
        <div
          className={cn(
            'w-full rounded-full overflow-hidden',
            heights[height]
          )}
          style={{
            background: 'linear-gradient(90deg, #EF4444 0%, #EF4444 30%, #D97706 30%, #D97706 60%, #0D9488 60%, #0D9488 80%, #1A73E8 80%, #1A73E8 100%)',
          }}
        />

        {/* Score indicator */}
        {showIndicator && (
          <div
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 transition-all duration-500"
            style={{ left: indicatorPosition }}
          >
            <div className="w-4 h-4 rounded-full bg-[var(--surface-1)] border-2 border-[var(--text-1)]" />
          </div>
        )}
      </div>

      {/* Labels */}
      {showLabels && (
        <div className="flex justify-between text-[10px] text-[var(--text-2)] mt-1.5">
          <span>Crítico</span>
          <span>Atenção</span>
          <span>Saudável</span>
          <span>Excepcional</span>
        </div>
      )}
    </div>
  )
}
