'use client'

import { cn } from '@/lib/utils'
import { Tooltip } from '@/components/ui/tooltip'
import { GLOSSARY } from '@/lib/glossary'

// ─── Types ──────────────────────────────────────────────────

interface IndicatorGridProps {
  fundamentals: {
    peRatio: number | null
    pbRatio: number | null
    psr: number | null
    pEbit: number | null
    evEbit: number | null
    evEbitda: number | null
    roe: number | null
    roic: number | null
    margemEbit: number | null
    margemLiquida: number | null
    liquidezCorrente: number | null
    divBrutPatrim: number | null
    pCapGiro: number | null
    pAtivCircLiq: number | null
    pAtivo: number | null
    patrimLiquido: number | null
    dividendYield: number | null
    netDebtEbitda: number | null
    crescimentoReceita5a: number | null
    liq2meses: number | null
    [key: string]: unknown
  }
  /** Payout from fundamento extra */
  payout?: number | null
  /** Crescimento lucro 5a extra */
  crescimentoLucro5a?: number | null
}

// ─── Formatters ─────────────────────────────────────────────

function fmtR(val: unknown, d = 1): string {
  const n = val != null ? Number(val) : null
  if (n === null || isNaN(n) || n === 0) return '—'
  return n.toFixed(d)
}

function fmtP(val: unknown): string {
  const n = val != null ? Number(val) : null
  if (n === null || isNaN(n) || n === 0) return '—'
  return `${n.toFixed(1)}%`
}

function fmtBig(val: unknown): string {
  const n = val != null ? Number(val) : null
  if (n === null || isNaN(n) || n === 0) return '—'
  if (Math.abs(n) >= 1e9) return `R$${(n / 1e9).toFixed(1)}B`
  if (Math.abs(n) >= 1e6) return `R$${(n / 1e6).toFixed(0)}M`
  return `R$${n.toLocaleString('pt-BR')}`
}

// ─── Context Colors ─────────────────────────────────────────

type ContextColor = 'good' | 'neutral' | 'bad' | 'none'

function contextClass(c: ContextColor): string {
  if (c === 'good') return 'text-teal'
  if (c === 'bad') return 'text-red'
  if (c === 'neutral') return 'text-[var(--text-1)]'
  return 'text-[var(--text-1)]'
}

function evaluateIndicator(key: string, val: number | null): ContextColor {
  if (val == null || val === 0) return 'none'

  // Valuation: lower is better
  if (key === 'peRatio') return val < 10 ? 'good' : val > 25 ? 'bad' : 'neutral'
  if (key === 'pbRatio') return val < 1.5 ? 'good' : val > 4 ? 'bad' : 'neutral'
  if (key === 'evEbitda') return val < 8 ? 'good' : val > 15 ? 'bad' : 'neutral'
  if (key === 'psr') return val < 2 ? 'good' : val > 5 ? 'bad' : 'neutral'

  // Quality: higher is better
  if (key === 'roe') return val > 15 ? 'good' : val < 8 ? 'bad' : 'neutral'
  if (key === 'roic') return val > 12 ? 'good' : val < 6 ? 'bad' : 'neutral'
  if (key === 'margemEbit') return val > 15 ? 'good' : val < 5 ? 'bad' : 'neutral'
  if (key === 'margemLiquida') return val > 10 ? 'good' : val < 3 ? 'bad' : 'neutral'

  // Risk: context dependent
  if (key === 'divBrutPatrim') return val < 1 ? 'good' : val > 2.5 ? 'bad' : 'neutral'
  if (key === 'netDebtEbitda') return val < 2 ? 'good' : val > 3.5 ? 'bad' : 'neutral'
  if (key === 'liquidezCorrente') return val > 1.5 ? 'good' : val < 1 ? 'bad' : 'neutral'

  // Dividends: higher is better
  if (key === 'dividendYield') return val > 5 ? 'good' : val < 2 ? 'neutral' : 'neutral'

  // Growth: positive is better
  if (key === 'crescimentoReceita5a') return val > 10 ? 'good' : val < 0 ? 'bad' : 'neutral'
  if (key === 'crescimentoLucro5a') return val > 10 ? 'good' : val < 0 ? 'bad' : 'neutral'

  return 'none'
}

// ─── Category Config ────────────────────────────────────────

interface IndicatorItem {
  key: string
  label: string
  glossaryKey?: string
  format: (f: IndicatorGridProps['fundamentals'], extras?: Pick<IndicatorGridProps, 'payout' | 'crescimentoLucro5a'>) => string
  rawValue: (f: IndicatorGridProps['fundamentals'], extras?: Pick<IndicatorGridProps, 'payout' | 'crescimentoLucro5a'>) => number | null
}

interface Category {
  title: string
  items: IndicatorItem[]
}

const CATEGORIES: Category[] = [
  {
    title: 'Valuation',
    items: [
      { key: 'peRatio', label: 'P/L', glossaryKey: 'P/L', format: f => fmtR(f.peRatio), rawValue: f => f.peRatio as number | null },
      { key: 'pbRatio', label: 'P/VP', glossaryKey: 'P/VP', format: f => fmtR(f.pbRatio, 2), rawValue: f => f.pbRatio as number | null },
      { key: 'evEbitda', label: 'EV/EBITDA', glossaryKey: 'EV/EBITDA', format: f => fmtR(f.evEbitda), rawValue: f => f.evEbitda as number | null },
      { key: 'psr', label: 'PSR', glossaryKey: 'PSR', format: f => fmtR(f.psr, 2), rawValue: f => f.psr as number | null },
    ],
  },
  {
    title: 'Rentabilidade',
    items: [
      { key: 'roe', label: 'ROE', glossaryKey: 'ROE', format: f => fmtP(f.roe), rawValue: f => f.roe as number | null },
      { key: 'roic', label: 'ROIC', glossaryKey: 'ROIC', format: f => fmtP(f.roic), rawValue: f => f.roic as number | null },
      { key: 'margemEbit', label: 'Mrg. EBIT', glossaryKey: 'Margem EBIT', format: f => fmtP(f.margemEbit), rawValue: f => f.margemEbit as number | null },
      { key: 'margemLiquida', label: 'Mrg. Líquida', glossaryKey: 'Margem Líquida', format: f => fmtP(f.margemLiquida), rawValue: f => f.margemLiquida as number | null },
    ],
  },
  {
    title: 'Endividamento',
    items: [
      { key: 'divBrutPatrim', label: 'Dív/Patrimônio', glossaryKey: 'Dív/Patrimônio', format: f => fmtR(f.divBrutPatrim, 2), rawValue: f => f.divBrutPatrim as number | null },
      { key: 'netDebtEbitda', label: 'Dív.Líq/EBITDA', glossaryKey: 'Dív. Líq./EBITDA', format: f => fmtR(f.netDebtEbitda, 2), rawValue: f => f.netDebtEbitda as number | null },
      { key: 'liquidezCorrente', label: 'Liq. Corrente', glossaryKey: 'Liq. Corrente', format: f => fmtR(f.liquidezCorrente, 2), rawValue: f => f.liquidezCorrente as number | null },
    ],
  },
  {
    title: 'Crescimento',
    items: [
      { key: 'crescimentoReceita5a', label: 'Cresc. Rec. 5a', glossaryKey: 'Cresc. Receita 5a', format: f => fmtP(f.crescimentoReceita5a), rawValue: f => f.crescimentoReceita5a as number | null },
      { key: 'crescimentoLucro5a', label: 'Cresc. Lucro 5a', format: (_, e) => fmtP(e?.crescimentoLucro5a), rawValue: (_, e) => e?.crescimentoLucro5a ?? null },
    ],
  },
  {
    title: 'Dividendos',
    items: [
      { key: 'dividendYield', label: 'DY', glossaryKey: 'Dividend Yield', format: f => fmtP(f.dividendYield), rawValue: f => f.dividendYield as number | null },
      { key: 'payout', label: 'Payout', glossaryKey: 'Payout', format: (_, e) => fmtP(e?.payout), rawValue: (_, e) => e?.payout ?? null },
    ],
  },
]

// ─── Component ──────────────────────────────────────────────

export function IndicatorGrid({ fundamentals, payout, crescimentoLucro5a }: IndicatorGridProps) {
  const extras = { payout, crescimentoLucro5a }

  return (
    <div>
      <h2 className="text-[11px] font-semibold text-[var(--text-3)] uppercase tracking-wider mb-2">Indicadores Fundamentais</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {CATEGORIES.map(cat => (
          <div
            key={cat.title}
            className="border border-[var(--border-1)] rounded-[var(--radius)] bg-[var(--surface-1)] p-3"
          >
            <h3 className="text-[11px] sm:text-[10px] font-semibold uppercase tracking-wider text-[var(--accent-1)]/60 mb-2 pb-1.5 border-b border-[var(--accent-1)]/10">
              {cat.title}
            </h3>
            <div className="space-y-1.5">
              {cat.items.map(item => {
                const formatted = item.format(fundamentals, extras)
                const raw = item.rawValue(fundamentals, extras)
                const color = evaluateIndicator(item.key, raw)
                const glossary = GLOSSARY[item.glossaryKey ?? item.label]

                const labelEl = (
                  <span className={cn('text-[12px] text-[var(--text-2)]', glossary && 'cursor-help border-b border-dotted border-[var(--text-3)]/20')}>
                    {item.label}
                  </span>
                )

                return (
                  <div key={item.key} className="flex items-center justify-between">
                    {glossary ? (
                      <Tooltip content={<span className="text-xs max-w-[200px] whitespace-normal">{glossary}</span>} position="right">
                        {labelEl}
                      </Tooltip>
                    ) : labelEl}
                    <span className={cn('text-[13px] font-mono font-bold', contextClass(color))}>
                      {formatted}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
