'use client'

import { useState, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { Button, Input, Disclaimer } from '@/components/ui'
import { ComparisonRadarChart } from '@/components/charts'
import { trpc } from '@/lib/trpc/provider'
import { formatCurrency, getScoreHex } from '@/lib/utils/formatters'
import { cn } from '@/lib/utils'
import { AssetLogo } from '@/components/ui/asset-logo'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip as RechartsTooltip, Legend, CartesianGrid } from 'recharts'

const MAX_ASSETS = 4
const COMPARISON_COLORS = ['#1A73E8', '#0D9488', '#D97706', '#EF4444']
const HISTORY_RANGES = [
  { label: '1M', range: '1mo' as const, interval: '1d' as const },
  { label: '3M', range: '3mo' as const, interval: '1d' as const },
]

export default function ComparisonPage() {
  const [selectedTickers, setSelectedTickers] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [historyRange, setHistoryRange] = useState(HISTORY_RANGES[1]!) // 3M default

  const { data: searchResults } = trpc.assets.search.useQuery(
    { query: searchQuery },
    { enabled: searchQuery.length >= 1 }
  )

  const { data: comparisonData, isLoading } = trpc.assets.getMultiple.useQuery(
    { tickers: selectedTickers },
    { enabled: selectedTickers.length > 0 }
  )

  // Backend score compare for deeper comparison data
  const { data: backendCompare } = trpc.backtest.scoreCompare.useQuery(
    { tickers: selectedTickers },
    { enabled: selectedTickers.length >= 2, staleTime: 10 * 60 * 1000 }
  )

  const addAsset = useCallback((ticker: string) => {
    if (selectedTickers.length < MAX_ASSETS && !selectedTickers.includes(ticker)) {
      setSelectedTickers([...selectedTickers, ticker])
    }
    setSearchQuery('')
    setIsSearching(false)
  }, [selectedTickers])

  const removeAsset = useCallback((ticker: string) => {
    setSelectedTickers(selectedTickers.filter(t => t !== ticker))
  }, [selectedTickers])

  const clearAll = useCallback(() => {
    setSelectedTickers([])
  }, [])

  const findBest = (values: (number | null)[], lowerIsBetter = false) => {
    const valid = values.map((v, i) => ({ v, i })).filter((x): x is { v: number; i: number } => x.v !== null)
    if (valid.length < 2) return -1
    valid.sort((a, b) => lowerIsBetter ? a.v - b.v : b.v - a.v)
    return valid[0]?.i ?? -1
  }

  // Detect cross-sector comparison
  const hasCrossSector = useMemo(() => {
    if (!comparisonData || comparisonData.length < 2) return false
    const sectors = new Set(comparisonData.map((a: any) => a.sector).filter(Boolean))
    return sectors.size > 1
  }, [comparisonData])

  // Historical price data — pad to 4 slots to keep hooks count stable
  const paddedTickers = useMemo(() => {
    const padded = [...selectedTickers]
    while (padded.length < MAX_ASSETS) padded.push('')
    return padded
  }, [selectedTickers])

  const hq0 = trpc.assets.getHistory.useQuery(
    { ticker: paddedTickers[0]!, range: historyRange.range, interval: historyRange.interval },
    { enabled: !!paddedTickers[0] && selectedTickers.length >= 2 }
  )
  const hq1 = trpc.assets.getHistory.useQuery(
    { ticker: paddedTickers[1]!, range: historyRange.range, interval: historyRange.interval },
    { enabled: !!paddedTickers[1] && selectedTickers.length >= 2 }
  )
  const hq2 = trpc.assets.getHistory.useQuery(
    { ticker: paddedTickers[2]!, range: historyRange.range, interval: historyRange.interval },
    { enabled: !!paddedTickers[2] && selectedTickers.length >= 2 }
  )
  const hq3 = trpc.assets.getHistory.useQuery(
    { ticker: paddedTickers[3]!, range: historyRange.range, interval: historyRange.interval },
    { enabled: !!paddedTickers[3] && selectedTickers.length >= 2 }
  )

  const historyQueries = useMemo(() => {
    return [hq0, hq1, hq2, hq3].slice(0, selectedTickers.length)
  }, [hq0, hq1, hq2, hq3, selectedTickers.length])

  // Normalize prices to base 100 for fair comparison
  const historyChartData = useMemo(() => {
    if (selectedTickers.length < 2) return []
    const allLoaded = historyQueries.every(q => q.data)
    if (!allLoaded) return []

    const seriesByTicker = selectedTickers.map((ticker, i) => {
      const data = historyQueries[i]?.data ?? []
      return { ticker, data }
    })

    const ref = seriesByTicker[0]
    if (!ref || ref.data.length === 0) return []

    return ref.data.map((point, dateIdx) => {
      const entry: Record<string, number | string> = {
        date: new Date(point.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        fullDate: new Date(point.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' }),
      }
      for (const series of seriesByTicker) {
        const basePrice = series.data[0]?.close
        const currentPoint = series.data[dateIdx]
        if (basePrice && currentPoint) {
          entry[series.ticker] = Number(((currentPoint.close / basePrice - 1) * 100).toFixed(2))
        }
      }
      return entry
    })
  }, [selectedTickers, historyQueries])

  const getGroupedMetrics = () => {
    if (!comparisonData) return []

    const val = (asset: any, key: string) => {
      const f = asset.latestFundamental
      if (!f) return null
      const v = f[key]
      return v != null ? Number(v) : null
    }

    return [
      {
        group: 'Valuation',
        metrics: [
          { label: 'P/L', values: comparisonData.map(a => val(a, 'peRatio')), format: (v: number) => v.toFixed(1), lowerIsBetter: true },
          { label: 'P/VP', values: comparisonData.map(a => val(a, 'pbRatio')), format: (v: number) => v.toFixed(2), lowerIsBetter: true },
          { label: 'EV/EBITDA', values: comparisonData.map(a => val(a, 'evEbitda')), format: (v: number) => v.toFixed(1), lowerIsBetter: true },
          { label: 'P/Receita', values: comparisonData.map(a => val(a, 'psr')), format: (v: number) => v.toFixed(2), lowerIsBetter: true },
        ],
      },
      {
        group: 'Rentabilidade',
        metrics: [
          { label: 'ROE', values: comparisonData.map(a => val(a, 'roe')), format: (v: number) => `${v.toFixed(1)}%`, lowerIsBetter: false },
          { label: 'ROIC', values: comparisonData.map(a => val(a, 'roic')), format: (v: number) => `${v.toFixed(1)}%`, lowerIsBetter: false },
          { label: 'Mrg. Líquida', values: comparisonData.map(a => {
            const ml = val(a, 'margemLiquida') ?? val(a, 'netMargin')
            return ml
          }), format: (v: number) => `${v.toFixed(1)}%`, lowerIsBetter: false },
          { label: 'Mrg. EBIT', values: comparisonData.map(a => {
            const me = val(a, 'margemEbit') ?? val(a, 'ebitdaMargin')
            return me
          }), format: (v: number) => `${v.toFixed(1)}%`, lowerIsBetter: false },
        ],
      },
      {
        group: 'Dividendos',
        metrics: [
          { label: 'Div. Yield', values: comparisonData.map(a => val(a, 'dividendYield')), format: (v: number) => `${v.toFixed(1)}%`, lowerIsBetter: false },
          { label: 'Payout', values: comparisonData.map(a => val(a, 'payout')), format: (v: number) => `${v.toFixed(0)}%`, lowerIsBetter: false },
        ],
      },
      {
        group: 'Performance',
        metrics: [
          { label: 'Variação Dia', values: comparisonData.map((a: any) => a.latestQuote?.changePercent != null ? Number(a.latestQuote.changePercent) : null), format: (v: number) => `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`, lowerIsBetter: false },
          { label: 'Cresc. Receita 5a', values: comparisonData.map(a => val(a, 'crescimentoReceita5a')), format: (v: number) => `${v.toFixed(1)}%`, lowerIsBetter: false },
          { label: 'Cresc. Lucro 5a', values: comparisonData.map(a => val(a, 'crescLucro5a')), format: (v: number) => `${v.toFixed(1)}%`, lowerIsBetter: false },
          { label: 'Máx. 52 sem.', values: comparisonData.map(a => val(a, 'fiftyTwoWeekHigh')), format: (v: number) => `R$${v.toFixed(2)}`, lowerIsBetter: false },
          { label: 'Mín. 52 sem.', values: comparisonData.map(a => val(a, 'fiftyTwoWeekLow')), format: (v: number) => `R$${v.toFixed(2)}`, lowerIsBetter: false },
        ],
      },
      {
        group: 'Solidez',
        metrics: [
          { label: 'Liq. Corrente', values: comparisonData.map(a => val(a, 'liquidezCorrente')), format: (v: number) => v.toFixed(2), lowerIsBetter: false },
          { label: 'Dív.Brut/Patrim', values: comparisonData.map(a => val(a, 'divBrutPatrim')), format: (v: number) => v.toFixed(2), lowerIsBetter: true },
          { label: 'Dív.Líq/EBITDA', values: comparisonData.map(a => val(a, 'netDebtEbitda')), format: (v: number) => v.toFixed(2), lowerIsBetter: true },
        ],
      },
    ]
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-[var(--text-title)] font-bold tracking-tight">Comparar Ativos</h1>
          <p className="text-[var(--text-small)] text-[var(--text-2)] mt-0.5">Até 4 ativos lado a lado</p>
        </div>
        {selectedTickers.length > 0 && (
          <Button variant="ghost" size="sm" onClick={clearAll}>
            Limpar tudo
          </Button>
        )}
      </div>

      {/* Asset Selector */}
      <div className="flex flex-wrap items-center gap-3 p-4 border border-[var(--border-1)] rounded-[var(--radius)] shadow-sm bg-[var(--surface-1)] overflow-visible relative">
        {selectedTickers.map((ticker, index) => {
          const assetData = comparisonData?.find((a: any) => a.ticker === ticker)
          return (
          <div
            key={ticker}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--surface-2)]"
            style={{ borderLeft: `4px solid ${COMPARISON_COLORS[index]}` }}
          >
            <AssetLogo ticker={ticker} logo={assetData?.logo} size={22} />
            <span className="font-mono font-medium text-[var(--text-small)]">{ticker}</span>
            <button
              onClick={() => removeAsset(ticker)}
              className="p-0.5 rounded hover:bg-[var(--border-1)] transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
          )
        })}

        {selectedTickers.length < MAX_ASSETS && (
          <div className="relative">
            <Input
              type="text"
              placeholder="+ Adicionar ativo"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setIsSearching(true) }}
              onFocus={() => setIsSearching(true)}
              className="w-full sm:w-44 text-[var(--text-small)]"
            />
            {isSearching && searchResults && searchResults.length > 0 && (
              <div className="absolute top-full left-0 mt-1 w-full sm:w-64 bg-[var(--surface-1)] border border-[var(--border-1)] rounded-lg shadow-[var(--shadow-overlay)] z-50 max-h-60 overflow-y-auto">
                {searchResults.filter((a: any) => !selectedTickers.includes(a.ticker)).map((asset: any) => (
                  <button
                    key={asset.id}
                    onClick={() => addAsset(asset.ticker)}
                    className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-[var(--surface-2)] transition-colors text-left text-[var(--text-small)]"
                  >
                    <AssetLogo ticker={asset.ticker} logo={asset.logo} size={22} />
                    <span className="font-mono font-medium">{asset.ticker}</span>
                    <span className="text-[var(--text-caption)] text-[var(--text-2)] truncate">{asset.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {Array.from({ length: Math.max(0, MAX_ASSETS - selectedTickers.length - 1) }).map((_, i) => (
          <div key={`empty-${i}`} className="hidden sm:block px-3 py-2 rounded-lg border-2 border-dashed border-[var(--border-1)] text-[var(--text-2)] text-[var(--text-caption)]">
            + Adicionar
          </div>
        ))}
      </div>

      {/* Cross-sector warning */}
      {hasCrossSector && (
        <div className="flex items-center gap-2 px-4 py-3 bg-amber-500/5 border border-amber-500/20 rounded-[var(--radius)] text-[var(--text-small)]">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-400 flex-shrink-0">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span className="text-amber-300/90">
            Comparando ações de setores diferentes. Os pesos do Invscore variam por setor.
          </span>
        </div>
      )}

      {/* Empty State */}
      {selectedTickers.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-[var(--border-1)] rounded-[var(--radius)]">
          <div className="w-16 h-16 rounded-full bg-[var(--surface-2)] flex items-center justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--text-2)]">
              <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
            </svg>
          </div>
          <h3 className="text-[var(--text-subheading)] font-semibold mb-1">Selecione ativos para comparar</h3>
          <p className="text-[var(--text-small)] text-[var(--text-2)] max-w-md">
            Use a barra acima para adicionar até 4 ativos e comparar indicadores.
          </p>
        </div>
      )}

      {/* Comparison Content */}
      {comparisonData && comparisonData.length > 0 && (
        <>
          {/* Score Cards */}
          {/* Grade de cartões de score — responsivo para mobile */}
          <div className={cn(
            "grid gap-4",
            comparisonData.length <= 2 && "grid-cols-1 sm:grid-cols-2 max-w-2xl",
            comparisonData.length === 3 && "grid-cols-1 sm:grid-cols-2 md:grid-cols-3",
            comparisonData.length === 4 && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
          )}>
            {comparisonData.map((asset: any, index: number) => {
              const score = asset.aqScore ? Number(asset.aqScore.scoreTotal) : null
              const scoreColor = score !== null ? getScoreHex(score) : 'var(--border-1)'
              return (
                <div
                  key={asset.ticker}
                  className="relative overflow-hidden border border-[var(--border-1)] rounded-[var(--radius)] shadow-sm bg-[var(--surface-1)] p-5"
                >
                  <div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: COMPARISON_COLORS[index] }} />
                  <Link href={`/ativo/${asset.ticker}`} className="block group">
                    <div className="flex items-center gap-2.5 mb-3">
                      <AssetLogo ticker={asset.ticker} logo={asset.logo} size={28} />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: COMPARISON_COLORS[index] }} />
                          <span className="font-mono font-medium text-[var(--text-base)] group-hover:text-[var(--accent-1)] transition-colors">{asset.ticker}</span>
                        </div>
                        <span className="text-[var(--text-caption)] text-[var(--text-2)] truncate block">{asset.name}</span>
                      </div>
                    </div>
                  </Link>
                  <div className="flex items-center gap-3">
                    <span className="text-[var(--text-display)] font-bold font-mono" style={{ color: scoreColor }}>
                      {score !== null ? score.toFixed(0) : <span className="text-[var(--text-3)]">n/d</span>}
                    </span>
                    {score !== null && (
                      <div className="flex-1 h-2 bg-[var(--surface-2)] rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${score}%`, backgroundColor: scoreColor }} />
                      </div>
                    )}
                  </div>
                  <div className="mt-2.5 flex items-center gap-3 text-[var(--text-caption)] text-[var(--text-2)]">
                    <span className="font-mono">{asset.latestQuote ? formatCurrency(Number(asset.latestQuote.close)) : <span className="text-[var(--text-3)]">n/d</span>}</span>
                    <span>{asset.sector ?? <span className="text-[var(--text-3)]">n/d</span>}</span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Pillar Comparison — Horizontal Bars (primary) */}
          {comparisonData.some((a: any) => a.aqScore) && (
            <div>
              <h2 className="text-[var(--text-caption)] font-semibold text-[var(--text-3)] uppercase tracking-wider mb-3">Pilares Invscore</h2>
              <div className="border border-[var(--border-1)] rounded-[var(--radius)] shadow-sm bg-[var(--surface-1)] p-5">
                <div className="space-y-5">
                  {[
                    { label: 'Valuation', key: 'scoreValuation' },
                    { label: 'Qualidade', key: 'scoreQuality' },
                    { label: 'Risco', key: 'scoreRisk' },
                    { label: 'Dividendos', key: 'scoreDividends' },
                    { label: 'Crescimento', key: 'scoreGrowth' },
                  ].map(({ label, key }) => {
                    const values = comparisonData.map((a: any) => a.aqScore ? Number(a.aqScore[key as keyof typeof a.aqScore]) : 0)
                    const bestIdx = findBest(values)
                    return (
                      <div key={label}>
                        <span className="text-[var(--text-caption)] font-medium text-[var(--text-2)]">{label}</span>
                        <div className="space-y-1.5 mt-1.5">
                          {comparisonData.map((asset: any, index: number) => {
                            const value = values[index] ?? 0
                            return (
                              <div key={asset.ticker} className="flex items-center gap-2">
                                <span className="w-14 text-[var(--text-caption)] font-mono font-medium text-[var(--text-2)] truncate">{asset.ticker}</span>
                                <div className="flex-1 max-w-md h-3 bg-[var(--surface-2)] rounded-full overflow-hidden">
                                  <div
                                    className="h-full rounded-full transition-all duration-500"
                                    style={{ width: `${value}%`, backgroundColor: COMPARISON_COLORS[index] ?? '#888' }}
                                  />
                                </div>
                                <span className={cn(
                                  'w-8 text-right text-[var(--text-caption)] font-mono',
                                  bestIdx === index ? 'text-[var(--pos)] font-bold' : ''
                                )}>
                                  {value.toFixed(0)}
                                </span>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Radar Overlay (secundário — visão complementar) */}
          {comparisonData.some((a: any) => a.aqScore) && comparisonData.length >= 2 && (
            <div>
              <h2 className="text-[var(--text-caption)] font-semibold text-[var(--text-3)] uppercase tracking-wider mb-3">Radar de Pilares</h2>
              <div>
                <div className="border border-[var(--border-1)] rounded-[var(--radius)] shadow-sm bg-[var(--surface-1)] p-4 max-w-lg">
                  <ComparisonRadarChart
                    datasets={comparisonData.filter((a: any) => a.aqScore).map((a: any, i: number) => ({
                      ticker: a.ticker,
                      color: COMPARISON_COLORS[i] ?? '#888',
                      valuation: Number(a.aqScore!.scoreValuation),
                      quality: Number(a.aqScore!.scoreQuality),
                      growth: Number(a.aqScore!.scoreGrowth),
                      dividends: Number(a.aqScore!.scoreDividends),
                      risk: Number(a.aqScore!.scoreRisk),
                    }))}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Performance Histórica Comparada */}
          {selectedTickers.length >= 2 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-[var(--text-caption)] font-semibold text-[var(--text-3)] uppercase tracking-wider">Performance Comparada</h2>
                <div className="flex gap-1">
                  {HISTORY_RANGES.map(r => (
                    <button
                      key={r.label}
                      onClick={() => setHistoryRange(r)}
                      className={cn(
                        'px-2.5 py-1 text-[var(--text-caption)] font-medium rounded transition-colors',
                        historyRange.label === r.label
                          ? 'bg-[var(--accent-1)] text-white'
                          : 'text-[var(--text-2)] hover:bg-[var(--surface-2)]'
                      )}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="border border-[var(--border-1)] rounded-[var(--radius)] shadow-sm bg-[var(--surface-1)] p-4">
                {historyChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={historyChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-1)" opacity={0.15} />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 11, fill: 'var(--text-3)' }}
                        tickLine={false}
                        axisLine={false}
                        interval="preserveStartEnd"
                        minTickGap={40}
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: 'var(--text-3)' }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(v: number) => `${v > 0 ? '+' : ''}${v}%`}
                        width={55}
                      />
                      <RechartsTooltip
                        contentStyle={{
                          backgroundColor: 'var(--surface-2)',
                          border: '1px solid var(--border-1)',
                          borderRadius: 8,
                          fontSize: 12,
                        }}
                        labelFormatter={(label: string, payload: any[]) => payload?.[0]?.payload?.fullDate ?? label}
                        formatter={(value: number, name: string) => [`${value > 0 ? '+' : ''}${value.toFixed(2)}%`, name]}
                      />
                      <Legend
                        wrapperStyle={{ fontSize: 12 }}
                        formatter={(value: string) => <span className="font-mono text-[var(--text-1)]">{value}</span>}
                      />
                      {/* Zero line */}
                      <Line
                        type="monotone"
                        dataKey={() => 0}
                        stroke="var(--text-3)"
                        strokeDasharray="4 4"
                        strokeWidth={1}
                        dot={false}
                        name=""
                        legendType="none"
                      />
                      {selectedTickers.map((ticker, i) => (
                        <Line
                          key={ticker}
                          type="monotone"
                          dataKey={ticker}
                          stroke={COMPARISON_COLORS[i]}
                          strokeWidth={2}
                          dot={false}
                          name={ticker}
                          connectNulls
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-[var(--text-small)] text-[var(--text-3)]">
                    {historyQueries.some(q => q.isLoading)
                      ? 'Carregando dados históricos...'
                      : 'Dados históricos indisponíveis'
                    }
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Grouped Indicators Table */}
          {getGroupedMetrics().map(({ group, metrics }) => {
            const hasAnyData = metrics.some(m => m.values.some(v => v !== null && v !== 0))
            if (!hasAnyData) return null
            return (
              <div key={group}>
                <h2 className="text-[var(--text-small)] font-semibold text-[var(--text-2)] mb-3">{group}</h2>
                <div className="overflow-x-auto [mask-image:linear-gradient(to_right,transparent,black_8px,black_calc(100%-8px),transparent)]">
                  <table className="w-full text-[var(--text-small)]" aria-label="Comparação de indicadores financeiros">
                    <thead>
                      <tr className="border-b border-[var(--border-1)]">
                        <th scope="col" className="pb-2 text-left text-[var(--text-caption)] font-medium text-[var(--text-2)] w-24 sm:w-32">Indicador</th>
                        {comparisonData.map((a: any, i: number) => (
                          <th key={a.ticker} scope="col" className="pb-2 text-center text-[var(--text-small)] font-semibold">
                            <div className="flex items-center justify-center gap-1.5">
                              <AssetLogo ticker={a.ticker} logo={a.logo} size={18} />
                              <span className="font-mono font-medium" style={{ color: COMPARISON_COLORS[i] }}>{a.ticker}</span>
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {metrics.map((metric) => {
                        const bestIdx = findBest(metric.values, metric.lowerIsBetter)
                        return (
                          <tr key={metric.label} className="border-b border-[var(--border-1)] last:border-0">
                            <td className="py-3 text-[var(--text-small)] text-[var(--text-2)]">{metric.label}</td>
                            {metric.values.map((v, i) => (
                              <td key={i} className={cn(
                                'py-3 text-center font-mono text-[var(--text-small)]',
                                bestIdx === i && v !== null ? 'text-[var(--pos)] font-bold' : ''
                              )}>
                                {v !== null && v !== 0
                                  ? metric.format(v)
                                  : <span className="text-[var(--text-3)]">n/d</span>
                                }
                              </td>
                            ))}
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          })}
        </>
      )}
    </div>
  )
}
