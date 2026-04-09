'use client'

import { useState, useEffect, useMemo } from 'react'
import { investiq } from '@/lib/investiq-client'
import { DEMO_PORTFOLIOS, generateDemoPerformance } from '@/lib/demo-data'
import { DEMO_USER } from '@/lib/auth/demo-user'
import { useAuth } from '@/hooks/use-auth'
import { KpiStrip, type KpiItem } from '@/components/dashboard/kpi-strip'
import { PositionsTable, type Position } from '@/components/dashboard/positions-table'
import { OpportunitiesPanel, type Opportunity } from '@/components/dashboard/opportunities-panel'
import { TVPerformanceChart, type PerformanceSeries } from '@/components/charts/tv-performance-chart'
import { StrategySignalsPanel } from '@/components/dashboard/strategy-signals-panel'
import { SectorRotationMatrix } from '@/components/analytics/sector-rotation-matrix'
import { DemoBanner } from '@/components/ui/data-unavailable'
import { trpc } from '@/lib/trpc/provider'
import { cn } from '@/lib/utils'
import Link from 'next/link'

// ─── Types ──────────────────────────────────────────────────

interface PortfolioData {
  positions: Array<{ id?: string; ticker: string; quantity: number; avg_price: number; current_price?: number; current_value?: number; weight?: number; change_pct?: number }>
  total_value: number; total_cost: number
}
interface PerfPoint { date: string; portfolio?: number; ibov?: number; cdi?: number }
interface RegimeData { regime: string; label: string; macro: { selic: number; ipca: number; cambio_usd: number; brent: number }; sector_rotation: Record<string, { signal: string; tilt_points: number }>; kill_switch_active?: boolean }
interface TopAsset { ticker: string; company_name: string; iq_score: number; rating_label: string }
interface Catalyst { title: string; date: string; ticker?: string; type: string }
interface TickerDetail { company_name: string; cluster_id: number; quote?: { close: number; open: number; volume: number } }

// ─── Regime Strip Compacto ──────────────────────────────────

function RegimeStrip({ data }: { data: RegimeData | null }) {
  if (!data) return null

  const regimeColor = {
    RISK_ON: 'text-teal bg-teal/10 border-teal/20',
    RISK_OFF: 'text-red bg-red/10 border-red/20',
    STAGFLATION: 'text-amber bg-amber/10 border-amber/20',
    RECOVERY: 'text-[var(--accent-1)] bg-[var(--accent-1)]/10 border-[var(--accent-1)]/20',
  }[data.regime] ?? 'text-[var(--text-2)] bg-[var(--surface-2)] border-[var(--border-1)]'

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 rounded-[var(--radius)] border border-[var(--border-1)] bg-[var(--surface-1)] overflow-x-auto">
      <span className={cn('text-[var(--text-caption)] font-bold px-2 py-0.5 rounded-md border', regimeColor)}>
        {data.label}
      </span>
      {data.kill_switch_active && (
        <span className="text-[var(--text-caption)] font-bold px-2 py-0.5 rounded-md bg-red/10 text-red border border-red/20 animate-pulse">
          KILL SWITCH
        </span>
      )}
      <div className="h-4 border-l border-[var(--border-1)]" />
      <div className="flex items-center gap-4 text-[var(--text-caption)]">
        <span className="text-[var(--text-3)]">SELIC <span className="font-mono font-bold text-[var(--text-1)]">{Number(data.macro.selic).toFixed(2)}%</span></span>
        <span className="text-[var(--text-3)]">IPCA <span className="font-mono font-bold text-[var(--text-1)]">{Number(data.macro.ipca).toFixed(2)}%</span></span>
        <span className="text-[var(--text-3)]">USD <span className="font-mono font-bold text-[var(--text-1)]">R${Number(data.macro.cambio_usd).toFixed(2)}</span></span>
        <span className="text-[var(--text-3)]">Brent <span className="font-mono font-bold text-[var(--text-1)]">${Number(data.macro.brent).toFixed(0)}</span></span>
      </div>
    </div>
  )
}

// ─── Signal Card Consolidado ────────────────────────────────

function SignalCard() {
  const { data: riskData } = trpc.backtest.riskStatus.useQuery(undefined, { staleTime: 5 * 60 * 1000 })
  const { data: signalsData } = trpc.backtest.signals.useQuery(undefined, { staleTime: 5 * 60 * 1000 })

  const signals = signalsData?.signals ?? []
  const topSignal = signals[0]
  const buyCount = signals.filter(s => s.action === 'buy').length
  const sellCount = signals.filter(s => s.action === 'sell').length
  const holdCount = signals.filter(s => s.action === 'hold').length

  const confidencePct = riskData?.available
    ? Math.round((riskData.confidence ?? 0) * 100)
    : null

  const volStress = riskData?.available
    ? riskData.vol_stress ?? 1
    : null

  return (
    <div className="rounded-[var(--radius)] border border-[var(--border-1)] bg-[var(--surface-1)] p-4 h-full flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[var(--text-caption)] font-semibold uppercase tracking-wider text-[var(--text-3)]">Motor Estratégico</span>
        <Link href="/estrategias" className="text-[var(--text-caption)] text-[var(--accent-1)] hover:underline font-medium">
          Ver tudo
        </Link>
      </div>

      {/* Counters */}
      <div className="flex items-center gap-3 mb-3">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-teal" />
          <span className="text-[var(--text-small)] font-mono font-bold">{buyCount}</span>
          <span className="text-[var(--text-caption)] text-[var(--text-3)]">compra</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-red" />
          <span className="text-[var(--text-small)] font-mono font-bold">{sellCount}</span>
          <span className="text-[var(--text-caption)] text-[var(--text-3)]">venda</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[var(--text-3)]" />
          <span className="text-[var(--text-small)] font-mono font-bold">{holdCount}</span>
          <span className="text-[var(--text-caption)] text-[var(--text-3)]">hold</span>
        </div>
      </div>

      {/* Confidence & Vol Stress */}
      <div className="flex items-center gap-4 mb-3 pb-3 border-b border-[var(--border-1)]">
        {confidencePct !== null && (
          <div>
            <span className="text-[var(--text-caption)] text-[var(--text-3)] block">Confiança</span>
            <span className={cn(
              'text-[var(--text-subheading)] font-mono font-bold',
              confidencePct >= 70 ? 'text-teal' : confidencePct >= 50 ? 'text-amber' : 'text-red'
            )}>
              {confidencePct}%
            </span>
          </div>
        )}
        {volStress !== null && (
          <div>
            <span className="text-[var(--text-caption)] text-[var(--text-3)] block">Vol Stress</span>
            <span className={cn(
              'text-[var(--text-subheading)] font-mono font-bold',
              volStress <= 1.0 ? 'text-teal' : volStress <= 1.2 ? 'text-amber' : 'text-red'
            )}>
              {Number(volStress).toFixed(2)}x
            </span>
          </div>
        )}
      </div>

      {/* Top signals */}
      <div className="flex-1 space-y-1 min-h-0 overflow-y-auto">
        {signals.slice(0, 5).map(s => (
          <Link
            key={s.ticker}
            href={`/ativo/${s.ticker}`}
            className="flex items-center gap-2 px-2 py-1 rounded hover:bg-[var(--surface-2)] transition-colors"
          >
            <span className={cn(
              'text-[9px] font-bold px-1.5 py-0.5 rounded',
              s.action === 'buy' ? 'text-teal bg-teal/10' :
              s.action === 'sell' ? 'text-red bg-red/10' :
              s.action === 'rotate' ? 'text-amber bg-amber/10' :
              'text-[var(--text-2)] bg-[var(--surface-2)]'
            )}>
              {s.action === 'buy' ? 'COMPRA' : s.action === 'sell' ? 'VENDA' : s.action === 'rotate' ? 'ROTAÇÃO' : 'HOLD'}
            </span>
            <span className="font-mono text-[var(--text-small)] font-bold text-[var(--text-1)]">{s.ticker}</span>
            <span className="text-[var(--text-caption)] text-[var(--text-3)] truncate flex-1">{s.reason}</span>
          </Link>
        ))}
        {signals.length === 0 && (
          <p className="text-[var(--text-caption)] text-[var(--text-3)] text-center py-4">Sem sinais ativos</p>
        )}
      </div>
    </div>
  )
}

// ─── Dashboard Skeleton ─────────────────────────────────────

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-3 pb-4 animate-pulse">
      <div className="flex gap-3 overflow-x-auto">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="flex-shrink-0 w-36 h-16 rounded-[var(--radius)] bg-[var(--surface-2)]" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        <div className="lg:col-span-8 h-[340px] rounded-[var(--radius)] bg-[var(--surface-2)]" />
        <div className="lg:col-span-4 h-[340px] rounded-[var(--radius)] bg-[var(--surface-2)]" />
      </div>
      <div className="h-10 rounded-[var(--radius)] bg-[var(--surface-2)]" />
      <div className="h-[200px] rounded-[var(--radius)] bg-[var(--surface-2)]" />
    </div>
  )
}

// ─── Page ───────────────────────────────────────────────────

export default function DashboardPage() {
  const { user } = useAuth()
  const isDemoUser = user?.email === DEMO_USER.email
  const [portfolio, setPortfolio] = useState<PortfolioData | null>(null)
  const [perfData, setPerfData] = useState<PerfPoint[]>([])
  const [regime, setRegime] = useState<RegimeData | null>(null)
  const [topScores, setTopScores] = useState<TopAsset[]>([])
  const [catalysts, setCatalysts] = useState<Catalyst[]>([])
  const [positions, setPositions] = useState<Position[]>([])
  const [perfMonths, setPerfMonths] = useState(12)
  const [loading, setLoading] = useState(true)
  const [isDemo, setIsDemo] = useState(false)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const [pf, reg, top, cats] = await Promise.allSettled([
        investiq.get<PortfolioData>('/portfolio'),
        investiq.get<RegimeData>('/analytics/regime'),
        investiq.get<{ top: TopAsset[] }>('/scores/top', { params: { limit: 8 } }),
        investiq.get<{ catalysts: Catalyst[] }>('/scores/catalysts', { params: { days: 7 } }),
      ])

      let pfData = pf.status === 'fulfilled' ? pf.value : null
      setRegime(reg.status === 'fulfilled' ? reg.value : null)
      setTopScores(top.status === 'fulfilled' ? (top.value.top || []) : [])
      setCatalysts(cats.status === 'fulfilled' ? (cats.value.catalysts || []) : [])

      if (!pfData?.positions?.length && isDemoUser) {
        setIsDemo(true)
        const demo = DEMO_PORTFOLIOS[0]!
        const totalValue = demo.positions.reduce((s, p) => s + p.currentPrice * p.quantity, 0)
        const totalCost = demo.positions.reduce((s, p) => s + p.avgCost * p.quantity, 0)
        pfData = {
          positions: demo.positions.map(p => ({
            ticker: p.ticker, quantity: p.quantity,
            avg_price: p.avgCost, current_price: p.currentPrice,
          })),
          total_value: totalValue,
          total_cost: totalCost,
        }
        setPerfData(generateDemoPerformance())

        const DEMO_SCORES: Record<string, number> = { PETR4: 72, VALE3: 68, ITUB4: 75, WEGE3: 88, BBAS3: 70, ABEV3: 62, SUZB3: 65, RENT3: 55, BBSE3: 71, EQTL3: 78 }
        const enriched: Position[] = demo.positions.map(p => ({
          ticker: p.ticker, company_name: p.ticker,
          iq_score: DEMO_SCORES[p.ticker] ?? 60,
          current_price: p.currentPrice,
          change_pct: ((p.currentPrice - p.avgCost) / p.avgCost) * 0.3,
          weight: (p.currentPrice * p.quantity) / totalValue,
          result_pct: ((p.currentPrice - p.avgCost) / p.avgCost) * 100,
        }))
        setPositions(enriched)
      } else if (!pfData?.positions?.length) {
        setPortfolio({ positions: [], total_value: 0, total_cost: 0 })
        setLoading(false)
        return
      } else {
        const [perf] = await Promise.allSettled([
          investiq.get<{ series?: PerfPoint[] }>('/portfolio/performance', { params: { months: 12 } }),
        ])
        setPerfData(perf.status === 'fulfilled' ? (perf.value.series || []) : [])

        const enriched: Position[] = []
        for (const pos of pfData.positions.slice(0, 15)) {
          try {
            const detail = await investiq.get<TickerDetail>(`/tickers/${pos.ticker}`)
            const q = detail.quote
            const price = q?.close ?? pos.current_price ?? pos.avg_price
            const open = q?.open ?? price
            enriched.push({
              ticker: pos.ticker, company_name: detail.company_name || pos.ticker, iq_score: null,
              current_price: price,
              change_pct: open > 0 ? ((price - open) / open) * 100 : 0,
              weight: pos.weight ?? (pfData!.total_value > 0 ? (price * pos.quantity) / pfData!.total_value : 0),
              result_pct: pos.avg_price > 0 ? ((price - pos.avg_price) / pos.avg_price) * 100 : 0,
            })
          } catch {
            enriched.push({ ticker: pos.ticker, company_name: pos.ticker, iq_score: null, current_price: pos.avg_price, change_pct: 0, weight: 0, result_pct: 0 })
          }
        }
        setPositions(enriched)
      }

      setPortfolio(pfData)
      setLoading(false)
    }
    load()
  }, [])

  useEffect(() => {
    if (isDemo || !portfolio?.positions?.length) return
    investiq.get<{ series?: PerfPoint[] }>('/portfolio/performance', { params: { months: perfMonths } })
      .then(d => setPerfData(d.series || []))
      .catch(() => {})
  }, [perfMonths, portfolio, isDemo])

  // ─── Computed ─────────────────────────────────────────────
  const hasPortfolio = portfolio && portfolio.positions && portfolio.positions.length > 0
  const gainLoss = portfolio ? portfolio.total_value - portfolio.total_cost : 0
  const gainLossPct = portfolio && portfolio.total_cost > 0 ? (gainLoss / portfolio.total_cost) * 100 : 0

  const kpis: KpiItem[] = useMemo(() => [
    { label: 'Patrimônio', value: portfolio ? `R$ ${portfolio.total_value.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}` : '--' },
    { label: 'Resultado', value: portfolio ? `R$ ${gainLoss.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}` : '--', change: gainLossPct || undefined },
    { label: 'Posições', value: String(positions.length) },
    { label: 'Regime', value: regime?.label || '--' },
  ], [portfolio, regime, positions, gainLoss, gainLossPct])

  const perfSeries: PerformanceSeries[] = useMemo(() => {
    if (perfData.length === 0) return []
    const s: PerformanceSeries[] = []
    if (perfData.some(p => p.portfolio != null)) s.push({ label: 'Carteira', data: perfData.filter(p => p.portfolio != null).map(p => ({ date: p.date, value: p.portfolio! })), color: '#1A73E8', lineWidth: 2 })
    if (perfData.some(p => p.ibov != null)) s.push({ label: 'IBOV', data: perfData.filter(p => p.ibov != null).map(p => ({ date: p.date, value: p.ibov! })), color: '#8B919E', lineWidth: 1, lineStyle: 'dashed' })
    if (perfData.some(p => p.cdi != null)) s.push({ label: 'CDI', data: perfData.filter(p => p.cdi != null).map(p => ({ date: p.date, value: p.cdi! })), color: '#5A6170', lineWidth: 1 })
    return s
  }, [perfData])

  const opportunities: Opportunity[] = useMemo(() => topScores.map(a => ({ ticker: a.ticker, company_name: a.company_name, iq_score: a.iq_score, rating_label: a.rating_label })), [topScores])

  if (loading) return <DashboardSkeleton />

  return (
    <div className="flex flex-col gap-3 pb-4">
      {isDemo && <DemoBanner />}

      {/* ─── ZONA 1: Above Fold — KPI + Performance + Signal Card ─── */}
      <KpiStrip items={kpis} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        {/* Performance Chart (60%) */}
        <div className="lg:col-span-8 rounded-[var(--radius)] border border-[var(--border-1)] bg-[var(--surface-1)] p-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[var(--text-caption)] font-semibold uppercase tracking-wider text-[var(--text-3)]">
              Performance vs Benchmarks {isDemo && '(demo)'}
            </span>
          </div>
          {perfSeries.length > 0 ? (
            <TVPerformanceChart series={perfSeries} height={300} activePeriod={perfMonths} onPeriodChange={setPerfMonths} />
          ) : (
            <div className="flex items-center justify-center h-[300px] text-[var(--text-3)] text-[var(--text-caption)]">Dados indisponíveis</div>
          )}
        </div>

        {/* Signal Card (40%) */}
        <div className="lg:col-span-4">
          <SignalCard />
        </div>
      </div>

      {/* ─── ZONA 2: Positions Table + Regime Strip ──────────────── */}
      <RegimeStrip data={regime} />

      <div className="rounded-[var(--radius)] border border-[var(--border-1)] bg-[var(--surface-1)] p-3">
        <span className="text-[var(--text-caption)] font-semibold uppercase tracking-wider text-[var(--text-3)] block mb-2">Posições</span>
        <PositionsTable positions={positions} />
      </div>

      {/* ─── ZONA 3: Opportunities + Sector Rotation ─────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="rounded-[var(--radius)] border border-[var(--border-1)] bg-[var(--surface-1)] p-3">
          <span className="text-[var(--text-caption)] font-semibold uppercase tracking-wider text-[var(--text-3)] block mb-2">Oportunidades</span>
          <OpportunitiesPanel topScores={opportunities} catalysts={catalysts} />
        </div>
        <SectorRotationMatrix />
      </div>
    </div>
  )
}
