'use client'

import { type ReactNode, forwardRef, type HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface TrendProps {
  value: number
  suffix?: string
}

export interface MetricCardProps extends HTMLAttributes<HTMLDivElement> {
  label: string
  value: string | number
  variant?: 'default' | 'hero'
  trend?: TrendProps
  icon?: ReactNode
  iconColor?: 'blue' | 'teal' | 'amber' | 'red'
  sparkline?: ReactNode
  valueClassName?: string
}

const MetricCard = forwardRef<HTMLDivElement, MetricCardProps>(
  (
    {
      label,
      value,
      variant = 'default',
      trend,
      icon,
      iconColor = 'blue',
      sparkline,
      valueClassName,
      className,
      ...props
    },
    ref
  ) => {
    const iconColorClasses = {
      blue: 'icon-container-blue',
      teal: 'icon-container-teal',
      amber: 'icon-container-amber',
      red: 'icon-container-red',
    }

    const isPositiveTrend = trend && trend.value >= 0
    const trendColor = isPositiveTrend ? 'text-[var(--pos)]' : 'text-[var(--neg)]'

    return (
      <div
        ref={ref}
        className={cn(
          'rounded-[var(--radius)] border border-[var(--border-1)] p-4',
          'bg-[var(--surface-1)]',
          variant === 'hero' && 'border-[var(--accent-1)]/15',
          className
        )}
        {...props}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-[var(--text-caption)] text-[var(--text-3)] mb-1">
              {label}
            </p>
            <div className="flex items-baseline gap-2">
              <p
                className={cn(
                  'text-xl font-semibold font-mono tabular-nums truncate',
                  variant === 'hero' && 'gradient-text',
                  valueClassName
                )}
              >
                {value}
              </p>
              {trend && (
                <span className={cn('flex items-center text-[var(--text-small)] font-medium', trendColor)}>
                  {isPositiveTrend ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="18 15 12 9 6 15" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  )}
                  <span className="font-mono tabular-nums">
                    {Math.abs(trend.value).toFixed(1)}
                    {trend.suffix ?? '%'}
                  </span>
                </span>
              )}
            </div>
            {sparkline && <div className="mt-2">{sparkline}</div>}
          </div>

          {icon && (
            <div className={cn('icon-container flex-shrink-0', iconColorClasses[iconColor])}>
              {icon}
            </div>
          )}
        </div>
      </div>
    )
  }
)

MetricCard.displayName = 'MetricCard'

export { MetricCard }
