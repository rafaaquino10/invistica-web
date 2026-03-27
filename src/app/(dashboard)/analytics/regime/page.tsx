'use client'

import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/hooks/use-auth'
import { pro } from '@/lib/api/endpoints'
import { Card, CardContent, Skeleton } from '@/components/ui'
import { PaywallGate } from '@/components/billing/paywall-gate'
import { cn } from '@/lib/utils'

const REGIME_ICONS: Record<string, string> = {
  RISK_ON: '\u{1F4C8}',
  RISK_OFF: '\u{1F6E1}',
  STAGFLATION: '\u{26A0}',
  RECOVERY: '\u{1F331}',
}

export default function RegimePage() {
  const { token } = useAuth()

  const { data: regime, isLoading } = useQuery({
    queryKey: ['macro-regime'],
    queryFn: () => pro.getMacroRegime(token ?? undefined),
    enabled: !!token,
    staleTime: 10 * 60 * 1000,
  })

  const { data: matrix } = useQuery({
    queryKey: ['sector-rotation'],
    queryFn: () => pro.getSectorRotation(token ?? undefined),
    enabled: !!token,
    staleTime: 10 * 60 * 1000,
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-[var(--text-title)] font-bold tracking-tight">Regime Macro</h1>
        <p className="text-[var(--text-small)] text-[var(--text-2)] mt-0.5">
          Regime macroeconômico atual e rotação setorial recomendada pelo IQ-Cognit.
        </p>
      </div>

      <PaywallGate requiredPlan="pro" feature="Regime Macro" showPreview>
        {isLoading && (
          <div className="space-y-4">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        )}

        {regime && (
          <>
            {/* Regime Card */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
                    style={{ backgroundColor: `${regime.color}20` }}
                  >
                    {REGIME_ICONS[regime.regime] ?? '\u{1F4CA}'}
                  </div>
                  <div>
                    <h2 className="text-[var(--text-heading)] font-bold" style={{ color: regime.color }}>
                      {regime.label}
                    </h2>
                    <p className="text-[var(--text-small)] text-[var(--text-2)]">{regime.description}</p>
                  </div>
                </div>

                {regime.kill_switch_active && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4">
                    <p className="text-[var(--text-small)] text-red-500 font-semibold">Kill Switch Ativado</p>
                    <p className="text-[var(--text-caption)] text-red-400">SELIC elevada + alavancagem alta + IBOV em queda. Exposição a risco reduzida automaticamente.</p>
                  </div>
                )}

                {/* Macro Indicators */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                  <div className="text-center">
                    <p className="text-[var(--text-caption)] text-[var(--text-3)]">SELIC</p>
                    <p className="text-[var(--text-heading)] font-bold font-mono">{regime.macro.selic.toFixed(2)}%</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[var(--text-caption)] text-[var(--text-3)]">IPCA</p>
                    <p className="text-[var(--text-heading)] font-bold font-mono">{regime.macro.ipca.toFixed(2)}%</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[var(--text-caption)] text-[var(--text-3)]">USD/BRL</p>
                    <p className="text-[var(--text-heading)] font-bold font-mono">R$ {regime.macro.cambio_usd.toFixed(2)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[var(--text-caption)] text-[var(--text-3)]">Brent</p>
                    <p className="text-[var(--text-heading)] font-bold font-mono">US$ {regime.macro.brent.toFixed(0)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Sector Rotation */}
            {regime.sector_rotation && Object.keys(regime.sector_rotation).length > 0 && (
              <Card>
                <CardContent className="p-5">
                  <h3 className="text-[var(--text-small)] font-semibold text-[var(--text-1)] mb-4">Rotação Setorial — {regime.label}</h3>
                  <div className="space-y-2">
                    {Object.entries(regime.sector_rotation)
                      .sort(([, a]: any, [, b]: any) => b.tilt_points - a.tilt_points)
                      .map(([sector, data]: [string, any]) => (
                        <div key={sector} className="flex items-center gap-3">
                          <span className="text-[var(--text-small)] w-32 truncate">{sector}</span>
                          <div className="flex-1 h-5 bg-[var(--surface-2)] rounded-full overflow-hidden relative">
                            <div
                              className={cn('h-full rounded-full transition-all', data.tilt_points > 0 ? 'bg-emerald-500' : data.tilt_points < 0 ? 'bg-red-500' : 'bg-gray-400')}
                              style={{
                                width: `${Math.min(100, Math.abs(data.tilt_points) * 10 + 10)}%`,
                                marginLeft: data.tilt_points < 0 ? 'auto' : undefined,
                              }}
                            />
                          </div>
                          <span className={cn(
                            'text-[var(--text-small)] font-mono font-bold w-12 text-right',
                            data.tilt_points > 0 ? 'text-emerald-500' : data.tilt_points < 0 ? 'text-red-500' : 'text-[var(--text-3)]'
                          )}>
                            {data.tilt_points > 0 ? '+' : ''}{data.tilt_points}
                          </span>
                          <span className={cn(
                            'text-[10px] px-2 py-0.5 rounded-full font-medium',
                            data.signal === 'favorecido' ? 'bg-emerald-500/10 text-emerald-500' :
                            data.signal === 'desfavorecido' ? 'bg-red-500/10 text-red-500' :
                            'bg-gray-500/10 text-gray-500'
                          )}>
                            {data.signal}
                          </span>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Rotation Matrix (all regimes) */}
            {matrix?.matrix && (
              <Card>
                <CardContent className="p-0">
                  <div className="px-5 pt-4 pb-2">
                    <h3 className="text-[var(--text-small)] font-semibold text-[var(--text-1)]">Matriz de Rotação — Todos os Regimes</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-[var(--text-caption)]">
                      <thead>
                        <tr className="border-b border-[var(--border-1)]">
                          <th className="text-left py-2 px-4 font-medium text-[var(--text-3)]">Setor</th>
                          {Object.keys(matrix.matrix).map(r => (
                            <th key={r} className={cn('py-2 px-3 font-medium text-center', r === regime.regime ? 'bg-[var(--accent)]/5' : '')}>
                              {r.replace('_', ' ')}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {matrix.clusters && Object.entries(matrix.clusters).map(([cid, cname]) => (
                          <tr key={cid} className="border-b border-[var(--border-1)] hover:bg-[var(--surface-2)]">
                            <td className="py-2 px-4 text-[var(--text-1)] font-medium">{cname as string}</td>
                            {Object.entries(matrix.matrix).map(([r, tilts]) => {
                              const val = (tilts as any)[cname as string] ?? 0
                              return (
                                <td key={r} className={cn('py-2 px-3 text-center font-mono', r === regime.regime ? 'bg-[var(--accent)]/5' : '')}>
                                  <span className={cn('font-bold', val > 0 ? 'text-emerald-500' : val < 0 ? 'text-red-500' : 'text-[var(--text-3)]')}>
                                    {val > 0 ? '+' : ''}{val}
                                  </span>
                                </td>
                              )
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </PaywallGate>
    </div>
  )
}
