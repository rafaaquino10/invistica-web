'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { trpc } from '@/lib/trpc/provider'

interface EvidenceExplorerProps {
  ticker: string
}

const PILLAR_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  valuation: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
  quality: { bg: 'bg-teal/10', text: 'text-teal', border: 'border-teal/20' },
  risk: { bg: 'bg-red/10', text: 'text-red', border: 'border-red/20' },
  dividends: { bg: 'bg-amber/10', text: 'text-amber', border: 'border-amber/20' },
  growth: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20' },
  qualitative: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/20' },
}

const PILLAR_LABELS: Record<string, string> = {
  valuation: 'Valuation', quality: 'Qualidade', risk: 'Risco',
  dividends: 'Dividendos', growth: 'Crescimento', qualitative: 'Qualitativo',
}

export function EvidenceExplorer({ ticker }: EvidenceExplorerProps) {
  const { data, isLoading } = trpc.assets.evidence.useQuery(
    { ticker },
    { staleTime: 15 * 60 * 1000 }
  )
  const [activePillar, setActivePillar] = useState<string | null>(null)
  const [expandedCriterion, setExpandedCriterion] = useState<number | null>(null)

  if (isLoading) {
    return (
      <div className="border border-[var(--border-1)] rounded-[var(--radius)] shadow-sm bg-[var(--surface-1)] p-6 animate-pulse">
        <div className="h-5 w-56 bg-[var(--surface-2)] rounded mb-4" />
        <div className="grid grid-cols-6 gap-2 mb-6">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-8 bg-[var(--surface-2)] rounded" />)}</div>
        <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-24 bg-[var(--surface-2)] rounded" />)}</div>
      </div>
    )
  }

  if (!data?.evidences?.length) {
    if (!isLoading) return null // Silently hide if no evidence data
    return null
  }

  const evidences = data.evidences

  // Group by pillar
  const byPillar = evidences.reduce((acc, e) => {
    const p = e.pillar || 'qualitative'
    if (!acc[p]) acc[p] = []
    acc[p].push(e)
    return acc
  }, {} as Record<string, typeof evidences>)

  const pillars = Object.keys(byPillar)
  const filtered = activePillar ? (byPillar[activePillar] ?? []) : evidences

  // Conviction balance: sum of bull vs bear across all evidence
  const totalBull = evidences.reduce((s, e) => s + (e.bull_points?.length ?? 0), 0)
  const totalBear = evidences.reduce((s, e) => s + (e.bear_points?.length ?? 0), 0)
  const totalPoints = totalBull + totalBear || 1
  const bullPct = (totalBull / totalPoints) * 100

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-[11px] font-semibold text-[var(--text-3)] uppercase tracking-wider">
          Evidence Explorer — {ticker}
        </h2>
        <span className="text-[10px] text-[var(--text-3)]">{evidences.length} criterios analisados</span>
      </div>

      <div className="border border-[var(--border-1)] rounded-[var(--radius)] shadow-sm bg-[var(--surface-1)]">
        {/* Conviction Balance Bar */}
        <div className="p-4 border-b border-[var(--border-1)]/20">
          <div className="flex items-center justify-between text-[10px] font-semibold mb-1.5">
            <span className="text-teal">Bull ({totalBull})</span>
            <span className="text-[var(--text-3)]">Balanco de Conviccao</span>
            <span className="text-red">Bear ({totalBear})</span>
          </div>
          <div className="h-3 bg-red/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-teal rounded-full transition-all duration-500"
              style={{ width: `${bullPct}%` }}
            />
          </div>
        </div>

        {/* Pillar Filters */}
        <div className="px-4 pt-3 pb-2 flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setActivePillar(null)}
            className={cn(
              'text-[10px] font-semibold px-2.5 py-1 rounded-full transition-colors',
              !activePillar ? 'bg-[var(--accent-1)] text-white' : 'bg-[var(--surface-2)] text-[var(--text-3)] hover:text-[var(--text-1)]'
            )}
          >
            Todos
          </button>
          {pillars.map(p => {
            const style = PILLAR_COLORS[p] ?? PILLAR_COLORS['qualitative']!
            const count = byPillar[p]?.length ?? 0
            return (
              <button
                key={p}
                onClick={() => setActivePillar(activePillar === p ? null : p)}
                className={cn(
                  'text-[10px] font-semibold px-2.5 py-1 rounded-full transition-colors border',
                  activePillar === p
                    ? `${style.bg} ${style.text} ${style.border}`
                    : 'bg-[var(--surface-2)] text-[var(--text-3)] border-transparent hover:text-[var(--text-1)]'
                )}
              >
                {PILLAR_LABELS[p] ?? p} ({count})
              </button>
            )
          })}
        </div>

        {/* Evidence Cards */}
        <div className="p-4 space-y-2">
          {filtered.sort((a, b) => (b.weight * b.score) - (a.weight * a.score)).map(e => {
            const style = PILLAR_COLORS[e.pillar] ?? PILLAR_COLORS['qualitative']!
            const isExpanded = expandedCriterion === e.criterion_id
            const hasBullBear = (e.bull_points?.length ?? 0) + (e.bear_points?.length ?? 0) > 0
            const scoreLevel = e.score >= 70 ? 'teal' : e.score >= 40 ? 'amber' : 'red'

            return (
              <div
                key={e.criterion_id}
                className={cn(
                  'rounded-lg border transition-all',
                  isExpanded ? `${style.border} ${style.bg}` : 'border-[var(--border-1)]/20 hover:border-[var(--border-1)]/40'
                )}
              >
                <button
                  onClick={() => setExpandedCriterion(isExpanded ? null : e.criterion_id)}
                  className="w-full text-left p-3 flex items-center gap-3"
                >
                  {/* Score circle */}
                  <div className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-[14px] font-mono font-bold',
                    scoreLevel === 'teal' ? 'bg-teal/15 text-teal' :
                    scoreLevel === 'amber' ? 'bg-amber/15 text-amber' : 'bg-red/15 text-red'
                  )}>
                    {e.score}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-semibold text-[var(--text-1)]">{e.criterion_name}</span>
                      <span className={cn('text-[9px] font-bold px-1.5 py-0.5 rounded', style.bg, style.text)}>
                        {PILLAR_LABELS[e.pillar] ?? e.pillar}
                      </span>
                    </div>
                    <p className="text-[11px] text-[var(--text-2)] mt-0.5 line-clamp-1">{e.evidence_text}</p>
                  </div>

                  {/* Weight indicator */}
                  <div className="flex-shrink-0 text-right">
                    <div className="w-12 h-1.5 bg-[var(--surface-2)] rounded-full overflow-hidden">
                      <div className="h-full bg-[var(--accent-1)]/50 rounded-full" style={{ width: `${e.weight * 100}%` }} />
                    </div>
                    <span className="text-[9px] text-[var(--text-3)] mt-0.5 block">peso {(e.weight * 100).toFixed(0)}%</span>
                  </div>

                  {/* Expand arrow */}
                  {hasBullBear && (
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                      className={cn('text-[var(--text-3)] transition-transform flex-shrink-0', isExpanded && 'rotate-180')}
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  )}
                </button>

                {/* Expanded: Bull/Bear points */}
                {isExpanded && hasBullBear && (
                  <div className="px-3 pb-3 pt-0">
                    <div className="border-t border-[var(--border-1)]/20 pt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                      {e.bull_points && e.bull_points.length > 0 && (
                        <div>
                          <h4 className="text-[10px] font-bold text-teal uppercase tracking-wider mb-1.5">Bull Points</h4>
                          <ul className="space-y-1">
                            {e.bull_points.map((bp, i) => (
                              <li key={i} className="flex items-start gap-2 text-[12px] text-[var(--text-1)] leading-relaxed">
                                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-teal flex-shrink-0" />
                                {bp}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {e.bear_points && e.bear_points.length > 0 && (
                        <div>
                          <h4 className="text-[10px] font-bold text-red uppercase tracking-wider mb-1.5">Bear Points</h4>
                          <ul className="space-y-1">
                            {e.bear_points.map((bp, i) => (
                              <li key={i} className="flex items-start gap-2 text-[12px] text-[var(--text-1)] leading-relaxed">
                                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red flex-shrink-0" />
                                {bp}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                    {e.source_type && (
                      <div className="mt-2 flex items-center gap-2 text-[10px] text-[var(--text-3)]">
                        <span>Fonte: {e.source_type}</span>
                        {e.source_url && <a href={e.source_url} target="_blank" rel="noopener noreferrer" className="text-[var(--accent-1)] hover:underline">Ver fonte</a>}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
