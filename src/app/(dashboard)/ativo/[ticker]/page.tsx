'use client'

import { useState, useMemo } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { Badge, Skeleton, Disclaimer } from '@/components/ui'
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
import { useMandate } from '@/hooks/use-mandate'
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
  STRONG_BUY: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30',
  BUY: 'bg-blue-500/15 text-blue-600 border-blue-500/30',
  HOLD: 'bg-amber-500/15 text-amber-600 border-amber-500/30',
  REDUCE: 'bg-orange-500/15 text-orange-600 border-orange-500/30',
  AVOID: 'bg-red-500/15 text-red-600 border-red-500/30',
}

const RATING_LABELS: Record<string, string> = {
  STRONG_BUY: 'Compra Forte', BUY: 'Acumular', HOLD: 'Neutro',
  REDUCE: 'Reduzir', AVOID: 'Evitar',
}

// ─── Main Page ──────────────────────────────────────────────
export default function AtivoPage() {
  const params = useParams()
  const ticker = (params['ticker'] as string)?.toUpperCase()
  const { token } = useAuth()
  const { mandate } = useMandate()

  // API calls
  const { data: score, isLoading: loadingScore, isError: errorScore } = useQuery({
    queryKey: ['score', ticker, mandate],
    queryFn: () => pro.getScore(ticker, { mandate }, token ?? undefined),
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

  const { data: mandatesData } = useQuery({
    queryKey: ['mandates', ticker],
    queryFn: () => pro.getScoreMandates(ticker, token ?? undefined).catch(() => null),
    enabled: !!ticker,
    retry: 0,
  })

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

  if (loadingScore) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-24" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <Skeleton className="h-80 lg:col-span-8" />
          <Skeleton className="h-80 lg:col-span-4" />
        </div>
        <Skeleton className="h-48" />
      </div>
    )
  }

  if (errorScore) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-lg text-[var(--text-1)] font-semibold">Erro ao carregar {ticker}</p>
        <p className="text-sm text-[var(--text-2)] mt-2">O backend pode estar indisponível. Tente novamente em alguns minutos.</p>
        <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-[var(--accent-1)] text-white rounded-lg text-sm">Tentar novamente</button>
      </div>
    )
  }

  if (!score || !iq) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-lg text-[var(--text-2)]">Dados indisponíveis para {ticker}</p>
        <p className="text-sm text-[var(--text-2)] mt-2">Verifique se o ticker é válido.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* ─── Header ──────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <AssetLogo ticker={ticker} size={48} />
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-[var(--text-1)]">{ticker}</h1>
              <span className={cn(
                'text-xs font-semibold px-3 py-1 rounded-full border',
                RATING_STYLES[iq.rating] ?? RATING_STYLES['HOLD']
              )}>
                {RATING_LABELS[iq.rating] ?? iq.rating}
              </span>
            </div>
            <p className="text-[var(--text-body)] text-[var(--text-2)]">{score.company_name}</p>
            <p className="text-[var(--text-caption)] text-[var(--text-2)]">
              Cluster {score.cluster} | Mandato: {score.mandate}
            </p>
          </div>
        </div>

        {tickerData?.quote && (
          <div className="text-right">
            <p className="font-mono text-3xl font-bold text-[var(--text-1)]">
              {fmtR$(tickerData.quote.close)}
            </p>
            <p className="text-[var(--text-small)] text-[var(--text-2)] font-mono">
              Vol: {tickerData.quote.volume?.toLocaleString('pt-BR')} | Mkt Cap: {fmtBig(tickerData.quote.market_cap)}
            </p>
          </div>
        )}
      </div>

      {/* ─── Row 1: IQ-Score + Valuation ─────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* IQ-Score Panel */}
        <div className="lg:col-span-4 space-y-4">
          {/* Score Gauge */}
          <div className="bg-[var(--surface-1)] rounded-[var(--radius)] border border-[var(--border-1)] p-6">
            <div className="flex flex-col items-center">
              <ScoreGauge score={iq.iq_score} classification={iq.rating} size={140} />
              <p className="text-sm text-[var(--text-2)] mt-2">IQ-Score {iq.rating_label}</p>
            </div>

            {/* Pillar Breakdown */}
            <div className="grid grid-cols-2 gap-3 mt-6">
              <PillarCard label="Quantitativo" value={iq.score_quanti} icon="Q" />
              <PillarCard label="Qualitativo" value={iq.score_quali} icon="L" />
              <PillarCard label="Valuation" value={iq.score_valuation} icon="V" />
              <PillarCard label="Operacional" value={iq.score_operational} icon="O" />
            </div>
          </div>

          {/* Mandate Compare — how this asset scores across 3 profiles */}
          {mandatesData?.mandates && (
            <div className="bg-[var(--surface-1)] rounded-[var(--radius)] border border-[var(--border-1)] p-5">
              <h3 className="text-sm font-semibold text-[var(--text-1)] mb-3">Score por Mandato</h3>
              <div className="space-y-2">
                {(['CONSERVADOR', 'EQUILIBRADO', 'ARROJADO'] as const).map((m) => {
                  const s = mandatesData.mandates[m]
                  if (!s) return null
                  const isActive = m === mandate
                  return (
                    <div key={m} className={cn('flex items-center gap-3 p-2 rounded-lg transition-colors', isActive && 'bg-[var(--accent-1)]/5 ring-1 ring-[var(--accent-1)]/20')}>
                      <span className="text-[10px] font-bold w-6 text-center text-[var(--text-2)]">{m.charAt(0)}</span>
                      <div className="flex-1 h-2 bg-[var(--bg)] rounded-full overflow-hidden">
                        <div className="h-full bg-[var(--accent-1)] rounded-full transition-all" style={{ width: `${s.iq_score}%` }} />
                      </div>
                      <span className={cn('font-mono text-sm font-bold w-8 text-right', s.iq_score >= 75 ? 'text-[var(--pos)]' : s.iq_score >= 60 ? 'text-[var(--accent-1)]' : 'text-[var(--text-2)]')}>
                        {s.iq_score}
                      </span>
                      <span className="text-[10px] text-[var(--text-3)] w-16 truncate">{s.rating}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Dividend Trap Risk Alert */}
          {trapRisk?.is_dividend_trap && (
            <div className="rounded-[var(--radius)] border border-[var(--neg)]/30 bg-[var(--neg)]/5 p-4">
              <div className="flex items-center gap-2 mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--neg)]">
                  <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                  <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
                <span className="text-sm font-semibold text-[var(--neg)]">Armadilha de Dividendo — Risco {trapRisk.risk_level}</span>
              </div>
              <ul className="space-y-0.5">
                {trapRisk.reasons.map((r, i) => (
                  <li key={i} className="text-[var(--text-caption)] text-[var(--neg)]/80">• {r}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Dividend Safety */}
          {div && div.dividend_safety != null && (
            <div className="bg-[var(--surface-1)] rounded-[var(--radius)] border border-[var(--border-1)] p-5">
              <h3 className="text-sm font-semibold text-[var(--text-1)] mb-3">Dividendos</h3>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[var(--text-caption)] text-[var(--text-2)]">Safety Score</span>
                <span className={cn(
                  'font-mono text-xl font-bold',
                  div.dividend_safety >= 70 ? 'text-[var(--pos)]' :
                  div.dividend_safety >= 50 ? 'text-[var(--warn)]' :
                  'text-[var(--neg)]'
                )}>
                  {div.dividend_safety}
                </span>
              </div>
              {/* Safety bar */}
              <div className="w-full h-2 bg-[var(--bg)] rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all',
                    div.dividend_safety >= 70 ? 'bg-[var(--pos)]' :
                    div.dividend_safety >= 50 ? 'bg-[var(--warn)]' :
                    'bg-[var(--neg)]'
                  )}
                  style={{ width: `${div.dividend_safety}%` }}
                />
              </div>
              <div className="grid grid-cols-2 gap-3 mt-4 text-center">
                <div>
                  <p className="text-[var(--text-caption)] text-[var(--text-2)]">Yield Projetado</p>
                  <p className="font-mono text-sm font-bold text-[var(--text-1)]">{fmtPct(div.projected_yield)}</p>
                </div>
                <div>
                  <p className="text-[var(--text-caption)] text-[var(--text-2)]">CAGR 5a</p>
                  <p className="font-mono text-sm font-bold text-[var(--text-1)]">{fmtPct(div.dividend_cagr_5y)}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Valuation + Thesis */}
        <div className="lg:col-span-8 space-y-4">
          {/* Valuation Card */}
          {dcf && dcf.available && (
            <div className="bg-[var(--surface-1)] rounded-[var(--radius)] border border-[var(--border-1)] p-6">
              <h3 className="text-sm font-semibold text-[var(--text-1)] mb-4">Valuation</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <ValuationMetric label="Preço Justo" value={fmtR$(dcf.intrinsicValue)} highlight />
                <ValuationMetric label="DCF" value={fmtR$(dcf.fairValueDCF)} />
                <ValuationMetric label="Gordon DDM" value={fmtR$(dcf.fairValueGordon)} />
                <ValuationMetric label="Multiplos" value={fmtR$(dcf.fairValueMult)} />
              </div>

              {/* Safety Margin Bar */}
              <div className="mt-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[var(--text-caption)] text-[var(--text-2)]">Margem de Seguranca</span>
                  <span className={cn(
                    'font-mono text-lg font-bold',
                    dcf.safetyMargin > 0.15 ? 'text-[var(--pos)]' :
                    dcf.safetyMargin > 0 ? 'text-[var(--accent-1)]' :
                    'text-[var(--neg)]'
                  )}>
                    {(dcf.safetyMargin * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="relative w-full h-3 bg-[var(--bg)] rounded-full overflow-hidden">
                  {/* Price position indicator */}
                  <div className="absolute inset-0 flex items-center">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all',
                        dcf.safetyMargin > 0.15 ? 'bg-[var(--pos)]' :
                        dcf.safetyMargin > 0 ? 'bg-[var(--accent-1)]' :
                        'bg-[var(--neg)]'
                      )}
                      style={{ width: `${Math.min(Math.max((dcf.safetyMargin + 0.5) * 100, 5), 95)}%` }}
                    />
                  </div>
                </div>
                <div className="flex justify-between mt-1 text-[var(--text-caption)] text-[var(--text-2)] font-mono">
                  <span>P25: {fmtR$(dcf.p25)}</span>
                  <span>Atual: {fmtR$(dcf.currentPrice)}</span>
                  <span>P75: {fmtR$(dcf.p75)}</span>
                </div>
              </div>

              {/* Probabilities */}
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="text-center p-3 rounded-lg bg-[var(--pos)]/5">
                  <p className="text-[var(--text-caption)] text-[var(--text-2)]">Probabilidade Upside</p>
                  <p className="font-mono text-lg font-bold text-[var(--pos)]">{fmtPct(dcf.upsideProb)}</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-[var(--neg)]/5">
                  <p className="text-[var(--text-caption)] text-[var(--text-2)]">Probabilidade Perda</p>
                  <p className="font-mono text-lg font-bold text-[var(--neg)]">{fmtPct(dcf.lossProb)}</p>
                </div>
              </div>

              {/* ─── Monte Carlo Range Visual ──────── */}
              {dcf.p25 != null && dcf.p75 != null && (
                <div className="mt-6 p-4 rounded-lg bg-[var(--bg)]">
                  <h4 className="text-xs font-semibold text-[var(--text-2)] mb-3 uppercase tracking-wider">Monte Carlo — 10.000 Simulações</h4>
                  <div className="relative h-12 flex items-center">
                    {/* Range bar */}
                    <div className="absolute inset-x-0 h-3 bg-[var(--surface-2)] rounded-full" />
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
                          {/* Monte Carlo range */}
                          <div className="absolute h-3 bg-[var(--accent-1)]/30 rounded-full" style={{ left: `${p25Pos}%`, width: `${p75Pos - p25Pos}%` }} />
                          {/* Current price marker */}
                          <div className="absolute w-0.5 h-8 bg-[var(--text-1)]" style={{ left: `${pricePos}%` }} />
                          <div className="absolute -top-1 text-[10px] font-mono font-bold text-[var(--text-1)] -translate-x-1/2" style={{ left: `${pricePos}%` }}>
                            Atual
                          </div>
                          {/* Fair value marker */}
                          {fairPos != null && (
                            <>
                              <div className="absolute w-0.5 h-8 bg-[var(--accent-1)]" style={{ left: `${fairPos}%` }} />
                              <div className="absolute top-8 text-[10px] font-mono font-bold text-[var(--accent-1)] -translate-x-1/2" style={{ left: `${fairPos}%` }}>
                                Justo
                              </div>
                            </>
                          )}
                        </>
                      )
                    })()}
                  </div>
                  <div className="flex justify-between mt-2 text-[10px] font-mono text-[var(--text-3)]">
                    <span>Pessimista {fmtR$(dcf.p25)}</span>
                    <span>Otimista {fmtR$(dcf.p75)}</span>
                  </div>
                </div>
              )}

              {/* ─── DCF Reverso (Implied Growth) ──── */}
              {valuation?.implied_growth != null && (
                <div className="mt-4 p-4 rounded-lg border border-[var(--accent-1)]/20 bg-[var(--accent-1)]/5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-semibold text-[var(--accent-1)] uppercase tracking-wider">DCF Reverso</h4>
                      <p className="text-[var(--text-caption)] text-[var(--text-2)] mt-0.5">
                        O mercado está precificando um crescimento de
                      </p>
                    </div>
                    <span className="font-mono text-2xl font-bold text-[var(--accent-1)]">
                      {valuation.implied_growth_pct ?? `${(valuation.implied_growth * 100).toFixed(1)}%`}
                    </span>
                  </div>
                  <p className="text-[10px] text-[var(--text-3)] mt-2">
                    Se você acredita que a empresa crescerá mais que {valuation.implied_growth_pct ?? `${(valuation.implied_growth * 100).toFixed(1)}%`} ao ano, o preço atual pode estar barato.
                  </p>
                </div>
              )}

              {/* ─── Scenarios (Bull / Base / Bear) ── */}
              {scenarios && scenarios.scenarios && (
                <div className="mt-4">
                  <h4 className="text-xs font-semibold text-[var(--text-2)] mb-3 uppercase tracking-wider">Cenários</h4>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { key: 'bear', label: 'Pessimista', emoji: '', data: scenarios.scenarios['bear'], color: 'neg' },
                      { key: 'base', label: 'Base', emoji: '', data: scenarios.scenarios['base'], color: 'accent-1' },
                      { key: 'bull', label: 'Otimista', emoji: '', data: scenarios.scenarios['bull'], color: 'pos' },
                    ].map(s => {
                      const fv = (s.data as any)?.fair_value
                      const upside = fv && dcf.currentPrice ? ((fv - dcf.currentPrice) / dcf.currentPrice * 100) : null
                      return (
                        <div key={s.key} className={cn('p-3 rounded-lg border text-center', `border-[var(--${s.color})]/20 bg-[var(--${s.color})]/5`)}>
                          <span className="text-lg">{s.emoji}</span>
                          <p className="text-[10px] font-semibold text-[var(--text-2)] mt-1">{s.label}</p>
                          <p className="font-mono text-sm font-bold text-[var(--text-1)]">{fv ? fmtR$(fv) : '-'}</p>
                          {upside != null && (
                            <p className={cn('font-mono text-[10px] font-bold', upside >= 0 ? 'text-[var(--pos)]' : 'text-[var(--neg)]')}>
                              {upside >= 0 ? '+' : ''}{upside.toFixed(1)}%
                            </p>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* ─── DuPont Decomposition ─────────── */}
              {valuation?.dupont && (
                <div className="mt-4 p-4 rounded-lg bg-[var(--bg)]">
                  <h4 className="text-xs font-semibold text-[var(--text-2)] mb-3 uppercase tracking-wider">DuPont — Decomposição do ROE</h4>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div>
                      <p className="text-[var(--text-caption)] text-[var(--text-3)]">Margem</p>
                      <p className="font-mono font-bold text-[var(--text-1)]">{valuation.dupont.margin != null ? (valuation.dupont.margin * 100).toFixed(1) + '%' : '-'}</p>
                    </div>
                    <div>
                      <p className="text-[var(--text-caption)] text-[var(--text-3)]">Giro</p>
                      <p className="font-mono font-bold text-[var(--text-1)]">{valuation.dupont.turnover?.toFixed(2) ?? '-'}x</p>
                    </div>
                    <div>
                      <p className="text-[var(--text-caption)] text-[var(--text-3)]">Alavancagem</p>
                      <p className="font-mono font-bold text-[var(--text-1)]">{valuation.dupont.leverage?.toFixed(2) ?? '-'}x</p>
                    </div>
                  </div>
                  {valuation.dupont.driver && (
                    <p className="text-[10px] text-[var(--text-3)] text-center mt-2">
                      Driver principal: <span className="font-semibold text-[var(--accent-1)]">{valuation.dupont.driver}</span>
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Scenario Builder — interactive valuation */}
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

          {/* Thesis */}
          {(thesis || score.thesis_summary) && (
            <div className="bg-[var(--surface-1)] rounded-[var(--radius)] border border-[var(--border-1)] p-6">
              <h3 className="text-sm font-semibold text-[var(--text-1)] mb-3">Tese de Investimento</h3>
              <p className="text-[var(--text-body)] text-[var(--text-2)] leading-relaxed whitespace-pre-line">
                {thesis?.thesis_text ?? score.thesis_summary}
              </p>
              {thesis?.bull_case && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div className="p-3 rounded-lg bg-[var(--pos)]/5 border border-[var(--pos)]/10">
                    <p className="text-xs font-semibold text-[var(--pos)] mb-1">Bull Case</p>
                    <p className="text-sm text-[var(--text-2)]">{thesis.bull_case}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-[var(--neg)]/5 border border-[var(--neg)]/10">
                    <p className="text-xs font-semibold text-[var(--neg)] mb-1">Bear Case</p>
                    <p className="text-sm text-[var(--text-2)]">{thesis.bear_case}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ─── Row 2: Drivers (XAI Evidence) ──────────────── */}
      {(drivers.positive.length > 0 || drivers.negative.length > 0) && (
        <div className="bg-[var(--surface-1)] rounded-[var(--radius)] border border-[var(--border-1)] p-6">
          <h3 className="text-sm font-semibold text-[var(--text-1)] mb-4">Drivers do IQ-Score (XAI)</h3>
          <DriversList positive={drivers.positive} negative={drivers.negative} />
        </div>
      )}

      {/* ─── Row 3: Score X-Ray (radar + criteria expandível) ── */}
      {score.evidences && score.evidences.length > 0 && (
        <IQCognitXRay
          evidences={score.evidences}
          iqScore={iq.iq_score}
          rating={iq.rating}
          ratingLabel={iq.rating_label}
        />
      )}

      {/* ─── Row 4: Dossier Qualitativo ─────────────────── */}
      {dossier && dossier.dimensoes && dossier.dimensoes.length > 0 && (
        <div className="bg-[var(--surface-1)] rounded-[var(--radius)] border border-[var(--border-1)] p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-[var(--text-1)]">Dossier Qualitativo</h3>
            <span className={cn(
              'text-xs font-medium px-2 py-1 rounded-full',
              dossier.veredito_geral?.includes('BOM') ? 'bg-[var(--pos)]/10 text-[var(--pos)]' :
              'bg-[var(--warn)]/10 text-[var(--warn)]'
            )}>
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

      {/* ─── Row 4b: Risk Metrics (Merton PD, Piotroski, etc) ── */}
      {riskMetrics && (
        <div className="bg-[var(--surface-1)] rounded-[var(--radius)] border border-[var(--border-1)] p-6">
          <h3 className="text-sm font-semibold text-[var(--text-1)] mb-4">Risk Lab</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {riskMetrics.risk_metrics.merton_pd != null && (
              <RiskMetricCard
                label="Merton PD"
                value={`${(riskMetrics.risk_metrics.merton_pd * 100).toFixed(2)}%`}
                description="Prob. default estrutural"
                color={riskMetrics.risk_metrics.merton_pd < 0.05 ? 'pos' : riskMetrics.risk_metrics.merton_pd < 0.15 ? 'warn' : 'neg'}
              />
            )}
            {riskMetrics.risk_metrics.piotroski_score != null && (
              <RiskMetricCard
                label="Piotroski"
                value={`${riskMetrics.risk_metrics.piotroski_score}/9`}
                description="Saúde financeira"
                color={riskMetrics.risk_metrics.piotroski_score >= 7 ? 'pos' : riskMetrics.risk_metrics.piotroski_score >= 5 ? 'warn' : 'neg'}
              />
            )}
            {riskMetrics.risk_metrics.altman_z != null && (
              <RiskMetricCard
                label="Altman Z"
                value={riskMetrics.risk_metrics.altman_z.toFixed(2)}
                description={riskMetrics.risk_metrics.altman_z_label ?? ''}
                color={riskMetrics.risk_metrics.altman_z > 2.99 ? 'pos' : riskMetrics.risk_metrics.altman_z > 1.81 ? 'warn' : 'neg'}
              />
            )}
            {riskMetrics.risk_metrics.dl_ebitda != null && (
              <RiskMetricCard
                label="DL/EBITDA"
                value={riskMetrics.risk_metrics.dl_ebitda.toFixed(1) + 'x'}
                description="Alavancagem"
                color={riskMetrics.risk_metrics.dl_ebitda < 2 ? 'pos' : riskMetrics.risk_metrics.dl_ebitda < 3.5 ? 'warn' : 'neg'}
              />
            )}
            {riskMetrics.risk_metrics.icj != null && (
              <RiskMetricCard
                label="Cobertura Juros"
                value={riskMetrics.risk_metrics.icj.toFixed(1) + 'x'}
                description="EBIT / Juros"
                color={riskMetrics.risk_metrics.icj > 5 ? 'pos' : riskMetrics.risk_metrics.icj > 2 ? 'warn' : 'neg'}
              />
            )}
            {riskMetrics.profitability.spread_roic_wacc != null && (
              <RiskMetricCard
                label="ROIC - WACC"
                value={`${(riskMetrics.profitability.spread_roic_wacc * 100).toFixed(1)}pp`}
                description="Criação de valor"
                color={riskMetrics.profitability.spread_roic_wacc > 0 ? 'pos' : 'neg'}
              />
            )}
          </div>
        </div>
      )}

      {/* ─── Row 4c: News with Sentiment ─────────────────── */}
      {newsData?.news && newsData.news.length > 0 && (
        <div className="bg-[var(--surface-1)] rounded-[var(--radius)] border border-[var(--border-1)] p-6">
          <h3 className="text-sm font-semibold text-[var(--text-1)] mb-4">Notícias Recentes</h3>
          <div className="space-y-3">
            {newsData.news.slice(0, 6).map((n) => (
              <a
                key={n.id}
                href={n.url ?? '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-3 p-3 rounded-lg hover:bg-[var(--surface-2)] transition-colors"
              >
                <span className={cn(
                  'mt-0.5 w-2 h-2 rounded-full flex-shrink-0',
                  n.sentiment === 'positive' ? 'bg-[var(--pos)]' :
                  n.sentiment === 'negative' ? 'bg-[var(--neg)]' :
                  'bg-[var(--text-3)]'
                )} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-[var(--text-1)] font-medium line-clamp-2">{n.title}</p>
                  <div className="flex items-center gap-2 mt-1 text-[var(--text-caption)] text-[var(--text-2)]">
                    {n.source && <span>{n.source}</span>}
                    <span>{new Date(n.published_at).toLocaleDateString('pt-BR')}</span>
                    {n.sentiment_score != null && (
                      <span className={cn(
                        'font-mono text-[10px] px-1.5 py-0.5 rounded',
                        n.sentiment === 'positive' ? 'bg-[var(--pos)]/10 text-[var(--pos)]' :
                        n.sentiment === 'negative' ? 'bg-[var(--neg)]/10 text-[var(--neg)]' :
                        'bg-[var(--surface-2)] text-[var(--text-3)]'
                      )}>
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

      {/* ─── Row 4d: Investor Relations (CVM filings) ──── */}
      {investorRelations?.events && investorRelations.events.length > 0 && (
        <div className="bg-[var(--surface-1)] rounded-[var(--radius)] border border-[var(--border-1)] p-6">
          <h3 className="text-sm font-semibold text-[var(--text-1)] mb-4">Documentos & Relações com Investidores</h3>
          <div className="space-y-2">
            {investorRelations.events.slice(0, 8).map((ev) => (
              <a
                key={ev.id}
                href={ev.url ?? '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-[var(--surface-2)] transition-colors"
              >
                <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-[var(--surface-2)] text-[var(--text-3)] shrink-0">
                  {ev.event_type}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[var(--text-1)] truncate">{ev.title}</p>
                  <p className="text-[var(--text-caption)] text-[var(--text-2)]">
                    {ev.source} · {new Date(ev.published_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--text-3)] shrink-0">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
                </svg>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* ─── Row 5: Fundamentals Table ──────────────────── */}
      {financialsData?.financials && financialsData.financials.length > 0 && (
        <div className="bg-[var(--surface-1)] rounded-[var(--radius)] border border-[var(--border-1)] p-6">
          <h3 className="text-sm font-semibold text-[var(--text-1)] mb-4">Indicadores Fundamentalistas</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border-1)]">
                  <th className="text-left py-2 px-3 text-[var(--text-2)] font-medium">Periodo</th>
                  <th className="text-right py-2 px-3 text-[var(--text-2)] font-medium">Receita</th>
                  <th className="text-right py-2 px-3 text-[var(--text-2)] font-medium">Lucro Liq.</th>
                  <th className="text-right py-2 px-3 text-[var(--text-2)] font-medium">ROE</th>
                  <th className="text-right py-2 px-3 text-[var(--text-2)] font-medium">DL/EBITDA</th>
                  <th className="text-right py-2 px-3 text-[var(--text-2)] font-medium">Margem Liq.</th>
                  <th className="text-right py-2 px-3 text-[var(--text-2)] font-medium">Margem Bruta</th>
                  <th className="text-right py-2 px-3 text-[var(--text-2)] font-medium">Piotroski</th>
                </tr>
              </thead>
              <tbody>
                {financialsData.financials.map((f) => (
                  <tr key={f.period} className="border-b border-[var(--border-1)]/30 hover:bg-[var(--surface-2)] transition-colors">
                    <td className="py-2.5 px-3 font-mono font-medium text-[var(--text-1)]">{f.period?.slice(0, 4)}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-[var(--text-1)]">{fmtBig(f.revenue)}</td>
                    <td className={cn('py-2.5 px-3 text-right font-mono',
                      (f.net_income ?? 0) >= 0 ? 'text-[var(--text-1)]' : 'text-[var(--neg)]'
                    )}>{fmtBig(f.net_income)}</td>
                    <td className={cn('py-2.5 px-3 text-right font-mono',
                      (f.roe ?? 0) >= 0.15 ? 'text-[var(--pos)]' : 'text-[var(--text-1)]'
                    )}>{fmtPct(f.roe)}</td>
                    <td className={cn('py-2.5 px-3 text-right font-mono',
                      (f.dl_ebitda ?? 0) > 3 ? 'text-[var(--neg)]' : 'text-[var(--text-1)]'
                    )}>{f.dl_ebitda?.toFixed(1) ?? '--'}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-[var(--text-1)]">{fmtPct(f.net_margin)}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-[var(--text-1)]">{fmtPct(f.gross_margin)}</td>
                    <td className={cn('py-2.5 px-3 text-right font-mono font-medium',
                      (f.piotroski_score ?? 0) >= 7 ? 'text-[var(--pos)]' :
                      (f.piotroski_score ?? 0) >= 5 ? 'text-[var(--text-1)]' :
                      'text-[var(--neg)]'
                    )}>{f.piotroski_score ?? '--'}/9</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── Row 6: Peers ──────────────────────────────── */}
      {peersData?.peers && peersData.peers.length > 0 && (
        <div className="bg-[var(--surface-1)] rounded-[var(--radius)] border border-[var(--border-1)] p-6">
          <h3 className="text-sm font-semibold text-[var(--text-1)] mb-4">Peers do Setor</h3>
          <div className="flex flex-wrap gap-2">
            {peersData.peers.slice(0, 12).map((peer) => (
              <Link
                key={peer.ticker}
                href={`/ativo/${peer.ticker}`}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--bg)] border border-[var(--border-1)]/50 hover:border-[var(--accent-1)]/50 transition-colors text-sm"
              >
                <AssetLogo ticker={peer.ticker} size={20} />
                <span className="font-medium text-[var(--text-1)]">{peer.ticker}</span>
                <span className="text-[var(--text-2)] text-xs truncate max-w-[100px]">{peer.company_name}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ─── Row 7: Dividends History ──────────────────── */}
      {dividendsData?.dividends && dividendsData.dividends.length > 0 && (
        <div className="bg-[var(--surface-1)] rounded-[var(--radius)] border border-[var(--border-1)] p-6">
          <h3 className="text-sm font-semibold text-[var(--text-1)] mb-4">Histórico de Dividendos</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border-1)]">
                  <th className="text-left py-2 px-3 text-[var(--text-2)] font-medium">Data Ex</th>
                  <th className="text-right py-2 px-3 text-[var(--text-2)] font-medium">Valor/Acao</th>
                  <th className="text-center py-2 px-3 text-[var(--text-2)] font-medium">Tipo</th>
                </tr>
              </thead>
              <tbody>
                {dividendsData.dividends.slice(0, 12).map((d, i) => (
                  <tr key={i} className="border-b border-[var(--border-1)]/30">
                    <td className="py-2 px-3 font-mono text-[var(--text-1)]">{d.ex_date}</td>
                    <td className="py-2 px-3 text-right font-mono text-[var(--pos)]">
                      {fmtR$(d.value_per_share)}
                    </td>
                    <td className="py-2 px-3 text-center">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--accent-1)]/10 text-[var(--accent-1)]">
                        {d.type}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── Disclaimer ──────────────────────────────────── */}
      {score._disclaimer && (
        <div className="text-[var(--text-caption)] text-[var(--text-2)] italic leading-relaxed p-4 bg-[var(--bg)] rounded-[var(--radius)] border border-[var(--border-1)]/30">
          {score._disclaimer}
        </div>
      )}
    </div>
  )
}

// ─── Sub-Components ─────────────────────────────────────────

function RiskMetricCard({ label, value, description, color }: { label: string; value: string; description: string; color: 'pos' | 'warn' | 'neg' }) {
  const colors = {
    pos: 'border-[var(--pos)]/20 bg-[var(--pos)]/5',
    warn: 'border-amber-500/20 bg-amber-500/5',
    neg: 'border-[var(--neg)]/20 bg-[var(--neg)]/5',
  }
  const textColors = { pos: 'text-[var(--pos)]', warn: 'text-amber-500', neg: 'text-[var(--neg)]' }
  return (
    <div className={cn('rounded-lg border p-3 text-center', colors[color])}>
      <p className="text-[var(--text-caption)] text-[var(--text-2)] mb-1">{label}</p>
      <p className={cn('font-mono text-lg font-bold', textColors[color])}>{value}</p>
      {description && <p className="text-[10px] text-[var(--text-3)] mt-0.5">{description}</p>}
    </div>
  )
}

function PillarCard({ label, value, icon }: { label: string; value: number; icon: string }) {
  const color = value >= 65 ? 'text-[var(--pos)] bg-[var(--pos)]/8 border-[var(--pos)]/20' :
                value >= 45 ? 'text-[var(--accent-1)] bg-[var(--accent-1)]/8 border-[var(--accent-1)]/20' :
                'text-[var(--neg)] bg-[var(--neg)]/8 border-[var(--neg)]/20'
  return (
    <div className={cn('rounded-lg p-3 border text-center transition-colors', color)}>
      <div className="flex items-center justify-center gap-1 mb-1">
        <span className="text-xs font-bold opacity-50">{icon}</span>
        <span className="text-[var(--text-caption)] font-medium">{label}</span>
      </div>
      <p className="font-mono text-xl font-bold">{value}</p>
    </div>
  )
}

function ValuationMetric({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={cn('p-3 rounded-lg text-center', highlight ? 'bg-[var(--accent-1)]/8 border border-[var(--accent-1)]/20' : 'bg-[var(--bg)]')}>
      <p className="text-[var(--text-caption)] text-[var(--text-2)]">{label}</p>
      <p className={cn('font-mono text-lg font-bold', highlight ? 'text-[var(--accent-1)]' : 'text-[var(--text-1)]')}>
        {value}
      </p>
    </div>
  )
}


function DossierDimensionCard({ dimension }: { dimension: { nome: string; veredito: string; narrativa: string; evidencias: string[]; alertas: string[] } }) {
  const veredict = dimension.veredito
  const color = veredict === 'FORTE' ? 'border-[var(--pos)]/30 bg-[var(--pos)]/5' :
                veredict === 'MODERADO' ? 'border-[var(--warn)]/30 bg-[var(--warn)]/5' :
                veredict === 'FRACO' ? 'border-[var(--neg)]/30 bg-[var(--neg)]/5' :
                'border-[var(--border-1)]/30 bg-[var(--bg)]'
  const badgeColor = veredict === 'FORTE' ? 'text-[var(--pos)]' :
                     veredict === 'MODERADO' ? 'text-[var(--warn)]' :
                     veredict === 'FRACO' ? 'text-[var(--neg)]' :
                     'text-[var(--text-2)]'

  return (
    <div className={cn('rounded-lg border p-4', color)}>
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-xs font-semibold text-[var(--text-1)]">{dimension.nome}</h4>
        <span className={cn('text-[10px] font-bold uppercase', badgeColor)}>{veredict}</span>
      </div>
      <p className="text-[11px] text-[var(--text-2)] leading-relaxed line-clamp-3">{dimension.narrativa}</p>
      {dimension.alertas.length > 0 && (
        <div className="mt-2 space-y-0.5">
          {dimension.alertas.slice(0, 2).map((a, i) => (
            <p key={i} className="text-[10px] text-[var(--neg)]">! {a}</p>
          ))}
        </div>
      )}
    </div>
  )
}
