'use client'

import { type ReactNode, forwardRef, type HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export interface SectionHeaderProps extends HTMLAttributes<HTMLDivElement> {
  title: string
  subtitle?: string
  badge?: ReactNode
  action?: ReactNode
  gradientTitle?: boolean
}

const SectionHeader = forwardRef<HTMLDivElement, SectionHeaderProps>(
  ({ title, subtitle, badge, action, gradientTitle = false, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2', className)}
        {...props}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h2
              className={cn(
                'text-[var(--text-heading)] font-semibold tracking-tight truncate',
                gradientTitle && 'gradient-text'
              )}
            >
              {title}
            </h2>
            {badge}
          </div>
          {subtitle && (
            <p className="mt-0.5 text-[var(--text-body)] text-[var(--text-2)]">{subtitle}</p>
          )}
        </div>
        {action && <div className="flex-shrink-0">{action}</div>}
      </div>
    )
  }
)

SectionHeader.displayName = 'SectionHeader'

export { SectionHeader }
