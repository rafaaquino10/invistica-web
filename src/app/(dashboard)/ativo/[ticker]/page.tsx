'use client'

import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { Skeleton } from '@/components/ui'
import { cn } from '@/lib/utils'
import { pro, free } from '@/lib/api/endpoints'
import { useAuth } from '@/hooks/use-auth'
import type { Evidence } from '@/lib/api/endpoints'

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

function fmtR$(val: number | null | undefined): string {
  if (val == null) return '--'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)
}

function getRatingLabel(rating: string): string {
  const labels: Record<string, string> = {
    STRONG_BUY: 'Compra Forte',
    BUY: 'Acumular',
    HOLD: 'Neutro',
    REDUCE: 'Reduzir',
    AVOID: 'Evitar',
  }
  return labels[rating] || rating
}

function getRatingColor(rating: string): string {
  if (rating === 'STRONG_BUY') return 'bg-[var(--pos)]/15 text-[var(--pos)] border-[var(--pos)]/30'
  if (rating === 'BUY') return 'bg-[var(--accent-1)]/15 text-[var(--accent-1)] border-[var(--accent-1)]/30'
  if (rating === 'HOLD') return 'bg-[var(--warn)]/15 text-[var(--warn)] border-[var(--warn)]/30'
  return 'bg-[var(--neg)]/15 text-[var(--neg)] border-[var(--neg)]/30'
}

export default function AtivoPage() {
  const params = useParams()
  const ticker = (params.ticker as string)?.toUpperCase()
  const { token } = useAuth()

  const { data: score, isLoading } = useQuery({
    queryKey: ['score', ticker],
    queryFn: () => pro.getScore(ticker, { mandate: 'EQUILIBRADO' }, token ?? undefined),
    enabled: !!ticker,
  })

  const { data: valuation } = useQuery({
    queryKey: ['valuation', ticker],
    queryFn: () => pro.getValuation(ticker, token ?? undefined),
    enabled: !!ticker,
  })

  const { data: tickerData } = useQuery({
    queryKey: ['ticker', ticker],
    queryFn: () => free.getTicker(ticker),
    enabled: !!ticker,
  })

  const { data: financials } = useQuery({
    queryKey: ['financials', ticker],
    queryFn: () => free.getFinancials(ticker, 4),
    enabled: !!ticker,
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-64 lg:col-span-2" />
          <Skeleton className="h-64" />
        </div>
      </div>
    )
  }

  const iq = score?.iq_cognit
  const val = score?.valuation
  const div = score?.dividends

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-[var(--text-1)]">{ticker}</h1>
            {iq && (
              <span className={cn('text-xs font-semibold px-2.5 py-1 rounded-full border', getRatingColor(iq.rating))}>
                {getRatingLabel(iq.rating)}
              </span>
            )}
          </div>
          <p className="text-[var(--text-2)] text-[var(--text-body)]">{score?.company_name}</p>
        </div>
        {tickerData?.quote && (
          <div className="text-right">
            <p className="font-mono text-2xl font-bold text-[var(--text-1)]">
              {fmtR$(tickerData.quote.close)}
            </p>
            <p className="text-[var(--text-small)] text-[var(--text-2)]">
              Vol: {tickerData.quote.volume?.toLocaleString('pt-BR')} | Mkt Cap: {fmtBig(tickerData.quote.market_cap)}
            </p>
          </div>
        )}
      </div>

      {/* IQ-Score + Valuation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* IQ-Score Card */}
        <div className="bg-[var(--surface-1)] rounded-[var(--radius)] border border-[var(--border-1)] p-6">
          <h2 className="text-[var(--text-body)] font-semibold mb-4">IQ-Score</h2>
          {iq ? (
            <div className="flex flex-col items-center gap-4">
              <div className={cn(
                'w-24 h-24 rounded-full flex items-center justify-center border-4',
                iq.iq_score >= 75 ? 'border-[var(--pos)] text-[var(--pos)]' :
                iq.iq_score >= 62 ? 'border-[var(--accent-1)] text-[var(--accent-1)]' :
                iq.iq_score >= 42 ? 'border-[var(--warn)] text-[var(--warn)]' :
                'border-[var(--neg)] text-[var(--neg)]'
              )}>
                <span className="font-mono text-3xl font-bold">{iq.iq_score}</span>
              </div>
              <div className="grid grid-cols-2 gap-3 w-full text-center">
                <Pillar label="Quanti" value={iq.score_quanti} />
                <Pillar label="Quali" value={iq.score_quali} />
                <Pillar label="Valuation" value={iq.score_valuation} />
                <Pillar label="Operacional" value={iq.score_operational} />
              </div>
            </div>
          ) : (
            <p className="text-[var(--text-2)]">Score indisponivel</p>
          )}
        </div>

        {/* Valuation Card */}
        <div className="bg-[var(--surface-1)] rounded-[var(--radius)] border border-[var(--border-1)] p-6">
          <h2 className="text-[var(--text-body)] font-semibold mb-4">Valuation</h2>
          {val ? (
            <div className="space-y-4">
              <div>
                <p className="text-[var(--text-caption)] text-[var(--text-2)]">Preco Justo</p>
                <p className="font-mono text-xl font-bold text-[var(--text-1)]">{fmtR$(val.fair_value_final)}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[var(--text-caption)] text-[var(--text-2)]">DCF</p>
                  <p className="font-mono text-[var(--text-body)] text-[var(--text-1)]">{fmtR$(val.fair_value_dcf)}</p>
                </div>
                <div>
                  <p className="text-[var(--text-caption)] text-[var(--text-2)]">Gordon</p>
                  <p className="font-mono text-[var(--text-body)] text-[var(--text-1)]">{fmtR$(val.fair_value_gordon)}</p>
                </div>
              </div>
              {val.safety_margin != null && (
                <div className={cn(
                  'rounded-lg p-3 text-center',
                  val.safety_margin > 0 ? 'bg-[var(--pos)]/10' : 'bg-[var(--neg)]/10'
                )}>
                  <p className="text-[var(--text-caption)] text-[var(--text-2)]">Margem de Seguranca</p>
                  <p className={cn(
                    'font-mono text-lg font-bold',
                    val.safety_margin > 0 ? 'text-[var(--pos)]' : 'text-[var(--neg)]'
                  )}>
                    {fmtPct(val.safety_margin)}
                  </p>
                </div>
              )}
              {val.upside_prob != null && (
                <p className="text-[var(--text-small)] text-[var(--text-2)]">
                  Prob. upside: {fmtPct(val.upside_prob)} | Prob. loss: {fmtPct(val.loss_prob)}
                </p>
              )}
            </div>
          ) : (
            <p className="text-[var(--text-2)]">Valuation indisponivel</p>
          )}
        </div>

        {/* Dividendos Card */}
        <div className="bg-[var(--surface-1)] rounded-[var(--radius)] border border-[var(--border-1)] p-6">
          <h2 className="text-[var(--text-body)] font-semibold mb-4">Dividendos</h2>
          {div ? (
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-[var(--text-caption)] text-[var(--text-2)]">Safety Score</p>
                <p className={cn(
                  'font-mono text-3xl font-bold',
                  (div.dividend_safety ?? 0) >= 70 ? 'text-[var(--pos)]' :
                  (div.dividend_safety ?? 0) >= 50 ? 'text-[var(--warn)]' :
                  'text-[var(--neg)]'
                )}>
                  {div.dividend_safety ?? '--'}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 text-center">
                <div>
                  <p className="text-[var(--text-caption)] text-[var(--text-2)]">Yield Projetado</p>
                  <p className="font-mono text-[var(--text-body)] text-[var(--text-1)]">{fmtPct(div.projected_yield)}</p>
                </div>
                <div>
                  <p className="text-[var(--text-caption)] text-[var(--text-2)]">CAGR 5a</p>
                  <p className="font-mono text-[var(--text-body)] text-[var(--text-1)]">{fmtPct(div.dividend_cagr_5y)}</p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-[var(--text-2)]">Sem dados de dividendos</p>
          )}
        </div>
      </div>

      {/* Tese de Investimento */}
      {score?.thesis_summary && (
        <div className="bg-[var(--surface-1)] rounded-[var(--radius)] border border-[var(--border-1)] p-6">
          <h2 className="text-[var(--text-body)] font-semibold mb-3">Tese de Investimento</h2>
          <p className="text-[var(--text-body)] text-[var(--text-2)] leading-relaxed whitespace-pre-line">
            {score.thesis_summary}
          </p>
        </div>
      )}

      {/* Evidencias (XAI) */}
      {score?.evidences && score.evidences.length > 0 && (
        <div className="bg-[var(--surface-1)] rounded-[var(--radius)] border border-[var(--border-1)] p-6">
          <h2 className="text-[var(--text-body)] font-semibold mb-4">Evidencias do IQ-Score</h2>
          <div className="space-y-4">
            {score.evidences.map((ev) => (
              <EvidenceCard key={ev.criterion_id} evidence={ev} />
            ))}
          </div>
        </div>
      )}

      {/* Fundamentals */}
      {financials?.financials && financials.financials.length > 0 && (
        <div className="bg-[var(--surface-1)] rounded-[var(--radius)] border border-[var(--border-1)] p-6">
          <h2 className="text-[var(--text-body)] font-semibold mb-4">Indicadores Fundamentalistas</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border-1)]">
                  <th className="text-left py-2 text-[var(--text-2)] font-medium">Periodo</th>
                  <th className="text-right py-2 text-[var(--text-2)] font-medium">Receita</th>
                  <th className="text-right py-2 text-[var(--text-2)] font-medium">Lucro</th>
                  <th className="text-right py-2 text-[var(--text-2)] font-medium">ROE</th>
                  <th className="text-right py-2 text-[var(--text-2)] font-medium">DL/EBITDA</th>
                  <th className="text-right py-2 text-[var(--text-2)] font-medium">Margem Liq</th>
                </tr>
              </thead>
              <tbody>
                {financials.financials.map((f) => (
                  <tr key={f.period} className="border-b border-[var(--border-1)]/50">
                    <td className="py-2 font-mono text-[var(--text-1)]">{f.period?.slice(0, 4)}</td>
                    <td className="py-2 text-right font-mono text-[var(--text-1)]">{fmtBig(f.revenue)}</td>
                    <td className="py-2 text-right font-mono text-[var(--text-1)]">{fmtBig(f.net_income)}</td>
                    <td className="py-2 text-right font-mono text-[var(--text-1)]">{fmtPct(f.roe)}</td>
                    <td className="py-2 text-right font-mono text-[var(--text-1)]">{f.dl_ebitda?.toFixed(1) ?? '--'}</td>
                    <td className="py-2 text-right font-mono text-[var(--text-1)]">{fmtPct(f.net_margin)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Disclaimer */}
      {score?._disclaimer && (
        <p className="text-[var(--text-caption)] text-[var(--text-2)] italic leading-relaxed">
          {score._disclaimer}
        </p>
      )}
    </div>
  )
}

function Pillar({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-[var(--bg)] rounded-lg p-2">
      <p className="text-[var(--text-caption)] text-[var(--text-2)]">{label}</p>
      <p className={cn(
        'font-mono text-lg font-bold',
        value >= 65 ? 'text-[var(--pos)]' :
        value >= 45 ? 'text-[var(--text-1)]' :
        'text-[var(--neg)]'
      )}>{value}</p>
    </div>
  )
}

function EvidenceCard({ evidence }: { evidence: Evidence }) {
  return (
    <div className="border border-[var(--border-1)]/50 rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[var(--text-body)] font-medium text-[var(--text-1)]">{evidence.criterion_name}</span>
        <span className={cn(
          'font-mono text-sm font-bold',
          evidence.score >= 65 ? 'text-[var(--pos)]' :
          evidence.score >= 45 ? 'text-[var(--text-2)]' :
          'text-[var(--neg)]'
        )}>{evidence.score}/100</span>
      </div>
      <p className="text-[var(--text-small)] text-[var(--text-2)] mb-2">{evidence.evidence_text}</p>
      <div className="flex gap-4">
        {evidence.bull_points.length > 0 && (
          <div className="flex-1">
            <p className="text-[var(--text-caption)] text-[var(--pos)] font-medium mb-1">Bull</p>
            {evidence.bull_points.map((p, i) => (
              <p key={i} className="text-[var(--text-caption)] text-[var(--text-2)]">+ {p}</p>
            ))}
          </div>
        )}
        {evidence.bear_points.length > 0 && (
          <div className="flex-1">
            <p className="text-[var(--text-caption)] text-[var(--neg)] font-medium mb-1">Bear</p>
            {evidence.bear_points.map((p, i) => (
              <p key={i} className="text-[var(--text-caption)] text-[var(--text-2)]">- {p}</p>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
