'use client'

import { type ReactNode } from 'react'
import { Button, type ButtonProps } from './button'
import { cn } from '@/lib/utils'

export interface EmptyStateAction {
  label: string
  onClick: () => void
  variant?: ButtonProps['variant']
}

export interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  actions?: EmptyStateAction[]
  children?: ReactNode
  className?: string
  compact?: boolean
}

/**
 * Componente padronizado para estados vazios.
 * Exibe ícone + título + descrição + ações contextuais.
 *
 * Variantes:
 * - Default: padding generoso, ícone grande (para seções principais)
 * - Compact: padding reduzido, ícone menor (para cards/tabelas inline)
 */
export function EmptyState({
  icon,
  title,
  description,
  actions,
  children,
  className,
  compact = false,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        'border border-dashed border-[var(--border-1)]/30 rounded-[var(--radius)]',
        compact ? 'py-6 px-4' : 'py-12 px-6',
        className,
      )}
    >
      {icon && (
        <div
          className={cn(
            'flex items-center justify-center rounded-xl bg-[var(--surface-2)] text-[var(--text-2)]',
            compact ? 'w-10 h-10 mb-2.5' : 'w-14 h-14 mb-4',
          )}
        >
          {icon}
        </div>
      )}

      <h3
        className={cn(
          'font-semibold text-[var(--text-1)]',
          compact ? 'text-sm' : 'text-base',
        )}
      >
        {title}
      </h3>

      {description && (
        <p
          className={cn(
            'text-[var(--text-2)] max-w-xs',
            compact ? 'text-xs mt-1' : 'text-sm mt-1.5',
          )}
        >
          {description}
        </p>
      )}

      {children}

      {actions && actions.length > 0 && (
        <div className={cn('flex gap-2', compact ? 'mt-3' : 'mt-5')}>
          {actions.map((action, i) => (
            <Button
              key={i}
              variant={action.variant ?? (i === 0 ? 'primary' : 'secondary')}
              size="sm"
              onClick={action.onClick}
            >
              {action.label}
            </Button>
          ))}
        </div>
      )}
    </div>
  )
}
