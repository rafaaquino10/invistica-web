'use client'

import { useState } from 'react'
import { trpc } from '@/lib/trpc/provider'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/utils/formatters'
import { Button } from '@/components/ui'
import { PaywallGate } from '@/components/billing/paywall-gate'

export default function BacktestPage() {
  const [config, setConfig] = useState({
    startDate: '2016-01-01',
    endDate: '',
    rebalanceFrequency: 'quarterly' as 'monthly' | 'quarterly',
    universeSize: 60,
    longPct: 20,
    benchmark: 'IBOV' as 'IBOV' | 'CDI' | 'SMLL' | 'IDIV',
    includeShort: false,
    includeLeverage: false,
  })
  const [isRunning, setIsRunning] = useState(false)

  const { data, refetch, isFetching } = trpc.backtest.run.useQuery(config, {
    enabled: false,
    staleTime: Infinity,
  })

  async function handleRun() {
    setIsRunning(true)
    await refetch()
    setIsRunning(false)
  }

  const loading = isFetching || isRunning

  return (
    <PaywallGate requiredPlan="elite" feature="Backtest Nuclear v8" showPreview>
      <div className="space-y-6">
        <div>
          <h1 className="text-[var(--text-title)] font-bold">Backtest Nuclear v8</h1>
          <p className="text-[var(--text-small)] text-[var(--text-2)]">
            Simulacao historica com scoring point-in-time, Long & Short, e stress test integrado.
          </p>
        </div>

        {/* Config Form */}
        <div className="border border-[var(--border-1)] rounded-[var(--radius)] shadow-sm bg-[var(--surface-1)] p-4">
          <h2 className="text-[11px] font-semibold text-[var(--text-3)] uppercase tracking-wider mb-3">Parametros</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Field label="Inicio">
              <input
                type="date"
                value={config.startDate}
                onChange={e => setConfig(c => ({ ...c, startDate: e.target.value }))}
                className="w-full bg-[var(--surface-2)] border border-[var(--border-1)]/30 rounded px-2 py-1.5 text-[13px] font-mono text-[var(--text-1)]"
              />
            </Field>
            <Field label="Fim (vazio = hoje)">
              <input
                type="date"
                value={config.endDate}
                onChange={e => setConfig(c => ({ ...c, endDate: e.target.value }))}
                className="w-full bg-[var(--surface-2)] border border-[var(--border-1)]/30 rounded px-2 py-1.5 text-[13px] font-mono text-[var(--text-1)]"
              />
            </Field>
            <Field label="Rebalanceamento">
              <select
                value={config.rebalanceFrequency}
                onChange={e => setConfig(c => ({ ...c, rebalanceFrequency: e.target.value as any }))}
                className="w-full bg-[var(--surface-2)] border border-[var(--border-1)]/30 rounded px-2 py-1.5 text-[13px] text-[var(--text-1)]"
              >
                <option value="monthly">Mensal</option>
                <option value="quarterly">Trimestral</option>
              </select>
            </Field>
            <Field label="Universo (top N)">
              <input
                type="number"
                value={config.universeSize}
                min={10} max={500}
                onChange={e => setConfig(c => ({ ...c, universeSize: Number(e.target.value) }))}
                className="w-full bg-[var(--surface-2)] border border-[var(--border-1)]/30 rounded px-2 py-1.5 text-[13px] font-mono text-[var(--text-1)]"
              />
            </Field>
            <Field label="Long % do universo">
              <input
                type="number"
                value={config.longPct}
                min={5} max={50}
                onChange={e => setConfig(c => ({ ...c, longPct: Number(e.target.value) }))}
                className="w-full bg-[var(--surface-2)] border border-[var(--border-1)]/30 rounded px-2 py-1.5 text-[13px] font-mono text-[var(--text-1)]"
              />
            </Field>
            <Field label="Benchmark">
              <select
                value={config.benchmark}
                onChange={e => setConfig(c => ({ ...c, benchmark: e.target.value as any }))}
                className="w-full bg-[var(--surface-2)] border border-[var(--border-1)]/30 rounded px-2 py-1.5 text-[13px] text-[var(--text-1)]"
              >
                <option value="IBOV">IBOV</option>
                <option value="CDI">CDI</option>
                <option value="SMLL">SMLL</option>
                <option value="IDIV">IDIV</option>
              </select>
            </Field>
            <Field label="Short Book">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.includeShort}
                  onChange={e => setConfig(c => ({ ...c, includeShort: e.target.checked }))}
                  className="rounded"
                />
                <span className="text-[13px] text-[var(--text-1)]">Ativar Short</span>
              </label>
            </Field>
            <Field label="Alavancagem">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.includeLeverage}
                  onChange={e => setConfig(c => ({ ...c, includeLeverage: e.target.checked }))}
                  className="rounded"
                />
                <span className="text-[13px] text-[var(--text-1)]">Ativar Leverage</span>
              </label>
            </Field>
          </div>
          <div className="mt-4 flex justify-end">
            <Button onClick={handleRun} disabled={loading} size="sm">
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Executando...
                </span>
              ) : 'Executar Backtest'}
            </Button>
          </div>
        </div>

        {/* Results */}
        {data && data.available && (
          <div className="space-y-5">
            {/* Summary KPIs */}
            <div className="border border-[var(--border-1)] rounded-[var(--radius)] shadow-sm bg-[var(--surface-1)] p-4">
              <h2 className="text-[11px] font-semibold text-[var(--text-3)] uppercase tracking-wider mb-3">Resultados</h2>
              <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
                <Kpi label="CAGR" value={`${(data.summary.cagr * 100).toFixed(1)}%`} color={data.summary.cagr > 0.15 ? 'teal' : 'amber'} />
                <Kpi label="Alpha vs IBOV" value={`${(data.summary.alpha_vs_ibov * 100).toFixed(1)}pp`} color={data.summary.alpha_vs_ibov > 0 ? 'teal' : 'red'} />
                <Kpi label="Sharpe" value={data.summary.sharpe_ratio.toFixed(2)} color={data.summary.sharpe_ratio > 1 ? 'teal' : 'amber'} />
                <Kpi label="Max Drawdown" value={`${(data.summary.max_drawdown * 100).toFixed(1)}%`} color={data.summary.max_drawdown > -0.25 ? 'amber' : 'red'} />
                <Kpi label="Win Rate" value={`${(data.summary.win_rate * 100).toFixed(0)}%`} color={data.summary.win_rate > 0.55 ? 'teal' : 'amber'} />
                <Kpi label="IC Spearman" value={data.summary.ic_spearman.toFixed(3)} color={data.summary.ic_spearman > 0.05 ? 'teal' : 'amber'} />
                <Kpi label="Retorno Total" value={`${(data.summary.total_return * 100).toFixed(0)}%`} color="teal" />
                <Kpi label="Posicoes Media" value={String(data.summary.avg_positions)} color="neutral" />
                <Kpi label="Turnover Anual" value={`${(data.summary.turnover_annual * 100).toFixed(0)}%`} color="neutral" />
              </div>
            </div>

            {/* Equity Curve */}
            {data.equity_curve && data.equity_curve.length > 0 && (
              <div className="border border-[var(--border-1)] rounded-[var(--radius)] shadow-sm bg-[var(--surface-1)] p-4">
                <h2 className="text-[11px] font-semibold text-[var(--text-3)] uppercase tracking-wider mb-3">Curva de Equity (Base 100)</h2>
                <div className="h-[300px] flex items-end gap-px">
                  {data.equity_curve.filter((_, i) => i % Math.max(1, Math.floor(data.equity_curve.length / 120)) === 0).map((p, i) => {
                    const maxVal = Math.max(...data.equity_curve.map(e => Math.max(e.portfolio, e.benchmark)))
                    const pHeight = (p.portfolio / maxVal) * 100
                    const bHeight = (p.benchmark / maxVal) * 100
                    return (
                      <div key={i} className="flex-1 flex items-end gap-px" title={`${p.date}: Portfolio ${p.portfolio.toFixed(0)} | Bench ${p.benchmark.toFixed(0)}`}>
                        <div className="flex-1 bg-[var(--accent-1)]/60 rounded-t-sm" style={{ height: `${pHeight}%` }} />
                        <div className="flex-1 bg-[var(--text-3)]/30 rounded-t-sm" style={{ height: `${bHeight}%` }} />
                      </div>
                    )
                  })}
                </div>
                <div className="flex items-center gap-4 mt-2 text-[10px] text-[var(--text-3)]">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 bg-[var(--accent-1)]/60 rounded-sm" /> Portfolio</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 bg-[var(--text-3)]/30 rounded-sm" /> {config.benchmark}</span>
                </div>
              </div>
            )}

            {/* Annual Returns Table */}
            {data.annual_returns && data.annual_returns.length > 0 && (
              <div className="border border-[var(--border-1)] rounded-[var(--radius)] shadow-sm bg-[var(--surface-1)] p-4">
                <h2 className="text-[11px] font-semibold text-[var(--text-3)] uppercase tracking-wider mb-3">Retornos Anuais</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-[12px]">
                    <thead>
                      <tr className="text-[var(--text-3)] border-b border-[var(--border-1)]/20">
                        <th className="text-left py-2 font-medium">Ano</th>
                        <th className="text-right py-2 font-medium">Portfolio</th>
                        <th className="text-right py-2 font-medium">{config.benchmark}</th>
                        <th className="text-right py-2 font-medium">Alpha</th>
                        <th className="text-right py-2 font-medium">Posicoes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.annual_returns.map(yr => (
                        <tr key={yr.year} className="border-b border-[var(--border-1)]/10 hover:bg-[var(--surface-2)]/30">
                          <td className="py-1.5 font-mono font-bold">{yr.year}</td>
                          <td className={cn('py-1.5 text-right font-mono', yr.portfolio_return >= 0 ? 'text-teal' : 'text-red')}>
                            {(yr.portfolio_return * 100).toFixed(1)}%
                          </td>
                          <td className={cn('py-1.5 text-right font-mono', yr.benchmark_return >= 0 ? 'text-[var(--text-2)]' : 'text-red')}>
                            {(yr.benchmark_return * 100).toFixed(1)}%
                          </td>
                          <td className={cn('py-1.5 text-right font-mono font-bold', yr.alpha >= 0 ? 'text-teal' : 'text-red')}>
                            {yr.alpha >= 0 ? '+' : ''}{(yr.alpha * 100).toFixed(1)}pp
                          </td>
                          <td className="py-1.5 text-right font-mono text-[var(--text-2)]">{yr.positions}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Stress Tests */}
            {data.stress_tests && data.stress_tests.length > 0 && (
              <div className="border border-[var(--border-1)] rounded-[var(--radius)] shadow-sm bg-[var(--surface-1)] p-4">
                <h2 className="text-[11px] font-semibold text-[var(--text-3)] uppercase tracking-wider mb-3">Stress Tests</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {data.stress_tests.map(st => (
                    <div key={st.scenario} className="bg-[var(--surface-2)]/50 rounded-lg p-3">
                      <p className="text-[11px] font-semibold text-[var(--text-2)] mb-2">{st.scenario}</p>
                      <div className="flex items-end gap-2">
                        <div>
                          <p className="text-[10px] text-[var(--text-3)]">Portfolio</p>
                          <p className={cn('text-[16px] font-mono font-bold', st.portfolio_drawdown > -20 ? 'text-amber' : 'text-red')}>
                            {st.portfolio_drawdown.toFixed(1)}%
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] text-[var(--text-3)]">{config.benchmark}</p>
                          <p className="text-[14px] font-mono text-[var(--text-2)]">{st.benchmark_drawdown.toFixed(1)}%</p>
                        </div>
                        {st.recovery_days != null && (
                          <div className="ml-auto">
                            <p className="text-[10px] text-[var(--text-3)]">Recuperacao</p>
                            <p className="text-[13px] font-mono text-[var(--text-1)]">{st.recovery_days}d</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Walk-Forward */}
            {data.walk_forward && data.walk_forward.length > 0 && (
              <div className="border border-[var(--border-1)] rounded-[var(--radius)] shadow-sm bg-[var(--surface-1)] p-4">
                <h2 className="text-[11px] font-semibold text-[var(--text-3)] uppercase tracking-wider mb-3">Walk-Forward Analysis</h2>
                <div className="flex items-center gap-2 flex-wrap">
                  {data.walk_forward.map(wf => (
                    <div
                      key={wf.period}
                      className={cn(
                        'px-3 py-2 rounded-lg border text-center',
                        wf.passed ? 'bg-teal/10 border-teal/20' : 'bg-red/10 border-red/20'
                      )}
                    >
                      <p className="text-[10px] font-semibold text-[var(--text-3)]">{wf.period}</p>
                      <p className={cn('text-[14px] font-mono font-bold', wf.passed ? 'text-teal' : 'text-red')}>
                        IC {wf.out_of_sample_ic.toFixed(3)}
                      </p>
                      <p className="text-[10px] text-[var(--text-3)]">{wf.passed ? 'Passed' : 'Failed'}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {data && !data.available && (
          <div className="border border-red/20 rounded-[var(--radius)] bg-red/5 p-4">
            <p className="text-[13px] text-red">Erro ao executar backtest: {(data as any).error ?? 'Tente novamente'}</p>
          </div>
        )}
      </div>
    </PaywallGate>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[10px] font-semibold text-[var(--text-3)] uppercase tracking-wider block mb-1">{label}</label>
      {children}
    </div>
  )
}

function Kpi({ label, value, color }: { label: string; value: string; color: 'teal' | 'amber' | 'red' | 'neutral' }) {
  const c = color === 'teal' ? 'text-teal' : color === 'amber' ? 'text-amber' : color === 'red' ? 'text-red' : 'text-[var(--text-1)]'
  return (
    <div>
      <p className="text-[10px] text-[var(--text-3)] uppercase tracking-wider">{label}</p>
      <p className={cn('text-[18px] font-mono font-bold', c)}>{value}</p>
    </div>
  )
}
