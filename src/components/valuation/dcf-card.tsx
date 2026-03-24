'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/hooks/use-auth'
import { pro } from '@/lib/api/endpoints'
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
  const { data, isLoading } = useQuery({
    queryKey: ['valuation', ticker],
    queryFn: () => pro.getValuation(ticker, token ?? undefined),
    enabled: !!ticker && !!token,
    staleTime: 10 * 60 * 1000,
  })

  if (isLoading) {
    return (
      <div className="border border-[var(--border-1)]/20 rounded-[var(--radius)] bg-[var(--surface-1)] p-4 animate-pulse">
        <div className="h-4 w-32 bg-[var(--surface-2)] rounded mb-3" />
        <div className="h-8 w-48 bg-[var(--surface-2)] rounded mb-2" />
        <div className="h-3 w-full bg-[var(--surface-2)] rounded" />
      </div>
    )
  }

  if (!data || !data.available) {
    return (
      <div className="border border-[var(--border-1)]/20 rounded-[var(--radius)] bg-[var(--surface-1)] p-4">
        <h3 className="text-[11px] font-semibold text-[var(--text-3)] uppercase tracking-wider mb-2">Valuation DCF</h3>
        <p className="text-[var(--text-small)] text-[var(--text-3)]">
          {(data as any)?.reason ?? 'Dados insuficientes para calcular DCF'}
        </p>
      </div>
    )
  }

  const d = data
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

  // Barra visual: posição do preço atual vs valor intrínseco
  const maxVal = Math.max(d.currentPrice, d.intrinsicValue) * 1.2
  const pricePos = (d.currentPrice / maxVal) * 100
  const fairPos = (d.intrinsicValue / maxVal) * 100
  const buyPos = (d.buyPrice / maxVal) * 100

  // Dados do gráfico de barras
  const currentYear = new Date().getFullYear()
  const chartData = d.projectedCashFlows.map(cf => ({
    name: String(currentYear + cf.year),
    fcf: cf.discounted,
    isTerminal: false,
  }))
  // Adicionar terminal value como última barra
  chartData.push({
    name: 'Terminal',
    fcf: d.terminalValue,
    isTerminal: true,
  })

  // Crescimento terminal estimado do WACC
  const terminalGrowth = d.wacc > 3 ? Math.min(3.5, d.wacc * 0.25) : 3

  return (
    <div className="border border-[var(--border-1)]/20 rounded-[var(--radius)] bg-[var(--surface-1)]">
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[11px] font-semibold text-[var(--text-3)] uppercase tracking-wider">Valuation DCF</h3>
          <span className={cn(
            'text-[var(--text-caption)] font-medium px-2 py-0.5 rounded',
            d.confidence === 'alta' ? 'bg-[var(--pos)]/10 text-[var(--pos)]' :
            d.confidence === 'media' ? 'bg-amber-400/10 text-amber-400' :
            'bg-[var(--neg)]/10 text-[var(--neg)]'
          )}>
            Confiança {d.confidence}
          </span>
        </div>

        {/* Valor intrínseco + upside */}
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

        {/* Barra visual de comparação */}
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
              d.isBelowFairValue ? 'bg-[var(--pos)]' : 'bg-[var(--neg)]'
            )}
            style={{ left: `${pricePos}%`, marginLeft: '-6px' }}
            title={`Preço atual: ${formatCurrency(d.currentPrice)}`}
          />
        </div>

        {/* Premissas em grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4 p-3 bg-[var(--surface-2)]/50 rounded-lg">
          <div>
            <p className="text-[var(--text-caption)] text-[var(--text-3)]">WACC</p>
            <p className="text-[var(--text-small)] font-mono font-semibold">{d.wacc.toFixed(1)}%</p>
          </div>
          <div>
            <p className="text-[var(--text-caption)] text-[var(--text-3)]">Cresc. terminal</p>
            <p className="text-[var(--text-small)] font-mono font-semibold">{terminalGrowth.toFixed(1)}%</p>
          </div>
          <div>
            <p className="text-[var(--text-caption)] text-[var(--text-3)]">Preço compra</p>
            <p className="text-[var(--text-small)] font-mono font-semibold">{formatCurrency(d.buyPrice)}</p>
          </div>
          <div>
            <p className="text-[var(--text-caption)] text-[var(--text-3)]">Margem seg.</p>
            <p className="text-[var(--text-small)] font-mono font-semibold">{d.marginOfSafety}%</p>
          </div>
        </div>

        {/* Gráfico de barras: FCFs projetados */}
        <div className="h-40 sm:h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
              <XAxis
                dataKey="name"
                tick={{ fontSize: 10, fill: 'var(--text-3)' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: 'var(--text-3)' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: number) => formatCompact(v)}
              />
              <Tooltip
                formatter={(value: number) => [formatCompact(value), 'VP do FCF']}
                contentStyle={{
                  backgroundColor: 'var(--surface-1)',
                  border: '1px solid var(--border-1)',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              />
              <Bar dataKey="fcf" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell
                    key={index}
                    fill={entry.isTerminal ? 'var(--accent-1)' : 'var(--pos)'}
                    fillOpacity={entry.isTerminal ? 0.7 : 0.6}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="text-[var(--text-caption)] text-[var(--text-3)] text-center mt-1">
          FCFs a valor presente (10 anos + terminal)
        </p>
      </div>

      {/* Expandir para tabela detalhada */}
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
        {expanded ? 'Ocultar tabela' : 'Ver tabela detalhada'}
      </button>

      {/* Tabela de FCFs projetados */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-[var(--border-1)]/10">
          <table className="w-full text-[var(--text-caption)] mt-3">
            <thead>
              <tr className="text-[var(--text-3)]">
                <th className="text-left py-1 font-medium">Ano</th>
                <th className="text-right py-1 font-medium">FCF Projetado</th>
                <th className="text-right py-1 font-medium">Valor Presente</th>
              </tr>
            </thead>
            <tbody>
              {d.projectedCashFlows.map(cf => (
                <tr key={cf.year} className="border-t border-[var(--border-1)]/5">
                  <td className="py-1 font-mono">{currentYear + cf.year}</td>
                  <td className="py-1 text-right font-mono">{formatCompact(cf.fcf)}</td>
                  <td className="py-1 text-right font-mono text-[var(--text-2)]">{formatCompact(cf.discounted)}</td>
                </tr>
              ))}
              <tr className="border-t border-[var(--border-1)]/20 font-medium">
                <td className="py-1">Terminal</td>
                <td className="py-1 text-right font-mono">—</td>
                <td className="py-1 text-right font-mono text-[var(--accent-1)]">{formatCompact(d.terminalValue)}</td>
              </tr>
              <tr className="border-t border-[var(--border-1)]/20 font-semibold">
                <td className="py-1.5">EV Total</td>
                <td className="py-1.5" />
                <td className="py-1.5 text-right font-mono">{formatCompact(d.enterpriseValue)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function formatCompact(value: number): string {
  if (Math.abs(value) >= 1e9) return `R$ ${(value / 1e9).toFixed(1)}B`
  if (Math.abs(value) >= 1e6) return `R$ ${(value / 1e6).toFixed(0)}M`
  if (Math.abs(value) >= 1e3) return `R$ ${(value / 1e3).toFixed(0)}k`
  return `R$ ${value.toFixed(0)}`
}
