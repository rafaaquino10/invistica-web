'use client'

import { forwardRef, type HTMLAttributes, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface ZoneContainerProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'hero' | 'control' | 'data' | 'feature'
  children: ReactNode
}

const ZoneContainer = forwardRef<HTMLDivElement, ZoneContainerProps>(
  ({ variant = 'data', className, children, ...props }, ref) => {
    const variantClasses = {
      hero: 'zone-hero -mx-4 md:-mx-6 px-4 md:px-6 py-6 md:py-8 rounded-[var(--radius)]',
      control: 'zone-control -mx-4 md:-mx-6 px-4 md:px-6 py-4 rounded-[var(--radius)]',
      data: '',
      feature: 'relative',
    }

    return (
      <div
        ref={ref}
        className={cn(variantClasses[variant], className)}
        {...props}
      >
        {children}
      </div>
    )
  }
)

ZoneContainer.displayName = 'ZoneContainer'

export { ZoneContainer }
