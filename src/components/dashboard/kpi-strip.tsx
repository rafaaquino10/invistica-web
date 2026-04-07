'use client'

import { cn } from '@/lib/utils'

export interface KpiItem {
  label: string
  value: string
  change?: number | null
  suffix?: string
}

export function KpiStrip({ items }: { items: KpiItem[] }) {
  return (
    <div className="flex items-stretch gap-3 overflow-x-auto pb-1">
      {items.map((kpi) => (
        <div
          key={kpi.label}
          className="flex flex-col gap-0.5 min-w-[120px] flex-1 rounded-[var(--radius)] bg-[var(--surface-1)] border border-[var(--border-1)]/30 px-3 py-2.5"
        >
          <span className="text-[10px] font-medium uppercase tracking-wider text-[var(--text-3)]">
            {kpi.label}
          </span>
          <span className="font-mono text-[18px] font-bold text-[var(--text-1)] leading-tight">
            {kpi.value}{kpi.suffix || ''}
          </span>
          {kpi.change != null && (
            <span className={cn(
              'font-mono text-[11px] font-semibold',
              kpi.change >= 0 ? 'text-[var(--pos)]' : 'text-[var(--neg)]'
            )}>
              {kpi.change >= 0 ? '▲' : '▼'} {kpi.change >= 0 ? '+' : ''}{kpi.change.toFixed(2)}%
            </span>
          )}
        </div>
      ))}
    </div>
  )
}
