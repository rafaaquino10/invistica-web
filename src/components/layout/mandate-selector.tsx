'use client'

import { useMandate, type Mandate } from '@/hooks/use-mandate'
import { cn } from '@/lib/utils'

interface MandateSelectorProps {
  size?: 'sm' | 'md'
  className?: string
}

export function MandateSelector({ size = 'sm', className }: MandateSelectorProps) {
  const { mandate, setMandate, mandates, meta } = useMandate()

  return (
    <div className={cn('flex gap-0.5 p-0.5 bg-[var(--bg)] rounded-lg border border-[var(--border-1)]', className)}>
      {mandates.map((m) => (
        <button
          key={m}
          onClick={() => setMandate(m)}
          title={meta[m].description}
          className={cn(
            'transition-all font-medium rounded-md',
            size === 'sm' ? 'px-2 py-1 text-[10px]' : 'px-3 py-1.5 text-xs',
            mandate === m
              ? 'bg-[var(--accent-1)] text-white shadow-sm'
              : 'text-[var(--text-2)] hover:text-[var(--text-1)] hover:bg-[var(--surface-1)]'
          )}
        >
          {size === 'sm' ? meta[m].short : meta[m].label}
        </button>
      ))}
    </div>
  )
}
