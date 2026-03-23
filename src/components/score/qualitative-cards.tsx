'use client'

import { cn } from '@/lib/utils'
import { Tooltip } from '@/components/ui/tooltip'

// ─── Types ──────────────────────────────────────────────────

interface SubNota {
  indicador: string
  valor: number | null
  nota: number
  pesoInterno: number
  direcao: 'menor_melhor' | 'maior_melhor'
  referencia: { nota10: number; nota5: number; nota0: number }
}

interface QualitativeCardsProps {
  subNotas: SubNota[]
  /** Optional extra data from fundamentals */
  extras?: {
    moatClassification?: 'wide' | 'narrow' | 'none' | null
    earningsManipulationFlag?: boolean | null
    interestCoverage?: number | null
    netDebtEbitdaRatio?: number | null
    shortTermDebtRatio?: number | null
    debtCostEstimate?: number | null
    fcfToNetIncome?: number | null
    accrualsRatio?: number | null
    marginStability?: number | null
    pricingPower?: number | null
    roicPersistence?: number | null
    sectorExposure?: number | null
    earningsVolatility?: number | null
    regulatorName?: string | null
  }
}

// ─── Card Config ────────────────────────────────────────────

interface CardConfig {
  indicador: string
  title: string
  icon: React.ReactNode
  tooltip: string
  getDetails: (valor: number | null, extras?: QualitativeCardsProps['extras']) => CardDetail[]
  getClassification?: (valor: number | null, extras?: QualitativeCardsProps['extras']) => { label: string; color: string } | null
}

interface CardDetail {
  label: string
  value: string
  color?: string
}

function scoreColor(valor: number | null): string {
  if (valor == null) return 'text-[var(--text-3)]'
  if (valor >= 70) return 'text-teal'
  if (valor >= 40) return 'text-amber'
  return 'text-red'
}

function scoreBorderColor(valor: number | null): string {
  if (valor == null) return 'border-[var(--border-1)]'
  if (valor >= 70) return 'border-teal/30'
  if (valor >= 40) return 'border-amber/30'
  return 'border-red/30'
}

function scoreBgColor(valor: number | null): string {
  if (valor == null) return 'bg-[var(--surface-2)]'
  if (valor >= 70) return 'bg-teal/5'
  if (valor >= 40) return 'bg-amber/5'
  return 'bg-red/5'
}

const CARD_CONFIGS: CardConfig[] = [
  {
    indicador: 'MOAT_SCORE',
    title: 'Vantagem Competitiva',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
    tooltip: 'Avalia a durabilidade da vantagem competitiva da empresa: persistência de ROIC, estabilidade de margens e poder de precificação.',
    getClassification: (valor, extras) => {
      const cls = extras?.moatClassification
      if (cls === 'wide') return { label: 'Wide Moat', color: 'text-teal' }
      if (cls === 'narrow') return { label: 'Narrow Moat', color: 'text-amber' }
      if (cls === 'none') return { label: 'Sem Moat', color: 'text-red' }
      if (valor == null) return null
      if (valor >= 70) return { label: 'Wide Moat', color: 'text-teal' }
      if (valor >= 40) return { label: 'Narrow Moat', color: 'text-amber' }
      return { label: 'Sem Moat', color: 'text-red' }
    },
    getDetails: (valor, extras) => {
      const details: CardDetail[] = []
      if (extras?.roicPersistence != null) {
        details.push({ label: 'ROIC Persistente', value: `${extras.roicPersistence} anos`, color: extras.roicPersistence >= 5 ? 'text-teal' : 'text-[var(--text-2)]' })
      }
      if (extras?.marginStability != null) {
        details.push({ label: 'Estab. Margem', value: `${extras.marginStability.toFixed(0)}/100`, color: extras.marginStability >= 70 ? 'text-teal' : extras.marginStability >= 40 ? 'text-amber' : 'text-red' })
      }
      if (extras?.pricingPower != null) {
        details.push({ label: 'Pricing Power', value: `${extras.pricingPower > 0 ? '+' : ''}${extras.pricingPower.toFixed(1)}%`, color: extras.pricingPower > 0 ? 'text-teal' : 'text-red' })
      }
      return details
    },
  },
  {
    indicador: 'EARNINGS_QUALITY',
    title: 'Qualidade dos Lucros',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
      </svg>
    ),
    tooltip: 'Mede a qualidade e confiabilidade dos lucros reportados. Usa accruals, relação FCF/Lucro e detecta sinais de manipulação contábil.',
    getClassification: (valor, extras) => {
      if (extras?.earningsManipulationFlag) return { label: 'ATENÇÃO', color: 'text-red' }
      return null
    },
    getDetails: (valor, extras) => {
      const details: CardDetail[] = []
      if (extras?.accrualsRatio != null) {
        const good = Math.abs(extras.accrualsRatio) < 0.10
        details.push({ label: 'Accruals Ratio', value: `${(extras.accrualsRatio * 100).toFixed(1)}%`, color: good ? 'text-teal' : 'text-amber' })
      }
      if (extras?.fcfToNetIncome != null) {
        details.push({ label: 'FCF / Lucro', value: `${extras.fcfToNetIncome.toFixed(2)}x`, color: extras.fcfToNetIncome >= 0.8 ? 'text-teal' : extras.fcfToNetIncome >= 0.5 ? 'text-amber' : 'text-red' })
      }
      return details
    },
  },
  {
    indicador: 'MANAGEMENT_SCORE',
    title: 'Gestão & Governança',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    tooltip: 'Avalia a qualidade da gestão: alocação de capital, previsibilidade de resultados e alinhamento com acionistas.',
    getDetails: () => [],
  },
  {
    indicador: 'DEBT_SUSTAINABILITY',
    title: 'Sustentabilidade da Dívida',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="6" width="20" height="12" rx="2" /><path d="M12 12h.01" /><path d="M17 12h.01" /><path d="M7 12h.01" />
      </svg>
    ),
    tooltip: 'Mede a capacidade da empresa de sustentar sua dívida: cobertura de juros, alavancagem e perfil de vencimentos.',
    getDetails: (valor, extras) => {
      const details: CardDetail[] = []
      if (extras?.interestCoverage != null) {
        details.push({ label: 'Cobert. Juros', value: `${extras.interestCoverage.toFixed(1)}x`, color: extras.interestCoverage >= 3 ? 'text-teal' : extras.interestCoverage >= 1.5 ? 'text-amber' : 'text-red' })
      }
      if (extras?.netDebtEbitdaRatio != null) {
        details.push({ label: 'Dív.Líq/EBITDA', value: `${extras.netDebtEbitdaRatio.toFixed(1)}x`, color: extras.netDebtEbitdaRatio <= 2 ? 'text-teal' : extras.netDebtEbitdaRatio <= 3.5 ? 'text-amber' : 'text-red' })
      }
      if (extras?.shortTermDebtRatio != null) {
        details.push({ label: '% Dívida CP', value: `${(extras.shortTermDebtRatio * 100).toFixed(0)}%`, color: extras.shortTermDebtRatio < 0.3 ? 'text-teal' : 'text-amber' })
      }
      return details
    },
  },
  {
    indicador: 'REGULATORY_RISK',
    title: 'Risco Regulatório',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
    tooltip: 'Avalia a exposição a riscos regulatórios setoriais e volatilidade de resultados. Menor score = mais seguro.',
    getDetails: (valor, extras) => {
      const details: CardDetail[] = []
      if (extras?.regulatorName) {
        details.push({ label: 'Regulador', value: extras.regulatorName })
      }
      if (extras?.earningsVolatility != null) {
        details.push({ label: 'Vol. Resultados', value: `${extras.earningsVolatility.toFixed(0)}%`, color: extras.earningsVolatility < 30 ? 'text-teal' : extras.earningsVolatility < 60 ? 'text-amber' : 'text-red' })
      }
      return details
    },
  },
]

// ─── Mini Gauge ─────────────────────────────────────────────

function MiniGauge({ score, size = 40 }: { score: number | null; size?: number }) {
  if (score == null) {
    return (
      <div
        className="rounded-full border-2 border-[var(--border-1)] flex items-center justify-center bg-[var(--surface-2)]"
        style={{ width: size, height: size }}
      >
        <span className="text-[10px] font-mono text-[var(--text-3)]">—</span>
      </div>
    )
  }

  const radius = (size - 6) / 2
  const circumference = 2 * Math.PI * radius
  const progress = (score / 100) * circumference
  const color = score >= 70 ? 'var(--pos, #4ADE80)' : score >= 40 ? 'var(--amber, #FB923C)' : 'var(--neg, #EF4444)'

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="var(--surface-2, #1a1a2e)" strokeWidth="3"
        />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke={color} strokeWidth="3"
          strokeDasharray={`${progress} ${circumference}`}
          strokeLinecap="round"
        />
      </svg>
      <span
        className={cn('absolute inset-0 flex items-center justify-center font-mono font-bold', scoreColor(score))}
        style={{ fontSize: size * 0.3 }}
      >
        {score.toFixed(0)}
      </span>
    </div>
  )
}

// ─── Component ──────────────────────────────────────────────

export function QualitativeCards({ subNotas, extras }: QualitativeCardsProps) {
  if (!subNotas || subNotas.length === 0) return null

  const subNotaMap = new Map(subNotas.map(s => [s.indicador, s]))

  return (
    <div>
      <h2 className="text-[11px] font-semibold text-[var(--text-3)] uppercase tracking-wider mb-2">Análise Qualitativa</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
        {CARD_CONFIGS.map(config => {
          const sub = subNotaMap.get(config.indicador)
          const valor = sub?.valor ?? null
          const details = config.getDetails(valor, extras)
          const classification = config.getClassification?.(valor, extras)
          const isManipulationAlert = config.indicador === 'EARNINGS_QUALITY' && extras?.earningsManipulationFlag

          return (
            <div
              key={config.indicador}
              className={cn(
                'border rounded-[var(--radius)] p-3 transition-colors',
                scoreBorderColor(valor),
                scoreBgColor(valor),
              )}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className={cn('flex-shrink-0', scoreColor(valor))}>
                    {config.icon}
                  </div>
                  <Tooltip content={<span className="text-xs max-w-[220px] whitespace-normal">{config.tooltip}</span>} position="top">
                    <h3 className="text-[12px] font-semibold text-[var(--text-1)] truncate cursor-help">
                      {config.title}
                    </h3>
                  </Tooltip>
                </div>
                <MiniGauge score={valor} size={40} />
              </div>

              {/* Classification badge */}
              {classification && (
                <div className="mb-2">
                  <span className={cn(
                    'inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full',
                    isManipulationAlert
                      ? 'bg-red/15 text-red border border-red/30'
                      : classification.color === 'text-teal'
                        ? 'bg-teal/10 text-teal'
                        : classification.color === 'text-amber'
                          ? 'bg-amber/10 text-amber'
                          : 'bg-[var(--surface-2)] text-[var(--text-2)]',
                  )}>
                    {classification.label}
                  </span>
                </div>
              )}

              {/* Detail metrics */}
              {details.length > 0 && (
                <div className="space-y-1">
                  {details.map(d => (
                    <div key={d.label} className="flex items-center justify-between text-[11px]">
                      <span className="text-[var(--text-3)]">{d.label}</span>
                      <span className={cn('font-mono font-medium', d.color ?? 'text-[var(--text-1)]')}>{d.value}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Fallback if no details */}
              {details.length === 0 && valor != null && (
                <div className="text-[11px] text-[var(--text-3)]">
                  Score: <span className={cn('font-mono font-medium', scoreColor(valor))}>{valor.toFixed(0)}</span>/100
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
