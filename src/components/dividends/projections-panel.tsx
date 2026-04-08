'use client'

import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/utils/formatters'
import { trpc } from '@/lib/trpc/provider'

export function DividendProjectionsPanel() {
  const { data, isLoading } = trpc.dividends.backendProjections.useQuery(undefined, {
    staleTime: 30 * 60 * 1000,
  })

  if (isLoading) {
    return (
      <div className="border border-[var(--border-1)] rounded-[var(--radius)] shadow-sm bg-[var(--surface-1)] p-4 animate-pulse">
        <div className="h-4 w-48 bg-[var(--surface-2)] rounded mb-3" />
        <div className="h-40 bg-[var(--surface-2)] rounded" />
      </div>
    )
  }

  if (!data?.projections?.length) return null

  const projections = data.projections
  const totalAnnual = projections.reduce((s: number, p: any) => s + (p.projected_value ?? 0), 0)

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-[11px] font-semibold text-[var(--text-3)] uppercase tracking-wider">
          Projecao de Dividendos — 12 Meses
        </h2>
        <span className="text-[14px] font-mono font-bold text-[var(--pos)]">
          {formatCurrency(totalAnnual)}/ano
        </span>
      </div>
      <div className="border border-[var(--border-1)] rounded-[var(--radius)] shadow-sm bg-[var(--surface-1)]">
        {/* Monthly bar chart */}
        <div className="p-4">
          <div className="flex items-end gap-1 h-[120px]">
            {projections.slice(0, 12).map((p: { month: string; projected_value: number }, i: number) => {
              const maxVal = Math.max(...projections.map((x: any) => x.projected_value ?? 0)) || 1
              const height = ((p.projected_value ?? 0) / maxVal) * 100
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[9px] font-mono text-[var(--text-3)]">
                    {p.projected_value > 0 ? formatCurrency(p.projected_value) : ''}
                  </span>
                  <div
                    className="w-full bg-[var(--pos)]/40 rounded-t hover:bg-[var(--pos)]/60 transition-colors"
                    style={{ height: `${Math.max(height, 2)}%` }}
                    title={`${p.month}: ${formatCurrency(p.projected_value)}`}
                  />
                  <span className="text-[9px] text-[var(--text-3)]">
                    {new Date(p.month + '-01').toLocaleDateString('pt-BR', { month: 'short' })}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Top payers */}
        {data.topPayers && data.topPayers.length > 0 && (
          <div className="px-4 pb-4 pt-2 border-t border-[var(--border-1)]/20">
            <p className="text-[10px] font-semibold text-[var(--text-3)] uppercase tracking-wider mb-2">Maiores Pagadores</p>
            <div className="flex items-center gap-4 flex-wrap">
              {data.topPayers.map((t: { ticker: string; yield: number; amount: number }) => (
                <div key={t.ticker} className="flex items-center gap-2">
                  <span className="font-mono text-[12px] font-bold text-[var(--text-1)]">{t.ticker}</span>
                  <span className="text-[11px] text-[var(--pos)] font-mono">{(t.yield * 100).toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
