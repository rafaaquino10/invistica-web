'use client'

import { cn } from '@/lib/utils'
import { trpc } from '@/lib/trpc/provider'

interface DossierReportProps {
  ticker: string
}

const DIMENSION_ICONS: Record<string, string> = {
  consistency: 'Consistencia',
  culture: 'Cultura',
  insider: 'Insider Trading',
  integrity: 'Integridade',
  pulse: 'Pulso de Mercado',
  governance: 'Governanca',
}

function verdictColor(score: number): string {
  if (score >= 75) return 'text-teal'
  if (score >= 50) return 'text-amber'
  return 'text-red'
}

function verdictBg(score: number): string {
  if (score >= 75) return 'bg-teal/8 border-teal/15'
  if (score >= 50) return 'bg-amber/8 border-amber/15'
  return 'bg-red/8 border-red/15'
}

export function DossierReport({ ticker }: DossierReportProps) {
  const { data, isLoading } = trpc.assets.dossier.useQuery(
    { ticker },
    { staleTime: 30 * 60 * 1000 }
  )

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-6 w-64 bg-[var(--surface-2)] rounded" />
        <div className="h-20 bg-[var(--surface-2)] rounded" />
        {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-40 bg-[var(--surface-2)] rounded" />)}
      </div>
    )
  }

  if (!data?.dimensions?.length) {
    if (!isLoading) return null // Silently hide if no dossier data
    return null
  }

  const dims = data.dimensions

  return (
    <div>
      {/* Report Header — institutional style */}
      <div className="border-b-2 border-[var(--accent-1)] pb-4 mb-6">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[10px] font-bold text-[var(--accent-1)] uppercase tracking-[0.15em] mb-1">
              Invscore Dossier Qualitativo
            </p>
            <h2 className="text-[var(--text-title)] font-bold tracking-tight">
              {data.company_name ?? ticker}
            </h2>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-[var(--text-3)]">{ticker} — B3</p>
            <p className="text-[10px] text-[var(--text-3)]">
              {data.generated_at ? new Date(data.generated_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
            </p>
          </div>
        </div>
      </div>

      {/* Overall Verdict */}
      {data.overall_verdict && (
        <div className="mb-6 p-4 rounded-lg bg-[var(--surface-2)]/50 border border-[var(--border-1)]/20">
          <p className="text-[11px] font-bold text-[var(--text-3)] uppercase tracking-wider mb-2">Veredito Geral</p>
          <p className="text-[14px] text-[var(--text-1)] leading-relaxed font-medium">
            {data.overall_verdict}
          </p>
        </div>
      )}

      {/* Dimension Score Summary */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-6">
        {dims.map(d => (
          <div key={d.name} className={cn('rounded-lg border p-3 text-center', verdictBg(d.score))}>
            <p className="text-[9px] font-bold text-[var(--text-3)] uppercase tracking-wider mb-1 truncate">
              {DIMENSION_ICONS[d.name] ?? d.name}
            </p>
            <p className={cn('text-[22px] font-mono font-bold', verdictColor(d.score))}>{d.score}</p>
            <p className={cn('text-[9px] font-semibold mt-0.5', verdictColor(d.score))}>{d.verdict}</p>
          </div>
        ))}
      </div>

      {/* Dimension Deep Dives — research report style */}
      <div className="space-y-1">
        {dims.map((d, idx) => (
          <details key={d.name} className="group" open={idx === 0}>
            <summary className="flex items-center gap-3 p-4 cursor-pointer rounded-lg hover:bg-[var(--surface-2)]/30 transition-colors list-none">
              <div className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-mono font-bold flex-shrink-0',
                verdictBg(d.score), verdictColor(d.score)
              )}>
                {d.score}
              </div>
              <div className="flex-1">
                <h3 className="text-[14px] font-semibold text-[var(--text-1)]">
                  {DIMENSION_ICONS[d.name] ?? d.name}
                </h3>
                <p className={cn('text-[11px] font-semibold', verdictColor(d.score))}>{d.verdict}</p>
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                className="text-[var(--text-3)] transition-transform group-open:rotate-180"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </summary>

            <div className="px-4 pb-4 ml-11">
              {/* Narrative */}
              <div className="mb-4">
                <p className="text-[13px] text-[var(--text-1)] leading-[1.8] whitespace-pre-line">
                  {d.narrative}
                </p>
              </div>

              {/* Evidence Points */}
              {d.evidence && d.evidence.length > 0 && (
                <div className="border-l-2 border-[var(--accent-1)]/20 pl-4">
                  <p className="text-[10px] font-bold text-[var(--text-3)] uppercase tracking-wider mb-2">Evidencias</p>
                  <ul className="space-y-1.5">
                    {d.evidence.map((ev, i) => (
                      <li key={i} className="flex items-start gap-2 text-[12px] text-[var(--text-2)] leading-relaxed">
                        <span className="mt-1 w-1 h-1 rounded-full bg-[var(--accent-1)] flex-shrink-0" />
                        {ev}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </details>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-6 pt-4 border-t border-[var(--border-1)]/20 flex items-center justify-between text-[10px] text-[var(--text-3)]">
        <span>Dossier gerado por agentes LLM do Invscore Engine</span>
        <span>Uso exclusivo para analise — nao constitui recomendacao</span>
      </div>
    </div>
  )
}
