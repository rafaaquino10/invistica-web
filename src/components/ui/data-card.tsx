'use client'

import { type ReactNode, forwardRef, type HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export interface DataCardProps extends HTMLAttributes<HTMLDivElement> {
  title?: string
  subtitle?: string
  action?: ReactNode
  noPadding?: boolean
}

const DataCard = forwardRef<HTMLDivElement, DataCardProps>(
  ({ title, subtitle, action, noPadding = false, className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'rounded-lg border border-[var(--border-1)] bg-[var(--surface-1)]',
          'overflow-hidden',
          className
        )}
        {...props}
      >
        {(title || action) && (
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-1)]">
            <div>
              {title && (
                <h3 className="text-[var(--text-subheading)] font-semibold text-[var(--text-1)]">
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="text-[var(--text-caption)] text-[var(--text-3)] mt-0.5">
                  {subtitle}
                </p>
              )}
            </div>
            {action && <div className="flex-shrink-0">{action}</div>}
          </div>
        )}
        <div className={cn(!noPadding && 'p-4')}>
          {children}
        </div>
      </div>
    )
  }
)

DataCard.displayName = 'DataCard'

export { DataCard }
