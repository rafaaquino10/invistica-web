'use client'

import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Skeleton, Tabs, Disclaimer } from '@/components/ui'
import { AssetLogo } from '@/components/ui/asset-logo'
import { cn } from '@/lib/utils'
import { pro, free } from '@/lib/api/endpoints'
import { useAuth } from '@/hooks/use-auth'
import { fadeInUp } from '@/lib/utils/motion'
import { toast } from 'sonner'

// ─── Constants ──────────────────────────────────────────────

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
  { value: 'safety_margin', label: 'Desconto' },
  { value: 'dividend_yield', label: 'Dividend Yield' },
  { value: 'dividend_safety', label: 'Div Safety' },
] as const

type SortKey = typeof SORT_OPTIONS[number]['value']

// ─── Main Page ──────────────────────────────────────────────
export default function ExplorerPage() {
  const router = useRouter()
  const { token } = useAuth()

  const [minScore, setMinScore] = useState<number>(0)
  const [ratingFilter, setRatingFilter] = useState<string>('')
  const [clusterId, setClusterId] = useState<number | undefined>()
  const [sortBy, setSortBy] = useState<SortKey>('iq_score')
  const [sortAsc, setSortAsc] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [selectedIdx, setSelectedIdx] = useState(-1)
  const [page, setPage] = useState(0)
  const PAGE_SIZE = 30
  const rowRefs = useRef<Map<number, HTMLTableRowElement>>(new Map())

  const queryClient = useQueryClient()
  const addMutation = useMutation({
    mutationFn: (ticker: string) =>
      pro.addPosition({ ticker, qty: 0, avg_price: 0 }, token ?? undefined),
    onSuccess: (_data, ticker) => {
      queryClient.invalidateQueries({ queryKey: ['portfolio'] })
      toast.success(`${ticker} adicionado à carteira`)
    },
    onError: () => toast.error('Erro ao adicionar à carteira'),
  })

  // Reset selection and page when filters change
  useEffect(() => { setSelectedIdx(-1); setPage(0) }, [minScore, ratingFilter, clusterId, sortBy, sortAsc])

  const { data: clusters } = useQuery({
    queryKey: ['clusters'],
    queryFn: () => free.getClusters(),
  })

  const { data: screenerData, isLoading } = useQuery({
    queryKey: ['screener', minScore, ratingFilter, clusterId],
    queryFn: () => pro.getScreener({
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

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE)
  const paged = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  const clusterNames = useMemo(() => {
    return clusters?.clusters?.reduce((acc, c) => ({ ...acc, [c.cluster_id]: c.name }), {} as Record<number, string>) ?? {}
  }, [clusters])

  // Keyboard navigation with auto-scroll
  const scrollToRow = useCallback((idx: number) => {
    const row = rowRefs.current.get(idx)
    if (row) row.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return
    if (e.key === 'j' && selectedIdx < sorted.length - 1) {
      const next = selectedIdx + 1
      setSelectedIdx(next)
      scrollToRow(next)
      e.preventDefault()
    }
    if (e.key === 'k' && selectedIdx > 0) {
      const prev = selectedIdx - 1
      setSelectedIdx(prev)
      scrollToRow(prev)
      e.preventDefault()
    }
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
          <h1 className="text-xl font-bold text-[var(--text-1)]">Explorar Ações</h1>
          <p className="text-[var(--text-small)] text-[var(--text-2)]">
            {sorted.length} ações ranqueadas | Página {page + 1}/{totalPages || 1}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            aria-label="Alternar painel de filtros"
            aria-expanded={showFilters}
            className={cn(
              'px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors',
              showFilters ? 'bg-[var(--accent-1)] text-white border-[var(--accent-1)]' : 'bg-[var(--surface-1)] text-[var(--text-2)] border-[var(--border-1)]'
            )}
          >
            Filtros {showFilters ? '▲' : '▼'}
          </button>
        </div>
      </div>

      {/* ─── Presets de busca rápida ────────────────── */}
      <div className="flex flex-wrap gap-2">
        {[
          { label: 'Melhor IQ-Score', action: () => { setMinScore(70); setSortBy('iq_score'); setSortAsc(false) } },
          { label: 'Maiores Dividendos', action: () => { setMinScore(0); setSortBy('dividend_yield'); setSortAsc(false) } },
          { label: 'Mais Baratas', action: () => { setMinScore(0); setSortBy('safety_margin'); setSortAsc(false) } },
          { label: 'Dividendos Seguros', action: () => { setMinScore(0); setSortBy('dividend_safety'); setSortAsc(false) } },
          { label: 'Todas', action: () => { setMinScore(0); setRatingFilter(''); setClusterId(undefined); setSortBy('iq_score'); setSortAsc(false) } },
        ].map(preset => (
          <button
            key={preset.label}
            onClick={preset.action}
            className="px-3 py-1.5 text-xs font-medium rounded-full border border-[var(--border-1)] bg-[var(--surface-1)] text-[var(--text-2)] hover:bg-[var(--accent-1)] hover:text-white hover:border-[var(--accent-1)] transition-colors"
          >
            {preset.label}
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
                <th className="text-center px-3 py-3.5 text-[var(--text-2)] font-medium hidden lg:table-cell">Setor</th>
                <SortHeader label="IQ-Score" tooltip="Nota geral de 0 a 100 combinando análise quantitativa, qualitativa e de valuation" sortKey="iq_score" current={sortBy} asc={sortAsc} onSort={(k) => { setSortBy(k as SortKey); setSortAsc(sortBy === k ? !sortAsc : false) }} />
                <th className="text-center px-3 py-3.5 text-[var(--text-2)] font-medium">Rating</th>
                <ThWithTooltip label="Quanti" tooltip="Score quantitativo: ROE, margens, crescimento, endividamento" className="hidden xl:table-cell" />
                <ThWithTooltip label="Quali" tooltip="Score qualitativo: governança, vantagens competitivas, gestão" className="hidden xl:table-cell" />
                <ThWithTooltip label="Valuation" tooltip="Score de valuation: desconto vs preço justo (DCF, Gordon, múltiplos)" className="hidden xl:table-cell" />
                <SortHeader label="Desconto" tooltip="Desconto: quanto o preço atual está abaixo do preço justo calculado" sortKey="safety_margin" current={sortBy} asc={sortAsc} onSort={(k) => { setSortBy(k as SortKey); setSortAsc(sortBy === k ? !sortAsc : false) }} className="hidden md:table-cell" />
                <SortHeader label="DY Proj." tooltip="Dividend Yield projetado para os próximos 12 meses" sortKey="dividend_yield" current={sortBy} asc={sortAsc} onSort={(k) => { setSortBy(k as SortKey); setSortAsc(sortBy === k ? !sortAsc : false) }} className="hidden md:table-cell" />
                <SortHeader label="Div Safety" tooltip="Score de segurança do dividendo (0-100): quanto maior, mais sustentável" sortKey="dividend_safety" current={sortBy} asc={sortAsc} onSort={(k) => { setSortBy(k as SortKey); setSortAsc(sortBy === k ? !sortAsc : false) }} className="hidden lg:table-cell" />
                <th className="text-center px-2 py-3.5 text-[var(--text-2)] font-medium w-10"></th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 12 }).map((_, i) => (
                  <tr key={i} className="border-b border-[var(--border-1)]/30">
                    <td className="px-5 py-3.5" colSpan={12}><Skeleton className="h-8" /></td>
                  </tr>
                ))
              ) : paged.length > 0 ? (
                paged.map((r, idx) => (
                  <tr
                    key={r.ticker}
                    ref={(el) => { if (el) rowRefs.current.set(idx, el); else rowRefs.current.delete(idx) }}
                    onClick={() => router.push(`/ativo/${r.ticker}`)}
                    onKeyDown={(e) => { if (e.key === 'Enter') router.push(`/ativo/${r.ticker}`) }}
                    tabIndex={0}
                    role="row"
                    aria-selected={idx === selectedIdx}
                    aria-label={`${r.ticker} — IQ-Score ${r.iq_score}, ${r.rating}`}
                    className={cn(
                      'border-b border-[var(--border-1)]/20 cursor-pointer transition-colors',
                      idx === selectedIdx ? 'bg-[var(--accent-1)]/5 ring-1 ring-[var(--accent-1)]/20' : 'hover:bg-[var(--surface-2)]'
                    )}
                  >
                    <td className="px-5 py-3 text-[var(--text-2)] font-mono text-xs">{page * PAGE_SIZE + idx + 1}</td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-3">
                        <AssetLogo ticker={r.ticker} size={32} />
                        <div>
                          <p className="font-semibold text-[var(--text-1)]">{r.ticker}</p>
                          <p className="text-[var(--text-caption)] text-[var(--text-2)] truncate max-w-[200px]">{r.company_name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-center hidden lg:table-cell">
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
                    <td className="px-3 py-3 text-right font-mono text-sm text-[var(--text-1)] hidden xl:table-cell">{r.score_quanti}</td>
                    <td className="px-3 py-3 text-right font-mono text-sm text-[var(--text-1)] hidden xl:table-cell">{r.score_quali}</td>
                    <td className="px-3 py-3 text-right font-mono text-sm text-[var(--text-1)] hidden xl:table-cell">{r.score_valuation}</td>
                    <td className="px-3 py-3 text-right font-mono text-sm hidden md:table-cell">
                      {r.safety_margin != null ? (
                        <span className={r.safety_margin > 0.15 ? 'text-[var(--pos)]' : r.safety_margin > 0 ? 'text-[var(--accent-1)]' : 'text-[var(--neg)]'}>
                          {(r.safety_margin * 100).toFixed(0)}%
                        </span>
                      ) : <span className="text-[var(--text-2)]">--</span>}
                    </td>
                    <td className="px-3 py-3 text-right font-mono text-sm text-[var(--text-1)] hidden md:table-cell">
                      {r.dividend_yield_proj != null ? `${(r.dividend_yield_proj * 100).toFixed(1)}%` : '--'}
                    </td>
                    <td className="px-3 py-3 text-right font-mono text-sm hidden lg:table-cell">
                      {r.dividend_safety != null ? (
                        <span className={
                          r.dividend_safety >= 70 ? 'text-[var(--pos)]' :
                          r.dividend_safety >= 50 ? 'text-amber-500' :
                          'text-[var(--neg)]'
                        }>{r.dividend_safety}</span>
                      ) : <span className="text-[var(--text-2)]">--</span>}
                    </td>
                    <td className="px-2 py-3 text-center">
                      <button
                        onClick={(e) => { e.stopPropagation(); addMutation.mutate(r.ticker) }}
                        disabled={addMutation.isPending}
                        title={`Adicionar ${r.ticker} à carteira`}
                        className="p-1.5 rounded-lg text-[var(--text-3)] hover:text-[var(--accent-1)] hover:bg-[var(--accent-1)]/10 transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-5 py-12 text-center text-[var(--text-2)]" colSpan={12}>
                    {screenerData?.results !== undefined
                      ? 'Nenhum ativo encontrado com esses filtros. Tente ajustar o IQ-Score mínimo ou o setor.'
                      : 'Erro ao carregar dados. Verifique sua conexão ou tente novamente.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2">
          <span className="text-[var(--text-caption)] text-[var(--text-2)]">
            {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, sorted.length)} de {sorted.length}
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className={cn('px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors', page === 0 ? 'opacity-40 cursor-not-allowed' : 'hover:bg-[var(--surface-2)]')}
              aria-label="Página anterior"
            >
              Anterior
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const p = totalPages <= 5 ? i : Math.max(0, Math.min(page - 2, totalPages - 5)) + i
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={cn(
                    'w-8 h-8 text-xs font-mono rounded-lg transition-colors',
                    page === p ? 'bg-[var(--accent-1)] text-white' : 'hover:bg-[var(--surface-2)] text-[var(--text-2)]'
                  )}
                >
                  {p + 1}
                </button>
              )
            })}
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className={cn('px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors', page >= totalPages - 1 ? 'opacity-40 cursor-not-allowed' : 'hover:bg-[var(--surface-2)]')}
              aria-label="Próxima página"
            >
              Próxima
            </button>
          </div>
        </div>
      )}

      <Disclaimer variant="footer" />
    </div>
  )
}

// ─── Sort Header ─────────────────────────────────────────────
function SortHeader({ label, tooltip, sortKey, current, asc, onSort, className }: {
  label: string; tooltip?: string; sortKey: string; current: string; asc: boolean; onSort: (key: string) => void; className?: string
}) {
  const active = current === sortKey
  return (
    <th
      className={cn("text-right px-3 py-3.5 text-[var(--text-2)] font-medium cursor-pointer hover:text-[var(--text-1)] transition-colors select-none", className)}
      onClick={() => onSort(sortKey)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSort(sortKey) } }}
      tabIndex={0}
      role="columnheader"
      aria-sort={active ? (asc ? 'ascending' : 'descending') : 'none'}
      title={tooltip}
    >
      {label} {active ? (asc ? '↑' : '↓') : ''}
    </th>
  )
}

// ─── Header with tooltip ─────────────────────────────────────
function ThWithTooltip({ label, tooltip, className }: { label: string; tooltip: string; className?: string }) {
  return (
    <th className={cn("text-right px-3 py-3.5 text-[var(--text-2)] font-medium", className)} title={tooltip}>
      {label}
    </th>
  )
}
