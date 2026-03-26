'use client'

import { useState, useMemo } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useAuth } from '@/hooks/use-auth'
import { pro } from '@/lib/api/endpoints'
import { Card, CardContent, Button, Input, Skeleton } from '@/components/ui'
import { PaywallGate } from '@/components/billing/paywall-gate'
import { cn } from '@/lib/utils'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, BarChart, Bar, Cell, Legend,
} from 'recharts'

const BENCHMARKS = ['IBOV', 'CDI', 'SMLL', 'IDIV', 'IFIX', 'SPX', 'USD', 'GOLD'] as const

function pct(s: string | null | undefined): string {
  if (!s) return '-'
  return s
}

function num(s: string | null | undefined): number {
  if (!s) return 0
  return parseFloat(s.replace('%', '')) || 0
}

export default function BacktestPage() {
  const { token } = useAuth()

  // Form state
  const [startDate, setStartDate] = useState('2020-01-01')
  const [endDate, setEndDate] = useState('2025-12-31')
  const [rebalanceFreq, setRebalanceFreq] = useState<'monthly' | 'quarterly'>('quarterly')
  const [universeSize, setUniverseSize] = useState(100)
  const [longPct, setLongPct] = useState(0.10)
  const [minScore, setMinScore] = useState(70)
  const [benchmarks, setBenchmarks] = useState<string[]>(['IBOV', 'CDI'])
  const [initialCapital, setInitialCapital] = useState(1_000_000)
  const [costBps, setCostBps] = useState(50)

  const { data: result, mutate: runBacktest, isPending, error } = useMutation({
    mutationFn: () => pro.runBacktest({
      start_date: startDate,
      end_date: endDate,
      rebalance_freq: rebalanceFreq,
      universe_size: universeSize,
      long_pct: longPct,
      min_iq_score_buy: minScore,
      benchmarks,
      initial_capital: initialCapital,
      transaction_cost_bps: costBps,
    }, token ?? undefined),
  })

  const toggleBenchmark = (b: string) => {
    setBenchmarks(prev =>
      prev.includes(b) ? prev.filter(x => x !== b) : [...prev, b]
    )
  }

  // Chart data
  const navData = useMemo(() => {
    if (!result?.monthly_nav) return []
    return result.monthly_nav.map(m => ({
      date: m.date.slice(0, 7),
      NAV: m.nav,
      positions: m.n_positions,
    }))
  }, [result])

  const yearlyData = useMemo(() => {
    if (!result?.yearly) return []
    return Object.entries(result.yearly)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([year, d]) => ({
        year,
        'IQ-Score': num(d.iq_return),
        ...Object.fromEntries(
          Object.entries(d.benchmarks).map(([k, v]) => [k, num(v)])
        ),
      }))
  }, [result])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-[var(--text-title)] font-bold tracking-tight">Backtest IQ-Score</h1>
        <p className="text-[var(--text-small)] text-[var(--text-2)] mt-0.5">
          Simule o desempenho histórico do motor IQ-Cognit com parâmetros customizáveis.
        </p>
      </div>

      <PaywallGate requiredPlan="pro" feature="Backtest Personalizado" showPreview>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

          {/* Sidebar — Parameters */}
          <Card className="lg:col-span-1">
            <CardContent className="p-4 space-y-4">
              <h3 className="text-[var(--text-small)] font-semibold text-[var(--text-1)]">Parâmetros</h3>

              <div className="space-y-3">
                <div>
                  <label className="text-[var(--text-caption)] text-[var(--text-3)] mb-1 block">Início</label>
                  <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="text-xs" />
                </div>
                <div>
                  <label className="text-[var(--text-caption)] text-[var(--text-3)] mb-1 block">Fim</label>
                  <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="text-xs" />
                </div>
                <div>
                  <label className="text-[var(--text-caption)] text-[var(--text-3)] mb-1 block">Rebalanceamento</label>
                  <select
                    value={rebalanceFreq}
                    onChange={e => setRebalanceFreq(e.target.value as any)}
                    className="w-full rounded-lg border border-[var(--border-1)] bg-[var(--surface-1)] px-3 py-2 text-xs"
                  >
                    <option value="quarterly">Trimestral</option>
                    <option value="monthly">Mensal</option>
                  </select>
                </div>
                <div>
                  <label className="text-[var(--text-caption)] text-[var(--text-3)] mb-1 block">Universo (top N)</label>
                  <Input type="number" min={10} max={500} value={universeSize} onChange={e => setUniverseSize(Number(e.target.value))} className="text-xs" />
                </div>
                <div>
                  <label className="text-[var(--text-caption)] text-[var(--text-3)] mb-1 block">% Long ({(longPct * 100).toFixed(0)}%)</label>
                  <input type="range" min={5} max={50} value={longPct * 100} onChange={e => setLongPct(Number(e.target.value) / 100)} className="w-full" />
                </div>
                <div>
                  <label className="text-[var(--text-caption)] text-[var(--text-3)] mb-1 block">IQ-Score Mínimo</label>
                  <Input type="number" min={50} max={95} value={minScore} onChange={e => setMinScore(Number(e.target.value))} className="text-xs" />
                </div>
                <div>
                  <label className="text-[var(--text-caption)] text-[var(--text-3)] mb-1 block">Capital Inicial (R$)</label>
                  <Input type="number" min={1000} value={initialCapital} onChange={e => setInitialCapital(Number(e.target.value))} className="text-xs" />
                </div>
                <div>
                  <label className="text-[var(--text-caption)] text-[var(--text-3)] mb-1 block">Custo Transacao ({costBps} bps)</label>
                  <input type="range" min={0} max={200} value={costBps} onChange={e => setCostBps(Number(e.target.value))} className="w-full" />
                </div>

                {/* Benchmarks */}
                <div>
                  <label className="text-[var(--text-caption)] text-[var(--text-3)] mb-2 block">Benchmarks</label>
                  <div className="flex flex-wrap gap-1.5">
                    {BENCHMARKS.map(b => (
                      <button
                        key={b}
                        onClick={() => toggleBenchmark(b)}
                        className={cn(
                          'px-2 py-1 rounded-md text-[10px] font-mono border transition-colors',
                          benchmarks.includes(b)
                            ? 'bg-[var(--accent)] text-white border-[var(--accent)]'
                            : 'border-[var(--border-1)] text-[var(--text-3)] hover:border-[var(--border-2)]'
                        )}
                      >
                        {b}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <Button
                variant="primary"
                className="w-full text-xs"
                onClick={() => runBacktest()}
                disabled={isPending}
              >
                {isPending ? 'Executando...' : 'Executar Backtest'}
              </Button>

              {error && (
                <p className="text-[var(--text-caption)] text-[var(--neg)] mt-1">
                  {(error as any)?.message ?? 'Erro ao executar backtest'}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Main — Results */}
          <div className="lg:col-span-3 space-y-4">
            {isPending && (
              <div className="space-y-4">
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-64 w-full" />
                <Skeleton className="h-48 w-full" />
              </div>
            )}

            {!result && !isPending && (
              <Card>
                <CardContent className="p-12 text-center">
                  <div className="text-4xl mb-3 opacity-30">&#x1f4ca;</div>
                  <h3 className="text-[var(--text-body)] font-semibold text-[var(--text-2)]">Configure e execute</h3>
                  <p className="text-[var(--text-caption)] text-[var(--text-3)] mt-1 max-w-sm mx-auto">
                    Ajuste os parâmetros no painel lateral e clique em "Executar Backtest" para ver os resultados.
                  </p>
                </CardContent>
              </Card>
            )}

            {result && (
              <>
                {/* KPI Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <KPI label="CAGR" value={pct(result.performance.iq_score_cagr)} positive={num(result.performance.iq_score_cagr) > 0} />
                  <KPI label="Sharpe" value={result.performance.sharpe_ratio?.toFixed(2) ?? '-'} positive={(result.performance.sharpe_ratio ?? 0) > 0.5} />
                  <KPI label="Max Drawdown" value={pct(result.performance.max_drawdown)} positive={false} />
                  <KPI label="Volatilidade" value={pct(result.performance.volatility)} />
                </div>

                {/* Benchmark Alpha Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {Object.entries(result.vs_benchmarks).map(([bench, d]) => (
                    <Card key={bench}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[var(--text-caption)] text-[var(--text-3)] font-medium">vs {bench}</span>
                          <span className={cn('text-[var(--text-small)] font-mono font-bold', num(d.alpha_ann) > 0 ? 'text-[var(--pos)]' : 'text-[var(--neg)]')}>
                            Alpha {pct(d.alpha_ann)}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-[var(--text-caption)]">
                          <div>
                            <span className="text-[var(--text-3)]">Retorno</span>
                            <p className="font-mono">{pct(d.total_return)}</p>
                          </div>
                          <div>
                            <span className="text-[var(--text-3)]">CAGR</span>
                            <p className="font-mono">{pct(d.cagr)}</p>
                          </div>
                          <div>
                            <span className="text-[var(--text-3)]">Anos ganhos</span>
                            <p className="font-mono">{d.years_beaten}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* NAV Chart */}
                {navData.length > 0 && (
                  <Card>
                    <CardContent className="p-5">
                      <h3 className="text-[var(--text-small)] font-semibold text-[var(--text-1)] mb-4">Evolução do NAV</h3>
                      <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={navData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-1)" opacity={0.2} />
                            <XAxis dataKey="date" tick={{ fill: 'var(--text-3)', fontSize: 10 }} interval="preserveStartEnd" />
                            <YAxis tick={{ fill: 'var(--text-3)', fontSize: 10 }} width={70} tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} />
                            <Tooltip
                              content={({ active, payload }) => {
                                if (!active || !payload?.length) return null
                                const d = payload[0]?.payload as any
                                return (
                                  <div className="bg-[var(--surface-1)] border border-[var(--border-1)] rounded-lg p-3 shadow-lg text-[var(--text-caption)]">
                                    <p className="font-semibold text-[var(--text-1)]">{d.date}</p>
                                    <p>NAV: <span className="font-mono font-bold">R$ {d.NAV?.toLocaleString('pt-BR')}</span></p>
                                    <p>Posições: <span className="font-mono">{d.positions}</span></p>
                                  </div>
                                )
                              }}
                            />
                            <Line type="monotone" dataKey="NAV" stroke="var(--accent)" strokeWidth={2} dot={false} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Yearly Breakdown */}
                {yearlyData.length > 0 && (
                  <Card>
                    <CardContent className="p-5">
                      <h3 className="text-[var(--text-small)] font-semibold text-[var(--text-1)] mb-4">Retorno Anual</h3>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={yearlyData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-1)" opacity={0.2} />
                            <XAxis dataKey="year" tick={{ fill: 'var(--text-3)', fontSize: 11 }} />
                            <YAxis tick={{ fill: 'var(--text-3)', fontSize: 11 }} tickFormatter={v => `${v}%`} />
                            <Tooltip
                              content={({ active, payload, label }) => {
                                if (!active || !payload?.length) return null
                                return (
                                  <div className="bg-[var(--surface-1)] border border-[var(--border-1)] rounded-lg p-3 shadow-lg text-[var(--text-caption)]">
                                    <p className="font-semibold text-[var(--text-1)] mb-1">{label}</p>
                                    {payload.map((p: any) => (
                                      <p key={p.dataKey}>
                                        <span style={{ color: p.color }}>{p.dataKey}</span>:{' '}
                                        <span className="font-mono font-bold">{p.value?.toFixed(1)}%</span>
                                      </p>
                                    ))}
                                  </div>
                                )
                              }}
                            />
                            <Legend />
                            <Bar dataKey="IQ-Score" fill="var(--accent)" radius={[3, 3, 0, 0]} />
                            {benchmarks.includes('IBOV') && <Bar dataKey="IBOV" fill="#6366F1" radius={[3, 3, 0, 0]} />}
                            {benchmarks.includes('CDI') && <Bar dataKey="CDI" fill="#F59E0B" radius={[3, 3, 0, 0]} />}
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Yearly Table */}
                <Card>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-[var(--text-caption)]">
                        <thead>
                          <tr className="border-b border-[var(--border-1)] text-[var(--text-3)]">
                            <th className="text-left py-3 px-4 font-medium">Ano</th>
                            <th className="text-right py-3 px-3 font-medium">IQ-Score</th>
                            {benchmarks.map(b => (
                              <th key={b} className="text-right py-3 px-3 font-medium">{b}</th>
                            ))}
                            <th className="text-right py-3 px-3 font-medium">Alpha IBOV</th>
                            <th className="text-right py-3 px-3 font-medium">Regime</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.entries(result.yearly)
                            .sort(([a], [b]) => Number(a) - Number(b))
                            .map(([year, d]) => (
                            <tr key={year} className="border-b border-[var(--border-1)] hover:bg-[var(--surface-2)] transition-colors">
                              <td className="py-2.5 px-4 font-medium text-[var(--text-1)]">{year}</td>
                              <td className={cn('py-2.5 px-3 text-right font-mono', num(d.iq_return) > 0 ? 'text-[var(--pos)]' : 'text-[var(--neg)]')}>
                                {pct(d.iq_return)}
                              </td>
                              {benchmarks.map(b => (
                                <td key={b} className="py-2.5 px-3 text-right font-mono text-[var(--text-2)]">
                                  {pct(d.benchmarks[b])}
                                </td>
                              ))}
                              <td className={cn('py-2.5 px-3 text-right font-mono font-semibold', num(d.alpha_ibov) > 0 ? 'text-[var(--pos)]' : 'text-[var(--neg)]')}>
                                {pct(d.alpha_ibov)}
                              </td>
                              <td className="py-2.5 px-3 text-right">
                                {d.regime && (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-[var(--surface-2)] text-[var(--text-3)]">
                                    {d.regime}
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>

                {/* Metadata */}
                <div className="p-4 rounded-lg bg-[var(--surface-2)]/50 border border-[var(--border-1)]">
                  <p className="text-[var(--text-caption)] text-[var(--text-3)] leading-relaxed">
                    {result.summary} | {result.metadata.n_rebalances} rebalanceamentos |
                    Capital inicial R$ {initialCapital.toLocaleString('pt-BR')} |
                    Custo {costBps} bps round-trip
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </PaywallGate>
    </div>
  )
}

function KPI({ label, value, positive }: { label: string; value: string; positive?: boolean }) {
  return (
    <Card>
      <CardContent className="p-3.5">
        <p className="text-[var(--text-caption)] text-[var(--text-3)] mb-0.5">{label}</p>
        <p className={cn(
          'text-[var(--text-heading)] font-bold font-mono',
          positive === true && 'text-[var(--pos)]',
          positive === false && 'text-[var(--neg)]',
        )}>
          {value}
        </p>
      </CardContent>
    </Card>
  )
}
