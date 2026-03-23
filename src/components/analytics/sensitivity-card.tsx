'use client'

import { useState } from 'react'
import { trpc } from '@/lib/trpc/client'
import { Card, CardContent, Skeleton } from '@/components/ui'
import { cn } from '@/lib/utils'
import { REGIME_DISPLAY } from '@/lib/scoring/regime-detector'
import type { MacroRegime } from '@/lib/scoring/regime-detector'

interface SensitivityCardProps {
  ticker: string
}

export function SensitivityCard({ ticker }: SensitivityCardProps) {
  const [expanded, setExpanded] = useState<string | null>(null)

  const { data: scenarios, isLoading } = trpc.assets.sensitivity.useQuery(
    { ticker },
    { staleTime: 10 * 60 * 1000 },
  )

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-5">
          <Skeleton className="h-6 w-48 mb-4" />
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!scenarios || scenarios.length === 0) return null

  const maxImpact = Math.max(...scenarios.map(s => Math.abs(s.scoreImpact)), 1)

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center gap-2 mb-4" title="Simulação de como mudanças macro (SELIC, IPCA) afetariam o aQ Score deste ativo">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--accent-1)]">
            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
          </svg>
          <h3 className="text-[var(--text-small)] font-semibold text-[var(--text-1)]">
            E se...?
          </h3>
          <span className="text-[var(--text-caption)] text-[var(--text-3)]">
            Sensibilidade Macro
          </span>
        </div>

        <div className="space-y-2">
          {scenarios.map(scenario => {
            const isPositive = scenario.scoreImpact >= 0
            const barWidth = Math.min(Math.abs(scenario.scoreImpact) / maxImpact * 100, 100)
            const isExpanded = expanded === scenario.id
            const regimeChanged = scenario.regime.from !== scenario.regime.to
            const sign = scenario.delta > 0 ? '+' : ''

            return (
              <div key={scenario.id}>
                <button
                  onClick={() => setExpanded(isExpanded ? null : scenario.id)}
                  className="w-full text-left group"
                >
                  <div className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-[var(--surface-2)]/50 transition-colors">
                    {/* Label */}
                    <div className="w-28 shrink-0">
                      <span className="text-[var(--text-caption)] font-medium text-[var(--text-2)]">
                        {scenario.variable} {sign}{scenario.delta}{scenario.unit}
                      </span>
                    </div>

                    {/* Bar */}
                    <div className="flex-1 h-6 bg-[var(--surface-2)] rounded overflow-hidden relative">
                      <div
                        className={cn(
                          'h-full rounded transition-all duration-300',
                          isPositive ? 'bg-green-500/70' : 'bg-red-500/70',
                        )}
                        style={{ width: `${barWidth}%` }}
                      />
                      <span className={cn(
                        'absolute inset-y-0 flex items-center text-[var(--text-caption)] font-mono font-semibold px-2',
                        barWidth > 50 ? 'text-white left-0' : 'left-0 ml-1',
                        isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400',
                      )}>
                        {isPositive ? '+' : ''}{scenario.scoreImpact.toFixed(1)}pts
                      </span>
                    </div>

                    {/* Regime change indicator */}
                    {regimeChanged && (
                      <div className="shrink-0 flex items-center gap-1 text-[var(--text-caption)]">
                        <span>{REGIME_DISPLAY[scenario.regime.from as MacroRegime]?.emoji}</span>
                        <span className="text-[var(--text-3)]">→</span>
                        <span>{REGIME_DISPLAY[scenario.regime.to as MacroRegime]?.emoji}</span>
                      </div>
                    )}

                    {/* Expand arrow */}
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className={cn(
                        'shrink-0 text-[var(--text-3)] transition-transform',
                        isExpanded && 'rotate-180',
                      )}
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </div>
                </button>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="px-3 pb-2 ml-28 pl-6 border-l-2 border-[var(--border-1)]/20">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-1">
                      {scenario.pillarImpacts.map(p => (
                        <div key={p.pillar} className="flex items-center gap-2">
                          <span className="text-[var(--text-caption)] text-[var(--text-3)] w-20">{p.label}</span>
                          <span className={cn(
                            'text-[var(--text-caption)] font-mono font-medium',
                            p.delta > 0 ? 'text-green-500' : p.delta < 0 ? 'text-red-500' : 'text-[var(--text-3)]',
                          )}>
                            {p.delta > 0 ? '+' : ''}{p.delta.toFixed(1)}
                          </span>
                        </div>
                      ))}
                    </div>
                    {regimeChanged && (
                      <p className="text-[var(--text-caption)] text-[var(--text-3)] mt-2">
                        Regime muda de{' '}
                        <span style={{ color: REGIME_DISPLAY[scenario.regime.from as MacroRegime]?.color }}>
                          {REGIME_DISPLAY[scenario.regime.from as MacroRegime]?.label}
                        </span>
                        {' '}para{' '}
                        <span style={{ color: REGIME_DISPLAY[scenario.regime.to as MacroRegime]?.color }}>
                          {REGIME_DISPLAY[scenario.regime.to as MacroRegime]?.label}
                        </span>
                      </p>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div className="flex items-center justify-between mt-3 text-[var(--text-caption)] text-[var(--text-3)]">
          <span>Score atual: <span className="font-mono font-semibold text-[var(--text-2)]">{scenarios[0]?.currentScore.toFixed(0)}</span></span>
          <span>Re-cálculo com pesos de regime ajustados</span>
        </div>
      </CardContent>
    </Card>
  )
}
