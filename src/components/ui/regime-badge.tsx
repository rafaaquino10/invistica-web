'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/hooks/use-auth'
import { pro } from '@/lib/api/endpoints'

export function RegimeBadge() {
  const { token } = useAuth()

  const { data: regime } = useQuery({
    queryKey: ['macro-regime'],
    queryFn: () => pro.getMacroRegime(token ?? undefined),
    enabled: !!token,
    staleTime: 10 * 60 * 1000,
    refetchInterval: 15 * 60 * 1000,
  })

  if (!regime) return null

  const colorMap: Record<string, string> = {
    RISK_ON: 'bg-green-500/10 text-green-500 border-green-500/20',
    RISK_OFF: 'bg-red-500/10 text-red-500 border-red-500/20',
    STAGFLATION: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    RECOVERY: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  }

  const colors = colorMap[regime.regime] ?? 'bg-gray-500/10 text-gray-500 border-gray-500/20'

  return (
    <Link href="/analytics/regime" className="hidden md:flex items-center" title={`${regime.description}\nSELIC: ${regime.macro.selic}%`}>
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[var(--radius-sm)] text-[11px] font-medium border ${colors} hover:opacity-80 transition-opacity`}>
        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: regime.color }} />
        <span>{regime.label}</span>
      </span>
    </Link>
  )
}
