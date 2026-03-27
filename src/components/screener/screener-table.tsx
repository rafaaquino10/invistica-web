'use client'

import Link from 'next/link'
import { Badge, Skeleton } from '@/components/ui'
import { ScoreThermometer } from '@/components/charts'
import { cn } from '@/lib/utils'
import { formatCurrency, formatPercent, getScoreBgLightClass } from '@/lib/utils/formatters'
import { AssetLogo } from '@/components/ui/asset-logo'

interface AssetRow {
  id: string
  ticker: string
  name: string
  type: string
  sector: string | null
  logo?: string | null
  iqScore: {
    scoreTotal: number | string
    scoreQuanti: number | string
    scoreQuali: number | string
    scoreValuation: number | string
    scoreOperational: number | string
  } | null
  fundamental: {
    dividendYield: number | string | null
    peRatio: number | string | null
    pbRatio: number | string | null
    roe: number | string | null
    roic: number | string | null
    netMargin: number | string | null
    evEbitda?: number | string | null
    margemLiquida?: number | string | null
    netDebtEbitda?: number | string | null
    liquidezCorrente?: number | string | null
    crescimentoReceita5a?: number | string | null
  } | null
  latestQuote: {
    close: number | string
    changePercent: number | string | null
  } | null
}

interface ScreenerTableProps {
  assets: AssetRow[]
  isLoading?: boolean
  sortBy: string
  sortOrder: 'asc' | 'desc'
  onSort: (column: string) => void
}


const columns = [
  { key: 'ticker', label: 'Ativo', sortable: true, align: 'left' as const },
  { key: 'price', label: 'Preço', sortable: false, align: 'right' as const },
  { key: 'change', label: 'Var.', sortable: false, align: 'right' as const },
  { key: 'scoreTotal', label: 'IQ-Score', sortable: true, align: 'center' as const },
  { key: 'dividendYield', label: 'DY', sortable: true, align: 'right' as const },
  { key: 'peRatio', label: 'P/L', sortable: true, align: 'right' as const },
  { key: 'roe', label: 'ROE', sortable: true, align: 'right' as const },
  { key: 'sector', label: 'Setor', sortable: false, align: 'left' as const },
]

export function ScreenerTable({
  assets,
  isLoading = false,
  sortBy,
  sortOrder,
  onSort,
}: ScreenerTableProps) {
  if (isLoading) {
    return (
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left text-sm text-[var(--text-2)] border-b border-[var(--border-1)]">
              {columns.map((col) => (
                <th key={col.key} className={cn('pb-3 font-medium', col.align === 'right' && 'text-right', col.align === 'center' && 'text-center')}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 10 }).map((_, i) => (
              <tr key={i} className="border-b border-[var(--border-1)]">
                <td className="py-4">
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-10 h-10 rounded-lg" />
                    <div className="space-y-1">
                      <Skeleton className="w-16 h-4" />
                      <Skeleton className="w-24 h-3" />
                    </div>
                  </div>
                </td>
                <td className="py-4 text-right"><Skeleton className="w-16 h-4 ml-auto" /></td>
                <td className="py-4 text-right"><Skeleton className="w-12 h-4 ml-auto" /></td>
                <td className="py-4"><Skeleton className="w-12 h-8 mx-auto" /></td>
                <td className="py-4 text-right"><Skeleton className="w-10 h-4 ml-auto" /></td>
                <td className="py-4 text-right"><Skeleton className="w-10 h-4 ml-auto" /></td>
                <td className="py-4 text-right"><Skeleton className="w-10 h-4 ml-auto" /></td>
                <td className="py-4"><Skeleton className="w-16 h-4" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  if (assets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-16 h-16 rounded-full bg-[var(--surface-2)] flex items-center justify-center mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-[var(--text-2)]"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-[var(--text-1)]">
          Nenhum ativo encontrado
        </h3>
        <p className="text-sm text-[var(--text-2)] mt-1">
          Ajuste os filtros para encontrar ativos
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="text-left text-sm text-[var(--text-2)] border-b border-[var(--border-1)]">
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  'pb-3 font-medium',
                  col.align === 'right' && 'text-right',
                  col.align === 'center' && 'text-center',
                  col.sortable && 'cursor-pointer hover:text-[var(--text-1)] transition-colors'
                )}
                onClick={() => col.sortable && onSort(col.key)}
              >
                <span className="inline-flex items-center gap-1">
                  {col.label}
                  {col.sortable && sortBy === col.key && (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className={cn('transition-transform', sortOrder === 'asc' && 'rotate-180')}
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  )}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {assets.map((asset) => {
            const score = asset.iqScore ? Number(asset.iqScore.scoreTotal) : null
            const price = asset.latestQuote ? Number(asset.latestQuote.close) : null
            const change = asset.latestQuote?.changePercent ? Number(asset.latestQuote.changePercent) : null
            // Values are already in percentage format (8.81 = 8.81%), no need to multiply by 100
            const dy = asset.fundamental?.dividendYield ? Number(asset.fundamental.dividendYield) : null
            const pe = asset.fundamental?.peRatio ? Number(asset.fundamental.peRatio) : null
            const roe = asset.fundamental?.roe ? Number(asset.fundamental.roe) : null

            return (
              <tr
                key={asset.id}
                className="border-b border-[var(--border-1)] last:border-0 hover:bg-[var(--surface-2)] transition-colors"
              >
                <td className="py-4">
                  <Link href={`/ativo/${asset.ticker}`} className="flex items-center gap-3 group">
                    <AssetLogo ticker={asset.ticker} logo={asset.logo} size={40} />
                    <div>
                      <p className="font-semibold text-[var(--text-1)] group-hover:text-[var(--accent-1)] transition-colors">
                        {asset.ticker}
                      </p>
                      <p className="text-xs text-[var(--text-2)] line-clamp-1 max-w-[150px]">
                        {asset.name}
                      </p>
                    </div>
                  </Link>
                </td>
                <td className="py-4 text-right font-mono">
                  {price ? formatCurrency(price) : '-'}
                </td>
                <td className={cn('py-4 text-right font-mono', change !== null && (change >= 0 ? 'text-teal' : 'text-red'))}>
                  {change !== null ? `${change >= 0 ? '+' : ''}${change.toFixed(2)}%` : '-'}
                </td>
                <td className="py-4">
                  {score !== null ? (
                    <div className="flex flex-col items-center gap-1">
                      <span className={cn('inline-flex items-center justify-center w-12 h-8 rounded-lg font-bold font-mono', getScoreBgLightClass(score))}>
                        {score.toFixed(0)}
                      </span>
                      <div className="w-16">
                        <ScoreThermometer score={score} showIndicator={false} showLabels={false} height="sm" />
                      </div>
                    </div>
                  ) : (
                    <span className="text-[var(--text-2)]">-</span>
                  )}
                </td>
                <td className="py-4 text-right font-mono">
                  {dy !== null && dy > 0 ? `${dy.toFixed(1)}%` : '-'}
                </td>
                <td className="py-4 text-right font-mono">
                  {pe !== null && pe > 0 && pe < 500 ? pe.toFixed(1) : '-'}
                </td>
                <td className={cn('py-4 text-right font-mono', roe !== null && (roe >= 15 ? 'text-teal' : roe >= 10 ? 'text-[var(--text-1)]' : 'text-amber'))}>
                  {roe !== null && roe > 0 ? `${roe.toFixed(1)}%` : '-'}
                </td>
                <td className="py-4">
                  <span className="text-xs text-[var(--text-2)] truncate block max-w-[100px]">
                    {asset.sector ?? 'Ação'}
                  </span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
