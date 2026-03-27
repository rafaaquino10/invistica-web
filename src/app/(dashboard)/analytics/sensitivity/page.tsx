'use client'

import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/hooks/use-auth'
import { pro } from '@/lib/api/endpoints'
import { Skeleton, Disclaimer } from '@/components/ui'
import { PaywallGate } from '@/components/billing/paywall-gate'
import { cn } from '@/lib/utils'

export default function SensitivityPage() {
  const { token } = useAuth()

  const { data, isLoading } = useQuery({
    queryKey: ['sensitivity'],
    queryFn: () => pro.getSensitivity(token ?? undefined),
    enabled: !!token,
    staleTime: 10 * 60 * 1000,
  })

  const scenarios = data?.scenarios ?? []

  // Sort by absolute impact (biggest impact first)
  const sorted = [...scenarios].sort((a, b) => Math.abs(b.impact_score) - Math.abs(a.impact_score))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-[var(--text-title)] font-bold tracking-tight">Análise de Sensibilidade</h1>
        <p className="text-[var(--text-small)] text-[var(--text-2)] mt-0.5">
          Como choques macroeconômicos impactam o IQ-Score do seu portfólio
        </p>
      </div>

      <PaywallGate requiredPlan="pro" feature="Análise de Sensibilidade" showPreview>
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 rounded-[var(--radius)]" />)}
          </div>
        ) : sorted.length > 0 ? (
          <div className="space-y-4">
            {/* Tornado chart concept — horizontal bars sorted by impact */}
            <div className="bg-[var(--surface-1)] rounded-[var(--radius)] border border-[var(--border-1)] p-6">
              <h2 className="text-sm font-semibold text-[var(--text-1)] mb-4">Impacto por Cenário</h2>
              <div className="space-y-4">
                {sorted.map((s) => {
                  const isNeg = s.impact_score < 0
                  const absImpact = Math.abs(s.impact_score)
                  const maxImpact = Math.abs(sorted[0]?.impact_score ?? 1)
                  const barWidth = maxImpact > 0 ? (absImpact / maxImpact) * 100 : 0
                  return (
                    <div key={s.name} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-sm font-medium text-[var(--text-1)]">{s.name}</span>
                          <span className="text-[var(--text-caption)] text-[var(--text-2)] ml-2">
                            {s.variable}: {s.current.toFixed(1)} → {s.stressed.toFixed(1)}
                          </span>
                        </div>
                        <span className={cn(
                          'font-mono text-sm font-bold',
                          isNeg ? 'text-[var(--neg)]' : 'text-[var(--pos)]'
                        )}>
                          {isNeg ? '' : '+'}{s.impact_score.toFixed(1)} pts
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-3 bg-[var(--bg)] rounded-full overflow-hidden">
                          <div
                            className={cn(
                              'h-full rounded-full transition-all',
                              isNeg ? 'bg-[var(--neg)]' : 'bg-[var(--pos)]'
                            )}
                            style={{ width: `${Math.min(barWidth, 100)}%` }}
                          />
                        </div>
                      </div>
                      <p className="text-[var(--text-caption)] text-[var(--text-3)]">{s.description}</p>
                      {s.affected_sectors.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {s.affected_sectors.map((sec) => (
                            <span key={sec} className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--surface-2)] text-[var(--text-3)]">{sec}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Macro context */}
            {data?.macro && (
              <div className="bg-[var(--surface-1)] rounded-[var(--radius)] border border-[var(--border-1)] p-6">
                <h2 className="text-sm font-semibold text-[var(--text-1)] mb-3">Contexto Macro Atual</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(data.macro).map(([key, value]) => (
                    <div key={key} className="text-center">
                      <p className="text-[var(--text-caption)] text-[var(--text-2)]">{key}</p>
                      <p className="font-mono font-bold text-[var(--text-1)]">{typeof value === 'number' ? value.toFixed(2) : String(value)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12 text-[var(--text-2)]">
            Dados de sensibilidade não disponíveis no momento.
          </div>
        )}
        <Disclaimer variant="inline" className="block mt-4" />
      </PaywallGate>
    </div>
  )
}
