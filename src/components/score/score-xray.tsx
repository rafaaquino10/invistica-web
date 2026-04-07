'use client'

import { useState, useMemo } from 'react'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { Disclaimer, Tooltip } from '@/components/ui'
import { GLOSSARY } from '@/lib/glossary'

// ─── Types (mirroring server response, no engine imports in client) ──

interface SubNota {
  indicador: string
  valor: number | null
  nota: number
  pesoInterno: number
  direcao: 'menor_melhor' | 'maior_melhor'
  referencia: { nota10: number; nota5: number; nota0: number }
}

interface PilarData {
  nota: number
  pesoEfetivo: number
  subNotas: SubNota[]
  destaque: string
}

interface SectorBenchmarks {
  fairPE?: number
  targetROE?: number
  typicalMargin?: number
  maxDebtEbitda?: number
}

interface ScoreBreakdown {
  score: number
  classificacao: string
  pilares: {
    valuation: PilarData
    qualidade: PilarData
    risco: PilarData
    dividendos: PilarData
    crescimento: PilarData
    qualitativo: PilarData
  }
  sectorBenchmarks?: SectorBenchmarks
  ajustes: {
    filtroLiquidez: number
    fatorLiquidez: number
    fatorConfianca: number
    fatorMacro: number
    macroReason: string | null
    penalPatrimNegativo: boolean
    penalTriploNegativo: boolean
    sanityWarnings: string[]
    scoreBruto: number
    total: number
  }
  metadata: {
    dataCalculo: string | Date
    indicadoresDisponiveis: number
    indicadoresTotais: number
    confiabilidade: number
  }
  setorCalibrado: {
    setor: string
    pesos: { valuation: number; qualidade: number; risco: number; dividendos: number; crescimento: number; qualitativo: number }
    ajuste: {
      valuation_tolerancia: number
      margens_ajuste: { nota10: number; nota5: number; nota0: number } | null
      ignorar_indicadores: string[]
    } | null
  }
}

// ─── Constants ────────────────────────────────────────────────

const INDICATOR_LABELS: Record<string, string> = {
  P_L: 'P/L',
  P_VP: 'P/VP',
  PSR: 'PSR',
  P_EBIT: 'P/EBIT',
  EV_EBIT: 'EV/EBIT',
  EV_EBITDA: 'EV/EBITDA',
  ROIC: 'ROIC',
  ROE: 'ROE',
  MRG_EBIT: 'Margem EBIT',
  MRG_LIQUIDA: 'Margem Líquida',
  BETA: 'Beta vs IBOV',
  LIQ_CORRENTE: 'Liq. Corrente',
  DIV_BRUT_PATRIM: 'Dív/Patrimônio',
  P_CAP_GIRO: 'P/Cap. Giro',
  P_ATIV_CIRC_LIQ: 'P/At. Circ. Líq.',
  P_ATIVO: 'P/Ativo',
  DIV_YIELD: 'Dividend Yield',
  DIV_EBITDA: 'Dív. Líq./EBITDA',
  PAYOUT: 'Payout',
  FCF_COVERAGE: 'Cobertura FCF',
  CRESC_REC_5A: 'Cresc. Receita 5a',
  CRESC_LUCRO_5A: 'Cresc. Lucro 5a',
  PEG_RATIO: 'PEG Ratio',
  DCF_UPSIDE: 'Upside DCF',
  MOAT_SCORE: 'Moat Score',
  EARNINGS_QUALITY: 'Qualidade Lucros',
  MANAGEMENT_SCORE: 'Qualidade Gestão',
  GOVERNANCE_SCORE: 'Governança',
  REGULATORY_RISK: 'Risco Regulatório',
  NEWS_SENTIMENT: 'Sentimento Notícias',
  CEO_TENURE: 'Estabilidade CEO',
  BUYBACK_SIGNAL: 'Recompra de Ações',
  LISTING_SEGMENT: 'Segmento Listagem',
  FREE_FLOAT: 'Free Float',
  CVM_SANCTIONS: 'Sanções CVM',
  CATALYST_ALERT: 'Alertas de Risco',
  RI_EVENT_VOLUME: 'Volume Comunicados',
  DEBT_SUSTAINABILITY: 'Sustent. Dívida',
}

const PILLAR_LABELS: Record<string, string> = {
  valuation: 'Valuation',
  qualidade: 'Qualidade',
  risco: 'Risco',
  dividendos: 'Dividendos',
  crescimento: 'Crescimento',
  qualitativo: 'Qualitativo (60%)',
}

const QUANT_PILLARS = ['valuation', 'qualidade', 'risco', 'dividendos', 'crescimento'] as const

const PILLAR_ORDER = ['valuation', 'qualidade', 'risco', 'dividendos', 'crescimento', 'qualitativo'] as const

const PILLAR_COLORS: Record<string, string> = {
  valuation: '#06B6D4',
  qualidade: '#8B5CF6',
  risco: '#F59E0B',
  dividendos: '#10B981',
  crescimento: '#3B82F6',
  qualitativo: '#EC4899',
}

const SECTOR_LABELS: Record<string, string> = {
  bancos_financeiro: 'Bancos & Financeiro',
  seguradoras: 'Seguradoras',
  utilities_energia: 'Energia Elétrica',
  saneamento: 'Saneamento',
  petroleo_gas: 'Petróleo & Gás',
  mineracao: 'Mineração',
  siderurgia: 'Siderurgia',
  papel_celulose: 'Papel & Celulose',
  construcao_civil: 'Construção Civil',
  varejo_consumo: 'Varejo & Consumo',
  tecnologia: 'Tecnologia',
  saude: 'Saúde',
  educacao: 'Educação',
  telecom: 'Telecomunicações',
  industrial: 'Bens Industriais',
  agro: 'Agronegócio',
  transporte_logistica: 'Transporte & Logística',
  outros: 'Outros',
}

const DEFAULT_WEIGHTS = { valuation: 0.20, qualidade: 0.20, risco: 0.15, dividendos: 0.10, crescimento: 0.10, qualitativo: 0.25 }

const PILLAR_TOOLTIPS: Record<string, string> = {
  valuation: 'Avalia o preço relativo ao valor intrínseco da empresa',
  qualidade: 'Mede a qualidade do negócio (ROE, margens, endividamento)',
  risco: 'Avalia o nível de risco financeiro da empresa',
  dividendos: 'Analisa o histórico e qualidade dos dividendos pagos',
  crescimento: 'Mede o crescimento de receita, lucros e métricas operacionais',
  qualitativo: 'Avalia moat, qualidade dos lucros, gestão, sustentabilidade da dívida e risco regulatório',
}

// ─── Helpers ──────────────────────────────────────────────────

function noteColor(nota: number): string {
  if (nota >= 8) return 'text-[var(--accent-1)]'
  if (nota >= 6) return 'text-teal'
  if (nota >= 4) return 'text-amber'
  return 'text-red'
}

function noteBg(nota: number): string {
  if (nota >= 8) return 'bg-[var(--accent-1)]'
  if (nota >= 6) return 'bg-teal'
  if (nota >= 4) return 'bg-amber'
  return 'bg-red'
}

function pillarColor(nota: number): string {
  if (nota >= 70) return 'text-teal'
  if (nota >= 40) return 'text-amber'
  return 'text-red'
}

function pillarBg(nota: number): string {
  if (nota >= 70) return 'bg-teal'
  if (nota >= 40) return 'bg-amber'
  return 'bg-red'
}

function classifColor(c: string): string {
  if (c === 'Excepcional') return 'text-[var(--accent-1)]'
  if (c === 'Saudável') return 'text-teal'
  if (c === 'Atenção') return 'text-amber'
  return 'text-red'
}

function classifBg(c: string): string {
  if (c === 'Excepcional') return 'bg-[var(--accent-1)]/10 border-[var(--accent-1)]/20'
  if (c === 'Saudável') return 'bg-teal/10 border-teal/20'
  if (c === 'Atenção') return 'bg-amber/10 border-amber/20'
  return 'bg-red/10 border-red/20'
}

function formatValue(indicador: string, valor: number | null): string {
  if (valor === null || valor === undefined) return '—'
  const pctIndicators = ['ROIC', 'ROE', 'MRG_EBIT', 'MRG_LIQUIDA', 'DIV_YIELD', 'PAYOUT', 'CRESC_REC_5A', 'CRESC_LUCRO_5A']
  if (pctIndicators.includes(indicador)) return `${valor.toFixed(1)}%`
  return valor.toFixed(2)
}

function confColor(c: number): string {
  if (c >= 90) return 'text-teal'
  if (c >= 70) return 'text-amber'
  return 'text-red'
}

function confBg(c: number): string {
  if (c >= 90) return 'bg-teal'
  if (c >= 70) return 'bg-amber'
  return 'bg-red'
}

function interpretLabel(nota: number): { label: string; color: string } {
  if (nota >= 8.5) return { label: 'Excepcional', color: 'text-[var(--accent-1)]' }
  if (nota >= 7) return { label: 'Forte', color: 'text-teal' }
  if (nota >= 5) return { label: 'Adequado', color: 'text-[var(--text-2)]' }
  if (nota >= 3) return { label: 'Fraco', color: 'text-amber' }
  return { label: 'Crítico', color: 'text-red' }
}

// ─── Analytics Engine ─────────────────────────────────────────

interface DiagnosticInsight {
  icon: string
  text: string
  color: string
}

function generateDiagnosis(breakdown: ScoreBreakdown): DiagnosticInsight[] {
  const insights: DiagnosticInsight[] = []
  const p = breakdown.pilares
  const benchmarks = breakdown.sectorBenchmarks

  const pillarEntries = PILLAR_ORDER.filter(k => p[k] != null).map(k => ({ key: k, nota: p[k].nota, label: PILLAR_LABELS[k] ?? k }))
  const sorted = [...pillarEntries].sort((a, b) => b.nota - a.nota)
  const best = sorted[0]!
  const worst = sorted[sorted.length - 1]!

  // Best pillar
  if (best.nota >= 70) {
    insights.push({ icon: '+', text: `${best.label} é o ponto forte (${best.nota.toFixed(0)}/100) — indicadores consistentemente acima das referências setoriais.`, color: 'text-teal' })
  } else if (best.nota >= 40) {
    insights.push({ icon: '+', text: `Melhor pilar: ${best.label} (${best.nota.toFixed(0)}/100), porém nenhum pilar atinge excelência.`, color: 'text-amber' })
  } else {
    insights.push({ icon: '-', text: `Todos os pilares abaixo de 40/100 — ativo em situação crítica em múltiplas dimensões.`, color: 'text-red' })
  }

  // Worst pillar
  if (worst.nota < 30 && worst.key !== best.key) {
    insights.push({ icon: '-', text: `${worst.label} é crítico (${worst.nota.toFixed(0)}/100) — principal risco para o investidor.`, color: 'text-red' })
  } else if (worst.nota < 50 && worst.key !== best.key) {
    insights.push({ icon: '*', text: `${worst.label} merece atenção (${worst.nota.toFixed(0)}/100) — abaixo da mediana para o setor.`, color: 'text-amber' })
  }

  // Valuation vs sector benchmarks
  if (benchmarks?.fairPE) {
    const plSub = p.valuation.subNotas.find(s => s.indicador === 'P_L')
    if (plSub?.valor != null && plSub.valor > 0) {
      const ratio = plSub.valor / benchmarks.fairPE
      if (ratio < 0.7) {
        insights.push({ icon: '↓', text: `P/L de ${plSub.valor.toFixed(1)}x está ${((1 - ratio) * 100).toFixed(0)}% abaixo do P/L justo setorial (${benchmarks.fairPE}x) — desconto significativo.`, color: 'text-teal' })
      } else if (ratio > 1.3) {
        insights.push({ icon: '↑', text: `P/L de ${plSub.valor.toFixed(1)}x está ${((ratio - 1) * 100).toFixed(0)}% acima do P/L justo setorial (${benchmarks.fairPE}x) — prêmio de mercado.`, color: 'text-amber' })
      }
    }
  }

  // ROE vs target
  if (benchmarks?.targetROE) {
    const roeSub = p.qualidade.subNotas.find(s => s.indicador === 'ROE')
    if (roeSub?.valor != null) {
      if (roeSub.valor > benchmarks.targetROE * 1.2) {
        insights.push({ icon: '↑', text: `ROE de ${roeSub.valor.toFixed(1)}% supera o alvo setorial de ${benchmarks.targetROE}% — empresa gera retorno acima do esperado.`, color: 'text-teal' })
      } else if (roeSub.valor < benchmarks.targetROE * 0.6) {
        insights.push({ icon: '↓', text: `ROE de ${roeSub.valor.toFixed(1)}% está bem abaixo do alvo setorial de ${benchmarks.targetROE}% — eficiência comprometida.`, color: 'text-red' })
      }
    }
  }

  // Adjustment impact
  const ajustes = breakdown.ajustes
  if (ajustes.total < -5) {
    const reasons: string[] = []
    if (ajustes.fatorLiquidez < 1.0) reasons.push('liquidez')
    if (ajustes.fatorConfianca < 1.0) reasons.push('confiança dos dados')
    if (ajustes.fatorMacro < 1.0) reasons.push('cenário macro')
    if (ajustes.penalPatrimNegativo) reasons.push('patrimônio negativo')
    insights.push({
      icon: '!',
      text: `Penalidades de ${reasons.join(', ')} reduziram o score em ${Math.abs(ajustes.total).toFixed(0)} pts (bruto ${ajustes.scoreBruto.toFixed(0)} → final ${breakdown.score.toFixed(0)}).`,
      color: 'text-amber',
    })
  }

  // Confidence
  if (breakdown.metadata.confiabilidade < 70) {
    insights.push({ icon: '?', text: `Apenas ${breakdown.metadata.indicadoresDisponiveis} de ${breakdown.metadata.indicadoresTotais} indicadores disponíveis — análise pode ser incompleta.`, color: 'text-amber' })
  }

  // Dividend insight
  const dySub = p.dividendos.subNotas.find(s => s.indicador === 'DIV_YIELD')
  if (dySub?.valor != null && dySub.valor > 6) {
    insights.push({ icon: '+', text: `Dividend Yield de ${dySub.valor.toFixed(1)}% acima de 6% — atrativo para estratégia de renda passiva.`, color: 'text-teal' })
  }

  return insights.slice(0, 5)
}

interface IndicatorHighlight {
  indicador: string
  valor: number | null
  nota: number
  pilar: string
}

function getStrengthsWeaknesses(breakdown: ScoreBreakdown): { strengths: IndicatorHighlight[]; weaknesses: IndicatorHighlight[] } {
  const all: IndicatorHighlight[] = []
  for (const key of PILLAR_ORDER) {
    const pilar = breakdown.pilares[key]
    if (!pilar) continue
    for (const sub of pilar.subNotas) {
      if (sub.valor !== null && !(sub.valor === null && sub.nota === 5)) {
        all.push({ indicador: sub.indicador, valor: sub.valor, nota: sub.nota, pilar: PILLAR_LABELS[key] ?? key })
      }
    }
  }
  const sorted = [...all].sort((a, b) => b.nota - a.nota)
  return {
    strengths: sorted.filter(s => s.nota >= 6).slice(0, 3),
    weaknesses: sorted.filter(s => s.nota < 5).slice(-3).reverse(),
  }
}

// ─── Component ────────────────────────────────────────────────

interface ScoreXRayProps {
  breakdown: ScoreBreakdown
  ticker: string
}

export function ScoreXRay({ breakdown, ticker }: ScoreXRayProps) {
  const [expandedPillar, setExpandedPillar] = useState<string | null>('valuation')

  const togglePillar = (key: string) => {
    setExpandedPillar(prev => prev === key ? null : key)
  }

  const conf = breakdown.metadata.confiabilidade
  const hasAdjustments = breakdown.ajustes.fatorLiquidez < 1.0 || breakdown.ajustes.fatorConfianca < 1.0 || breakdown.ajustes.fatorMacro !== 1.0 || breakdown.ajustes.penalPatrimNegativo || breakdown.ajustes.penalTriploNegativo || breakdown.ajustes.sanityWarnings.length > 0

  const diagnosis = useMemo(() => generateDiagnosis(breakdown), [breakdown])
  const { strengths, weaknesses } = useMemo(() => getStrengthsWeaknesses(breakdown), [breakdown])

  return (
    <div className="border border-[var(--border-1)]/20 rounded-[var(--radius)] bg-[var(--surface-1)] overflow-hidden">
      {/* ─── Header ──────────────────────────────────────── */}
      <div className="px-5 pt-4 pb-3 border-b border-[var(--border-1)]/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[var(--accent-1)]/10 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--accent-1)]">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-semibold">Análise IQ-Cognit — {ticker}</h3>
              <p className="text-[11px] text-[var(--text-3)]">
                {breakdown.metadata.indicadoresDisponiveis}/{breakdown.metadata.indicadoresTotais} indicadores · Setor: {SECTOR_LABELS[breakdown.setorCalibrado.setor] ?? breakdown.setorCalibrado.setor}
                {' · '}
                <span className={confColor(conf)}>{conf.toFixed(0)}% confiança</span>
              </p>
            </div>
          </div>
          <div className={cn('px-3 py-1.5 rounded-lg border', classifBg(breakdown.classificacao))}>
            <span className={cn('text-xl font-bold font-mono', classifColor(breakdown.classificacao))}>
              {breakdown.score.toFixed(0)}
            </span>
            <span className={cn('text-xs font-medium ml-1.5', classifColor(breakdown.classificacao))}>
              {breakdown.classificacao}
            </span>
          </div>
        </div>
      </div>

      {/* ─── Diagnóstico (auto-generated insights) ─────── */}
      {diagnosis.length > 0 && (
        <div className="px-5 py-3 border-b border-[var(--border-1)]/20 bg-[var(--surface-2)]/20">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-3)] mb-2">Diagnóstico aQ</div>
          <div className="space-y-1.5">
            {diagnosis.map((d, i) => (
              <div key={i} className="flex items-start gap-2 text-[13px]">
                <span className={cn('flex-shrink-0 mt-0.5 text-xs', d.color)}>{d.icon}</span>
                <span className="text-[var(--text-1)] leading-snug">{d.text}</span>
              </div>
            ))}
          </div>
          <Disclaimer variant="inline" className="mt-2" />
        </div>
      )}

      {/* ─── Score Composition + Strengths/Weaknesses ───── */}
      <div className="grid grid-cols-1 md:grid-cols-2 border-b border-[var(--border-1)]/20">
        {/* Score Composition Bar */}
        <div className="px-5 py-3 lg:border-r border-b lg:border-b-0 border-[var(--border-1)]/20">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-3)] mb-2">Composição do Score</div>
          {/* Stacked bar showing each pillar's contribution */}
          <div className="flex h-[10px] rounded-full overflow-hidden mb-2">
            {PILLAR_ORDER.filter(k => breakdown.pilares[k] != null).map(key => {
              const pilar = breakdown.pilares[key]
              const contribution = pilar.nota * pilar.pesoEfetivo
              const widthPct = contribution
              return (
                <div
                  key={key}
                  className="h-full transition-all"
                  style={{ width: `${widthPct}%`, backgroundColor: PILLAR_COLORS[key] }}
                  title={`${PILLAR_LABELS[key]}: ${contribution.toFixed(1)} pts`}
                />
              )
            })}
          </div>
          {/* Pillar contribution breakdown */}
          <div className="space-y-1">
            {PILLAR_ORDER.filter(k => breakdown.pilares[k] != null).map(key => {
              const pilar = breakdown.pilares[key]
              const contribution = pilar.nota * pilar.pesoEfetivo
              return (
                <div key={key} className="flex items-center gap-2 text-[12px]">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: PILLAR_COLORS[key] }} />
                  <span className="text-[var(--text-2)] w-[80px] flex-shrink-0">{PILLAR_LABELS[key]}</span>
                  <span className={cn('font-mono font-medium w-6 text-right', pillarColor(pilar.nota))}>{pilar.nota.toFixed(0)}</span>
                  <span className="text-[var(--text-3)]">×</span>
                  <span className="font-mono text-[var(--text-3)] w-8">{(pilar.pesoEfetivo * 100).toFixed(0)}%</span>
                  <span className="text-[var(--text-3)]">=</span>
                  <span className="font-mono font-semibold w-8 text-right">{contribution.toFixed(1)}</span>
                </div>
              )
            })}
            <div className="flex items-center gap-2 text-[12px] pt-1.5 mt-1 border-t border-[var(--border-1)]/20">
              <span className="text-[var(--text-2)] font-medium w-[80px] flex-shrink-0 ml-4">Total bruto</span>
              <span className="font-mono font-bold ml-auto">{breakdown.ajustes.scoreBruto.toFixed(1)}</span>
            </div>
          </div>
        </div>

        {/* Strengths & Weaknesses */}
        <div className="px-5 py-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-teal mb-2">Forças</div>
              {strengths.length === 0 ? (
                <p className="text-[11px] text-[var(--text-3)]">Nenhum destaque positivo</p>
              ) : (
                <div className="space-y-2">
                  {strengths.map(s => (
                    <div key={s.indicador}>
                      <div className="flex items-center gap-1.5">
                        <span className={cn('text-[13px] font-mono font-bold', noteColor(s.nota))}>{s.nota.toFixed(1)}</span>
                        <span className="text-[13px] font-medium">{INDICATOR_LABELS[s.indicador] ?? s.indicador}</span>
                      </div>
                      <p className="text-[10px] text-[var(--text-3)] ml-7">
                        {formatValue(s.indicador, s.valor)} · {s.pilar}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-red mb-2">Fraquezas</div>
              {weaknesses.length === 0 ? (
                <p className="text-[11px] text-[var(--text-3)]">Nenhum ponto crítico</p>
              ) : (
                <div className="space-y-2">
                  {weaknesses.map(s => (
                    <div key={s.indicador}>
                      <div className="flex items-center gap-1.5">
                        <span className={cn('text-[13px] font-mono font-bold', noteColor(s.nota))}>{s.nota.toFixed(1)}</span>
                        <span className="text-[13px] font-medium">{INDICATOR_LABELS[s.indicador] ?? s.indicador}</span>
                      </div>
                      <p className="text-[10px] text-[var(--text-3)] ml-7">
                        {formatValue(s.indicador, s.valor)} · {s.pilar}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ─── Pillar Accordions (left) + Metadata (right) — 50/50 ── */}
      <div className="grid grid-cols-1 md:grid-cols-2">
        {/* Left: Pillars */}
        <div className="divide-y divide-[var(--border-1)]/20">
          {PILLAR_ORDER.filter(k => breakdown.pilares[k] != null).map(key => {
            const pilar = breakdown.pilares[key]
            const isOpen = expandedPillar === key
            const label = PILLAR_LABELS[key] ?? key

            return (
              <div key={key}>
                <button
                  onClick={() => togglePillar(key)}
                  className="w-full flex items-center gap-3 px-5 py-2.5 hover:bg-[var(--surface-2)]/50 transition-colors"
                >
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: PILLAR_COLORS[key] }} />
                  <Tooltip content={PILLAR_TOOLTIPS[key] ?? label} position="right">
                    <span className="text-sm font-semibold w-[90px] text-left flex-shrink-0">{label}</span>
                  </Tooltip>
                  <div className="flex-1 h-[5px] bg-[var(--surface-2)] rounded-full overflow-hidden max-w-full md:max-w-[180px]">
                    <div className={cn('h-full rounded-full', pillarBg(pilar.nota))} style={{ width: `${pilar.nota}%` }} />
                  </div>
                  <span className={cn('text-sm font-mono font-bold w-8 text-right', pillarColor(pilar.nota))}>
                    {pilar.nota.toFixed(0)}
                  </span>
                  <span className="text-xs text-[var(--text-3)] w-10">
                    {(pilar.pesoEfetivo * 100).toFixed(0)}%
                  </span>
                  <motion.svg
                    xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                    className="text-[var(--text-3)]"
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </motion.svg>
                </button>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-3 pt-0.5">
                        <div className="bg-[var(--surface-2)]/30 rounded-lg px-3 py-2 space-y-1">
                          {pilar.subNotas.map(sub => (
                            <IndicatorRow key={sub.indicador} sub={sub} benchmarks={breakdown.sectorBenchmarks} />
                          ))}
                        </div>
                        {pilar.destaque && (
                          <p className="text-[11px] text-[var(--text-3)] italic mt-2 ml-1">
                            {pilar.destaque}
                          </p>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </div>

        {/* Right: Metadata (equal width) */}
        <div className="lg:border-l border-t lg:border-t-0 border-[var(--border-1)]/20 px-5 py-4 space-y-5">
          <AdjustmentsCard ajustes={breakdown.ajustes} hasAdjustments={hasAdjustments} />
          <SectorCard calibration={breakdown.setorCalibrado} />
          <BenchmarksCard benchmarks={breakdown.sectorBenchmarks} />
          <ConfidenceCard metadata={breakdown.metadata} />
        </div>
      </div>
      <div className="px-5 pb-4">
        <Disclaimer variant="inline" />
      </div>
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────

function IndicatorRow({ sub, benchmarks }: { sub: SubNota; benchmarks?: SectorBenchmarks }) {
  const label = INDICATOR_LABELS[sub.indicador] ?? sub.indicador
  const isIgnored = sub.valor === null && sub.nota === 5
  const interp = interpretLabel(sub.nota)

  // Generate contextual reference text
  const refText = (() => {
    if (isIgnored) return null
    if (sub.indicador === 'P_L' && benchmarks?.fairPE && sub.valor != null) {
      return `ref. setor: ${benchmarks.fairPE}x`
    }
    if (sub.indicador === 'ROE' && benchmarks?.targetROE && sub.valor != null) {
      return `alvo: ${benchmarks.targetROE}%`
    }
    if (sub.indicador === 'MRG_EBIT' && benchmarks?.typicalMargin && sub.valor != null) {
      return `típica: ${benchmarks.typicalMargin}%`
    }
    if (sub.indicador === 'DIV_EBITDA' && benchmarks?.maxDebtEbitda && sub.valor != null) {
      return `max: ${benchmarks.maxDebtEbitda}x`
    }
    return null
  })()

  return (
    <div className={cn('flex items-center gap-2 py-1', isIgnored && 'opacity-40')}>
      {/* Direction arrow */}
      <span className="text-xs text-[var(--text-3)] w-3 flex-shrink-0">
        {sub.direcao === 'menor_melhor' ? '↓' : '↑'}
      </span>

      {/* Label com tooltip explicativo */}
      <span className="text-[13px] text-[var(--text-2)] w-[110px] flex-shrink-0 truncate">
        {GLOSSARY[label] ? (
          <Tooltip content={<span className="text-xs max-w-[220px] whitespace-normal">{GLOSSARY[label]}</span>} position="right">
            <span className="border-b border-dotted border-[var(--text-3)]/30 cursor-help">{label}</span>
          </Tooltip>
        ) : label}
      </span>

      {/* Value + context */}
      <div className="w-20 flex-shrink-0 text-right">
        <span className="text-[13px] font-mono font-medium">
          {isIgnored ? 'N/A' : formatValue(sub.indicador, sub.valor)}
        </span>
        {refText && (
          <p className="text-[10px] text-[var(--text-3)] leading-tight">{refText}</p>
        )}
      </div>

      {/* Score bar (0-10) */}
      <div className="flex-1 max-w-[80px] flex items-center gap-1.5">
        <div className="flex-1 h-[5px] bg-[var(--surface-1)] rounded-full overflow-hidden">
          <div
            className={cn('h-full rounded-full transition-all', noteBg(sub.nota))}
            style={{ width: `${sub.nota * 10}%` }}
          />
        </div>
        <span className={cn('text-[12px] font-mono font-bold w-6 text-right', noteColor(sub.nota))}>
          {sub.nota.toFixed(1)}
        </span>
      </div>

      {/* Interpretation label */}
      <span className={cn('text-[10px] font-medium w-16 text-right flex-shrink-0', interp.color)}>
        {isIgnored ? 'Ignorado' : interp.label}
      </span>
    </div>
  )
}

function SectorCard({ calibration }: { calibration: ScoreBreakdown['setorCalibrado'] }) {
  const sectorLabel = SECTOR_LABELS[calibration.setor] ?? calibration.setor
  const ignoredCount = calibration.ajuste?.ignorar_indicadores?.length ?? 0
  const tolerance = calibration.ajuste?.valuation_tolerancia ?? 1.0

  return (
    <div>
      <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-3)] mb-1.5">
        Calibração Setorial
      </div>
      <p className="text-[13px] font-medium mb-2">{sectorLabel}</p>
      <div className="space-y-0.5">
        {PILLAR_ORDER.filter(k => calibration.pesos[k] != null).map(key => {
          const peso = calibration.pesos[key]
          const defaultPeso = DEFAULT_WEIGHTS[key]
          const diff = peso !== defaultPeso

          return (
            <div key={key} className="flex items-center justify-between text-[11px]">
              <span className="text-[var(--text-2)]">{PILLAR_LABELS[key]}</span>
              <span className={cn('font-mono', diff ? 'text-[var(--accent-1)] font-medium' : 'text-[var(--text-3)]')}>
                {(peso * 100).toFixed(0)}%
                {diff && <span className="text-[10px] ml-1 opacity-50">(pad. {(defaultPeso * 100).toFixed(0)}%)</span>}
              </span>
            </div>
          )
        })}
      </div>
      {tolerance !== 1.0 && (
        <p className="mt-1.5 text-[10px] text-[var(--accent-1)]/70">Tolerância valuation: {tolerance}x</p>
      )}
      {ignoredCount > 0 && (
        <div className="mt-1.5 flex flex-wrap gap-1">
          {calibration.ajuste!.ignorar_indicadores.map(ind => (
            <span key={ind} className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--surface-2)] text-[var(--text-3)]">
              {INDICATOR_LABELS[ind] ?? ind}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

function AdjustmentsCard({ ajustes, hasAdjustments }: { ajustes: ScoreBreakdown['ajustes']; hasAdjustments: boolean }) {
  function fatorLabel(fator: number): string {
    if (fator >= 1.0) return 'Sem penalidade'
    if (fator >= 0.95) return 'Mínimo'
    if (fator >= 0.85) return 'Moderado'
    if (fator >= 0.70) return 'Significativo'
    return 'Severo'
  }

  function fatorColor(fator: number): string {
    if (fator >= 0.95) return 'text-teal'
    if (fator >= 0.85) return 'text-amber'
    return 'text-red'
  }

  return (
    <div>
      <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-3)] mb-1.5">
        Ajustes Aplicados
      </div>
      {!hasAdjustments ? (
        <div className="flex items-center gap-1.5 text-[12px] text-teal">
          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          Nenhum ajuste
        </div>
      ) : (
        <div className="space-y-1.5">
          {ajustes.total !== 0 && (
            <div className="flex items-center gap-2 text-[12px] pb-1.5 mb-1 border-b border-[var(--border-1)]/20">
              <span className="text-[var(--text-2)]">Bruto</span>
              <span className="font-mono font-semibold">{ajustes.scoreBruto.toFixed(0)}</span>
              <span className="text-[var(--text-3)]">→</span>
              <span className="font-mono font-semibold">{(ajustes.scoreBruto + ajustes.total).toFixed(0)}</span>
              <span className="text-[var(--text-2)]">ajustado</span>
            </div>
          )}
          {ajustes.fatorLiquidez < 1.0 && (
            <AdjustmentRow label="Liquidez" value={`×${ajustes.fatorLiquidez.toFixed(2)}`} color={fatorColor(ajustes.fatorLiquidez)} desc={fatorLabel(ajustes.fatorLiquidez)} />
          )}
          {ajustes.fatorConfianca < 1.0 && (
            <AdjustmentRow label="Confiança" value={`×${ajustes.fatorConfianca.toFixed(2)}`} color={fatorColor(ajustes.fatorConfianca)} desc={fatorLabel(ajustes.fatorConfianca)} />
          )}
          {ajustes.fatorMacro !== 1.0 && (
            <AdjustmentRow label="Macro" value={`×${ajustes.fatorMacro.toFixed(3)}`} color={ajustes.fatorMacro < 1.0 ? 'text-amber' : 'text-emerald-400'} desc={ajustes.macroReason ?? undefined} />
          )}
          {ajustes.penalPatrimNegativo && (
            <AdjustmentRow label="Patrim. negativo" value="cap 25" color="text-red" />
          )}
          {ajustes.penalTriploNegativo && (
            <AdjustmentRow label="Triplo negativo" value="cap 15" color="text-red" />
          )}
          {ajustes.sanityWarnings.map((w, i) => (
            <div key={i} className="flex items-center gap-1.5 text-[11px] text-amber">
              <span className="w-1 h-1 rounded-full bg-amber/50 flex-shrink-0" />
              <span className="truncate">{w}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function AdjustmentRow({ label, value, color, desc }: { label: string; value: string; color: string; desc?: string }) {
  return (
    <div className="flex items-center gap-2 text-[12px]">
      <span className="w-1.5 h-1.5 rounded-full bg-current flex-shrink-0 opacity-40" />
      <span className="text-[var(--text-2)]">{label}</span>
      <span className={cn('font-mono font-medium', color)}>{value}</span>
      {desc && <span className="text-[10px] text-[var(--text-3)] truncate">{desc}</span>}
    </div>
  )
}

function BenchmarksCard({ benchmarks }: { benchmarks?: SectorBenchmarks }) {
  if (!benchmarks || Object.keys(benchmarks).length === 0) return null

  const items: { label: string; value: string }[] = []
  if (benchmarks.fairPE != null) items.push({ label: 'P/L justo', value: `${benchmarks.fairPE}x` })
  if (benchmarks.targetROE != null) items.push({ label: 'ROE alvo', value: `${benchmarks.targetROE}%` })
  if (benchmarks.typicalMargin != null) items.push({ label: 'Margem típica', value: `${benchmarks.typicalMargin}%` })
  if (benchmarks.maxDebtEbitda != null) items.push({ label: 'Dív/EBITDA max', value: `${benchmarks.maxDebtEbitda}x` })

  return (
    <div>
      <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-3)] mb-1.5">
        Referências do Setor
      </div>
      <div className="space-y-1">
        {items.map(item => (
          <div key={item.label} className="flex items-center justify-between text-[12px]">
            <span className="text-[var(--text-2)]">{item.label}</span>
            <span className="font-mono font-medium text-[var(--accent-1)]">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function ConfidenceCard({ metadata }: { metadata: ScoreBreakdown['metadata'] }) {
  const conf = metadata.confiabilidade

  return (
    <div>
      <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-3)] mb-1.5">
        Confiabilidade
      </div>
      <div className="flex items-center gap-2 mb-1.5">
        <div className="flex-1 h-[5px] bg-[var(--surface-2)] rounded-full overflow-hidden">
          <div className={cn('h-full rounded-full', confBg(conf))} style={{ width: `${conf}%` }} />
        </div>
        <span className={cn('text-[13px] font-mono font-bold', confColor(conf))}>{conf.toFixed(0)}%</span>
      </div>
      <p className="text-[11px] text-[var(--text-2)]">
        {metadata.indicadoresDisponiveis} de {metadata.indicadoresTotais} indicadores
      </p>
      {conf < 70 && (
        <p className="text-[10px] text-amber mt-1">Score pode ser impreciso</p>
      )}
    </div>
  )
}
