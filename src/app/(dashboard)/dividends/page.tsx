'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Input, Button, ScrollableStrip } from '@/components/ui'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useAuth } from '@/hooks/use-auth'
import { free, pro } from '@/lib/api/endpoints'
import { formatCurrency } from '@/lib/utils/formatters'
import { cn } from '@/lib/utils'
import { AssetLogo } from '@/components/ui/asset-logo'
import { tabTransition } from '@/lib/utils/motion'
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from 'recharts'

type TabType = 'calendar' | 'summary' | 'projections' | 'simulator'
type PeriodType = '1M' | '3M' | '6M' | '1Y' | 'YTD' | 'ALL'

const MONTHS_PT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

// Paleta de cores para barras stacked
const TICKER_COLORS = [
  '#34D399', '#818CF8', '#FBBF24', '#F472B6', '#A78BFA',
  '#6EE7B7', '#60A5FA', '#F87171', '#2DD4BF', '#C084FC',
]

export default function DividendsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('calendar')
  const [period, setPeriod] = useState<PeriodType>('1Y')
  const [simulatorTickers, setSimulatorTickers] = useState<string[]>(['', '', ''])
  const [simulatorAmounts, setSimulatorAmounts] = useState<string[]>(['10000', '10000', '10000'])

  const { token } = useAuth()

  // Dividend radar from InvestIQ API (available endpoint)
  const { data: dividendRadar } = useQuery({
    queryKey: ['dividendRadar'],
    queryFn: () => pro.getDividendRadar(70, token ?? undefined),
    enabled: !!token,
  })

  // Calendar from InvestIQ API
  const { data: calendarData, isLoading: calendarLoading } = useQuery({
    queryKey: ['dividend-calendar'],
    queryFn: () => pro.getDividendCalendar(90, token ?? undefined),
    enabled: !!token,
  })
  const calendar: any = calendarData?.calendar ?? []

  // Summary and projections from InvestIQ API
  const { data: summaryData } = useQuery({
    queryKey: ['dividend-summary', period],
    queryFn: () => pro.getDividendSummary(period === 'ALL' ? 60 : period === '1Y' ? 12 : period === '6M' ? 6 : period === '3M' ? 3 : 1, token ?? undefined),
    enabled: !!token && activeTab === 'summary',
  })
  const summary = summaryData ?? null

  const { data: projectionsData } = useQuery({
    queryKey: ['dividend-projections'],
    queryFn: () => pro.getDividendProjections(12, token ?? undefined),
    enabled: !!token && activeTab === 'projections',
  })
  const projections = projectionsData ?? null

  const validTickers = simulatorTickers.filter(t => t.trim().length >= 4)
  const validAmounts = simulatorAmounts
    .filter((_, i) => (simulatorTickers[i] ?? '').trim().length >= 4)
    .map(a => parseFloat(a) || 0)

  const { data: simulation, mutate: runSimulation, isPending: simulating } = useMutation({
    mutationFn: () => pro.simulateDividends(validTickers, validAmounts, token ?? undefined),
  })

  const nextPayment = calendar.find((e: any) => {
    const exDate = e.ex_date
    return exDate && new Date(exDate) > new Date()
  })

  const daysUntilNext = nextPayment?.ex_date
    ? Math.ceil((new Date(nextPayment.ex_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null

  // Barras stacked por ação — top 5 tickers + "Outros"
  const { stackedChartData, stackedTickers } = useMemo(() => {
    if (!calendar || calendar.length === 0) return { stackedChartData: [], stackedTickers: [] as string[] }

    // Descobrir top tickers por volume total
    const tickerTotals: Record<string, number> = {}
    for (const e of calendar) {
      const t = e.ticker ?? '?'
      tickerTotals[t] = (tickerTotals[t] ?? 0) + (e.value_per_share ?? 0)
    }
    const sortedTickers = Object.entries(tickerTotals)
      .sort((a, b) => b[1] - a[1])
      .map(([t]) => t)
    const topTickers = sortedTickers.slice(0, 5)
    const hasOthers = sortedTickers.length > 5

    // Group by month
    const byMonth: Record<string, typeof calendar> = {}
    for (const e of calendar) {
      const monthKey = e.ex_date?.slice(0, 7) ?? ''
      if (!byMonth[monthKey]) byMonth[monthKey] = []
      byMonth[monthKey].push(e)
    }

    const data = MONTHS_PT.map((label, i) => {
      const monthKey = Object.keys(byMonth).find(k => new Date(k + '-01').getMonth() === i)
      const monthEntries = monthKey ? byMonth[monthKey] ?? [] : []
      const row: Record<string, number | string> = { month: label }
      for (const ticker of topTickers) {
        row[ticker] = monthEntries
          .filter(e => e.ticker === ticker)
          .reduce((sum, e) => sum + (e.value_per_share ?? 0), 0)
      }
      if (hasOthers) {
        row['Outros'] = monthEntries
          .filter(e => !topTickers.includes(e.ticker ?? ''))
          .reduce((sum, e) => sum + (e.value_per_share ?? 0), 0)
      }
      return row
    })

    const tickers = hasOthers ? [...topTickers, 'Outros'] : topTickers
    return { stackedChartData: data, stackedTickers: tickers }
  }, [calendar])

  // Próximos dividendos (forward calendar)
  const forwardDividends = useMemo(() => {
    if (!calendar || calendar.length === 0) return []
    const now = new Date()
    const threeMonthsLater = new Date(now.getFullYear(), now.getMonth() + 3, now.getDate())
    return calendar
      .filter(e => {
        const date = e.ex_date
        return date && new Date(date) >= now && new Date(date) <= threeMonthsLater
      })
      .sort((a, b) => new Date(a.ex_date).getTime() - new Date(b.ex_date).getTime())
      .slice(0, 20)
  }, [calendar])

  const tabs: { key: TabType; label: string }[] = [
    { key: 'calendar', label: 'Calendario' },
    { key: 'summary', label: 'Resumo' },
    { key: 'projections', label: 'Projecoes' },
    { key: 'simulator', label: 'Simulador' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-[var(--text-title)] font-bold tracking-tight">Dividendos</h1>
        <p className="text-[var(--text-small)] text-[var(--text-3)] mt-0.5">Renda passiva e projecoes</p>
      </div>

      {/* KPI Strip */}
      <ScrollableStrip>
        <div className="flex items-center gap-3 pb-1">
          {/* Recebido — emerald gradient */}
          <div className="relative rounded-xl bg-gradient-to-br from-emerald-400/15 to-emerald-400/5 border border-emerald-400/20 px-5 py-3 min-w-[160px]">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-3)] mb-1">Recebido ({period})</p>
            <p className="text-[var(--text-heading)] font-bold font-mono text-emerald-400">{formatCurrency(summary?.total ?? 0)}</p>
          </div>

          {/* Projecao Anual — accent gradient */}
          <div className="relative rounded-xl bg-gradient-to-br from-[var(--accent-1)]/15 to-[var(--accent-1)]/5 border border-[var(--accent-1)]/20 px-5 py-3 min-w-[160px]">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-3)] mb-1">Projecao Anual</p>
            <p className="text-[var(--text-heading)] font-bold font-mono text-[var(--accent-1)]">{formatCurrency(projections?.projections?.reduce((s: number, p: any) => s + (p.dividend_yield_proj ?? 0), 0) ?? 0)}</p>
          </div>

          {/* Media DY */}
          <div className="rounded-xl bg-[var(--surface-1)] border border-[var(--border-1)] px-5 py-3 min-w-[140px]">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-3)] mb-1">Media DY Proj.</p>
            <p className="text-[var(--text-heading)] font-bold font-mono text-[var(--accent-1)]">
              {projections?.projections?.length
                ? ((projections.projections.reduce((s: number, p: any) => s + (p.dividend_yield_proj ?? 0), 0) / projections.projections.length) * 100).toFixed(2)
                : '0.00'}%
            </p>
          </div>

          {/* Proximo Pgto */}
          <div className="rounded-xl bg-[var(--surface-1)] border border-[var(--border-1)] px-5 py-3 min-w-[120px]">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-3)] mb-1">Proximo Pgto</p>
            <p className="text-[var(--text-heading)] font-bold font-mono">{daysUntilNext !== null ? `${daysUntilNext}d` : '\u2014'}</p>
          </div>

          {nextPayment && (
            <div className="rounded-xl bg-[var(--surface-1)] border border-[var(--border-1)] px-5 py-3 min-w-[120px]">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-3)] mb-1">Proximo Ativo</p>
              <p className="text-[var(--text-heading)] font-bold font-mono">{nextPayment.ticker}</p>
            </div>
          )}
        </div>
      </ScrollableStrip>

      {/* Monthly Evolution + Heatmap Calendar — side by side */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Stacked bar chart — monthly dividends received */}
        <div className="md:col-span-7 rounded-xl bg-[var(--surface-1)] border border-[var(--border-1)] overflow-hidden">
          <div className="px-4 py-3 border-b border-[var(--border-1)]">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-3)]">Dividendos Recebidos por Mes</p>
            <p className="text-[var(--text-small)] text-[var(--text-3)] mt-0.5">Barras = mensal por ativo</p>
          </div>
          <div className="px-2 py-3">
            {stackedChartData.length > 0 && stackedTickers.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={stackedChartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-1)" opacity={0.2} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--text-3)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--text-3)' }} axisLine={false} tickLine={false} tickFormatter={(v: number) => v >= 1000 ? `R$ ${(v / 1000).toFixed(1)}k` : `R$ ${v.toFixed(0)}`} width={56} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'var(--surface-1)', border: '1px solid var(--border-1)', borderRadius: '12px', fontSize: '12px', color: 'var(--text-1)', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}
                    formatter={(value: number, name: string) => [formatCurrency(value), name]}
                    cursor={{ fill: 'var(--border-1)', opacity: 0.15 }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', color: 'var(--text-3)' }} />
                  {stackedTickers.map((ticker, i) => (
                    <Bar key={ticker} dataKey={ticker} stackId="divs" fill={TICKER_COLORS[i % TICKER_COLORS.length]} radius={i === stackedTickers.length - 1 ? [3, 3, 0, 0] : [0, 0, 0, 0]} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[220px] flex items-center justify-center text-[var(--text-small)] text-[var(--text-3)]">
                Nenhum dividendo registrado
              </div>
            )}
          </div>
        </div>

        {/* Heatmap calendar */}
        <div className="md:col-span-5 rounded-xl bg-[var(--surface-1)] border border-[var(--border-1)] overflow-hidden">
          <div className="px-4 py-3 border-b border-[var(--border-1)]">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-3)]">Calendario Anual</p>
            <p className="text-[var(--text-small)] text-[var(--text-3)] mt-0.5">Mapa de calor dos pagamentos</p>
          </div>
          <div className="p-3">
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
              {MONTHS_PT.map((month, i) => {
                const monthData = calendar?.byMonth?.find(m => {
                  const d = new Date(m.month + '-01')
                  return d.getMonth() === i
                })
                const total = monthData?.total ?? 0
                const count = monthData?.entries.length ?? 0
                const maxMonthly = Math.max(...(calendar?.byMonth?.map(m => m.total) ?? [1]), 1)
                const intensity = total > 0 ? Math.max(0.15, total / maxMonthly) : 0

                return (
                  <div
                    key={month}
                    className={cn(
                      'rounded-lg p-2.5 text-center transition-colors border',
                      total > 0 ? 'border-emerald-400/25' : 'border-[var(--border-1)] bg-[var(--surface-2)]/20'
                    )}
                    style={total > 0 ? { backgroundColor: `rgba(52, 211, 153, ${intensity * 0.2})` } : undefined}
                  >
                    <span className={cn(
                      'text-[10px] font-bold uppercase tracking-wider',
                      total > 0 ? 'text-[var(--text-2)]' : 'text-[var(--text-3)]'
                    )}>{month}</span>
                    <p className={cn(
                      'text-[var(--text-small)] font-mono mt-1',
                      total > 0 ? 'text-emerald-400 font-bold' : 'text-[var(--text-3)]/40'
                    )}>
                      {total > 0 ? formatCurrency(total) : '\u2014'}
                    </p>
                    {count > 0 && (
                      <p className="text-[var(--text-caption)] text-[var(--text-3)] mt-0.5">{count} pgto{count > 1 ? 's' : ''}</p>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Forward dividends table */}
      {forwardDividends.length > 0 && (
        <div className="rounded-xl bg-[var(--surface-1)] border border-[var(--border-1)] overflow-hidden">
          <div className="px-4 py-3 border-b border-[var(--border-1)]">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-3)]">Proximos Dividendos</p>
            <p className="text-[var(--text-small)] text-[var(--text-3)] mt-0.5">Pagamentos esperados nos proximos 3 meses</p>
          </div>
          <div className="overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <table className="w-full text-[var(--text-small)]">
              <thead>
                <tr className="bg-[var(--surface-2)]/50 border-b border-[var(--border-1)]">
                  <th className="text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-[var(--text-3)]">Data-Ex</th>
                  <th className="text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-[var(--text-3)]">Ativo</th>
                  <th className="text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-[var(--text-3)]">Tipo</th>
                  <th className="text-right px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-[var(--text-3)]">Valor/Acao</th>
                  <th className="text-right px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-[var(--text-3)]">Qtd</th>
                  <th className="text-right px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-[var(--text-3)]">Total Estimado</th>
                </tr>
              </thead>
              <tbody>
                {forwardDividends.map((div, idx) => (
                  <tr key={div.id} className={cn(
                    'transition-colors hover:bg-[var(--surface-2)]/60',
                    idx % 2 === 1 && 'bg-[var(--surface-2)]/20'
                  )}>
                    <td className="px-4 py-2.5 font-mono text-[var(--text-2)]">
                      {div.exDate ? new Date(div.exDate).toLocaleDateString('pt-BR') : '\u2014'}
                    </td>
                    <td className="px-4 py-2.5">
                      <Link href={`/ativo/${div.ticker}`} className="flex items-center gap-2 hover:text-[var(--accent-1)]">
                        <AssetLogo ticker={div.ticker} size={20} />
                        <span className="font-semibold">{div.ticker}</span>
                      </Link>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={cn(
                        'px-2 py-0.5 rounded text-[var(--text-caption)] font-medium',
                        div.type === 'JCP' ? 'bg-blue-500/15 text-blue-400' : 'bg-emerald-400/15 text-emerald-400'
                      )}>
                        {div.type === 'JCP' ? 'JCP' : 'Div'}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono">R$ {div.valuePerShare.toFixed(2)}</td>
                    <td className="px-4 py-2.5 text-right font-mono">{div.quantity}</td>
                    <td className="px-4 py-2.5 text-right font-mono font-bold text-emerald-400">{formatCurrency(div.totalValue)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-[var(--surface-2)]/40 border-t border-[var(--border-1)]">
                  <td colSpan={5} className="px-4 py-2.5 text-[var(--text-small)] font-medium text-[var(--text-2)]">Total Esperado</td>
                  <td className="px-4 py-2.5 text-right font-mono font-bold text-emerald-400">
                    {formatCurrency(forwardDividends.reduce((sum, d) => sum + d.totalValue, 0))}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Pill Tabs — dark background with accent active */}
      <div className="flex gap-1 p-1 bg-[var(--surface-2)]/60 rounded-xl w-fit border border-[var(--border-1)]">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              'px-4 py-2 text-[var(--text-small)] font-medium rounded-lg transition-all duration-200',
              activeTab === tab.key
                ? 'bg-[var(--accent-1)] text-white shadow-md shadow-[var(--accent-1)]/20'
                : 'text-[var(--text-3)] hover:text-[var(--text-1)] hover:bg-[var(--surface-1)]/50'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Calendar Tab */}
      {activeTab === 'calendar' && (
        <div className="rounded-xl bg-[var(--surface-1)] border border-[var(--border-1)] overflow-hidden">
          {calendarLoading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-12 bg-[var(--surface-2)]/50 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : calendar?.entries.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-[var(--text-small)] text-[var(--text-3)]">Nenhum dividendo encontrado</p>
            </div>
          ) : (
            <div>
              {calendar?.byMonth.map((month) => (
                <div key={month.month}>
                  <div className="flex items-center justify-between px-4 py-3 bg-[var(--surface-2)]/40 border-b border-[var(--border-1)]">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-3)]">
                      {new Date(month.month + '-01').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-[var(--text-caption)] text-[var(--text-3)]">{month.entries.length} pgto{month.entries.length > 1 ? 's' : ''}</span>
                      <span className="font-mono text-[var(--text-small)] font-bold text-emerald-400">{formatCurrency(month.total)}</span>
                    </div>
                  </div>
                  <div className="divide-y divide-[var(--border-1)]/30">
                    {month.entries.map((div) => (
                      <Link
                        key={div.id}
                        href={`/ativo/${div.ticker}`}
                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-[var(--surface-2)]/40 transition-colors"
                      >
                        <span className="font-mono text-[var(--text-caption)] text-[var(--text-3)] w-12 shrink-0">
                          {div.paymentDate ? new Date(div.paymentDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : '\u2014'}
                        </span>
                        <AssetLogo ticker={div.ticker} size={24} />
                        <div className="flex-1 min-w-0">
                          <span className="font-semibold text-[var(--text-small)]">{div.ticker}</span>
                          <span className="text-[var(--text-small)] text-[var(--text-3)] ml-2 truncate">{div.name}</span>
                        </div>
                        <span className="text-[var(--text-caption)] text-[var(--text-3)] font-mono shrink-0">
                          {div.quantity} cotas
                        </span>
                        <span className="text-[var(--text-caption)] text-[var(--text-3)] font-mono shrink-0 w-24 text-right">
                          R$ {div.valuePerShare.toFixed(2)}/cota
                        </span>
                        <span className="font-mono text-[var(--text-small)] font-bold text-emerald-400 w-24 text-right shrink-0">{formatCurrency(div.totalValue)}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Summary Tab */}
      {activeTab === 'summary' && (
        <div className="space-y-4">
          {/* Period selector pills */}
          <div className="flex gap-1.5">
            {(['1M', '3M', '6M', '1Y', 'YTD', 'ALL'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={cn(
                  'px-3 py-1.5 text-[var(--text-small)] font-medium rounded-lg transition-all',
                  period === p
                    ? 'bg-[var(--accent-1)] text-white shadow-md shadow-[var(--accent-1)]/20'
                    : 'bg-[var(--surface-2)]/60 text-[var(--text-3)] hover:text-[var(--text-1)] border border-[var(--border-1)]'
                )}
              >
                {p}
              </button>
            ))}
          </div>

          {(() => {
            // Derive byAsset from summary months
            const byAsset: Array<{ ticker: string; total: number }> = []
            if (summary?.summary) {
              const tickerTotals: Record<string, number> = {}
              for (const month of summary.summary) {
                for (const entry of month.entries) {
                  tickerTotals[entry.ticker] = (tickerTotals[entry.ticker] ?? 0) + entry.value
                }
              }
              for (const [ticker, total] of Object.entries(tickerTotals)) {
                byAsset.push({ ticker, total })
              }
              byAsset.sort((a, b) => b.total - a.total)
            }
            const totalReceived = summary?.total ?? 0
            return (
          <div className="grid lg:grid-cols-2 gap-4">
            {/* Summary Stats */}
            <div className="rounded-xl bg-[var(--surface-1)] border border-[var(--border-1)] overflow-hidden">
              <div className="px-4 py-3 border-b border-[var(--border-1)]">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-3)]">Resumo do Periodo</p>
              </div>
              <div className="divide-y divide-[var(--border-1)]/30">
                {[
                  { label: 'Total Recebido', value: formatCurrency(totalReceived), color: 'text-emerald-400' },
                  { label: 'Meses', value: `${summary?.summary?.length ?? 0} meses` },
                  { label: 'Ativos Pagadores', value: `${byAsset.length}` },
                  { label: 'Media Mensal', value: formatCurrency(summary?.summary?.length ? totalReceived / summary.summary.length : 0) },
                ].map((stat) => (
                  <div key={stat.label} className="flex items-center justify-between px-4 py-3">
                    <span className="text-[var(--text-small)] text-[var(--text-3)]">{stat.label}</span>
                    <span className={cn('font-mono text-[var(--text-small)] font-medium', stat.color)}>{stat.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Payers with bar visualization */}
            <div className="rounded-xl bg-[var(--surface-1)] border border-[var(--border-1)] overflow-hidden">
              <div className="px-4 py-3 border-b border-[var(--border-1)]">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-3)]">Top Pagadores</p>
              </div>
              <div className="divide-y divide-[var(--border-1)]/30">
                {byAsset.slice(0, 6).map((asset, index) => {
                  const maxReceived = byAsset[0]?.total ?? 1
                  const pct = (asset.total / maxReceived) * 100
                  return (
                    <Link
                      key={asset.ticker}
                      href={`/ativo/${asset.ticker}`}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-[var(--surface-2)]/40 transition-colors"
                    >
                      <span className="text-[var(--text-caption)] text-[var(--text-3)] w-4 font-mono">{index + 1}</span>
                      <AssetLogo ticker={asset.ticker} size={24} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-[var(--text-small)]">{asset.ticker}</span>
                          <span className="font-mono text-[var(--text-small)] font-bold text-emerald-400">{formatCurrency(asset.total)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-[var(--surface-2)] rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-400/60 rounded-full transition-all" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      </div>
                    </Link>
                  )
                })}
                {byAsset.length === 0 && (
                  <div className="p-6 text-center text-[var(--text-small)] text-[var(--text-3)]">Nenhum dividendo no periodo</div>
                )}
              </div>
            </div>
          </div>
            )
          })()}

          {/* DY Contribution Chart */}
          {summary?.summary && summary.summary.length > 0 && (
            <div className="rounded-xl bg-[var(--surface-1)] border border-[var(--border-1)] overflow-hidden">
              <div className="px-4 py-3 border-b border-[var(--border-1)]">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-3)]">Dividendos por Mes</p>
                <p className="text-[var(--text-small)] text-[var(--text-3)] mt-0.5">Dividendos recebidos mes a mes</p>
              </div>
              <div className="px-2 py-3">
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={summary.summary.map((m: any) => ({ month: m.month, total: m.subtotal }))} margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-1)" opacity={0.15} />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--text-3)' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: 'var(--text-3)' }} axisLine={false} tickLine={false} tickFormatter={(v: number) => formatCurrency(v)} />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'var(--surface-1)', border: '1px solid var(--border-1)', borderRadius: '12px', fontSize: '12px', color: 'var(--text-1)', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}
                      formatter={(value: number) => [formatCurrency(value), 'Recebido']}
                      cursor={{ fill: 'var(--border-1)', opacity: 0.15 }}
                    />
                    <Bar dataKey="total" fill="#34D399" radius={[4, 4, 0, 0]} opacity={0.85} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Projections Tab */}
      {activeTab === 'projections' && (
        <div className="space-y-4">
          {/* Summary strip */}
          <div className="flex items-center gap-6 px-5 py-3 rounded-xl bg-gradient-to-br from-emerald-400/10 to-emerald-400/5 border border-emerald-400/20">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-3)]">Ativos com projecao</p>
              <p className="text-[var(--text-heading)] font-bold font-mono text-emerald-400">{projections?.projections?.length ?? 0}</p>
            </div>
          </div>

          {/* Projections Table — by asset (real API data) */}
          {projections?.projections && projections.projections.length > 0 && (
            <div className="rounded-xl bg-[var(--surface-1)] border border-[var(--border-1)] overflow-hidden">
              <div className="px-4 py-3 border-b border-[var(--border-1)]">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-3)]">Projecao por Ativo</p>
                <p className="text-[var(--text-small)] text-[var(--text-3)] mt-0.5">Dividend Yield projetado e seguranca do dividendo</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-[var(--text-small)]">
                  <thead>
                    <tr className="bg-[var(--surface-2)]/50 border-b border-[var(--border-1)]">
                      <th className="text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-[var(--text-3)]">Ativo</th>
                      <th className="text-right px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-[var(--text-3)]">DY Projetado</th>
                      <th className="text-right px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-[var(--text-3)]">Seguranca</th>
                      <th className="text-right px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-[var(--text-3)]">CAGR 5a</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projections.projections.map((proj: any, idx: number) => (
                      <tr key={proj.ticker} className={cn(
                        'transition-colors hover:bg-[var(--surface-2)]/60',
                        idx % 2 === 1 && 'bg-[var(--surface-2)]/20'
                      )}>
                        <td className="px-4 py-2.5">
                          <Link href={`/ativo/${proj.ticker}`} className="flex items-center gap-2 group">
                            <AssetLogo ticker={proj.ticker} size={24} />
                            <div>
                              <span className="font-semibold group-hover:text-[var(--accent-1)] transition-colors">{proj.ticker}</span>
                              <span className="text-[var(--text-caption)] text-[var(--text-3)] ml-1.5">{proj.company_name}</span>
                            </div>
                          </Link>
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono font-medium text-[var(--accent-1)]">{((proj.dividend_yield_proj ?? 0) * 100).toFixed(1)}%</td>
                        <td className="px-4 py-2.5 text-right">
                          <span className={cn('font-mono font-bold', (proj.dividend_safety ?? 0) >= 70 ? 'text-emerald-400' : (proj.dividend_safety ?? 0) >= 50 ? 'text-amber-400' : 'text-red-400')}>
                            {proj.dividend_safety ?? '-'}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono">{proj.dividend_cagr_5y != null ? `${(proj.dividend_cagr_5y * 100).toFixed(1)}%` : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Passive Income Projection — below projections table */}
      {activeTab === 'projections' && projections?.projections && projections.projections.length > 0 && (
        <PassiveIncomeSection
          monthlyAverage={0}
          totalProjected={projections.projections.reduce((s: number, p: any) => s + ((p.dividend_yield_proj ?? 0) * 100), 0)}
        />
      )}

      {/* Simulator Tab */}
      {activeTab === 'simulator' && (
        <div className="space-y-4">
          <div className="rounded-xl bg-[var(--surface-1)] border border-[var(--border-1)] p-5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-3)] mb-1">Simulador de Dividendos</p>
            <p className="text-[var(--text-small)] text-[var(--text-3)] mb-4">Simule quanto voce receberia investindo em diferentes ativos</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {simulatorTickers.map((ticker, index) => (
                <div key={index} className="space-y-2 p-3 rounded-xl border border-[var(--border-1)] bg-[var(--surface-2)]/20">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--text-3)] mb-1">Ticker {index + 1}</label>
                    <Input
                      value={ticker}
                      onChange={(e) => {
                        const newTickers = [...simulatorTickers]
                        newTickers[index] = e.target.value.toUpperCase()
                        setSimulatorTickers(newTickers)
                      }}
                      placeholder="PETR4"
                      className="font-mono text-[var(--text-small)] bg-[var(--surface-1)] border-[var(--border-1)]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--text-3)] mb-1">Valor (R$)</label>
                    <Input
                      type="number"
                      value={simulatorAmounts[index]}
                      onChange={(e) => {
                        const newAmounts = [...simulatorAmounts]
                        newAmounts[index] = e.target.value
                        setSimulatorAmounts(newAmounts)
                      }}
                      placeholder="10000"
                      className="font-mono text-[var(--text-small)] bg-[var(--surface-1)] border-[var(--border-1)]"
                    />
                  </div>
                </div>
              ))}
            </div>
            <Button
              variant="primary"
              className="w-full mt-3 text-xs"
              size="sm"
              disabled={validTickers.length === 0 || simulating}
              onClick={() => runSimulation()}
            >
              {simulating ? 'Simulando...' : 'Simular Dividendos'}
            </Button>
          </div>

          {simulation && (
            <div className="space-y-4">
              {/* Simulation KPIs — emerald results */}
              <div className="grid grid-cols-3 gap-4">
                <div className="rounded-xl bg-gradient-to-br from-emerald-400/15 to-emerald-400/5 border border-emerald-400/20 p-4 text-center">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-3)]">Dividendo Anual</p>
                  <p className="text-[var(--text-heading)] font-bold font-mono mt-1 text-emerald-400">{formatCurrency(simulation.totals.annualDividend)}</p>
                </div>
                <div className="rounded-xl bg-gradient-to-br from-emerald-400/10 to-emerald-400/5 border border-emerald-400/15 p-4 text-center">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-3)]">Dividendo Mensal</p>
                  <p className="text-[var(--text-heading)] font-bold font-mono mt-1 text-emerald-400">{formatCurrency(simulation.totals.monthlyDividend)}</p>
                </div>
                <div className="rounded-xl bg-gradient-to-br from-[var(--accent-1)]/15 to-[var(--accent-1)]/5 border border-[var(--accent-1)]/20 p-4 text-center">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-3)]">Yield Medio</p>
                  <p className="text-[var(--text-heading)] font-bold font-mono mt-1 text-[var(--accent-1)]">{simulation.totals.avgYield.toFixed(2)}%</p>
                </div>
              </div>

              {/* Results — cards */}
              <div className="grid lg:grid-cols-3 gap-4">
                {simulation.results.filter(r => r.found).map((result) => (
                  <Link
                    key={result.ticker}
                    href={`/ativo/${result.ticker}`}
                    className="rounded-xl bg-[var(--surface-1)] border border-[var(--border-1)] p-4 hover:border-emerald-400/30 transition-colors group"
                  >
                    <div className="flex items-center gap-2.5 mb-3">
                      <AssetLogo ticker={result.ticker} size={28} />
                      <div>
                        <p className="text-[var(--text-small)] font-semibold group-hover:text-emerald-400 transition-colors">{result.ticker}</p>
                        <p className="text-[var(--text-caption)] text-[var(--text-3)] truncate">{result.name}</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-[var(--text-small)]">
                        <span className="text-[var(--text-3)]">Cotas</span>
                        <span className="font-mono font-medium">{result.shares}</span>
                      </div>
                      <div className="flex justify-between text-[var(--text-small)]">
                        <span className="text-[var(--text-3)]">Preco</span>
                        <span className="font-mono">{formatCurrency(result.currentPrice)}</span>
                      </div>
                      <div className="flex justify-between text-[var(--text-small)]">
                        <span className="text-[var(--text-3)]">DY</span>
                        <span className="font-mono font-bold text-[var(--accent-1)]">{result.dividendYield.toFixed(2)}%</span>
                      </div>
                      <div className="h-px bg-[var(--border-1)]/30 my-1" />
                      <div className="flex justify-between text-[var(--text-small)]">
                        <span className="text-[var(--text-3)]">Anual</span>
                        <span className="font-mono font-bold text-emerald-400">{formatCurrency(result.annualDividend)}</span>
                      </div>
                      <div className="flex justify-between text-[var(--text-small)]">
                        <span className="text-[var(--text-3)]">Mensal</span>
                        <span className="font-mono font-medium">{formatCurrency(result.monthlyDividend)}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Projecao de Renda Passiva com Reinvestimento ──────────────
function PassiveIncomeSection({ monthlyAverage, totalProjected }: { monthlyAverage: number; totalProjected: number }) {
  const [targetMonthly, setTargetMonthly] = useState('5000')
  const [avgDY, setAvgDY] = useState('6')
  const [years, setYears] = useState(10)

  const target = parseFloat(targetMonthly) || 5000
  const dy = parseFloat(avgDY) || 6

  // Quanto precisa investir para atingir a meta
  const neededInvestment = target > 0 && dy > 0 ? (target * 12) / (dy / 100) : 0

  // Projecao com reinvestimento compound (DY reinvestido)
  const compoundData = useMemo(() => {
    const monthlyRate = (dy / 100) / 12
    const data: Array<{ year: number; semReinv: number; comReinv: number; rendaMensal: number }> = []
    let accumulated = totalProjected > 0 ? (totalProjected / (dy / 100)) * 100 : 50000
    let withoutReinv = accumulated

    for (let y = 0; y <= years; y++) {
      const rendaMensal = accumulated * (dy / 100) / 12
      data.push({
        year: y,
        semReinv: withoutReinv,
        comReinv: accumulated,
        rendaMensal,
      })
      // Com reinvestimento: dividendos reinvestidos
      accumulated = accumulated * (1 + dy / 100)
      // Sem reinvestimento: apenas patrimonio original (cresce pela valorizacao, ~8% ao ano simplificado)
      withoutReinv = withoutReinv * 1.08
    }
    return data
  }, [totalProjected, dy, years])

  const finalMonthlyIncome = compoundData[compoundData.length - 1]?.rendaMensal ?? 0

  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-[var(--surface-1)] border border-[var(--border-1)] overflow-hidden">
        <div className="px-4 py-3 border-b border-[var(--border-1)]">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-3)]">Projecao de Renda Passiva</p>
          <p className="text-[var(--text-small)] text-[var(--text-3)] mt-0.5">Evolucao do patrimonio com reinvestimento de dividendos</p>
        </div>

        {/* Controles */}
        <div className="px-4 py-3 border-b border-[var(--border-1)] bg-[var(--surface-2)]/20">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-3)]">DY medio:</label>
              <Input
                type="number"
                value={avgDY}
                onChange={(e) => setAvgDY(e.target.value)}
                className="w-20 font-mono text-[var(--text-small)] bg-[var(--surface-1)] border-[var(--border-1)]"
              />
              <span className="text-[var(--text-caption)] text-[var(--text-3)]">%</span>
            </div>
            <div className="flex items-center gap-1.5">
              {[5, 10, 15, 20].map(y => (
                <button
                  key={y}
                  onClick={() => setYears(y)}
                  className={cn(
                    'px-2.5 py-1 text-[var(--text-caption)] font-medium rounded-lg transition-all',
                    years === y
                      ? 'bg-[var(--accent-1)] text-white shadow-md shadow-[var(--accent-1)]/20'
                      : 'bg-[var(--surface-2)]/60 text-[var(--text-3)] hover:text-[var(--text-1)] border border-[var(--border-1)]'
                  )}
                >
                  {y}a
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="px-2 py-3">
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={compoundData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="compoundGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#34D399" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#34D399" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-1)" opacity={0.15} />
              <XAxis dataKey="year" tick={{ fontSize: 12, fill: 'var(--text-3)' }} axisLine={false} tickLine={false} tickFormatter={(v) => `Ano ${v}`} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--text-3)' }} axisLine={false} tickLine={false} tickFormatter={(v) => v >= 1000000 ? `R$ ${(v / 1000000).toFixed(1)}M` : v >= 1000 ? `R$ ${(v / 1000).toFixed(0)}k` : `R$ ${v.toFixed(0)}`} width={70} />
              <Tooltip
                contentStyle={{ backgroundColor: 'var(--surface-1)', border: '1px solid var(--border-1)', borderRadius: '12px', fontSize: '12px', color: 'var(--text-1)', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}
                formatter={(value: number, name: string) => {
                  const labels: Record<string, string> = { comReinv: 'Com Reinvestimento', semReinv: 'Sem Reinvestimento' }
                  return [formatCurrency(value), labels[name] ?? name]
                }}
                labelFormatter={(label) => `Ano ${label}`}
              />
              <Area type="monotone" dataKey="comReinv" stroke="#34D399" strokeWidth={2} fill="url(#compoundGrad)" name="comReinv" />
              <Area type="monotone" dataKey="semReinv" stroke="#818CF8" strokeWidth={1.5} strokeDasharray="5 5" fill="none" name="semReinv" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* KPIs de resultado */}
        <div className="grid grid-cols-3 border-t border-[var(--border-1)] divide-x divide-[var(--border-1)]/30">
          <div className="p-3 text-center">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-3)]">Renda Mensal Atual</p>
            <p className="text-[var(--text-body)] font-bold font-mono text-emerald-400">{formatCurrency(monthlyAverage)}</p>
          </div>
          <div className="p-3 text-center">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-3)]">Renda em {years} anos</p>
            <p className="text-[var(--text-body)] font-bold font-mono text-emerald-400">{formatCurrency(finalMonthlyIncome)}</p>
          </div>
          <div className="p-3 text-center">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-3)]">Crescimento</p>
            <p className="text-[var(--text-body)] font-bold font-mono text-[var(--accent-1)]">
              {monthlyAverage > 0 ? `${((finalMonthlyIncome / monthlyAverage - 1) * 100).toFixed(0)}%` : '\u2014'}
            </p>
          </div>
        </div>
      </div>

      {/* Goal calculator */}
      <div className="rounded-xl bg-[var(--surface-1)] border border-[var(--border-1)] overflow-hidden">
        <div className="px-4 py-3 border-b border-[var(--border-1)]">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-3)]">Meta de Renda Passiva</p>
          <p className="text-[var(--text-small)] text-[var(--text-3)] mt-0.5">Quanto voce precisa investir para atingir sua meta mensal</p>
        </div>
        <div className="p-4">
          <div className="flex flex-wrap items-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-3)]">Meta mensal:</label>
              <div className="flex items-center">
                <span className="text-[var(--text-small)] text-[var(--text-3)] mr-1">R$</span>
                <Input
                  type="number"
                  value={targetMonthly}
                  onChange={(e) => setTargetMonthly(e.target.value)}
                  className="w-28 font-mono text-[var(--text-small)] bg-[var(--surface-1)] border-[var(--border-1)]"
                />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-6 p-4 rounded-xl bg-gradient-to-br from-emerald-400/10 to-emerald-400/5 border border-emerald-400/15">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-3)]">Para receber</p>
              <p className="text-[var(--text-heading)] font-bold font-mono text-emerald-400">{formatCurrency(target)}/mes</p>
            </div>
            <div className="text-[var(--text-heading)] text-[var(--text-3)]">=</div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-3)]">Patrimonio necessario</p>
              <p className="text-[var(--text-heading)] font-bold font-mono">{formatCurrency(neededInvestment)}</p>
            </div>
            <div className="text-[var(--text-caption)] text-[var(--text-3)]">com DY de {dy}%</div>
          </div>
        </div>
      </div>
    </div>
  )
}
