'use client'

import { cn } from '@/lib/utils'

/* ═══════════════════════════════════════════════
   DriversList — Top 3 positive + Top 3 negative
   Human + technical language, no emotion
   ═══════════════════════════════════════════════ */

export interface Driver {
  /** Short phrase describing the driver */
  text: string
  /** Related pillar (Valuation, Qualidade, Risco, Dividendos, Crescimento) */
  pillar: string
  /** Indicator value if available */
  value?: string
}

export interface DriversListProps {
  positive: Driver[]
  negative: Driver[]
  className?: string
}

export function DriversList({ positive, negative, className }: DriversListProps) {
  return (
    <div className={cn('grid grid-cols-1 sm:grid-cols-2 gap-4', className)}>
      {/* Positive drivers */}
      <div>
        <p className="text-[var(--text-caption)] text-[var(--text-3)] font-medium uppercase tracking-wider mb-2">
          Forças
        </p>
        <div className="space-y-2">
          {positive.slice(0, 3).map((driver, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="w-1 h-1 rounded-full bg-[var(--pos)] mt-[7px] flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-[var(--text-body)] text-[var(--text-1)] leading-snug">
                  {driver.text}
                </p>
                <p className="text-[var(--text-caption)] text-[var(--text-3)]">
                  {driver.pillar}
                  {driver.value && <span className="ml-1 font-mono tabular-nums">{driver.value}</span>}
                </p>
              </div>
            </div>
          ))}
          {positive.length === 0 && (
            <p className="text-[var(--text-body)] text-[var(--text-3)]">Nenhum driver positivo identificado</p>
          )}
        </div>
      </div>

      {/* Negative drivers */}
      <div>
        <p className="text-[var(--text-caption)] text-[var(--text-3)] font-medium uppercase tracking-wider mb-2">
          Riscos
        </p>
        <div className="space-y-2">
          {negative.slice(0, 3).map((driver, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="w-1 h-1 rounded-full bg-[var(--neg)] mt-[7px] flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-[var(--text-body)] text-[var(--text-1)] leading-snug">
                  {driver.text}
                </p>
                <p className="text-[var(--text-caption)] text-[var(--text-3)]">
                  {driver.pillar}
                  {driver.value && <span className="ml-1 font-mono tabular-nums">{driver.value}</span>}
                </p>
              </div>
            </div>
          ))}
          {negative.length === 0 && (
            <p className="text-[var(--text-body)] text-[var(--text-3)]">Nenhum risco identificado</p>
          )}
        </div>
      </div>
    </div>
  )
}
