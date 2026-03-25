'use client'

import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/hooks/use-auth'
import { pro } from '@/lib/api/endpoints'
import { Card, CardContent, Skeleton } from '@/components/ui'
import { PaywallGate } from '@/components/billing/paywall-gate'
import { cn } from '@/lib/utils'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Cell,
} from 'recharts'

const QUINTILE_COLORS = ['#22C55E', '#6366F1', '#F59E0B', '#EC4899', '#EF4444']

export default function SignalDecayPage() {
  const { token } = useAuth()

  const { data, isLoading } = useQuery({
    queryKey: ['signal-decay'],
    queryFn: () => pro.getSignalDecay(token ?? undefined),
    enabled: !!token,
    staleTime: 5 * 60 * 1000,
  })

  const quintiles = data?.quintiles ?? []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-[var(--text-title)] font-bold tracking-tight">Signal Decay Monitor</h1>
        <p className="text-[var(--text-small)] text-[var(--text-2)] mt-0.5">
          Distribuição de IQ-Score por quintil — valida se scores altos se traduzem em ativos de melhor qualidade.
        </p>
      </div>

      <PaywallGate requiredPlan="pro" feature="Signal Decay Monitor" showPreview>
        {isLoading && (
          <div className="space-y-4">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        )}

        {quintiles.length > 0 && (
          <>
            {/* Quintile Chart */}
            <Card>
              <CardContent className="p-5">
                <h3 className="text-[var(--text-small)] font-semibold text-[var(--text-1)] mb-4">
                  IQ-Score Médio por Quintil
                </h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={quintiles}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-1)" opacity={0.2} />
                      <XAxis dataKey="label" tick={{ fill: 'var(--text-3)', fontSize: 11 }} />
                      <YAxis tick={{ fill: 'var(--text-3)', fontSize: 11 }} domain={[0, 100]} width={40} />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (!active || !payload?.length) return null
                          const d = payload[0]?.payload as any
                          return (
                            <div className="bg-[var(--surface-1)] border border-[var(--border-1)] rounded-lg p-3 shadow-lg text-[var(--text-caption)]">
                              <p className="font-semibold text-[var(--text-1)] mb-1">{d.label} ({d.count} ativos)</p>
                              <p>IQ-Score: <span className="font-mono font-bold">{d.avg_iq_score}</span></p>
                              <p>Quanti: <span className="font-mono">{d.avg_quanti}</span></p>
                              <p>Quali: <span className="font-mono">{d.avg_quali}</span></p>
                              <p>Valuation: <span className="font-mono">{d.avg_valuation}</span></p>
                            </div>
                          )
                        }}
                      />
                      <Bar dataKey="avg_iq_score" radius={[4, 4, 0, 0]}>
                        {quintiles.map((_, i) => (
                          <Cell key={i} fill={QUINTILE_COLORS[i] ?? '#888'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Quintile Table */}
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-[var(--text-small)]">
                    <thead>
                      <tr className="border-b border-[var(--border-1)] text-[var(--text-3)] text-[var(--text-caption)]">
                        <th className="text-left py-3 px-4 font-medium">Quintil</th>
                        <th className="text-right py-3 px-3 font-medium">Ativos</th>
                        <th className="text-right py-3 px-3 font-medium">IQ-Score</th>
                        <th className="text-right py-3 px-3 font-medium">Quanti</th>
                        <th className="text-right py-3 px-3 font-medium">Quali</th>
                        <th className="text-right py-3 px-3 font-medium">Valuation</th>
                      </tr>
                    </thead>
                    <tbody>
                      {quintiles.map((q, i) => (
                        <tr key={q.quintile} className="border-b border-[var(--border-1)] transition-colors hover:bg-[var(--surface-2)]">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: QUINTILE_COLORS[i] }} />
                              <span className="font-medium text-[var(--text-1)]">{q.quintile}</span>
                              <span className="text-[var(--text-3)] text-[var(--text-caption)]">{q.label}</span>
                            </div>
                          </td>
                          <td className="py-3 px-3 text-right font-mono">{q.count}</td>
                          <td className={cn('py-3 px-3 text-right font-mono font-semibold', q.avg_iq_score >= 62 ? 'text-green-500' : q.avg_iq_score >= 42 ? 'text-amber-500' : 'text-red-500')}>
                            {q.avg_iq_score}
                          </td>
                          <td className="py-3 px-3 text-right font-mono">{q.avg_quanti}</td>
                          <td className="py-3 px-3 text-right font-mono">{q.avg_quali}</td>
                          <td className="py-3 px-3 text-right font-mono">{q.avg_valuation}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            <div className="p-4 rounded-lg bg-[var(--surface-2)]/50 border border-[var(--border-1)]">
              <p className="text-[var(--text-caption)] text-[var(--text-3)] leading-relaxed">
                {data?.count ?? 0} ativos analisados. Q1 (Top 20%) deve ter score significativamente
                maior que Q5 (Bottom 20%) para validar eficácia do modelo. Spread Q1-Q5 &gt; 20 pontos
                indica alta capacidade discriminativa.
              </p>
            </div>
          </>
        )}
      </PaywallGate>
    </div>
  )
}
