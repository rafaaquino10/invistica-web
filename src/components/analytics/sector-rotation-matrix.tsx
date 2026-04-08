'use client'

import { cn } from '@/lib/utils'
import { trpc } from '@/lib/trpc/provider'

const REGIME_LABELS: Record<string, string> = {
  RISK_ON: 'Risk On',
  RISK_OFF: 'Risk Off',
  STAGFLATION: 'Estagflacao',
  RECOVERY: 'Recuperacao',
}

const SIGNAL_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  favorecido: { bg: 'bg-teal/20', text: 'text-teal', label: '+' },
  neutro: { bg: 'bg-[var(--surface-2)]', text: 'text-[var(--text-3)]', label: '=' },
  desfavorecido: { bg: 'bg-red/20', text: 'text-red', label: '-' },
}

export function SectorRotationMatrix() {
  const { data, isLoading } = trpc.backtest.sectorRotation.useQuery(undefined, {
    staleTime: 30 * 60 * 1000,
  })

  if (isLoading) {
    return (
      <div className="border border-[var(--border-1)] rounded-[var(--radius)] shadow-sm bg-[var(--surface-1)] p-4 animate-pulse">
        <div className="h-4 w-48 bg-[var(--surface-2)] rounded mb-3" />
        <div className="h-40 w-full bg-[var(--surface-2)] rounded" />
      </div>
    )
  }

  if (!data?.available || !data.matrix || Object.keys(data.matrix).length === 0) return null

  const regimes = Object.keys(REGIME_LABELS)
  const clusters = data.clusters?.length > 0
    ? data.clusters.map(c => c.name)
    : Object.keys(data.matrix[Object.keys(data.matrix)[0]!] ?? {})

  return (
    <div>
      <h2 className="text-[11px] font-semibold text-[var(--text-3)] uppercase tracking-wider mb-2">
        Rotacao Setorial por Regime
      </h2>
      <div className="border border-[var(--border-1)] rounded-[var(--radius)] shadow-sm bg-[var(--surface-1)] overflow-x-auto">
        <table className="w-full text-[11px]">
          <thead>
            <tr className="border-b border-[var(--border-1)]/20">
              <th className="text-left p-2 font-semibold text-[var(--text-3)] sticky left-0 bg-[var(--surface-1)]">Cluster</th>
              {regimes.map(r => (
                <th
                  key={r}
                  className={cn(
                    'p-2 text-center font-semibold',
                    data.current_regime === r ? 'text-[var(--accent-1)] bg-[var(--accent-1)]/5' : 'text-[var(--text-3)]'
                  )}
                >
                  {REGIME_LABELS[r] ?? r}
                  {data.current_regime === r && <span className="block text-[9px]">(atual)</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {clusters.map(cluster => (
              <tr key={cluster} className="border-b border-[var(--border-1)]/10 hover:bg-[var(--surface-2)]/20">
                <td className="p-2 font-medium text-[var(--text-1)] sticky left-0 bg-[var(--surface-1)] whitespace-nowrap">
                  {cluster}
                </td>
                {regimes.map(regime => {
                  const cell = data.matrix[regime]?.[cluster]
                  const signal = cell?.signal ?? 'neutro'
                  const style = SIGNAL_STYLES[signal] ?? SIGNAL_STYLES['neutro']!
                  const tilt = cell?.tilt_points ?? 0
                  return (
                    <td
                      key={regime}
                      className={cn(
                        'p-2 text-center font-mono font-bold',
                        style.bg, style.text,
                        data.current_regime === regime && 'ring-1 ring-[var(--accent-1)]/20'
                      )}
                    >
                      {tilt > 0 ? `+${tilt}` : tilt < 0 ? String(tilt) : style.label}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center gap-4 mt-2 text-[10px] text-[var(--text-3)]">
        <span className="flex items-center gap-1"><span className="w-3 h-3 bg-teal/20 rounded" /> Favorecido</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 bg-[var(--surface-2)] rounded" /> Neutro</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 bg-red/20 rounded" /> Desfavorecido</span>
      </div>
    </div>
  )
}
