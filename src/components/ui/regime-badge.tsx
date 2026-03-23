'use client'

import { trpc } from '@/lib/trpc/provider'

export function RegimeBadge() {
  const { data: regime } = trpc.economy.currentRegime.useQuery(undefined, {
    staleTime: 5 * 60 * 1000,
    refetchInterval: 10 * 60 * 1000,
  })

  if (!regime) return null

  const colorMap = {
    risk_off: 'bg-red-500/10 text-red-500 border-red-500/20',
    neutral: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    risk_on: 'bg-green-500/10 text-green-500 border-green-500/20',
  } as const

  const colors = colorMap[regime.regime]

  return (
    <div className="hidden md:flex items-center" title={`${regime.description}\nSELIC: ${regime.selic ?? '?'}%`}>
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-[var(--radius-sm)] text-[11px] font-medium border ${colors}`}>
        <span>{regime.display.emoji}</span>
        <span>{regime.display.label}</span>
      </span>
    </div>
  )
}
