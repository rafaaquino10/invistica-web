'use client'

import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/hooks/use-auth'
import { pro } from '@/lib/api/endpoints'
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
  const { token } = useAuth()

  const { data: attrRaw, isLoading: loadingAttr } = useQuery({
    queryKey: ['portfolio-attribution', portfolioId],
    queryFn: () => pro.getPortfolioAttribution(portfolioId, token ?? undefined),
    enabled: !!token,
    staleTime: 5 * 60 * 1000,
  })
  const { data: riskRaw, isLoading: loadingRisk } = useQuery({
    queryKey: ['portfolio-risk', portfolioId],
    queryFn: () => pro.getPortfolioRisk(portfolioId, token ?? undefined),
    enabled: !!token,
    staleTime: 5 * 60 * 1000,
  })
  const { data: scenarioRaw, isLoading: loadingScenario } = useQuery({
    queryKey: ['portfolio-scenario'],
    queryFn: () => pro.getSensitivity(token ?? undefined),
    enabled: !!token,
    staleTime: 5 * 60 * 1000,
  })

  const isLoading = loadingAttr || loadingRisk || loadingScenario

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-48 bg-[var(--surface-2)]/50 rounded-[var(--radius)] animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* ─── 1. Performance Attribution ──────────────────────── */}
      {attrRaw && (
        <Card title="Atribuição de Performance" badge="Pro">
          <div className="grid grid-cols-3 gap-4 mb-4">
            <MetricBox
              label="Investido"
              value={formatCurrency(attrRaw.total_invested)}
            />
            <MetricBox
              label="Valor Atual"
              value={formatCurrency(attrRaw.total_current)}
            />
            <MetricBox
              label="Retorno Total"
              value={`${attrRaw.total_return_pct.toFixed(1)}%`}
              color={attrRaw.total_return_pct >= 0 ? 'text-[var(--pos)]' : 'text-[var(--neg)]'}
            />
          </div>

          {attrRaw.by_sector.length > 0 && (
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={attrRaw.by_sector.slice(0, 8)} layout="vertical" margin={{ left: 80, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-1)" opacity={0.3} />
                  <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v: any) => `${v}%`} />
                  <YAxis type="category" dataKey={(d: any) => d.tickers?.join(', ') ?? `Cluster ${d.cluster_id}`} tick={{ fontSize: 10 }} width={75} />
                  <Tooltip
                    contentStyle={{ fontSize: 11, background: 'var(--surface-1)', border: '1px solid var(--border-1)' }}
                    formatter={(v: any) => [`${Number(v).toFixed(1)}%`]}
                  />
                  <Bar dataKey="return_pct" name="Retorno" fill="#1A73E8" barSize={10}>
                    {attrRaw.by_sector.map((_: any, i: number) => (
                      <Cell key={i} fill={_.return_pct >= 0 ? '#22C55E' : '#EF4444'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      )}

      {/* ─── 2. Risk Analytics ───────────────────────────────── */}
      {riskRaw && (
        <Card title="Análise de Risco" badge="Pro">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
            <MetricBox
              label="Posições"
              value={riskRaw.positions.toString()}
            />
            <MetricBox
              label="HHI"
              value={riskRaw.hhi.toString()}
              sub={riskRaw.concentration === 'baixa' ? 'Baixa concentração' :
                riskRaw.concentration === 'moderada' ? 'Concentração moderada' : 'Alta concentração'}
              color={riskRaw.hhi > 2500 ? 'text-[var(--neg)]' : riskRaw.hhi > 1500 ? 'text-amber-500' : 'text-[var(--pos)]'}
            />
            <MetricBox
              label="Top 3"
              value={`${riskRaw.top3_weight_pct.toFixed(1)}%`}
              sub="Concentração top 3"
            />
            <MetricBox
              label="Maior Setor"
              value={`${riskRaw.max_sector_weight_pct.toFixed(1)}%`}
              sub="Concentração setorial"
              color={riskRaw.max_sector_weight_pct > 40 ? 'text-[var(--neg)]' : 'text-[var(--text-1)]'}
            />
          </div>

          {/* Pesos */}
          {riskRaw.weights.length > 0 && (
            <div className="space-y-1.5 mt-3">
              <p className="text-[11px] text-[var(--text-3)] font-medium mb-2">Distribuição de Pesos</p>
              {riskRaw.weights.map((w: any) => (
                <div key={w.ticker} className="flex items-center gap-2">
                  <span className="text-[11px] font-mono w-14 text-[var(--text-1)]">{w.ticker}</span>
                  <div className="flex-1 h-3 bg-[var(--surface-2)] rounded-full overflow-hidden">
                    <div className="h-full bg-[var(--accent)] rounded-full" style={{ width: `${Math.min(100, w.weight)}%` }} />
                  </div>
                  <span className="text-[10px] font-mono text-[var(--text-3)] w-10 text-right">{w.weight.toFixed(1)}%</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* ─── 3. Scenario Analysis ────────────────────────────── */}
      {scenarioRaw?.scenarios && (
        <Card title="Cenários Macro" badge="Pro">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {scenarioRaw.scenarios.map((s: any) => (
              <div key={s.name} className="border border-[var(--border-1)]/15 rounded-[var(--radius-sm)] p-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[12px] font-medium">{s.name}</p>
                  <span className={cn(
                    'font-mono text-[13px] font-bold',
                    s.impact_score >= 0 ? 'text-[var(--pos)]' : 'text-[var(--neg)]'
                  )}>
                    {s.impact_score >= 0 ? '+' : ''}{s.impact_score.toFixed(1)} pts
                  </span>
                </div>
                <p className="text-[10px] text-[var(--text-3)] mb-1">{s.description}</p>
                {s.affected_sectors && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {s.affected_sectors.map((sec: string) => (
                      <span key={sec} className="text-[9px] px-1.5 py-0.5 rounded bg-[var(--neg)]/10 text-[var(--neg)]">{sec}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Empty state */}
      {!attrRaw && !riskRaw && !scenarioRaw && !isLoading && (
        <div className="py-12 text-center">
          <p className="text-sm text-[var(--text-2)]">Sem dados de analytics disponíveis</p>
          <p className="text-[11px] text-[var(--text-3)] mt-1">Adicione posições ao portfólio para ver análises detalhadas</p>
        </div>
      )}
    </div>
  )
}
