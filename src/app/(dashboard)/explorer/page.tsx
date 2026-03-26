'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Skeleton, Tabs, Disclaimer } from '@/components/ui'
import { AssetLogo } from '@/components/ui/asset-logo'
import { cn } from '@/lib/utils'
import { pro, free } from '@/lib/api/endpoints'
import { useAuth } from '@/hooks/use-auth'
import { fadeInUp } from '@/lib/utils/motion'

// ─── Constants ──────────────────────────────────────────────
const MANDATES = ['CONSERVADOR', 'EQUILIBRADO', 'ARROJADO'] as const

const RATING_LABELS: Record<string, string> = {
  STRONG_BUY: 'Compra Forte', BUY: 'Acumular', HOLD: 'Neutro',
  REDUCE: 'Reduzir', AVOID: 'Evitar',
}

const RATING_BADGES: Record<string, string> = {
  STRONG_BUY: 'bg-emerald-500/15 text-emerald-600',
  BUY: 'bg-blue-500/15 text-blue-600',
  HOLD: 'bg-amber-500/15 text-amber-600',
  REDUCE: 'bg-orange-500/15 text-orange-600',
  AVOID: 'bg-red-500/15 text-red-600',
}

const SORT_OPTIONS = [
  { value: 'iq_score', label: 'IQ-Score' },
  { value: 'safety_margin', label: 'Margem Seg.' },
  { value: 'dividend_yield', label: 'Dividend Yield' },
  { value: 'dividend_safety', label: 'Div Safety' },
] as const

type SortKey = typeof SORT_OPTIONS[number]['value']

// ─── Main Page ──────────────────────────────────────────────
export default function ExplorerPage() {
  const router = useRouter()
  const { token } = useAuth()

  // Filter state
  const [mandate, setMandate] = useState<string>('EQUILIBRADO')
  const [minScore, setMinScore] = useState<number>(0)
  const [ratingFilter, setRatingFilter] = useState<string>('')
  const [clusterId, setClusterId] = useState<number | undefined>()
  const [sortBy, setSortBy] = useState<SortKey>('iq_score')
  const [sortAsc, setSortAsc] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [selectedIdx, setSelectedIdx] = useState(-1)

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
      limit: 200,
    }, token ?? undefined),
  })

  // Client-side sort
  const sorted = useMemo(() => {
    if (!screenerData?.results) return []
    const results = [...screenerData.results]
    results.sort((a, b) => {
      let va: number, vb: number
      switch (sortBy) {
        case 'iq_score': va = a.iq_score; vb = b.iq_score; break
        case 'safety_margin': va = a.safety_margin ?? -999; vb = b.safety_margin ?? -999; break
        case 'dividend_yield': va = a.dividend_yield_proj ?? 0; vb = b.dividend_yield_proj ?? 0; break
        case 'dividend_safety': va = a.dividend_safety ?? 0; vb = b.dividend_safety ?? 0; break
        default: va = a.iq_score; vb = b.iq_score
      }
      return sortAsc ? va - vb : vb - va
    })
    return results
  }, [screenerData, sortBy, sortAsc])

  const clusterNames = useMemo(() => {
    return clusters?.clusters?.reduce((acc, c) => ({ ...acc, [c.cluster_id]: c.name }), {} as Record<number, string>) ?? {}
  }, [clusters])

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'j' && selectedIdx < sorted.length - 1) { setSelectedIdx(i => i + 1); e.preventDefault() }
    if (e.key === 'k' && selectedIdx > 0) { setSelectedIdx(i => i - 1); e.preventDefault() }
    if (e.key === 'Enter' && selectedIdx >= 0 && sorted[selectedIdx]) {
      router.push(`/ativo/${sorted[selectedIdx].ticker}`)
      e.preventDefault()
    }
  }

  return (
    <div className="space-y-5" onKeyDown={handleKeyDown} tabIndex={0}>
      {/* ─── Header ──────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[var(--text-1)]">Explorer</h1>
          <p className="text-[var(--text-small)] text-[var(--text-2)]">
            {sorted.length} acoes ranqueadas por IQ-Score | Mandato: {mandate}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              'px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors',
              showFilters ? 'bg-[var(--accent-1)] text-white border-[var(--accent-1)]' : 'bg-[var(--surface-1)] text-[var(--text-2)] border-[var(--border-1)]'
            )}
          >
            Filtros {showFilters ? '▲' : '▼'}
          </button>
          <span className="text-[var(--text-caption)] text-[var(--text-2)] hidden md:block">
            j/k navegar | Enter abrir
          </span>
        </div>
      </div>

      {/* ─── Mandate Tabs ────────────────────────────── */}
      <div className="flex gap-1 p-1 bg-[var(--bg)] rounded-xl border border-[var(--border-1)]">
        {MANDATES.map((m) => (
          <button
            key={m}
            onClick={() => setMandate(m)}
            className={cn(
              'flex-1 px-4 py-2 text-xs font-semibold rounded-lg transition-all',
              mandate === m
                ? 'bg-[var(--accent-1)] text-white shadow-sm'
                : 'text-[var(--text-2)] hover:text-[var(--text-1)] hover:bg-[var(--surface-1)]'
            )}
          >
            {m}
          </button>
        ))}
      </div>

      {/* ─── Filters Panel ───────────────────────────── */}
      {showFilters && (
        <motion.div {...fadeInUp} className="bg-[var(--surface-1)] rounded-[var(--radius)] border border-[var(--border-1)] p-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="text-[var(--text-caption)] text-[var(--text-2)] font-medium block mb-1.5">IQ-Score minimo</label>
              <input
                type="range" min={0} max={100} value={minScore}
                onChange={(e) => setMinScore(Number(e.target.value))}
                className="w-full accent-[var(--accent-1)]"
              />
              <span className="text-xs font-mono text-[var(--text-2)]">{minScore}</span>
            </div>
            <div>
              <label className="text-[var(--text-caption)] text-[var(--text-2)] font-medium block mb-1.5">Rating</label>
              <select
                value={ratingFilter}
                onChange={(e) => setRatingFilter(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg bg-[var(--bg)] border border-[var(--border-1)] text-[var(--text-1)]"
              >
                <option value="">Todos</option>
                {Object.entries(RATING_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[var(--text-caption)] text-[var(--text-2)] font-medium block mb-1.5">Setor</label>
              <select
                value={clusterId ?? ''}
                onChange={(e) => setClusterId(e.target.value ? Number(e.target.value) : undefined)}
                className="w-full px-3 py-2 text-sm rounded-lg bg-[var(--bg)] border border-[var(--border-1)] text-[var(--text-1)]"
              >
                <option value="">Todos os setores</option>
                {clusters?.clusters?.map((c) => (
                  <option key={c.cluster_id} value={c.cluster_id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[var(--text-caption)] text-[var(--text-2)] font-medium block mb-1.5">Ordenar por</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortKey)}
                className="w-full px-3 py-2 text-sm rounded-lg bg-[var(--bg)] border border-[var(--border-1)] text-[var(--text-1)]"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>
        </motion.div>
      )}

      {/* ─── Results Table ───────────────────────────── */}
      <div className="bg-[var(--surface-1)] rounded-[var(--radius)] shadow-sm border border-[var(--border-1)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10">
              <tr className="border-b border-[var(--border-1)] bg-[var(--bg)]">
                <th className="text-left px-5 py-3.5 text-[var(--text-2)] font-medium w-8">#</th>
                <th className="text-left px-3 py-3.5 text-[var(--text-2)] font-medium">Ativo</th>
                <th className="text-center px-3 py-3.5 text-[var(--text-2)] font-medium">Setor</th>
                <SortHeader label="IQ-Score" sortKey="iq_score" current={sortBy} asc={sortAsc} onSort={(k) => { setSortBy(k as SortKey); setSortAsc(sortBy === k ? !sortAsc : false) }} />
                <th className="text-center px-3 py-3.5 text-[var(--text-2)] font-medium">Rating</th>
                <th className="text-right px-3 py-3.5 text-[var(--text-2)] font-medium">Quanti</th>
                <th className="text-right px-3 py-3.5 text-[var(--text-2)] font-medium">Quali</th>
                <th className="text-right px-3 py-3.5 text-[var(--text-2)] font-medium">Valuation</th>
                <SortHeader label="Margem Seg." sortKey="safety_margin" current={sortBy} asc={sortAsc} onSort={(k) => { setSortBy(k as SortKey); setSortAsc(sortBy === k ? !sortAsc : false) }} />
                <SortHeader label="DY Proj." sortKey="dividend_yield" current={sortBy} asc={sortAsc} onSort={(k) => { setSortBy(k as SortKey); setSortAsc(sortBy === k ? !sortAsc : false) }} />
                <SortHeader label="Div Safety" sortKey="dividend_safety" current={sortBy} asc={sortAsc} onSort={(k) => { setSortBy(k as SortKey); setSortAsc(sortBy === k ? !sortAsc : false) }} />
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 12 }).map((_, i) => (
                  <tr key={i} className="border-b border-[var(--border-1)]/30">
                    <td className="px-5 py-3.5" colSpan={11}><Skeleton className="h-8" /></td>
                  </tr>
                ))
              ) : sorted.length > 0 ? (
                sorted.map((r, idx) => (
                  <tr
                    key={r.ticker}
                    onClick={() => router.push(`/ativo/${r.ticker}`)}
                    className={cn(
                      'border-b border-[var(--border-1)]/20 cursor-pointer transition-colors',
                      idx === selectedIdx ? 'bg-[var(--accent-1)]/5 ring-1 ring-[var(--accent-1)]/20' : 'hover:bg-[var(--surface-2)]'
                    )}
                  >
                    <td className="px-5 py-3 text-[var(--text-2)] font-mono text-xs">{idx + 1}</td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-3">
                        <AssetLogo ticker={r.ticker} size={32} />
                        <div>
                          <p className="font-semibold text-[var(--text-1)]">{r.ticker}</p>
                          <p className="text-[var(--text-caption)] text-[var(--text-2)] truncate max-w-[200px]">{r.company_name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className="text-xs text-[var(--text-2)] bg-[var(--bg)] px-2 py-0.5 rounded-full">
                        {clusterNames[r.cluster_id] ?? `C${r.cluster_id}`}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className={cn(
                        'font-mono text-sm font-bold inline-flex items-center justify-center w-10 h-10 rounded-xl',
                        r.iq_score >= 75 ? 'bg-[var(--pos)]/10 text-[var(--pos)]' :
                        r.iq_score >= 62 ? 'bg-[var(--accent-1)]/10 text-[var(--accent-1)]' :
                        r.iq_score >= 42 ? 'bg-[var(--bg)] text-[var(--text-1)]' :
                        'bg-[var(--neg)]/10 text-[var(--neg)]'
                      )}>
                        {r.iq_score}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className={cn('text-[11px] font-semibold px-2 py-0.5 rounded-full', RATING_BADGES[r.rating] ?? '')}>
                        {RATING_LABELS[r.rating] ?? r.rating}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right font-mono text-sm text-[var(--text-1)]">{r.score_quanti}</td>
                    <td className="px-3 py-3 text-right font-mono text-sm text-[var(--text-1)]">{r.score_quali}</td>
                    <td className="px-3 py-3 text-right font-mono text-sm text-[var(--text-1)]">{r.score_valuation}</td>
                    <td className="px-3 py-3 text-right font-mono text-sm">
                      {r.safety_margin != null ? (
                        <span className={r.safety_margin > 0.15 ? 'text-[var(--pos)]' : r.safety_margin > 0 ? 'text-[var(--accent-1)]' : 'text-[var(--neg)]'}>
                          {(r.safety_margin * 100).toFixed(0)}%
                        </span>
                      ) : <span className="text-[var(--text-2)]">--</span>}
                    </td>
                    <td className="px-3 py-3 text-right font-mono text-sm text-[var(--text-1)]">
                      {r.dividend_yield_proj != null ? `${(r.dividend_yield_proj * 100).toFixed(1)}%` : '--'}
                    </td>
                    <td className="px-3 py-3 text-right font-mono text-sm">
                      {r.dividend_safety != null ? (
                        <span className={
                          r.dividend_safety >= 70 ? 'text-[var(--pos)]' :
                          r.dividend_safety >= 50 ? 'text-[var(--warn)]' :
                          'text-[var(--neg)]'
                        }>{r.dividend_safety}</span>
                      ) : <span className="text-[var(--text-2)]">--</span>}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-5 py-12 text-center text-[var(--text-2)]" colSpan={11}>
                    Nenhum resultado. Verifique se a API InvestIQ está rodando.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Disclaimer variant="footer" />
    </div>
  )
}

// ─── Sort Header ─────────────────────────────────────────────
function SortHeader({ label, sortKey, current, asc, onSort }: {
  label: string; sortKey: string; current: string; asc: boolean; onSort: (key: string) => void
}) {
  const active = current === sortKey
  return (
    <th
      className="text-right px-3 py-3.5 text-[var(--text-2)] font-medium cursor-pointer hover:text-[var(--text-1)] transition-colors select-none"
      onClick={() => onSort(sortKey)}
    >
      {label} {active ? (asc ? '↑' : '↓') : ''}
    </th>
  )
}
