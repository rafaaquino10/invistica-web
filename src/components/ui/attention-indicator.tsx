'use client'

import { cn } from '@/lib/utils'

/* ═══════════════════════════════════════════════
   AttentionIndicator — Leve / Moderado / Elevado
   Separate from score, does not compete
   No aggressive red, just a marker + text
   ═══════════════════════════════════════════════ */

export type AttentionLevel = 'none' | 'leve' | 'moderado' | 'elevado'

export interface AttentionIndicatorProps {
  level: AttentionLevel
  /** Number of events in last 14 days */
  eventCount: number
  className?: string
}

const levelConfig = {
  none: {
    label: '',
    color: 'var(--text-3)',
    dotColor: 'bg-[var(--text-3)]',
  },
  leve: {
    label: 'Atenção Leve',
    color: 'var(--text-2)',
    dotColor: 'bg-[var(--text-3)]',
  },
  moderado: {
    label: 'Atenção Moderada',
    color: 'var(--warn)',
    dotColor: 'bg-[var(--warn)]',
  },
  elevado: {
    label: 'Atenção Elevada',
    color: 'var(--warn)',
    dotColor: 'bg-[var(--warn)]',
  },
}

export function AttentionIndicator({ level, eventCount, className }: AttentionIndicatorProps) {
  if (level === 'none' || eventCount === 0) return null

  const config = levelConfig[level]

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', config.dotColor)} />
      <span
        className="text-[var(--text-small)] font-medium"
        style={{ color: config.color }}
      >
        {config.label}
      </span>
      <span className="text-[var(--text-caption)] text-[var(--text-3)] font-mono tabular-nums">
        {eventCount} {eventCount === 1 ? 'evento' : 'eventos'} (14d)
      </span>
    </div>
  )
}

/** Calculate attention level from news event count */
export function calculateAttentionLevel(eventCount: number, hasPremiumSource = false): AttentionLevel {
  if (eventCount === 0) return 'none'
  if (eventCount >= 6 || (hasPremiumSource && eventCount >= 4)) return 'elevado'
  if (eventCount >= 3) return 'moderado'
  return 'leve'
}
