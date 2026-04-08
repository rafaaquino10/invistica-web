'use client'

import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/utils/formatters'

interface MonteCarloCardProps {
  ticker: string
  currentPrice: number
  valuation: {
    fairValueFinal: number | null
    fairValueDcf: number | null
    fairValueGordon: number | null
    fairValueMult: number | null
    fairValueP25: number | null
    fairValueP75: number | null
    safetyMargin: number | null
    upsideProb: number | null
    lossProb: number | null
    impliedGrowth: number | null
  }
}

export function MonteCarloCard({ ticker, currentPrice, valuation }: MonteCarloCardProps) {
  const v = valuation
  const hasRange = v.fairValueP25 != null && v.fairValueP75 != null && v.fairValueFinal != null

  if (!hasRange || currentPrice <= 0) return null // Silently hide — valuation data not always available for all assets

  const p25 = v.fairValueP25!
  const p75 = v.fairValueP75!
  const fair = v.fairValueFinal!

  // Build the visual range (min to max with buffer)
  const allValues = [p25, fair, p75, currentPrice].filter(Boolean)
  const minVal = Math.min(...allValues) * 0.85
  const maxVal = Math.max(...allValues) * 1.15
  const range = maxVal - minVal

  const toPos = (val: number) => ((val - minVal) / range) * 100

  const pricePos = toPos(currentPrice)
  const p25Pos = toPos(p25)
  const p75Pos = toPos(p75)
  const fairPos = toPos(fair)

  const upside = ((fair - currentPrice) / currentPrice) * 100
  const upsideColor = upside >= 20 ? 'text-teal' : upside >= 0 ? 'text-amber' : 'text-red'

  // Method breakdown
  const methods = [
    { label: 'DCF', value: v.fairValueDcf },
    { label: 'Gordon', value: v.fairValueGordon },
    { label: 'Multiples', value: v.fairValueMult },
  ].filter(m => m.value != null && m.value > 0)

  return (
    <div>
      <h2 className="text-[11px] font-semibold text-[var(--text-3)] uppercase tracking-wider mb-2">
        Monte Carlo — {ticker}
      </h2>
      <div className="border border-[var(--border-1)] rounded-[var(--radius)] shadow-sm bg-[var(--surface-1)] p-4">

        {/* Fair Value headline */}
        <div className="flex items-end justify-between mb-5">
          <div>
            <p className="text-[var(--text-caption)] text-[var(--text-3)]">Valor Justo (consensus)</p>
            <p className="text-[var(--text-heading)] font-bold font-mono">{formatCurrency(fair)}</p>
          </div>
          <div className="text-right">
            <span className={cn('text-[var(--text-subheading)] font-bold font-mono', upsideColor)}>
              {upside >= 0 ? '+' : ''}{upside.toFixed(1)}%
            </span>
            <p className="text-[var(--text-caption)] text-[var(--text-3)]">vs preço atual</p>
          </div>
        </div>

        {/* Monte Carlo distribution bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-[10px] text-[var(--text-3)] mb-1">
            <span>P25 (pessimista)</span>
            <span>P75 (otimista)</span>
          </div>
          <div className="relative h-10 bg-[var(--surface-2)] rounded-lg overflow-visible">
            {/* P25-P75 range band */}
            <div
              className="absolute top-1 bottom-1 bg-[var(--accent-1)]/15 rounded"
              style={{ left: `${p25Pos}%`, width: `${p75Pos - p25Pos}%` }}
            />

            {/* P25 marker */}
            <div className="absolute top-0 bottom-0 flex flex-col items-center" style={{ left: `${p25Pos}%` }}>
              <div className="w-px h-full bg-amber/60" />
              <span className="absolute -bottom-4 text-[10px] font-mono text-amber -translate-x-1/2">
                {formatCurrency(p25)}
              </span>
            </div>

            {/* Fair value marker */}
            <div className="absolute top-0 bottom-0 flex flex-col items-center" style={{ left: `${fairPos}%` }}>
              <div className="w-0.5 h-full bg-[var(--accent-1)]" />
              <span className="absolute -bottom-4 text-[10px] font-mono font-bold text-[var(--accent-1)] -translate-x-1/2">
                {formatCurrency(fair)}
              </span>
            </div>

            {/* P75 marker */}
            <div className="absolute top-0 bottom-0 flex flex-col items-center" style={{ left: `${p75Pos}%` }}>
              <div className="w-px h-full bg-teal/60" />
              <span className="absolute -bottom-4 text-[10px] font-mono text-teal -translate-x-1/2">
                {formatCurrency(p75)}
              </span>
            </div>

            {/* Current price dot */}
            <div
              className="absolute top-1/2 -translate-y-1/2 z-10"
              style={{ left: `${pricePos}%`, marginLeft: '-8px' }}
            >
              <div className={cn(
                'w-4 h-4 rounded-full border-2 border-white shadow-md',
                currentPrice < fair ? 'bg-teal' : 'bg-red'
              )} />
              <span className="absolute -top-5 text-[10px] font-mono font-bold text-[var(--text-1)] -translate-x-1/4 whitespace-nowrap">
                {formatCurrency(currentPrice)}
              </span>
            </div>
          </div>
        </div>

        {/* Probability + Safety metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-8 pt-3 border-t border-[var(--border-1)]/20">
          {v.upsideProb != null && (
            <MetricBox
              label="Prob. Upside"
              value={`${(v.upsideProb * 100).toFixed(0)}%`}
              color={v.upsideProb > 0.6 ? 'teal' : v.upsideProb > 0.4 ? 'amber' : 'red'}
            />
          )}
          {v.lossProb != null && (
            <MetricBox
              label="Prob. Perda"
              value={`${(v.lossProb * 100).toFixed(0)}%`}
              color={v.lossProb < 0.2 ? 'teal' : v.lossProb < 0.4 ? 'amber' : 'red'}
            />
          )}
          {v.safetyMargin != null && (
            <MetricBox
              label="Margem Seg."
              value={`${(v.safetyMargin * 100).toFixed(0)}%`}
              color={v.safetyMargin > 0.25 ? 'teal' : v.safetyMargin > 0.1 ? 'amber' : 'red'}
            />
          )}
          {v.impliedGrowth != null && (
            <MetricBox
              label="Growth Implícito"
              value={`${(v.impliedGrowth * 100).toFixed(1)}%`}
              color="neutral"
            />
          )}
        </div>

        {/* Method breakdown */}
        {methods.length > 1 && (
          <div className="mt-3 pt-3 border-t border-[var(--border-1)]/20">
            <p className="text-[10px] font-semibold text-[var(--text-3)] uppercase tracking-wider mb-2">Métodos de Valuation</p>
            <div className="flex items-center gap-4">
              {methods.map(m => (
                <div key={m.label} className="flex items-center gap-1.5 text-[12px]">
                  <span className="text-[var(--text-3)]">{m.label}</span>
                  <span className="font-mono font-bold text-[var(--text-1)]">{formatCurrency(m.value!)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function MetricBox({ label, value, color }: { label: string; value: string; color: 'teal' | 'amber' | 'red' | 'neutral' }) {
  const colorClass = color === 'teal' ? 'text-teal' : color === 'amber' ? 'text-amber' : color === 'red' ? 'text-red' : 'text-[var(--text-1)]'
  return (
    <div>
      <p className="text-[10px] text-[var(--text-3)] uppercase tracking-wider">{label}</p>
      <p className={cn('text-[18px] font-mono font-bold', colorClass)}>{value}</p>
    </div>
  )
}
