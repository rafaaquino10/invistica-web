'use client'

import { useState, useEffect, useMemo } from 'react'
import { investiq } from '@/lib/investiq-client'
import { KpiStrip, type KpiItem } from '@/components/dashboard/kpi-strip'
import { PositionsTable, type Position } from '@/components/dashboard/positions-table'
import { OpportunitiesPanel, type Opportunity } from '@/components/dashboard/opportunities-panel'
import { RegimePanel } from '@/components/dashboard/regime-panel'
import { TVPerformanceChart, type PerformanceSeries } from '@/components/charts/tv-performance-chart'
import { TVIntradayChart, type IntradaySeries } from '@/components/charts/tv-intraday-chart'

// ─── Types ──────────────────────────────────────────────────

interface PortfolioData {
  positions: Array<{ id: string; ticker: string; quantity: number; avg_price: number; current_price?: number; current_value?: number; weight?: number; change_pct?: number }>
  total_value: number
  total_cost: number
}

interface PerfPoint { date: string; portfolio?: number; ibov?: number; cdi?: number }
interface IntradayPoint { time?: string; date?: string; portfolio?: number; ibov?: number; value?: number }
interface RegimeData { regime: string; label: string; macro: { selic: number; ipca: number; cambio_usd: number; brent: number }; sector_rotation: Record<string, { signal: string; tilt_points: number }> }
interface TopAsset { ticker: string; company_name: string; iq_score: number; rating_label: string }
interface Catalyst { title: string; date: string; ticker?: string; type: string }
interface TickerDetail { company_name: string; cluster_id: number; quote?: { close: number; open: number; volume: number } }

// ─── Page ───────────────────────────────────────────────────

export default function DashboardPage() {
  const [portfolio, setPortfolio] = useState<PortfolioData | null>(null)
  const [perfData, setPerfData] = useState<PerfPoint[]>([])
  const [intradayData, setIntradayData] = useState<IntradayPoint[]>([])
  const [regime, setRegime] = useState<RegimeData | null>(null)
  const [topScores, setTopScores] = useState<TopAsset[]>([])
  const [catalysts, setCatalysts] = useState<Catalyst[]>([])
  const [positions, setPositions] = useState<Position[]>([])
  const [perfMonths, setPerfMonths] = useState(12)
  const [loading, setLoading] = useState(true)

  // ─── Load all data in parallel ────────────────────────────
  useEffect(() => {
    async function load() {
      setLoading(true)
      const [pf, reg, top, cats] = await Promise.allSettled([
        investiq.get<PortfolioData>('/portfolio'),
        investiq.get<RegimeData>('/analytics/regime'),
        investiq.get<{ top: TopAsset[] }>('/scores/top', { params: { limit: 8 } }),
        investiq.get<{ catalysts: Catalyst[] }>('/scores/catalysts', { params: { days: 7 } }),
      ])

      const pfData = pf.status === 'fulfilled' ? pf.value : null
      setPortfolio(pfData)
      setRegime(reg.status === 'fulfilled' ? reg.value : null)
      setTopScores(top.status === 'fulfilled' ? (top.value.top || []) : [])
      setCatalysts(cats.status === 'fulfilled' ? (cats.value.catalysts || []) : [])

      // Load performance + intraday if has portfolio
      if (pfData && pfData.positions?.length > 0) {
        const [perf, intra] = await Promise.allSettled([
          investiq.get<{ series?: PerfPoint[] }>('/portfolio/performance', { params: { months: 12 } }),
          investiq.get<{ series?: IntradayPoint[] }>('/portfolio/intraday'),
        ])
        setPerfData(perf.status === 'fulfilled' ? (perf.value.series || []) : [])
        setIntradayData(intra.status === 'fulfilled' ? (intra.value.series || []) : [])

        // Enrich positions with quotes
        const enriched: Position[] = []
        for (const pos of pfData.positions.slice(0, 15)) {
          try {
            const detail = await investiq.get<TickerDetail>(`/tickers/${pos.ticker}`)
            const q = detail.quote
            const price = q?.close ?? pos.current_price ?? pos.avg_price
            const open = q?.open ?? price
            enriched.push({
              ticker: pos.ticker,
              company_name: detail.company_name || pos.ticker,
              iq_score: null, // Will be enriched separately if needed
              current_price: price,
              change_pct: open > 0 ? ((price - open) / open) * 100 : 0,
              weight: pos.weight ?? (pfData.total_value > 0 ? (price * pos.quantity) / pfData.total_value : 0),
              result_pct: pos.avg_price > 0 ? ((price - pos.avg_price) / pos.avg_price) * 100 : 0,
            })
          } catch {
            enriched.push({
              ticker: pos.ticker, company_name: pos.ticker, iq_score: null,
              current_price: pos.avg_price, change_pct: 0, weight: 0, result_pct: 0,
            })
          }
        }
        setPositions(enriched)
      }

      setLoading(false)
    }
    load()
  }, [])

  // ─── Reload performance on period change ──────────────────
  useEffect(() => {
    if (!portfolio?.positions?.length) return
    investiq.get<{ series?: PerfPoint[] }>('/portfolio/performance', { params: { months: perfMonths } })
      .then(d => setPerfData(d.series || []))
      .catch(() => {})
  }, [perfMonths, portfolio])

  // ─── Computed ─────────────────────────────────────────────
  const hasPortfolio = portfolio && portfolio.positions && portfolio.positions.length > 0
  const gainLoss = portfolio ? portfolio.total_value - portfolio.total_cost : 0
  const gainLossPct = portfolio && portfolio.total_cost > 0 ? (gainLoss / portfolio.total_cost) * 100 : 0

  const kpis: KpiItem[] = useMemo(() => {
    if (!hasPortfolio) {
      return [
        { label: 'SELIC', value: regime ? `${regime.macro.selic.toFixed(2)}%` : '--' },
        { label: 'IPCA', value: regime ? `${regime.macro.ipca.toFixed(1)}%` : '--' },
        { label: 'Câmbio', value: regime ? `R$ ${regime.macro.cambio_usd.toFixed(2)}` : '--' },
        { label: 'Regime', value: regime?.label || '--' },
        { label: 'Top Score', value: topScores[0] ? String(topScores[0].iq_score) : '--' },
      ]
    }
    return [
      { label: 'Patrimônio', value: `R$ ${(portfolio!.total_value || 0).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}` },
      { label: 'Resultado', value: `R$ ${gainLoss.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`, change: gainLossPct },
      { label: 'Posições', value: String(portfolio!.positions.length) },
      { label: 'SELIC', value: regime ? `${regime.macro.selic.toFixed(2)}%` : '--' },
      { label: 'Regime', value: regime?.label || '--' },
    ]
  }, [hasPortfolio, portfolio, regime, topScores, gainLoss, gainLossPct])

  // ─── Chart series ─────────────────────────────────────────
  const perfSeries: PerformanceSeries[] = useMemo(() => {
    if (perfData.length === 0) return []
    const series: PerformanceSeries[] = []
    if (perfData.some(p => p.portfolio != null)) {
      series.push({ label: 'Carteira', data: perfData.filter(p => p.portfolio != null).map(p => ({ date: p.date, value: p.portfolio! })), color: 'var(--accent-1)', lineWidth: 2 })
    }
    if (perfData.some(p => p.ibov != null)) {
      series.push({ label: 'IBOV', data: perfData.filter(p => p.ibov != null).map(p => ({ date: p.date, value: p.ibov! })), color: '#8B919E', lineWidth: 1, lineStyle: 'dashed' })
    }
    if (perfData.some(p => p.cdi != null)) {
      series.push({ label: 'CDI', data: perfData.filter(p => p.cdi != null).map(p => ({ date: p.date, value: p.cdi! })), color: '#5A6170', lineWidth: 1 })
    }
    return series
  }, [perfData])

  const intradaySeries: IntradaySeries[] = useMemo(() => {
    if (intradayData.length === 0) return []
    const series: IntradaySeries[] = []
    if (intradayData.some(p => p.portfolio != null || p.value != null)) {
      series.push({ label: 'Carteira', data: intradayData.map(p => ({ time: p.time || p.date || '', value: p.portfolio ?? p.value ?? 0 })), color: 'var(--accent-1)', lineWidth: 2 })
    }
    if (intradayData.some(p => p.ibov != null)) {
      series.push({ label: 'IBOV', data: intradayData.filter(p => p.ibov != null).map(p => ({ time: p.time || p.date || '', value: p.ibov! })), color: '#8B919E' })
    }
    return series
  }, [intradayData])

  const opportunities: Opportunity[] = useMemo(() =>
    topScores.map(a => ({ ticker: a.ticker, company_name: a.company_name, iq_score: a.iq_score, rating_label: a.rating_label })),
    [topScores]
  )

  // ─── Loading ──────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <span className="text-[var(--text-3)] text-sm">Carregando dashboard...</span>
      </div>
    )
  }

  // ─── Render ───────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-3 pb-4">
      {/* KPI Strip */}
      <KpiStrip items={kpis} />

      {/* Row 1: Equity Curve + Positions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        {/* Equity Curve */}
        <div className="lg:col-span-7 rounded-[var(--radius)] border border-[var(--border-1)]/30 bg-[var(--surface-1)] p-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-3)]">
              {hasPortfolio ? 'Performance vs Benchmarks' : 'Mercado'}
            </span>
          </div>
          {perfSeries.length > 0 ? (
            <TVPerformanceChart
              series={perfSeries}
              height={300}
              activePeriod={perfMonths}
              onPeriodChange={setPerfMonths}
            />
          ) : (
            <div className="flex items-center justify-center h-[300px] text-[var(--text-3)] text-xs">
              {hasPortfolio ? 'Dados de performance indisponíveis' : 'Monte sua carteira para ver a performance'}
            </div>
          )}
        </div>

        {/* Positions */}
        <div className="lg:col-span-5 rounded-[var(--radius)] border border-[var(--border-1)]/30 bg-[var(--surface-1)] p-3">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-3)] block mb-2">
            {hasPortfolio ? 'Posições' : 'Top Oportunidades'}
          </span>
          {hasPortfolio ? (
            <PositionsTable positions={positions} />
          ) : (
            <OpportunitiesPanel topScores={opportunities} catalysts={catalysts} />
          )}
        </div>
      </div>

      {/* Row 2: Intraday + Opportunities + Regime */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        {/* Intraday */}
        <div className="lg:col-span-4 rounded-[var(--radius)] border border-[var(--border-1)]/30 bg-[var(--surface-1)] p-3">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-3)] block mb-1">Intraday</span>
          {intradaySeries.length > 0 ? (
            <TVIntradayChart series={intradaySeries} height={180} />
          ) : (
            <div className="flex items-center justify-center h-[180px] text-[var(--text-3)] text-xs">Sem dados intraday</div>
          )}
        </div>

        {/* Opportunities (when has portfolio, show scores here) */}
        <div className="lg:col-span-4 rounded-[var(--radius)] border border-[var(--border-1)]/30 bg-[var(--surface-1)] p-3">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-3)] block mb-2">Oportunidades</span>
          <OpportunitiesPanel topScores={opportunities} catalysts={catalysts} />
        </div>

        {/* Regime Macro */}
        <div className="lg:col-span-4 rounded-[var(--radius)] border border-[var(--border-1)]/30 bg-[var(--surface-1)] p-3">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-3)] block mb-2">Regime Macro</span>
          <RegimePanel data={regime} />
        </div>
      </div>
    </div>
  )
}
