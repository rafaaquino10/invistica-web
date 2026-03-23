'use client'

import { useState, useMemo } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { Badge, Skeleton, Disclaimer } from '@/components/ui'
import { AssetLogo } from '@/components/ui/asset-logo'
import { DriversList } from '@/components/ui/drivers-list'
import { ScoreGauge } from '@/components/score/score-gauge'
import { ScoreXRay } from '@/components/score/score-xray'
import { QualitativeCards } from '@/components/score/qualitative-cards'
import { IndicatorGrid } from '@/components/score/indicator-grid'
import { PaywallGate } from '@/components/billing/paywall-gate'
import { DividendSummary } from '@/components/asset/dividend-summary'
import { NewsSection } from '@/components/asset/news-section'
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
  const ticker = (params.ticker as string)?.toUpperCase()
  const { token } = useAuth()

  // API calls
  const { data: score, isLoading: loadingScore } = useQuery({
    queryKey: ['score', ticker],
    queryFn: () => pro.getScore(ticker, { mandate: 'EQUILIBRADO' }, token ?? undefined),
    enabled: !!ticker,
  })

  const { data: valuation, isLoading: loadingVal } = useQuery({
    queryKey: ['valuation', ticker],
    queryFn: () => pro.getValuation(ticker, token ?? undefined),
    enabled: !!ticker,
  })

  const { data: tickerData } = useQuery({
    queryKey: ['ticker-detail', ticker],
    queryFn: () => free.getTicker(ticker),
    enabled: !!ticker,
  })

  const { data: financialsData } = useQuery({
    queryKey: ['financials', ticker],
    queryFn: () => free.getFinancials(ticker, 6),
    enabled: !!ticker,
  })

  const { data: peersData } = useQuery({
    queryKey: ['peers', ticker],
    queryFn: () => free.getPeers(ticker),
    enabled: !!ticker,
  })

  const { data: dividendsData } = useQuery({
    queryKey: ['dividends', ticker],
    queryFn: () => free.getDividends(ticker),
    enabled: !!ticker,
  })

  const { data: dossier } = useQuery({
    queryKey: ['dossier', ticker],
    queryFn: () => pro.getDossier(ticker, token ?? undefined),
    enabled: !!ticker,
  })

  const { data: thesis } = useQuery({
    queryKey: ['thesis', ticker],
    queryFn: () => pro.getThesis(ticker, token ?? undefined),
    enabled: !!ticker,
  })

  // Adapt data
  const asset = useMemo(() => {
    if (!score) return null
    return adaptScoreToAsset(
      score,
      tickerData as any,
      financialsData?.financials as any,
      peersData?.peers,
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

  if (!score || !iq) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-lg text-[var(--text-2)]">Dados indisponiveis para {ticker}</p>
        <p className="text-sm text-[var(--text-2)] mt-2">Verifique se a API InvestIQ esta rodando e se o ticker e valido.</p>
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
                RATING_STYLES[iq.rating] ?? RATING_STYLES.HOLD
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
                <ValuationMetric label="Preco Justo" value={fmtR$(dcf.intrinsicValue)} highlight />
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
            </div>
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

      {/* ─── Row 3: Evidence Cards ──────────────────────── */}
      {score.evidences && score.evidences.length > 0 && (
        <div className="bg-[var(--surface-1)] rounded-[var(--radius)] border border-[var(--border-1)] p-6">
          <h3 className="text-sm font-semibold text-[var(--text-1)] mb-4">Evidencias Detalhadas</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {score.evidences.map((ev) => (
              <EvidenceCard key={ev.criterion_id} evidence={ev} />
            ))}
          </div>
        </div>
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
          <h3 className="text-sm font-semibold text-[var(--text-1)] mb-4">Historico de Dividendos</h3>
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

function EvidenceCard({ evidence }: { evidence: Evidence }) {
  const scoreColor = evidence.score >= 65 ? 'text-[var(--pos)]' :
                     evidence.score >= 45 ? 'text-[var(--accent-1)]' :
                     'text-[var(--neg)]'
  return (
    <div className="border border-[var(--border-1)]/50 rounded-lg p-4 hover:border-[var(--border-1)] transition-colors">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold text-[var(--text-1)]">{evidence.criterion_name}</span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-[var(--text-2)]">Peso: {(evidence.weight * 100).toFixed(0)}%</span>
          <span className={cn('font-mono text-sm font-bold', scoreColor)}>{evidence.score}</span>
        </div>
      </div>
      <p className="text-xs text-[var(--text-2)] mb-3 leading-relaxed">{evidence.evidence_text}</p>
      <div className="flex gap-4">
        {evidence.bull_points.length > 0 && (
          <div className="flex-1 space-y-1">
            <p className="text-[10px] font-semibold text-[var(--pos)] uppercase tracking-wider">Positivo</p>
            {evidence.bull_points.slice(0, 3).map((p, i) => (
              <p key={i} className="text-[11px] text-[var(--text-2)] flex items-start gap-1">
                <span className="text-[var(--pos)] mt-0.5">+</span> {p}
              </p>
            ))}
          </div>
        )}
        {evidence.bear_points.length > 0 && (
          <div className="flex-1 space-y-1">
            <p className="text-[10px] font-semibold text-[var(--neg)] uppercase tracking-wider">Risco</p>
            {evidence.bear_points.slice(0, 3).map((p, i) => (
              <p key={i} className="text-[11px] text-[var(--text-2)] flex items-start gap-1">
                <span className="text-[var(--neg)] mt-0.5">-</span> {p}
              </p>
            ))}
          </div>
        )}
      </div>
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
