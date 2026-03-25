'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui'
import { cn } from '@/lib/utils'

function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

const AMOUNT_OPTIONS = [50_000, 100_000, 250_000, 500_000, 1_000_000]

export function IncomeSimulatorCard() {
  const [amount, setAmount] = useState(100_000)

  // Simulação client-side
  const avgYield = 7.5 // yield médio carteira dividendos (%)
  const selicRate = 14.25
  const savingsRate = 7.0
  const monthlyIncome = (amount * avgYield / 100) / 12
  const cdiMonthly = (amount * selicRate / 100 * 0.85) / 12 // IR 15%
  const savingsMonthly = (amount * savingsRate / 100) / 12

  const simulation = {
    monthlyIncome,
    portfolioAvgYield: avgYield,
    comparisons: { cdi: cdiMonthly, savings: savingsMonthly, selicRate },
  }
  const isLoading = false

  return (
    <Card>
      <CardContent className="p-5">
        <h3 className="text-sm font-semibold text-[var(--text-1)] mb-1">
          Simulador de Renda Passiva
        </h3>
        <p className="text-xs text-[var(--text-3)] mb-4">
          Projeção baseada no DY dos últimos 12 meses das ações qualificadas
        </p>

        {/* Amount Selector */}
        <div className="mb-5">
          <label className="text-xs text-[var(--text-2)] mb-2 block">Investimento:</label>
          <div className="flex flex-wrap gap-2">
            {AMOUNT_OPTIONS.map(opt => (
              <button
                key={opt}
                onClick={() => setAmount(opt)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                  amount === opt
                    ? 'bg-[var(--accent-1)] text-white'
                    : 'bg-[var(--surface-2)] text-[var(--text-2)] hover:bg-[var(--surface-2)]/80',
                )}
              >
                {formatBRL(opt)}
              </button>
            ))}
          </div>
        </div>

        {isLoading || !simulation ? (
          <div className="h-32 animate-pulse bg-[var(--surface-2)] rounded-lg" />
        ) : (
          <>
            {/* Main Result */}
            <div className="bg-[var(--surface-2)]/50 rounded-lg p-4 mb-4">
              <div className="text-center">
                <p className="text-xs text-[var(--text-3)] mb-1">Renda mensal estimada</p>
                <p className="text-2xl font-bold text-green-500">
                  {formatBRL(simulation.monthlyIncome)}
                  <span className="text-sm font-normal text-[var(--text-3)]">/mês</span>
                </p>
                <p className="text-xs text-[var(--text-2)] mt-1">
                  Yield médio: {simulation.portfolioAvgYield.toFixed(1)}% a.a.
                </p>
              </div>
            </div>

            {/* Comparison Bars */}
            <div className="space-y-2.5 mb-4">
              <ComparisonBar
                label="Esta carteira"
                value={simulation.monthlyIncome}
                maxValue={Math.max(simulation.monthlyIncome, simulation.comparisons.cdi, simulation.comparisons.savings)}
                color="bg-green-500"
              />
              <ComparisonBar
                label="Poupança (~7% a.a.)"
                value={simulation.comparisons.savings}
                maxValue={Math.max(simulation.monthlyIncome, simulation.comparisons.cdi, simulation.comparisons.savings)}
                color="bg-[var(--text-3)]"
              />
              <ComparisonBar
                label={`CDI (SELIC ${simulation.comparisons.selicRate.toFixed(1)}%)`}
                value={simulation.comparisons.cdi}
                maxValue={Math.max(simulation.monthlyIncome, simulation.comparisons.cdi, simulation.comparisons.savings)}
                color="bg-[var(--accent-1)]"
                note="CDI tem IR; dividendos são isentos*"
              />
            </div>

            {/* Disclaimer */}
            <p className="text-[10px] text-[var(--text-3)] leading-relaxed">
              * Para pessoa física com ações em bolsa. Dividendos não são garantidos. Projeção baseada no DY
              dos últimos 12 meses. Rendimentos passados não garantem resultados futuros.
            </p>
          </>
        )}
      </CardContent>
    </Card>
  )
}

function ComparisonBar({
  label,
  value,
  maxValue,
  color,
  note,
}: {
  label: string
  value: number
  maxValue: number
  color: string
  note?: string
}) {
  const pct = maxValue > 0 ? (value / maxValue) * 100 : 0

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-[var(--text-2)]">{label}</span>
        <span className="text-xs font-mono font-medium text-[var(--text-1)]">
          {formatBRL(value)}/mês
        </span>
      </div>
      <div className="h-2 rounded-full bg-[var(--surface-2)] overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-500', color)}
          style={{ width: `${Math.max(pct, 2)}%` }}
        />
      </div>
      {note && (
        <p className="text-[10px] text-[var(--text-3)] mt-0.5">{note}</p>
      )}
    </div>
  )
}
