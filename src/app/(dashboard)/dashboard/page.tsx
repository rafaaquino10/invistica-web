'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { Skeleton, ScoreBadge, EmptyState } from '@/components/ui'
import { cn } from '@/lib/utils'
import { pro, free } from '@/lib/api/endpoints'
import { useAuth } from '@/hooks/use-auth'

function fmt(value: number, opts?: { compact?: boolean }): string {
  if (opts?.compact && Math.abs(value) >= 1_000_000) {
    return `R$ ${(value / 1_000_000).toFixed(1).replace('.', ',')}M`
  }
  if (opts?.compact && Math.abs(value) >= 1_000) {
    return `R$ ${(value / 1_000).toFixed(1).replace('.', ',')}k`
  }
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

function pct(value: number): string {
  const sign = value >= 0 ? '+' : ''
  return `${sign}${value.toFixed(2).replace('.', ',')}%`
}

function getScoreColor(score: number): string {
  if (score >= 75) return 'text-[var(--pos)]'
  if (score >= 62) return 'text-[var(--accent-1)]'
  if (score >= 42) return 'text-[var(--text-2)]'
  return 'text-[var(--neg)]'
}

function getRatingLabel(rating: string): string {
  const labels: Record<string, string> = {
    STRONG_BUY: 'Compra Forte',
    BUY: 'Acumular',
    HOLD: 'Neutro',
    REDUCE: 'Reduzir',
    AVOID: 'Evitar',
  }
  return labels[rating] || rating
}

export default function DashboardPage() {
  const router = useRouter()
  const { token } = useAuth()

  const { data: topPicks, isLoading: loadingTop } = useQuery({
    queryKey: ['scores-top', 'EQUILIBRADO'],
    queryFn: () => pro.getTop({ limit: 10, mandate: 'EQUILIBRADO' }, token ?? undefined),
    enabled: true,
  })

  const { data: portfolio, isLoading: loadingPortfolio } = useQuery({
    queryKey: ['portfolio'],
    queryFn: () => pro.getPortfolio(token ?? undefined),
    enabled: true,
  })

  const { data: clusters } = useQuery({
    queryKey: ['clusters'],
    queryFn: () => free.getClusters(),
  })

  const portfolioValue = useMemo(() => {
    if (!portfolio?.positions) return { total: 0, cost: 0, gain: 0 }
    const total = portfolio.positions.reduce((s, p) => s + p.current_price * p.qty, 0)
    const cost = portfolio.positions.reduce((s, p) => s + p.avg_price * p.qty, 0)
    return { total, cost, gain: total - cost }
  }, [portfolio])

  const gainPct = portfolioValue.cost > 0
    ? ((portfolioValue.total - portfolioValue.cost) / portfolioValue.cost) * 100
    : 0

  return (
    <div className="space-y-6">
      {/* Hero: Patrimonio */}
      {portfolio && portfolio.positions.length > 0 && (
        <div className="rounded-[var(--radius)] border border-[var(--border-1)] p-5 bg-gradient-to-br from-[var(--surface-1)] to-[var(--accent-2)]">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <p className="text-[var(--text-caption)] font-medium text-[var(--text-2)] uppercase tracking-wider mb-1">Patrimonio Total</p>
              <p className="font-mono text-3xl md:text-4xl font-bold text-[var(--text-1)] leading-none">
                {fmt(portfolioValue.total)}
              </p>
              <p className="text-[var(--text-small)] text-[var(--text-2)] mt-1 font-mono">
                Custo: {fmt(portfolioValue.cost, { compact: true })} | Ganho: {fmt(portfolioValue.gain, { compact: true })}
              </p>
            </div>
            <div className={cn(
              'text-right px-4 py-2 rounded-lg',
              gainPct >= 0 ? 'bg-[var(--pos)]/10' : 'bg-[var(--neg)]/10'
            )}>
              <p className={cn('font-mono text-xl font-bold', gainPct >= 0 ? 'text-[var(--pos)]' : 'text-[var(--neg)]')}>
                {pct(gainPct)}
              </p>
              <p className="text-[var(--text-caption)] text-[var(--text-2)]">Rentabilidade</p>
            </div>
          </div>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPI label="Posicoes" value={portfolio ? `${portfolio.positions.length}` : '0'} loading={loadingPortfolio} />
        <KPI
          label="IQ-Score Medio"
          value={portfolio?.positions.length
            ? (portfolio.positions.reduce((s, p) => s + (p.iq_score ?? 0), 0) / portfolio.positions.length).toFixed(0)
            : '--'}
          loading={loadingPortfolio}
        />
        <KPI label="Patrimonio" value={fmt(portfolioValue.total)} loading={loadingPortfolio} />
        <KPI
          label="Rentabilidade"
          value={pct(gainPct)}
          valueColor={gainPct >= 0 ? 'text-[var(--pos)]' : 'text-[var(--neg)]'}
          loading={loadingPortfolio}
        />
      </div>

      {/* Top IQ-Score Picks */}
      <div className="bg-[var(--surface-1)] rounded-[var(--radius)] shadow-sm border border-[var(--border-1)] overflow-hidden">
        <div className="px-4 py-3 border-b border-[var(--border-1)] flex items-center justify-between">
          <div>
            <h2 className="text-[var(--text-body)] font-semibold">Top IQ-Score</h2>
            <p className="text-[var(--text-small)] text-[var(--text-2)]">Melhores oportunidades do motor IQ-Cognit</p>
          </div>
          <Link href="/explorer" className="text-[var(--text-small)] font-medium text-[var(--accent-1)] hover:underline">
            Ver todos
          </Link>
        </div>
        <div className="divide-y divide-[var(--border-1)]">
          {loadingTop ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="px-4 py-3">
                <Skeleton className="h-8" />
              </div>
            ))
          ) : topPicks?.top?.length ? (
            topPicks.top.slice(0, 8).map((pick) => (
              <Link
                key={pick.ticker}
                href={`/ativo/${pick.ticker}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-[var(--surface-2)] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'w-10 h-10 rounded-lg flex items-center justify-center font-mono text-sm font-bold',
                    pick.iq_score >= 75 ? 'bg-[var(--pos)]/15 text-[var(--pos)]' :
                    pick.iq_score >= 62 ? 'bg-[var(--accent-1)]/15 text-[var(--accent-1)]' :
                    'bg-[var(--text-2)]/10 text-[var(--text-2)]'
                  )}>
                    {pick.iq_score}
                  </div>
                  <div>
                    <p className="font-semibold text-[var(--text-1)]">{pick.ticker}</p>
                    <p className="text-[var(--text-caption)] text-[var(--text-2)] truncate max-w-[200px]">
                      {pick.company_name}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={cn(
                    'text-xs font-medium px-2 py-0.5 rounded-full',
                    pick.rating === 'STRONG_BUY' ? 'bg-[var(--pos)]/15 text-[var(--pos)]' :
                    pick.rating === 'BUY' ? 'bg-[var(--accent-1)]/15 text-[var(--accent-1)]' :
                    'bg-[var(--text-2)]/10 text-[var(--text-2)]'
                  )}>
                    {getRatingLabel(pick.rating)}
                  </span>
                  {pick.safety_margin != null && (
                    <p className="text-[var(--text-caption)] text-[var(--text-2)] mt-0.5 font-mono">
                      Margem: {(pick.safety_margin * 100).toFixed(0)}%
                    </p>
                  )}
                </div>
              </Link>
            ))
          ) : (
            <EmptyState
              compact
              title="Sem dados"
              description="A API InvestIQ precisa estar rodando para exibir os top picks."
              className="py-8"
            />
          )}
        </div>
      </div>

      {/* Portfolio positions */}
      {portfolio && portfolio.positions.length > 0 && (
        <div className="bg-[var(--surface-1)] rounded-[var(--radius)] shadow-sm border border-[var(--border-1)] overflow-hidden">
          <div className="px-4 py-3 border-b border-[var(--border-1)] flex items-center justify-between">
            <h2 className="text-[var(--text-body)] font-semibold">Minha Carteira</h2>
            <Link href="/portfolio" className="text-[var(--text-small)] font-medium text-[var(--accent-1)] hover:underline">
              Gerenciar
            </Link>
          </div>
          <div className="divide-y divide-[var(--border-1)]">
            {portfolio.positions.map((pos) => (
              <Link
                key={pos.id}
                href={`/ativo/${pos.ticker}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-[var(--surface-2)] transition-colors"
              >
                <div>
                  <p className="font-semibold text-[var(--text-1)]">{pos.ticker}</p>
                  <p className="text-[var(--text-caption)] text-[var(--text-2)]">
                    {pos.qty} cotas @ {fmt(pos.avg_price)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-[var(--text-body)] text-[var(--text-1)]">
                    {fmt(pos.current_price * pos.qty)}
                  </p>
                  {pos.gain_pct != null && (
                    <p className={cn(
                      'font-mono text-[var(--text-small)]',
                      pos.gain_pct >= 0 ? 'text-[var(--pos)]' : 'text-[var(--neg)]'
                    )}>
                      {pct(pos.gain_pct)}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function KPI({ label, value, sub, valueColor, loading, trend }: {
  label: string
  value: string
  sub?: string
  valueColor?: string
  loading?: boolean
  trend?: number
}) {
  return (
    <div className="bg-[var(--surface-1)] rounded-[var(--radius)] border border-[var(--border-1)] p-4">
      <p className="text-[var(--text-caption)] font-medium text-[var(--text-2)] uppercase tracking-wider mb-1">{label}</p>
      {loading ? (
        <Skeleton className="h-7 w-20" />
      ) : (
        <>
          <p className={cn('font-mono text-xl font-bold', valueColor || 'text-[var(--text-1)]')}>{value}</p>
          {sub && <p className="text-[var(--text-caption)] text-[var(--text-2)] mt-0.5">{sub}</p>}
        </>
      )}
    </div>
  )
}
