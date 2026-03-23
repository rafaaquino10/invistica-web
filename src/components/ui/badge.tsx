'use client'

import { forwardRef, type HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'outline'
  size?: 'sm' | 'md'
}

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', size = 'md', ...props }, ref) => {
    const baseStyles = 'inline-flex items-center font-medium rounded-[var(--radius-sm)]'

    const variants = {
      default: 'bg-[var(--surface-2)] text-[var(--text-2)]',
      primary: 'bg-[var(--accent-2)] text-[var(--accent-1)]',
      success: 'badge-success',
      warning: 'badge-warning',
      danger: 'badge-danger',
      outline: 'border border-[var(--border-1)] text-[var(--text-2)]',
    }

    const sizes = {
      sm: 'px-1.5 py-px text-[var(--text-caption)]',
      md: 'px-2 py-px text-[var(--text-small)]',
    }

    return (
      <span
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      />
    )
  }
)

Badge.displayName = 'Badge'

export { Badge }
