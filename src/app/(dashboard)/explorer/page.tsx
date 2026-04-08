'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  ScreenerPagination,
  type ScreenerFiltersState,
  ColumnSelector,
  useColumnSelector,
  type ColumnKey,
} from '@/components/screener'
import { trpc } from '@/lib/trpc/provider'
import { cn } from '@/lib/utils'
import { formatMarketCap } from '@/lib/utils/formatters'
import { AssetLogo } from '@/components/ui/asset-logo'
import { ScoreBadge, ChangeIndicator, Disclaimer, Tabs, Sparkline } from '@/components/ui'
import { SemaphoreBadge } from '@/components/score/score-semaphore'
import { getScoreBadge } from '@/lib/scoring/score-narrator'
import { Tooltip } from '@/components/ui/tooltip'
import { GLOSSARY } from '@/lib/glossary'

// ─── Lens Tabs ──────────────────────────────────────────────

const LENS_TABS = [
  { id: 'general', label: 'Geral', sortKey: 'scoreTotal' },
  { id: 'value', label: 'Valor', sortKey: 'lensValue' },
  { id: 'dividends', label: 'Dividendos', sortKey: 'lensDividends' },
  { id: 'growth', label: 'Crescimento', sortKey: 'lensGrowth' },
  { id: 'defensive', label: 'Defensiva', sortKey: 'lensDefensive' },
  { id: 'momentum', label: 'Momento', sortKey: 'lensMomentum' },
] as const

// ─── Sort Options ───────────────────────────────────────────

const sortOptions = [
  { value: 'scoreTotal', label: 'IQ-Score' },
  { value: 'ticker', label: 'Ticker' },
  { value: 'changePercent', label: 'Variação' },
  { value: 'marketCap', label: 'Mkt Cap' },
  { value: 'scoreValuation', label: 'Valuation' },
  { value: 'scoreQuality', label: 'Qualidade' },
  { value: 'scoreGrowth', label: 'Quanti' },
  { value: 'scoreDividends', label: 'Dividendos' },
  { value: 'dividendYield', label: 'DY Proj' },
]

// ─── Colunas da tabela (dinâmicas) ──────────────────────────

// Mapeamento de ColumnKey para configuração de coluna da tabela
const COLUMN_CONFIG: Record<ColumnKey, {
  label: string
  align: 'left' | 'right' | 'center'
  hide?: 'lg' | 'xl'
}> = {
  sector:           { label: 'Setor',       align: 'left',   hide: 'lg' },
  close:            { label: 'Preço',       align: 'right' },
  changePercent:    { label: 'Dia',          align: 'center' },
  marketCap:        { label: 'Mkt Cap',      align: 'right',  hide: 'xl' },
  scoreTotal:       { label: 'IQ-Score',     align: 'center' },
  rating:           { label: 'Rating',       align: 'center' },
  scoreQuali:       { label: 'Quali',        align: 'center', hide: 'xl' },
  scoreQuanti:      { label: 'Quanti',       align: 'center', hide: 'xl' },
  scoreValuation:   { label: 'Valuation',    align: 'center', hide: 'xl' },
  fairValue:        { label: 'Fair Value',   align: 'right',  hide: 'lg' },
  safetyMargin:     { label: 'Margem',       align: 'right',  hide: 'lg' },
  dyProj:           { label: 'DY Proj',      align: 'right' },
  dividendSafety:   { label: 'Safety',       align: 'center', hide: 'lg' },
}

// ─── Page ───────────────────────────────────────────────────

export default function ExplorerPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const sectorParam = searchParams.get('sector')

  const [filters, setFilters] = useState<ScreenerFiltersState>(() => ({
    types: [],
    sectors: sectorParam ? [sectorParam] : [],
    sortBy: 'scoreTotal',
    sortOrder: 'desc',
  }))
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(50)
  const [selectedRow, setSelectedRow] = useState(-1)
  // Painel de filtros avançados (colapsável)
  const [showFilters, setShowFilters] = useState(false)
  const [selectedLens, setSelectedLens] = useState('general')

  // Seletor de colunas visíveis (com persistência em localStorage)
  const { visibleColumns, setVisibleColumns } = useColumnSelector()

  useEffect(() => {
    if (sectorParam && !filters.sectors.includes(sectorParam)) {
      setFilters(prev => ({ ...prev, sectors: [sectorParam] }))
    }
  }, [sectorParam])

  const { data: sectorsData } = trpc.assets.getSectors.useQuery()
  const { data: sparklineMap } = trpc.assets.getSparklines.useQuery(undefined, {
    staleTime: 10 * 60 * 1000, // 10min — sparklines mudam lentamente
    refetchOnWindowFocus: false,
  })

  const { data, isLoading } = trpc.screener.query.useQuery({
    types: filters.types.length > 0 ? filters.types : undefined,
    sectors: filters.sectors.length > 0 ? filters.sectors : undefined,
    minScore: filters.minScore,
    maxScore: filters.maxScore,
    minDividendYield: filters.minDividendYield,
    maxDividendYield: filters.maxDividendYield,
    minPeRatio: filters.minPeRatio,
    maxPeRatio: filters.maxPeRatio,
    minRoe: filters.minRoe,
    maxNetDebtEbitda: filters.maxNetDebtEbitda,
    minRoic: filters.minRoic,
    minNetMargin: filters.minNetMargin,
    maxPbRatio: filters.maxPbRatio,
    page,
    pageSize,
    sortBy: filters.sortBy as any,
    sortOrder: filters.sortOrder,
  })

  const handleSort = (column: string) => {
    if (filters.sortBy === column) {
      setFilters({ ...filters, sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc' })
    } else {
      setFilters({ ...filters, sortBy: column, sortOrder: 'desc' })
    }
    setPage(1)
  }

  const handleRowClick = (ticker: string) => {
    router.push(`/ativo/${ticker}`)
  }

  // Atalhos j/k (navegar lista), Enter (abrir ativo)
  const assets = data?.assets ?? []
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
      if (e.ctrlKey || e.metaKey) return

      if (e.key === 'j') {
        e.preventDefault()
        setSelectedRow(prev => Math.min(prev + 1, assets.length - 1))
      } else if (e.key === 'k') {
        e.preventDefault()
        setSelectedRow(prev => Math.max(prev - 1, 0))
      } else if (e.key === 'Enter' && selectedRow >= 0 && selectedRow < assets.length) {
        e.preventDefault()
        const ticker = assets[selectedRow]?.ticker
        if (ticker) router.push(`/ativo/${ticker}`)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [assets, selectedRow, router])

  // Scroll row into view
  useEffect(() => {
    if (selectedRow >= 0) {
      const row = document.querySelector(`[data-row-index="${selectedRow}"]`)
      row?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    }
  }, [selectedRow])

  // Reset selection on page/filter change
  useEffect(() => { setSelectedRow(-1) }, [page, filters])

  const totalAssets = data?.pagination.total ?? 0

  // Contagem de filtros ativos (excluindo ordenação padrão)
  const activeFilterCount = [
    filters.sectors.length > 0,
    filters.sortBy !== 'scoreTotal',
    filters.minScore !== undefined,
    filters.maxScore !== undefined,
    filters.minDividendYield !== undefined,
    filters.maxDividendYield !== undefined,
    filters.minPeRatio !== undefined,
    filters.maxPeRatio !== undefined,
    filters.minRoe !== undefined,
    filters.maxNetDebtEbitda !== undefined,
    filters.minRoic !== undefined,
    filters.minNetMargin !== undefined,
    filters.maxPbRatio !== undefined,
  ].filter(Boolean).length

  const handleExportCSV = () => {
    if (!data?.assets.length) return
    const colLabels: Record<string, string> = {
      close: 'Preço', changePercent: 'Variação %', marketCap: 'Mkt Cap', sector: 'Setor',
      scoreTotal: 'IQ Score', peRatio: 'P/L', pbRatio: 'P/VP', roe: 'ROE %',
      dividendYield: 'DY %', liq2meses: 'Liquidez 2M', lensMomentum: 'Momento',
      crescimentoReceita5a: 'Cresc. Receita 5a %',
    }
    const headers = ['Ticker', 'Nome', ...visibleColumns.map(c => colLabels[c] ?? c)]
    const rows = data.assets.map(asset => {
      const q = asset.latestQuote
      const f = asset.fundamental
      const vals: Record<string, string> = {
        close: q?.close ? Number(q.close).toFixed(2) : '',
        changePercent: q?.changePercent != null ? Number(q.changePercent).toFixed(2) : '',
        marketCap: asset.marketCap ? String(asset.marketCap) : '',
        sector: asset.sector ?? '',
        scoreTotal: asset.aqScore ? String(Math.round(Number(asset.aqScore.scoreTotal))) : '',
        peRatio: f?.peRatio ? Number(f.peRatio).toFixed(2) : '',
        pbRatio: f?.pbRatio ? Number(f.pbRatio).toFixed(2) : '',
        roe: f?.roe ? Number(f.roe).toFixed(2) : '',
        dividendYield: f?.dividendYield ? Number(f.dividendYield).toFixed(2) : '',
        liq2meses: f?.liq2meses ? String(Number(f.liq2meses)) : '',
        lensMomentum: asset.lensScores?.momentum != null ? String(Number(asset.lensScores.momentum)) : '',
        crescimentoReceita5a: f?.crescimentoReceita5a ? Number(f.crescimentoReceita5a).toFixed(2) : '',
      }
      return [asset.ticker, `"${asset.name}"`, ...visibleColumns.map(c => vals[c] ?? '')].join(';')
    })
    const csv = [headers.join(';'), ...rows].join('\n')
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `investiq-explorer-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const SortIcon = ({ column }: { column: string }) => (
    filters.sortBy === column ? (
      <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={cn('inline ml-0.5', filters.sortOrder === 'asc' ? 'rotate-180' : '')}>
        <polyline points="6 9 12 15 18 9" />
      </svg>
    ) : null
  )

  // Coluna de score dinâmica conforme a lente ativa
  const activeLens = LENS_TABS.find(l => l.id === selectedLens) ?? LENS_TABS[0]!
  const scoreLensLabel = selectedLens === 'general'
    ? 'IQ Score'
    : `aQ ${activeLens.label}`

  return (
    <div className="space-y-6">
      {/* ─── Header: título + controles ──────────────────── */}
      <div className="flex flex-col gap-4">
        <div className="flex items-baseline justify-between">
          <h1 className="font-display text-[var(--text-title)] font-bold tracking-tight">Explorer</h1>
          <p className="text-[var(--text-small)] text-[var(--text-3)] font-mono">
            {totalAssets} ações · Ordenado por {sortOptions.find(o => o.value === filters.sortBy)?.label ?? 'Score'}
          </p>
        </div>

        {/* ─── Lens Tabs ───────────────────────────────── */}
        <Tabs
          tabs={LENS_TABS.map(l => ({ id: l.id, label: l.id === 'general' ? 'aQ Geral' : l.label }))}
          defaultTab="general"
          variant="pills"
          size="sm"
          onChange={(id) => {
            const lens = LENS_TABS.find(l => l.id === id)
            if (!lens) return
            setSelectedLens(id)
            setFilters(prev => ({ ...prev, sortBy: lens.sortKey, sortOrder: 'desc' }))
            setPage(1)
          }}
        />

        {/* ─── Barra de filtros — Mobile: compacta | Desktop: completa ── */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Ordenação — sempre visivel */}
          <select
            value={filters.sortBy}
            onChange={(e) => { setFilters({ ...filters, sortBy: e.target.value }); setPage(1) }}
            className="h-9 md:h-8 px-2.5 rounded-md text-sm md:text-[var(--text-small)] font-medium bg-[var(--surface-1)] border border-[var(--border-1)] text-[var(--text-1)] focus:outline-none focus:border-[var(--accent-1)]"
          >
            {sortOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          <button
            onClick={() => setFilters({ ...filters, sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc' })}
            className="h-9 w-9 md:h-8 md:w-8 flex items-center justify-center rounded-md bg-[var(--surface-1)] border border-[var(--border-1)] text-[var(--text-2)] hover:text-[var(--text-1)] transition-colors"
            title={filters.sortOrder === 'asc' ? 'Crescente' : 'Decrescente'}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={cn('transition-transform', filters.sortOrder === 'asc' && 'rotate-180')}>
              <path d="m3 16 4 4 4-4" />
              <path d="M7 20V4" />
            </svg>
          </button>

          {/* Setor — sempre visivel */}
          <select
            value={filters.sectors[0] ?? ''}
            onChange={(e) => {
              setFilters({ ...filters, sectors: e.target.value ? [e.target.value] : [] })
              setPage(1)
            }}
            className="h-9 md:h-8 px-2.5 rounded-md text-sm md:text-[var(--text-small)] font-medium bg-[var(--surface-1)] border border-[var(--border-1)] text-[var(--text-1)] focus:outline-none focus:border-[var(--accent-1)]"
          >
            <option value="">Todos os setores</option>
            {(sectorsData ?? []).map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          {/* Botão "Filtros" — sempre visivel */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              'h-9 md:h-8 px-2.5 rounded-md text-sm md:text-[var(--text-small)] font-medium border transition-colors flex items-center gap-1.5',
              showFilters
                ? 'bg-[var(--accent-1)]/10 border-[var(--accent-1)] text-[var(--accent-1)]'
                : 'bg-[var(--surface-1)] border-[var(--border-1)] text-[var(--text-2)] hover:text-[var(--text-1)]'
            )}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
            </svg>
            Filtros
            {activeFilterCount > 0 && (
              <span className="min-w-[16px] h-4 flex items-center justify-center text-[var(--text-caption)] font-bold rounded-full bg-[var(--accent-1)] text-white px-1">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Desktop-only: score range, por pagina, colunas, CSV */}
          <div className="hidden md:contents">
            <div className="w-px h-5 bg-[var(--border-1)] mx-1" />

            {/* Faixa de Score */}
            <div className="flex items-center gap-1">
              <input
                type="number"
                placeholder="Score min"
                min={0} max={100}
                value={filters.minScore ?? ''}
                onChange={(e) => { setFilters({ ...filters, minScore: e.target.value ? Number(e.target.value) : undefined }); setPage(1) }}
                className="h-8 w-[90px] px-2 rounded-md text-[var(--text-small)] font-mono bg-[var(--surface-1)] border border-[var(--border-1)] text-[var(--text-1)] placeholder:text-[var(--text-3)] focus:outline-none focus:border-[var(--accent-1)]"
              />
              <span className="text-[var(--text-3)] text-[var(--text-caption)]">–</span>
              <input
                type="number"
                placeholder="max"
                min={0} max={100}
                value={filters.maxScore ?? ''}
                onChange={(e) => { setFilters({ ...filters, maxScore: e.target.value ? Number(e.target.value) : undefined }); setPage(1) }}
                className="h-8 w-[70px] px-2 rounded-md text-[var(--text-small)] font-mono bg-[var(--surface-1)] border border-[var(--border-1)] text-[var(--text-1)] placeholder:text-[var(--text-3)] focus:outline-none focus:border-[var(--accent-1)]"
              />
            </div>

            <div className="w-px h-5 bg-[var(--border-1)] mx-1" />

            {/* Por página */}
            <div className="flex items-center gap-1.5">
              <span className="text-[var(--text-caption)] text-[var(--text-3)]">Por página:</span>
              <select
                value={pageSize}
                onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1) }}
                className="h-8 px-2 rounded-md text-[var(--text-small)] font-mono font-medium bg-[var(--surface-1)] border border-[var(--border-1)] text-[var(--text-1)] focus:outline-none focus:border-[var(--accent-1)]"
              >
                {[25, 50, 100].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>

            <div className="w-px h-5 bg-[var(--border-1)] mx-1" />

            {/* Seletor de colunas */}
            <ColumnSelector visibleColumns={visibleColumns} onChange={setVisibleColumns} />

            {/* Export CSV */}
            <button
              onClick={handleExportCSV}
              disabled={!data?.assets.length}
              className="h-8 px-2.5 rounded-md text-[var(--text-small)] font-medium bg-[var(--surface-1)] border border-[var(--border-1)] text-[var(--text-2)] hover:text-[var(--text-1)] transition-colors flex items-center gap-1.5 disabled:opacity-40"
              title="Exportar dados filtrados como CSV"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              CSV
            </button>
          </div>

          {/* Limpar filtros */}
          {activeFilterCount > 0 && (
            <button
              onClick={() => {
                setFilters({ types: [], sectors: [], sortBy: 'scoreTotal', sortOrder: 'desc' })
                setSelectedLens('general')
                setPage(1)
              }}
              className="h-9 md:h-8 px-2 rounded-md text-sm md:text-[var(--text-caption)] text-[var(--text-2)] hover:text-[var(--text-1)] transition-colors"
            >
              Limpar
            </button>
          )}
        </div>

        {/* ─── Painel de filtros avançados (colapsável) ─── */}
        {showFilters && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 pt-2 pb-1 border-t border-[var(--border-1)]">
            {/* Score range — visivel no painel mobile (hidden no desktop pois ja esta na barra) */}
            <div className="md:hidden">
              <label className="text-[var(--text-caption)] text-[var(--text-3)] font-medium mb-1 block">Score min</label>
              <input type="number" min={0} max={100} value={filters.minScore ?? ''}
                onChange={(e) => { setFilters({ ...filters, minScore: e.target.value ? Number(e.target.value) : undefined }); setPage(1) }}
                className="h-9 w-full px-2 rounded-md text-sm font-mono bg-[var(--surface-1)] border border-[var(--border-1)] text-[var(--text-1)] placeholder:text-[var(--text-3)] focus:outline-none focus:border-[var(--accent-1)]"
              />
            </div>
            <div className="md:hidden">
              <label className="text-[var(--text-caption)] text-[var(--text-3)] font-medium mb-1 block">Score max</label>
              <input type="number" min={0} max={100} value={filters.maxScore ?? ''}
                onChange={(e) => { setFilters({ ...filters, maxScore: e.target.value ? Number(e.target.value) : undefined }); setPage(1) }}
                className="h-9 w-full px-2 rounded-md text-sm font-mono bg-[var(--surface-1)] border border-[var(--border-1)] text-[var(--text-1)] placeholder:text-[var(--text-3)] focus:outline-none focus:border-[var(--accent-1)]"
              />
            </div>
            {[
              { key: 'minDividendYield', label: 'DY min %', step: 0.5 },
              { key: 'maxDividendYield', label: 'DY max %', step: 0.5 },
              { key: 'minPeRatio', label: 'P/L min', step: 0.5 },
              { key: 'maxPeRatio', label: 'P/L max', step: 0.5 },
              { key: 'minRoe', label: 'ROE min %', step: 1 },
              { key: 'maxNetDebtEbitda', label: 'Div/EBITDA max', step: 0.5 },
            ].map((f) => (
              <div key={f.key}>
                <label className="text-[var(--text-caption)] text-[var(--text-3)] font-medium mb-1 block">{f.label}</label>
                <input
                  type="number"
                  step={f.step}
                  value={(filters as any)[f.key] ?? ''}
                  onChange={(e) => { setFilters({ ...filters, [f.key]: e.target.value ? Number(e.target.value) : undefined }); setPage(1) }}
                  className="h-9 md:h-8 w-full px-2 rounded-md text-sm md:text-[var(--text-small)] font-mono bg-[var(--surface-1)] border border-[var(--border-1)] text-[var(--text-1)] placeholder:text-[var(--text-3)] focus:outline-none focus:border-[var(--accent-1)]"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ─── Chips de filtros ativos ──────────────────────── */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[var(--text-caption)] text-[var(--text-3)] mr-1">Filtros:</span>
          {filters.sectors.length > 0 && filters.sectors.map(s => (
            <span key={s} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[var(--text-caption)] font-medium bg-[var(--accent-1)]/10 text-[var(--accent-1)] border border-[var(--accent-1)]/20">
              {s}
              <button onClick={() => { setFilters({ ...filters, sectors: filters.sectors.filter(x => x !== s) }); setPage(1) }} className="hover:text-[var(--text-1)] ml-0.5">&times;</button>
            </span>
          ))}
          {filters.minScore !== undefined && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[var(--text-caption)] font-medium bg-[var(--pos)]/10 text-[var(--pos)] border border-[var(--pos)]/20">
              Score &ge; {filters.minScore}
              <button onClick={() => { setFilters({ ...filters, minScore: undefined }); setPage(1) }} className="hover:text-[var(--text-1)] ml-0.5">&times;</button>
            </span>
          )}
          {filters.maxScore !== undefined && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[var(--text-caption)] font-medium bg-[var(--neg)]/10 text-[var(--neg)] border border-[var(--neg)]/20">
              Score &le; {filters.maxScore}
              <button onClick={() => { setFilters({ ...filters, maxScore: undefined }); setPage(1) }} className="hover:text-[var(--text-1)] ml-0.5">&times;</button>
            </span>
          )}
          {filters.minDividendYield !== undefined && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[var(--text-caption)] font-medium bg-amber/10 text-amber border border-amber/20">
              DY &ge; {filters.minDividendYield}%
              <button onClick={() => { setFilters({ ...filters, minDividendYield: undefined }); setPage(1) }} className="hover:text-[var(--text-1)] ml-0.5">&times;</button>
            </span>
          )}
          {filters.minRoe !== undefined && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[var(--text-caption)] font-medium bg-teal/10 text-teal border border-teal/20">
              ROE &ge; {filters.minRoe}%
              <button onClick={() => { setFilters({ ...filters, minRoe: undefined }); setPage(1) }} className="hover:text-[var(--text-1)] ml-0.5">&times;</button>
            </span>
          )}
          {filters.maxPeRatio !== undefined && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[var(--text-caption)] font-medium bg-[var(--surface-2)] text-[var(--text-2)] border border-[var(--border-1)]">
              P/L &le; {filters.maxPeRatio}
              <button onClick={() => { setFilters({ ...filters, maxPeRatio: undefined }); setPage(1) }} className="hover:text-[var(--text-1)] ml-0.5">&times;</button>
            </span>
          )}
          {filters.maxNetDebtEbitda !== undefined && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[var(--text-caption)] font-medium bg-[var(--surface-2)] text-[var(--text-2)] border border-[var(--border-1)]">
              Dív/EBITDA &le; {filters.maxNetDebtEbitda}
              <button onClick={() => { setFilters({ ...filters, maxNetDebtEbitda: undefined }); setPage(1) }} className="hover:text-[var(--text-1)] ml-0.5">&times;</button>
            </span>
          )}
          {filters.minRoic !== undefined && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[var(--text-caption)] font-medium bg-teal/10 text-teal border border-teal/20">
              ROIC &ge; {filters.minRoic}%
              <button onClick={() => { setFilters({ ...filters, minRoic: undefined }); setPage(1) }} className="hover:text-[var(--text-1)] ml-0.5">&times;</button>
            </span>
          )}
          {filters.minNetMargin !== undefined && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[var(--text-caption)] font-medium bg-teal/10 text-teal border border-teal/20">
              Mrg. Líq. &ge; {filters.minNetMargin}%
              <button onClick={() => { setFilters({ ...filters, minNetMargin: undefined }); setPage(1) }} className="hover:text-[var(--text-1)] ml-0.5">&times;</button>
            </span>
          )}
          {filters.maxPbRatio !== undefined && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[var(--text-caption)] font-medium bg-[var(--surface-2)] text-[var(--text-2)] border border-[var(--border-1)]">
              P/VP &le; {filters.maxPbRatio}
              <button onClick={() => { setFilters({ ...filters, maxPbRatio: undefined }); setPage(1) }} className="hover:text-[var(--text-1)] ml-0.5">&times;</button>
            </span>
          )}
          <button
            onClick={() => {
              setFilters({ types: [], sectors: [], sortBy: 'scoreTotal', sortOrder: 'desc' })
              setSelectedLens('general')
              setPage(1)
            }}
            className="text-[var(--text-caption)] text-[var(--text-3)] hover:text-[var(--neg)] transition-colors ml-1"
          >
            Limpar todos
          </button>
        </div>
      )}

      {/* ─── Mobile Card View (< md) ──────────────────────── */}
      <div className="md:hidden space-y-0 border border-[var(--border-1)] rounded-lg overflow-hidden">
        {isLoading ? (
          Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="px-4 py-3 border-b border-[var(--border-1)] last:border-b-0">
              <div className="h-14 bg-[var(--surface-2)]/50 rounded animate-pulse" />
            </div>
          ))
        ) : assets.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-[var(--text-2)]">Nenhum ativo encontrado</div>
        ) : assets.map((asset, rowIndex) => {
          const lensKey = selectedLens as keyof NonNullable<typeof asset.lensScores>
          const score = selectedLens === 'general'
            ? (asset.aqScore ? Number(asset.aqScore.scoreTotal) : null)
            : (asset.lensScores?.[lensKey] != null ? Number(asset.lensScores[lensKey]) : null)
          const q = asset.latestQuote
          const closePrice = q?.close ? Number(q.close) : null
          const changePct = q?.changePercent != null ? Number(q.changePercent) : null
          const f = asset.fundamental
          const dy = f?.dividendYield ? Number(f.dividendYield) : null
          const pe = f?.peRatio ? Number(f.peRatio) : null

          return (
            <button
              key={asset.id}
              onClick={() => handleRowClick(asset.ticker)}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-3 text-left transition-colors border-b border-[var(--border-1)] last:border-b-0',
                'active:bg-[var(--surface-2)]/50',
                selectedRow === rowIndex && 'bg-[var(--accent-1)]/8'
              )}
              data-row-index={rowIndex}
            >
              <AssetLogo ticker={asset.ticker} logo={asset.logo} size={36} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-sm font-mono font-semibold text-[var(--text-1)]">{asset.ticker}</span>
                    {score != null && score > 0 && (
                      <ScoreBadge score={score} size="sm" showLabel={false} />
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <span className="text-sm font-mono text-[var(--text-1)]">
                      {closePrice != null ? `R$ ${closePrice.toFixed(2)}` : '—'}
                    </span>
                    {changePct != null && <ChangeIndicator value={changePct} size="sm" />}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[var(--text-3)] truncate mr-2">{asset.name}</span>
                  <div className="flex items-center gap-2 shrink-0 text-xs text-[var(--text-2)]">
                    {dy != null && dy > 0 && <span>DY {dy.toFixed(1)}%</span>}
                    {pe != null && pe > 0 && pe < 500 && <span>P/L {pe.toFixed(1)}</span>}
                  </div>
                </div>
              </div>
            </button>
          )
        })}

        {data && data.pagination.totalPages > 1 && (
          <div className="px-3 py-2 border-t border-[var(--border-1)] flex items-center justify-between">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page <= 1}
              className="h-9 px-3 rounded-md text-sm font-medium bg-[var(--surface-1)] border border-[var(--border-1)] text-[var(--text-2)] disabled:opacity-30"
            >
              Anterior
            </button>
            <span className="text-xs text-[var(--text-3)]">
              Pagina {data.pagination.page} de {data.pagination.totalPages}
            </span>
            <button
              onClick={() => setPage(Math.min(data.pagination.totalPages, page + 1))}
              disabled={page >= data.pagination.totalPages}
              className="h-9 px-3 rounded-md text-sm font-medium bg-[var(--surface-1)] border border-[var(--border-1)] text-[var(--text-2)] disabled:opacity-30"
            >
              Proximo
            </button>
          </div>
        )}
      </div>

      {/* ─── Desktop Table View (>= md) ──────────────────── */}
      <div className="hidden md:block border border-[var(--border-1)] rounded-lg overflow-hidden">
        {data && data.pagination.totalPages > 1 && (
          <div className="px-3 py-2 border-b border-[var(--border-1)]">
            <ScreenerPagination
              page={data.pagination.page}
              pageSize={data.pagination.pageSize}
              total={data.pagination.total}
              totalPages={data.pagination.totalPages}
              onPageChange={setPage}
              onPageSizeChange={(size) => { setPageSize(size); setPage(1) }}
            />
          </div>
        )}

        {/* Scroll horizontal — mínimo 800px para não comprimir colunas em mobile */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]" aria-label="Lista de ações — use j/k para navegar, Enter para abrir">
            <thead>
              <tr className="border-b border-[var(--border-1)]">
                {/* Coluna Ativo sempre visível */}
                <th className="px-3 py-2.5 text-[var(--text-caption)] font-semibold uppercase tracking-wider text-[var(--text-3)] text-left whitespace-nowrap cursor-pointer hover:text-[var(--text-1)] transition-colors select-none"
                  onClick={() => handleSort('ticker')}
                >
                  Ativo<SortIcon column="ticker" />
                </th>

                {/* Colunas dinâmicas conforme seleção do usuário */}
                {visibleColumns.map((colKey) => {
                  const cfg = COLUMN_CONFIG[colKey]
                  if (!cfg) return null
                  // A coluna scoreTotal usa o label da lente ativa
                  const label = colKey === 'scoreTotal' ? scoreLensLabel : cfg.label
                  // A coluna scoreTotal usa a sortKey da lente ativa
                  const sortKey = colKey === 'scoreTotal' ? activeLens.sortKey : colKey
                  return (
                    <th
                      key={colKey}
                      className={cn(
                        'px-3 py-2.5 text-[var(--text-caption)] font-semibold uppercase tracking-wider text-[var(--text-3)] whitespace-nowrap',
                        'cursor-pointer hover:text-[var(--text-1)] transition-colors select-none',
                        cfg.align === 'right' && 'text-right',
                        cfg.align === 'center' && 'text-center',
                        cfg.align === 'left' && 'text-left',
                        cfg.hide === 'lg' && 'hidden lg:table-cell',
                        cfg.hide === 'xl' && 'hidden xl:table-cell',
                      )}
                      onClick={() => !cfg.noSort && handleSort(sortKey)}
                    >
                      {cfg.glossaryKey && GLOSSARY[cfg.glossaryKey] ? (
                        <Tooltip content={<span className="text-xs max-w-[220px] whitespace-normal">{GLOSSARY[cfg.glossaryKey]}</span>} position="bottom">
                          <span className="border-b border-dotted border-[var(--text-3)]/30">{label}</span>
                        </Tooltip>
                      ) : label}
                      {!cfg.noSort && <SortIcon column={sortKey} />}
                    </th>
                  )
                })}

                {/* Rating badge já é coluna própria */}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 20 }).map((_, i) => (
                  <tr key={i} className="border-b border-[var(--border-1)]">
                    <td colSpan={visibleColumns.length + 2} className="px-3 py-2">
                      <div className="h-5 bg-[var(--surface-2)]/50 rounded animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : data?.assets.map((asset, rowIndex) => {
                const score = asset.aqScore ? Number(asset.aqScore.scoreTotal) : null
                const q = asset.latestQuote
                const closePrice = q?.close ? Number(q.close) : null
                const changePct = q?.changePercent != null ? Number(q.changePercent) : null
                const aq = asset.aqScore
                const val = (asset as any).valuation
                const ratingLabel = (asset as any).ratingLabel ?? (asset as any).rating ?? null
                const dy = asset.fundamental?.dividendYield ? Number(asset.fundamental.dividendYield) : null

                return (
                  <tr
                    key={asset.id}
                    data-row-index={rowIndex}
                    onClick={() => handleRowClick(asset.ticker)}
                    className={cn(
                      "border-b border-[var(--border-1)] hover:bg-[var(--surface-2)]/30 cursor-pointer transition-colors group",
                      selectedRow === rowIndex && "bg-[var(--accent-1)]/8 ring-1 ring-inset ring-[var(--accent-1)]/30"
                    )}
                  >
                    {/* Ativo — sempre visível */}
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2.5">
                        <AssetLogo ticker={asset.ticker} logo={asset.logo} size={28} />
                        <div className="min-w-0">
                          <div className="text-[var(--text-small)] font-mono font-medium group-hover:text-[var(--accent-1)] transition-colors leading-tight">{asset.ticker}</div>
                          <div className="text-[10px] text-[var(--text-3)] truncate max-w-[160px] leading-tight">
                            {asset.name}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Colunas dinâmicas */}
                    {visibleColumns.map((colKey) => {
                      switch (colKey) {
                        case 'sector':
                          return (
                            <td key={colKey} className="px-3 py-3 hidden lg:table-cell">
                              <span className="text-[var(--text-small)] text-[var(--text-2)]">{asset.sector}</span>
                            </td>
                          )
                        case 'close':
                          return (
                            <td key={colKey} className="px-3 py-3 text-right">
                              <span className="font-mono text-[var(--text-small)] text-[var(--text-1)]">
                                {closePrice != null && closePrice > 0 ? `R$ ${closePrice.toFixed(2)}` : '—'}
                              </span>
                            </td>
                          )

                        case 'changePercent':
                          return (
                            <td key={colKey} className="px-3 py-3">
                              <div className="flex items-center justify-center gap-1.5">
                                {closePrice != null && changePct != null ? (
                                  <>
                                    <Sparkline
                                      points={sparklineMap?.[asset.ticker]}
                                      ticker={asset.ticker}
                                      changePercent={changePct}
                                      close={closePrice}
                                    />
                                    <ChangeIndicator value={changePct} size="sm" />
                                  </>
                                ) : (
                                  <span className="text-[var(--text-small)] text-[var(--text-3)]">—</span>
                                )}
                              </div>
                            </td>
                          )

                        case 'marketCap':
                          return (
                            <td key={colKey} className="px-3 py-3 text-right font-mono text-[var(--text-small)] text-[var(--text-2)] hidden xl:table-cell">
                              {asset.marketCap ? formatMarketCap(asset.marketCap) : '—'}
                            </td>
                          )

                        case 'sector':
                          return (
                            <td key={colKey} className="px-3 py-3 hidden lg:table-cell">
                              <span className="text-[var(--text-small)] text-[var(--text-2)]">
                                {asset.sector ?? '—'}
                              </span>
                            </td>
                          )

                        case 'scoreTotal':
                          return (
                            <td key={colKey} className="px-3 py-3">
                              <div className="flex items-center justify-center">
                                <ScoreBadge
                                  score={score && score > 0 ? score : null}
                                  size="sm"
                                  showBar
                                  showLabel={false}
                                  tooltip={score && score > 0 ? `Score aQ: ${Math.round(score)}/100` : undefined}
                                />
                              </div>
                            </td>
                          )

                        case 'rating': {
                          const RATING_COLORS: Record<string, string> = {
                            'STRONG_BUY': 'text-teal bg-teal/10 border-teal/20',
                            'BUY': 'text-teal bg-teal/10 border-teal/20',
                            'HOLD': 'text-amber bg-amber/10 border-amber/20',
                            'REDUCE': 'text-red bg-red/10 border-red/20',
                            'AVOID': 'text-red bg-red/10 border-red/20',
                          }
                          const rKey = (asset as any).rating ?? ''
                          const rColor = RATING_COLORS[rKey] ?? 'text-[var(--text-3)] bg-[var(--surface-2)]'
                          return (
                            <td key={colKey} className="px-3 py-3">
                              {ratingLabel ? (
                                <div className="flex justify-center">
                                  <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded border', rColor)}>
                                    {ratingLabel}
                                  </span>
                                </div>
                              ) : <span className="text-[var(--text-small)] text-[var(--text-3)] text-center block">—</span>}
                            </td>
                          )
                        }

                        case 'scoreQuali': {
                          const v = aq?.scoreQuality != null ? Number(aq.scoreQuality) : null
                          return (
                            <td key={colKey} className={cn('px-3 py-3 text-center font-mono text-[var(--text-small)] hidden xl:table-cell',
                              v != null && v >= 70 ? 'text-teal' : v != null && v >= 40 ? 'text-amber' : v != null ? 'text-red' : 'text-[var(--text-3)]'
                            )}>
                              {v != null ? v.toFixed(0) : '—'}
                            </td>
                          )
                        }

                        case 'scoreQuanti': {
                          const v = aq?.scoreGrowth != null ? Number(aq.scoreGrowth) : null
                          return (
                            <td key={colKey} className={cn('px-3 py-3 text-center font-mono text-[var(--text-small)] hidden xl:table-cell',
                              v != null && v >= 70 ? 'text-teal' : v != null && v >= 40 ? 'text-amber' : v != null ? 'text-red' : 'text-[var(--text-3)]'
                            )}>
                              {v != null ? v.toFixed(0) : '—'}
                            </td>
                          )
                        }

                        case 'scoreValuation': {
                          const v = aq?.scoreValuation != null ? Number(aq.scoreValuation) : null
                          return (
                            <td key={colKey} className={cn('px-3 py-3 text-center font-mono text-[var(--text-small)] hidden xl:table-cell',
                              v != null && v >= 70 ? 'text-teal' : v != null && v >= 40 ? 'text-amber' : v != null ? 'text-red' : 'text-[var(--text-3)]'
                            )}>
                              {v != null ? v.toFixed(0) : '—'}
                            </td>
                          )
                        }

                        case 'fairValue': {
                          const fv = val?.fairValueFinal != null ? Number(val.fairValueFinal) : null
                          return (
                            <td key={colKey} className="px-3 py-3 text-right font-mono text-[var(--text-small)] text-[var(--text-2)] hidden lg:table-cell">
                              {fv != null && fv > 0 ? `R$ ${fv.toFixed(2)}` : '—'}
                            </td>
                          )
                        }

                        case 'safetyMargin': {
                          const sm = val?.safetyMargin != null ? Number(val.safetyMargin) * 100 : null
                          return (
                            <td key={colKey} className={cn('px-3 py-3 text-right font-mono text-[var(--text-small)] hidden lg:table-cell',
                              sm != null && sm > 20 ? 'text-teal' : sm != null && sm > 0 ? 'text-amber' : sm != null ? 'text-red' : 'text-[var(--text-3)]'
                            )}>
                              {sm != null ? `${sm.toFixed(1)}%` : '—'}
                            </td>
                          )
                        }

                        case 'dyProj':
                          return (
                            <td key={colKey} className={cn('px-3 py-3 text-right font-mono text-[var(--text-small)]',
                              dy != null && dy >= 6 ? 'text-teal font-semibold' : dy != null && dy > 0 ? 'text-[var(--text-2)]' : 'text-[var(--text-3)]'
                            )}>
                              {dy != null && dy > 0 ? `${dy.toFixed(1)}%` : '—'}
                            </td>
                          )

                        case 'dividendSafety': {
                          const ds = aq?.scoreDividends != null ? Number(aq.scoreDividends) : null
                          return (
                            <td key={colKey} className={cn('px-3 py-3 text-center font-mono text-[var(--text-small)] hidden lg:table-cell',
                              ds != null && ds >= 70 ? 'text-teal' : ds != null && ds >= 40 ? 'text-amber' : ds != null ? 'text-red' : 'text-[var(--text-3)]'
                            )}>
                              {ds != null && ds > 0 ? ds.toFixed(0) : '—'}
                            </td>
                          )
                        }

                        default:
                          return null
                      }
                    })}

                    {/* Rating já é coluna própria — diagnóstico removido */}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {data && data.pagination.totalPages > 1 && (
          <div className="px-3 py-2 border-t border-[var(--border-1)]">
            <ScreenerPagination
              page={data.pagination.page}
              pageSize={data.pagination.pageSize}
              total={data.pagination.total}
              totalPages={data.pagination.totalPages}
              onPageChange={setPage}
              onPageSizeChange={(size) => { setPageSize(size); setPage(1) }}
            />
          </div>
        )}
      </div>

    </div>
  )
}
