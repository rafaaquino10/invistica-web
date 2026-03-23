'use client'

import { trpc } from '@/lib/trpc/provider'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/utils/formatters'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, Legend,
} from 'recharts'

// ─── Types ──────────────────────────────────────────────────────────

interface AnalyticsTabProps {
  portfolioId: string
}

// ─── Shared card wrapper ────────────────────────────────────────────

function Card({ title, badge, children, className }: {
  title: string
  badge?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('border border-[var(--border-1)]/20 rounded-[var(--radius)] bg-[var(--surface-1)] p-4', className)}>
      <div className="flex items-center gap-2 mb-3">
        <h3 className="text-[11px] font-semibold text-[var(--text-3)] uppercase tracking-wider">{title}</h3>
        {badge && (
          <span className="text-[10px] px-1.5 py-0.5 rounded-[var(--radius-sm)] bg-[var(--accent-1)]/10 text-[var(--accent-1)] font-medium">{badge}</span>
        )}
      </div>
      {children}
    </div>
  )
}

function MetricBox({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="text-center">
      <p className="text-[11px] text-[var(--text-3)] mb-0.5">{label}</p>
      <p className={cn('font-mono text-lg font-bold', color ?? 'text-[var(--text-1)]')}>{value}</p>
      {sub && <p className="text-[10px] text-[var(--text-3)]">{sub}</p>}
    </div>
  )
}

// ─── Component ──────────────────────────────────────────────────────

export function AnalyticsTab({ portfolioId }: AnalyticsTabProps) {
  const { data: attribution, isLoading: loadingAttr } = trpc.analytics.attribution.useQuery(
    { portfolioId }, { staleTime: 5 * 60 * 1000 }
  )
  const { data: risk, isLoading: loadingRisk } = trpc.analytics.risk.useQuery(
    { portfolioId }, { staleTime: 5 * 60 * 1000 }
  )
  const { data: scenario, isLoading: loadingScenario } = trpc.analytics.scenario.useQuery(
    { portfolioId }, { staleTime: 5 * 60 * 1000 }
  )
  const { data: quintile, isLoading: loadingQuintile } = trpc.analytics.quintile.useQuery(
    { portfolioId }, { staleTime: 5 * 60 * 1000 }
  )

  const isLoading = loadingAttr || loadingRisk || loadingScenario || loadingQuintile

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-48 bg-[var(--surface-2)]/50 rounded-[var(--radius)] animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* ─── 1. Performance Attribution ──────────────────────── */}
      {attribution && (
        <Card title="Atribuição de Performance" badge="Elite">
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-4 mb-4">
            <MetricBox label="Retorno Total" value={`${attribution.totalReturn.toFixed(1)}%`} color={attribution.totalReturn >= 0 ? 'text-[var(--pos)]' : 'text-[var(--neg)]'} />
            <MetricBox label="Benchmark" value={`${attribution.benchmarkReturn.toFixed(1)}%`} />
            <MetricBox label="Alocação" value={`${attribution.allocationEffect >= 0 ? '+' : ''}${attribution.allocationEffect.toFixed(2)}pp`} color={attribution.allocationEffect >= 0 ? 'text-[var(--pos)]' : 'text-[var(--neg)]'} />
            <MetricBox label="Seleção" value={`${attribution.selectionEffect >= 0 ? '+' : ''}${attribution.selectionEffect.toFixed(2)}pp`} color={attribution.selectionEffect >= 0 ? 'text-[var(--pos)]' : 'text-[var(--neg)]'} />
            <MetricBox label="Interação" value={`${attribution.interactionEffect >= 0 ? '+' : ''}${attribution.interactionEffect.toFixed(2)}pp`} />
          </div>

          {attribution.bySector.length > 0 && (
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={attribution.bySector.slice(0, 8)} layout="vertical" margin={{ left: 80, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-1)" opacity={0.3} />
                  <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={v => `${v}pp`} />
                  <YAxis type="category" dataKey="sector" tick={{ fontSize: 10 }} width={75} />
                  <Tooltip
                    contentStyle={{ fontSize: 11, background: 'var(--surface-1)', border: '1px solid var(--border-1)' }}
                    formatter={(v: number) => [`${v.toFixed(2)}pp`]}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="allocationEffect" name="Alocação" fill="#1A73E8" barSize={8} />
                  <Bar dataKey="selectionEffect" name="Seleção" fill="#0D9488" barSize={8} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      )}

      {/* ─── 2. Risk Analytics ───────────────────────────────── */}
      {risk && (
        <Card title="Análise de Risco" badge="Elite">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
            <MetricBox
              label="VaR 95%"
              value={`${risk.var95.toFixed(1)}%`}
              sub="Perda máxima estimada"
              color="text-[var(--neg)]"
            />
            <MetricBox
              label="Beta vs IBOV"
              value={risk.beta.toFixed(2)}
              sub={risk.beta > 1 ? 'Mais volátil que IBOV' : 'Menos volátil que IBOV'}
            />
            <MetricBox
              label="HHI"
              value={risk.hhi.toString()}
              sub={risk.concentrationLevel === 'baixa' ? 'Baixa concentração' :
                risk.concentrationLevel === 'moderada' ? 'Concentração moderada' :
                risk.concentrationLevel === 'alta' ? 'Alta concentração' : 'Muito alta concentração'}
              color={risk.hhi > 2500 ? 'text-[var(--neg)]' : risk.hhi > 1500 ? 'text-amber-500' : 'text-[var(--pos)]'}
            />
            <MetricBox
              label="Maior Posição"
              value={risk.topConcentration[0] ? `${risk.topConcentration[0].weight.toFixed(1)}%` : '—'}
              sub={risk.topConcentration[0]?.ticker ?? '—'}
            />
          </div>

          {/* Factor Exposure */}
          <div className="mt-3">
            <p className="text-[11px] text-[var(--text-3)] font-medium mb-2">Exposição a Fatores</p>
            <div className="grid grid-cols-5 gap-2">
              {[
                { label: 'Value', value: risk.factorExposure.value, color: '#1A73E8' },
                { label: 'Growth', value: risk.factorExposure.growth, color: '#0D9488' },
                { label: 'Dividend', value: risk.factorExposure.dividend, color: '#EAB308' },
                { label: 'Defensivo', value: risk.factorExposure.defensive, color: '#6366F1' },
                { label: 'Cíclico', value: risk.factorExposure.cyclical, color: '#D97706' },
              ].map(f => (
                <div key={f.label} className="text-center">
                  <div className="h-16 flex items-end justify-center mb-1">
                    <div
                      className="w-6 rounded-t-sm transition-all"
                      style={{ height: `${Math.max(4, f.value)}%`, backgroundColor: f.color }}
                    />
                  </div>
                  <p className="text-[10px] font-mono font-medium">{f.value.toFixed(0)}%</p>
                  <p className="text-[10px] text-[var(--text-3)]">{f.label}</p>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* ─── 3. Scenario Analysis ────────────────────────────── */}
      {scenario && (
        <Card title="Cenários Macro" badge="Elite">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[scenario.selicDown, scenario.selicUp, scenario.fxUp, scenario.fxDown].map((s) => (
              <div key={s.description} className="border border-[var(--border-1)]/15 rounded-[var(--radius-sm)] p-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[12px] font-medium">{s.description}</p>
                  <span className={cn(
                    'font-mono text-[13px] font-bold',
                    s.totalImpactPercent >= 0 ? 'text-[var(--pos)]' : 'text-[var(--neg)]'
                  )}>
                    {s.totalImpactPercent >= 0 ? '+' : ''}{s.totalImpactPercent.toFixed(2)}%
                  </span>
                </div>
                <p className="text-[10px] text-[var(--text-3)] mb-2">
                  Impacto estimado: {formatCurrency(Math.abs(s.totalImpactValue))} {s.totalImpactValue >= 0 ? 'ganho' : 'perda'}
                </p>
                <div className="space-y-1">
                  {s.bySector.slice(0, 3).map(sec => (
                    <div key={sec.sector} className="flex items-center justify-between text-[10px]">
                      <span className="text-[var(--text-2)] truncate max-w-[120px]">{sec.sector}</span>
                      <span className={cn('font-mono', sec.impactPercent >= 0 ? 'text-[var(--pos)]' : 'text-[var(--neg)]')}>
                        {sec.impactPercent >= 0 ? '+' : ''}{sec.impactPercent.toFixed(1)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ─── 4. Portfolio Quintile ────────────────────────────── */}
      {quintile && (
        <Card title="Quintil da Carteira" badge="Pro">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <span className={cn(
                'inline-flex items-center justify-center w-10 h-10 rounded-full font-mono text-lg font-bold text-white',
                quintile.portfolioQuintile === 1 ? 'bg-[#1A73E8]' :
                quintile.portfolioQuintile === 2 ? 'bg-[#0D9488]' :
                quintile.portfolioQuintile === 3 ? 'bg-[#EAB308]' :
                quintile.portfolioQuintile === 4 ? 'bg-[#D97706]' : 'bg-[#EF4444]'
              )}>
                Q{quintile.portfolioQuintile}
              </span>
              <div>
                <p className="text-[13px] font-medium">Score Médio: {quintile.portfolioAvgScore.toFixed(1)}</p>
                <p className="text-[11px] text-[var(--text-3)]">
                  {quintile.portfolioQuintile === 1 ? 'Top 20% do mercado' :
                   quintile.portfolioQuintile === 2 ? 'Acima da média' :
                   quintile.portfolioQuintile === 3 ? 'Na média' :
                   quintile.portfolioQuintile === 4 ? 'Abaixo da média' : 'Bottom 20%'}
                </p>
              </div>
            </div>
          </div>

          {/* Distribution comparison */}
          <div className="h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={quintile.distribution} margin={{ left: 10, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-1)" opacity={0.3} />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${v}%`} />
                <Tooltip
                  contentStyle={{ fontSize: 11, background: 'var(--surface-1)', border: '1px solid var(--border-1)' }}
                  formatter={(v: number) => [`${v.toFixed(1)}%`]}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="portfolioWeight" name="Sua Carteira" barSize={14}>
                  {quintile.distribution.map((d, i) => (
                    <Cell key={i} fill={d.color} />
                  ))}
                </Bar>
                <Bar dataKey="marketWeight" name="Mercado" fill="#94A3B8" barSize={14} opacity={0.5} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      {/* Empty state */}
      {!attribution && !risk && !scenario && !quintile && !isLoading && (
        <div className="py-12 text-center">
          <p className="text-sm text-[var(--text-2)]">Sem dados de analytics disponíveis</p>
          <p className="text-[11px] text-[var(--text-3)] mt-1">Adicione posições ao portfólio para ver análises detalhadas</p>
        </div>
      )}
    </div>
  )
}
