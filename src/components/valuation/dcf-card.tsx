'use client'

import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/hooks/use-auth'
import { pro } from '@/lib/api/endpoints'
import { adaptValuation, type AdaptedDCF } from '@/lib/api/adapters'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/utils/formatters'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'

interface DCFCardProps {
  ticker: string
}

export function DCFCard({ ticker }: DCFCardProps) {
  const [expanded, setExpanded] = useState(false)

  const { token } = useAuth()
  const { data: rawData, isLoading } = useQuery({
    queryKey: ['valuation', ticker],
    queryFn: () => pro.getValuation(ticker, token ?? undefined),
    enabled: !!ticker && !!token,
    staleTime: 10 * 60 * 1000,
  })

  const d: AdaptedDCF | null = useMemo(() => {
    if (!rawData) return null
    return adaptValuation(rawData)
  }, [rawData])

  if (isLoading) {
    return (
      <div className="border border-[var(--border-1)]/20 rounded-[var(--radius)] bg-[var(--surface-1)] p-4 animate-pulse">
        <div className="h-4 w-32 bg-[var(--surface-2)] rounded mb-3" />
        <div className="h-8 w-48 bg-[var(--surface-2)] rounded mb-2" />
        <div className="h-3 w-full bg-[var(--surface-2)] rounded" />
      </div>
    )
  }

  if (!d || !d.available) {
    return (
      <div className="border border-[var(--border-1)]/20 rounded-[var(--radius)] bg-[var(--surface-1)] p-4">
        <h3 className="text-[11px] font-semibold text-[var(--text-3)] uppercase tracking-wider mb-2">Valuation DCF</h3>
        <p className="text-[var(--text-small)] text-[var(--text-3)]">
          Dados insuficientes para calcular DCF
        </p>
      </div>
    )
  }

  const upsideColor = d.upside >= 20
    ? 'text-[var(--pos)]'
    : d.upside >= 0
      ? 'text-amber-400'
      : 'text-[var(--neg)]'
  const upsideBg = d.upside >= 20
    ? 'bg-[var(--pos)]/10'
    : d.upside >= 0
      ? 'bg-amber-400/10'
      : 'bg-[var(--neg)]/10'
  const upsideLabel = d.upside >= 20
    ? 'Oportunidade'
    : d.upside >= 0
      ? 'Próximo ao intrínseco'
      : 'Sobrevalorizado'

  // Visual bar: current price position vs intrinsic value
  const maxVal = Math.max(d.currentPrice, d.intrinsicValue) * 1.2
  const pricePos = (d.currentPrice / maxVal) * 100
  const fairPos = (d.intrinsicValue / maxVal) * 100
  const buyPos = (d.buyPrice / maxVal) * 100

  const isBelowFairValue = d.currentPrice < d.intrinsicValue

  // Confidence label
  const confidenceLevel = d.confidence >= 0.7 ? 'alta' : d.confidence >= 0.4 ? 'media' : 'baixa'

  return (
    <div className="border border-[var(--border-1)]/20 rounded-[var(--radius)] bg-[var(--surface-1)]">
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[11px] font-semibold text-[var(--text-3)] uppercase tracking-wider">Valuation DCF</h3>
          <span className={cn(
            'text-[var(--text-caption)] font-medium px-2 py-0.5 rounded',
            confidenceLevel === 'alta' ? 'bg-[var(--pos)]/10 text-[var(--pos)]' :
            confidenceLevel === 'media' ? 'bg-amber-400/10 text-amber-400' :
            'bg-[var(--neg)]/10 text-[var(--neg)]'
          )}>
            Confianca {confidenceLevel}
          </span>
        </div>

        {/* Intrinsic value + upside */}
        <div className="flex items-end justify-between mb-4">
          <div>
            <p className="text-[var(--text-caption)] text-[var(--text-3)] mb-0.5">Valor Intrínseco</p>
            <p className="text-[var(--text-heading)] font-bold font-mono">{formatCurrency(d.intrinsicValue)}</p>
          </div>
          <div className="text-right">
            <span className={cn('text-[var(--text-subheading)] font-bold font-mono', upsideColor)}>
              {d.upside >= 0 ? '+' : ''}{d.upside.toFixed(1)}%
            </span>
            <p className={cn('text-[var(--text-caption)] font-medium px-2 py-0.5 rounded mt-1 inline-block', upsideBg, upsideColor)}>
              {upsideLabel}
            </p>
          </div>
        </div>

        {/* Visual comparison bar */}
        <div className="relative h-6 bg-[var(--surface-2)] rounded-full overflow-hidden mb-3">
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-[var(--pos)]/40 z-10"
            style={{ left: `${buyPos}%` }}
            title={`Preço de compra: ${formatCurrency(d.buyPrice)}`}
          />
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-[var(--accent-1)] z-10"
            style={{ left: `${fairPos}%` }}
            title={`Valor Intrínseco: ${formatCurrency(d.intrinsicValue)}`}
          />
          <div
            className={cn(
              'absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full z-20 border-2 border-white',
              isBelowFairValue ? 'bg-[var(--pos)]' : 'bg-[var(--neg)]'
            )}
            style={{ left: `${pricePos}%`, marginLeft: '-6px' }}
            title={`Preço atual: ${formatCurrency(d.currentPrice)}`}
          />
        </div>

        {/* Assumptions grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4 p-3 bg-[var(--surface-2)]/50 rounded-lg">
          <div>
            <p className="text-[var(--text-caption)] text-[var(--text-3)]">Preço compra</p>
            <p className="text-[var(--text-small)] font-mono font-semibold">{formatCurrency(d.buyPrice)}</p>
          </div>
          <div>
            <p className="text-[var(--text-caption)] text-[var(--text-3)]">Margem seg.</p>
            <p className="text-[var(--text-small)] font-mono font-semibold">{(d.safetyMargin * 100).toFixed(0)}%</p>
          </div>
          <div>
            <p className="text-[var(--text-caption)] text-[var(--text-3)]">Prob. Upside</p>
            <p className="text-[var(--text-small)] font-mono font-semibold">{(d.upsideProb * 100).toFixed(0)}%</p>
          </div>
          <div>
            <p className="text-[var(--text-caption)] text-[var(--text-3)]">Prob. Perda</p>
            <p className="text-[var(--text-small)] font-mono font-semibold">{(d.lossProb * 100).toFixed(0)}%</p>
          </div>
        </div>

        {/* Fair value breakdown */}
        <div className="space-y-1.5 text-[var(--text-caption)]">
          {d.fairValueDCF != null && (
            <div className="flex justify-between">
              <span className="text-[var(--text-3)]">DCF</span>
              <span className="font-mono">{formatCurrency(d.fairValueDCF)}</span>
            </div>
          )}
          {d.fairValueGordon != null && (
            <div className="flex justify-between">
              <span className="text-[var(--text-3)]">Gordon DDM</span>
              <span className="font-mono">{formatCurrency(d.fairValueGordon)}</span>
            </div>
          )}
          {d.fairValueMult != null && (
            <div className="flex justify-between">
              <span className="text-[var(--text-3)]">Multiplos</span>
              <span className="font-mono">{formatCurrency(d.fairValueMult)}</span>
            </div>
          )}
          {d.p25 != null && d.p75 != null && (
            <div className="flex justify-between">
              <span className="text-[var(--text-3)]">P25 - P75</span>
              <span className="font-mono">{formatCurrency(d.p25)} - {formatCurrency(d.p75)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Expand toggle */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-2 border-t border-[var(--border-1)]/10 text-[var(--text-caption)] text-[var(--text-2)] hover:text-[var(--text-1)] hover:bg-[var(--surface-2)]/30 transition-colors flex items-center justify-center gap-1.5"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          className={cn('transition-transform', expanded && 'rotate-180')}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
        {expanded ? 'Ocultar detalhes' : 'Ver detalhes'}
      </button>

      {/* Expanded details */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-[var(--border-1)]/10">
          <div className="mt-3 space-y-2 text-[var(--text-caption)]">
            <div className="flex justify-between">
              <span className="text-[var(--text-3)]">Preço Atual</span>
              <span className="font-mono">{formatCurrency(d.currentPrice)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-3)]">Valor Intrínseco</span>
              <span className="font-mono font-semibold">{formatCurrency(d.intrinsicValue)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-3)]">Preço de Compra (MS 20%)</span>
              <span className="font-mono">{formatCurrency(d.buyPrice)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-3)]">Upside</span>
              <span className={cn('font-mono font-semibold', upsideColor)}>
                {d.upside >= 0 ? '+' : ''}{d.upside.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
