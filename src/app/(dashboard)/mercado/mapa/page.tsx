'use client'

import { useState, useMemo } from 'react'
import { MarketTreemap, type ColorMode } from '@/components/treemap/market-treemap'
import { cn } from '@/lib/utils'
import { formatMarketCap } from '@/lib/utils/formatters'

const COLOR_MODES: { value: ColorMode; label: string }[] = [
  { value: 'change', label: 'Variação' },
  { value: 'score', label: 'IQ-Score' },
  { value: 'sector', label: 'Setor' },
]

const MIN_MARKET_CAP_OPTIONS = [
  { value: 0, label: 'Todas' },
  { value: 100e6, label: '> R$ 100M' },
  { value: 500e6, label: '> R$ 500M' },
  { value: 1e9, label: '> R$ 1B' },
  { value: 10e9, label: '> R$ 10B' },
]

export default function MapaPage() {
  const [colorMode, setColorMode] = useState<ColorMode>('change')
  const [minMarketCap, setMinMarketCap] = useState(0)
  const [minScore, setMinScore] = useState<number | undefined>(undefined)
  const [sectorFilter, setSectorFilter] = useState<string>('')

  const { data, isLoading } = { data: undefined, isLoading: false }

  // Agrupar setores < 3% market cap total em "Outros"
  const consolidatedSectors = useMemo(() => {
    if (!data) return []
    const totalMktCap = data.sectors.reduce((sum, s) => sum + s.totalMarketCap, 0)
    const threshold = totalMktCap * 0.03

    const main = data.sectors.filter(s => s.totalMarketCap >= threshold)
    const small = data.sectors.filter(s => s.totalMarketCap < threshold)

    if (small.length === 0) return data.sectors

    const otherStocks = small.flatMap(s => s.stocks)
    const otherMktCap = small.reduce((sum, s) => sum + s.totalMarketCap, 0)
    const otherAvgScore = otherStocks.length > 0
      ? otherStocks.reduce((s, st) => s + (st.aqScore ?? 0), 0) / otherStocks.length
      : null
    const otherAvgChange = otherStocks.length > 0
      ? otherStocks.reduce((s, st) => s + st.changePercent * st.marketCap, 0) / otherMktCap
      : 0

    return [
      ...main,
      {
        name: 'Outros',
        totalMarketCap: otherMktCap,
        averageScore: otherAvgScore,
        averageChange: otherAvgChange,
        stockCount: otherStocks.length,
        stocks: otherStocks,
      },
    ]
  }, [data])

  const sectorNames = useMemo(() => {
    return consolidatedSectors.map(s => s.name).sort()
  }, [consolidatedSectors])

  // Summary stats
  const summary = useMemo(() => {
    if (!data) return null
    const allStocks = consolidatedSectors.flatMap(s => s.stocks)
    const validStocks = allStocks.filter(s => {
      if (minMarketCap > 0 && s.marketCap < minMarketCap) return false
      if (minScore !== undefined && (s.aqScore === null || s.aqScore < minScore)) return false
      if (sectorFilter && !consolidatedSectors.find(sec => sec.name === sectorFilter)?.stocks.includes(s)) return false
      return true
    })

    const biggestGainer = validStocks.reduce<typeof validStocks[0] | null>(
      (best, s) => (!best || s.changePercent > best.changePercent ? s : best), null
    )
    const biggestLoser = validStocks.reduce<typeof validStocks[0] | null>(
      (best, s) => (!best || s.changePercent < best.changePercent ? s : best), null
    )

    return { biggestGainer, biggestLoser }
  }, [data, consolidatedSectors, minMarketCap, minScore, sectorFilter])

  return (
    <div className="space-y-6">
      {/* ─── Header ──────────────────────────────────────── */}
      <div className="flex flex-col gap-1">
        <div className="flex items-baseline justify-between">
          <h1 className="font-display text-[var(--text-title)] font-bold tracking-tight">Mapa do Mercado</h1>
          {data && (
            <p className="text-[var(--text-small)] text-[var(--text-2)]">
              {data.totals.stockCount} ações
              {' · '}
              {formatMarketCap(data.totals.marketCap)} market cap
              {data.totals.averageScore !== null && (
                <> {' · '} IQ-Score médio: <span className="font-mono font-semibold">{data.totals.averageScore}</span></>
              )}
            </p>
          )}
        </div>
        <p className="text-[var(--text-caption)] text-[var(--text-3)]">
          Visualize todas as ações da B3 por valor de mercado. Quanto maior a área, maior o market cap.
        </p>
      </div>

      {/* ─── Controls ────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Color mode toggle */}
        <div className="flex rounded-md border border-[var(--border-1)] overflow-hidden">
          {COLOR_MODES.map(mode => (
            <button
              key={mode.value}
              onClick={() => setColorMode(mode.value)}
              className={cn(
                'px-3 py-1.5 text-[var(--text-small)] font-medium transition-colors',
                colorMode === mode.value
                  ? 'bg-[var(--accent-1)]/15 text-[var(--accent-1)]'
                  : 'text-[var(--text-2)] hover:text-[var(--text-1)] hover:bg-[var(--surface-2)]/50'
              )}
            >
              {mode.label}
            </button>
          ))}
        </div>

        <div className="w-px h-5 bg-[var(--border-1)]/30" />

        {/* Min market cap */}
        <select
          value={minMarketCap}
          onChange={(e) => setMinMarketCap(Number(e.target.value))}
          className="h-8 px-2.5 rounded-md text-[var(--text-small)] font-medium bg-[var(--surface-1)] border border-[var(--border-1)] text-[var(--text-1)] focus:outline-none focus:border-[var(--accent-1)]/40"
        >
          {MIN_MARKET_CAP_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>

        {/* Sector filter */}
        <select
          value={sectorFilter}
          onChange={(e) => setSectorFilter(e.target.value)}
          className="h-8 px-2.5 rounded-md text-[var(--text-small)] font-medium bg-[var(--surface-1)] border border-[var(--border-1)] text-[var(--text-1)] focus:outline-none focus:border-[var(--accent-1)]/40"
        >
          <option value="">Todos os setores</option>
          {sectorNames.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        {/* Min score */}
        <div className="flex items-center gap-1.5">
          <label className="text-[var(--text-caption)] text-[var(--text-3)]">Score min:</label>
          <input
            type="number"
            placeholder="--"
            min={0}
            max={100}
            value={minScore ?? ''}
            onChange={(e) => setMinScore(e.target.value ? Number(e.target.value) : undefined)}
            className="h-8 w-[70px] px-2 rounded-md text-[var(--text-small)] font-mono bg-[var(--surface-1)] border border-[var(--border-1)] text-[var(--text-1)] placeholder:text-[var(--text-2)]/40 focus:outline-none focus:border-[var(--accent-1)]/40"
          />
        </div>
      </div>

      {/* ─── Legend ───────────────────────────────────────── */}
      <div className="flex items-center gap-4 text-[var(--text-caption)] text-[var(--text-3)]">
        {colorMode === 'change' && (
          <>
            <span>Legenda:</span>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-sm" style={{ background: '#C62828' }} />
              <span>&lt; -3%</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-sm" style={{ background: '#F44336' }} />
              <span>-3% a -1%</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-sm" style={{ background: '#EF5350' }} />
              <span>-1% a 0%</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-sm" style={{ background: '#66BB6A' }} />
              <span>0% a +1%</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-sm" style={{ background: '#4CAF50' }} />
              <span>+1% a +3%</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-sm" style={{ background: '#00C853' }} />
              <span>&gt; +3%</span>
            </div>
          </>
        )}
        {colorMode === 'score' && (
          <>
            <span>Legenda:</span>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-sm" style={{ background: '#EF4444' }} />
              <span>Crítico (0-30)</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-sm" style={{ background: '#FB923C' }} />
              <span>Atenção (31-60)</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-sm" style={{ background: '#4ADE80' }} />
              <span>Saudável (61-80)</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-sm" style={{ background: '#00D4AA' }} />
              <span>Excepcional (81+)</span>
            </div>
          </>
        )}
        {colorMode === 'sector' && (
          <span>Cada cor representa um setor diferente. Passe o mouse para detalhes.</span>
        )}
      </div>

      {/* ─── Treemap ─────────────────────────────────────── */}
      {isLoading ? (
        <div className="w-full h-[500px] rounded-lg shadow-sm bg-[var(--surface-1)] border border-[var(--border-1)] flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-[var(--accent-1)]/30 border-t-[var(--accent-1)] rounded-full animate-spin" />
            <span className="text-[var(--text-small)] text-[var(--text-3)]">Carregando mapa do mercado...</span>
          </div>
        </div>
      ) : data ? (
        <div className="border border-[var(--border-1)] rounded-lg overflow-hidden">
          <MarketTreemap
            sectors={consolidatedSectors}
            colorMode={colorMode}
            minMarketCap={minMarketCap}
            minScore={minScore}
            sectorFilter={sectorFilter || undefined}
          />
        </div>
      ) : null}

      {/* ─── Summary Cards ───────────────────────────────── */}
      {data && summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* Biggest Gainer */}
          <div className="bg-[var(--surface-1)] border border-[var(--border-1)] rounded-lg shadow-sm px-4 py-3">
            <p className="text-[var(--text-caption)] text-[var(--text-3)] uppercase tracking-wider mb-1">Maior Alta</p>
            {summary.biggestGainer ? (
              <div>
                <span className="text-[var(--text-small)] font-bold">{summary.biggestGainer.ticker}</span>
                <span className="ml-2 text-[var(--text-small)] font-mono text-teal">
                  +{summary.biggestGainer.changePercent.toFixed(2)}%
                </span>
              </div>
            ) : (
              <span className="text-[var(--text-small)] text-[var(--text-3)]">--</span>
            )}
          </div>

          {/* Biggest Loser */}
          <div className="bg-[var(--surface-1)] border border-[var(--border-1)] rounded-lg shadow-sm px-4 py-3">
            <p className="text-[var(--text-caption)] text-[var(--text-3)] uppercase tracking-wider mb-1">Maior Queda</p>
            {summary.biggestLoser ? (
              <div>
                <span className="text-[var(--text-small)] font-bold">{summary.biggestLoser.ticker}</span>
                <span className="ml-2 text-[var(--text-small)] font-mono text-red">
                  {summary.biggestLoser.changePercent.toFixed(2)}%
                </span>
              </div>
            ) : (
              <span className="text-[var(--text-small)] text-[var(--text-3)]">--</span>
            )}
          </div>

          {/* Average Score */}
          <div className="bg-[var(--surface-1)] border border-[var(--border-1)] rounded-lg shadow-sm px-4 py-3">
            <p className="text-[var(--text-caption)] text-[var(--text-3)] uppercase tracking-wider mb-1">IQ-Score Médio</p>
            <span className="text-[var(--text-small)] font-mono font-bold" style={{ color: data.totals.averageScore ? (data.totals.averageScore >= 60 ? '#4ADE80' : '#FB923C') : undefined }}>
              {data.totals.averageScore ?? '--'}
            </span>
          </div>

          {/* Sectors Up/Down */}
          <div className="bg-[var(--surface-1)] border border-[var(--border-1)] rounded-lg shadow-sm px-4 py-3">
            <p className="text-[var(--text-caption)] text-[var(--text-3)] uppercase tracking-wider mb-1">Setores</p>
            <div className="flex items-center gap-3 text-[var(--text-small)]">
              <span className="text-teal font-mono font-medium">{data.totals.sectorsUp} em alta</span>
              <span className="text-[var(--text-3)]">/</span>
              <span className="text-red font-mono font-medium">{data.totals.sectorsDown} em queda</span>
            </div>
          </div>
        </div>
      )}

      {/* ─── Footer ──────────────────────────────────────── */}
      <p className="text-[var(--text-caption)] text-[var(--text-3)] px-1">
        Tamanho proporcional ao market cap. Fonte: CVM + brapi. Atualizado em tempo real.
      </p>
    </div>
  )
}
