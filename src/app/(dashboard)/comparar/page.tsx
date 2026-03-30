'use client'

import { useState, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { Button, Input, Term } from '@/components/ui'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/hooks/use-auth'
import { free, pro } from '@/lib/api/endpoints'
import { cn } from '@/lib/utils'
import { AssetLogo } from '@/components/ui/asset-logo'
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, Tooltip as RTooltip, Legend, CartesianGrid,
} from 'recharts'

const MAX = 5
const C = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#a78bfa']
const RANGES = [{ l: '1M', d: 30 }, { l: '3M', d: 90 }, { l: '6M', d: 180 }, { l: '1A', d: 365 }]
const RL: Record<string, string> = { STRONG_BUY: 'Compra Forte', BUY: 'Acumular', HOLD: 'Neutro', REDUCE: 'Reduzir', AVOID: 'Evitar' }
const RC: Record<string, string> = {
  STRONG_BUY: 'text-emerald-400 bg-emerald-400/10',
  BUY: 'text-blue-400 bg-blue-400/10',
  HOLD: 'text-amber-400 bg-amber-400/10',
  REDUCE: 'text-orange-400 bg-orange-400/10',
  AVOID: 'text-red-400 bg-red-400/10',
}

function fmtBig(v: number | null): string {
  if (v == null) return '--'
  if (Math.abs(v) >= 1e12) return `R$ ${(v / 1e12).toFixed(1)}T`
  if (Math.abs(v) >= 1e9) return `R$ ${(v / 1e9).toFixed(1)}B`
  if (Math.abs(v) >= 1e6) return `R$ ${(v / 1e6).toFixed(0)}M`
  return `R$ ${v.toFixed(0)}`
}

export default function ComparisonPage() {
  const [tickers, setTickers] = useState<string[]>([])
  const [query, setQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [ri, setRi] = useState(3)
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})
  const { token } = useAuth()

  const { data: searchData } = useQuery({
    queryKey: ['cs', query], queryFn: () => free.searchTickers(query, 10), enabled: query.length >= 1,
  })
  const sr = (searchData?.results ?? []).filter(t => !tickers.includes(t.ticker))

  // Main comparison data
  const { data: cmp } = useQuery({
    queryKey: ['cmp', tickers],
    queryFn: () => pro.compareScores(tickers.join(','), token ?? undefined).catch(() => null),
    enabled: tickers.length >= 2,
  })

  // Padded array for stable hook count
  const pad = useMemo(() => { const p = [...tickers]; while (p.length < MAX) p.push(''); return p }, [tickers])

  // Risk metrics per ticker (parallel) — stable hook count
  const rq0 = useQuery({ queryKey: ['rm', pad[0]], queryFn: () => pro.getRiskMetrics(pad[0]!, token ?? undefined).catch(() => null), enabled: !!pad[0] && tickers.length >= 2, retry: 0 })
  const rq1 = useQuery({ queryKey: ['rm', pad[1]], queryFn: () => pro.getRiskMetrics(pad[1]!, token ?? undefined).catch(() => null), enabled: !!pad[1] && tickers.length >= 2, retry: 0 })
  const rq2 = useQuery({ queryKey: ['rm', pad[2]], queryFn: () => pro.getRiskMetrics(pad[2]!, token ?? undefined).catch(() => null), enabled: !!pad[2] && tickers.length >= 2, retry: 0 })
  const rq3 = useQuery({ queryKey: ['rm', pad[3]], queryFn: () => pro.getRiskMetrics(pad[3]!, token ?? undefined).catch(() => null), enabled: !!pad[3] && tickers.length >= 2, retry: 0 })
  const rq4 = useQuery({ queryKey: ['rm', pad[4]], queryFn: () => pro.getRiskMetrics(pad[4]!, token ?? undefined).catch(() => null), enabled: !!pad[4] && tickers.length >= 2, retry: 0 })

  // Trap risk per ticker — stable hook count
  const tq0 = useQuery({ queryKey: ['tr', pad[0]], queryFn: () => pro.getDividendTrapRisk(pad[0]!, token ?? undefined).catch(() => null), enabled: !!pad[0] && tickers.length >= 2, retry: 0 })
  const tq1 = useQuery({ queryKey: ['tr', pad[1]], queryFn: () => pro.getDividendTrapRisk(pad[1]!, token ?? undefined).catch(() => null), enabled: !!pad[1] && tickers.length >= 2, retry: 0 })
  const tq2 = useQuery({ queryKey: ['tr', pad[2]], queryFn: () => pro.getDividendTrapRisk(pad[2]!, token ?? undefined).catch(() => null), enabled: !!pad[2] && tickers.length >= 2, retry: 0 })
  const tq3 = useQuery({ queryKey: ['tr', pad[3]], queryFn: () => pro.getDividendTrapRisk(pad[3]!, token ?? undefined).catch(() => null), enabled: !!pad[3] && tickers.length >= 2, retry: 0 })
  const tq4 = useQuery({ queryKey: ['tr', pad[4]], queryFn: () => pro.getDividendTrapRisk(pad[4]!, token ?? undefined).catch(() => null), enabled: !!pad[4] && tickers.length >= 2, retry: 0 })

  // Financials per ticker — stable hook count
  const fq0 = useQuery({ queryKey: ['fi', pad[0]], queryFn: () => free.getFinancials(pad[0]!, 4).catch(() => null), enabled: !!pad[0] && tickers.length >= 2, retry: 0 })
  const fq1 = useQuery({ queryKey: ['fi', pad[1]], queryFn: () => free.getFinancials(pad[1]!, 4).catch(() => null), enabled: !!pad[1] && tickers.length >= 2, retry: 0 })
  const fq2 = useQuery({ queryKey: ['fi', pad[2]], queryFn: () => free.getFinancials(pad[2]!, 4).catch(() => null), enabled: !!pad[2] && tickers.length >= 2, retry: 0 })
  const fq3 = useQuery({ queryKey: ['fi', pad[3]], queryFn: () => free.getFinancials(pad[3]!, 4).catch(() => null), enabled: !!pad[3] && tickers.length >= 2, retry: 0 })
  const fq4 = useQuery({ queryKey: ['fi', pad[4]], queryFn: () => free.getFinancials(pad[4]!, 4).catch(() => null), enabled: !!pad[4] && tickers.length >= 2, retry: 0 })

  // History per ticker — stable hook count
  const days = RANGES[ri]!.d
  const hq0 = useQuery({ queryKey: ['h', pad[0], days], queryFn: () => free.getHistory(pad[0]!, days).catch(() => null), enabled: !!pad[0] && tickers.length >= 2, retry: 0 })
  const hq1 = useQuery({ queryKey: ['h', pad[1], days], queryFn: () => free.getHistory(pad[1]!, days).catch(() => null), enabled: !!pad[1] && tickers.length >= 2, retry: 0 })
  const hq2 = useQuery({ queryKey: ['h', pad[2], days], queryFn: () => free.getHistory(pad[2]!, days).catch(() => null), enabled: !!pad[2] && tickers.length >= 2, retry: 0 })
  const hq3 = useQuery({ queryKey: ['h', pad[3], days], queryFn: () => free.getHistory(pad[3]!, days).catch(() => null), enabled: !!pad[3] && tickers.length >= 2, retry: 0 })
  const hq4 = useQuery({ queryKey: ['h', pad[4], days], queryFn: () => free.getHistory(pad[4]!, days).catch(() => null), enabled: !!pad[4] && tickers.length >= 2, retry: 0 })

  // Sensitivity (macro scenarios)
  const { data: sensitivityData } = useQuery({
    queryKey: ['sens'],
    queryFn: () => pro.getSensitivity(token ?? undefined).catch(() => null),
    enabled: tickers.length >= 2,
    retry: 0,
  })

  // Clusters (for mapping sector names to IDs)
  const { data: clustersData } = useQuery({
    queryKey: ['clusters'],
    queryFn: () => free.getClusters().catch(() => null),
    enabled: tickers.length >= 2,
    retry: 0,
  })

  const assets = useMemo(() => (cmp?.tickers ?? []) as any[], [cmp])
  const riskData = [rq0, rq1, rq2, rq3, rq4].slice(0, tickers.length).map(q => q.data)
  const trapData = [tq0, tq1, tq2, tq3, tq4].slice(0, tickers.length).map(q => q.data)
  const finData = [fq0, fq1, fq2, fq3, fq4].slice(0, tickers.length).map(q => q.data)
  const histQueries = [hq0, hq1, hq2, hq3, hq4].slice(0, tickers.length)

  // Build cluster_id -> name map and name -> cluster_id map
  const clusterMap = useMemo(() => {
    const byId: Record<number, string> = {}
    const byName: Record<string, number> = {}
    for (const c of clustersData?.clusters ?? []) {
      byId[c.cluster_id] = c.name
      byName[c.name.toLowerCase()] = c.cluster_id
    }
    return { byId, byName }
  }, [clustersData])

  // Performance chart data
  const chartData = useMemo(() => {
    if (tickers.length < 2 || !histQueries.every(q => q.data)) return []
    const series = tickers.map((t, i) => {
      const raw = histQueries[i]?.data
      return { ticker: t, data: (Array.isArray(raw) ? raw : (raw as any)?.data ?? []) as any[] }
    })
    const ref = series[0]
    if (!ref?.data.length) return []
    return ref.data.map((p: any, idx: number) => {
      const e: Record<string, any> = { date: new Date(p.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) }
      for (const s of series) {
        const base = s.data[0]?.close; const cur = s.data[idx]
        if (base && cur) e[s.ticker] = Number(((cur.close / base - 1) * 100).toFixed(2))
      }
      return e
    })
  }, [tickers, histQueries])

  // Revenue evolution chart data
  const revenueData = useMemo(() => {
    if (tickers.length < 2) return []
    const periods = new Set<string>()
    finData.forEach((fd) => {
      (fd?.financials ?? []).forEach((f: any) => { if (f.period) periods.add(f.period.slice(0, 7)) })
    })
    const sortedPeriods = Array.from(periods).sort().slice(-4)
    return sortedPeriods.map(p => {
      const entry: Record<string, any> = { period: p.replace('-', '/').slice(2) }
      tickers.forEach((t, i) => {
        const fin = (finData[i]?.financials ?? []).find((f: any) => f.period?.startsWith(p))
        entry[`${t}_rev`] = fin?.revenue ? Number(fin.revenue) / 1e6 : null
        entry[`${t}_ni`] = fin?.net_income ? Number(fin.net_income) / 1e6 : null
      })
      return entry
    })
  }, [tickers, finData])

  // Verdict text
  const verdict = useMemo(() => {
    if (assets.length < 2) return null
    const valid = assets.filter((a: any) => a.iq_score != null)
    if (valid.length < 2) return null
    const best = valid.reduce((a: any, b: any) => (a.iq_score ?? 0) > (b.iq_score ?? 0) ? a : b)
    const bestROE = valid.reduce((a: any, b: any) => (a.roe ?? 0) > (b.roe ?? 0) ? a : b)
    const bestDY = valid.reduce((a: any, b: any) => (a.dividend_yield_proj ?? 0) > (b.dividend_yield_proj ?? 0) ? a : b)
    const bestMargin = valid.filter((a: any) => a.safety_margin != null && a.safety_margin > 0).sort((a: any, b: any) => (b.safety_margin ?? 0) - (a.safety_margin ?? 0))[0]
    const worstHealth = valid.filter((a: any) => a.piotroski != null).sort((a: any, b: any) => (a.piotroski ?? 9) - (b.piotroski ?? 9))[0]

    let text = `Entre os ${valid.length} ativos comparados, ${best.ticker} tem o maior IQ-Score (${best.iq_score}).`
    if (bestROE.ticker !== best.ticker && bestROE.roe) text += ` ${bestROE.ticker} lidera em rentabilidade (ROE ${(bestROE.roe * 100).toFixed(1)}%).`
    if (bestDY.ticker !== best.ticker && bestDY.dividend_yield_proj) text += ` ${bestDY.ticker} oferece o maior dividend yield projetado (${(bestDY.dividend_yield_proj * 100).toFixed(1)}%).`
    if (bestMargin) text += ` ${bestMargin.ticker} negocia com o maior desconto em relação ao preço justo (${(bestMargin.safety_margin * 100).toFixed(0)}%).`
    if (worstHealth && worstHealth.piotroski < 5) text += ` Atenção: ${worstHealth.ticker} apresenta saúde financeira frágil (Piotroski ${worstHealth.piotroski}/9).`
    return text
  }, [assets])

  // Sensitivity scenarios mapped to compared assets
  const sensitivityRows = useMemo(() => {
    if (!sensitivityData?.scenarios || assets.length < 2) return []
    return sensitivityData.scenarios.slice(0, 4).map(sc => {
      const affectedClusterIds = new Set<number>()
      for (const sectorName of sc.affected_sectors) {
        const cid = clusterMap.byName[sectorName.toLowerCase()]
        if (cid != null) affectedClusterIds.add(cid)
      }
      const impacts = assets.map((a: any) => ({
        ticker: a.ticker as string,
        clusterName: clusterMap.byId[a.cluster_id as number] ?? 'Setor desconhecido',
        affected: affectedClusterIds.has(a.cluster_id as number),
      }))
      return { ...sc, impacts }
    })
  }, [sensitivityData, assets, clusterMap])

  const add = useCallback((t: string) => {
    if (tickers.length < MAX && !tickers.includes(t)) setTickers([...tickers, t])
    setQuery(''); setSearching(false)
  }, [tickers])

  const toggle = (k: string) => setCollapsed(p => ({ ...p, [k]: !p[k] }))

  return (
    <div className="space-y-8">
      {/* ─── Section 1: Header + Asset Selector ──────────────── */}
      <div className="bg-[var(--surface-1)] border border-[var(--border-1)] rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-[var(--text-1)]">Comparar Ativos</h1>
            <p className="text-xs text-[var(--text-2)] mt-0.5">Análise completa lado a lado com fundamentos, risco e performance</p>
          </div>
          {tickers.length > 0 && <Button variant="ghost" size="sm" onClick={() => setTickers([])}>Limpar</Button>}
        </div>

        <div className="flex flex-wrap items-center gap-2 relative">
          {tickers.map((t, i) => (
            <div key={t} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[var(--surface-2)] border border-[var(--border-1)]"
              style={{ borderLeftWidth: 3, borderLeftColor: C[i] }}>
              <AssetLogo ticker={t} size={20} />
              <span className="font-mono text-xs font-semibold text-[var(--text-1)]">{t}</span>
              <button onClick={() => setTickers(tickers.filter(x => x !== t))} className="p-0.5 hover:bg-[var(--border-1)] rounded-lg ml-1 text-[var(--text-3)] hover:text-[var(--text-1)] transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
          ))}
          {tickers.length < MAX && (
            <div className="relative">
              <Input type="text" placeholder="+ Adicionar ativo" value={query}
                onChange={e => { setQuery(e.target.value.toUpperCase()); setSearching(true) }}
                onFocus={() => setSearching(true)} onBlur={() => setTimeout(() => setSearching(false), 200)}
                className="w-44 text-xs rounded-xl" />
              {searching && sr.length > 0 && (
                <div className="absolute top-full left-0 mt-1 w-72 bg-[var(--surface-1)] border border-[var(--border-1)] rounded-xl shadow-2xl z-50 max-h-52 overflow-y-auto">
                  {sr.map((r: any) => (
                    <button key={r.ticker} onMouseDown={() => add(r.ticker)}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-[var(--surface-2)] text-xs text-left transition-colors first:rounded-t-xl last:rounded-b-xl">
                      <AssetLogo ticker={r.ticker} size={22} />
                      <span className="font-mono font-bold text-[var(--text-1)]">{r.ticker}</span>
                      <span className="text-[var(--text-2)] truncate">{r.company_name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {tickers.length < 2 && (
        <div className="py-20 text-center border border-dashed border-[var(--border-1)] rounded-xl bg-[var(--surface-1)]">
          <div className="text-4xl mb-3 opacity-20">&#x2194;</div>
          <p className="text-sm text-[var(--text-2)]">Adicione pelo menos 2 ativos para comparar</p>
          <p className="text-[11px] text-[var(--text-3)] mt-1">Suporta ate {MAX} ativos simultaneamente</p>
        </div>
      )}

      {assets.length >= 2 && (
        <>
          {/* ─── Section 2: Summary Cards ──────────────────── */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-3)] mb-3">Resumo</p>
            <div className={cn('grid gap-3', assets.length <= 2 ? 'grid-cols-2' : assets.length === 3 ? 'grid-cols-3' : assets.length === 4 ? 'grid-cols-2 lg:grid-cols-4' : 'grid-cols-2 lg:grid-cols-5')}>
              {assets.map((a: any, i: number) => {
                const isBest = assets.every((b: any) => (a.iq_score ?? 0) >= (b.iq_score ?? 0))
                return (
                  <Link key={a.ticker} href={`/ativo/${a.ticker}`}
                    className={cn('rounded-xl border p-4 transition-all hover:scale-[1.02] group relative overflow-hidden',
                      isBest ? 'border-emerald-400/40 shadow-[0_0_20px_rgba(52,211,153,0.08)]' : 'border-[var(--border-1)]')}
                    style={{ background: `linear-gradient(135deg, ${C[i]}08, transparent 60%)` }}>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-1 h-8 rounded-full" style={{ backgroundColor: C[i] }} />
                      <AssetLogo ticker={a.ticker} size={28} />
                      <div className="min-w-0">
                        <p className="font-bold text-sm text-[var(--text-1)] group-hover:text-[var(--accent-1)] transition-colors">{a.ticker}</p>
                        <p className="text-[10px] text-[var(--text-2)] truncate">{a.company_name?.split(' ').slice(0, 3).join(' ')}</p>
                      </div>
                      {isBest && (
                        <span className="ml-auto text-[9px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full">Top</span>
                      )}
                    </div>
                    <div className="flex items-end justify-between">
                      <p className="font-mono text-sm text-[var(--text-2)]">R$ {a.close?.toFixed(2) ?? '--'}</p>
                      <div className="text-right">
                        <p className={cn('font-mono text-2xl font-bold',
                          (a.iq_score ?? 0) >= 70 ? 'text-emerald-400' : (a.iq_score ?? 0) >= 50 ? 'text-blue-400' : 'text-[var(--text-3)]')}>
                          {a.iq_score ?? '--'}
                        </p>
                        <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded-full inline-block', RC[a.rating] ?? 'text-[var(--text-3)]')}>
                          {RL[a.rating] ?? '--'}
                        </span>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>

          {/* ─── Section 3: AI Comparative Verdict ──────────── */}
          {verdict && (
            <div className="rounded-xl border border-[var(--border-1)] bg-[var(--surface-1)] p-5 border-l-[3px] border-l-[var(--accent-1)]">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-[var(--accent-1)]/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-[var(--accent-1)] font-bold text-xs">IQ</span>
                </div>
                <div>
                  <p className="text-xs font-bold text-[var(--accent-1)] mb-1.5 uppercase tracking-wider">Analise Comparativa IQ-Cognit</p>
                  <p className="text-sm text-[var(--text-1)] leading-relaxed">{verdict}</p>
                </div>
              </div>
            </div>
          )}

          {/* ─── Section 4: Analytical Table ───────────────── */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-3)] mb-3">Indicadores Detalhados</p>
            <div className="bg-[var(--surface-1)] rounded-xl border border-[var(--border-1)] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-[var(--border-1)]">
                      <th className="text-left px-4 py-3 text-[var(--text-3)] font-medium text-[10px] uppercase tracking-wider w-40">Indicador</th>
                      {assets.map((a: any, i: number) => (
                        <th key={a.ticker} className="text-center px-3 py-3 font-semibold" style={{ color: C[i] }}>
                          <div className="flex items-center justify-center gap-1.5">
                            <AssetLogo ticker={a.ticker} size={16} />
                            <span className="font-mono">{a.ticker}</span>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {/* IQ-Cognit Score */}
                    <GroupHeader label="IQ-Cognit Score" k="iq" collapsed={collapsed} toggle={toggle} cols={assets.length} />
                    {!collapsed['iq'] && <>
                      <MR label={<Term>IQ-Score</Term>} vals={assets.map((a: any) => a.iq_score)} fmt={v => String(v)} best="h" />
                      <MR label="Rating" vals={assets.map((a: any) => a.rating)} fmt={v => RL[v] ?? '--'} colorFn={v => RC[v]?.split(' ')[0] ?? ''} />
                      <MR label={<Term>Quantitativo</Term>} vals={assets.map((a: any) => a.score_quanti)} fmt={v => `${v}`} best="h" />
                      <MR label={<Term>Qualitativo</Term>} vals={assets.map((a: any) => a.score_quali)} fmt={v => `${v}`} best="h" />
                      <MR label={<Term>Valuation</Term>} vals={assets.map((a: any) => a.score_valuation)} fmt={v => `${v}`} best="h" />
                    </>}

                    {/* Preco & Valuation */}
                    <GroupHeader label="Preco & Valuation" k="pv" collapsed={collapsed} toggle={toggle} cols={assets.length} />
                    {!collapsed['pv'] && <>
                      <MR label="Preco" vals={assets.map((a: any) => a.close)} fmt={v => `R$ ${Number(v).toFixed(2)}`} />
                      <MR label={<Term>Preco Justo</Term>} vals={assets.map((a: any) => a.fair_value_final)} fmt={v => `R$ ${Number(v).toFixed(2)}`} />
                      <MR label={<Term>Desconto</Term>} vals={assets.map((a: any) => a.safety_margin)} fmt={v => `${(Number(v) * 100).toFixed(0)}%`} best="h" />
                      <MR label={<Term>Upside Prob.</Term>} vals={assets.map((a: any) => a.upside_prob)} fmt={v => `${(Number(v) * 100).toFixed(0)}%`} best="h" />
                      <MR label={<Term>Loss Prob.</Term>} vals={assets.map((a: any) => a.loss_prob)} fmt={v => `${(Number(v) * 100).toFixed(0)}%`} best="l" />
                      <MR label="Market Cap" vals={assets.map((a: any) => a.market_cap)} fmt={v => fmtBig(Number(v))} />
                    </>}

                    {/* Rentabilidade */}
                    <GroupHeader label="Rentabilidade" k="re" collapsed={collapsed} toggle={toggle} cols={assets.length} />
                    {!collapsed['re'] && <>
                      <MR label={<Term>ROE</Term>} vals={assets.map((a: any) => a.roe)} fmt={v => `${(Number(v) * 100).toFixed(1)}%`} best="h" />
                      <MR label={<Term>ROIC</Term>} vals={riskData.map(r => r?.profitability?.roic)} fmt={v => `${(Number(v) * 100).toFixed(1)}%`} best="h" />
                      <MR label={<Term>Margem Liquida</Term>} vals={assets.map((a: any) => a.net_margin)} fmt={v => `${(Number(v) * 100).toFixed(1)}%`} best="h" />
                      <MR label={<Term>Margem Bruta</Term>} vals={riskData.map(r => r?.profitability?.gross_margin)} fmt={v => `${(Number(v) * 100).toFixed(1)}%`} best="h" />
                      <MR label={<Term>Margem EBITDA</Term>} vals={riskData.map(r => r?.profitability?.ebitda_margin)} fmt={v => `${(Number(v) * 100).toFixed(1)}%`} best="h" />
                    </>}

                    {/* Solidez Financeira */}
                    <GroupHeader label="Solidez Financeira" k="sf" collapsed={collapsed} toggle={toggle} cols={assets.length} />
                    {!collapsed['sf'] && <>
                      <MR label={<Term>DL/EBITDA</Term>} vals={assets.map((a: any) => a.dl_ebitda)} fmt={v => `${Number(v).toFixed(1)}x`} best="l" />
                      <MR label={<Term>Piotroski</Term>} vals={assets.map((a: any) => a.piotroski)} fmt={v => `${v}/9`} best="h" />
                      <MR label={<Term>Altman Z</Term>} vals={riskData.map(r => r?.risk_metrics?.altman_z)} fmt={v => Number(v).toFixed(2)} best="h" />
                      <MR label="Liquidez Corrente" vals={riskData.map(r => r?.risk_metrics?.liquidity_ratio)} fmt={v => Number(v).toFixed(2)} best="h" />
                    </>}

                    {/* Dividendos */}
                    <GroupHeader label="Dividendos" k="dv" collapsed={collapsed} toggle={toggle} cols={assets.length} />
                    {!collapsed['dv'] && <>
                      <MR label={<Term>DY Proj.</Term>} vals={assets.map((a: any) => a.dividend_yield_proj)} fmt={v => `${(Number(v) * 100).toFixed(1)}%`} best="h" />
                      <MR label={<Term>Dividend Safety</Term>} vals={assets.map((a: any) => a.dividend_safety)} fmt={v => `${v}/100`} best="h" />
                      <MR label="Dividendos 12M" vals={trapData.map(t => t?.metrics?.total_dividends_12m)} fmt={v => `R$ ${Number(v).toFixed(2)}`} best="h" />
                      <MR label={<Term>CAGR Dividendos 5A</Term>} vals={assets.map((a: any) => a.dividend_cagr_5y)} fmt={v => `${(Number(v) * 100).toFixed(1)}%`} best="h" />
                      <MR label={<Term>Dividend Trap</Term>} vals={trapData.map(t => t?.risk_level)} fmt={v => v === 'baixo' ? 'Seguro' : v === 'medio' ? 'Atencao' : v === 'alto' ? 'Trap' : '--'}
                        colorFn={v => v === 'baixo' ? 'text-emerald-400' : v === 'medio' ? 'text-amber-400' : v === 'alto' ? 'text-red-400' : ''} />
                    </>}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* ─── Section 5: Macro Sensitivity ──────────────── */}
          {sensitivityRows.length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-3)] mb-3">Sensibilidade Macro</p>
              <div className="grid gap-3 grid-cols-1 md:grid-cols-2">
                {sensitivityRows.map((sc, si) => (
                  <div key={si} className="bg-[var(--surface-1)] rounded-xl border border-[var(--border-1)] p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-semibold text-[var(--text-1)]">{sc.name}</h3>
                      <span className={cn('text-[10px] font-mono font-bold px-2 py-0.5 rounded-full',
                        sc.impact_score >= 7 ? 'text-red-400 bg-red-400/10' : sc.impact_score >= 4 ? 'text-amber-400 bg-amber-400/10' : 'text-emerald-400 bg-emerald-400/10'
                      )}>
                        Impacto {sc.impact_score}/10
                      </span>
                    </div>
                    <p className="text-[11px] text-[var(--text-2)] mb-3 leading-relaxed">{sc.description}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {sc.impacts.map(imp => (
                        <span key={imp.ticker} className={cn('text-[10px] font-mono px-2 py-1 rounded-lg border',
                          imp.affected ? 'text-amber-400 border-amber-400/30 bg-amber-400/5' : 'text-emerald-400 border-emerald-400/30 bg-emerald-400/5'
                        )}>
                          {imp.ticker} ({imp.clusterName}) {imp.affected ? 'afetado' : 'neutro'}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ─── Section 6: Revenue Evolution ──────────────── */}
          {revenueData.length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-3)] mb-3">Evolucao Receita Liquida</p>
              <div className="bg-[var(--surface-1)] rounded-xl border border-[var(--border-1)] p-5">
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={revenueData} barCategoryGap="20%">
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-1)" />
                    <XAxis dataKey="period" tick={{ fontSize: 10, fill: 'var(--text-2)' }} />
                    <YAxis tick={{ fontSize: 10, fill: 'var(--text-2)' }} tickFormatter={v => `${(v / 1000).toFixed(0)}B`} />
                    <RTooltip contentStyle={{ background: 'var(--surface-1)', border: '1px solid var(--border-1)', borderRadius: 12, fontSize: 11, color: 'var(--text-1)' }}
                      formatter={(v: number, name: string) => [`R$ ${(v / 1000).toFixed(1)}B`, name.replace('_rev', '')]} />
                    <Legend wrapperStyle={{ fontSize: 11 }} formatter={v => v.replace('_rev', '')} />
                    {tickers.map((t, i) => (
                      <Bar key={t} dataKey={`${t}_rev`} fill={C[i]} radius={[4, 4, 0, 0]} opacity={0.85} />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* ─── Section 7: Price Performance ──────────────── */}
          {chartData.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-3)]">Performance Comparada</p>
                <div className="flex gap-1">
                  {RANGES.map((r, i) => (
                    <button key={r.l} onClick={() => setRi(i)}
                      className={cn('px-2.5 py-1 text-[10px] font-mono rounded-lg transition-colors',
                        i === ri ? 'bg-[var(--accent-1)] text-white' : 'text-[var(--text-3)] hover:bg-[var(--surface-2)] hover:text-[var(--text-1)]')}>
                      {r.l}
                    </button>
                  ))}
                </div>
              </div>
              <div className="bg-[var(--surface-1)] rounded-xl border border-[var(--border-1)] p-5">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-1)" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--text-2)' }} interval="preserveStartEnd" />
                    <YAxis tick={{ fontSize: 10, fill: 'var(--text-2)' }} tickFormatter={v => `${v > 0 ? '+' : ''}${v}%`} />
                    <RTooltip contentStyle={{ background: 'var(--surface-1)', border: '1px solid var(--border-1)', borderRadius: 12, fontSize: 11, color: 'var(--text-1)' }}
                      formatter={(v: number, n: string) => [`${v > 0 ? '+' : ''}${v.toFixed(1)}%`, n]} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    {tickers.map((t, i) => (
                      <Line key={t} type="monotone" dataKey={t} stroke={C[i]} strokeWidth={2} dot={false} />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ─── Sub-components ──────────────────────────────────────────

function GroupHeader({ label, k, collapsed, toggle, cols }: { label: string; k: string; collapsed: Record<string, boolean>; toggle: (k: string) => void; cols: number }) {
  return (
    <tr className="cursor-pointer hover:bg-[var(--surface-2)]/50 transition-colors" onClick={() => toggle(k)}>
      <td colSpan={cols + 1} className="px-4 py-2.5 text-[10px] font-bold text-[var(--text-3)] uppercase tracking-wider">
        <span className="mr-2 text-[var(--text-3)]">{collapsed[k] ? '\u25B8' : '\u25BE'}</span>{label}
      </td>
    </tr>
  )
}

function MR({ label, vals, fmt, best, colorFn }: {
  label: React.ReactNode; vals: any[]; fmt: (v: any) => string; best?: 'h' | 'l'; colorFn?: (v: any) => string
}) {
  const nums = vals.map(v => v != null && !isNaN(Number(v)) ? Number(v) : null)
  let bi = -1
  if (best) {
    const valid = nums.map((v, i) => ({ v, i })).filter((x): x is { v: number; i: number } => x.v !== null)
    if (valid.length >= 2) { valid.sort((a, b) => best === 'h' ? b.v - a.v : a.v - b.v); bi = valid[0]!.i }
  }
  return (
    <tr className="border-b border-[var(--border-1)]/10 hover:bg-[var(--surface-2)]/20 transition-colors">
      <td className="px-4 py-2 text-[var(--text-2)] font-medium">{label}</td>
      {vals.map((v, i) => (
        <td key={i} className={cn('text-center px-3 py-2 font-mono',
          v == null ? 'text-[var(--text-3)]' : i === bi ? 'font-bold text-emerald-400' : 'text-[var(--text-1)]',
          colorFn && v != null ? colorFn(v) : ''
        )}>
          {v != null ? fmt(v) : '--'}
        </td>
      ))}
    </tr>
  )
}
