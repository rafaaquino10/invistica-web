'use client'

import { cn } from '@/lib/utils'

interface DataUnavailableProps {
  title?: string
  message?: string
  compact?: boolean
  className?: string
}

/**
 * Componente padrao para dados indisponiveis.
 * Substitui `return null` em componentes que dependem de dados do backend.
 *
 * Uso: <DataUnavailable title="Risk Lab" message="Metricas de risco indisponiveis para este ativo." />
 */
export function DataUnavailable({ title, message, compact, className }: DataUnavailableProps) {
  if (compact) {
    return (
      <div className={cn('flex items-center gap-2 py-2 px-3 rounded-lg bg-[var(--surface-2)]/50 text-[11px] text-[var(--text-3)]', className)}>
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 opacity-50">
          <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        {message ?? 'Dados indisponiveis no momento.'}
      </div>
    )
  }

  return (
    <div className={cn(
      'border border-[var(--border-1)]/20 rounded-[var(--radius)] bg-[var(--surface-1)] p-5',
      className
    )}>
      <div className="flex flex-col items-center justify-center text-center py-4">
        <div className="w-10 h-10 rounded-full bg-[var(--surface-2)] flex items-center justify-center mb-3">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--text-3)]">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        {title && (
          <p className="text-[12px] font-semibold text-[var(--text-2)] mb-1">{title}</p>
        )}
        <p className="text-[12px] text-[var(--text-3)] max-w-xs">
          {message ?? 'Os dados para esta analise ainda nao estao disponiveis. Tente novamente mais tarde.'}
        </p>
      </div>
    </div>
  )
}

/**
 * Skeleton padrao para componentes carregando.
 */
export function DataSkeleton({ rows = 3, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn('border border-[var(--border-1)]/20 rounded-[var(--radius)] bg-[var(--surface-1)] p-4 animate-pulse', className)}>
      <div className="h-4 w-40 bg-[var(--surface-2)] rounded mb-3" />
      <div className="space-y-2">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="h-8 bg-[var(--surface-2)] rounded" style={{ width: `${100 - i * 15}%` }} />
        ))}
      </div>
    </div>
  )
}

/**
 * Banner de modo demonstracao.
 */
export function DemoBanner() {
  return (
    <div className="bg-amber/10 border border-amber/20 rounded-[var(--radius)] px-4 py-2.5 flex items-center gap-3 mb-4">
      <div className="w-6 h-6 rounded-full bg-amber/20 flex items-center justify-center flex-shrink-0">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      </div>
      <div className="flex-1">
        <p className="text-[12px] font-semibold text-amber">Modo Demonstracao</p>
        <p className="text-[11px] text-[var(--text-2)]">Voce esta vendo dados de exemplo. Adicione sua carteira para dados reais.</p>
      </div>
    </div>
  )
}
