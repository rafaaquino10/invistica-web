'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Skeleton, EmptyState, ScrollableStrip } from '@/components/ui'
import { AssetLogo } from '@/components/ui/asset-logo'
import { cn } from '@/lib/utils'
import { pro, free } from '@/lib/api/endpoints'
import { adaptPortfolio } from '@/lib/api/adapters'
import { useAuth } from '@/hooks/use-auth'
import { staggerContainer, fadeInUp } from '@/lib/utils/motion'
import {
  AreaChart, Area,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  BarChart, Bar,
} from 'recharts'

// ─── Formatters ──────────────────────────────────────────────
function fmt(value: number, opts?: { compact?: boolean; showCents?: boolean }): string {
  if (opts?.compact && Math.abs(value) >= 1_000_000) return `R$ ${(value / 1_000_000).toFixed(1).replace('.', ',')}M`
  if (opts?.compact && Math.abs(value) >= 1_000) return `R$ ${(value / 1_000).toFixed(1).replace('.', ',')}k`
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency', currency: 'BRL',
    minimumFractionDigits: opts?.showCents ? 2 : 0,
    maximumFractionDigits: opts?.showCents ? 2 : 0,
  }).format(value)
}

function pct(value: number): string {
  const sign = value >= 0 ? '+' : ''
  return `${sign}${value.toFixed(2).replace('.', ',')}%`
}

function getScoreColor(score: number): string {
  if (score >= 75) return 'text-[var(--pos)]'
  if (score >= 62) return 'text-[var(--accent-1)]'
  if (score >= 42) return 'text-[var(--text-1)]'
  return 'text-[var(--neg)]'
}

const RATING_LABELS: Record<string, string> = {
  STRONG_BUY: 'Compra Forte', BUY: 'Acumular', HOLD: 'Neutro',
  REDUCE: 'Reduzir', AVOID: 'Evitar',
}

const RATING_COLORS: Record<string, string> = {
  STRONG_BUY: 'bg-emerald-500/15 text-emerald-600',
  BUY: 'bg-blue-500/15 text-blue-600',
  HOLD: 'bg-amber-500/15 text-amber-600',
  REDUCE: 'bg-orange-500/15 text-orange-600',
  AVOID: 'bg-red-500/15 text-red-600',
}

// ─── Main Dashboard Page ─────────────────────────────────────
export default function DashboardPage() {
  const router = useRouter()
  const { token } = useAuth()

  // API queries
  const { data: topPicks, isLoading: loadingTop } = useQuery({
    queryKey: ['scores-top'],
    queryFn: () => pro.getTop({ limit: 12, mandate: 'EQUILIBRADO' }, token ?? undefined),
  })

  const { data: rawPortfolio, isLoading: loadingPortfolio } = useQuery({
    queryKey: ['portfolio'],
    queryFn: () => pro.getPortfolio(token ?? undefined),
  })

  const { data: clusters } = useQuery({
    queryKey: ['clusters'],
    queryFn: () => free.getClusters(),
  })

  const portfolio = useMemo(() => {
    if (!rawPortfolio?.positions) return null
    return adaptPortfolio(rawPortfolio.positions)
  }, [rawPortfolio])

  // Portfolio evolution mock (12 months)
  const evolutionData = useMemo(() => {
    if (!portfolio || portfolio.totalValue === 0) return []
    const now = new Date()
    const months: string[] = []
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      months.push(d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', ''))
    }
    const totalReturn = portfolio.totalValue - portfolio.totalCost
    return months.map((m, i) => {
      const progress = (i + 1) / months.length
      const value = portfolio.totalCost + totalReturn * progress
      const cdi = portfolio.totalCost * Math.pow(1.1315, (i + 1) / 12)
      return { month: m, valor: Math.round(value), custo: Math.round(portfolio.totalCost), cdi: Math.round(cdi) }
    })
  }, [portfolio])

  // Cluster distribution from top picks
  const clusterDistribution = useMemo(() => {
    if (!topPicks?.top) return []
    const counts: Record<number, number> = {}
    for (const pick of topPicks.top) {
      counts[pick.cluster_id] = (counts[pick.cluster_id] || 0) + 1
    }
    const clusterNames = clusters?.clusters?.reduce((acc, c) => ({ ...acc, [c.cluster_id]: c.name }), {} as Record<number, string>) ?? {}
    return Object.entries(counts)
      .map(([id, count]) => ({ cluster: clusterNames[Number(id)] ?? `Cluster ${id}`, count }))
      .sort((a, b) => b.count - a.count)
  }, [topPicks, clusters])

  return (
    <motion.div className="space-y-6" {...staggerContainer}>
      {/* ─── Hero: Patrimonio ──────────────────────────── */}
      {portfolio && portfolio.positionsCount > 0 && (
        <motion.div {...fadeInUp} className="rounded-[var(--radius)] border border-[var(--border-1)] p-6 bg-gradient-to-br from-[var(--surface-1)] via-[var(--surface-1)] to-[var(--accent-2)]">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <p className="text-[var(--text-caption)] font-medium text-[var(--text-2)] uppercase tracking-wider mb-1">Patrimônio Total</p>
              <p className="font-mono text-3xl md:text-4xl font-bold text-[var(--text-1)] leading-none">
                {fmt(portfolio.totalValue)}
              </p>
              <p className="text-[var(--text-small)] text-[var(--text-2)] mt-1 font-mono">
                Custo: {fmt(portfolio.totalCost, { compact: true })} | Ganho: {fmt(portfolio.gainLoss, { compact: true })}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className={cn(
                'text-right px-5 py-3 rounded-xl',
                portfolio.gainLossPercent >= 0 ? 'bg-[var(--pos)]/10' : 'bg-[var(--neg)]/10'
              )}>
                <p className={cn('font-mono text-2xl font-bold', portfolio.gainLossPercent >= 0 ? 'text-[var(--pos)]' : 'text-[var(--neg)]')}>
                  {pct(portfolio.gainLossPercent)}
                </p>
                <p className="text-[var(--text-caption)] text-[var(--text-2)]">Rentabilidade</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* ─── KPI Strip ───────────────────────────────────── */}
      <motion.div {...fadeInUp} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPI
          label="Patrimônio"
          value={portfolio ? fmt(portfolio.totalValue) : '--'}
          sub={portfolio ? `${portfolio.positionsCount} posições` : undefined}
          trend={portfolio?.gainLossPercent}
          loading={loadingPortfolio}
        />
        <KPI
          label="IQ-Score Médio"
          value={portfolio?.avgAqScore ? portfolio.avgAqScore.toFixed(0) : '--'}
          valueColor={getScoreColor(portfolio?.avgAqScore ?? 0)}
          sub={portfolio?.avgAqScore
            ? (portfolio.avgAqScore >= 75 ? 'Excelente' : portfolio.avgAqScore >= 62 ? 'Bom' : portfolio.avgAqScore >= 42 ? 'Neutro' : 'Atencao')
            : undefined}
          loading={loadingPortfolio}
        />
        <KPI
          label="Top IQ-Score"
          value={topPicks?.top?.[0]?.ticker ?? '--'}
          sub={topPicks?.top?.[0] ? `Score: ${topPicks.top[0].iq_score}` : undefined}
          loading={loadingTop}
        />
        <KPI
          label="Setores Cobertos"
          value={clusterDistribution.length ? `${clusterDistribution.length}` : '--'}
          sub={clusterDistribution[0]?.cluster ? `Maior: ${clusterDistribution[0].cluster}` : undefined}
          loading={loadingTop}
        />
      </motion.div>

      {/* ─── Row 1: Portfolio Chart + Cluster Distribution ─ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Portfolio Evolution */}
        <motion.div {...fadeInUp} className="lg:col-span-7 bg-[var(--surface-1)] rounded-[var(--radius)] shadow-sm border border-[var(--border-1)] overflow-hidden">
          <div className="px-5 py-4 border-b border-[var(--border-1)] flex items-center justify-between">
            <div>
              <h2 className="text-[var(--text-body)] font-semibold">Evolução do Patrimônio</h2>
              <p className="text-[var(--text-small)] text-[var(--text-2)]">12 meses vs CDI</p>
            </div>
            <Link href="/portfolio" className="text-[var(--text-small)] font-medium text-[var(--accent-1)] hover:underline">
              Ver portfolio
            </Link>
          </div>
          <div className="px-3 py-3">
            {loadingPortfolio ? (
              <Skeleton className="h-[200px]" />
            ) : evolutionData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={evolutionData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradValor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--accent-1)" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="var(--accent-1)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-1)" opacity={0.4} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--text-2)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--text-2)' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} width={42} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'var(--surface-1)', border: '1px solid var(--border-1)', borderRadius: '8px', fontSize: '12px' }}
                    formatter={(value: number, name: string) => {
                      const labels: Record<string, string> = { valor: 'Patrimônio', custo: 'Custo', cdi: 'CDI' }
                      return [fmt(value), labels[name] ?? name]
                    }}
                  />
                  <Area type="monotone" dataKey="custo" stroke="#6B7280" strokeWidth={1} strokeDasharray="4 4" fill="none" />
                  <Area type="monotone" dataKey="cdi" stroke="#9CA3AF" strokeWidth={1} strokeDasharray="2 2" fill="none" />
                  <Area type="monotone" dataKey="valor" stroke="var(--accent-1)" strokeWidth={2.5} fill="url(#gradValor)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState
                compact
                icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>}
                title="Crie seu portfólio"
                description="Adicione ações para acompanhar a evolução do patrimônio vs CDI."
                actions={[{ label: 'Criar Portfólio', onClick: () => router.push('/portfolio') }]}
                className="h-[200px] border-0"
              />
            )}
          </div>
        </motion.div>

        {/* Cluster Distribution */}
        <motion.div {...fadeInUp} className="lg:col-span-5 bg-[var(--surface-1)] rounded-[var(--radius)] shadow-sm border border-[var(--border-1)] overflow-hidden">
          <div className="px-5 py-4 border-b border-[var(--border-1)]">
            <h2 className="text-[var(--text-body)] font-semibold">Distribuição Setorial</h2>
            <p className="text-[var(--text-small)] text-[var(--text-2)]">Top picks por setor</p>
          </div>
          <div className="p-3">
            {clusterDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={clusterDistribution} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
                  <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--text-2)' }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="cluster" tick={{ fontSize: 11, fill: 'var(--text-2)' }} axisLine={false} tickLine={false} width={100} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'var(--surface-1)', border: '1px solid var(--border-1)', borderRadius: '8px', fontSize: '12px' }}
                  />
                  <Bar dataKey="count" fill="var(--accent-1)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Skeleton className="h-[200px]" />
            )}
          </div>
        </motion.div>
      </div>

      {/* ─── Row 2: Top IQ-Score Picks ─────────────────── */}
      <motion.div {...fadeInUp} className="bg-[var(--surface-1)] rounded-[var(--radius)] shadow-sm border border-[var(--border-1)] overflow-hidden">
        <div className="px-5 py-4 border-b border-[var(--border-1)] flex items-center justify-between">
          <div>
            <h2 className="text-[var(--text-body)] font-semibold">Motor IQ-Cognit Recomenda</h2>
            <p className="text-[var(--text-small)] text-[var(--text-2)]">Melhores oportunidades por IQ-Score</p>
          </div>
          <Link href="/explorer" className="text-[var(--text-small)] font-medium text-[var(--accent-1)] hover:underline">
            Ver screener completo
          </Link>
        </div>
        <div className="divide-y divide-[var(--border-1)]">
          {loadingTop ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="px-5 py-4"><Skeleton className="h-12" /></div>
            ))
          ) : topPicks?.top?.length ? (
            topPicks.top.slice(0, 10).map((pick, idx) => (
              <Link
                key={pick.ticker}
                href={`/ativo/${pick.ticker}`}
                className="flex items-center justify-between px-5 py-3.5 hover:bg-[var(--surface-2)] transition-colors group"
              >
                <div className="flex items-center gap-4">
                  <span className="text-xs font-mono text-[var(--text-2)] w-5">{idx + 1}</span>
                  <AssetLogo ticker={pick.ticker} size={36} />
                  <div>
                    <p className="font-semibold text-[var(--text-1)] group-hover:text-[var(--accent-1)] transition-colors">
                      {pick.ticker}
                    </p>
                    <p className="text-[var(--text-caption)] text-[var(--text-2)] truncate max-w-[250px]">
                      {pick.company_name}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {pick.safety_margin != null && (
                    <div className="text-right hidden md:block">
                      <p className={cn('font-mono text-xs',
                        pick.safety_margin > 0 ? 'text-[var(--pos)]' : 'text-[var(--neg)]'
                      )}>
                        Margem: {(pick.safety_margin * 100).toFixed(0)}%
                      </p>
                    </div>
                  )}
                  <span className={cn(
                    'text-xs font-semibold px-2.5 py-1 rounded-full',
                    RATING_COLORS[pick.rating] ?? 'bg-[var(--bg)] text-[var(--text-2)]'
                  )}>
                    {RATING_LABELS[pick.rating] ?? pick.rating}
                  </span>
                  <div className={cn(
                    'w-11 h-11 rounded-xl flex items-center justify-center font-mono text-sm font-bold',
                    pick.iq_score >= 75 ? 'bg-[var(--pos)]/12 text-[var(--pos)]' :
                    pick.iq_score >= 62 ? 'bg-[var(--accent-1)]/12 text-[var(--accent-1)]' :
                    'bg-[var(--bg)] text-[var(--text-2)]'
                  )}>
                    {pick.iq_score}
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <EmptyState
              compact
              title="API indisponivel"
              description="Verifique se o backend InvestIQ está rodando em investiqbackend-production.up.railway.app."
              className="py-10"
            />
          )}
        </div>
      </motion.div>

      {/* ─── Row 3: Portfolio Positions ────────────────── */}
      {portfolio && portfolio.positionsCount > 0 && (
        <motion.div {...fadeInUp} className="bg-[var(--surface-1)] rounded-[var(--radius)] shadow-sm border border-[var(--border-1)] overflow-hidden">
          <div className="px-5 py-4 border-b border-[var(--border-1)] flex items-center justify-between">
            <h2 className="text-[var(--text-body)] font-semibold">Minha Carteira</h2>
            <Link href="/portfolio" className="text-[var(--text-small)] font-medium text-[var(--accent-1)] hover:underline">
              Gerenciar
            </Link>
          </div>
          <div className="divide-y divide-[var(--border-1)]">
            {portfolio.positions.slice(0, 8).map((pos) => (
              <Link
                key={pos.id}
                href={`/ativo/${pos.ticker}`}
                className="flex items-center justify-between px-5 py-3 hover:bg-[var(--surface-2)] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <AssetLogo ticker={pos.ticker} size={32} />
                  <div>
                    <p className="font-semibold text-[var(--text-1)]">{pos.ticker}</p>
                    <p className="text-[var(--text-caption)] text-[var(--text-2)]">
                      {pos.quantity} cotas | Peso: {pos.weight.toFixed(1)}%
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-mono text-sm text-[var(--text-1)]">{fmt(pos.totalValue)}</p>
                    <p className={cn('font-mono text-xs', pos.gainLossPercent >= 0 ? 'text-[var(--pos)]' : 'text-[var(--neg)]')}>
                      {pct(pos.gainLossPercent)}
                    </p>
                  </div>
                  {pos.aqScore != null && (
                    <div className={cn(
                      'w-9 h-9 rounded-lg flex items-center justify-center font-mono text-xs font-bold',
                      pos.aqScore >= 65 ? 'bg-[var(--pos)]/10 text-[var(--pos)]' : 'bg-[var(--bg)] text-[var(--text-2)]'
                    )}>
                      {pos.aqScore}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}

// ─── KPI Component ──────────────────────────────────────────
function KPI({ label, value, sub, trend, loading, valueColor }: {
  label: string; value: string; sub?: string; trend?: number; loading?: boolean; valueColor?: string
}) {
  return (
    <div className="bg-[var(--surface-1)] rounded-[var(--radius)] border border-[var(--border-1)] p-4 hover:shadow-sm transition-shadow">
      <p className="text-[var(--text-caption)] font-medium text-[var(--text-2)] uppercase tracking-wider mb-1.5">{label}</p>
      {loading ? (
        <Skeleton className="h-7 w-24" />
      ) : (
        <>
          <div className="flex items-baseline gap-2">
            <p className={cn('font-mono text-xl font-bold', valueColor || 'text-[var(--text-1)]')}>{value}</p>
            {trend !== undefined && (
              <span className={cn('text-xs font-mono font-medium', trend >= 0 ? 'text-[var(--pos)]' : 'text-[var(--neg)]')}>
                {pct(trend)}
              </span>
            )}
          </div>
          {sub && <p className="text-[var(--text-caption)] text-[var(--text-2)] mt-0.5">{sub}</p>}
        </>
      )}
    </div>
  )
}
