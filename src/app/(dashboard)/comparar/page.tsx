'use client'

import { useState, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { Button, Input, Term } from '@/components/ui'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/hooks/use-auth'
import { free, pro } from '@/lib/api/endpoints'
import { cn } from '@/lib/utils'
import { AssetLogo } from '@/components/ui/asset-logo'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip as RechartsTooltip, Legend, CartesianGrid } from 'recharts'

const MAX_ASSETS = 5
const COLORS = ['#1A73E8', '#0D9488', '#D97706', '#EF4444', '#8B5CF6']
const RANGES = [
  { label: '1M', days: 30 },
  { label: '3M', days: 90 },
  { label: '6M', days: 180 },
  { label: '1A', days: 365 },
]

const RATING_LABELS: Record<string, string> = {
  STRONG_BUY: 'Compra Forte', BUY: 'Acumular', HOLD: 'Neutro', REDUCE: 'Reduzir', AVOID: 'Evitar',
}
const RATING_COLORS: Record<string, string> = {
  STRONG_BUY: 'text-emerald-600', BUY: 'text-blue-600', HOLD: 'text-amber-600', REDUCE: 'text-orange-600', AVOID: 'text-red-600',
}

export default function ComparisonPage() {
  const [tickers, setTickers] = useState<string[]>([])
  const [query, setQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [rangeIdx, setRangeIdx] = useState(3)
  const { token } = useAuth()

  const { data: searchData } = useQuery({
    queryKey: ['compare-search', query],
    queryFn: () => free.searchTickers(query, 10),
    enabled: query.length >= 1,
  })
  const results = (searchData?.results ?? []).filter(t => !tickers.includes(t.ticker))

  // Use /scores/compare endpoint — returns ALL data in one call
  const { data: compareData, isLoading } = useQuery({
    queryKey: ['compare', tickers],
    queryFn: () => pro.compareScores(tickers.join(','), token ?? undefined).catch(() => null),
    enabled: tickers.length >= 2,
  })

  // Fallback: individual score queries for tickers not in compare result
  const { data: individualScores } = useQuery({
    queryKey: ['compare-individual', tickers],
    queryFn: async () => {
      const compareTickers = (compareData?.tickers ?? []).map((t: any) => t.ticker)
      const missing = tickers.filter(t => !compareTickers.includes(t))
      if (missing.length === 0) return []
      const results = await Promise.all(
        missing.map(async (ticker) => {
          const [tickerData, quote] = await Promise.all([
            free.getTicker(ticker).catch(() => null),
            free.getQuote(ticker).catch(() => null),
          ])
          return tickerData ? {
            ticker,
            company_name: tickerData.company_name,
            cluster_id: tickerData.cluster_id,
            close: quote?.close ?? null,
            market_cap: quote?.market_cap ?? null,
            iq_score: null, rating: null, score_quanti: null, score_quali: null, score_valuation: null,
            fair_value_final: null, safety_margin: null, dividend_yield_proj: null, dividend_safety: null,
            roe: null, dl_ebitda: null, net_margin: null, piotroski: null,
          } : null
        })
      )
      return results.filter(Boolean)
    },
    enabled: tickers.length >= 2 && !!compareData,
  })

  // Merge compare + individual data
  const assets = useMemo(() => {
    const fromCompare = compareData?.tickers ?? []
    const fromIndividual = individualScores ?? []
    const all = [...fromCompare, ...fromIndividual]
    // Sort by ticker order
    return tickers.map(t => all.find((a: any) => a.ticker === t)).filter(Boolean) as any[]
  }, [compareData, individualScores, tickers])

  // History queries (padded to MAX_ASSETS for stable hook count)
  const padded = useMemo(() => {
    const p = [...tickers]; while (p.length < MAX_ASSETS) p.push(''); return p
  }, [tickers])
  const days = RANGES[rangeIdx]!.days
  const h0 = useQuery({ queryKey: ['h', padded[0], days], queryFn: () => free.getHistory(padded[0]!, days), enabled: !!padded[0] && tickers.length >= 2 })
  const h1 = useQuery({ queryKey: ['h', padded[1], days], queryFn: () => free.getHistory(padded[1]!, days), enabled: !!padded[1] && tickers.length >= 2 })
  const h2 = useQuery({ queryKey: ['h', padded[2], days], queryFn: () => free.getHistory(padded[2]!, days), enabled: !!padded[2] && tickers.length >= 2 })
  const h3 = useQuery({ queryKey: ['h', padded[3], days], queryFn: () => free.getHistory(padded[3]!, days), enabled: !!padded[3] && tickers.length >= 2 })
  const h4 = useQuery({ queryKey: ['h', padded[4], days], queryFn: () => free.getHistory(padded[4]!, days), enabled: !!padded[4] && tickers.length >= 2 })
  const histQ = [h0, h1, h2, h3, h4].slice(0, tickers.length)

  const chartData = useMemo(() => {
    if (tickers.length < 2 || !histQ.every(q => q.data)) return []
    const series = tickers.map((t, i) => {
      const raw = histQ[i]?.data
      const data: any[] = Array.isArray(raw) ? raw : (raw?.data ?? [])
      return { ticker: t, data }
    })
    const ref = series[0]
    if (!ref?.data.length) return []
    return ref.data.map((p: any, idx: number) => {
      const entry: Record<string, any> = { date: new Date(p.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) }
      for (const s of series) {
        const base = s.data[0]?.close
        const cur = s.data[idx]
        if (base && cur) entry[s.ticker] = Number(((cur.close / base - 1) * 100).toFixed(2))
      }
      return entry
    })
  }, [tickers, histQ])

  const add = useCallback((t: string) => {
    if (tickers.length < MAX_ASSETS && !tickers.includes(t)) setTickers([...tickers, t])
    setQuery(''); setSearching(false)
  }, [tickers])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[var(--text-1)]">Comparar Ativos</h1>
          <p className="text-[var(--text-caption)] text-[var(--text-2)]">Até {MAX_ASSETS} ações lado a lado com fundamentos e performance</p>
        </div>
        {tickers.length > 0 && <Button variant="ghost" size="sm" onClick={() => setTickers([])}>Limpar</Button>}
      </div>

      {/* Selector */}
      <div className="flex flex-wrap items-center gap-2 p-3 border border-[var(--border-1)] rounded-[var(--radius)] bg-[var(--surface-1)] relative">
        {tickers.map((t, i) => (
          <div key={t} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[var(--surface-2)]" style={{ borderLeft: `3px solid ${COLORS[i]}` }}>
            <AssetLogo ticker={t} size={20} />
            <span className="font-mono text-xs font-semibold">{t}</span>
            <button onClick={() => setTickers(tickers.filter(x => x !== t))} className="p-0.5 hover:bg-[var(--border-1)] rounded">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        ))}
        {tickers.length < MAX_ASSETS && (
          <div className="relative">
            <Input type="text" placeholder="+ Adicionar" value={query}
              onChange={e => { setQuery(e.target.value); setSearching(true) }}
              onFocus={() => setSearching(true)}
              className="w-36 text-xs" />
            {searching && results.length > 0 && (
              <div className="absolute top-full left-0 mt-1 w-64 bg-[var(--surface-1)] border border-[var(--border-1)] rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
                {results.map((r: any) => (
                  <button key={r.ticker} onClick={() => add(r.ticker)}
                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[var(--surface-2)] text-xs text-left">
                    <AssetLogo ticker={r.ticker} size={20} />
                    <span className="font-mono font-semibold">{r.ticker}</span>
                    <span className="text-[var(--text-2)] truncate">{r.company_name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Empty State */}
      {tickers.length < 2 && (
        <div className="py-16 text-center border border-dashed border-[var(--border-1)] rounded-[var(--radius)]">
          <p className="text-sm text-[var(--text-2)]">Adicione pelo menos 2 ativos para comparar</p>
        </div>
      )}

      {/* Comparison Table */}
      {assets.length >= 2 && (
        <div className="bg-[var(--surface-1)] rounded-[var(--radius)] border border-[var(--border-1)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[var(--border-1)] bg-[var(--bg)]">
                  <th className="text-left px-4 py-3 text-[var(--text-2)] font-medium w-32">Indicador</th>
                  {assets.map((a: any, i: number) => (
                    <th key={a.ticker} className="text-center px-3 py-3 font-medium" style={{ color: COLORS[i] }}>
                      <Link href={`/ativo/${a.ticker}`} className="hover:underline flex items-center justify-center gap-1.5">
                        <AssetLogo ticker={a.ticker} size={18} />
                        {a.ticker}
                      </Link>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <SectionHeader label="Score IQ-Cognit" cols={assets.length} />
                <MetricRow label={<Term>IQ-Score</Term>} values={assets.map((a: any) => a.iq_score)} format={v => String(v)} best="high" colors={COLORS} />
                <MetricRow label="Rating" values={assets.map((a: any) => a.rating)} format={v => RATING_LABELS[v] ?? '--'} colorFn={(v) => RATING_COLORS[v] ?? ''} colors={COLORS} />
                <MetricRow label={<Term>Quantitativo</Term>} values={assets.map((a: any) => a.score_quanti)} format={v => `${v}/100`} best="high" colors={COLORS} />
                <MetricRow label={<Term>Qualitativo</Term>} values={assets.map((a: any) => a.score_quali)} format={v => `${v}/100`} best="high" colors={COLORS} />
                <MetricRow label={<Term>Valuation</Term>} values={assets.map((a: any) => a.score_valuation)} format={v => `${v}/100`} best="high" colors={COLORS} />

                <SectionHeader label="Preço e Valuation" cols={assets.length} />
                <MetricRow label="Preço" values={assets.map((a: any) => a.close)} format={v => `R$ ${Number(v).toFixed(2)}`} colors={COLORS} />
                <MetricRow label={<Term>Preço Justo</Term>} values={assets.map((a: any) => a.fair_value_final)} format={v => `R$ ${Number(v).toFixed(2)}`} colors={COLORS} />
                <MetricRow label={<Term>Desconto</Term>} values={assets.map((a: any) => a.safety_margin)} format={v => `${(Number(v) * 100).toFixed(0)}%`} best="high" colors={COLORS} />
                <MetricRow label="Mkt Cap" values={assets.map((a: any) => a.market_cap)} format={v => {
                  const n = Number(v); if (n >= 1e9) return `R$ ${(n/1e9).toFixed(1)}B`; if (n >= 1e6) return `R$ ${(n/1e6).toFixed(0)}M`; return `R$ ${n}`
                }} colors={COLORS} />

                <SectionHeader label="Rentabilidade" cols={assets.length} />
                <MetricRow label={<Term>ROE</Term>} values={assets.map((a: any) => a.roe)} format={v => `${(Number(v)*100).toFixed(1)}%`} best="high" colors={COLORS} />
                <MetricRow label="Margem Líq." values={assets.map((a: any) => a.net_margin)} format={v => `${(Number(v)*100).toFixed(1)}%`} best="high" colors={COLORS} />
                <MetricRow label={<Term>DL/EBITDA</Term>} values={assets.map((a: any) => a.dl_ebitda)} format={v => `${Number(v).toFixed(1)}x`} best="low" colors={COLORS} />
                <MetricRow label={<Term>Piotroski</Term>} values={assets.map((a: any) => a.piotroski)} format={v => `${v}/9`} best="high" colors={COLORS} />

                <SectionHeader label="Dividendos" cols={assets.length} />
                <MetricRow label={<Term>DY Proj.</Term>} values={assets.map((a: any) => a.dividend_yield_proj)} format={v => `${(Number(v)*100).toFixed(1)}%`} best="high" colors={COLORS} />
                <MetricRow label={<Term>Dividend Safety</Term>} values={assets.map((a: any) => a.dividend_safety)} format={v => `${v}/100`} best="high" colors={COLORS} />
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Performance Chart */}
      {chartData.length > 0 && (
        <div className="bg-[var(--surface-1)] rounded-[var(--radius)] border border-[var(--border-1)] p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-[var(--text-1)]">Performance Comparada</h2>
            <div className="flex gap-1">
              {RANGES.map((r, i) => (
                <button key={r.label} onClick={() => setRangeIdx(i)}
                  className={cn('px-2 py-1 text-[10px] font-mono rounded', i === rangeIdx ? 'bg-[var(--accent-1)] text-white' : 'text-[var(--text-2)] hover:bg-[var(--surface-2)]')}>
                  {r.label}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-1)" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--text-2)' }} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 10, fill: 'var(--text-2)' }} tickFormatter={v => `${v > 0 ? '+' : ''}${v}%`} />
              <RechartsTooltip contentStyle={{ background: 'var(--surface-1)', border: '1px solid var(--border-1)', borderRadius: 8, fontSize: 11 }}
                formatter={(value: number, name: string) => [`${value > 0 ? '+' : ''}${value.toFixed(1)}%`, name]} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              {tickers.map((t, i) => (
                <Line key={t} type="monotone" dataKey={t} stroke={COLORS[i]} strokeWidth={2} dot={false} />
              ))}
              <Line type="monotone" dataKey="_zero" stroke="var(--text-3)" strokeDasharray="5 5" strokeWidth={1} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}

// ─── Table Components ────────────────────────────────────────
function SectionHeader({ label, cols }: { label: string; cols: number }) {
  return (
    <tr className="bg-[var(--bg)]">
      <td colSpan={cols + 1} className="px-4 py-2 text-[10px] font-semibold text-[var(--text-2)] uppercase tracking-wider">{label}</td>
    </tr>
  )
}

function MetricRow({ label, values, format, best, colorFn, colors }: {
  label: React.ReactNode; values: any[]; format: (v: any) => string; best?: 'high' | 'low'; colorFn?: (v: any) => string; colors: string[]
}) {
  const numericValues = values.map(v => (v != null && !isNaN(Number(v))) ? Number(v) : null)
  let bestIdx = -1
  if (best) {
    const valid = numericValues.map((v, i) => ({ v, i })).filter((x): x is { v: number; i: number } => x.v !== null)
    if (valid.length >= 2) {
      valid.sort((a, b) => best === 'high' ? b.v - a.v : a.v - b.v)
      bestIdx = valid[0]!.i
    }
  }

  return (
    <tr className="border-b border-[var(--border-1)]/30 hover:bg-[var(--surface-2)]/50">
      <td className="px-4 py-2 text-[var(--text-2)] font-medium">{label}</td>
      {values.map((v, i) => (
        <td key={i} className={cn('text-center px-3 py-2 font-mono',
          v == null ? 'text-[var(--text-3)]' : i === bestIdx ? 'font-bold text-[var(--pos)]' : 'text-[var(--text-1)]',
          colorFn && v != null ? colorFn(v) : ''
        )}>
          {v != null ? format(v) : '--'}
        </td>
      ))}
    </tr>
  )
}
