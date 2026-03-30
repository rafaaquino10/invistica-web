'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Skeleton, Term } from '@/components/ui'
import { AssetLogo } from '@/components/ui/asset-logo'
import { cn } from '@/lib/utils'
import { pro, free } from '@/lib/api/endpoints'
import { useAuth } from '@/hooks/use-auth'
import { fadeInUp } from '@/lib/utils/motion'
import { toast } from 'sonner'

const RATING_LABELS: Record<string, string> = {
  STRONG_BUY: 'Compra Forte', BUY: 'Acumular', HOLD: 'Neutro',
  REDUCE: 'Reduzir', AVOID: 'Evitar',
}
const RATING_BADGES: Record<string, string> = {
  STRONG_BUY: 'bg-emerald-400/15 text-emerald-400',
  BUY: 'bg-blue-400/15 text-blue-400',
  HOLD: 'bg-amber-400/15 text-amber-400',
  REDUCE: 'bg-orange-400/15 text-orange-400',
  AVOID: 'bg-red-400/15 text-red-400',
}

type SortKey = 'ticker' | 'company_name' | 'cluster' | 'iq_score' | 'rating' | 'score_quanti' | 'score_quali' | 'score_valuation' | 'safety_margin' | 'dividend_yield' | 'dividend_safety'

function scoreColor(v: number | null | undefined) {
  if (v == null) return 'text-[var(--text-3)]'
  if (v >= 70) return 'text-emerald-400'
  if (v >= 50) return 'text-[var(--accent-1)]'
  return 'text-red-400'
}

export default function ExplorerPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { token } = useAuth()
  const queryClient = useQueryClient()

  const [minScore, setMinScore] = useState<number>(0)
  const [ratingFilter, setRatingFilter] = useState<string>('')
  const [clusterId, setClusterId] = useState<number | undefined>()
  const [sortBy, setSortBy] = useState<SortKey>('iq_score')
  const [sortAsc, setSortAsc] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [page, setPage] = useState(0)
  const PAGE_SIZE = 30

  useEffect(() => { setPage(0) }, [minScore, ratingFilter, clusterId, sortBy, sortAsc])

  const { data: clusters } = useQuery({
    queryKey: ['clusters'],
    queryFn: () => free.getClusters().catch(() => null),
  })

  const { data: screenerData, isLoading } = useQuery({
    queryKey: ['screener', minScore, ratingFilter, clusterId],
    queryFn: () => pro.getScreener({
      min_score: minScore || undefined,
      rating: ratingFilter || undefined,
      cluster_id: clusterId,
      limit: 200,
    }, token ?? undefined).catch(() => null),
  })

  const { data: regimeData } = useQuery({
    queryKey: ['macro-regime'],
    queryFn: () => pro.getMacroRegime(token ?? undefined).catch(() => null),
  })

  const addMutation = useMutation({
    mutationFn: (ticker: string) => pro.addPosition({ ticker, qty: 0, avg_price: 0 }, token ?? undefined),
    onSuccess: (_d, ticker) => { queryClient.invalidateQueries({ queryKey: ['portfolio'] }); toast.success(`${ticker} adicionado`) },
    onError: () => toast.error('Erro ao adicionar'),
  })

  const clusterNames = useMemo(() => {
    return clusters?.clusters?.reduce((acc, c) => ({ ...acc, [c.cluster_id]: c.name }), {} as Record<number, string>) ?? {}
  }, [clusters])

  const favoredClusterId = useMemo(() => {
    if (!regimeData?.sector_rotation) return undefined
    const entries = Object.values(regimeData.sector_rotation)
    const best = entries.reduce<{ cluster_id: number; tilt_points: number } | null>((top, e) => {
      if (e.tilt_points > 0 && (!top || e.tilt_points > top.tilt_points)) return e
      return top
    }, null)
    return best?.cluster_id
  }, [regimeData])

  const sorted = useMemo(() => {
    if (!screenerData?.results) return []
    const results = [...screenerData.results]
    results.sort((a, b) => {
      let va: any, vb: any
      switch (sortBy) {
        case 'ticker': va = a.ticker ?? ''; vb = b.ticker ?? ''; break
        case 'company_name': va = a.company_name ?? ''; vb = b.company_name ?? ''; break
        case 'cluster': va = clusterNames[a.cluster_id] ?? ''; vb = clusterNames[b.cluster_id] ?? ''; break
        case 'iq_score': va = a.iq_score ?? -1; vb = b.iq_score ?? -1; break
        case 'rating': {
          const order: Record<string, number> = { STRONG_BUY: 5, BUY: 4, HOLD: 3, REDUCE: 2, AVOID: 1 }
          va = order[a.rating] ?? 0; vb = order[b.rating] ?? 0; break
        }
        case 'score_quanti': va = a.score_quanti ?? -1; vb = b.score_quanti ?? -1; break
        case 'score_quali': va = a.score_quali ?? -1; vb = b.score_quali ?? -1; break
        case 'score_valuation': va = a.score_valuation ?? -1; vb = b.score_valuation ?? -1; break
        case 'safety_margin': va = a.safety_margin ?? -999; vb = b.safety_margin ?? -999; break
        case 'dividend_yield': va = a.dividend_yield_proj ?? -1; vb = b.dividend_yield_proj ?? -1; break
        case 'dividend_safety': va = a.dividend_safety ?? -1; vb = b.dividend_safety ?? -1; break
        default: va = a.iq_score ?? 0; vb = b.iq_score ?? 0
      }
      if (typeof va === 'string') return sortAsc ? va.localeCompare(vb) : vb.localeCompare(va)
      return sortAsc ? va - vb : vb - va
    })
    return results
  }, [screenerData, sortBy, sortAsc, clusterNames])

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE)
  const paged = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  const toggleSort = useCallback((key: SortKey) => {
    if (sortBy === key) setSortAsc(!sortAsc)
    else { setSortBy(key); setSortAsc(false) }
  }, [sortBy, sortAsc])

  const handleCompare = useCallback((ticker: string) => {
    const existing = searchParams.get('compare') ?? ''
    const tickers = existing ? `${existing},${ticker}` : ticker
    router.push(`/comparar?tickers=${tickers}`)
  }, [router, searchParams])

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[var(--text-1)]">Explorar Ações</h1>
          <p className="text-xs text-[var(--text-2)]">{sorted.length} ações ranqueadas pelo IQ-Cognit</p>
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={cn(
            'px-3 py-1.5 text-xs font-medium rounded-xl border transition-colors self-start',
            showFilters ? 'bg-[var(--accent-1)] text-white border-[var(--accent-1)]' : 'bg-[var(--surface-1)] text-[var(--text-2)] border-[var(--border-1)]'
          )}
        >
          Filtros {showFilters ? '\u25B2' : '\u25BC'}
        </button>
      </div>

      {/* Presets */}
      <div className="flex flex-wrap gap-2">
        {[
          { label: 'Melhor IQ-Score', action: () => { setMinScore(60); setSortBy('iq_score'); setSortAsc(false) } },
          { label: 'Maiores Dividendos', action: () => { setMinScore(0); setSortBy('dividend_yield'); setSortAsc(false) } },
          { label: 'Mais Baratas', action: () => { setMinScore(0); setSortBy('safety_margin'); setSortAsc(false) } },
          { label: 'Dividendos Seguros', action: () => { setMinScore(0); setSortBy('dividend_safety'); setSortAsc(false) } },
          ...(favoredClusterId != null ? [{
            label: 'Favorecidos pelo Regime',
            action: () => { setMinScore(0); setRatingFilter(''); setClusterId(favoredClusterId); setSortBy('iq_score'); setSortAsc(false) },
          }] : []),
          { label: 'Todas', action: () => { setMinScore(0); setRatingFilter(''); setClusterId(undefined); setSortBy('iq_score'); setSortAsc(false) } },
        ].map(p => (
          <button key={p.label} onClick={p.action}
            className={cn(
              'px-3 py-1 text-xs font-medium rounded-full border transition-colors',
              p.label === 'Favorecidos pelo Regime'
                ? 'border-emerald-400/40 bg-emerald-400/10 text-emerald-400 hover:bg-emerald-400/20'
                : 'border-[var(--border-1)] bg-[var(--surface-1)] text-[var(--text-2)] hover:bg-[var(--accent-1)] hover:text-white hover:border-[var(--accent-1)]'
            )}>
            {p.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      {showFilters && (
        <motion.div {...fadeInUp} className="bg-[var(--surface-1)] rounded-xl border border-[var(--border-1)] p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-3)] block mb-1">IQ-Score minimo</label>
              <input type="range" min={0} max={100} value={minScore} onChange={(e) => setMinScore(Number(e.target.value))} className="w-full accent-[var(--accent-1)]" />
              <span className="text-[10px] font-mono text-[var(--text-2)]">{minScore}</span>
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-3)] block mb-1">Rating</label>
              <select value={ratingFilter} onChange={(e) => setRatingFilter(e.target.value)}
                className="w-full px-2 py-1.5 text-xs rounded-xl bg-[var(--bg)] border border-[var(--border-1)] text-[var(--text-1)]">
                <option value="">Todos</option>
                {Object.entries(RATING_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-3)] block mb-1">Setor</label>
              <select value={clusterId ?? ''} onChange={(e) => setClusterId(e.target.value ? Number(e.target.value) : undefined)}
                className="w-full px-2 py-1.5 text-xs rounded-xl bg-[var(--bg)] border border-[var(--border-1)] text-[var(--text-1)]">
                <option value="">Todos</option>
                {clusters?.clusters?.map((c) => <option key={c.cluster_id} value={c.cluster_id}>{c.name}</option>)}
              </select>
            </div>
          </div>
        </motion.div>
      )}

      {/* Table */}
      <div className="bg-[var(--surface-1)] rounded-xl shadow-sm border border-[var(--border-1)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="sticky top-0 z-10">
              <tr className="border-b border-[var(--border-1)] bg-[var(--bg)]">
                <th className="text-left px-3 py-2 text-[var(--text-3)] font-medium w-6">#</th>
                <ColHeader label="Ativo" sortKey="ticker" current={sortBy} asc={sortAsc} onClick={toggleSort} align="left" tooltip="Codigo do ativo na B3" />
                <ColHeader label="Setor" sortKey="cluster" current={sortBy} asc={sortAsc} onClick={toggleSort} align="left" className="hidden lg:table-cell" tooltip="Setor/cluster classificado pelo IQ-Cognit" />
                <ColHeader label="IQ" sortKey="iq_score" current={sortBy} asc={sortAsc} onClick={toggleSort} tooltip="Nota geral de 0 a 100 combinando analise de fundamentos, qualidade e valuation" />
                <ColHeader label="Rating" sortKey="rating" current={sortBy} asc={sortAsc} onClick={toggleSort} tooltip="Recomendacao calculada a partir do IQ-Score" />
                <ColHeader label="Quanti" sortKey="score_quanti" current={sortBy} asc={sortAsc} onClick={toggleSort} className="hidden xl:table-cell" tooltip="Score quantitativo: ROE, margens, crescimento, endividamento" />
                <ColHeader label="Quali" sortKey="score_quali" current={sortBy} asc={sortAsc} onClick={toggleSort} className="hidden xl:table-cell" tooltip="Score qualitativo: governanca, vantagens competitivas, gestao" />
                <ColHeader label="Valuation" sortKey="score_valuation" current={sortBy} asc={sortAsc} onClick={toggleSort} className="hidden xl:table-cell" tooltip="Score de valuation: desconto vs preco justo (DCF, Gordon, multiplos)" />
                <ColHeader label="Desconto" sortKey="safety_margin" current={sortBy} asc={sortAsc} onClick={toggleSort} className="hidden md:table-cell" tooltip="Quanto o preco atual esta abaixo do preco justo calculado" />
                <ColHeader label="DY" sortKey="dividend_yield" current={sortBy} asc={sortAsc} onClick={toggleSort} className="hidden md:table-cell" tooltip="Dividend Yield projetado para os proximos 12 meses" />
                <ColHeader label="Div Safe" sortKey="dividend_safety" current={sortBy} asc={sortAsc} onClick={toggleSort} className="hidden lg:table-cell" tooltip="Score de seguranca do dividendo (0-100)" />
                <th className="w-16 px-1"></th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 15 }).map((_, i) => (
                  <tr key={i} className="border-b border-[var(--border-1)]/20"><td colSpan={12} className="px-3 py-2"><Skeleton className="h-5" /></td></tr>
                ))
              ) : paged.length > 0 ? (
                paged.map((r, idx) => (
                  <tr
                    key={r.ticker}
                    onClick={() => router.push(`/ativo/${r.ticker}`)}
                    className={cn(
                      'border-b border-[var(--border-1)]/10 cursor-pointer hover:bg-[var(--surface-2)] transition-colors',
                      idx % 2 === 1 && 'bg-[var(--surface-2)]/20'
                    )}
                  >
                    <td className="px-3 py-2 text-[var(--text-3)] font-mono">{page * PAGE_SIZE + idx + 1}</td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <AssetLogo ticker={r.ticker} size={24} />
                        <div className="min-w-0">
                          <span className="font-semibold text-[var(--text-1)]">{r.ticker}</span>
                          <span className="text-[var(--text-3)] ml-1.5 hidden sm:inline truncate">{r.company_name?.split(' ').slice(0, 3).join(' ')}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2 hidden lg:table-cell">
                      <span className="text-[10px] text-[var(--text-2)] bg-[var(--bg)] px-1.5 py-0.5 rounded">{clusterNames[r.cluster_id]?.split(' ')[0] ?? ''}</span>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span className={cn('font-mono font-bold', scoreColor(r.iq_score))}>
                        {r.iq_score ?? '--'}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded-full', RATING_BADGES[r.rating] ?? 'text-[var(--text-2)]')}>
                        {RATING_LABELS[r.rating] ?? r.rating ?? '--'}
                      </span>
                    </td>
                    <td className={cn('px-3 py-2 text-center font-mono hidden xl:table-cell', scoreColor(r.score_quanti))}>{r.score_quanti ?? '--'}</td>
                    <td className={cn('px-3 py-2 text-center font-mono hidden xl:table-cell', scoreColor(r.score_quali))}>{r.score_quali ?? '--'}</td>
                    <td className={cn('px-3 py-2 text-center font-mono hidden xl:table-cell', scoreColor(r.score_valuation))}>{r.score_valuation ?? '--'}</td>
                    <td className="px-3 py-2 text-right font-mono hidden md:table-cell">
                      {r.safety_margin != null ? (
                        <span className={r.safety_margin > 0 ? 'text-emerald-400' : 'text-red-400'}>
                          {r.safety_margin > 0 ? '+' : ''}{(r.safety_margin * 100).toFixed(0)}%
                        </span>
                      ) : <span className="text-[var(--text-3)]">--</span>}
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-[var(--text-1)] hidden md:table-cell">
                      {r.dividend_yield_proj != null && r.dividend_yield_proj > 0 ? `${(r.dividend_yield_proj * 100).toFixed(1)}%` : '--'}
                    </td>
                    <td className={cn('px-3 py-2 text-center font-mono hidden lg:table-cell', scoreColor(r.dividend_safety))}>
                      {r.dividend_safety != null ? r.dividend_safety : <span className="text-[var(--text-3)]">--</span>}
                    </td>
                    <td className="px-1 py-2">
                      <div className="flex items-center gap-0.5">
                        <button onClick={(e) => { e.stopPropagation(); handleCompare(r.ticker) }}
                          title={`Comparar ${r.ticker}`}
                          className="p-1 rounded text-[var(--text-3)] hover:text-blue-400 hover:bg-blue-400/10 transition-colors">
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); addMutation.mutate(r.ticker) }}
                          title={`Adicionar ${r.ticker}`}
                          className="p-1 rounded text-[var(--text-3)] hover:text-[var(--accent-1)] hover:bg-[var(--accent-1)]/10 transition-colors">
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={12} className="px-3 py-10 text-center text-[var(--text-2)]">
                  {screenerData ? 'Nenhum ativo com esses filtros.' : 'Erro ao carregar. Tente novamente.'}
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs">
          <span className="text-[var(--text-2)] font-mono">{page * PAGE_SIZE + 1}&ndash;{Math.min((page + 1) * PAGE_SIZE, sorted.length)} de {sorted.length}</span>
          <div className="flex gap-1">
            <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
              className={cn('px-2.5 py-1 rounded-xl border border-[var(--border-1)]', page === 0 ? 'opacity-30' : 'hover:bg-[var(--surface-2)] text-[var(--text-2)]')}>Anterior</button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const p = totalPages <= 5 ? i : Math.max(0, Math.min(page - 2, totalPages - 5)) + i
              return (
                <button key={p} onClick={() => setPage(p)}
                  className={cn('w-7 h-7 rounded-xl font-mono', page === p ? 'bg-[var(--accent-1)] text-white' : 'hover:bg-[var(--surface-2)] text-[var(--text-2)]')}>
                  {p + 1}
                </button>
              )
            })}
            <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
              className={cn('px-2.5 py-1 rounded-xl border border-[var(--border-1)]', page >= totalPages - 1 ? 'opacity-30' : 'hover:bg-[var(--surface-2)] text-[var(--text-2)]')}>Proxima</button>
          </div>
        </div>
      )}
    </div>
  )
}

function ColHeader({ label, sortKey, current, asc, onClick, align = 'center', className, tooltip }: {
  label: string; sortKey: SortKey; current: SortKey; asc: boolean; onClick: (k: SortKey) => void; align?: 'left' | 'center' | 'right'; className?: string; tooltip?: string
}) {
  const active = current === sortKey
  return (
    <th
      className={cn(
        `text-${align} px-3 py-2 font-medium cursor-pointer select-none transition-colors`,
        active ? 'text-[var(--accent-1)]' : 'text-[var(--text-3)] hover:text-[var(--text-1)]',
        'text-[10px] font-bold uppercase tracking-wider',
        className
      )}
      onClick={() => onClick(sortKey)}
      title={tooltip}
    >
      {label}{active ? (asc ? ' \u2191' : ' \u2193') : ''}
    </th>
  )
}
