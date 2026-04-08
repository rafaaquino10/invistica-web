'use client'

import { cn } from '@/lib/utils'
import { trpc } from '@/lib/trpc/provider'

interface DividendTrapCardProps {
  ticker: string
}

export function DividendTrapCard({ ticker }: DividendTrapCardProps) {
  const { data, isLoading } = trpc.dividends.trapRisk.useQuery(
    { ticker },
    { staleTime: 15 * 60 * 1000 }
  )

  if (isLoading) {
    return (
      <div className="border border-[var(--border-1)]/20 rounded-[var(--radius)] bg-[var(--surface-1)] p-4 animate-pulse">
        <div className="h-4 w-40 bg-[var(--surface-2)] rounded mb-3" />
        <div className="h-20 w-full bg-[var(--surface-2)] rounded" />
      </div>
    )
  }

  if (!data || !data.available) return null

  const d = data
  const riskLevel: 'safe' | 'caution' | 'danger' =
    d.riskScore < 30 ? 'safe' :
    d.riskScore < 60 ? 'caution' : 'danger'

  const riskLabel =
    riskLevel === 'safe' ? 'Dividendo Sustentável' :
    riskLevel === 'caution' ? 'Atenção' : 'Risco de Armadilha'

  const riskColor =
    riskLevel === 'safe' ? 'text-teal' :
    riskLevel === 'caution' ? 'text-amber' : 'text-red'

  const riskBg =
    riskLevel === 'safe' ? 'bg-teal/10 border-teal/20' :
    riskLevel === 'caution' ? 'bg-amber/10 border-amber/20' : 'bg-red/10 border-red/20'

  return (
    <div className={cn('border rounded-[var(--radius)] p-4', riskBg)}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[11px] font-semibold text-[var(--text-3)] uppercase tracking-wider">
          Risco de Armadilha de Dividendos
        </h3>
        <span className={cn('text-[11px] font-bold px-2 py-0.5 rounded', riskColor)}>
          {riskLabel}
        </span>
      </div>

      {/* Risk meter */}
      <div className="mb-3">
        <div className="h-2 bg-[var(--surface-2)] rounded-full overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all',
              riskLevel === 'safe' ? 'bg-teal' :
              riskLevel === 'caution' ? 'bg-amber' : 'bg-red'
            )}
            style={{ width: `${d.riskScore}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-[var(--text-3)] mt-1">
          <span>Sustentável</span>
          <span>Armadilha</span>
        </div>
      </div>

      {/* Risk factors */}
      {d.factors && d.factors.length > 0 && (
        <ul className="space-y-1.5">
          {d.factors.map((factor: string, i: number) => (
            <li key={i} className="flex items-start gap-2 text-[12px] text-[var(--text-1)] leading-relaxed">
              <span className={cn(
                'mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0',
                riskLevel === 'safe' ? 'bg-teal' :
                riskLevel === 'caution' ? 'bg-amber' : 'bg-red'
              )} />
              {factor}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
