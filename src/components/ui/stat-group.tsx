'use client'

import { forwardRef, type HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export interface StatItem {
  label: string
  value: string | number
  valueClassName?: string
  color?: 'default' | 'blue' | 'teal' | 'amber' | 'red'
}

export interface StatGroupProps extends HTMLAttributes<HTMLDivElement> {
  stats: StatItem[]
  variant?: 'default' | 'compact' | 'bordered'
}

const StatGroup = forwardRef<HTMLDivElement, StatGroupProps>(
  ({ stats, variant = 'default', className, ...props }, ref) => {
    const colorClasses = {
      default: '',
      blue: 'text-[var(--accent-1)]',
      teal: 'text-[var(--pos)]',
      amber: 'text-[var(--warn)]',
      red: 'text-[var(--neg)]',
    }

    return (
      <div
        ref={ref}
        className={cn(
          'grid gap-6',
          variant === 'bordered' && 'py-4 border-y border-[var(--border-1)]',
          className
        )}
        style={{
          gridTemplateColumns: `repeat(${Math.min(stats.length, 4)}, minmax(0, 1fr))`,
        }}
        {...props}
      >
        {stats.map((stat, index) => (
          <div
            key={stat.label}
            className={cn(
              'text-center',
              index > 0 && variant !== 'compact' && 'relative',
              index > 0 &&
                variant !== 'compact' &&
                "before:content-[''] before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-6 before:w-px before:bg-[var(--border-1)] before:hidden sm:before:block"
            )}
          >
            <p
              className={cn(
                'font-semibold font-mono tabular-nums',
                variant === 'compact' ? 'text-lg' : 'text-xl md:text-2xl',
                colorClasses[stat.color ?? 'default'],
                stat.valueClassName
              )}
            >
              {stat.value}
            </p>
            <p
              className={cn(
                'text-[var(--text-3)] mt-0.5',
                variant === 'compact' ? 'text-[var(--text-caption)]' : 'text-[var(--text-small)]'
              )}
            >
              {stat.label}
            </p>
          </div>
        ))}
      </div>
    )
  }
)

StatGroup.displayName = 'StatGroup'

export { StatGroup }
