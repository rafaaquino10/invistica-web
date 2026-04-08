'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Badge, Button, Skeleton, ScoreBadge, ChangeIndicator, Disclaimer } from '@/components/ui'
import { TVChart, type TimeRange } from '@/components/charts'
import { trpc } from '@/lib/trpc/provider'
import { formatCurrency } from '@/lib/utils/formatters'
import { cn } from '@/lib/utils'
import { ScoreXRay } from '@/components/score/score-xray'
import { ScoreGauge } from '@/components/score/score-gauge'
import { ScoreEvolutionChart } from '@/components/score/score-evolution-chart'
import { PaywallGate } from '@/components/billing/paywall-gate'
import { AssetLogo } from '@/components/ui/asset-logo'
import { DriversList, type Driver } from '@/components/ui/drivers-list'
import { ResearchNote } from '@/components/score/score-semaphore'
import { CommentSection } from '@/components/community/comment-section'
import { DCFCard } from '@/components/valuation/dcf-card'
import { MonteCarloCard } from '@/components/valuation/monte-carlo-card'
import { SensitivityCard } from '@/components/analytics/sensitivity-card'
import { DividendSummary } from '@/components/asset/dividend-summary'
import { DividendTrapCard } from '@/components/asset/dividend-trap-card'
import { EventCalendar } from '@/components/asset/event-calendar'
import { NewsSection } from '@/components/asset/news-section'
import { QualitativeCards } from '@/components/score/qualitative-cards'
import { IndicatorGrid } from '@/components/score/indicator-grid'
import { RiskLab } from '@/components/score/risk-lab'
import { ThesisCard } from '@/components/score/thesis-card'
import { EvidenceExplorer } from '@/components/score/evidence-explorer'
import { DossierReport } from '@/components/score/dossier-report'

const RANGE_MAP: Record<TimeRange, { range: string; interval: string }> = {
  '1D': { range: '1d', interval: '1d' },
  '5D': { range: '5d', interval: '1d' },
  '1M': { range: '1mo', interval: '1d' },
  '3M': { range: '3mo', interval: '1d' },
}

// ─── Formatadores ──────────────────────────────────
function fmtR(val: unknown, d = 1): string {
  const n = val != null ? Number(val) : null
  if (n === null || isNaN(n) || n === 0) return '—'
  return n.toFixed(d)
}
function fmtP(val: unknown): string {
  const n = val != null ? Number(val) : null
  if (n === null || isNaN(n) || n === 0) return '—'
  return `${n.toFixed(1)}%`
}
function fmtBig(val: unknown): string {
  const n = val != null ? Number(val) : null
  if (n === null || isNaN(n) || n === 0) return '—'
  if (Math.abs(n) >= 1e9) return `R$${(n / 1e9).toFixed(1)}B`
  if (Math.abs(n) >= 1e6) return `R$${(n / 1e6).toFixed(0)}M`
  return `R$${n.toLocaleString('pt-BR')}`
}

// ─── Extração de drivers a partir do scoreBreakdown ──────────────
const DRIVER_INDICATOR_LABELS: Record<string, string> = {
  P_L: 'P/L', P_VP: 'P/VP', PSR: 'PSR', P_EBIT: 'P/EBIT',
  EV_EBIT: 'EV/EBIT', EV_EBITDA: 'EV/EBITDA', ROIC: 'ROIC', ROE: 'ROE',
  MRG_EBIT: 'Margem EBIT', MRG_LIQUIDA: 'Margem Líquida',
  LIQ_CORRENTE: 'Liq. Corrente', DIV_BRUT_PATRIM: 'Dív/Patrimônio',
  P_CAP_GIRO: 'P/Cap. Giro', P_ATIV_CIRC_LIQ: 'P/At. Circ. Líq.',
  P_ATIVO: 'P/Ativo', DIV_YIELD: 'Dividend Yield',
  DIV_EBITDA: 'Dív. Líq./EBITDA', PAYOUT: 'Payout',
  CRESC_REC_5A: 'Cresc. Receita 5a', CRESC_LUCRO_5A: 'Cresc. Lucro 5a',
  PEG_RATIO: 'PEG Ratio',
  MOAT_SCORE: 'Vantagem Competitiva', EARNINGS_QUALITY: 'Qualidade do Lucro',
  MANAGEMENT_SCORE: 'Gestão & Governança', DEBT_SUSTAINABILITY: 'Sustentabilidade da Dívida',
  REGULATORY_RISK: 'Risco Regulatório',
}

const DRIVER_PILLAR_LABELS: Record<string, string> = {
  valuation: 'Valuation', qualidade: 'Qualidade', risco: 'Risco',
  dividendos: 'Dividendos', crescimento: 'Crescimento', qualitativo: 'Qualitativo',
}

const DRIVER_PILLAR_ORDER = ['valuation', 'qualidade', 'risco', 'dividendos', 'crescimento', 'qualitativo'] as const

function extractDrivers(breakdown: any): { positive: Driver[]; negative: Driver[] } {
  const all: { text: string; pillar: string; value?: string; nota: number }[] = []
  const pctIndicators = ['ROIC', 'ROE', 'MRG_EBIT', 'MRG_LIQUIDA', 'DIV_YIELD', 'PAYOUT', 'CRESC_REC_5A', 'CRESC_LUCRO_5A']

  for (const key of DRIVER_PILLAR_ORDER) {
    const pilar = breakdown.pilares?.[key]
    if (!pilar?.subNotas) continue
    for (const sub of pilar.subNotas) {
      if (sub.valor === null && sub.nota === 5) continue
      const label = DRIVER_INDICATOR_LABELS[sub.indicador as string] ?? sub.indicador
      const valStr = sub.valor != null
        ? pctIndicators.includes(sub.indicador) ? `${Number(sub.valor).toFixed(1)}%` : Number(sub.valor).toFixed(2)
        : undefined
      all.push({
        text: `${label} ${sub.nota >= 7 ? 'acima' : sub.nota < 4 ? 'abaixo' : 'dentro'} das referências`,
        pillar: DRIVER_PILLAR_LABELS[key] ?? key,
        value: valStr,
        nota: sub.nota,
      })
    }
  }

  const sorted = [...all].sort((a, b) => b.nota - a.nota)
  return {
    positive: sorted.filter(s => s.nota >= 6).slice(0, 3),
    negative: sorted.filter(s => s.nota < 5).slice(-3).reverse(),
  }
}

function pillarBarColor(v: number) {
  if (v >= 70) return 'bg-teal'
  if (v >= 40) return 'bg-amber'
  return 'bg-red'
}
function pillarTextColor(v: number) {
  if (v >= 70) return 'text-teal'
  if (v >= 40) return 'text-amber'
  return 'text-red'
}

// ─── Classificação inline ──────────────────────────────────
function classifLabel(score: number): { label: string; color: string } {
  if (score >= 81) return { label: 'Excepcional', color: 'text-[var(--accent-1)]' }
  if (score >= 61) return { label: 'Saudável', color: 'text-teal' }
  if (score >= 31) return { label: 'Atenção', color: 'text-amber' }
  return { label: 'Crítico', color: 'text-red' }
}

export default function AssetDetailPage() {
  const params = useParams()
  const ticker = (params['ticker'] as string)?.toUpperCase()
  const [chartRange, setChartRange] = useState<TimeRange>('1M')

  const { data: asset, isLoading, error } = trpc.assets.getByTicker.useQuery(
    { ticker },
    { enabled: !!ticker }
  )

  const rangeConfig = RANGE_MAP[chartRange]
  const { data: historyData, isFetching: isChartLoading } = trpc.assets.getHistory.useQuery(
    { ticker, range: rangeConfig.range as any, interval: rangeConfig.interval as any },
    { enabled: !!ticker, placeholderData: undefined }
  )

  if (isLoading) return <LoadingSkeleton />

  if (error || !asset) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-16 h-16 rounded-full bg-red/10 flex items-center justify-center mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
        </div>
        <h2 className="text-[var(--text-heading)] font-bold mb-1">Ativo não encontrado</h2>
        <p className="text-[var(--text-small)] text-[var(--text-2)] mb-4">O ticker {ticker} não existe em nossa base.</p>
        <Link href="/explorer"><Button size="sm">Voltar ao Explorer</Button></Link>
      </div>
    )
  }

  const score = asset.aqScore ? Number(asset.aqScore.scoreTotal) : null
  const currentPrice = (asset as any).price ?? (asset.quotes.length > 0 ? Number((asset.quotes[asset.quotes.length - 1] as any).close) : null)
  const currentChange = (asset as any).changePercent ?? null
  const f = (asset.fundamentals.find((x: any) => x.periodType === 'annual') || asset.fundamentals[0]) as any
  const pillars = asset.aqScore ? {
    valuation: Number(asset.aqScore.scoreValuation),
    quality: Number(asset.aqScore.scoreQuality),
    growth: Number(asset.aqScore.scoreGrowth),
    dividends: Number(asset.aqScore.scoreDividends),
    risk: Number(asset.aqScore.scoreRisk),
    qualitativo: Number((asset.aqScore as any).scoreQualitativo ?? 0),
  } : null

  const priceData = (historyData ?? [])
    .map((q: any) => {
      const raw = q.date
      let dateStr: string
      if (raw instanceof Date) dateStr = raw.toISOString()
      else if (typeof raw === 'number') dateStr = new Date(raw > 1e12 ? raw : raw * 1000).toISOString()
      else dateStr = String(raw ?? '')
      return {
        date: dateStr,
        close: Number(q.close) || 0,
        open: q.open ? Number(q.open) : undefined,
        high: q.high ? Number(q.high) : undefined,
        low: q.low ? Number(q.low) : undefined,
        volume: q.volume ? Number(q.volume) : undefined,
      }
    })
    .filter(q => q.close > 0 && q.date.length > 0)

  const intelligence = (asset as any).intelligence
  const companyProfile = (asset as any).companyProfile
  const sectorPeers = (asset as any).sectorPeers ?? []
  const scoreBreakdownData = (asset as any).scoreBreakdown
  const backendValuation = (asset as any).backendValuation ?? null
  const thesis = (asset as any).thesis ?? null
  const dividendData = (asset as any).dividendData ?? null
  const riskMetrics = (asset as any).riskMetrics ?? null
  const narrative = (asset as any).narrative as { badge: { label: string; color: string; emoji: string }; oneLiner: string; researchNote: string; highlights: { strengths: string[]; weaknesses: string[]; context: string } } | null
  const drivers = scoreBreakdownData ? extractDrivers(scoreBreakdownData) : null
  const classif = score != null ? classifLabel(score) : null

  // Qualitativo subNotas from scoreBreakdown
  const qualitativoSubNotas = scoreBreakdownData?.pilares?.qualitativo?.subNotas ?? []

  return (
    <div className="space-y-6">
      {/* ─── 1. Breadcrumb ──────────────────────────────────── */}
      <div className="flex items-center gap-2 text-[var(--text-small)] text-[var(--text-2)]">
        <Link href="/explorer" className="hover:text-[var(--accent-1)] transition-colors">Explorer</Link>
        <span>/</span>
        <span className="font-medium text-[var(--text-1)]">{ticker}</span>
      </div>

      {/* ─── 1. Hero: Identidade + Preço + Score + Diagnóstico ──────── */}
      <div className="flex flex-col md:flex-row md:items-start gap-4 md:gap-0 md:justify-between">
        <div className="flex items-center gap-4">
          <AssetLogo ticker={ticker} logo={asset.logo} size={48} />
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="font-mono font-bold text-[var(--text-heading)]">{ticker}</h1>
              <Badge variant="primary" size="sm">{asset.sector ?? 'Ação'}</Badge>
              {classif && (
                <span className={cn('text-[12px] font-semibold px-2 py-0.5 rounded-full border', {
                  'bg-[var(--accent-1)]/10 border-[var(--accent-1)]/20 text-[var(--accent-1)]': classif.label === 'Excepcional',
                  'bg-teal/10 border-teal/20 text-teal': classif.label === 'Saudável',
                  'bg-amber/10 border-amber/20 text-amber': classif.label === 'Atenção',
                  'bg-red/10 border-red/20 text-red': classif.label === 'Crítico',
                })}>
                  {classif.label}
                </span>
              )}
            </div>
            <p className="text-[13px] font-sans text-[var(--text-2)] mt-0.5">{asset.name}</p>
          </div>
        </div>
        <div className="flex items-start gap-4 sm:gap-6 flex-wrap">
          <div className="text-left sm:text-right">
            <p className="font-mono text-[var(--text-display)] font-bold tracking-tight leading-none">
              {currentPrice != null ? formatCurrency(currentPrice) : '—'}
            </p>
            {currentChange != null && (
              <div className="mt-1"><ChangeIndicator value={currentChange} size="md" /></div>
            )}
          </div>
          {score !== null && (
            <div className="pl-0 sm:pl-6 border-l-0 sm:border-l border-[var(--border-1)] flex items-center gap-3 mt-2 sm:mt-0">
              <ScoreGauge
                score={score}
                classification={scoreBreakdownData?.classificacao}
                size={64}
              />
              {scoreBreakdownData?.metadata?.confiabilidade != null && (
                <div className="text-[var(--text-caption)] text-[var(--text-3)]">
                  <span className="block font-mono text-[10px]">Conf. {scoreBreakdownData.metadata.confiabilidade}%</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ─── 2. Sobre a Empresa ──────────────────────────────── */}
      <CompanySection
        companyProfile={companyProfile}
        sector={asset.sector}
        name={asset.name}
        marketCap={asset.marketCap}
      />

      {/* ─── 3. Cotação ──────────────────────────────────────── */}
      <div>
        <h2 className="text-[11px] font-semibold text-[var(--text-3)] uppercase tracking-wider mb-2">Cotação</h2>
        <div className="border border-[var(--border-1)] rounded-[var(--radius)] shadow-sm overflow-hidden bg-[var(--surface-1)]">
          <div className="p-3 relative">
            {isChartLoading && priceData.length === 0 && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-[var(--surface-1)]/80 rounded-lg">
                <div className="w-5 h-5 border-2 border-[var(--accent-1)] border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            {priceData.length > 1 ? (
              <TVChart
                data={priceData}
                height={typeof window !== 'undefined' && window.innerWidth < 640 ? 280 : 360}
                range={chartRange}
                onRangeChange={setChartRange}
                showVolume
              />
            ) : !isChartLoading ? (
              <div className="h-[300px] flex flex-col items-center justify-center gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--text-3)]">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
                <p className="text-[var(--text-small)] font-medium text-[var(--text-2)]">Cotação temporariamente indisponível</p>
                <p className="text-[var(--text-caption)] text-[var(--text-3)]">Dados de {ticker} ainda não disponíveis. Tente outro período.</p>
                {currentPrice != null && (
                  <p className="text-[var(--text-small)] font-mono text-[var(--text-1)]">
                    Último preço: {formatCurrency(currentPrice)}
                    {currentChange != null && (
                      <span className={cn('ml-2', currentChange >= 0 ? 'text-[var(--pos)]' : 'text-[var(--neg)]')}>
                        {currentChange >= 0 ? '+' : ''}{currentChange.toFixed(2)}%
                      </span>
                    )}
                  </p>
                )}
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-[var(--accent-1)] border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── 4. Visão Geral — Pilares + Forças/Riscos ────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Coluna esquerda: Pilares IQ Score */}
        <div>
          <h2 className="text-[11px] font-semibold text-[var(--text-3)] uppercase tracking-wider mb-2">Pilares IQ-Cognit</h2>
          <div className="border border-[var(--border-1)] rounded-[var(--radius)] shadow-sm bg-[var(--surface-1)] p-4">
            <div className="space-y-4">
              {([
                { label: 'Valuation', value: pillars?.valuation ?? 0 },
                { label: 'Qualidade', value: pillars?.quality ?? 0 },
                { label: 'Risco', value: pillars?.risk ?? 0 },
                { label: 'Dividendos', value: pillars?.dividends ?? 0 },
                { label: 'Crescimento', value: pillars?.growth ?? 0 },
                { label: 'Qualitativo', value: pillars?.qualitativo ?? 0 },
              ] as const).map(p => (
                <div key={p.label} className="flex items-center gap-2.5">
                  <span className="w-[82px] text-[13px] text-[var(--text-2)] flex-shrink-0">{p.label}</span>
                  <div className="flex-1 h-[7px] bg-[var(--surface-2)] rounded-full overflow-hidden">
                    <div
                      className={cn('h-full rounded-full transition-all', pillarBarColor(p.value))}
                      style={{ width: `${p.value}%` }}
                    />
                  </div>
                  <span className={cn('w-8 text-[14px] font-mono font-bold text-right', pillarTextColor(p.value))}>
                    {p.value.toFixed(0)}
                  </span>
                </div>
              ))}
            </div>
            {/* Mini diagnóstico (one-liner do narrative) */}
            {narrative?.oneLiner && (
              <p className="mt-3 pt-3 border-t border-[var(--border-1)] text-[12px] text-[var(--text-2)] leading-relaxed">
                {narrative.oneLiner}
              </p>
            )}
          </div>
        </div>

        {/* Coluna direita: Forças & Riscos */}
        <div>
          <h2 className="text-[11px] font-semibold text-[var(--text-3)] uppercase tracking-wider mb-2">Forças & Riscos</h2>
          {drivers && (drivers.positive.length > 0 || drivers.negative.length > 0) ? (
            <div className="border border-[var(--border-1)] rounded-[var(--radius)] shadow-sm bg-[var(--surface-1)] p-4">
              <DriversList positive={drivers.positive} negative={drivers.negative} />
            </div>
          ) : (
            <div className="border border-[var(--border-1)] rounded-[var(--radius)] shadow-sm bg-[var(--surface-1)] p-4 flex items-center justify-center h-full min-h-[200px]">
              <p className="text-[var(--text-small)] text-[var(--text-3)]">Dados insuficientes para análise de drivers</p>
            </div>
          )}
        </div>
      </div>

      {/* ─── 5. Análise Qualitativa — 5 cards ────────────────── */}
      {qualitativoSubNotas.length > 0 && (
        <QualitativeCards subNotas={qualitativoSubNotas} />
      )}

      {/* ─── 6. Indicadores Fundamentais — Grid organizado ───── */}
      {f && (
        <IndicatorGrid
          fundamentals={{
            peRatio: f.peRatio,
            pbRatio: f.pbRatio,
            psr: f.psr,
            pEbit: f.pEbit,
            evEbit: f.evEbit,
            evEbitda: f.evEbitda,
            roe: f.roe,
            roic: f.roic,
            margemEbit: f.margemEbit ?? f.ebitdaMargin,
            margemLiquida: f.margemLiquida ?? f.netMargin,
            liquidezCorrente: f.liquidezCorrente,
            divBrutPatrim: f.divBrutPatrim,
            pCapGiro: f.pCapGiro,
            pAtivCircLiq: f.pAtivCircLiq,
            pAtivo: f.pAtivo,
            patrimLiquido: f.patrimLiquido,
            dividendYield: f.dividendYield,
            netDebtEbitda: f.netDebtEbitda,
            crescimentoReceita5a: f.crescimentoReceita5a,
            liq2meses: f.liq2meses,
          }}
          payout={f.payout}
          crescimentoLucro5a={f.crescimentoLucro5a}
        />
      )}

      {/* ─── 6b. DCF & Sensibilidade (Elite) ────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <PaywallGate requiredPlan="elite" feature="Valuation DCF" showPreview>
          <DCFCard ticker={ticker} />
        </PaywallGate>
        <PaywallGate requiredPlan="elite" feature="Sensibilidade Macro" showPreview>
          <SensitivityCard ticker={ticker} />
        </PaywallGate>
      </div>

      {/* ─── 6b2. Monte Carlo — Distribuição P25/P50/P75 (Elite) ─ */}
      {backendValuation && currentPrice && (
        <PaywallGate requiredPlan="elite" feature="Monte Carlo Valuation" showPreview>
          <MonteCarloCard
            ticker={ticker}
            currentPrice={currentPrice}
            valuation={backendValuation}
          />
        </PaywallGate>
      )}

      {/* ─── 6b3. Tese de Investimento (Pro) ─────────────────── */}
      {thesis && (
        <PaywallGate requiredPlan="pro" feature="Tese de Investimento" showPreview>
          <ThesisCard ticker={ticker} thesis={thesis} dividendData={dividendData} />
        </PaywallGate>
      )}

      {/* ─── 6c. Score X-Ray (Elite) ─────────────────────────── */}
      {scoreBreakdownData && (
        <PaywallGate requiredPlan="elite" feature="Detalhamento do Score" showPreview>
          <ScoreXRay breakdown={scoreBreakdownData} ticker={ticker} />
        </PaywallGate>
      )}

      {/* ─── 6c2. Evidence Explorer — Mapa de Conviccao (Elite) ── */}
      <PaywallGate requiredPlan="elite" feature="Evidence Explorer" showPreview>
        <EvidenceExplorer ticker={ticker} />
      </PaywallGate>

      {/* ─── 6c3. Risk Lab — Métricas de Risco (Elite) ────────── */}
      {riskMetrics && (
        <PaywallGate requiredPlan="elite" feature="Risk Lab" showPreview>
          <RiskLab riskMetrics={riskMetrics} ticker={ticker} />
        </PaywallGate>
      )}

      {/* ─── 6d. Histórico IQ Score ──────────────────────────── */}
      {score !== null && (
        <div>
          <h2 className="text-[11px] font-semibold text-[var(--text-3)] uppercase tracking-wider mb-2">Histórico IQ-Cognit</h2>
          <ScoreEvolutionChart ticker={ticker} />
        </div>
      )}

      {/* ─── 6e. Research Note / Diagnóstico (Pro) ───────────── */}
      {narrative && (
        <PaywallGate requiredPlan="pro" feature="Diagnóstico aQ" showPreview>
          <div>
            <h2 className="text-[11px] font-semibold text-[var(--text-3)] uppercase tracking-wider mb-2">Diagnóstico aQ</h2>
            <div className="border border-[var(--border-1)] rounded-[var(--radius)] shadow-sm bg-[var(--surface-1)] p-4 space-y-4">
              {narrative.highlights.strengths.length > 0 && (
                <div>
                  <h3 className="text-[11px] font-semibold text-teal uppercase tracking-wider mb-2">Forças</h3>
                  <ul className="space-y-1.5">
                    {narrative.highlights.strengths.map((s, i) => (
                      <li key={i} className="flex items-start gap-2 text-[13px] text-[var(--text-1)] leading-relaxed">
                        <span className="mt-1.5 w-1 h-1 rounded-full bg-teal flex-shrink-0" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {narrative.highlights.weaknesses.length > 0 && (
                <div>
                  <h3 className="text-[11px] font-semibold text-red uppercase tracking-wider mb-2">Fraquezas</h3>
                  <ul className="space-y-1.5">
                    {narrative.highlights.weaknesses.map((s, i) => (
                      <li key={i} className="flex items-start gap-2 text-[13px] text-[var(--text-1)] leading-relaxed">
                        <span className="mt-1.5 w-1 h-1 rounded-full bg-red flex-shrink-0" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {narrative.researchNote && (
                <ResearchNote
                  researchNote={narrative.researchNote}
                  highlights={narrative.highlights}
                />
              )}
            </div>
          </div>
        </PaywallGate>
      )}

      {/* ─── 6f. Dossier Qualitativo — Research Report (Elite) ── */}
      <PaywallGate requiredPlan="elite" feature="Dossier Qualitativo" showPreview>
        <DossierReport ticker={ticker} />
      </PaywallGate>

      {/* ─── 7. Dividendos ───────────────────────────────────── */}
      <div>
        <h2 className="text-[11px] font-semibold text-[var(--text-3)] uppercase tracking-wider mb-2">Dividendos</h2>
        <DividendSummary
          dividends={asset.dividends}
          dividendYield={f?.dividendYield}
        />
        {f && (
          <div className="mt-3 border border-[var(--border-1)] rounded-[var(--radius)] shadow-sm bg-[var(--surface-1)] p-4">
            <h3 className="text-[11px] font-semibold text-[var(--text-3)] uppercase tracking-wider mb-3">Métricas de Rendimento</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-5 gap-y-3">
              <KV label="Dividend Yield" value={fmtP(f.dividendYield)} highlight />
              <KV label="Dív.Líq/EBITDA" value={fmtR(f.netDebtEbitda, 2)} />
              <KV label="Liq. 2 meses" value={fmtBig(f.liq2meses)} />
            </div>
          </div>
        )}
      </div>

      {/* ─── 7b. Risco de Armadilha de Dividendos (Pro) ─────── */}
      <PaywallGate requiredPlan="pro" feature="Dividend Trap Risk" showPreview>
        <DividendTrapCard ticker={ticker} />
      </PaywallGate>

      {/* ─── 8. Pares do Setor ───────────────────────────────── */}
      {sectorPeers.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-[11px] font-semibold text-[var(--text-3)] uppercase tracking-wider">
              Pares do Setor — {asset.sector ?? 'Outros'}
            </h2>
            <Link
              href={`/comparar?tickers=${[ticker, ...sectorPeers.slice(0, 3).map((p: any) => p.ticker)].join(',')}`}
              className="text-[11px] text-[var(--accent-1)] hover:underline"
            >
              Comparar →
            </Link>
          </div>
          <div className="border border-[var(--border-1)] rounded-[var(--radius)] shadow-sm bg-[var(--surface-1)] divide-y divide-[var(--border-1)]/10">
            {sectorPeers.map((peer: any) => (
              <div key={peer.ticker} className="flex items-center justify-between p-3 hover:bg-[var(--surface-2)] transition-colors">
                <div className="flex items-center gap-3">
                  <Link
                    href={`/ativo/${peer.ticker}`}
                    className="font-mono text-[var(--text-small)] font-bold text-[var(--accent-1)] hover:underline"
                  >
                    {peer.ticker}
                  </Link>
                  {peer.name && (
                    <span className="text-[13px] text-[var(--text-2)] truncate max-w-[200px]">{peer.name}</span>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  {peer.aqScore != null && (
                    <ScoreBadge score={Number(peer.aqScore)} size="sm" />
                  )}
                  {peer.price != null && (
                    <span className="font-mono text-[13px] text-[var(--text-1)]">
                      {formatCurrency(Number(peer.price))}
                    </span>
                  )}
                  {peer.changePercent != null && (
                    <ChangeIndicator value={Number(peer.changePercent)} size="sm" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── 9. Notícias & RI ────────────────────────────────── */}
      <div className="space-y-5">
        <NewsSection ticker={ticker} companyName={asset.name} />
        <EventCalendar
          riEvents={intelligence?.relevantFacts ?? intelligence?.news?.filter((n: any) => n.tickers?.includes(ticker)).slice(0, 10)}
          dividends={asset.dividends}
          ticker={ticker}
        />
      </div>

      {/* ─── 10. Comunidade ──────────────────────────────────── */}
      <div>
        <h2 className="text-[11px] font-semibold text-[var(--text-3)] uppercase tracking-wider mb-2">Comunidade</h2>
        <CommentSection ticker={ticker} />
      </div>

      <Disclaimer variant="inline" className="block mt-1" />
    </div>
  )
}

// ─── Seção Sobre a Empresa (compacta) ──────────────────────
function CompanySection({ companyProfile, sector, name, marketCap }: {
  companyProfile: any
  sector: string | null
  name: string
  marketCap: number | null
}) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div>
      <h2 className="text-[11px] font-semibold text-[var(--text-3)] uppercase tracking-wider mb-2">Sobre a Empresa</h2>
      <div className="border border-[var(--border-1)] rounded-[var(--radius)] shadow-sm bg-[var(--surface-1)] p-4">
        {companyProfile?.description ? (
          <div className="mb-3">
            <p className={cn('text-[13px] text-[var(--text-1)] leading-relaxed', !expanded && 'line-clamp-2')}>
              {companyProfile.description}
            </p>
            {companyProfile.description.length > 150 && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="text-[11px] text-[var(--accent-1)] hover:underline mt-1"
              >
                {expanded ? 'Ver menos' : 'Ver mais'}
              </button>
            )}
          </div>
        ) : (
          <p className="text-[13px] text-[var(--text-3)] italic mb-3">Dados detalhados não disponíveis para {name}.</p>
        )}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
          {sector && <MetaItem label="Setor" value={sector} />}
          {companyProfile?.segment && <MetaItem label="Segmento B3" value={companyProfile.segment} />}
          {companyProfile?.headquarters && <MetaItem label="Sede" value={companyProfile.headquarters} />}
          {companyProfile?.employees && <MetaItem label="Funcionários" value={companyProfile.employees.toLocaleString('pt-BR')} />}
          {companyProfile?.founded && <MetaItem label="Fundação" value={String(companyProfile.founded)} />}
          {marketCap != null && marketCap > 0 && (
            <MetaItem label="Market Cap" value={
              marketCap >= 1e9 ? `R$ ${(marketCap / 1e9).toFixed(1)}B` :
              marketCap >= 1e6 ? `R$ ${(marketCap / 1e6).toFixed(0)}M` :
              `R$ ${marketCap.toLocaleString('pt-BR')}`
            } />
          )}
        </div>
        {companyProfile?.riUrl && (
          <a
            href={companyProfile.riUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 mt-3 text-[var(--text-caption)] text-[var(--accent-1)] hover:underline"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
            Relações com Investidores
          </a>
        )}
      </div>
    </div>
  )
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] text-[var(--text-3)] uppercase tracking-wide">{label}</p>
      <p className="text-[13px] text-[var(--text-1)] font-medium">{value}</p>
    </div>
  )
}

// ─── Componentes compactos ──────────────────────────────────

function KV({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <div className="text-[11px] text-[var(--text-3)] mb-0.5">{label}</div>
      <div className={cn('text-[15px] font-bold font-mono leading-tight', highlight && value !== '—' && 'text-[var(--pos)]')}>
        {value}
      </div>
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="space-y-5">
      <Skeleton className="h-3 w-20" />
      <div className="flex items-center gap-4">
        <Skeleton className="w-12 h-12 rounded-[var(--radius)]" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
      </div>
      {/* Sobre */}
      <Skeleton className="h-[100px] rounded-[var(--radius)]" />
      {/* Chart */}
      <Skeleton className="h-[360px] rounded-[var(--radius)]" />
      {/* Visão Geral */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Skeleton className="h-[280px] rounded-[var(--radius)]" />
        <Skeleton className="h-[280px] rounded-[var(--radius)]" />
      </div>
      {/* Qualitativo */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-[140px] rounded-[var(--radius)]" />)}
      </div>
      {/* Indicadores */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-[160px] rounded-[var(--radius)]" />)}
      </div>
      {/* Dividendos */}
      <Skeleton className="h-[200px] rounded-[var(--radius)]" />
    </div>
  )
}
