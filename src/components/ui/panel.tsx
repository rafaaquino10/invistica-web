'use client'

import { forwardRef, type HTMLAttributes, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

/* ═══════════════════════════════════════════════
   Panel — V2 replacement for template Card
   No shadow, border subtle, consistent padding
   ═══════════════════════════════════════════════ */

export interface PanelProps extends HTMLAttributes<HTMLDivElement> {
  /** Optional header with title + actions */
  header?: ReactNode
  /** Title shorthand (renders simple header) */
  title?: string
  /** Subtitle below title */
  subtitle?: string
  /** Actions slot (right-aligned in header) */
  actions?: ReactNode
  /** Padding density */
  density?: 'compact' | 'normal'
  /** Remove body padding */
  noPadding?: boolean
}

const Panel = forwardRef<HTMLDivElement, PanelProps>(
  ({ header, title, subtitle, actions, density = 'normal', noPadding = false, className, children, ...props }, ref) => {
    const bodyPadding = noPadding ? '' : density === 'compact' ? 'p-3' : 'p-4'
    const showHeader = header || title || actions

    return (
      <div
        ref={ref}
        className={cn(
          'bg-[var(--surface-1)] border border-[var(--border-1)] rounded-[var(--radius)] overflow-hidden',
          className
        )}
        {...props}
      >
        {showHeader && (
          <div className={cn(
            'flex items-center justify-between border-b border-[var(--border-1)]',
            density === 'compact' ? 'px-3 py-2' : 'px-4 py-3'
          )}>
            {header || (
              <>
                <div className="min-w-0">
                  {title && (
                    <h3 className="text-[var(--text-body)] font-semibold text-[var(--text-1)] truncate">
                      {title}
                    </h3>
                  )}
                  {subtitle && (
                    <p className="text-[var(--text-caption)] text-[var(--text-3)] mt-px">
                      {subtitle}
                    </p>
                  )}
                </div>
                {actions && <div className="flex-shrink-0 ml-3">{actions}</div>}
              </>
            )}
          </div>
        )}
        <div className={bodyPadding}>
          {children}
        </div>
      </div>
    )
  }
)

Panel.displayName = 'Panel'

export { Panel }
