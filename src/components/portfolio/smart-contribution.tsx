'use client'

import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/utils/formatters'
import { trpc } from '@/lib/trpc/provider'
import { AssetLogo } from '@/components/ui/asset-logo'

interface SmartContributionProps {
  portfolioId?: string
}

export function SmartContribution({ portfolioId }: SmartContributionProps) {
  const { data, isLoading } = trpc.portfolio.smartContribution.useQuery(
    { portfolioId },
    { staleTime: 10 * 60 * 1000, enabled: true }
  )

  if (isLoading) {
    return (
      <div className="border border-[var(--border-1)] rounded-[var(--radius)] shadow-sm bg-[var(--surface-1)] p-4 animate-pulse">
        <div className="h-4 w-48 bg-[var(--surface-2)] rounded mb-3" />
        <div className="h-32 w-full bg-[var(--surface-2)] rounded" />
      </div>
    )
  }

  if (!data || !data.available || !data.suggestions?.length) return null

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-[11px] font-semibold text-[var(--text-3)] uppercase tracking-wider">
          Contribuicao Inteligente
        </h2>
        <span className="text-[10px] text-[var(--accent-1)] font-medium">
          IQ-Cognit Engine
        </span>
      </div>
      <div className="border border-[var(--border-1)] rounded-[var(--radius)] shadow-sm bg-[var(--surface-1)] p-4">
        <p className="text-[13px] text-[var(--text-2)] mb-4">
          {data.rationale ?? 'Distribuicao otima baseada no IQ-Score, valuation e diversificacao da carteira.'}
        </p>

        <div className="space-y-2">
          {data.suggestions.map((s: { ticker: string; weight: number; reason: string; logo?: string }) => (
            <div
              key={s.ticker}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-[var(--surface-2)] transition-colors"
            >
              <AssetLogo ticker={s.ticker} logo={s.logo ?? null} size={28} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[13px] font-bold text-[var(--text-1)]">{s.ticker}</span>
                  <span className="text-[11px] text-[var(--text-3)] truncate">{s.reason}</span>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <div className="w-20 h-1.5 bg-[var(--surface-2)] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[var(--accent-1)] rounded-full"
                    style={{ width: `${s.weight * 100}%` }}
                  />
                </div>
                <span className="font-mono text-[13px] font-bold text-[var(--accent-1)] w-12 text-right">
                  {(s.weight * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          ))}
        </div>

        {data.amount && (
          <div className="mt-4 pt-3 border-t border-[var(--border-1)]/20 text-[12px] text-[var(--text-2)]">
            Proximo aporte sugerido: <span className="font-mono font-bold text-[var(--text-1)]">{formatCurrency(data.amount)}</span>
          </div>
        )}
      </div>
    </div>
  )
}
