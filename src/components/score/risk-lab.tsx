'use client'

import { cn } from '@/lib/utils'

interface RiskMetricsData {
  risk: {
    altman_z: number | null
    altman_z_label: string | null
    merton_pd: number | null
    dl_ebitda: number | null
    icj: number | null
    piotroski_score: number | null
    beneish_score: number | null
    liquidity_ratio: number | null
  }
  profitability: {
    roe: number | null
    roic: number | null
    wacc: number | null
    spread_roic_wacc: number | null
    net_margin: number | null
    gross_margin: number | null
    fcf_yield: number | null
  }
}

interface RiskLabProps {
  riskMetrics: RiskMetricsData
  ticker: string
}

function riskColor(level: 'safe' | 'caution' | 'danger'): string {
  if (level === 'safe') return 'text-teal'
  if (level === 'caution') return 'text-amber'
  return 'text-red'
}

function riskBg(level: 'safe' | 'caution' | 'danger'): string {
  if (level === 'safe') return 'bg-teal/10'
  if (level === 'caution') return 'bg-amber/10'
  return 'bg-red/10'
}

function fmtPct(v: number | null, mult = 100): string {
  if (v == null) return '—'
  return `${(v * mult).toFixed(1)}%`
}

function fmtNum(v: number | null, d = 2): string {
  if (v == null) return '—'
  return v.toFixed(d)
}

export function RiskLab({ riskMetrics, ticker }: RiskLabProps) {
  const r = riskMetrics.risk
  const p = riskMetrics.profitability

  // Merton PD assessment
  const mertonLevel: 'safe' | 'caution' | 'danger' =
    r.merton_pd == null ? 'caution' :
    r.merton_pd < 0.05 ? 'safe' :
    r.merton_pd < 0.15 ? 'caution' : 'danger'
  const mertonLabel =
    mertonLevel === 'safe' ? 'Baixo risco' :
    mertonLevel === 'caution' ? 'Moderado' : 'Elevado'

  // Altman Z assessment
  const altmanLevel: 'safe' | 'caution' | 'danger' =
    r.altman_z == null ? 'caution' :
    r.altman_z > 2.99 ? 'safe' :
    r.altman_z > 1.81 ? 'caution' : 'danger'

  // Piotroski assessment
  const piotroskiLevel: 'safe' | 'caution' | 'danger' =
    r.piotroski_score == null ? 'caution' :
    r.piotroski_score >= 7 ? 'safe' :
    r.piotroski_score >= 4 ? 'caution' : 'danger'

  // DL/EBITDA assessment
  const leverageLevel: 'safe' | 'caution' | 'danger' =
    r.dl_ebitda == null ? 'caution' :
    r.dl_ebitda < 2 ? 'safe' :
    r.dl_ebitda < 4 ? 'caution' : 'danger'

  // ICJ assessment
  const icjLevel: 'safe' | 'caution' | 'danger' =
    r.icj == null ? 'caution' :
    r.icj > 3 ? 'safe' :
    r.icj > 1.5 ? 'caution' : 'danger'

  // Beneish assessment (more negative = better, > -1.78 = likely manipulator)
  const beneishLevel: 'safe' | 'caution' | 'danger' =
    r.beneish_score == null ? 'caution' :
    r.beneish_score < -2.22 ? 'safe' :
    r.beneish_score < -1.78 ? 'caution' : 'danger'

  // ROIC-WACC Spread
  const spreadLevel: 'safe' | 'caution' | 'danger' =
    p.spread_roic_wacc == null ? 'caution' :
    p.spread_roic_wacc > 0.03 ? 'safe' :
    p.spread_roic_wacc > 0 ? 'caution' : 'danger'

  const metrics = [
    {
      label: 'Merton PD',
      sublabel: 'Probabilidade de Default',
      value: r.merton_pd != null ? `${(r.merton_pd * 100).toFixed(1)}%` : '—',
      level: mertonLevel,
      tag: mertonLabel,
    },
    {
      label: 'Altman Z-Score',
      sublabel: r.altman_z_label ?? 'Risco de falência',
      value: fmtNum(r.altman_z),
      level: altmanLevel,
      tag: r.altman_z_label === 'safe' ? 'Zona segura' : r.altman_z_label === 'grey' ? 'Zona cinza' : r.altman_z_label === 'distress' ? 'Distress' : altmanLevel === 'safe' ? 'Zona segura' : altmanLevel === 'caution' ? 'Zona cinza' : 'Distress',
    },
    {
      label: 'Piotroski F-Score',
      sublabel: 'Saúde financeira (0-9)',
      value: r.piotroski_score != null ? `${r.piotroski_score}/9` : '—',
      level: piotroskiLevel,
      tag: piotroskiLevel === 'safe' ? 'Forte' : piotroskiLevel === 'caution' ? 'Neutro' : 'Fraco',
    },
    {
      label: 'Dív. Líq./EBITDA',
      sublabel: 'Alavancagem operacional',
      value: fmtNum(r.dl_ebitda, 1) + 'x',
      level: leverageLevel,
      tag: leverageLevel === 'safe' ? 'Conservador' : leverageLevel === 'caution' ? 'Moderado' : 'Alavancado',
    },
    {
      label: 'Cobertura de Juros',
      sublabel: 'EBIT / Despesas financeiras',
      value: fmtNum(r.icj, 1) + 'x',
      level: icjLevel,
      tag: icjLevel === 'safe' ? 'Folgado' : icjLevel === 'caution' ? 'Justo' : 'Apertado',
    },
    {
      label: 'Beneish M-Score',
      sublabel: 'Qualidade dos lucros',
      value: fmtNum(r.beneish_score),
      level: beneishLevel,
      tag: beneishLevel === 'safe' ? 'Confiável' : beneishLevel === 'caution' ? 'Atenção' : 'Alerta',
    },
    {
      label: 'Spread ROIC-WACC',
      sublabel: 'Geração de valor econômico',
      value: p.spread_roic_wacc != null ? `${(p.spread_roic_wacc * 100).toFixed(1)}pp` : '—',
      level: spreadLevel,
      tag: spreadLevel === 'safe' ? 'Cria valor' : spreadLevel === 'caution' ? 'Marginal' : 'Destrói valor',
    },
    {
      label: 'Liquidez Corrente',
      sublabel: 'Ativo circ. / Passivo circ.',
      value: fmtNum(r.liquidity_ratio, 2) + 'x',
      level: r.liquidity_ratio == null ? 'caution' as const : r.liquidity_ratio > 1.5 ? 'safe' as const : r.liquidity_ratio > 1 ? 'caution' as const : 'danger' as const,
      tag: r.liquidity_ratio == null ? '—' : r.liquidity_ratio > 1.5 ? 'Saudável' : r.liquidity_ratio > 1 ? 'Justo' : 'Apertado',
    },
  ]

  // Filter out metrics with no data
  const activeMetrics = metrics.filter(m => m.value !== '—' && m.value !== '—x' && m.value !== '—pp')

  if (activeMetrics.length === 0) return null

  return (
    <div>
      <h2 className="text-[11px] font-semibold text-[var(--text-3)] uppercase tracking-wider mb-2">
        Risk Lab — {ticker}
      </h2>
      <div className="border border-[var(--border-1)] rounded-[var(--radius)] shadow-sm bg-[var(--surface-1)] p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {activeMetrics.map(m => (
            <div
              key={m.label}
              className={cn(
                'rounded-lg p-3 border',
                riskBg(m.level),
                m.level === 'safe' ? 'border-teal/20' :
                m.level === 'caution' ? 'border-amber/20' :
                'border-red/20'
              )}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-semibold text-[var(--text-3)] uppercase tracking-wider">{m.label}</span>
                <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded', riskColor(m.level), riskBg(m.level))}>
                  {m.tag}
                </span>
              </div>
              <div className={cn('text-[20px] font-mono font-bold leading-tight', riskColor(m.level))}>
                {m.value}
              </div>
              <div className="text-[10px] text-[var(--text-3)] mt-0.5">{m.sublabel}</div>
            </div>
          ))}
        </div>

        {/* Profitability summary bar */}
        {(p.roe != null || p.roic != null || p.fcf_yield != null) && (
          <div className="mt-4 pt-3 border-t border-[var(--border-1)]/20">
            <div className="flex items-center gap-6 text-[12px]">
              {p.roe != null && (
                <span className="text-[var(--text-2)]">ROE <span className="font-mono font-bold text-[var(--text-1)]">{fmtPct(p.roe)}</span></span>
              )}
              {p.roic != null && (
                <span className="text-[var(--text-2)]">ROIC <span className="font-mono font-bold text-[var(--text-1)]">{fmtPct(p.roic)}</span></span>
              )}
              {p.wacc != null && (
                <span className="text-[var(--text-2)]">WACC <span className="font-mono font-bold text-[var(--text-1)]">{fmtPct(p.wacc)}</span></span>
              )}
              {p.fcf_yield != null && (
                <span className="text-[var(--text-2)]">FCF Yield <span className="font-mono font-bold text-[var(--text-1)]">{fmtPct(p.fcf_yield)}</span></span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
