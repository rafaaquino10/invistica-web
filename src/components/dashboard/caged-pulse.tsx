'use client'

import { trpc } from '@/lib/trpc/client'
import { Card, CardContent, Skeleton } from '@/components/ui'
import { cn } from '@/lib/utils'

const TREND_CONFIG = {
  expanding: { label: 'Expandindo', color: 'text-green-500', bg: 'bg-green-500/15', dot: 'bg-green-500' },
  stable: { label: 'Estável', color: 'text-amber-500', bg: 'bg-amber-500/15', dot: 'bg-amber-500' },
  contracting: { label: 'Contraindo', color: 'text-red-500', bg: 'bg-red-500/15', dot: 'bg-red-500' },
}

export function CAGEDPulse() {
  const { data, isLoading } = trpc.economy.cagedPulse.useQuery(
    undefined,
    { staleTime: 60 * 60 * 1000 }, // 1h cache
  )

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4">
          <Skeleton className="h-5 w-40 mb-3" />
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Skeleton key={i} className="h-10" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!data || data.length === 0) return null

  const expanding = data.filter(d => d.trend === 'expanding').length
  const contracting = data.filter(d => d.trend === 'contracting').length

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--accent-1)]">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            <h3 className="text-[var(--text-small)] font-semibold text-[var(--text-1)]">
              Pulso Setorial CAGED
            </h3>
          </div>
          <div className="flex gap-2 text-[var(--text-caption)]">
            <span className="text-green-500">{expanding} expandindo</span>
            <span className="text-[var(--text-3)]">|</span>
            <span className="text-red-500">{contracting} contraindo</span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {data.map(sector => {
            const trend = TREND_CONFIG[sector.trend]
            return (
              <div
                key={sector.b3Sector}
                className={cn(
                  'flex items-center gap-2 px-2.5 py-1.5 rounded-lg',
                  trend.bg,
                )}
              >
                <div className={cn('w-2 h-2 rounded-full shrink-0', trend.dot)} />
                <div className="min-w-0">
                  <p className="text-[var(--text-caption)] font-medium text-[var(--text-1)] truncate">
                    {sector.b3Sector}
                  </p>
                  <p className={cn('text-[var(--text-caption)]', trend.color)}>
                    {sector.netBalance > 0 ? '+' : ''}{sector.netBalance.toLocaleString('pt-BR')}
                  </p>
                </div>
              </div>
            )
          })}
        </div>

        <p className="text-[var(--text-caption)] text-[var(--text-3)] mt-2">
          Fonte: CAGED/MTE. Emprego em alta antecipa receita setorial em 3-6 meses.
        </p>
      </CardContent>
    </Card>
  )
}
