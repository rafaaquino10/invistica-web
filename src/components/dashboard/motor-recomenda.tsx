'use client'

import { useState } from 'react'
import Link from 'next/link'
import { trpc } from '@/lib/trpc/provider'
import { ScoreBadge, ChangeIndicator, ScrollableStrip } from '@/components/ui'
import { AssetLogo } from '@/components/ui/asset-logo'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/utils/formatters'
import type { RecommendationMode } from '@/lib/recommendations/engine'

const MODES: { key: RecommendationMode; label: string }[] = [
  { key: 'geral', label: 'Geral' },
  { key: 'valor', label: 'Valor' },
  { key: 'dividendos', label: 'Dividendos' },
  { key: 'crescimento', label: 'Crescimento' },
  { key: 'defensivo', label: 'Defensiva' },
  { key: 'momento', label: 'Momento' },
]

interface MotorRecomendaProps {
  portfolioTickers?: string[]
}

export function MotorRecomenda({ portfolioTickers = [] }: MotorRecomendaProps) {
  const [mode, setMode] = useState<RecommendationMode>('geral')

  const { data, isLoading } = trpc.screener.recommendations.useQuery(
    { mode, excludeTickers: portfolioTickers, limit: 3 },
    { staleTime: 5 * 60 * 1000 }
  )

  return (
    <div id="motor-recomenda" className="border border-[var(--border-1)]/20 rounded-[var(--radius)] bg-[var(--surface-1)]">
      {/* Header */}
      <div className="px-4 pt-4 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--accent-1)]">
            <path d="M12 2a10 10 0 0 1 10 10 10 10 0 0 1-10 10A10 10 0 0 1 2 12 10 10 0 0 1 12 2z"/>
            <path d="M12 6v6l4 2"/>
          </svg>
          <h3 className="text-[var(--text-small)] font-semibold">Motor IQ Recomenda</h3>
        </div>
      </div>

      {/* Mode selector */}
      <div className="px-4 pb-3">
        <ScrollableStrip>
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
        </ScrollableStrip>
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
      {!isLoading && data && (
        <div className="px-4 pb-4 space-y-2">
          {data.map((rec, idx) => (
            <Link
              key={rec.ticker}
              href={`/ativo/${rec.ticker}`}
              className={cn(
                'flex items-center gap-3 p-3 rounded-lg transition-colors hover:bg-[var(--surface-2)]/50',
                idx >= 1 && 'border-t border-[var(--border-1)]/10'
              )}
            >
              <AssetLogo ticker={rec.ticker} logo={rec.logo} size={32} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-semibold text-[var(--text-small)]">{rec.ticker}</span>
                  <ScoreBadge score={rec.aqScore} size="sm" />
                </div>
                <p className="text-[var(--text-caption)] text-[var(--text-2)] truncate">{rec.reason}</p>
                <div className="flex gap-1.5 mt-1 flex-wrap">
                  {rec.drivers.map(d => (
                    <span key={d} className="text-[var(--text-caption)] text-[var(--text-3)] bg-[var(--surface-2)] px-1.5 py-0.5 rounded">
                      {d}
                    </span>
                  ))}
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="font-mono text-[var(--text-small)]">{formatCurrency(rec.price)}</p>
                <ChangeIndicator value={rec.changePercent} size="sm" />
              </div>
            </Link>
          ))}

          {data.length === 0 && (
            <p className="text-center text-[var(--text-small)] text-[var(--text-3)] py-4">
              Nenhuma recomendação disponível para este modo.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
