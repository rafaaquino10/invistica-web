'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { Skeleton } from '@/components/ui'
import { cn } from '@/lib/utils'
import { pro, free } from '@/lib/api/endpoints'
import { useAuth } from '@/hooks/use-auth'

const MANDATES = ['CONSERVADOR', 'EQUILIBRADO', 'ARROJADO'] as const
const RATINGS = ['STRONG_BUY', 'BUY', 'HOLD', 'REDUCE', 'AVOID'] as const

function getRatingLabel(rating: string): string {
  const labels: Record<string, string> = {
    STRONG_BUY: 'Compra Forte', BUY: 'Acumular', HOLD: 'Neutro',
    REDUCE: 'Reduzir', AVOID: 'Evitar',
  }
  return labels[rating] || rating
}

function getRatingColor(rating: string): string {
  if (rating === 'STRONG_BUY') return 'text-[var(--pos)]'
  if (rating === 'BUY') return 'text-[var(--accent-1)]'
  if (rating === 'HOLD') return 'text-[var(--warn)]'
  return 'text-[var(--neg)]'
}

export default function ExplorerPage() {
  const router = useRouter()
  const { token } = useAuth()

  const [mandate, setMandate] = useState<string>('EQUILIBRADO')
  const [minScore, setMinScore] = useState<number>(0)
  const [ratingFilter, setRatingFilter] = useState<string>('')
  const [clusterId, setClusterId] = useState<number | undefined>()

  const { data: clusters } = useQuery({
    queryKey: ['clusters'],
    queryFn: () => free.getClusters(),
  })

  const { data: screenerData, isLoading } = useQuery({
    queryKey: ['screener', mandate, minScore, ratingFilter, clusterId],
    queryFn: () => pro.getScreener({
      mandate,
      min_score: minScore || undefined,
      rating: ratingFilter || undefined,
      cluster_id: clusterId,
      limit: 100,
    }, token ?? undefined),
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-[var(--text-1)]">Explorer</h1>
        <p className="text-[var(--text-small)] text-[var(--text-2)]">Screener de acoes por IQ-Score, mandato e setor</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-end">
        {/* Mandate */}
        <div>
          <label className="text-[var(--text-caption)] text-[var(--text-2)] font-medium block mb-1">Mandato</label>
          <div className="flex gap-1">
            {MANDATES.map((m) => (
              <button
                key={m}
                onClick={() => setMandate(m)}
                className={cn(
                  'px-3 py-1.5 text-xs font-medium rounded-lg transition-colors',
                  mandate === m
                    ? 'bg-[var(--accent-1)] text-white'
                    : 'bg-[var(--surface-1)] text-[var(--text-2)] border border-[var(--border-1)] hover:border-[var(--accent-1)]'
                )}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* Min Score */}
        <div>
          <label className="text-[var(--text-caption)] text-[var(--text-2)] font-medium block mb-1">Score minimo</label>
          <input
            type="number"
            min={0}
            max={100}
            value={minScore}
            onChange={(e) => setMinScore(Number(e.target.value))}
            className="w-20 px-3 py-1.5 text-sm rounded-lg bg-[var(--surface-1)] border border-[var(--border-1)] text-[var(--text-1)] font-mono"
          />
        </div>

        {/* Rating */}
        <div>
          <label className="text-[var(--text-caption)] text-[var(--text-2)] font-medium block mb-1">Rating</label>
          <select
            value={ratingFilter}
            onChange={(e) => setRatingFilter(e.target.value)}
            className="px-3 py-1.5 text-sm rounded-lg bg-[var(--surface-1)] border border-[var(--border-1)] text-[var(--text-1)]"
          >
            <option value="">Todos</option>
            {RATINGS.map((r) => (
              <option key={r} value={r}>{getRatingLabel(r)}</option>
            ))}
          </select>
        </div>

        {/* Cluster */}
        <div>
          <label className="text-[var(--text-caption)] text-[var(--text-2)] font-medium block mb-1">Setor</label>
          <select
            value={clusterId ?? ''}
            onChange={(e) => setClusterId(e.target.value ? Number(e.target.value) : undefined)}
            className="px-3 py-1.5 text-sm rounded-lg bg-[var(--surface-1)] border border-[var(--border-1)] text-[var(--text-1)]"
          >
            <option value="">Todos</option>
            {clusters?.clusters?.map((c) => (
              <option key={c.cluster_id} value={c.cluster_id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div className="text-[var(--text-small)] text-[var(--text-2)]">
          {screenerData?.count ?? 0} resultados
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-[var(--surface-1)] rounded-[var(--radius)] border border-[var(--border-1)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border-1)] bg-[var(--bg)]">
                <th className="text-left px-4 py-3 text-[var(--text-2)] font-medium">Ticker</th>
                <th className="text-right px-4 py-3 text-[var(--text-2)] font-medium">IQ-Score</th>
                <th className="text-center px-4 py-3 text-[var(--text-2)] font-medium">Rating</th>
                <th className="text-right px-4 py-3 text-[var(--text-2)] font-medium">Quanti</th>
                <th className="text-right px-4 py-3 text-[var(--text-2)] font-medium">Quali</th>
                <th className="text-right px-4 py-3 text-[var(--text-2)] font-medium">Valuation</th>
                <th className="text-right px-4 py-3 text-[var(--text-2)] font-medium">Margem Seg.</th>
                <th className="text-right px-4 py-3 text-[var(--text-2)] font-medium">DY Proj.</th>
                <th className="text-right px-4 py-3 text-[var(--text-2)] font-medium">Div Safety</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <tr key={i} className="border-b border-[var(--border-1)]/50">
                    <td className="px-4 py-3" colSpan={9}><Skeleton className="h-6" /></td>
                  </tr>
                ))
              ) : screenerData?.results?.length ? (
                screenerData.results.map((r) => (
                  <tr
                    key={r.ticker}
                    onClick={() => router.push(`/ativo/${r.ticker}`)}
                    className="border-b border-[var(--border-1)]/50 cursor-pointer hover:bg-[var(--surface-2)] transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-semibold text-[var(--text-1)]">{r.ticker}</p>
                        <p className="text-[var(--text-caption)] text-[var(--text-2)] truncate max-w-[180px]">{r.company_name}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={cn('font-mono font-bold',
                        r.iq_score >= 75 ? 'text-[var(--pos)]' :
                        r.iq_score >= 62 ? 'text-[var(--accent-1)]' :
                        r.iq_score >= 42 ? 'text-[var(--text-1)]' :
                        'text-[var(--neg)]'
                      )}>{r.iq_score}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={cn('text-xs font-medium', getRatingColor(r.rating))}>
                        {getRatingLabel(r.rating)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-[var(--text-1)]">{r.score_quanti}</td>
                    <td className="px-4 py-3 text-right font-mono text-[var(--text-1)]">{r.score_quali}</td>
                    <td className="px-4 py-3 text-right font-mono text-[var(--text-1)]">{r.score_valuation}</td>
                    <td className="px-4 py-3 text-right font-mono">
                      {r.safety_margin != null ? (
                        <span className={r.safety_margin > 0 ? 'text-[var(--pos)]' : 'text-[var(--neg)]'}>
                          {(r.safety_margin * 100).toFixed(0)}%
                        </span>
                      ) : '--'}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-[var(--text-1)]">
                      {r.dividend_yield_proj != null ? `${(r.dividend_yield_proj * 100).toFixed(1)}%` : '--'}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-[var(--text-1)]">
                      {r.dividend_safety ?? '--'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-4 py-8 text-center text-[var(--text-2)]" colSpan={9}>
                    Nenhum resultado encontrado. Ajuste os filtros ou verifique se a API esta rodando.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
