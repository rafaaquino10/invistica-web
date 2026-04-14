'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

interface TickerLogoProps {
  ticker: string
  size?: number
  className?: string
}

export function TickerLogo({ ticker, size = 28, className }: TickerLogoProps) {
  const [error, setError] = useState(false)
  const initials = ticker.slice(0, 2).toUpperCase()
  const fontSize = Math.max(size * 0.3, 8)

  if (error) {
    return (
      <div
        className={cn(
          'flex items-center justify-center rounded-[var(--radius-sm)] bg-[var(--surface-2)] border border-[var(--border-1)] font-mono font-bold text-[var(--text-3)] flex-shrink-0',
          className
        )}
        style={{ width: size, height: size, fontSize }}
      >
        {initials}
      </div>
    )
  }

  return (
    <img
      src={`https://raw.githubusercontent.com/thefintz/icones-b3/main/icones/${ticker}.png`}
      alt={ticker}
      width={size}
      height={size}
      className={cn(
        'rounded-[var(--radius-sm)] object-cover flex-shrink-0 bg-[var(--surface-2)] border border-[var(--border-1)]',
        className
      )}
      onError={() => setError(true)}
    />
  )
}
