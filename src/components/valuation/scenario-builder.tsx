'use client'

import { useState, useMemo } from 'react'
import { cn } from '@/lib/utils'

interface ScenarioBuilderProps {
  currentPrice: number
  fairValueDCF: number | null
  fairValueGordon: number | null
  fairValueMult: number | null
  fairValueFinal: number | null
  safetyMargin: number | null
  impliedGrowth: number | null
  className?: string
}

function fmtR$(v: number | null) {
  if (v == null) return '-'
  return `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

/**
 * Client-side scenario simulation.
 * Adjusts fair value based on user-controlled growth/discount/margin multipliers.
 * Not a full DCF recalculation — uses proportional adjustment from base values.
 */
export function ScenarioBuilder({
  currentPrice,
  fairValueDCF,
  fairValueGordon,
  fairValueMult,
  fairValueFinal,
  safetyMargin,
  impliedGrowth,
  className,
}: ScenarioBuilderProps) {
  // Sliders: percentage adjustment from base (-50% to +50%)
  const [growthAdj, setGrowthAdj] = useState(0) // growth rate adjustment
  const [discountAdj, setDiscountAdj] = useState(0) // WACC/discount rate adjustment
  const [marginAdj, setMarginAdj] = useState(0) // margin adjustment

  const scenario = useMemo(() => {
    if (!fairValueFinal) return null

    // Growth affects DCF and Gordon more (revenue/dividend driven)
    // Discount rate inversely affects all methods
    // Margin affects DCF primarily (FCF driven)
    const growthMult = 1 + growthAdj / 100
    const discountMult = 1 - discountAdj / 100 // Higher WACC = lower value
    const marginMult = 1 + marginAdj / 100

    // Proportional adjustment per method
    const adjDCF = fairValueDCF
      ? fairValueDCF * growthMult * discountMult * marginMult
      : null
    const adjGordon = fairValueGordon
      ? fairValueGordon * growthMult * discountMult
      : null
    const adjMult = fairValueMult
      ? fairValueMult * marginMult * (1 + growthAdj / 200) // multiples less sensitive to growth
      : null

    // Weighted composite (same weights as engine: DCF 50%, Gordon 25%, Mult 25%)
    const methods = [
      { val: adjDCF, w: 0.50 },
      { val: adjGordon, w: 0.25 },
      { val: adjMult, w: 0.25 },
    ].filter(m => m.val != null) as { val: number; w: number }[]

    const totalW = methods.reduce((s, m) => s + m.w, 0)
    const adjFinal = totalW > 0
      ? methods.reduce((s, m) => s + m.val * (m.w / totalW), 0)
      : fairValueFinal

    const adjMargin = currentPrice > 0
      ? (adjFinal - currentPrice) / adjFinal
      : 0
    const upside = currentPrice > 0
      ? ((adjFinal - currentPrice) / currentPrice) * 100
      : 0

    return { adjDCF, adjGordon, adjMult, adjFinal, adjMargin, upside }
  }, [growthAdj, discountAdj, marginAdj, fairValueDCF, fairValueGordon, fairValueMult, fairValueFinal, currentPrice])

  if (!fairValueFinal || !scenario) return null

  const isAdjusted = growthAdj !== 0 || discountAdj !== 0 || marginAdj !== 0

  return (
    <div className={cn('bg-[var(--surface-1)] rounded-[var(--radius)] border border-[var(--accent-1)]/20 overflow-hidden', className)}>
      <div className="px-5 pt-4 pb-3 border-b border-[var(--border-1)]/30 bg-[var(--accent-1)]/5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-[var(--accent-1)]">Scenario Builder</h3>
            <p className="text-[var(--text-caption)] text-[var(--text-2)]">Ajuste premissas e veja o impacto no preço justo</p>
          </div>
          {isAdjusted && (
            <button
              onClick={() => { setGrowthAdj(0); setDiscountAdj(0); setMarginAdj(0) }}
              className="text-[10px] font-medium text-[var(--text-2)] hover:text-[var(--text-1)] px-2 py-1 rounded bg-[var(--surface-2)]"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* Sliders */}
        <div className="space-y-4">
          <SliderControl
            label="Crescimento (g)"
            value={growthAdj}
            onChange={setGrowthAdj}
            min={-40}
            max={40}
            unit="%"
            description={impliedGrowth != null ? `Base: ${(impliedGrowth * 100).toFixed(1)}%` : undefined}
          />
          <SliderControl
            label="Taxa de Desconto (WACC)"
            value={discountAdj}
            onChange={setDiscountAdj}
            min={-30}
            max={30}
            unit="%"
            description="Mais alto = mais conservador"
            inverted
          />
          <SliderControl
            label="Margem Operacional"
            value={marginAdj}
            onChange={setMarginAdj}
            min={-30}
            max={30}
            unit="%"
          />
        </div>

        {/* Results */}
        <div className="border-t border-[var(--border-1)]/30 pt-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <ScenarioMetric label="Preço Justo" value={fmtR$(scenario.adjFinal)} highlight changed={isAdjusted} />
            <ScenarioMetric label="DCF" value={fmtR$(scenario.adjDCF)} changed={isAdjusted} />
            <ScenarioMetric label="Gordon" value={fmtR$(scenario.adjGordon)} changed={isAdjusted} />
            <ScenarioMetric label="Múltiplos" value={fmtR$(scenario.adjMult)} changed={isAdjusted} />
          </div>

          <div className="grid grid-cols-2 gap-3 mt-3">
            <div className={cn(
              'p-3 rounded-lg text-center',
              scenario.upside >= 0 ? 'bg-[var(--pos)]/5' : 'bg-[var(--neg)]/5'
            )}>
              <p className="text-[var(--text-caption)] text-[var(--text-2)]">Upside</p>
              <p className={cn('font-mono text-lg font-bold', scenario.upside >= 0 ? 'text-[var(--pos)]' : 'text-[var(--neg)]')}>
                {scenario.upside >= 0 ? '+' : ''}{scenario.upside.toFixed(1)}%
              </p>
            </div>
            <div className={cn(
              'p-3 rounded-lg text-center',
              scenario.adjMargin > 0 ? 'bg-[var(--pos)]/5' : 'bg-[var(--neg)]/5'
            )}>
              <p className="text-[var(--text-caption)] text-[var(--text-2)]">Desconto</p>
              <p className={cn('font-mono text-lg font-bold', scenario.adjMargin > 0 ? 'text-[var(--pos)]' : 'text-[var(--neg)]')}>
                {(scenario.adjMargin * 100).toFixed(1)}%
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function SliderControl({ label, value, onChange, min, max, unit, description, inverted }: {
  label: string; value: number; onChange: (v: number) => void
  min: number; max: number; unit: string; description?: string; inverted?: boolean
}) {
  const displayValue = inverted ? -value : value
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[var(--text-caption)] font-medium text-[var(--text-2)]">{label}</span>
        <span className={cn(
          'font-mono text-sm font-bold',
          value === 0 ? 'text-[var(--text-3)]' :
          (inverted ? value < 0 : value > 0) ? 'text-[var(--pos)]' : 'text-[var(--neg)]'
        )}>
          {value > 0 ? '+' : ''}{value}%
        </span>
      </div>
      {description && <p className="text-[10px] text-[var(--text-3)] mb-1">{description}</p>}
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-[var(--accent-1)] h-1.5"
        aria-label={`${label}: ${value}${unit}`}
      />
      <div className="flex justify-between text-[10px] text-[var(--text-3)] font-mono">
        <span>{min}{unit}</span>
        <span>0</span>
        <span>+{max}{unit}</span>
      </div>
    </div>
  )
}

function ScenarioMetric({ label, value, highlight, changed }: {
  label: string; value: string; highlight?: boolean; changed?: boolean
}) {
  return (
    <div className={cn('p-2 rounded-lg text-center', highlight ? 'bg-[var(--accent-1)]/10' : 'bg-[var(--bg)]')}>
      <p className="text-[10px] text-[var(--text-3)]">{label}</p>
      <p className={cn(
        'font-mono text-sm font-bold',
        highlight ? 'text-[var(--accent-1)]' : 'text-[var(--text-1)]',
        changed && 'animate-pulse'
      )}>
        {value}
      </p>
    </div>
  )
}
