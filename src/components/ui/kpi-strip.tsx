'use client'

import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

/* ═══════════════════════════════════════════════
   KPIStrip — Horizontal institutional metric bar
   Multiple KPIs separated by thin vertical dividers
   No individual cards, no shadows
   ═══════════════════════════════════════════════ */

export interface KPIItem {
  label: string
  value: ReactNode
  /** Optional delta indicator (e.g. "+3.2%") */
  delta?: ReactNode
  /** Delta sentiment */
  sentiment?: 'positive' | 'negative' | 'neutral'
}

export interface KPIStripProps {
  items: KPIItem[]
  className?: string
}

export function KPIStrip({ items, className }: KPIStripProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-0 overflow-x-auto no-scrollbar',
        'bg-[var(--surface-1)] border border-[var(--border-1)] rounded-[var(--radius)]',
        className
      )}
    >
      {items.map((item, index) => (
        <div key={item.label} className="flex items-center">
          {index > 0 && (
            <div className="w-px h-8 bg-[var(--border-1)] flex-shrink-0" />
          )}
          <div className="px-4 py-3 min-w-0">
            <p className="text-[var(--text-caption)] text-[var(--text-3)] whitespace-nowrap">
              {item.label}
            </p>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-[var(--text-base)] font-semibold font-mono tabular-nums text-[var(--text-1)] whitespace-nowrap">
                {item.value}
              </span>
              {item.delta && (
                <span className={cn(
                  'text-[var(--text-caption)] font-mono tabular-nums whitespace-nowrap',
                  item.sentiment === 'positive' && 'text-[var(--pos)]',
                  item.sentiment === 'negative' && 'text-[var(--neg)]',
                  (!item.sentiment || item.sentiment === 'neutral') && 'text-[var(--text-3)]',
                )}>
                  {item.delta}
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
