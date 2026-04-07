'use client'

import { forwardRef, type HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'glass' | 'outline'
  hover?: boolean
  padding?: 'none' | 'sm' | 'md' | 'lg'
  gradient?: 'none' | 'blue' | 'teal' | 'hero'
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', hover = false, padding = 'md', gradient = 'none', children, ...props }, ref) => {
    const baseStyles = 'rounded-[var(--radius)] relative overflow-hidden'

    const variants = {
      default: 'bg-[var(--surface-1)] border border-[var(--border-1)]',
      glass: cn(
        'bg-[var(--glass-bg)] backdrop-blur-xl',
        'border border-[var(--glass-border)]'
      ),
      outline: 'border border-[var(--border-1)] bg-transparent',
    }

    const paddings = {
      none: '',
      sm: 'p-3',
      md: 'p-4',
      lg: 'p-5',
    }

    const hoverStyles = hover
      ? 'transition-colors duration-150 hover:bg-[var(--surface-2)] cursor-pointer'
      : ''

    const gradientBorder = {
      none: '',
      blue: 'border-[var(--accent-1)]/15',
      teal: 'border-[var(--pos)]/15',
      hero: 'border-[var(--accent-1)]/15',
    }

    return (
      <div
        ref={ref}
        className={cn(
          baseStyles,
          variants[variant],
          paddings[padding],
          hoverStyles,
          gradientBorder[gradient],
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)

Card.displayName = 'Card'

const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex flex-col space-y-1', className)}
      {...props}
    />
  )
)

CardHeader.displayName = 'CardHeader'

const CardTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn('text-[var(--text-subheading)] font-semibold leading-tight tracking-tight', className)}
      {...props}
    />
  )
)

CardTitle.displayName = 'CardTitle'

const CardDescription = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn('text-[var(--text-body)] text-[var(--text-2)]', className)}
      {...props}
    />
  )
)

CardDescription.displayName = 'CardDescription'

const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('', className)} {...props} />
  )
)

CardContent.displayName = 'CardContent'

const CardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex items-center pt-3', className)}
      {...props}
    />
  )
)

CardFooter.displayName = 'CardFooter'

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter }
