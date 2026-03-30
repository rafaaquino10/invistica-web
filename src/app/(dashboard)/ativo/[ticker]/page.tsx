'use client'

import { useState, useMemo, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { Badge, Skeleton, Disclaimer, Term } from '@/components/ui'
import { AssetLogo } from '@/components/ui/asset-logo'
import { DriversList } from '@/components/ui/drivers-list'
import { ScoreGauge } from '@/components/score/score-gauge'
import { IQCognitXRay } from '@/components/score/iq-cognit-xray'
import { ScenarioBuilder } from '@/components/valuation/scenario-builder'
import { PaywallGate } from '@/components/billing/paywall-gate'
import { cn } from '@/lib/utils'
import { pro, free } from '@/lib/api/endpoints'
import { adaptScoreToAsset, adaptEvidenceToDrivers, adaptValuation } from '@/lib/api/adapters'
import { useAuth } from '@/hooks/use-auth'
import type { Evidence } from '@/lib/api/endpoints'

// ─── Formatters ──────────────────────────────────────────────
function fmtR$(val: number | null | undefined): string {
  if (val == null) return '--'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)
}
function fmtBig(val: number | null | undefined): string {
  if (val == null || val === 0) return '--'
  if (Math.abs(val) >= 1e9) return `R$${(val / 1e9).toFixed(1)}B`
  if (Math.abs(val) >= 1e6) return `R$${(val / 1e6).toFixed(0)}M`
  return `R$${val.toLocaleString('pt-BR')}`
}
function fmtPct(val: number | null | undefined): string {
  if (val == null) return '--'
  return `${(val * 100).toFixed(1)}%`
}

const RATING_STYLES: Record<string, string> = {
  STRONG_BUY: 'bg-emerald-400/10 text-emerald-400 border-emerald-400/30',
  BUY: 'bg-blue-400/10 text-blue-400 border-blue-400/30',
  HOLD: 'bg-amber-400/10 text-amber-400 border-amber-400/30',
  REDUCE: 'bg-orange-400/10 text-orange-400 border-orange-400/30',
  AVOID: 'bg-red-400/10 text-red-400 border-red-400/30',
}

const RATING_LABELS: Record<string, string> = {
  STRONG_BUY: 'Compra Forte', BUY: 'Acumular', HOLD: 'Neutro',
  REDUCE: 'Reduzir', AVOID: 'Evitar',
}

function scoreColor(v: number) {
  if (v >= 70) return 'text-emerald-400'
  if (v >= 50) return 'text-[var(--accent-1)]'
  return 'text-red-400'
}
function scoreBg(v: number) {
  if (v >= 70) return 'bg-emerald-400'
  if (v >= 50) return 'bg-[var(--accent-1)]'
  return 'bg-red-400'
}

function generateBullBear(iq: any, dcf: any, divSafety: any, risk: any): { bull: string[]; bear: string[] } {
  const bull: string[] = []
  const bear: string[] = []
  const q = iq?.score_quanti ?? 50; const l = iq?.score_quali ?? 50; const v = iq?.score_valuation ?? 50
  // Bull
  if (q >= 65) bull.push(`Fundamentos quantitativos solidos (${q}/100)`)
  if (l >= 65) bull.push(`Qualidade de gestao e governanca acima da media (${l}/100)`)
  if (v >= 65) bull.push(`Valuations atrativo vs peers do setor (${v}/100)`)
  if (dcf?.safetyMargin != null && dcf.safetyMargin > 0.1) bull.push(`Negocia ${(dcf.safetyMargin * 100).toFixed(0)}% abaixo do preco justo`)
  if (divSafety?.dividend_safety != null && divSafety.dividend_safety >= 70) bull.push(`Dividendo sustentavel (Safety ${divSafety.dividend_safety}/100)`)
  if (risk?.risk_metrics?.piotroski_score != null && risk.risk_metrics.piotroski_score >= 7) bull.push(`Piotroski ${risk.risk_metrics.piotroski_score}/9 indica saude financeira`)
  // Bear
  if (q < 40) bear.push(`Fundamentos quantitativos frageis (${q}/100)`)
  if (v < 30) bear.push(`Valuations esticados — preco pode nao refletir fundamentos`)
  if (dcf?.safetyMargin != null && dcf.safetyMargin < -0.2) bear.push(`${Math.abs(dcf.safetyMargin * 100).toFixed(0)}% acima do preco justo — risco de correcao`)
  if (risk?.risk_metrics?.dl_ebitda != null && risk.risk_metrics.dl_ebitda > 3.5) bear.push(`Endividamento elevado (DL/EBITDA ${risk.risk_metrics.dl_ebitda.toFixed(1)}x)`)
  if (risk?.risk_metrics?.piotroski_score != null && risk.risk_metrics.piotroski_score <= 3) bear.push(`Piotroski ${risk.risk_metrics.piotroski_score}/9 sinaliza fragilidade`)
  if (divSafety?.dividend_safety != null && divSafety.dividend_safety < 40) bear.push(`Dividendo com risco de corte (Safety ${divSafety.dividend_safety}/100)`)
  if (bull.length === 0) bull.push(`IQ-Score ${iq?.iq_score ?? '--'} — analise em andamento`)
  if (bear.length === 0) bear.push(`Monitorar proximos resultados trimestrais`)
  return { bull: bull.slice(0, 3), bear: bear.slice(0, 3) }
}

function generateClientThesis(ticker: string, iq: any, dcf: any, divSafety: any, risk: any): string {
  const parts: string[] = []
  const rating = iq?.rating
  const iqScore = iq?.iq_score ?? 0

  // Overall positioning
  if (iqScore >= 70) parts.push(`${ticker} recebe IQ-Score ${iqScore} (${iq?.rating_label ?? 'BUY'}), posicionando-se entre as melhores oportunidades do universo IQ-Cognit.`)
  else if (iqScore >= 50) parts.push(`${ticker} recebe IQ-Score ${iqScore} (${iq?.rating_label ?? 'HOLD'}), com fundamentos moderados que exigem acompanhamento.`)
  else parts.push(`${ticker} recebe IQ-Score ${iqScore} (${iq?.rating_label ?? 'AVOID'}), indicando fragilidades que recomendam cautela.`)

  // Pillar analysis
  const q = iq?.score_quanti ?? 50; const l = iq?.score_quali ?? 50; const v = iq?.score_valuation ?? 50
  const best = q >= l && q >= v ? 'quantitativo' : l >= q && l >= v ? 'qualitativo' : 'valuation'
  const worst = q <= l && q <= v ? 'quantitativo' : l <= q && l <= v ? 'qualitativo' : 'valuation'
  parts.push(`O pilar mais forte e o ${best} (${best === 'quantitativo' ? q : best === 'qualitativo' ? l : v}/100), enquanto ${worst} (${worst === 'quantitativo' ? q : worst === 'qualitativo' ? l : v}/100) representa a maior oportunidade de melhoria.`)

  // Valuation
  if (dcf?.available && dcf.safetyMargin != null) {
    if (dcf.safetyMargin > 0.15) parts.push(`Negocia ${(dcf.safetyMargin * 100).toFixed(0)}% abaixo do preco justo estimado (${fmtR$(dcf.intrinsicValue)}), oferecendo margem de seguranca atrativa.`)
    else if (dcf.safetyMargin > 0) parts.push(`Negocia com desconto de ${(dcf.safetyMargin * 100).toFixed(0)}% em relacao ao preco justo (${fmtR$(dcf.intrinsicValue)}).`)
    else parts.push(`Negocia ${Math.abs(dcf.safetyMargin * 100).toFixed(0)}% acima do preco justo estimado (${fmtR$(dcf.intrinsicValue)}), sugerindo valuations esticados.`)
  }

  // Dividends
  if (divSafety?.dividend_safety != null) {
    const ds = divSafety.dividend_safety
    if (ds >= 70) parts.push(`Dividend Safety de ${ds}/100 indica dividendo sustentavel.`)
    else if (ds >= 40) parts.push(`Dividend Safety de ${ds}/100 sugere dividendo com risco moderado.`)
  }

  // Risk
  if (risk?.risk_metrics?.piotroski_score != null) {
    const p = risk.risk_metrics.piotroski_score
    if (p >= 7) parts.push(`Piotroski ${p}/9 confirma saude financeira solida.`)
    else if (p <= 3) parts.push(`Piotroski ${p}/9 sinaliza fragilidade nos fundamentos contabeis.`)
  }

  return parts.join(' ')
}

// ─── Main Page ──────────────────────────────────────────────
export default function AtivoPage() {
  const params = useParams()
  const ticker = (params['ticker'] as string)?.toUpperCase()
  const { token } = useAuth()

  // API calls
  const { data: score, isLoading: loadingScore, isError: errorScore } = useQuery({
    queryKey: ['score', ticker],
    queryFn: () => pro.getScore(ticker, {}, token ?? undefined),
    enabled: !!ticker,
    retry: 1,
  })

  // Secondary queries — all have .catch(() => null) so a 500 on any
  // endpoint doesn't break the entire page. Only the score query is critical.
  const { data: valuation } = useQuery({
    queryKey: ['valuation', ticker],
    queryFn: () => pro.getValuation(ticker, token ?? undefined).catch(() => null),
    enabled: !!ticker,
    retry: 0,
  })

  const { data: tickerData } = useQuery({
    queryKey: ['ticker-detail', ticker],
    queryFn: () => free.getTicker(ticker).catch(() => null),
    enabled: !!ticker,
    retry: 0,
  })

  const { data: financialsData } = useQuery({
    queryKey: ['financials', ticker],
    queryFn: () => free.getFinancials(ticker, 6).catch(() => null),
    enabled: !!ticker,
    retry: 0,
  })

  const { data: peersData } = useQuery({
    queryKey: ['peers', ticker],
    queryFn: () => free.getPeers(ticker).catch(() => null),
    enabled: !!ticker,
    retry: 0,
  })

  const { data: dividendsData } = useQuery({
    queryKey: ['dividends', ticker],
    queryFn: () => free.getDividends(ticker).catch(() => null),
    enabled: !!ticker,
    retry: 0,
  })

  const { data: dossier } = useQuery({
    queryKey: ['dossier', ticker],
    queryFn: () => pro.getDossier(ticker, token ?? undefined).catch(() => null),
    enabled: !!ticker,
    retry: 0,
  })

  const { data: thesis } = useQuery({
    queryKey: ['thesis', ticker],
    queryFn: () => pro.getThesis(ticker, token ?? undefined).catch(() => null),
    enabled: !!ticker,
    retry: 0,
  })

  const { data: newsData } = useQuery({
    queryKey: ['news', ticker],
    queryFn: () => pro.getNews(ticker, 8, token ?? undefined).catch(() => null),
    enabled: !!ticker,
    retry: 0,
  })

  const { data: investorRelations } = useQuery({
    queryKey: ['investor-relations', ticker],
    queryFn: () => pro.getInvestorRelations(ticker, 10, token ?? undefined).catch(() => null),
    enabled: !!ticker,
    retry: 0,
  })

  const { data: riskMetrics } = useQuery({
    queryKey: ['risk-metrics', ticker],
    queryFn: () => pro.getRiskMetrics(ticker, token ?? undefined).catch(() => null),
    enabled: !!ticker,
    retry: 0,
  })

  const { data: scenarios } = useQuery({
    queryKey: ['valuation-scenarios', ticker],
    queryFn: () => pro.getScenarios(ticker, token ?? undefined).catch(() => null),
    enabled: !!ticker,
    retry: 0,
  })

  const { data: dividendSafety } = useQuery({
    queryKey: ['dividend-safety', ticker],
    queryFn: () => pro.getDividendSafety(ticker, token ?? undefined).catch(() => null),
    enabled: !!ticker,
    retry: 0,
  })

  const { data: trapRisk } = useQuery({
    queryKey: ['trap-risk', ticker],
    queryFn: () => pro.getDividendTrapRisk(ticker, token ?? undefined).catch(() => null),
    enabled: !!ticker,
    staleTime: 10 * 60 * 1000,
  })

  // (mandate query removed)

  // Adapt data
  const asset = useMemo(() => {
    if (!score) return null
    return adaptScoreToAsset(
      score,
      tickerData ?? undefined,
      (financialsData?.financials as Array<Record<string, unknown>>) ?? undefined,
      peersData?.peers ?? undefined,
    )
  }, [score, tickerData, financialsData, peersData])

  const drivers = useMemo(() => {
    if (!score?.evidences) return { positive: [], negative: [] }
    return adaptEvidenceToDrivers(score.evidences)
  }, [score])

  const dcf = useMemo(() => {
    if (!valuation) return null
    return adaptValuation(valuation)
  }, [valuation])

  const iq = score?.iq_cognit
  const val = score?.valuation
  const div = score?.dividends

  type AssetTab = 'resumo' | 'valuation' | 'fundamentos' | 'tese' | 'dividendos'
  const [activeTab, setActiveTab] = useState<AssetTab>('resumo')

  if (loadingScore) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-28 rounded-xl" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <Skeleton className="h-96 lg:col-span-8 rounded-xl" />
          <Skeleton className="h-96 lg:col-span-4 rounded-xl" />
        </div>
      </div>
    )
  }

  if (errorScore) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-lg text-[var(--text-1)] font-semibold">Erro ao carregar {ticker}</p>
        <p className="text-sm text-[var(--text-2)] mt-2">O backend pode estar indisponivel. Tente novamente em alguns minutos.</p>
        <button onClick={() => window.location.reload()} className="mt-4 px-5 py-2.5 bg-[var(--accent-1)] text-white rounded-xl text-sm font-medium hover:opacity-90 transition-opacity">Tentar novamente</button>
      </div>
    )
  }

  if (!score || !iq) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-lg text-[var(--text-2)]">Dados indisponiveis para {ticker}</p>
        <p className="text-sm text-[var(--text-2)] mt-2">Verifique se o ticker e valido.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* ─── Header ──────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-[var(--surface-1)] via-[var(--surface-1)] to-[var(--accent-1)]/5 border border-[var(--border-1)] p-6">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[var(--accent-1)]/3 pointer-events-none" />
        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <AssetLogo ticker={ticker} size={56} />
              <div className={cn('absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white', scoreBg(iq.iq_score))}>
                {iq.iq_score >= 70 ? '+' : iq.iq_score >= 50 ? '=' : '-'}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold text-[var(--text-1)] tracking-tight">{ticker}</h1>
                <span className={cn('text-xs font-bold px-3 py-1 rounded-full border backdrop-blur-sm', RATING_STYLES[iq.rating] ?? RATING_STYLES['HOLD'])}>
                  {RATING_LABELS[iq.rating] ?? iq.rating}
                </span>
              </div>
              <p className="text-sm text-[var(--text-2)] mt-0.5">{score.company_name}</p>
              <p className="text-xs text-[var(--text-3)]">Cluster {score.cluster}</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <p className="text-xs text-[var(--text-3)] uppercase tracking-wider mb-1">IQ-Score</p>
              <p className={cn('font-mono text-4xl font-black', scoreColor(iq.iq_score))}>{iq.iq_score}</p>
            </div>
            {tickerData?.quote && (
              <div className="text-right pl-6 border-l border-[var(--border-1)]">
                <p className="font-mono text-3xl font-bold text-[var(--text-1)]">{fmtR$(tickerData.quote.close)}</p>
                <p className="text-xs text-[var(--text-3)] font-mono mt-0.5">
                  Vol: {tickerData.quote.volume?.toLocaleString('pt-BR')} | Mkt Cap: {fmtBig(tickerData.quote.market_cap)}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── Tab Navigation ──────────────────────────────── */}
      <div className="flex gap-1 p-1 bg-[var(--surface-1)] rounded-xl border border-[var(--border-1)] overflow-x-auto">
        {([
          { key: 'resumo' as const, label: 'Resumo' },
          { key: 'valuation' as const, label: 'Valuation' },
          { key: 'fundamentos' as const, label: 'Fundamentos' },
          { key: 'tese' as const, label: 'Tese & Analise' },
          { key: 'dividendos' as const, label: 'Dividendos' },
        ]).map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              'flex-1 min-w-[90px] px-4 py-2.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap tracking-wide',
              activeTab === tab.key
                ? 'bg-[var(--accent-1)] text-white shadow-lg shadow-[var(--accent-1)]/20'
                : 'text-[var(--text-3)] hover:text-[var(--text-1)] hover:bg-[var(--bg)]'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ═══ Tab: Resumo ═══════════════════════════════════ */}
      {activeTab === 'resumo' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-8 space-y-6">
            {/* IQ-Score Arc + Pillars */}
            <div className="bg-[var(--surface-1)] rounded-xl border border-[var(--border-1)] p-6">
              <div className="flex flex-col items-center mb-6">
                <ScoreGauge score={iq.iq_score} classification={iq.rating} size={180} />
                <p className="text-sm text-[var(--text-3)] mt-3 font-medium">{iq.rating_label}</p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <PillarCard label={<Term>Quantitativo</Term>} value={iq.score_quanti} icon="Q" />
                <PillarCard label={<Term>Qualitativo</Term>} value={iq.score_quali} icon="L" />
                <PillarCard label={<Term>Valuation</Term>} value={iq.score_valuation} icon="V" />
                <PillarCard label={<Term>Operacional</Term>} value={iq.score_operational} icon="O" />
              </div>
            </div>
            {/* Safety Margin Bar */}
            {dcf && dcf.available && (
              <div className="bg-[var(--surface-1)] rounded-xl border border-[var(--border-1)] p-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-[var(--text-3)] uppercase tracking-wider"><Term>Desconto</Term> vs Preco Justo</span>
                  <span className={cn('font-mono text-xl font-black', dcf.safetyMargin > 0.15 ? 'text-emerald-400' : dcf.safetyMargin > 0 ? 'text-[var(--accent-1)]' : 'text-red-400')}>
                    {(dcf.safetyMargin * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="relative w-full h-3 bg-[var(--bg)] rounded-full overflow-hidden">
                  <div
                    className={cn('h-full rounded-full transition-all duration-700', dcf.safetyMargin > 0.15 ? 'bg-emerald-400' : dcf.safetyMargin > 0 ? 'bg-[var(--accent-1)]' : 'bg-red-400')}
                    style={{ width: `${Math.min(Math.max((dcf.safetyMargin + 0.5) * 100, 5), 95)}%` }}
                  />
                </div>
                <div className="flex justify-between mt-2 text-[10px] text-[var(--text-3)] font-mono">
                  <span>Caro</span>
                  <span>Justo</span>
                  <span>Barato</span>
                </div>
              </div>
            )}
          </div>
          {/* Right Column */}
          <div className="lg:col-span-4 space-y-6">
            {/* Thesis Preview */}
            <div className="bg-[var(--surface-1)] rounded-xl border border-[var(--border-1)] p-5">
              <h3 className="text-xs font-bold text-[var(--text-3)] uppercase tracking-wider mb-3">Tese de Investimento</h3>
              {thesis?.thesis_text ? (
                <p className="text-sm text-[var(--text-2)] leading-relaxed line-clamp-6">{thesis.thesis_text}</p>
              ) : score.thesis_summary ? (
                <p className="text-sm text-[var(--text-2)] leading-relaxed line-clamp-6">{score.thesis_summary}</p>
              ) : (
                <p className="text-sm text-[var(--text-2)] leading-relaxed">{generateClientThesis(ticker, iq, dcf, dividendSafety, riskMetrics)}</p>
              )}
              {(() => {
                const bullPoints = thesis?.bull_case
                  ? (Array.isArray(thesis.bull_case) ? thesis.bull_case : String(thesis.bull_case).split(/[.;]\s*/).filter(Boolean)).slice(0, 3)
                  : generateBullBear(iq, dcf, dividendSafety, riskMetrics).bull
                const bearPoints = thesis?.bear_case
                  ? (Array.isArray(thesis.bear_case) ? thesis.bear_case : String(thesis.bear_case).split(/[.;]\s*/).filter(Boolean)).slice(0, 3)
                  : generateBullBear(iq, dcf, dividendSafety, riskMetrics).bear
                return (
                  <div className="mt-4 space-y-2">
                    {bullPoints.length > 0 && (
                      <div className="p-3 rounded-xl bg-emerald-400/5 border border-emerald-400/10">
                        <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider mb-1">Pontos Fortes</p>
                        <ul className="space-y-1">
                          {bullPoints.map((b: string, i: number) => (
                            <li key={i} className="text-xs text-[var(--text-2)] flex gap-1.5">
                              <span className="text-emerald-400 shrink-0">+</span>{b.trim()}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {bearPoints.length > 0 && (
                      <div className="p-3 rounded-xl bg-red-400/5 border border-red-400/10">
                        <p className="text-[10px] font-bold text-red-400 uppercase tracking-wider mb-1">Riscos</p>
                        <ul className="space-y-1">
                          {bearPoints.map((b: string, i: number) => (
                            <li key={i} className="text-xs text-[var(--text-2)] flex gap-1.5">
                              <span className="text-red-400 shrink-0">-</span>{b.trim()}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )
              })()}
            </div>
            {/* Top Drivers */}
            {(drivers.positive.length > 0 || drivers.negative.length > 0) && (
              <div className="bg-[var(--surface-1)] rounded-xl border border-[var(--border-1)] p-5">
                <h3 className="text-xs font-bold text-[var(--text-3)] uppercase tracking-wider mb-3">Drivers do Score</h3>
                <div className="space-y-4">
                  {drivers.positive.slice(0, 3).map((d, i) => (
                    <div key={`p${i}`} className="flex items-start gap-2">
                      <div className="w-5 h-5 rounded-full bg-emerald-400/10 flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-emerald-400 text-[10px] font-bold">+</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-[var(--text-1)] font-medium leading-snug">{d.text}</p>
                        {d.value && <p className="font-mono text-[10px] text-emerald-400 mt-0.5">{d.value}</p>}
                      </div>
                    </div>
                  ))}
                  {drivers.negative.slice(0, 3).map((d, i) => (
                    <div key={`n${i}`} className="flex items-start gap-2">
                      <div className="w-5 h-5 rounded-full bg-red-400/10 flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-red-400 text-[10px] font-bold">-</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-[var(--text-1)] font-medium leading-snug">{d.text}</p>
                        {d.value && <p className="font-mono text-[10px] text-red-400 mt-0.5">{d.value}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══ Tab: Valuation ════════════════════════════════ */}
      {activeTab === 'valuation' && (
        <div className="space-y-6">
          {/* Valuation Models */}
          {dcf && dcf.available && (
            <div className="bg-[var(--surface-1)] rounded-xl border border-[var(--border-1)] p-6">
              <h3 className="text-xs font-bold text-[var(--text-3)] uppercase tracking-wider mb-5">Modelos de Valuation</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <ValuationMetric label={<Term>Preco Justo</Term>} value={fmtR$(dcf.intrinsicValue)} highlight />
                <ValuationMetric label={<Term>DCF</Term>} value={fmtR$(dcf.fairValueDCF)} />
                <ValuationMetric label={<Term>Gordon</Term>} value={fmtR$(dcf.fairValueGordon)} />
                <ValuationMetric label={<Term>Multiplos</Term>} value={fmtR$(dcf.fairValueMult)} />
              </div>
              {/* Safety Margin */}
              <div className="mt-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-[var(--text-3)]"><Term>Desconto</Term> em relacao ao preco justo</span>
                  <span className={cn('font-mono text-lg font-black', dcf.safetyMargin > 0.15 ? 'text-emerald-400' : dcf.safetyMargin > 0 ? 'text-[var(--accent-1)]' : 'text-red-400')}>
                    {(dcf.safetyMargin * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="relative w-full h-3 bg-[var(--bg)] rounded-full overflow-hidden">
                  <div
                    className={cn('h-full rounded-full transition-all duration-700', dcf.safetyMargin > 0.15 ? 'bg-emerald-400' : dcf.safetyMargin > 0 ? 'bg-[var(--accent-1)]' : 'bg-red-400')}
                    style={{ width: `${Math.min(Math.max((dcf.safetyMargin + 0.5) * 100, 5), 95)}%` }}
                  />
                </div>
                <div className="flex justify-between mt-1 text-[10px] text-[var(--text-3)] font-mono">
                  <span>P25: {fmtR$(dcf.p25)}</span>
                  <span>Atual: {fmtR$(dcf.currentPrice)}</span>
                  <span>P75: {fmtR$(dcf.p75)}</span>
                </div>
              </div>
              {/* Monte Carlo Range */}
              {dcf.p25 != null && dcf.p75 != null && (
                <div className="mt-6 p-4 rounded-xl bg-[var(--bg)] border border-[var(--border-1)]">
                  <h4 className="text-[10px] font-bold text-[var(--text-3)] mb-3 uppercase tracking-wider"><Term>Monte Carlo</Term> — 10.000 Simulacoes</h4>
                  <div className="relative h-14 flex items-center">
                    <div className="absolute inset-x-0 h-3 bg-[var(--surface-1)] rounded-full" />
                    {(() => {
                      const min = dcf.p25! * 0.85
                      const max = dcf.p75! * 1.15
                      const range = max - min || 1
                      const p25Pos = ((dcf.p25! - min) / range) * 100
                      const p75Pos = ((dcf.p75! - min) / range) * 100
                      const pricePos = Math.max(0, Math.min(100, ((dcf.currentPrice - min) / range) * 100))
                      const fairPos = dcf.intrinsicValue ? Math.max(0, Math.min(100, ((dcf.intrinsicValue - min) / range) * 100)) : null
                      return (
                        <>
                          <div className="absolute h-3 bg-[var(--accent-1)]/25 rounded-full backdrop-blur-sm" style={{ left: `${p25Pos}%`, width: `${p75Pos - p25Pos}%` }} />
                          <div className="absolute w-0.5 h-10 bg-[var(--text-1)] rounded-full" style={{ left: `${pricePos}%` }} />
                          <div className="absolute -top-1 text-[10px] font-mono font-bold text-[var(--text-1)] -translate-x-1/2" style={{ left: `${pricePos}%` }}>Atual</div>
                          {fairPos != null && (
                            <>
                              <div className="absolute w-0.5 h-10 bg-[var(--accent-1)] rounded-full" style={{ left: `${fairPos}%` }} />
                              <div className="absolute top-10 text-[10px] font-mono font-bold text-[var(--accent-1)] -translate-x-1/2" style={{ left: `${fairPos}%` }}>Justo</div>
                            </>
                          )}
                        </>
                      )
                    })()}
                  </div>
                  <div className="flex justify-between mt-3 text-[10px] font-mono text-[var(--text-3)]">
                    <span>Pessimista {fmtR$(dcf.p25)}</span>
                    <span>Otimista {fmtR$(dcf.p75)}</span>
                  </div>
                </div>
              )}
              {/* Probabilities */}
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="text-center p-3 rounded-xl bg-emerald-400/5 border border-emerald-400/10">
                  <p className="text-[10px] text-[var(--text-3)] uppercase tracking-wider">Prob. Upside</p>
                  <p className="font-mono text-xl font-black text-emerald-400">{fmtPct(dcf.upsideProb)}</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-red-400/5 border border-red-400/10">
                  <p className="text-[10px] text-[var(--text-3)] uppercase tracking-wider">Prob. Perda</p>
                  <p className="font-mono text-xl font-black text-red-400">{fmtPct(dcf.lossProb)}</p>
                </div>
              </div>
              {/* DCF Reverso */}
              {valuation?.implied_growth != null && (
                <div className="mt-4 p-4 rounded-xl border border-[var(--accent-1)]/20 bg-[var(--accent-1)]/5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-[10px] font-bold text-[var(--accent-1)] uppercase tracking-wider">DCF Reverso</h4>
                      <p className="text-xs text-[var(--text-3)] mt-0.5">O mercado precifica crescimento de</p>
                    </div>
                    <span className="font-mono text-2xl font-black text-[var(--accent-1)]">
                      {valuation.implied_growth_pct ?? `${(valuation.implied_growth * 100).toFixed(1)}%`}
                    </span>
                  </div>
                  <p className="text-[10px] text-[var(--text-3)] mt-2">
                    Se voce acredita que a empresa crescera mais que {valuation.implied_growth_pct ?? `${(valuation.implied_growth * 100).toFixed(1)}%`} ao ano, o preco atual pode estar barato.
                  </p>
                </div>
              )}
              {/* Scenarios */}
              {scenarios && scenarios.scenarios && (
                <div className="mt-4">
                  <h4 className="text-[10px] font-bold text-[var(--text-3)] mb-3 uppercase tracking-wider">Cenarios</h4>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { key: 'bear', label: 'Pessimista', data: scenarios.scenarios['bear'], color: 'red' },
                      { key: 'base', label: 'Base', data: scenarios.scenarios['base'], color: 'accent' },
                      { key: 'bull', label: 'Otimista', data: scenarios.scenarios['bull'], color: 'emerald' },
                    ].map(s => {
                      const fv = (s.data as any)?.fair_value
                      const upside = fv && dcf.currentPrice ? ((fv - dcf.currentPrice) / dcf.currentPrice * 100) : null
                      const borderCls = s.color === 'red' ? 'border-red-400/20 bg-red-400/5' : s.color === 'emerald' ? 'border-emerald-400/20 bg-emerald-400/5' : 'border-[var(--accent-1)]/20 bg-[var(--accent-1)]/5'
                      return (
                        <div key={s.key} className={cn('p-4 rounded-xl border text-center', borderCls)}>
                          <p className="text-[10px] font-bold text-[var(--text-3)] uppercase tracking-wider">{s.label}</p>
                          <p className="font-mono text-lg font-black text-[var(--text-1)] mt-1">{fv ? fmtR$(fv) : '-'}</p>
                          {upside != null && (
                            <p className={cn('font-mono text-xs font-bold mt-0.5', upside >= 0 ? 'text-emerald-400' : 'text-red-400')}>
                              {upside >= 0 ? '+' : ''}{upside.toFixed(1)}%
                            </p>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
          {/* Scenario Builder */}
          {dcf && dcf.available && (
            <ScenarioBuilder
              currentPrice={dcf.currentPrice}
              fairValueDCF={dcf.fairValueDCF}
              fairValueGordon={dcf.fairValueGordon}
              fairValueMult={dcf.fairValueMult}
              fairValueFinal={dcf.intrinsicValue}
              safetyMargin={dcf.safetyMargin}
              impliedGrowth={valuation?.implied_growth ?? null}
            />
          )}
          {/* DuPont */}
          {valuation?.dupont && (
            <div className="bg-[var(--surface-1)] rounded-xl border border-[var(--border-1)] p-6">
              <h3 className="text-xs font-bold text-[var(--text-3)] uppercase tracking-wider mb-4"><Term>DuPont</Term> — Decomposicao do <Term>ROE</Term></h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-4 rounded-xl bg-[var(--bg)]">
                  <p className="text-[10px] text-[var(--text-3)] uppercase tracking-wider"><Term>Margem Liquida</Term></p>
                  <p className="font-mono text-xl font-black text-[var(--text-1)] mt-1">{valuation.dupont.margin != null ? (valuation.dupont.margin * 100).toFixed(1) + '%' : '-'}</p>
                </div>
                <div className="p-4 rounded-xl bg-[var(--bg)]">
                  <p className="text-[10px] text-[var(--text-3)] uppercase tracking-wider"><Term>Giro</Term></p>
                  <p className="font-mono text-xl font-black text-[var(--text-1)] mt-1">{valuation.dupont.turnover?.toFixed(2) ?? '-'}x</p>
                </div>
                <div className="p-4 rounded-xl bg-[var(--bg)]">
                  <p className="text-[10px] text-[var(--text-3)] uppercase tracking-wider"><Term>Alavancagem</Term></p>
                  <p className="font-mono text-xl font-black text-[var(--text-1)] mt-1">{valuation.dupont.leverage?.toFixed(2) ?? '-'}x</p>
                </div>
              </div>
              {valuation.dupont.driver && (
                <p className="text-xs text-[var(--text-3)] text-center mt-3">
                  Driver principal: <span className="font-semibold text-[var(--accent-1)]">{valuation.dupont.driver}</span>
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* ═══ Tab: Fundamentos ══════════════════════════════ */}
      {activeTab === 'fundamentos' && (
        <div className="space-y-6">
          {/* Financial Table */}
          {financialsData?.financials && financialsData.financials.length > 0 && (
            <div className="bg-[var(--surface-1)] rounded-xl border border-[var(--border-1)] p-6">
              <h3 className="text-xs font-bold text-[var(--text-3)] uppercase tracking-wider mb-5">Indicadores Fundamentalistas</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border-1)]">
                      <th className="text-left py-3 px-3 text-[var(--text-3)] text-[10px] font-bold uppercase tracking-wider">Periodo</th>
                      <th className="text-right py-3 px-3 text-[var(--text-3)] text-[10px] font-bold uppercase tracking-wider">Receita</th>
                      <th className="text-right py-3 px-3 text-[var(--text-3)] text-[10px] font-bold uppercase tracking-wider">Lucro Liq.</th>
                      <th className="text-right py-3 px-3 text-[var(--text-3)] text-[10px] font-bold uppercase tracking-wider"><Term>ROE</Term></th>
                      <th className="text-right py-3 px-3 text-[var(--text-3)] text-[10px] font-bold uppercase tracking-wider"><Term>DL/EBITDA</Term></th>
                      <th className="text-right py-3 px-3 text-[var(--text-3)] text-[10px] font-bold uppercase tracking-wider"><Term>Margem Liquida</Term></th>
                      <th className="text-right py-3 px-3 text-[var(--text-3)] text-[10px] font-bold uppercase tracking-wider"><Term>Margem Bruta</Term></th>
                      <th className="text-right py-3 px-3 text-[var(--text-3)] text-[10px] font-bold uppercase tracking-wider"><Term>Piotroski</Term></th>
                    </tr>
                  </thead>
                  <tbody>
                    {financialsData.financials.map((f) => (
                      <tr key={f.period} className="border-b border-[var(--border-1)]/20 hover:bg-[var(--bg)] transition-colors">
                        <td className="py-3 px-3 font-mono font-bold text-[var(--text-1)] text-xs">{f.period?.slice(0, 4)}</td>
                        <td className="py-3 px-3 text-right font-mono text-[var(--text-1)] text-xs">{fmtBig(f.revenue)}</td>
                        <td className={cn('py-3 px-3 text-right font-mono text-xs', (f.net_income ?? 0) >= 0 ? 'text-[var(--text-1)]' : 'text-red-400')}>{fmtBig(f.net_income)}</td>
                        <td className={cn('py-3 px-3 text-right font-mono text-xs', (f.roe ?? 0) >= 0.15 ? 'text-emerald-400' : 'text-[var(--text-1)]')}>{fmtPct(f.roe)}</td>
                        <td className={cn('py-3 px-3 text-right font-mono text-xs', (f.dl_ebitda ?? 0) > 3 ? 'text-red-400' : 'text-[var(--text-1)]')}>{f.dl_ebitda?.toFixed(1) ?? '--'}</td>
                        <td className="py-3 px-3 text-right font-mono text-[var(--text-1)] text-xs">{fmtPct(f.net_margin)}</td>
                        <td className="py-3 px-3 text-right font-mono text-[var(--text-1)] text-xs">{fmtPct(f.gross_margin)}</td>
                        <td className={cn('py-3 px-3 text-right font-mono text-xs font-bold', (f.piotroski_score ?? 0) >= 7 ? 'text-emerald-400' : (f.piotroski_score ?? 0) >= 5 ? 'text-[var(--text-1)]' : 'text-red-400')}>{f.piotroski_score ?? '--'}/9</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {/* Risk Lab */}
          {riskMetrics && (
            <div className="bg-[var(--surface-1)] rounded-xl border border-[var(--border-1)] p-6">
              <h3 className="text-xs font-bold text-[var(--text-3)] uppercase tracking-wider mb-5">Risk Lab</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {riskMetrics.risk_metrics.merton_pd != null && (
                  <RiskMetricCard label={<Term>Risco de Falencia</Term>} value={`${(riskMetrics.risk_metrics.merton_pd * 100).toFixed(2)}%`} description="Probabilidade de calote" color={riskMetrics.risk_metrics.merton_pd < 0.05 ? 'pos' : riskMetrics.risk_metrics.merton_pd < 0.15 ? 'warn' : 'neg'} />
                )}
                {riskMetrics.risk_metrics.piotroski_score != null && (
                  <RiskMetricCard label={<Term>Saude Financeira</Term>} value={`${riskMetrics.risk_metrics.piotroski_score}/9`} description="Nota Piotroski" color={riskMetrics.risk_metrics.piotroski_score >= 7 ? 'pos' : riskMetrics.risk_metrics.piotroski_score >= 5 ? 'warn' : 'neg'} />
                )}
                {riskMetrics.risk_metrics.altman_z != null && (
                  <RiskMetricCard label={<Term>Altman Z</Term>} value={riskMetrics.risk_metrics.altman_z.toFixed(2)} description={riskMetrics.risk_metrics.altman_z_label || 'Solvencia'} color={riskMetrics.risk_metrics.altman_z > 2.99 ? 'pos' : riskMetrics.risk_metrics.altman_z > 1.81 ? 'warn' : 'neg'} />
                )}
                {riskMetrics.risk_metrics.dl_ebitda != null && (
                  <RiskMetricCard label={<Term>DL/EBITDA</Term>} value={riskMetrics.risk_metrics.dl_ebitda.toFixed(1) + 'x'} description="Divida / geracao de caixa" color={riskMetrics.risk_metrics.dl_ebitda < 2 ? 'pos' : riskMetrics.risk_metrics.dl_ebitda < 3.5 ? 'warn' : 'neg'} />
                )}
                {riskMetrics.risk_metrics.icj != null && (
                  <RiskMetricCard label={<Term>ICJ</Term>} value={riskMetrics.risk_metrics.icj.toFixed(1) + 'x'} description="EBIT / Juros" color={riskMetrics.risk_metrics.icj > 5 ? 'pos' : riskMetrics.risk_metrics.icj > 2 ? 'warn' : 'neg'} />
                )}
                {riskMetrics.profitability.spread_roic_wacc != null && (
                  <RiskMetricCard label="ROIC - WACC" value={`${(riskMetrics.profitability.spread_roic_wacc * 100).toFixed(1)}pp`} description="Criacao de valor" color={riskMetrics.profitability.spread_roic_wacc > 0 ? 'pos' : 'neg'} />
                )}
              </div>
            </div>
          )}
          {/* Peers */}
          {peersData?.peers && peersData.peers.length > 0 && (
            <div className="bg-[var(--surface-1)] rounded-xl border border-[var(--border-1)] p-6">
              <h3 className="text-xs font-bold text-[var(--text-3)] uppercase tracking-wider mb-4">Peers do Setor</h3>
              <div className="flex flex-wrap gap-2">
                {peersData.peers.slice(0, 12).map((peer) => (
                  <Link key={peer.ticker} href={`/ativo/${peer.ticker}`} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[var(--bg)] border border-[var(--border-1)] hover:border-[var(--accent-1)]/40 transition-all text-sm group">
                    <AssetLogo ticker={peer.ticker} size={20} />
                    <span className="font-mono font-bold text-[var(--text-1)] text-xs group-hover:text-[var(--accent-1)] transition-colors">{peer.ticker}</span>
                    <span className="text-[var(--text-3)] text-[10px] truncate max-w-[80px]">{peer.company_name}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══ Tab: Tese & Analise ═══════════════════════════ */}
      {activeTab === 'tese' && (
        <div className="space-y-6">
          {/* Full Thesis — ALWAYS rendered */}
          <div className="bg-[var(--surface-1)] rounded-xl border border-[var(--border-1)] p-6">
            <h3 className="text-xs font-bold text-[var(--text-3)] uppercase tracking-wider mb-4">Tese de Investimento</h3>
            <p className="text-sm text-[var(--text-2)] leading-relaxed whitespace-pre-line">
              {thesis?.thesis_text ?? score.thesis_summary ?? generateClientThesis(ticker, iq, dcf, dividendSafety, riskMetrics)}
            </p>
            {/* Bull/Bear — ALWAYS rendered */}
            {(() => {
              const bb = thesis?.bull_case
                ? { bull: Array.isArray(thesis.bull_case) ? thesis.bull_case : String(thesis.bull_case).split(/[.;]\s*/).filter(Boolean), bear: Array.isArray(thesis.bear_case) ? thesis.bear_case : String(thesis.bear_case ?? '').split(/[.;]\s*/).filter(Boolean) }
                : generateBullBear(iq, dcf, dividendSafety, riskMetrics)
              return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                  <div className="p-4 rounded-xl bg-emerald-400/5 border border-emerald-400/10">
                    <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider mb-2">Pontos Fortes</p>
                    <ul className="space-y-1.5">
                      {bb.bull.slice(0, 5).map((b: string, i: number) => (
                        <li key={i} className="text-sm text-[var(--text-2)] flex gap-2">
                          <span className="text-emerald-400 shrink-0 font-bold">+</span>{b.trim()}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="p-4 rounded-xl bg-red-400/5 border border-red-400/10">
                    <p className="text-[10px] font-bold text-red-400 uppercase tracking-wider mb-2">Riscos</p>
                    <ul className="space-y-1.5">
                      {bb.bear.slice(0, 5).map((b: string, i: number) => (
                        <li key={i} className="text-sm text-[var(--text-2)] flex gap-2">
                          <span className="text-red-400 shrink-0 font-bold">-</span>{b.trim()}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )
            })()}
            {thesis?.main_risks && (
              <div className="mt-4 p-4 rounded-xl bg-amber-400/5 border border-amber-400/10">
                <p className="text-[10px] font-bold text-amber-400 uppercase tracking-wider mb-2">Principais Riscos</p>
                <p className="text-sm text-[var(--text-2)] leading-relaxed">{thesis.main_risks}</p>
              </div>
            )}
          </div>

          {/* Risk Metrics Summary — ALWAYS rendered if riskMetrics exists */}
          {riskMetrics && (
            <div className="bg-[var(--surface-1)] rounded-xl border border-[var(--border-1)] p-6">
              <h3 className="text-xs font-bold text-[var(--text-3)] uppercase tracking-wider mb-4">Indicadores de Risco</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {riskMetrics.risk_metrics?.altman_z != null && (
                  <div className="text-center p-3 rounded-xl bg-[var(--bg)]">
                    <p className="text-[10px] text-[var(--text-3)]"><Term>Altman Z</Term></p>
                    <p className={cn('font-mono text-xl font-bold', riskMetrics.risk_metrics.altman_z > 2.99 ? 'text-emerald-400' : riskMetrics.risk_metrics.altman_z > 1.81 ? 'text-amber-400' : 'text-red-400')}>
                      {riskMetrics.risk_metrics.altman_z.toFixed(1)}
                    </p>
                    <p className="text-[9px] text-[var(--text-3)]">{riskMetrics.risk_metrics.altman_z_label === 'safe' ? 'Zona segura' : riskMetrics.risk_metrics.altman_z_label === 'grey' ? 'Zona cinza' : 'Zona de risco'}</p>
                  </div>
                )}
                {riskMetrics.risk_metrics?.piotroski_score != null && (
                  <div className="text-center p-3 rounded-xl bg-[var(--bg)]">
                    <p className="text-[10px] text-[var(--text-3)]"><Term>Piotroski</Term></p>
                    <p className={cn('font-mono text-xl font-bold', riskMetrics.risk_metrics.piotroski_score >= 7 ? 'text-emerald-400' : riskMetrics.risk_metrics.piotroski_score >= 4 ? 'text-amber-400' : 'text-red-400')}>
                      {riskMetrics.risk_metrics.piotroski_score}/9
                    </p>
                    <p className="text-[9px] text-[var(--text-3)]">{riskMetrics.risk_metrics.piotroski_score >= 7 ? 'Saudavel' : riskMetrics.risk_metrics.piotroski_score >= 4 ? 'Neutro' : 'Fragil'}</p>
                  </div>
                )}
                {riskMetrics.risk_metrics?.dl_ebitda != null && (
                  <div className="text-center p-3 rounded-xl bg-[var(--bg)]">
                    <p className="text-[10px] text-[var(--text-3)]"><Term>DL/EBITDA</Term></p>
                    <p className={cn('font-mono text-xl font-bold', riskMetrics.risk_metrics.dl_ebitda < 2 ? 'text-emerald-400' : riskMetrics.risk_metrics.dl_ebitda < 3.5 ? 'text-amber-400' : 'text-red-400')}>
                      {riskMetrics.risk_metrics.dl_ebitda.toFixed(1)}x
                    </p>
                    <p className="text-[9px] text-[var(--text-3)]">{riskMetrics.risk_metrics.dl_ebitda < 2 ? 'Baixo' : riskMetrics.risk_metrics.dl_ebitda < 3.5 ? 'Moderado' : 'Elevado'}</p>
                  </div>
                )}
                {riskMetrics.risk_metrics?.liquidity_ratio != null && (
                  <div className="text-center p-3 rounded-xl bg-[var(--bg)]">
                    <p className="text-[10px] text-[var(--text-3)]">Liquidez</p>
                    <p className={cn('font-mono text-xl font-bold', riskMetrics.risk_metrics.liquidity_ratio >= 1.5 ? 'text-emerald-400' : riskMetrics.risk_metrics.liquidity_ratio >= 1 ? 'text-amber-400' : 'text-red-400')}>
                      {riskMetrics.risk_metrics.liquidity_ratio.toFixed(2)}
                    </p>
                    <p className="text-[9px] text-[var(--text-3)]">{riskMetrics.risk_metrics.liquidity_ratio >= 1.5 ? 'Confortavel' : riskMetrics.risk_metrics.liquidity_ratio >= 1 ? 'Adequado' : 'Apertado'}</p>
                  </div>
                )}
              </div>
              {/* Profitability */}
              {riskMetrics.profitability && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                  {riskMetrics.profitability.roe != null && (
                    <div className="text-center p-3 rounded-xl bg-[var(--bg)]">
                      <p className="text-[10px] text-[var(--text-3)]"><Term>ROE</Term></p>
                      <p className="font-mono text-xl font-bold text-[var(--text-1)]">{(riskMetrics.profitability.roe * 100).toFixed(1)}%</p>
                    </div>
                  )}
                  {riskMetrics.profitability.net_margin != null && (
                    <div className="text-center p-3 rounded-xl bg-[var(--bg)]">
                      <p className="text-[10px] text-[var(--text-3)]"><Term>Margem Líquida</Term></p>
                      <p className="font-mono text-xl font-bold text-[var(--text-1)]">{(riskMetrics.profitability.net_margin * 100).toFixed(1)}%</p>
                    </div>
                  )}
                  {riskMetrics.profitability.gross_margin != null && (
                    <div className="text-center p-3 rounded-xl bg-[var(--bg)]">
                      <p className="text-[10px] text-[var(--text-3)]"><Term>Margem Bruta</Term></p>
                      <p className="font-mono text-xl font-bold text-[var(--text-1)]">{(riskMetrics.profitability.gross_margin * 100).toFixed(1)}%</p>
                    </div>
                  )}
                  {riskMetrics.profitability.roic != null && (
                    <div className="text-center p-3 rounded-xl bg-[var(--bg)]">
                      <p className="text-[10px] text-[var(--text-3)]"><Term>ROIC</Term></p>
                      <p className="font-mono text-xl font-bold text-[var(--text-1)]">{(riskMetrics.profitability.roic * 100).toFixed(1)}%</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Dossier */}
          {dossier && dossier.dimensoes && dossier.dimensoes.length > 0 && (
            <div className="bg-[var(--surface-1)] rounded-xl border border-[var(--border-1)] p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-xs font-bold text-[var(--text-3)] uppercase tracking-wider">Dossier Qualitativo</h3>
                <span className={cn('text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider', dossier.veredito_geral?.includes('BOM') ? 'bg-emerald-400/10 text-emerald-400' : 'bg-amber-400/10 text-amber-400')}>
                  {dossier.veredito_geral}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {dossier.dimensoes.map((dim) => (
                  <DossierDimensionCard key={dim.nome} dimension={dim} />
                ))}
              </div>
            </div>
          )}
          {/* Evidence XRay */}
          {score.evidences && score.evidences.length > 0 && (
            <IQCognitXRay evidences={score.evidences} iqScore={iq.iq_score} rating={iq.rating} ratingLabel={iq.rating_label} />
          )}
          {/* News */}
          {newsData?.news && newsData.news.length > 0 && (
            <div className="bg-[var(--surface-1)] rounded-xl border border-[var(--border-1)] p-6">
              <h3 className="text-xs font-bold text-[var(--text-3)] uppercase tracking-wider mb-4">Noticias Recentes</h3>
              <div className="space-y-1">
                {newsData.news.slice(0, 6).map((n) => (
                  <a key={n.id} href={n.url ?? '#'} target="_blank" rel="noopener noreferrer" className="flex items-start gap-3 p-3 rounded-xl hover:bg-[var(--bg)] transition-colors group">
                    <span className={cn('mt-1.5 w-2 h-2 rounded-full flex-shrink-0', n.sentiment === 'positive' ? 'bg-emerald-400' : n.sentiment === 'negative' ? 'bg-red-400' : 'bg-[var(--text-3)]')} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-[var(--text-1)] font-medium line-clamp-2 group-hover:text-[var(--accent-1)] transition-colors">{n.title}</p>
                      <div className="flex items-center gap-2 mt-1 text-[10px] text-[var(--text-3)]">
                        {n.source && <span>{n.source}</span>}
                        <span>{new Date(n.published_at).toLocaleDateString('pt-BR')}</span>
                        {n.sentiment_score != null && (
                          <span className={cn('font-mono px-1.5 py-0.5 rounded-full', n.sentiment === 'positive' ? 'bg-emerald-400/10 text-emerald-400' : n.sentiment === 'negative' ? 'bg-red-400/10 text-red-400' : 'bg-[var(--bg)] text-[var(--text-3)]')}>
                            {n.sentiment === 'positive' ? '+' : ''}{(n.sentiment_score * 100).toFixed(0)}%
                          </span>
                        )}
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}
          {/* Investor Relations */}
          {investorRelations?.events && investorRelations.events.length > 0 && (
            <div className="bg-[var(--surface-1)] rounded-xl border border-[var(--border-1)] p-6">
              <h3 className="text-xs font-bold text-[var(--text-3)] uppercase tracking-wider mb-4">Documentos & RI</h3>
              <div className="space-y-1">
                {investorRelations.events.slice(0, 8).map((ev) => (
                  <a key={ev.id} href={ev.url ?? '#'} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 rounded-xl hover:bg-[var(--bg)] transition-colors group">
                    <span className="text-[9px] font-bold uppercase px-2 py-1 rounded-lg bg-[var(--bg)] text-[var(--text-3)] shrink-0 border border-[var(--border-1)]">{ev.event_type}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-[var(--text-1)] truncate group-hover:text-[var(--accent-1)] transition-colors">{ev.title}</p>
                      <p className="text-[10px] text-[var(--text-3)]">{ev.source} · {new Date(ev.published_at).toLocaleDateString('pt-BR')}</p>
                    </div>
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--text-3)] shrink-0 group-hover:text-[var(--accent-1)] transition-colors">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══ Tab: Dividendos ═══════════════════════════════ */}
      {activeTab === 'dividendos' && (
        <div className="space-y-6">
          {/* Dividend Safety + Stats */}
          {div && div.dividend_safety != null && (
            <div className="bg-[var(--surface-1)] rounded-xl border border-[var(--border-1)] p-6">
              <h3 className="text-xs font-bold text-[var(--text-3)] uppercase tracking-wider mb-5"><Term>Dividend Safety</Term></h3>
              <div className="flex items-center gap-8">
                <div className="flex flex-col items-center">
                  <p className={cn('font-mono text-5xl font-black', div.dividend_safety >= 70 ? 'text-emerald-400' : div.dividend_safety >= 50 ? 'text-amber-400' : 'text-red-400')}>
                    {div.dividend_safety}
                  </p>
                  <p className="text-[10px] text-[var(--text-3)] mt-1 uppercase tracking-wider">Safety Score</p>
                </div>
                <div className="flex-1">
                  <div className="w-full h-3 bg-[var(--bg)] rounded-full overflow-hidden">
                    <div
                      className={cn('h-full rounded-full transition-all duration-700', div.dividend_safety >= 70 ? 'bg-emerald-400' : div.dividend_safety >= 50 ? 'bg-amber-400' : 'bg-red-400')}
                      style={{ width: `${div.dividend_safety}%` }}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="p-3 rounded-xl bg-[var(--bg)]">
                      <p className="text-[10px] text-[var(--text-3)] uppercase tracking-wider"><Term>DY Proj.</Term></p>
                      <p className="font-mono text-lg font-black text-[var(--text-1)] mt-0.5">{fmtPct(div.projected_yield)}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-[var(--bg)]">
                      <p className="text-[10px] text-[var(--text-3)] uppercase tracking-wider"><Term>CAGR</Term> 5a</p>
                      <p className="font-mono text-lg font-black text-[var(--text-1)] mt-0.5">{fmtPct(div.dividend_cagr_5y)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          {/* DY vs CDI */}
          {dividendSafety && dividendSafety.dy_vs_cdi != null && (
            <div className="bg-[var(--surface-1)] rounded-xl border border-[var(--border-1)] p-6">
              <h3 className="text-xs font-bold text-[var(--text-3)] uppercase tracking-wider mb-4"><Term>Dividend Yield</Term> vs <Term>CDI</Term></h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-[var(--bg)] text-center">
                  <p className="text-[10px] text-[var(--text-3)] uppercase tracking-wider">DY Atual</p>
                  <p className="font-mono text-2xl font-black text-[var(--text-1)] mt-1">{fmtPct(dividendSafety.current_dy)}</p>
                </div>
                <div className="p-4 rounded-xl bg-[var(--bg)] text-center">
                  <p className="text-[10px] text-[var(--text-3)] uppercase tracking-wider">DY / CDI</p>
                  <p className={cn('font-mono text-2xl font-black mt-1', dividendSafety.dy_vs_cdi > 1 ? 'text-emerald-400' : 'text-red-400')}>
                    {dividendSafety.dy_vs_cdi.toFixed(2)}x
                  </p>
                </div>
              </div>
            </div>
          )}
          {/* Trap Risk */}
          {trapRisk && (
            <div className={cn('rounded-xl border p-6', trapRisk.is_dividend_trap ? 'border-red-400/30 bg-red-400/5' : 'bg-[var(--surface-1)] border-[var(--border-1)]')}>
              <div className="flex items-center gap-3 mb-3">
                {trapRisk.is_dividend_trap && (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-400">
                    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                    <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                )}
                <h3 className="text-xs font-bold uppercase tracking-wider">
                  <Term>Dividend Trap</Term>
                  {' '}<span className={cn(trapRisk.is_dividend_trap ? 'text-red-400' : 'text-emerald-400')}>
                    — {trapRisk.is_dividend_trap ? `Risco ${trapRisk.risk_level}` : 'Sem risco detectado'}
                  </span>
                </h3>
              </div>
              {trapRisk.reasons && trapRisk.reasons.length > 0 && (
                <ul className="space-y-1.5">
                  {trapRisk.reasons.map((r, i) => (
                    <li key={i} className={cn('text-xs flex gap-2', trapRisk.is_dividend_trap ? 'text-red-400/80' : 'text-[var(--text-2)]')}>
                      <span className="shrink-0">{trapRisk.is_dividend_trap ? '!' : '-'}</span>{r}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
          {/* Dividend History Table */}
          {dividendsData?.dividends && dividendsData.dividends.length > 0 && (
            <div className="bg-[var(--surface-1)] rounded-xl border border-[var(--border-1)] p-6">
              <h3 className="text-xs font-bold text-[var(--text-3)] uppercase tracking-wider mb-5">Historico de Dividendos</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border-1)]">
                      <th className="text-left py-3 px-3 text-[var(--text-3)] text-[10px] font-bold uppercase tracking-wider"><Term>Data Ex</Term></th>
                      <th className="text-right py-3 px-3 text-[var(--text-3)] text-[10px] font-bold uppercase tracking-wider">Valor/Acao</th>
                      <th className="text-center py-3 px-3 text-[var(--text-3)] text-[10px] font-bold uppercase tracking-wider">Tipo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dividendsData.dividends.slice(0, 12).map((d, i) => (
                      <tr key={i} className="border-b border-[var(--border-1)]/20 hover:bg-[var(--bg)] transition-colors">
                        <td className="py-3 px-3 font-mono text-xs text-[var(--text-1)]">{d.ex_date}</td>
                        <td className="py-3 px-3 text-right font-mono text-xs text-emerald-400 font-bold">{fmtR$(d.value_per_share)}</td>
                        <td className="py-3 px-3 text-center">
                          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-[var(--accent-1)]/10 text-[var(--accent-1)] uppercase tracking-wider">{d.type}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── Disclaimer ──────────────────────────────────── */}
      {score._disclaimer && (
        <div className="text-[10px] text-[var(--text-3)] italic leading-relaxed p-4 bg-[var(--surface-1)] rounded-xl border border-[var(--border-1)]">
          {score._disclaimer}
        </div>
      )}
    </div>
  )
}

// ─── Sub-Components ─────────────────────────────────────────

function RiskMetricCard({ label, value, description, color }: { label: React.ReactNode; value: string; description: string; color: 'pos' | 'warn' | 'neg' }) {
  const borderBg = {
    pos: 'border-emerald-400/20 bg-emerald-400/5',
    warn: 'border-amber-400/20 bg-amber-400/5',
    neg: 'border-red-400/20 bg-red-400/5',
  }
  const textCls = { pos: 'text-emerald-400', warn: 'text-amber-400', neg: 'text-red-400' }
  return (
    <div className={cn('rounded-xl border p-4 text-center', borderBg[color])}>
      <p className="text-[10px] text-[var(--text-3)] font-bold uppercase tracking-wider mb-2">{label}</p>
      <p className={cn('font-mono text-xl font-black', textCls[color])}>{value}</p>
      {description && <p className="text-[10px] text-[var(--text-3)] mt-1 leading-snug">{description}</p>}
    </div>
  )
}

function PillarCard({ label, value, icon }: { label: React.ReactNode; value: number; icon: string }) {
  const base = value >= 65 ? 'border-emerald-400/20 bg-emerald-400/5' :
               value >= 45 ? 'border-[var(--accent-1)]/20 bg-[var(--accent-1)]/5' :
               'border-red-400/20 bg-red-400/5'
  const txt = value >= 65 ? 'text-emerald-400' :
              value >= 45 ? 'text-[var(--accent-1)]' :
              'text-red-400'
  return (
    <div className={cn('rounded-xl p-4 border text-center transition-all hover:scale-[1.02]', base)}>
      <div className="flex items-center justify-center gap-1.5 mb-2">
        <span className={cn('text-[10px] font-black opacity-40', txt)}>{icon}</span>
        <span className="text-[10px] font-bold text-[var(--text-3)] uppercase tracking-wider">{label}</span>
      </div>
      <p className={cn('font-mono text-2xl font-black', txt)}>{value}</p>
    </div>
  )
}

function ValuationMetric({ label, value, highlight }: { label: React.ReactNode; value: string; highlight?: boolean }) {
  return (
    <div className={cn('p-4 rounded-xl text-center transition-all', highlight ? 'bg-[var(--accent-1)]/8 border border-[var(--accent-1)]/20 ring-1 ring-[var(--accent-1)]/10' : 'bg-[var(--bg)] border border-[var(--border-1)]')}>
      <p className="text-[10px] text-[var(--text-3)] font-bold uppercase tracking-wider mb-1">{label}</p>
      <p className={cn('font-mono text-lg font-black', highlight ? 'text-[var(--accent-1)]' : 'text-[var(--text-1)]')}>{value}</p>
    </div>
  )
}

function DossierDimensionCard({ dimension }: { dimension: { nome: string; veredito: string; narrativa: string; evidencias: string[]; alertas: string[] } }) {
  const v = dimension.veredito
  const borderBg = v === 'FORTE' ? 'border-emerald-400/20 bg-emerald-400/5' :
                   v === 'MODERADO' ? 'border-amber-400/20 bg-amber-400/5' :
                   v === 'FRACO' ? 'border-red-400/20 bg-red-400/5' :
                   'border-[var(--border-1)] bg-[var(--bg)]'
  const badgeCls = v === 'FORTE' ? 'text-emerald-400 bg-emerald-400/10' :
                   v === 'MODERADO' ? 'text-amber-400 bg-amber-400/10' :
                   v === 'FRACO' ? 'text-red-400 bg-red-400/10' :
                   'text-[var(--text-3)] bg-[var(--bg)]'
  return (
    <div className={cn('rounded-xl border p-4', borderBg)}>
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-xs font-bold text-[var(--text-1)]">{dimension.nome}</h4>
        <span className={cn('text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full', badgeCls)}>{v}</span>
      </div>
      <p className="text-[11px] text-[var(--text-2)] leading-relaxed line-clamp-3">{dimension.narrativa}</p>
      {dimension.alertas.length > 0 && (
        <div className="mt-3 space-y-1">
          {dimension.alertas.slice(0, 2).map((a, i) => (
            <p key={i} className="text-[10px] text-red-400 flex gap-1"><span className="shrink-0">!</span> {a}</p>
          ))}
        </div>
      )}
    </div>
  )
}
