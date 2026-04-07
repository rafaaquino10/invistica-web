'use client'

import type { GatewayMomentumResult } from '@/lib/gateway-client'
import { cn } from '@/lib/utils'

interface MomentumCardProps {
  momentum: GatewayMomentumResult
}

function signalColor(signal: number): string {
  if (signal >= 0.3) return 'text-[var(--pos)]'
  if (signal <= -0.3) return 'text-[var(--neg)]'
  return 'text-amber'
}

function signalBg(signal: number): string {
  if (signal >= 0.3) return 'bg-[var(--pos)]/10'
  if (signal <= -0.3) return 'bg-[var(--neg)]/10'
  return 'bg-amber/10'
}

function signalIcon(signal: number): string {
  if (signal >= 0.3) return 'BULL'
  if (signal <= -0.3) return 'BEAR'
  return 'NEUTRO'
}

export function MomentumCard({ momentum }: MomentumCardProps) {
  const layers = [
    {
      label: 'Macro',
      signal: momentum.macro.signal,
      description: momentum.macro.label,
    },
    {
      label: 'Setor',
      signal: momentum.sector.signal,
      description: momentum.sector.description || momentum.sector.label,
    },
    {
      label: 'Ativo',
      signal: momentum.asset.signal,
      description: momentum.asset.label,
      factors: momentum.asset.factors,
    },
  ]

  return (
    <div className="border border-[var(--border-1)]/20 rounded-[var(--radius)] bg-[var(--surface-1)] p-4 h-full">
      {/* Overall signal */}
        <div className="flex items-center gap-3 mb-4 pb-3 border-b border-[var(--border-1)]/10">
          <div className={cn('px-3 py-1.5 rounded-lg font-mono font-bold text-sm', signalBg(momentum.overall.signal), signalColor(momentum.overall.signal))}>
            {momentum.overall.label}
          </div>
          <span className="text-sm text-[var(--text-2)]">
            Score de momento: <span className="font-mono font-medium text-[var(--text-1)]">{momentum.overall.score}</span>
          </span>
        </div>

        {/* 3-layer breakdown */}
        <div className="space-y-3">
          {layers.map(layer => (
            <div key={layer.label} className="flex items-start gap-3">
              <div className="w-14 flex-shrink-0">
                <span className="text-xs font-medium text-[var(--text-3)] uppercase tracking-wide">{layer.label}</span>
              </div>
              <div className={cn('flex-shrink-0 text-xs mt-0.5', signalColor(layer.signal))}>
                {signalIcon(layer.signal)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-[var(--text-1)]">{layer.description}</p>
                {layer.factors && layer.factors.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {layer.factors.map((f, i) => (
                      <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--surface-2)] text-[var(--text-2)]">
                        {f}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
  )
}

export function MomentumBadge({ momentum }: { momentum: GatewayMomentumResult }) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono font-bold',
      signalBg(momentum.overall.signal),
      signalColor(momentum.overall.signal),
    )}>
      {signalIcon(momentum.overall.signal)} {momentum.overall.label}
    </span>
  )
}
