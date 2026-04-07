'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'

export interface Position {
  ticker: string
  company_name: string
  iq_score: number | null
  current_price: number
  change_pct: number
  weight: number
  result_pct: number
}

function scoreBand(score: number | null) {
  if (score == null) return 'bg-[var(--surface-2)] text-[var(--text-3)]'
  if (score >= 82) return 'bg-emerald-500/15 text-emerald-400'
  if (score >= 70) return 'bg-teal-500/15 text-teal-400'
  if (score >= 45) return 'bg-amber-500/15 text-amber-400'
  return 'bg-red-500/15 text-red-400'
}

export function PositionsTable({ positions }: { positions: Position[] }) {
  if (positions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-center py-8">
        <span className="text-[var(--text-3)] text-sm">Nenhuma posição</span>
        <Link href="/portfolio" className="text-[var(--accent-1)] text-xs font-semibold hover:underline">
          Monte sua carteira →
        </Link>
      </div>
    )
  }

  return (
    <div className="overflow-y-auto max-h-[300px]">
      <table className="w-full text-[12px]">
        <thead>
          <tr className="text-[var(--text-3)] text-[10px] uppercase tracking-wider">
            <th className="text-left py-1.5 px-2 font-medium">Ativo</th>
            <th className="text-center py-1.5 px-1 font-medium">Score</th>
            <th className="text-right py-1.5 px-2 font-medium">Preço</th>
            <th className="text-right py-1.5 px-2 font-medium">Dia</th>
            <th className="text-right py-1.5 px-2 font-medium">Peso</th>
          </tr>
        </thead>
        <tbody>
          {positions.map((p) => (
            <tr
              key={p.ticker}
              className="border-t border-[var(--border-1)]/20 hover:bg-[var(--surface-2)]/30 transition-colors cursor-pointer"
            >
              <td className="py-2 px-2">
                <Link href={`/ativo/${p.ticker}`} className="flex items-center gap-2">
                  <img
                    src={`https://raw.githubusercontent.com/StatusInvest/Content/master/img/company/${p.ticker}.jpg`}
                    alt={p.ticker}
                    className="w-5 h-5 rounded object-cover bg-[var(--surface-2)]"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                  />
                  <div className="flex flex-col">
                    <span className="font-mono font-bold text-[var(--text-1)]">{p.ticker}</span>
                  </div>
                </Link>
              </td>
              <td className="text-center py-2 px-1">
                <span className={cn('font-mono text-[10px] font-bold px-1.5 py-0.5 rounded', scoreBand(p.iq_score))}>
                  {p.iq_score ?? '–'}
                </span>
              </td>
              <td className="text-right py-2 px-2 font-mono text-[var(--text-2)]">
                {p.current_price.toFixed(2)}
              </td>
              <td className={cn('text-right py-2 px-2 font-mono font-semibold', p.change_pct >= 0 ? 'text-[var(--pos)]' : 'text-[var(--neg)]')}>
                {p.change_pct >= 0 ? '+' : ''}{p.change_pct.toFixed(2)}%
              </td>
              <td className="text-right py-2 px-2 font-mono text-[var(--text-3)]">
                {(p.weight * 100).toFixed(1)}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
