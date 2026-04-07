'use client'

import { cn } from '@/lib/utils'

interface ChangeIndicatorProps {
  value: number | null | undefined
  suffix?: string
  size?: 'sm' | 'md' | 'lg'
  showArrow?: boolean
  /** Aplica micro-animação flash verde/vermelho ao mudar */
  flash?: boolean
  className?: string
}

export function ChangeIndicator({
  value,
  suffix = '%',
  size = 'md',
  showArrow = true,
  flash = false,
  className,
}: ChangeIndicatorProps) {
  if (value === null || value === undefined) {
    return (
      <span className={cn(
        'font-mono text-[var(--text-3)]',
        size === 'sm' && 'text-[11px]',
        size === 'md' && 'text-xs',
        size === 'lg' && 'text-sm',
        className
      )}>
        n/d
      </span>
    )
  }

  const isPositive = value > 0
  const isZero = value === 0

  return (
    <span className={cn(
      'inline-flex items-center gap-0.5 font-mono font-medium rounded-sm px-0.5',
      isZero
        ? 'text-[var(--text-3)]'
        : isPositive
          ? 'text-[var(--pos)]'
          : 'text-[var(--neg)]',
      flash && !isZero && (isPositive ? 'price-flash-up' : 'price-flash-down'),
      size === 'sm' && 'text-[11px]',
      size === 'md' && 'text-xs',
      size === 'lg' && 'text-sm',
      className
    )}>
      {showArrow && !isZero && (
        <svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 24 24" fill="currentColor" className="inline-block"><polygon points={isPositive ? '12 4 22 20 2 20' : '2 4 22 4 12 20'} /></svg>
      )}
      {isPositive ? '+' : ''}{value.toFixed(2)}{suffix}
    </span>
  )
}
