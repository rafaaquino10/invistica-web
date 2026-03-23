'use client'

import { forwardRef, type HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

/* ═══════════════════════════════════════════════
   Typography Primitives — V2
   Consistent text rendering across the app
   ═══════════════════════════════════════════════ */

/** Page/section title */
export const Title = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h2
      ref={ref}
      className={cn('text-[var(--text-heading)] font-semibold tracking-tight text-[var(--text-1)]', className)}
      {...props}
    />
  )
)
Title.displayName = 'Title'

/** Body text */
export const Text = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement> & { muted?: boolean }>(
  ({ className, muted, ...props }, ref) => (
    <p
      ref={ref}
      className={cn(
        'text-[var(--text-body)]',
        muted ? 'text-[var(--text-2)]' : 'text-[var(--text-1)]',
        className
      )}
      {...props}
    />
  )
)
Text.displayName = 'Text'

/** Small label text */
export const Label = forwardRef<HTMLSpanElement, HTMLAttributes<HTMLSpanElement>>(
  ({ className, ...props }, ref) => (
    <span
      ref={ref}
      className={cn('text-[var(--text-small)] text-[var(--text-3)]', className)}
      {...props}
    />
  )
)
Label.displayName = 'Label'

/** Caption / smallest text */
export const Caption = forwardRef<HTMLSpanElement, HTMLAttributes<HTMLSpanElement>>(
  ({ className, ...props }, ref) => (
    <span
      ref={ref}
      className={cn('text-[var(--text-caption)] text-[var(--text-3)]', className)}
      {...props}
    />
  )
)
Caption.displayName = 'Caption'

/** Metric / financial value display — always tabular-nums */
export const Metric = forwardRef<HTMLSpanElement, HTMLAttributes<HTMLSpanElement> & { size?: 'sm' | 'md' | 'lg' | 'xl' }>(
  ({ className, size = 'md', ...props }, ref) => (
    <span
      ref={ref}
      className={cn(
        'font-mono font-semibold tabular-nums text-[var(--text-1)]',
        size === 'sm' && 'text-[var(--text-body)]',
        size === 'md' && 'text-[var(--text-base)]',
        size === 'lg' && 'text-[var(--text-subheading)]',
        size === 'xl' && 'text-[var(--text-heading)]',
        className
      )}
      {...props}
    />
  )
)
Metric.displayName = 'Metric'
