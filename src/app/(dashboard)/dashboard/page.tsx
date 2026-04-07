'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Skeleton, ScoreBadge, ChangeIndicator, EmptyState, Tooltip as UITooltip, ScrollableStrip } from '@/components/ui'
import { SemaphoreBadge } from '@/components/score/score-semaphore'
import { getScoreBadge } from '@/lib/scoring/score-narrator'
import { trpc } from '@/lib/trpc/client'
import { cn } from '@/lib/utils'
import { getScoreTextClass, getScoreLabel, getScoreBgLightClass } from '@/lib/utils/formatters'
import {
  AreaChart, Area,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'
import { GettingStartedChecklist } from '@/components/onboarding/getting-started-checklist'
import { MotorRecomenda } from '@/components/dashboard/motor-recomenda'
import { AlertsCenter } from '@/components/dashboard/alerts-center'

// ─── Helpers ────────────────────────────────────────────────

function fmt(value: number, opts?: { compact?: boolean; showCents?: boolean }): string {
  if (opts?.compact && Math.abs(value) >= 1_000_000) {
    return `R$ ${(value / 1_000_000).toFixed(1).replace('.', ',')}M`
  }
  if (opts?.compact && Math.abs(value) >= 1_000) {
    return `R$ ${(value / 1_000).toFixed(1).replace('.', ',')}k`
  }
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: opts?.showCents ? 2 : 0,
    maximumFractionDigits: opts?.showCents ? 2 : 0,
  }).format(value)
}

function pct(value: number): string {
  const sign = value >= 0 ? '+' : ''
  return `${sign}${value.toFixed(2).replace('.', ',')}%`
}


function generatePortfolioEvolution(totalValue: number, totalCost: number, cdiAnnual: number, ibovAnnual: number) {
  const now = new Date()
  const months: string[] = []
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push(d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', ''))
  }
  const totalReturn = totalValue - totalCost
  return months.map((m, i) => {
    const progress = (i + 1) / months.length
    const value = totalCost + totalReturn * progress
    const cdi = totalCost * Math.pow(1 + cdiAnnual, (i + 1) / 12)
    const ibov = totalCost * Math.pow(1 + ibovAnnual, (i + 1) / 12)
    return {
      month: m,
      valor: Math.round(value),
      custo: Math.round(totalCost),
      cdi: Math.round(cdi),
      ibov: Math.round(ibov),
    }
  })
}

// ─── Main Page ──────────────────────────────────────────────

export default function DashboardPage() {
  const router = useRouter()
  const { data: portfolios, isLoading: loadingPortfolios } = trpc.portfolio.list.useQuery()
  const { data: dividends, isLoading: loadingDividends } = trpc.dividends.summary.useQuery({ period: 'YTD' })
  const { data: health, isLoading: loadingHealth } = trpc.radar.portfolioHealth.useQuery()
  const { data: heatmap } = trpc.screener.sectorHeatmap.useQuery()
  const { data: moversData } = trpc.screener.scoreMovers.useQuery({ limit: 8 })
  const movers = moversData?.movers
  const { data: benchmarkRates } = trpc.portfolio.benchmarkRates.useQuery()
  const { data: marketPulse } = trpc.screener.marketPulse.useQuery()

  const portfolio = portfolios?.[0]

  // Get tickers in portfolio to exclude from opportunities
  const portfolioTickers = useMemo(() => {
    if (!portfolio) return []
    return [] // will be enriched from portfolio detail
  }, [portfolio])

  const { data: portfolioDetail } = trpc.portfolio.get.useQuery(
    { id: portfolio?.id ?? '' },
    { enabled: !!portfolio?.id }
  )

  const ownedTickers = useMemo(() => {
    if (!portfolioDetail?.positions) return []
    return portfolioDetail.positions.map((p: any) => p.ticker)
  }, [portfolioDetail])

  const evolutionData = useMemo(() => {
    if (!portfolio) return []
    const cdi = benchmarkRates?.cdiAnnual ?? 0.1315
    const ibov = benchmarkRates?.ibovAnnual ?? 0.08
    return generatePortfolioEvolution(portfolio.totalValue, portfolio.totalCost, cdi, ibov)
  }, [portfolio, benchmarkRates])

  const gainLossPct = portfolio && portfolio.totalCost > 0
    ? ((portfolio.totalValue - portfolio.totalCost) / portfolio.totalCost) * 100
    : 0

  const heatmapStats = useMemo(() => {
    if (!heatmap || heatmap.length === 0) return null
    const sorted = [...heatmap].sort((a, b) => b.avgChange - a.avgChange)
    const totalCount = heatmap.reduce((s, h) => s + h.count, 0)
    return {
      ups: heatmap.filter(s => s.avgChange > 0).length,
      downs: heatmap.filter(s => s.avgChange < 0).length,
      bestSector: sorted[0],
      worstSector: sorted[sorted.length - 1],
      avgScoreAll: totalCount > 0
        ? heatmap.reduce((s, h) => s + h.avgScore * h.count, 0) / totalCount
        : 0,
    }
  }, [heatmap])

  return (
    <div className="space-y-6">
      {/* ─── Hero Card: Patrimônio ──────────────────────── */}
      {portfolio && !loadingPortfolios && (
        <div
          id="hero-patrimonio"
          className="rounded-[var(--radius)] border border-[var(--border-1)] p-5 bg-gradient-to-br from-[var(--surface-1)] to-[var(--accent-2)]"
        >
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <p className="text-[var(--text-caption)] font-medium text-[var(--text-2)] uppercase tracking-wider mb-1">Patrimônio Total</p>
              <p className="font-mono text-3xl md:text-4xl font-bold text-[var(--text-1)] leading-none">
                {fmt(portfolio.totalValue)}
              </p>
              <p className="text-[var(--text-small)] text-[var(--text-2)] mt-1 font-mono">
                Custo: {fmt(portfolio.totalCost, { compact: true })} · Ganho: {fmt(portfolio.gainLoss, { compact: true })}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className={cn(
                'text-right px-4 py-2 rounded-lg',
                gainLossPct >= 0 ? 'bg-[var(--pos)]/10' : 'bg-[var(--neg)]/10'
              )}>
                <p className={cn('font-mono text-xl font-bold', gainLossPct >= 0 ? 'text-[var(--pos)]' : 'text-[var(--neg)]')}>
                  {pct(gainLossPct)}
                </p>
                <p className="text-[var(--text-caption)] text-[var(--text-2)]">Rentabilidade</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── KPI Strip ───────────────────────────────────── */}
      <div id="kpi-strip" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPI
          label="Patrimônio"
          value={portfolio ? fmt(portfolio.totalValue) : '—'}
          sub={portfolio ? `Custo ${fmt(portfolio.totalCost, { compact: true })}` : undefined}
          trend={portfolio ? gainLossPct : undefined}
          loading={loadingPortfolios}
          tooltipText="Valor total dos ativos da sua carteira ao preço atual de mercado"
        />
        <KPI
          label="Dividendos YTD"
          value={dividends ? fmt(dividends.totalReceived) : '—'}
          sub={dividends ? `Yield ${dividends.overallYield?.toFixed(1) ?? '—'}%` : undefined}
          loading={loadingDividends}
          tooltipText="Total de dividendos e JCP recebidos no ano corrente (Jan–Dez)"
        />
        <KPI
          label="IQ Score Médio"
          value={portfolio?.avgAqScore ? portfolio.avgAqScore.toFixed(0) : '—'}
          valueColor={getScoreTextClass(portfolio?.avgAqScore ?? 0)}
          sub={portfolio?.avgAqScore ? getScoreLabel(portfolio.avgAqScore) : undefined}
          loading={loadingPortfolios}
          tooltipText="Média ponderada do IQ Score de todas as ações na carteira (0–100)"
        />
        <KPI
          label="Saúde Carteira"
          value={health ? `${health.overallScore}` : '—'}
          valueColor={getScoreTextClass(health?.overallScore ?? 0)}
          sub={health?.recommendations?.[0] ?? undefined}
          loading={loadingHealth}
        />
      </div>

      {/* ─── Checklist de Primeiros Passos ──────────────── */}
      <GettingStartedChecklist />

      {/* ─── Alertas Proativos ────────────────────────── */}
      <AlertsCenter />

      {/* ─── Row 1: Portfolio Chart + Sector Heatmap ──── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Portfolio Evolution - compact */}
        <div className="lg:col-span-5 bg-[var(--surface-1)] rounded-[var(--radius)] shadow-sm border border-[var(--border-1)] overflow-hidden">
          <div className="px-4 py-3 border-b border-[var(--border-1)] flex items-center justify-between">
            <div>
              <h2 className="text-[var(--text-body)] font-semibold">Evolução do Patrimônio</h2>
              <p className="text-[var(--text-small)] text-[var(--text-2)]">12 meses</p>
            </div>
            <Link href="/portfolio" className="text-[var(--text-small)] font-medium text-[var(--accent-1)] hover:underline">
              Ver portfólio
            </Link>
          </div>
          <div className="px-2 py-2">
            {loadingPortfolios ? (
              <Skeleton className="h-[160px]" />
            ) : evolutionData.length > 0 ? (
              <div role="img" aria-label="Gráfico de evolução do patrimônio">
              <ResponsiveContainer width="100%" height={160}>
                <AreaChart data={evolutionData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradValor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#1A73E8" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="#1A73E8" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-1)" opacity={0.4} />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'var(--text-2)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: 'var(--text-2)' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} width={38} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'var(--surface-1)', border: '1px solid var(--border-1)', borderRadius: '8px', fontSize: '11px' }}
                    formatter={(value: number, name: string) => {
                      const labels: Record<string, string> = { valor: 'Patrimônio', custo: 'Custo', cdi: 'CDI', ibov: 'IBOV' }
                      return [fmt(value), labels[name] ?? name]
                    }}
                  />
                  <Area type="monotone" dataKey="custo" stroke="#6B7280" strokeWidth={1} strokeDasharray="4 4" fill="none" />
                  <Area type="monotone" dataKey="cdi" stroke="#9CA3AF" strokeWidth={1} strokeDasharray="2 2" fill="none" />
                  <Area type="monotone" dataKey="ibov" stroke="#F59E0B" strokeWidth={1} strokeDasharray="2 2" fill="none" />
                  <Area type="monotone" dataKey="valor" stroke="#1A73E8" strokeWidth={2} fill="url(#gradValor)" />
                </AreaChart>
              </ResponsiveContainer>
              </div>
            ) : (
              <EmptyState
                compact
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                  </svg>
                }
                title="Crie seu primeiro portfólio"
                description="Adicione suas ações para acompanhar a evolução do patrimônio vs CDI e IBOV."
                actions={[{ label: 'Criar Portfólio', onClick: () => router.push('/portfolio') }]}
                className="h-[160px] border-0"
              />
            )}
          </div>
        </div>

        {/* Sector Heatmap */}
        <div className="lg:col-span-4 bg-[var(--surface-1)] rounded-[var(--radius)] shadow-sm border border-[var(--border-1)] overflow-hidden">
          <div className="px-4 py-3 border-b border-[var(--border-1)]">
            <h2 className="text-[var(--text-body)] font-semibold">Mapa Setorial</h2>
            <p className="text-[var(--text-small)] text-[var(--text-2)]">Performance do dia por setor</p>
          </div>
          <div className="p-2">
            {heatmap ? (
              <div className="grid grid-cols-3 gap-1">
                {heatmap.slice(0, 12).map((s) => {
                  const intensity = Math.min(Math.abs(s.avgChange) / 3, 1)
                  const isUp = s.avgChange >= 0
                  return (
                    <div
                      key={s.sector}
                      className="rounded-md px-2 py-1.5 text-center transition-colors cursor-pointer hover:ring-1 hover:ring-[var(--accent-1)]/50"
                      style={{
                        backgroundColor: isUp
                          ? `rgba(0, 191, 165, ${0.08 + intensity * 0.25})`
                          : `rgba(239, 68, 68, ${0.08 + intensity * 0.25})`,
                      }}
                      title={`${s.sector}: ${s.count} ações · IQ Score médio: ${s.avgScore.toFixed(0)}`}
                      onClick={() => router.push(`/explorer?sector=${encodeURIComponent(s.sector)}`)}
                    >
                      <p className="text-[var(--text-caption)] font-medium text-[var(--text-2)] truncate leading-tight">
                        {s.sector}
                      </p>
                      <p className={cn(
                        'text-[var(--text-small)] font-bold font-mono leading-tight',
                        isUp ? 'text-[var(--pos)]' : 'text-[var(--neg)]'
                      )}>
                        {s.avgChange >= 0 ? '+' : ''}{s.avgChange.toFixed(1)}%
                      </p>
                      <p className="text-[var(--text-caption)] text-[var(--text-2)] font-mono leading-tight">{s.count} ações</p>
                    </div>
                  )
                })}
              </div>
            ) : (
              <Skeleton className="h-[160px]" />
            )}
          </div>
        </div>

        {/* Portfolio Health + Positions preview */}
        <div className="lg:col-span-3 bg-[var(--surface-1)] rounded-[var(--radius)] shadow-sm border border-[var(--border-1)] overflow-hidden">
          <div className="px-4 py-3 border-b border-[var(--border-1)] flex items-center justify-between">
            <h2 className="text-[var(--text-body)] font-semibold">Minhas Posições</h2>
            <Link href={portfolio ? `/portfolio/${portfolio.id}` : '/portfolio'} className="text-[var(--text-small)] font-medium text-[var(--accent-1)] hover:underline">
              Ver tudo
            </Link>
          </div>
          <MiniPositions portfolioId={portfolio?.id} loading={loadingPortfolios} />
        </div>
      </div>

      {/* ─── Row 2: Score Movers + Opportunities ─────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Score Movers */}
        <div className="lg:col-span-5 bg-[var(--surface-1)] rounded-[var(--radius)] shadow-sm border border-[var(--border-1)] overflow-hidden">
          <div className="px-4 py-3 border-b border-[var(--border-1)] flex items-center justify-between">
            <div>
              <h2 className="text-[var(--text-body)] font-semibold">Score Movers</h2>
              <p className="text-[var(--text-small)] text-[var(--text-2)]">Maiores variações de IQ Score</p>
            </div>
            <Link href="/explorer" className="text-[var(--text-small)] font-medium text-[var(--accent-1)] hover:underline">Explorer</Link>
          </div>
          {moversData && !moversData.hasHistory ? (
            <div className="p-6 text-center text-[var(--text-small)] text-[var(--text-2)]">
              <p>Acompanhamento em tempo real</p>
              <p className="mt-1 text-[var(--text-caption)]">Variações de score aparecerão após o próximo refresh de dados</p>
            </div>
          ) : movers && movers.length > 0 ? (
            <div className="divide-y divide-[var(--border-1)]">
              {movers.slice(0, 6).map((m) => (
                <Link
                  key={m.ticker}
                  href={`/ativo/${m.ticker}`}
                  className="flex items-center justify-between px-4 py-2 hover:bg-[var(--surface-2)] transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={cn(
                      'w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 text-[var(--text-small)] font-bold',
                      m.delta > 0 ? 'bg-[var(--pos)]/10 text-[var(--pos)]' : 'bg-[var(--neg)]/10 text-[var(--neg)]'
                    )}>
                      {m.delta > 0 ? '↑' : '↓'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[var(--text-small)] font-mono font-medium">{m.ticker}</p>
                      <p className="text-[var(--text-caption)] text-[var(--text-2)] truncate">{m.sector}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="flex items-center gap-1.5 justify-end">
                        <ScoreBadge score={m.currentScore} size="sm" />
                        {m.currentScore > 0 && (() => { const b = getScoreBadge(m.currentScore); return <SemaphoreBadge label={b.label} color={b.color} size="sm" /> })()}
                      </div>
                      <p className="text-[var(--text-caption)] text-[var(--text-2)] font-mono mt-0.5">
                        era {m.previousScore.toFixed(0)}
                      </p>
                    </div>
                    <ChangeIndicator value={m.delta} suffix="" showArrow size="sm" />
                  </div>
                </Link>
              ))}
            </div>
          ) : moversData && movers?.length === 0 ? (
            <div className="p-6 text-center text-[var(--text-small)] text-[var(--text-2)]">
              <p>Sem variações de score no momento</p>
              <p className="mt-1 text-[var(--text-caption)]">Scores estão estáveis desde o último refresh</p>
            </div>
          ) : (
            <div className="p-4 space-y-2">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10" />)}
            </div>
          )}
        </div>

        {/* Motor Recomenda */}
        <div className="lg:col-span-4">
          <MotorRecomenda portfolioTickers={ownedTickers} />
        </div>

        {/* Health + Quick Stats */}
        <div className="lg:col-span-3 space-y-4">
          {/* Health Bars */}
          <div className="bg-[var(--surface-1)] rounded-[var(--radius)] shadow-sm border border-[var(--border-1)] p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[var(--text-body)] font-semibold">Saúde da Carteira</h3>
              <Link href="/radar" className="text-[var(--text-small)] text-[var(--accent-1)] hover:underline">Radar</Link>
            </div>
            {loadingHealth ? (
              <Skeleton className="h-24" />
            ) : health ? (
              <div className="space-y-2">
                {([
                  { label: 'Diversificação', value: health.diversification?.score ?? 0 },
                  { label: 'Qualidade', value: health.quality?.score ?? 0 },
                  { label: 'Risco', value: health.risk?.score ?? 0 },
                  { label: 'Concentração', value: health.concentration?.score ?? 0 },
                ] as const).map((m) => (
                  <div key={m.label} className="flex items-center gap-2">
                    <span className="text-[var(--text-small)] text-[var(--text-2)] w-[100px] shrink-0">{m.label}</span>
                    <div className="flex-1 h-1.5 bg-[var(--bg)] rounded-full overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all',
                          m.value >= 70 ? 'bg-[var(--pos)]' : m.value >= 40 ? 'bg-amber' : 'bg-[var(--neg)]'
                        )}
                        style={{ width: `${Math.min(m.value, 100)}%` }}
                      />
                    </div>
                    <span className={cn(
                      'text-[var(--text-small)] font-mono font-bold w-7 text-right',
                      m.value >= 70 ? 'text-[var(--pos)]' : m.value >= 40 ? 'text-amber' : 'text-[var(--neg)]'
                    )}>
                      {m.value}
                    </span>
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          {/* Pulso do Mercado */}
          <div className="bg-[var(--surface-1)] rounded-[var(--radius)] shadow-sm border border-[var(--border-1)] p-4">
            <h3 className="text-[var(--text-body)] font-semibold mb-2">Pulso do Mercado</h3>
            {marketPulse ? (
              <div className="space-y-2">
                {/* Macro signal */}
                <div className="flex items-center justify-between">
                  <span className="text-[var(--text-small)] text-[var(--text-2)]">Macro</span>
                  <span className={cn(
                    'text-[var(--text-caption)] font-mono font-bold px-2 py-0.5 rounded',
                    marketPulse.macro.signal >= 0.3 ? 'bg-[var(--pos)]/10 text-[var(--pos)]' :
                    marketPulse.macro.signal <= -0.3 ? 'bg-[var(--neg)]/10 text-[var(--neg)]' :
                    'bg-amber/10 text-amber',
                  )}>
                    {marketPulse.macro.label}
                  </span>
                </div>
                {marketPulse.macro.factors.length > 0 && (
                  <p className="text-[var(--text-caption)] text-[var(--text-3)] leading-tight">
                    {marketPulse.macro.factors.slice(0, 2).map(f => f.description).join(' · ')}
                  </p>
                )}
                <div className="h-px bg-[var(--border-1)] my-0.5" />
                {/* Favored sectors */}
                {marketPulse.topBullSectors.length > 0 && (
                  <div>
                    <span className="text-[var(--text-caption)] text-[var(--text-3)] uppercase tracking-wide">Favorecidos</span>
                    <div className="flex flex-wrap gap-1 mt-0.5">
                      {marketPulse.topBullSectors.slice(0, 3).map(s => (
                        <span key={s.sector} className="text-[var(--text-caption)] px-1.5 py-0.5 rounded bg-[var(--pos)]/10 text-[var(--pos)] font-medium">{s.sector}</span>
                      ))}
                    </div>
                  </div>
                )}
                {/* Pressured sectors */}
                {marketPulse.topBearSectors.length > 0 && (
                  <div>
                    <span className="text-[var(--text-caption)] text-[var(--text-3)] uppercase tracking-wide">Pressionados</span>
                    <div className="flex flex-wrap gap-1 mt-0.5">
                      {marketPulse.topBearSectors.slice(0, 3).map(s => (
                        <span key={s.sector} className="text-[var(--text-caption)] px-1.5 py-0.5 rounded bg-[var(--neg)]/10 text-[var(--neg)] font-medium">{s.sector}</span>
                      ))}
                    </div>
                  </div>
                )}
                <div className="h-px bg-[var(--border-1)] my-0.5" />
                {heatmapStats && (
                  <div className="flex justify-between text-[var(--text-small)]">
                    <span className="text-[var(--text-2)]">IQ Score médio B3</span>
                    <span className={cn('font-mono font-bold', getScoreTextClass(heatmapStats.avgScoreAll))}>{heatmapStats.avgScoreAll.toFixed(0)}</span>
                  </div>
                )}
              </div>
            ) : heatmapStats ? (
              /* Fallback to basic heatmap data when pulse unavailable */
              <div className="space-y-1.5">
                <div className="flex justify-between text-[var(--text-small)]">
                  <span className="text-[var(--text-2)]">Setores em alta</span>
                  <span className="font-mono font-bold text-[var(--pos)]">{heatmapStats.ups}</span>
                </div>
                <div className="flex justify-between text-[var(--text-small)]">
                  <span className="text-[var(--text-2)]">Setores em baixa</span>
                  <span className="font-mono font-bold text-[var(--neg)]">{heatmapStats.downs}</span>
                </div>
                <div className="h-px bg-[var(--border-1)] my-1" />
                <div className="flex justify-between text-[var(--text-small)]">
                  <span className="text-[var(--text-2)]">IQ Score médio B3</span>
                  <span className={cn('font-mono font-bold', getScoreTextClass(heatmapStats.avgScoreAll))}>{heatmapStats.avgScoreAll.toFixed(0)}</span>
                </div>
              </div>
            ) : (
              <Skeleton className="h-24" />
            )}
          </div>
        </div>
      </div>


      {/* ─── Quick Actions ─────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Explorar ações', href: '/explorer', desc: 'Todas as ações da B3' },
          { label: 'Comparar ativos', href: '/comparar', desc: 'Até 4 ações lado a lado' },
          { label: 'Carteiras aQ', href: '/carteiras-inteligentes', desc: 'Seleção algorítmica' },
          { label: 'Glossário', href: '/glossario', desc: 'Termos financeiros' },
        ].map(action => (
          <Link
            key={action.href}
            href={action.href as any}
            className="flex items-center gap-3 p-3 rounded-[var(--radius)] shadow-sm border border-[var(--border-1)] bg-[var(--surface-1)] hover:border-[var(--accent-1)]/30 hover:bg-[var(--accent-1)]/5 transition-all group"
          >
            <div>
              <p className="text-[var(--text-small)] font-medium text-[var(--text-1)] group-hover:text-[var(--accent-1)] transition-colors">{action.label}</p>
              <p className="text-[var(--text-caption)] text-[var(--text-3)]">{action.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

// ─── KPI Card (compact) ──────────────────────────────────────

// ─── Economy Strip ──────────────────────────────────────────

function EconomyStrip() {
  const { data } = trpc.economy.indicators.useQuery()

  if (!data) return null

  const items = [
    { label: 'SELIC', value: data.selic?.rate != null ? `${data.selic.rate}%` : null },
    { label: 'IPCA', value: data.ipca?.value != null ? `${data.ipca.value}%` : null },
    { label: 'IBOV', value: data.ibov?.points ? data.ibov.points.toLocaleString('pt-BR') : null, change: data.ibov?.change },
    { label: 'USD/BRL', value: data.usdBrl?.bid ? `R$ ${Number(data.usdBrl.bid).toFixed(2)}` : null, change: data.usdBrl?.change },
    { label: 'EUR/BRL', value: data.eurBrl?.bid ? `R$ ${Number(data.eurBrl.bid).toFixed(2)}` : null, change: data.eurBrl?.change },
  ].filter((item) => item.value != null)

  return (
    <ScrollableStrip className="bg-[var(--surface-1)] rounded-[var(--radius)] shadow-sm border border-[var(--border-1)]">
      <div className="flex items-center gap-4 px-3 py-2">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-1.5 flex-shrink-0">
            <span className="text-[var(--text-caption)] font-semibold text-[var(--text-2)] uppercase tracking-wider">{item.label}</span>
            <span className="text-[var(--text-small)] font-bold font-mono">{item.value}</span>
            {item.change != null && item.change !== 0 && (
              <ChangeIndicator value={Number(item.change)} size="sm" flash />
            )}
          </div>
        ))}
      </div>
    </ScrollableStrip>
  )
}

function KPI({
  label, value, sub, valueColor, loading, trend, tooltipText,
}: {
  label: string; value: string; sub?: string; valueColor?: string; loading?: boolean; trend?: number; tooltipText?: string
}) {
  if (loading) {
    return (
      <div className="bg-[var(--surface-1)] rounded-[var(--radius)] shadow-sm border border-[var(--border-1)] p-4">
        <Skeleton className="h-2.5 w-16 mb-2" />
        <Skeleton className="h-6 w-20 mb-1" />
        <Skeleton className="h-2.5 w-24" />
      </div>
    )
  }

  return (
    <div className="bg-[var(--surface-1)] rounded-[var(--radius)] shadow-sm border border-[var(--border-1)] p-4">
      <div className="flex items-center justify-between mb-0.5">
        {tooltipText ? (
          <UITooltip content={tooltipText} position="top">
            <p className="text-[var(--text-caption)] font-medium text-[var(--text-2)] uppercase tracking-wider cursor-help underline decoration-dotted">
              {label}
            </p>
          </UITooltip>
        ) : (
          <p className="text-[var(--text-caption)] font-medium text-[var(--text-2)] uppercase tracking-wider">
            {label}
          </p>
        )}
        {trend !== undefined && (
          <ChangeIndicator value={trend} size="sm" />
        )}
      </div>
      <p className={cn('text-[var(--text-heading)] font-bold font-mono leading-tight', valueColor || 'text-[var(--text-1)]')}>
        {value}
      </p>
      {sub && (
        <p className="text-[var(--text-caption)] text-[var(--text-2)] mt-0.5 font-mono truncate">{sub}</p>
      )}
    </div>
  )
}

// ─── Mini Positions List ─────────────────────────────────────

function MiniPositions({ portfolioId, loading }: { portfolioId?: string; loading: boolean }) {
  const { data: detail, isLoading } = trpc.portfolio.get.useQuery(
    { id: portfolioId ?? '' },
    { enabled: !!portfolioId }
  )

  if (loading || isLoading) {
    return (
      <div className="p-3 space-y-2">
        {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-8" />)}
      </div>
    )
  }

  const positions = detail?.positions ?? []

  if (positions.length === 0) {
    return (
      <EmptyState
        compact
        icon={
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
          </svg>
        }
        title="Sem posições"
        description="Adicione ações ao seu portfólio para ver suas posições aqui."
        className="border-0 py-8"
      >
        <Link href="/portfolio" className="mt-3 text-[var(--text-small)] font-medium text-[var(--accent-1)] hover:underline">
          Criar portfólio
        </Link>
      </EmptyState>
    )
  }

  return (
    <div className="divide-y divide-[var(--border-1)]">
      {positions.slice(0, 7).map((pos: any) => {
        const gainPct = pos.avgPrice > 0 ? ((pos.currentPrice - pos.avgPrice) / pos.avgPrice) * 100 : 0
        return (
          <Link
            key={pos.ticker}
            href={`/ativo/${pos.ticker}`}
            className="flex items-center justify-between px-4 py-1.5 hover:bg-[var(--surface-2)] transition-colors"
          >
            <div className="flex items-center gap-2">
              <span className="text-[var(--text-small)] font-mono font-medium w-[56px]">{pos.ticker}</span>
              <span className="text-[var(--text-caption)] text-[var(--text-2)] font-mono">
                {pos.quantity}x
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[var(--text-small)] font-mono">{fmt(pos.currentPrice * pos.quantity, { compact: true })}</span>
              <ChangeIndicator value={gainPct} size="sm" />
            </div>
          </Link>
        )
      })}
      {positions.length > 7 && (
        <div className="px-4 py-2 text-center">
          <Link href={`/portfolio/${portfolioId}`} className="text-[var(--text-small)] font-medium text-[var(--accent-1)] hover:underline">
            +{positions.length - 7} mais
          </Link>
        </div>
      )}
    </div>
  )
}
