'use client'

import { trpc } from '@/lib/trpc/client'
import { Card, CardContent, Skeleton } from '@/components/ui'

import { cn } from '@/lib/utils'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, ReferenceLine,
} from 'recharts'

const TREND_CONFIG = {
  improving: { label: 'Melhorando', color: 'text-green-500', bg: 'bg-green-500/10' },
  stable: { label: 'Estável', color: 'text-amber-500', bg: 'bg-amber-500/10' },
  degrading: { label: 'Degradando', color: 'text-red-500', bg: 'bg-red-500/10' },
}

const PILLAR_COLORS: Record<string, string> = {
  valuation: '#6366F1',
  quality: '#22C55E',
  risk: '#EF4444',
  dividends: '#F59E0B',
  growth: '#3B82F6',
  momentum: '#EC4899',
}

export default function SignalDecayPage() {
  const { data, isLoading } = trpc.scoreSnapshots.signalDecay.useQuery(
    undefined,
    { staleTime: 10 * 60 * 1000 },
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-[var(--text-title)] font-bold tracking-tight">Signal Decay Monitor</h1>
        <p className="text-[var(--text-small)] text-[var(--text-2)] mt-0.5">
          Monitoramento de eficácia preditiva (IC) de cada pilar do IQ Score. Alerta quando IC cai abaixo de 0.05.
        </p>
      </div>

      {isLoading && (
          <div className="space-y-4">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        )}

        {data && (
          <>
            {/* IC Timeline Chart */}
            <Card>
              <CardContent className="p-5">
                <h3 className="text-[var(--text-small)] font-semibold text-[var(--text-1)] mb-4">
                  Information Coefficient ao Longo do Tempo
                </h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-1)" opacity={0.2} />
                      <XAxis
                        dataKey="month"
                        tick={{ fill: 'var(--text-3)', fontSize: 11 }}
                        type="category"
                        allowDuplicatedCategory={false}
                      />
                      <YAxis
                        tick={{ fill: 'var(--text-3)', fontSize: 11 }}
                        domain={[-0.05, 0.2]}
                        tickFormatter={v => v.toFixed(2)}
                        width={45}
                      />
                      <Tooltip
                        content={({ active, payload, label }) => {
                          if (!active || !payload?.length) return null
                          return (
                            <div className="bg-[var(--surface-1)] border border-[var(--border-1)] rounded-lg p-3 shadow-lg">
                              <p className="text-[var(--text-caption)] font-semibold text-[var(--text-1)] mb-1">{label}</p>
                              {payload.map((p: any) => (
                                <p key={p.name} className="text-[var(--text-caption)]" style={{ color: p.color }}>
                                  {p.name}: {Number(p.value).toFixed(4)}
                                </p>
                              ))}
                            </div>
                          )
                        }}
                      />
                      <ReferenceLine y={0.05} stroke="#EF4444" strokeDasharray="5 5" label={{ value: 'IC = 0.05', fill: '#EF4444', fontSize: 10, position: 'left' }} />
                      {data.map(m => (
                        <Line
                          key={m.pillar}
                          data={m.icMonthly}
                          dataKey="ic"
                          name={m.pillarLabel}
                          stroke={PILLAR_COLORS[m.pillar] ?? '#888'}
                          strokeWidth={2}
                          dot={{ r: 3 }}
                          type="monotone"
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Decay Table */}
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                  <table className="w-full text-[var(--text-small)]">
                    <thead>
                      <tr className="border-b border-[var(--border-1)] text-[var(--text-3)] text-[var(--text-caption)]">
                        <th className="text-left py-3 px-4 font-medium">Pilar</th>
                        <th className="text-right py-3 px-3 font-medium">IC Médio (6M)</th>
                        <th className="text-center py-3 px-3 font-medium">Tendência</th>
                        <th className="text-center py-3 px-3 font-medium">Status</th>
                        <th className="text-left py-3 px-4 font-medium">Ação Sugerida</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.map(m => {
                        const trend = TREND_CONFIG[m.icTrend]
                        return (
                          <tr
                            key={m.pillar}
                            className={cn(
                              'border-b border-[var(--border-1)] transition-colors',
                              m.isDecaying && 'bg-red-500/5',
                            )}
                          >
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: PILLAR_COLORS[m.pillar] }}
                                />
                                <span className="font-medium text-[var(--text-1)]">{m.pillarLabel}</span>
                              </div>
                            </td>
                            <td className="py-3 px-3 text-right font-mono">
                              <span className={cn(
                                'font-semibold',
                                m.icMean >= 0.05 ? 'text-green-500' : 'text-red-500',
                              )}>
                                {m.icMean.toFixed(4)}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-center">
                              <span className={cn(
                                'inline-flex px-2 py-0.5 rounded text-[var(--text-caption)] font-medium',
                                trend.bg, trend.color,
                              )}>
                                {trend.label}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-center">
                              {m.isDecaying ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[var(--text-caption)] font-semibold bg-red-500/10 text-red-500">
                                  Decay
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[var(--text-caption)] font-medium bg-green-500/10 text-green-500">
                                  OK
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-[var(--text-caption)] text-[var(--text-2)] max-w-[300px]">
                              {m.suggestedAction}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Legend */}
            <div className="p-4 rounded-lg bg-[var(--surface-2)]/50 border border-[var(--border-1)]">
              <p className="text-[var(--text-caption)] text-[var(--text-3)] leading-relaxed">
                IC (Information Coefficient) mede a correlação entre o score do pilar e o retorno futuro do ativo.
                IC &gt; 0.05 indica poder preditivo. IC &lt; 0.05 sugere que o fator perdeu eficácia e precisa de recalibração.
                Análise baseada em Spearman rank correlation com retornos forward de 30 dias.
              </p>
            </div>
          </>
        )}
    </div>
  )
}
