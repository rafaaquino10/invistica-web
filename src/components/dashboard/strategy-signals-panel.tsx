'use client'

import { cn } from '@/lib/utils'
import { trpc } from '@/lib/trpc/provider'
import Link from 'next/link'

export function StrategySignalsPanel() {
  const { data } = trpc.backtest.signals.useQuery(undefined, {
    staleTime: 5 * 60 * 1000,
  })
  const { data: riskData } = trpc.backtest.riskStatus.useQuery(undefined, {
    staleTime: 5 * 60 * 1000,
  })

  if (!data?.available && !riskData?.available) {
    return (
      <div className="text-[var(--text-caption)] text-[var(--text-3)] flex items-center justify-center h-full">
        Sinais indisponiveis
      </div>
    )
  }

  const signals = data?.signals ?? []
  const topSignals = signals.slice(0, 6)

  const actionColor = (action: string) => {
    if (action === 'buy') return 'text-teal bg-teal/10'
    if (action === 'sell') return 'text-red bg-red/10'
    if (action === 'rotate') return 'text-amber bg-amber/10'
    return 'text-[var(--text-2)] bg-[var(--surface-2)]'
  }

  const actionLabel = (action: string) => {
    if (action === 'buy') return 'COMPRA'
    if (action === 'sell') return 'VENDA'
    if (action === 'rotate') return 'ROTACAO'
    return 'HOLD'
  }

  return (
    <div className="space-y-2">
      {/* Risk status bar */}
      {riskData?.available && (
        <div className={cn(
          'flex items-center justify-between px-2 py-1.5 rounded text-[10px] font-semibold',
          riskData.kill_switch ? 'bg-red/10 text-red' :
          riskData.regime === 'RISK_OFF' ? 'bg-amber/10 text-amber' :
          'bg-teal/10 text-teal'
        )}>
          <span>{riskData.regime ?? '—'}</span>
          {riskData.kill_switch && <span>KILL SWITCH</span>}
          {riskData.recent_drawdown !== 0 && (
            <span>DD {(riskData.recent_drawdown * 100).toFixed(1)}%</span>
          )}
        </div>
      )}

      {/* Signal list */}
      {topSignals.length > 0 ? (
        <div className="space-y-1">
          {topSignals.map(s => (
            <Link
              key={s.ticker}
              href={`/ativo/${s.ticker}`}
              className="flex items-center gap-2 px-2 py-1 rounded hover:bg-[var(--surface-2)] transition-colors"
            >
              <span className={cn('text-[9px] font-bold px-1.5 py-0.5 rounded', actionColor(s.action))}>
                {actionLabel(s.action)}
              </span>
              <span className="font-mono text-[12px] font-bold text-[var(--text-1)]">{s.ticker}</span>
              <span className="text-[10px] text-[var(--text-3)] truncate flex-1">{s.reason}</span>
              <span className="text-[11px] font-mono text-[var(--accent-1)]">{s.iq_score}</span>
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-[11px] text-[var(--text-3)] text-center py-2">Sem sinais ativos</p>
      )}
    </div>
  )
}
