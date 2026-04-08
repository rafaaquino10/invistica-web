'use client'

import { cn } from '@/lib/utils'
import { trpc } from '@/lib/trpc/provider'
import { PaywallGate } from '@/components/billing/paywall-gate'

export default function ModelTransparencyPage() {
  const { data: perf } = trpc.backtest.modelPerformance.useQuery(undefined, { staleTime: 30 * 60 * 1000 })
  const { data: ic } = trpc.backtest.icTimeline.useQuery(undefined, { staleTime: 30 * 60 * 1000 })
  const { data: decay } = trpc.backtest.signalDecay.useQuery(undefined, { staleTime: 30 * 60 * 1000 })

  return (
    <PaywallGate requiredPlan="elite" feature="Model Transparency" showPreview>
      <div className="space-y-6">
        {/* Header */}
        <div className="border-b-2 border-[var(--accent-1)] pb-4">
          <p className="text-[10px] font-bold text-[var(--accent-1)] uppercase tracking-[0.15em] mb-1">IQ-Cognit Engine</p>
          <h1 className="text-[var(--text-title)] font-bold">Transparencia do Modelo</h1>
          <p className="text-[var(--text-small)] text-[var(--text-2)] mt-1">
            Metricas de acuracia, poder preditivo e validacao out-of-sample do scoring quantamental.
          </p>
        </div>

        {/* Model KPIs */}
        {perf && (
          <div className="border border-[var(--border-1)] rounded-[var(--radius)] shadow-sm bg-[var(--surface-1)] p-5">
            <h2 className="text-[11px] font-semibold text-[var(--text-3)] uppercase tracking-wider mb-4">Performance do Modelo</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <BigKpi label="IC Spearman" value={perf.ic_spearman?.toFixed(3) ?? '—'} sublabel="Correlacao preditiva" color={perf.ic_spearman > 0.05 ? 'teal' : 'amber'} />
              <BigKpi label="Hit Rate" value={perf.hit_rate ? `${(perf.hit_rate * 100).toFixed(0)}%` : '—'} sublabel="Taxa de acerto direcional" color={perf.hit_rate > 0.55 ? 'teal' : 'amber'} />
              <BigKpi label="Alpha Anualizado" value={perf.alpha_annualized ? `${(perf.alpha_annualized * 100).toFixed(1)}pp` : '—'} sublabel="Excesso vs benchmark" color={perf.alpha_annualized > 0 ? 'teal' : 'red'} />
              <BigKpi label="Sharpe Ratio" value={perf.sharpe_ratio?.toFixed(2) ?? '—'} sublabel="Retorno ajustado ao risco" color={perf.sharpe_ratio > 1 ? 'teal' : 'amber'} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-4 pt-4 border-t border-[var(--border-1)]/20">
              <SmallKpi label="IC Media 6M" value={perf.ic_6m_avg?.toFixed(3) ?? '—'} />
              <SmallKpi label="Max Drawdown" value={perf.max_drawdown ? `${(perf.max_drawdown * 100).toFixed(1)}%` : '—'} />
              <SmallKpi label="Turnover Medio" value={perf.avg_turnover ? `${(perf.avg_turnover * 100).toFixed(0)}%` : '—'} />
              <SmallKpi label="Periodo" value={perf.backtest_period ?? '—'} />
            </div>
          </div>
        )}

        {/* IC Timeline */}
        {ic?.timeline && ic.timeline.length > 0 && (
          <div className="border border-[var(--border-1)] rounded-[var(--radius)] shadow-sm bg-[var(--surface-1)] p-5">
            <h2 className="text-[11px] font-semibold text-[var(--text-3)] uppercase tracking-wider mb-4">
              IC Timeline — Information Coefficient
            </h2>
            <p className="text-[12px] text-[var(--text-2)] mb-4">
              Correlacao de Spearman entre scores IQ-Cognit e retornos futuros. IC &gt; 0.05 indica poder preditivo significativo.
            </p>

            {/* IC mini chart as horizontal bars */}
            <div className="space-y-1.5">
              {ic.timeline.slice(-24).map((point, i) => {
                const icVal = point.ic_overall
                const barWidth = Math.min(Math.abs(icVal) * 500, 100) // scale for visibility
                const isPositive = icVal >= 0
                return (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-[var(--text-3)] w-20 flex-shrink-0">
                      {new Date(point.date).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })}
                    </span>
                    <div className="flex-1 flex items-center">
                      <div className="w-1/2 flex justify-end">
                        {!isPositive && (
                          <div className="h-4 bg-red/40 rounded-l" style={{ width: `${barWidth}%` }} />
                        )}
                      </div>
                      <div className="w-px h-5 bg-[var(--text-3)]/30 flex-shrink-0" />
                      <div className="w-1/2">
                        {isPositive && (
                          <div className="h-4 bg-teal/40 rounded-r" style={{ width: `${barWidth}%` }} />
                        )}
                      </div>
                    </div>
                    <span className={cn(
                      'text-[11px] font-mono font-bold w-12 text-right',
                      icVal >= 0.05 ? 'text-teal' : icVal >= 0 ? 'text-amber' : 'text-red'
                    )}>
                      {icVal.toFixed(3)}
                    </span>
                  </div>
                )
              })}
            </div>

            {/* Reference line label */}
            <div className="mt-3 flex items-center gap-2 text-[10px] text-[var(--text-3)]">
              <span className="w-3 h-px bg-amber" /> Limiar de relevancia (IC = 0.05)
            </div>
          </div>
        )}

        {/* Signal Decay — Quintile Analysis */}
        {decay?.quintiles && decay.quintiles.length > 0 && (
          <div className="border border-[var(--border-1)] rounded-[var(--radius)] shadow-sm bg-[var(--surface-1)] p-5">
            <h2 className="text-[11px] font-semibold text-[var(--text-3)] uppercase tracking-wider mb-2">
              Signal Decay — Analise por Quintil
            </h2>
            <p className="text-[12px] text-[var(--text-2)] mb-4">
              Se o modelo funciona, Q1 (top scores) deve superar Q5 (bottom scores) consistentemente.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="border-b border-[var(--border-1)]/20 text-[var(--text-3)]">
                    <th className="text-left py-2 font-semibold">Quintil</th>
                    <th className="text-center py-2 font-semibold">Score Medio</th>
                    <th className="text-center py-2 font-semibold">Ativos</th>
                    <th className="text-right py-2 font-semibold">Ret. 1M</th>
                    <th className="text-right py-2 font-semibold">Ret. 3M</th>
                    <th className="text-right py-2 font-semibold">Ret. 6M</th>
                  </tr>
                </thead>
                <tbody>
                  {decay.quintiles.map((q, i) => {
                    const isTop = i === 0
                    const isBottom = i === decay.quintiles.length - 1
                    return (
                      <tr key={q.quintile} className={cn(
                        'border-b border-[var(--border-1)]/10',
                        isTop && 'bg-teal/5',
                        isBottom && 'bg-red/5'
                      )}>
                        <td className="py-2">
                          <span className={cn(
                            'font-bold font-mono',
                            isTop ? 'text-teal' : isBottom ? 'text-red' : 'text-[var(--text-1)]'
                          )}>
                            Q{q.quintile}
                          </span>
                          <span className="text-[var(--text-3)] ml-1.5">{q.label}</span>
                        </td>
                        <td className="text-center font-mono py-2">{q.avg_score.toFixed(0)}</td>
                        <td className="text-center font-mono py-2 text-[var(--text-2)]">{q.count}</td>
                        <td className={cn('text-right font-mono font-bold py-2', q.avg_return_1m >= 0 ? 'text-teal' : 'text-red')}>
                          {(q.avg_return_1m * 100).toFixed(1)}%
                        </td>
                        <td className={cn('text-right font-mono font-bold py-2', q.avg_return_3m >= 0 ? 'text-teal' : 'text-red')}>
                          {(q.avg_return_3m * 100).toFixed(1)}%
                        </td>
                        <td className={cn('text-right font-mono font-bold py-2', q.avg_return_6m >= 0 ? 'text-teal' : 'text-red')}>
                          {(q.avg_return_6m * 100).toFixed(1)}%
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Spread highlight */}
            {decay.spread_q1_q5 && (
              <div className="mt-4 pt-3 border-t border-[var(--border-1)]/20">
                <p className="text-[10px] font-bold text-[var(--text-3)] uppercase tracking-wider mb-2">Spread Q1 - Q5</p>
                <div className="flex items-center gap-6">
                  <SpreadBadge label="1M" value={decay.spread_q1_q5.return_1m} />
                  <SpreadBadge label="3M" value={decay.spread_q1_q5.return_3m} />
                  <SpreadBadge label="6M" value={decay.spread_q1_q5.return_6m} />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Empty state */}
        {!perf && !ic && !decay && (
          <div className="text-center py-16">
            <p className="text-[var(--text-2)]">Dados de transparencia do modelo indisponiveis.</p>
            <p className="text-[var(--text-caption)] text-[var(--text-3)] mt-1">O backend precisa ter historico de scores para gerar estas metricas.</p>
          </div>
        )}
      </div>
    </PaywallGate>
  )
}

function BigKpi({ label, value, sublabel, color }: { label: string; value: string; sublabel: string; color: 'teal' | 'amber' | 'red' }) {
  const c = color === 'teal' ? 'text-teal' : color === 'amber' ? 'text-amber' : 'text-red'
  return (
    <div>
      <p className="text-[10px] font-semibold text-[var(--text-3)] uppercase tracking-wider">{label}</p>
      <p className={cn('text-[28px] font-mono font-bold leading-tight mt-0.5', c)}>{value}</p>
      <p className="text-[10px] text-[var(--text-3)] mt-0.5">{sublabel}</p>
    </div>
  )
}

function SmallKpi({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] text-[var(--text-3)]">{label}</p>
      <p className="text-[14px] font-mono font-bold text-[var(--text-1)]">{value}</p>
    </div>
  )
}

function SpreadBadge({ label, value }: { label: string; value: number }) {
  const pct = (value * 100).toFixed(1)
  const positive = value > 0
  return (
    <div className={cn(
      'px-3 py-1.5 rounded-lg border',
      positive ? 'bg-teal/10 border-teal/20' : 'bg-red/10 border-red/20'
    )}>
      <span className="text-[10px] text-[var(--text-3)]">{label}</span>
      <span className={cn('text-[16px] font-mono font-bold ml-2', positive ? 'text-teal' : 'text-red')}>
        {positive ? '+' : ''}{pct}pp
      </span>
    </div>
  )
}
