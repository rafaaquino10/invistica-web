'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/hooks/use-auth'
import { pro } from '@/lib/api/endpoints'
import { ScoreBadge } from '@/components/ui'
import { cn } from '@/lib/utils'

type MandateMode = 'EQUILIBRADO' | 'CONSERVADOR' | 'ARROJADO'

const MODES: { key: MandateMode; label: string }[] = [
  { key: 'EQUILIBRADO', label: 'Equilibrado' },
  { key: 'CONSERVADOR', label: 'Conservador' },
  { key: 'ARROJADO', label: 'Arrojado' },
]

export function MotorRecomenda() {
  const [mode, setMode] = useState<MandateMode>('EQUILIBRADO')
  const { token } = useAuth()

  const { data, isLoading } = useQuery({
    queryKey: ['motor-recomenda', mode],
    queryFn: () => pro.getTop({ limit: 5, mandate: mode }, token ?? undefined),
    enabled: !!token,
    staleTime: 5 * 60 * 1000,
  })

  const items = data?.top ?? []

  return (
    <div id="motor-recomenda" className="border border-[var(--border-1)]/20 rounded-[var(--radius)] bg-[var(--surface-1)]">
      {/* Header */}
      <div className="px-4 pt-4 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--accent-1)]">
            <path d="M12 2a10 10 0 0 1 10 10 10 10 0 0 1-10 10A10 10 0 0 1 2 12 10 10 0 0 1 12 2z"/>
            <path d="M12 6v6l4 2"/>
          </svg>
          <h3 className="text-[var(--text-small)] font-semibold">IQ-Cognit Recomenda</h3>
        </div>
      </div>

      {/* Mode selector */}
      <div className="px-4 pb-3">
        <div className="flex gap-1.5 pb-1">
          {MODES.map(m => (
            <button
              key={m.key}
              onClick={() => setMode(m.key)}
              className={cn(
                'flex-shrink-0 px-2.5 py-1 rounded-lg text-[var(--text-caption)] font-medium transition-colors',
                mode === m.key
                  ? 'bg-[var(--accent-1)] text-white'
                  : 'text-[var(--text-2)] bg-[var(--surface-2)] hover:text-[var(--text-1)]'
              )}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="px-4 pb-4 space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 bg-[var(--surface-2)] rounded-lg animate-pulse" />
          ))}
        </div>
      )}

      {/* Recommendations */}
      {!isLoading && (
        <div className="px-4 pb-4 space-y-2">
          {items.map((rec, idx) => (
            <Link
              key={rec.ticker}
              href={`/ativo/${rec.ticker}`}
              className={cn(
                'flex items-center gap-3 p-3 rounded-lg transition-colors hover:bg-[var(--surface-2)]/50',
                idx >= 1 && 'border-t border-[var(--border-1)]/10'
              )}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-semibold text-[var(--text-small)]">{rec.ticker}</span>
                  <ScoreBadge score={rec.iq_score} size="sm" />
                </div>
                <p className="text-[var(--text-caption)] text-[var(--text-2)] truncate">{rec.company_name}</p>
              </div>
              <div className="text-right shrink-0">
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--surface-2)] text-[var(--text-3)]">
                  {rec.rating_label}
                </span>
              </div>
            </Link>
          ))}

          {items.length === 0 && (
            <p className="text-center text-[var(--text-small)] text-[var(--text-3)] py-4">
              Nenhuma recomendacao disponivel.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
