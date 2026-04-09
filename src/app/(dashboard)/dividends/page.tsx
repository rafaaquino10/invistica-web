'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Input, Button, ScrollableStrip } from '@/components/ui'
import { trpc } from '@/lib/trpc/provider'
import { formatCurrency } from '@/lib/utils/formatters'
import { cn } from '@/lib/utils'
import { AssetLogo } from '@/components/ui/asset-logo'
import { tabTransition } from '@/lib/utils/motion'
import { DividendProjectionsPanel } from '@/components/dividends/projections-panel'
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from 'recharts'

type TabType = 'calendar' | 'summary' | 'projections' | 'simulator' | 'radar'
type PeriodType = '1M' | '3M' | '6M' | '1Y' | 'YTD' | 'ALL'

const MONTHS_PT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

// Paleta de cores para barras stacked
const TICKER_COLORS = [
  '#0D9488', '#6366F1', '#F59E0B', '#EC4899', '#8B5CF6',
  '#10B981', '#3B82F6', '#EF4444', '#14B8A6', '#A855F7',
]

export default function DividendsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('calendar')
  const [period, setPeriod] = useState<PeriodType>('1Y')
  const [simulatorTickers, setSimulatorTickers] = useState<string[]>(['', '', ''])
  const [simulatorAmounts, setSimulatorAmounts] = useState<string[]>(['10000', '10000', '10000'])

  const { data: calendar, isLoading: calendarLoading } = trpc.dividends.calendar.useQuery({})
  const { data: summary } = trpc.dividends.summary.useQuery({ period })
  const { data: projections } = trpc.dividends.projections.useQuery({ months: 12 })

  const validTickers = simulatorTickers.filter(t => t.trim().length >= 4)
  const validAmounts = simulatorAmounts
    .filter((_, i) => (simulatorTickers[i] ?? '').trim().length >= 4)
    .map(a => parseFloat(a) || 0)

  const { data: simulation } = trpc.dividends.simulate.useQuery(
    { tickers: validTickers, amounts: validAmounts },
    { enabled: validTickers.length > 0 }
  )

  const nextPayment = calendar?.entries.find((e) => {
    const date = e.paymentDate ?? e.exDate
    return date && date > new Date()
  })

  const daysUntilNext = nextPayment?.paymentDate
    ? Math.ceil((new Date(nextPayment.paymentDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null

  // Barras stacked por ação — top 5 tickers + "Outros"
  const { stackedChartData, stackedTickers } = useMemo(() => {
    if (!calendar?.byMonth) return { stackedChartData: [], stackedTickers: [] as string[] }

    // Descobrir top tickers por volume total
    const tickerTotals: Record<string, number> = {}
    for (const m of calendar.byMonth) {
      for (const e of m.entries) {
        tickerTotals[e.ticker] = (tickerTotals[e.ticker] ?? 0) + e.totalValue
      }
    }
    const sortedTickers = Object.entries(tickerTotals)
      .sort((a, b) => b[1] - a[1])
      .map(([t]) => t)
    const topTickers = sortedTickers.slice(0, 5)
    const hasOthers = sortedTickers.length > 5

    const data = MONTHS_PT.map((label, i) => {
      const monthData = calendar.byMonth.find(m => {
        const d = new Date(m.month + '-01')
        return d.getMonth() === i
      })
      const row: Record<string, number | string> = { month: label }
      for (const ticker of topTickers) {
        row[ticker] = monthData?.entries
          .filter(e => e.ticker === ticker)
          .reduce((sum, e) => sum + e.totalValue, 0) ?? 0
      }
      if (hasOthers) {
        row['Outros'] = monthData?.entries
          .filter(e => !topTickers.includes(e.ticker))
          .reduce((sum, e) => sum + e.totalValue, 0) ?? 0
      }
      return row
    })

    const tickers = hasOthers ? [...topTickers, 'Outros'] : topTickers
    return { stackedChartData: data, stackedTickers: tickers }
  }, [calendar])

  // Próximos dividendos (forward calendar)
  const forwardDividends = useMemo(() => {
    if (!calendar?.entries) return []
    const now = new Date()
    const threeMonthsLater = new Date(now.getFullYear(), now.getMonth() + 3, now.getDate())
    return calendar.entries
      .filter(e => {
        const date = e.exDate ?? e.paymentDate
        return date && new Date(date) >= now && new Date(date) <= threeMonthsLater
      })
      .sort((a, b) => {
        const da = new Date(a.exDate ?? a.paymentDate ?? 0).getTime()
        const db = new Date(b.exDate ?? b.paymentDate ?? 0).getTime()
        return da - db
      })
      .slice(0, 20)
  }, [calendar])

  const tabs: { key: TabType; label: string }[] = [
    { key: 'calendar', label: 'Calendário' },
    { key: 'summary', label: 'Resumo' },
    { key: 'projections', label: 'Projeções' },
    { key: 'simulator', label: 'Simulador' },
    { key: 'radar', label: 'Radar DY' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-[var(--text-title)] font-bold tracking-tight">Dividendos</h1>
        <p className="text-[var(--text-small)] text-[var(--text-2)] mt-0.5">Renda passiva e projeções</p>
      </div>

      {/* KPI Strip */}
      <ScrollableStrip>
        <div className="flex items-center gap-8 pb-1">
          <div>
            <p className="text-[var(--text-caption)] text-[var(--text-2)] mb-0.5">Recebido ({period})</p>
            <p className="text-[var(--text-heading)] font-bold font-mono text-[var(--pos)]">{formatCurrency(summary?.totalReceived ?? 0)}</p>
          </div>
          <div className="w-px h-10 bg-[var(--border-1)]/30 flex-shrink-0" />
          <div>
            <p className="text-[var(--text-caption)] text-[var(--text-2)] mb-0.5">Projeção Anual</p>
            <p className="text-[var(--text-heading)] font-bold font-mono">{formatCurrency(projections?.totalProjected ?? 0)}</p>
          </div>
          <div className="w-px h-10 bg-[var(--border-1)]/30 flex-shrink-0" />
          <div>
            <p className="text-[var(--text-caption)] text-[var(--text-2)] mb-0.5">Yield on Cost</p>
            <p className="text-[var(--text-heading)] font-bold font-mono text-[var(--accent-1)]">{(summary?.overallYoC ?? 0).toFixed(2)}%</p>
          </div>
          <div className="w-px h-10 bg-[var(--border-1)]/30 flex-shrink-0" />
          <div>
            <p className="text-[var(--text-caption)] text-[var(--text-2)] mb-0.5">Próximo Pgto</p>
            <p className="text-[var(--text-heading)] font-bold font-mono">{daysUntilNext !== null ? `${daysUntilNext}d` : '—'}</p>
          </div>
          {nextPayment && (
            <>
              <div className="w-px h-10 bg-[var(--border-1)]/30 flex-shrink-0" />
              <div>
                <p className="text-[var(--text-caption)] text-[var(--text-2)] mb-0.5">Próximo Ativo</p>
                <p className="text-[var(--text-heading)] font-bold font-mono">{nextPayment.ticker}</p>
              </div>
            </>
          )}
        </div>
      </ScrollableStrip>

      {/* Backend Dividend Projections */}
      <DividendProjectionsPanel />

      {/* Monthly Evolution + Heatmap Calendar — side by side */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Area chart — monthly dividends received + cumulative line */}
        <div className="md:col-span-7 bg-[var(--surface-1)] border border-[var(--border-1)] rounded-[var(--radius)] shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-[var(--border-1)]">
            <h2 className="text-[var(--text-small)] font-semibold">Dividendos Recebidos por Mês</h2>
            <p className="text-[var(--text-small)] text-[var(--text-2)]">Barras = mensal · Linha = acumulado</p>
          </div>
          <div className="px-2 py-3">
            {stackedChartData.length > 0 && stackedTickers.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={stackedChartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-1)" opacity={0.3} />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'var(--text-2)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--text-2)' }} axisLine={false} tickLine={false} tickFormatter={(v: number) => v >= 1000 ? `R$ ${(v / 1000).toFixed(1)}k` : `R$ ${v.toFixed(0)}`} width={56} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'var(--surface-1)', border: '1px solid var(--border-1)', borderRadius: '8px', fontSize: '13px' }}
                    formatter={(value: number, name: string) => [formatCurrency(value), name]}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  {stackedTickers.map((ticker, i) => (
                    <Bar key={ticker} dataKey={ticker} stackId="divs" fill={TICKER_COLORS[i % TICKER_COLORS.length]} radius={i === stackedTickers.length - 1 ? [3, 3, 0, 0] : [0, 0, 0, 0]} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[220px] flex items-center justify-center text-[var(--text-small)] text-[var(--text-2)]">
                Nenhum dividendo registrado
              </div>
            )}
          </div>
        </div>

        {/* Heatmap calendar */}
        <div className="md:col-span-5 bg-[var(--surface-1)] border border-[var(--border-1)] rounded-[var(--radius)] shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-[var(--border-1)]">
            <h2 className="text-[var(--text-small)] font-semibold">Calendário Anual</h2>
            <p className="text-[var(--text-small)] text-[var(--text-2)]">Mapa de calor dos pagamentos</p>
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
                      total > 0 ? 'border-teal/30' : 'border-[var(--border-1)] bg-[var(--surface-2)]/30'
                    )}
                    style={total > 0 ? { backgroundColor: `rgba(13, 148, 136, ${intensity * 0.3})` } : undefined}
                  >
                    <span className={cn(
                      'text-[var(--text-small)] font-medium',
                      total > 0 ? 'text-[var(--text-2)]' : 'text-[var(--text-3)]'
                    )}>{month}</span>
                    <p className={cn(
                      'text-[var(--text-small)] font-mono mt-1',
                      total > 0 ? 'text-teal font-bold' : 'text-[var(--text-3)]/50'
                    )}>
                      {total > 0 ? formatCurrency(total) : '—'}
                    </p>
                    {count > 0 && (
                      <p className="text-[var(--text-caption)] text-[var(--text-2)] mt-0.5">{count} pgto{count > 1 ? 's' : ''}</p>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Calendário Forward — próximos dividendos esperados */}
      {forwardDividends.length > 0 && (
        <div className="bg-[var(--surface-1)] border border-[var(--border-1)] rounded-[var(--radius)] shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-[var(--border-1)]">
            <h2 className="text-[var(--text-small)] font-semibold">Próximos Dividendos</h2>
            <p className="text-[var(--text-small)] text-[var(--text-2)]">Pagamentos esperados nos próximos 3 meses</p>
          </div>
          <div className="overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <table className="w-full text-[var(--text-small)]">
              <thead>
                <tr className="bg-[var(--surface-2)] border-b border-[var(--border-1)]">
                  <th className="text-left px-4 py-3 text-[var(--text-caption)] font-medium text-[var(--text-2)] uppercase tracking-wider">Data-Ex</th>
                  <th className="text-left px-4 py-3 text-[var(--text-caption)] font-medium text-[var(--text-2)] uppercase tracking-wider">Ativo</th>
                  <th className="text-left px-4 py-3 text-[var(--text-caption)] font-medium text-[var(--text-2)] uppercase tracking-wider">Tipo</th>
                  <th className="text-right px-4 py-3 text-[var(--text-caption)] font-medium text-[var(--text-2)] uppercase tracking-wider">Valor/Ação</th>
                  <th className="text-right px-4 py-3 text-[var(--text-caption)] font-medium text-[var(--text-2)] uppercase tracking-wider">Qtd</th>
                  <th className="text-right px-4 py-3 text-[var(--text-caption)] font-medium text-[var(--text-2)] uppercase tracking-wider">Total Estimado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-1)]/50">
                {forwardDividends.map((div) => (
                  <tr key={div.id} className="hover:bg-[var(--surface-2)] transition-colors">
                    <td className="px-4 py-3 font-mono">
                      {div.exDate ? new Date(div.exDate).toLocaleDateString('pt-BR') : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/ativo/${div.ticker}`} className="flex items-center gap-2 hover:text-[var(--accent-1)]">
                        <AssetLogo ticker={div.ticker} size={20} />
                        <span className="font-semibold">{div.ticker}</span>
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        'px-2 py-0.5 rounded text-[var(--text-caption)] font-medium',
                        div.type === 'JCP' ? 'bg-blue-500/15 text-blue-500' : 'bg-teal/15 text-teal'
                      )}>
                        {div.type === 'JCP' ? 'JCP' : 'Div'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono">R$ {Number(div.valuePerShare).toFixed(2)}</td>
                    <td className="px-4 py-3 text-right font-mono">{div.quantity}</td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-teal">{formatCurrency(div.totalValue)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-[var(--surface-2)] border-t border-[var(--border-1)]">
                  <td colSpan={5} className="px-4 py-3 text-[var(--text-small)] font-medium">Total Esperado</td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-teal">
                    {formatCurrency(forwardDividends.reduce((sum, d) => sum + d.totalValue, 0))}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Pill Tabs */}
      <div className="flex gap-1 p-1 bg-[var(--surface-2)] rounded-[var(--radius)] w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              'px-4 py-2 text-[var(--text-small)] font-medium rounded-lg transition-all duration-200',
              activeTab === tab.key
                ? 'bg-[var(--surface-1)] text-[var(--text-1)]'
                : 'text-[var(--text-2)] hover:text-[var(--text-1)]'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Calendar Tab */}
      {activeTab === 'calendar' && (
        <div className="bg-[var(--surface-1)] border border-[var(--border-1)] rounded-[var(--radius)] shadow-sm overflow-hidden">
          {calendarLoading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-12 bg-[var(--surface-2)] rounded animate-pulse" />
              ))}
            </div>
          ) : calendar?.entries.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-[var(--text-small)] text-[var(--text-2)]">Nenhum dividendo encontrado</p>
            </div>
          ) : (
            <div>
              {calendar?.byMonth.map((month) => (
                <div key={month.month}>
                  <div className="flex items-center justify-between px-4 py-3 bg-[var(--surface-2)] border-b border-[var(--border-1)]">
                    <span className="text-[var(--text-small)] font-semibold capitalize">
                      {new Date(month.month + '-01').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-[var(--text-small)] text-[var(--text-2)]">{month.entries.length} pgto{month.entries.length > 1 ? 's' : ''}</span>
                      <span className="font-mono text-[var(--text-small)] font-bold text-teal">{formatCurrency(month.total)}</span>
                    </div>
                  </div>
                  <div className="divide-y divide-[var(--border-1)]/50">
                    {month.entries.map((div) => (
                      <Link
                        key={div.id}
                        href={`/ativo/${div.ticker}`}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-[var(--surface-2)] transition-colors"
                      >
                        <span className="font-mono text-[var(--text-small)] text-[var(--text-2)] w-12 shrink-0">
                          {div.paymentDate ? new Date(div.paymentDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : '—'}
                        </span>
                        <AssetLogo ticker={div.ticker} size={24} />
                        <div className="flex-1 min-w-0">
                          <span className="font-semibold text-[var(--text-small)]">{div.ticker}</span>
                          <span className="text-[var(--text-small)] text-[var(--text-2)] ml-2 truncate">{div.name}</span>
                        </div>
                        <span className="text-[var(--text-small)] text-[var(--text-2)] font-mono shrink-0">
                          {div.quantity} cotas
                        </span>
                        <span className="text-[var(--text-small)] text-[var(--text-2)] font-mono shrink-0 w-24 text-right">
                          R$ {Number(div.valuePerShare).toFixed(2)}/cota
                        </span>
                        <span className="font-mono text-[var(--text-small)] font-bold text-teal w-24 text-right shrink-0">{formatCurrency(div.totalValue)}</span>
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
          <div className="flex gap-2">
            {(['1M', '3M', '6M', '1Y', 'YTD', 'ALL'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={cn(
                  'px-3 py-1.5 text-[var(--text-small)] font-medium rounded-lg transition-all',
                  period === p
                    ? 'bg-[var(--accent-1)] text-white'
                    : 'bg-[var(--surface-2)] text-[var(--text-2)] hover:text-[var(--text-1)]'
                )}
              >
                {p}
              </button>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-4">
            {/* Summary Stats */}
            <div className="bg-[var(--surface-1)] border border-[var(--border-1)] rounded-[var(--radius)] shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-[var(--border-1)]">
                <h3 className="text-[var(--text-small)] font-semibold">Resumo do Período</h3>
              </div>
              <div className="divide-y divide-[var(--border-1)]">
                {[
                  { label: 'Total Recebido', value: formatCurrency(summary?.totalReceived ?? 0), color: 'text-teal' },
                  { label: 'Custo Total', value: formatCurrency(summary?.totalCost ?? 0) },
                  { label: 'Yield on Cost', value: `${(summary?.overallYoC ?? 0).toFixed(2)}%`, color: 'text-[var(--accent-1)]' },
                  { label: 'Yield Atual', value: `${(summary?.overallYield ?? 0).toFixed(2)}%` },
                ].map((stat) => (
                  <div key={stat.label} className="flex items-center justify-between px-4 py-3">
                    <span className="text-[var(--text-small)] text-[var(--text-2)]">{stat.label}</span>
                    <span className={cn('font-mono text-[var(--text-small)] font-medium', stat.color)}>{stat.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Payers with bar visualization */}
            <div className="bg-[var(--surface-1)] border border-[var(--border-1)] rounded-[var(--radius)] shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-[var(--border-1)]">
                <h3 className="text-[var(--text-small)] font-semibold">Top Pagadores</h3>
              </div>
              <div className="divide-y divide-[var(--border-1)]">
                {summary?.byAsset.slice(0, 6).map((asset, index) => {
                  const maxReceived = summary.byAsset[0]?.dividendsReceived ?? 1
                  const pct = (asset.dividendsReceived / maxReceived) * 100
                  return (
                    <Link
                      key={asset.ticker}
                      href={`/ativo/${asset.ticker}`}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-[var(--surface-2)] transition-colors"
                    >
                      <span className="text-[var(--text-caption)] text-[var(--text-2)] w-4 font-mono">{index + 1}</span>
                      <AssetLogo ticker={asset.ticker} size={24} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-[var(--text-small)]">{asset.ticker}</span>
                          <span className="font-mono text-[var(--text-small)] font-bold text-teal">{formatCurrency(asset.dividendsReceived)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-[var(--bg)] rounded-full overflow-hidden">
                            <div className="h-full bg-teal/70 rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-[var(--text-caption)] text-[var(--text-2)] font-mono shrink-0">YoC {asset.yieldOnCost.toFixed(1)}%</span>
                        </div>
                      </div>
                    </Link>
                  )
                })}
                {(!summary?.byAsset || summary.byAsset.length === 0) && (
                  <div className="p-6 text-center text-[var(--text-small)] text-[var(--text-2)]">Nenhum dividendo no período</div>
                )}
              </div>
            </div>
          </div>

          {/* DY Contribution Chart */}
          {summary?.byAsset && summary.byAsset.length > 0 && (
            <div className="bg-[var(--surface-1)] border border-[var(--border-1)] rounded-[var(--radius)] shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-[var(--border-1)]">
                <h2 className="text-[var(--text-small)] font-semibold">Contribuição por Ativo</h2>
                <p className="text-[var(--text-small)] text-[var(--text-2)]">Dividendos recebidos por ativo no período</p>
              </div>
              <div className="px-2 py-3">
                <ResponsiveContainer width="100%" height={Math.max(180, summary.byAsset.length * 36)}>
                  <BarChart data={summary.byAsset.slice(0, 10)} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-1)" opacity={0.2} horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--text-2)' }} axisLine={false} tickLine={false} tickFormatter={(v) => formatCurrency(v)} />
                    <YAxis type="category" dataKey="ticker" tick={{ fontSize: 13, fill: 'var(--text-1)', fontWeight: 600 }} axisLine={false} tickLine={false} width={60} />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'var(--surface-1)', border: '1px solid var(--border-1)', borderRadius: '8px', fontSize: '13px' }}
                      formatter={(value: number) => [formatCurrency(value), 'Recebido']}
                    />
                    <Bar dataKey="dividendsReceived" fill="#0D9488" radius={[0, 4, 4, 0]} opacity={0.85} />
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
          <div className="flex items-center gap-6 px-4 py-3 bg-[var(--surface-1)] border border-[var(--border-1)] rounded-[var(--radius)] shadow-sm">
            <div>
              <span className="text-[var(--text-small)] text-[var(--text-2)]">Total 12 meses</span>
              <p className="text-[var(--text-heading)] font-bold font-mono text-teal">{formatCurrency(projections?.totalProjected ?? 0)}</p>
            </div>
            <div className="w-px h-8 bg-[var(--border-1)]" />
            <div>
              <span className="text-[var(--text-small)] text-[var(--text-2)]">Média/mês</span>
              <p className="text-[var(--text-heading)] font-bold font-mono">{formatCurrency(projections?.monthlyAverage ?? 0)}</p>
            </div>
          </div>

          {/* Projections Chart — Recharts AreaChart */}
          <div className="bg-[var(--surface-1)] border border-[var(--border-1)] rounded-[var(--radius)] shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-[var(--border-1)]">
              <h3 className="text-[var(--text-small)] font-semibold">Projeção Mensal</h3>
              <p className="text-[var(--text-small)] text-[var(--text-2)]">Estimativa de dividendos nos próximos 12 meses</p>
            </div>
            <div className="px-2 py-3">
              {projections?.projections ? (
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart
                    data={projections.projections.map(m => ({
                      month: new Date(m.date).toLocaleDateString('pt-BR', { month: 'short' }),
                      valor: m.projected,
                    }))}
                    margin={{ top: 5, right: 10, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="projGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#0D9488" stopOpacity={0.25} />
                        <stop offset="100%" stopColor="#0D9488" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-1)" opacity={0.3} />
                    <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'var(--text-2)' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: 'var(--text-2)' }} axisLine={false} tickLine={false} tickFormatter={(v) => formatCurrency(v)} width={70} />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'var(--surface-1)', border: '1px solid var(--border-1)', borderRadius: '8px', fontSize: '13px' }}
                      formatter={(value: number) => [formatCurrency(value), 'Projetado']}
                    />
                    <Area type="monotone" dataKey="valor" stroke="#0D9488" strokeWidth={2} fill="url(#projGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[220px] flex items-center justify-center text-[var(--text-small)] text-[var(--text-2)]">
                  Carregando projeções...
                </div>
              )}
            </div>
          </div>

          {/* Projections by asset breakdown */}
          {projections?.projections && projections.projections.length > 0 && (
            <div className="bg-[var(--surface-1)] border border-[var(--border-1)] rounded-[var(--radius)] shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-[var(--border-1)]">
                <h3 className="text-[var(--text-small)] font-semibold">Detalhamento Mensal</h3>
              </div>
              <div className="overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                <table className="w-full text-[var(--text-small)]">
                  <thead>
                    <tr className="bg-[var(--surface-2)] border-b border-[var(--border-1)]">
                      <th className="text-left px-4 py-3 text-[var(--text-caption)] font-medium text-[var(--text-2)] uppercase tracking-wider">Mês</th>
                      <th className="px-4 py-3 text-[var(--text-caption)] font-medium text-[var(--text-2)] uppercase tracking-wider" />
                      <th className="text-right px-4 py-3 text-[var(--text-caption)] font-medium text-[var(--text-2)] uppercase tracking-wider">Valor Projetado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-1)]/50">
                    {projections.projections.map((month) => {
                      const maxVal = Math.max(...projections.projections.map(m => m.projected), 1)
                      const pct = (month.projected / maxVal) * 100
                      return (
                        <tr key={month.month} className="hover:bg-[var(--surface-2)] transition-colors">
                          <td className="px-4 py-3 font-mono text-[var(--text-small)]">
                            {new Date(month.date).toLocaleDateString('pt-BR', { month: 'long', year: '2-digit' })}
                          </td>
                          <td className="px-4 py-3 w-1/3">
                            <div className="h-2 bg-[var(--surface-2)] rounded-full overflow-hidden">
                              <div className="h-full bg-teal rounded-full" style={{ width: `${Math.min(pct, 100)}%` }} />
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-[var(--text-small)] font-medium">{formatCurrency(month.projected)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Passive Income Projection Tab */}
      {activeTab === 'projections' && projections && (
        <PassiveIncomeSection
          monthlyAverage={projections.monthlyAverage}
          totalProjected={projections.totalProjected}
        />
      )}

      {/* Simulator Tab */}
      {activeTab === 'simulator' && (
        <div className="space-y-4">
          <div className="bg-[var(--surface-1)] border border-[var(--border-1)] rounded-[var(--radius)] shadow-sm p-5">
            <h3 className="text-[var(--text-small)] font-semibold mb-1">Simulador de Dividendos</h3>
            <p className="text-[var(--text-small)] text-[var(--text-2)] mb-4">Simule quanto você receberia investindo em diferentes ativos</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {simulatorTickers.map((ticker, index) => (
                <div key={index} className="space-y-2 p-3 rounded-lg border border-[var(--border-1)]">
                  <div>
                    <label className="block text-[var(--text-small)] text-[var(--text-2)] mb-1">Ticker {index + 1}</label>
                    <Input
                      value={ticker}
                      onChange={(e) => {
                        const newTickers = [...simulatorTickers]
                        newTickers[index] = e.target.value.toUpperCase()
                        setSimulatorTickers(newTickers)
                      }}
                      placeholder="PETR4"
                      className="font-mono text-[var(--text-small)]"
                    />
                  </div>
                  <div>
                    <label className="block text-[var(--text-small)] text-[var(--text-2)] mb-1">Valor (R$)</label>
                    <Input
                      type="number"
                      value={simulatorAmounts[index]}
                      onChange={(e) => {
                        const newAmounts = [...simulatorAmounts]
                        newAmounts[index] = e.target.value
                        setSimulatorAmounts(newAmounts)
                      }}
                      placeholder="10000"
                      className="font-mono text-[var(--text-small)]"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {simulation && (
            <div className="space-y-4">
              {/* Simulation KPIs */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-[var(--surface-1)] border border-[var(--border-1)] rounded-[var(--radius)] shadow-sm p-4 text-center">
                  <span className="text-[var(--text-small)] text-[var(--text-2)]">Dividendo Anual</span>
                  <p className="text-[var(--text-heading)] font-bold font-mono mt-1 text-teal">{formatCurrency(simulation.totals.annualDividend)}</p>
                </div>
                <div className="bg-[var(--surface-1)] border border-[var(--border-1)] rounded-[var(--radius)] shadow-sm p-4 text-center">
                  <span className="text-[var(--text-small)] text-[var(--text-2)]">Dividendo Mensal</span>
                  <p className="text-[var(--text-heading)] font-bold font-mono mt-1">{formatCurrency(simulation.totals.monthlyDividend)}</p>
                </div>
                <div className="bg-[var(--surface-1)] border border-[var(--border-1)] rounded-[var(--radius)] shadow-sm p-4 text-center">
                  <span className="text-[var(--text-small)] text-[var(--text-2)]">Yield Médio</span>
                  <p className="text-[var(--text-heading)] font-bold font-mono mt-1 text-[var(--accent-1)]">{simulation.totals.avgYield.toFixed(2)}%</p>
                </div>
              </div>

              {/* Results — cards instead of wide table */}
              <div className="grid lg:grid-cols-3 gap-4">
                {simulation.results.filter(r => r.found).map((result) => (
                  <Link
                    key={result.ticker}
                    href={`/ativo/${result.ticker}`}
                    className="bg-[var(--surface-1)] border border-[var(--border-1)] rounded-[var(--radius)] shadow-sm p-4 hover:border-[var(--accent-1)]/30 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 mb-3">
                      <AssetLogo ticker={result.ticker} size={28} />
                      <div>
                        <p className="text-[var(--text-small)] font-semibold">{result.ticker}</p>
                        <p className="text-[var(--text-caption)] text-[var(--text-2)] truncate">{result.name}</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-[var(--text-small)]">
                        <span className="text-[var(--text-2)]">Cotas</span>
                        <span className="font-mono font-medium">{result.shares}</span>
                      </div>
                      <div className="flex justify-between text-[var(--text-small)]">
                        <span className="text-[var(--text-2)]">Preço</span>
                        <span className="font-mono">{formatCurrency(result.currentPrice)}</span>
                      </div>
                      <div className="flex justify-between text-[var(--text-small)]">
                        <span className="text-[var(--text-2)]">DY</span>
                        <span className="font-mono font-bold text-[var(--accent-1)]">{result.dividendYield.toFixed(2)}%</span>
                      </div>
                      <div className="h-px bg-[var(--border-1)]/30 my-1" />
                      <div className="flex justify-between text-[var(--text-small)]">
                        <span className="text-[var(--text-2)]">Anual</span>
                        <span className="font-mono font-bold text-teal">{formatCurrency(result.annualDividend)}</span>
                      </div>
                      <div className="flex justify-between text-[var(--text-small)]">
                        <span className="text-[var(--text-2)]">Mensal</span>
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

// ─── Projeção de Renda Passiva com Reinvestimento ──────────────
function PassiveIncomeSection({ monthlyAverage, totalProjected }: { monthlyAverage: number; totalProjected: number }) {
  const [targetMonthly, setTargetMonthly] = useState('5000')
  const [avgDY, setAvgDY] = useState('6')
  const [years, setYears] = useState(10)

  const target = parseFloat(targetMonthly) || 5000
  const dy = parseFloat(avgDY) || 6

  // Quanto precisa investir para atingir a meta
  const neededInvestment = target > 0 && dy > 0 ? (target * 12) / (dy / 100) : 0

  // Projeção com reinvestimento compound (DY reinvestido)
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
      // Sem reinvestimento: apenas patrimônio original (cresce pela valorização, ~8% ao ano simplificado)
      withoutReinv = withoutReinv * 1.08
    }
    return data
  }, [totalProjected, dy, years])

  const finalMonthlyIncome = compoundData[compoundData.length - 1]?.rendaMensal ?? 0

  return (
    <div className="space-y-4">
      <div className="bg-[var(--surface-1)] border border-[var(--border-1)] rounded-[var(--radius)] shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-[var(--border-1)]">
          <h3 className="text-[var(--text-small)] font-semibold">Projeção de Renda Passiva</h3>
          <p className="text-[var(--text-small)] text-[var(--text-2)]">Evolução do patrimônio com reinvestimento de dividendos</p>
        </div>

        {/* Controles */}
        <div className="px-4 py-3 border-b border-[var(--border-1)] bg-[var(--surface-2)]/30">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-[var(--text-caption)] text-[var(--text-2)]">DY médio:</label>
              <Input
                type="number"
                value={avgDY}
                onChange={(e) => setAvgDY(e.target.value)}
                className="w-20 font-mono text-[var(--text-small)]"
              />
              <span className="text-[var(--text-caption)] text-[var(--text-2)]">%</span>
            </div>
            <div className="flex items-center gap-2">
              {[5, 10, 15, 20].map(y => (
                <button
                  key={y}
                  onClick={() => setYears(y)}
                  className={cn(
                    'px-2.5 py-1 text-[var(--text-caption)] font-medium rounded-md transition-all',
                    years === y
                      ? 'bg-[var(--accent-1)] text-white'
                      : 'bg-[var(--surface-2)] text-[var(--text-2)] hover:text-[var(--text-1)]'
                  )}
                >
                  {y}a
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Gráfico */}
        <div className="px-2 py-3">
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={compoundData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="compoundGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0D9488" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#0D9488" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-1)" opacity={0.3} />
              <XAxis dataKey="year" tick={{ fontSize: 12, fill: 'var(--text-2)' }} axisLine={false} tickLine={false} tickFormatter={(v) => `Ano ${v}`} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--text-2)' }} axisLine={false} tickLine={false} tickFormatter={(v) => v >= 1000000 ? `R$ ${(v / 1000000).toFixed(1)}M` : v >= 1000 ? `R$ ${(v / 1000).toFixed(0)}k` : `R$ ${v.toFixed(0)}`} width={70} />
              <Tooltip
                contentStyle={{ backgroundColor: 'var(--surface-1)', border: '1px solid var(--border-1)', borderRadius: '8px', fontSize: '13px' }}
                formatter={(value: number, name: string) => {
                  const labels: Record<string, string> = { comReinv: 'Com Reinvestimento', semReinv: 'Sem Reinvestimento' }
                  return [formatCurrency(value), labels[name] ?? name]
                }}
                labelFormatter={(label) => `Ano ${label}`}
              />
              <Area type="monotone" dataKey="comReinv" stroke="#0D9488" strokeWidth={2} fill="url(#compoundGrad)" name="comReinv" />
              <Area type="monotone" dataKey="semReinv" stroke="#6366F1" strokeWidth={1.5} strokeDasharray="5 5" fill="none" name="semReinv" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* KPIs de resultado */}
        <div className="grid grid-cols-3 border-t border-[var(--border-1)] divide-x divide-[var(--border-1)]">
          <div className="p-3 text-center">
            <p className="text-[var(--text-caption)] text-[var(--text-2)]">Renda Mensal Atual</p>
            <p className="text-[var(--text-body)] font-bold font-mono text-teal">{formatCurrency(monthlyAverage)}</p>
          </div>
          <div className="p-3 text-center">
            <p className="text-[var(--text-caption)] text-[var(--text-2)]">Renda em {years} anos</p>
            <p className="text-[var(--text-body)] font-bold font-mono text-[var(--pos)]">{formatCurrency(finalMonthlyIncome)}</p>
          </div>
          <div className="p-3 text-center">
            <p className="text-[var(--text-caption)] text-[var(--text-2)]">Crescimento</p>
            <p className="text-[var(--text-body)] font-bold font-mono text-[var(--accent-1)]">
              {monthlyAverage > 0 ? `${((finalMonthlyIncome / monthlyAverage - 1) * 100).toFixed(0)}%` : '—'}
            </p>
          </div>
        </div>
      </div>

      {/* Calculadora de meta */}
      <div className="bg-[var(--surface-1)] border border-[var(--border-1)] rounded-[var(--radius)] shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-[var(--border-1)]">
          <h3 className="text-[var(--text-small)] font-semibold">Meta de Renda Passiva</h3>
          <p className="text-[var(--text-small)] text-[var(--text-2)]">Quanto você precisa investir para atingir sua meta mensal</p>
        </div>
        <div className="p-4">
          <div className="flex flex-wrap items-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <label className="text-[var(--text-small)] text-[var(--text-2)]">Meta mensal:</label>
              <div className="flex items-center">
                <span className="text-[var(--text-small)] text-[var(--text-2)] mr-1">R$</span>
                <Input
                  type="number"
                  value={targetMonthly}
                  onChange={(e) => setTargetMonthly(e.target.value)}
                  className="w-28 font-mono text-[var(--text-small)]"
                />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-6 p-4 bg-[var(--surface-2)] rounded-lg">
            <div>
              <p className="text-[var(--text-caption)] text-[var(--text-2)]">Para receber</p>
              <p className="text-[var(--text-heading)] font-bold font-mono text-teal">{formatCurrency(target)}/mês</p>
            </div>
            <div className="text-[var(--text-heading)] text-[var(--text-3)]">=</div>
            <div>
              <p className="text-[var(--text-caption)] text-[var(--text-2)]">Patrimônio necessário</p>
              <p className="text-[var(--text-heading)] font-bold font-mono">{formatCurrency(neededInvestment)}</p>
            </div>
            <div className="text-[var(--text-caption)] text-[var(--text-2)]">com DY de {dy}%</div>
          </div>
        </div>
      </div>

      {/* ─── Tab: Radar DY ───────────────────────────────────── */}
      {activeTab === 'radar' && (
        <DividendRadarTab />
      )}
    </div>
  )
}

// ─── Dividend Radar Tab ─────────────────────────────────────
function DividendRadarTab() {
  const { data: screenerData, isLoading } = trpc.screener.query.useQuery({
    sortBy: 'scoreDividends',
    sortOrder: 'desc',
    page: 1,
    pageSize: 15,
    minDividendYield: 4,
  })

  if (isLoading) {
    return (
      <div className="space-y-3 animate-pulse">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-14 bg-[var(--surface-2)] rounded-[var(--radius)]" />
        ))}
      </div>
    )
  }

  const assets = screenerData?.assets ?? []

  return (
    <div className="space-y-4">
      <div className="bg-[var(--surface-1)] border border-[var(--border-1)] rounded-[var(--radius)] p-4">
        <h3 className="text-[var(--text-small)] font-semibold mb-1">Radar de Dividendos</h3>
        <p className="text-[var(--text-caption)] text-[var(--text-2)] mb-4">
          Top acoes por score de dividendos com DY projetado acima de 4%. Ordenado por qualidade do dividendo.
        </p>

        {assets.length === 0 ? (
          <p className="text-[var(--text-small)] text-[var(--text-3)] text-center py-8">Nenhum ativo qualificado no momento</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[var(--text-small)]">
              <thead>
                <tr className="border-b border-[var(--border-1)] text-[var(--text-caption)] text-[var(--text-3)]">
                  <th className="text-left py-2.5 px-3 font-medium">Ativo</th>
                  <th className="text-left py-2.5 px-2 font-medium">Setor</th>
                  <th className="text-right py-2.5 px-2 font-medium">Preço</th>
                  <th className="text-right py-2.5 px-2 font-medium">IQ Score</th>
                  <th className="text-right py-2.5 px-2 font-medium">DY Proj</th>
                  <th className="text-right py-2.5 px-2 font-medium">Safety</th>
                  <th className="text-right py-2.5 px-3 font-medium">Margem</th>
                </tr>
              </thead>
              <tbody>
                {assets.map((asset: any) => {
                  const score = asset.aqScore ? Number(asset.aqScore.scoreTotal) : null
                  const dy = asset.aqScore?.dividendYieldProj ?? asset.fundamental?.dividendYield
                  const safety = asset.aqScore?.dividendSafety
                  const margin = asset.aqScore?.safetyMargin
                  const price = asset.latestQuote?.close

                  return (
                    <tr key={asset.ticker} className="border-b border-[var(--border-1)] last:border-0 hover:bg-[var(--surface-2)]/30">
                      <td className="py-2.5 px-3">
                        <Link href={`/ativo/${asset.ticker}`} className="flex items-center gap-2 hover:text-[var(--accent-1)]">
                          <AssetLogo ticker={asset.ticker} size={24} />
                          <div>
                            <span className="font-mono font-medium">{asset.ticker}</span>
                            <span className="block text-[10px] text-[var(--text-3)] truncate max-w-[100px]">{asset.name}</span>
                          </div>
                        </Link>
                      </td>
                      <td className="py-2.5 px-2 text-[var(--text-caption)] text-[var(--text-2)]">{asset.sector ?? '—'}</td>
                      <td className="py-2.5 px-2 text-right font-mono">{price ? `R$${Number(price).toFixed(2)}` : '—'}</td>
                      <td className="py-2.5 px-2 text-right">
                        {score != null && (
                          <span className={cn('font-mono font-bold', score >= 70 ? 'text-teal' : score >= 40 ? 'text-amber' : 'text-red')}>
                            {score.toFixed(0)}
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-2 text-right font-mono text-teal font-bold">
                        {dy != null ? `${Number(dy).toFixed(1)}%` : '—'}
                      </td>
                      <td className="py-2.5 px-2 text-right">
                        {safety != null && (
                          <span className={cn('font-mono font-bold', Number(safety) >= 70 ? 'text-teal' : Number(safety) >= 40 ? 'text-amber' : 'text-red')}>
                            {Number(safety).toFixed(0)}
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        {margin != null && (
                          <span className={cn('font-mono', Number(margin) > 0 ? 'text-teal' : 'text-red')}>
                            {Number(margin) > 0 ? '+' : ''}{Number(margin).toFixed(1)}%
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
