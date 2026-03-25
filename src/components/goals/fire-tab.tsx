'use client'

import { useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui'
import { PaywallGate } from '@/components/billing'
import { parseCurrencyInput, formatCurrency } from './currency-helpers'
import { CurrencyInput, SliderInput } from './input-components'
import { ProjectionChart } from './projection-chart'
import { MonteCarloChart } from './monte-carlo-chart'
import { MonteCarloStats } from './monte-carlo-stats'
import { runMonteCarlo } from '@/lib/simulation/monte-carlo'

// ===========================================
// Aba da Calculadora FIRE (Reativa)
// ===========================================

export function FIRETab() {
  const [formData, setFormData] = useState({
    currentAmount: '',
    monthlyExpenses: '',
    monthlyContribution: '',
    annualReturn: 8,
    safeWithdrawalRate: 4,
  })

  // Entradas com debounce para cálculo reativo
  const [debouncedInputs, setDebouncedInputs] = useState<any>(null)
  const [fireSuccess, setFireSuccess] = useState(false)

  // Recalcula automaticamente 400ms após qualquer mudança nos inputs
  useEffect(() => {
    const expenses = parseFloat(parseCurrencyInput(formData.monthlyExpenses)) || 0

    // Não dispara cálculo sem despesas mensais
    if (expenses <= 0) {
      setDebouncedInputs(null)
      return
    }

    const id = setTimeout(() => {
      const current = parseFloat(parseCurrencyInput(formData.currentAmount)) || 0
      const contribution = parseFloat(parseCurrencyInput(formData.monthlyContribution)) || 0

      setDebouncedInputs({
        currentAmount: current,
        monthlyExpenses: expenses,
        monthlyContribution: contribution,
        annualReturn: formData.annualReturn / 100,
        safeWithdrawalRate: formData.safeWithdrawalRate / 100,
      })
    }, 400)

    return () => clearTimeout(id)
  }, [formData])

  // FIRE calculator — client-side (sem backend)
  const fireResult = useMemo(() => {
    if (!debouncedInputs) return undefined
    const { monthlyExpenses, monthlyContribution, annualReturn, safeWithdrawalRate } = debouncedInputs
    if (!monthlyExpenses || !monthlyContribution || !annualReturn || !safeWithdrawalRate) return undefined

    const fireNumber = (monthlyExpenses * 12) / (safeWithdrawalRate / 100)
    const monthlyRate = annualReturn / 100 / 12
    let accumulated = 0
    let months = 0
    const maxMonths = 50 * 12

    while (accumulated < fireNumber && months < maxMonths) {
      accumulated = accumulated * (1 + monthlyRate) + monthlyContribution
      months++
    }

    const years = Math.floor(months / 12)
    const remainingMonths = months % 12

    return {
      fireNumber,
      monthsToFire: months,
      yearsToFire: years,
      remainingMonths,
      totalContributed: monthlyContribution * months,
      totalReturns: accumulated - (monthlyContribution * months),
      finalValue: accumulated,
      monthlyPassiveIncome: accumulated * (safeWithdrawalRate / 100) / 12,
    }
  }, [debouncedInputs])
  const isFetching = false

  const createFIREGoal = { mutate: () => {}, mutateAsync: async () => undefined, isLoading: false, isPending: false }

  const handleCreateGoal = () => {
    if (!debouncedInputs) return
    createFIREGoal.mutate({
      monthlyExpenses: debouncedInputs.monthlyExpenses,
      monthlyContribution: debouncedInputs.monthlyContribution,
      annualReturn: debouncedInputs.annualReturn,
      safeWithdrawalRate: debouncedInputs.safeWithdrawalRate,
    })
  }

  return (
    <PaywallGate requiredPlan="pro" feature="Calculadora FIRE" showPreview>
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Formulário da Calculadora */}
        <div className="border border-[var(--border-1)]/20 rounded-[var(--radius)] bg-[var(--surface-1)] overflow-hidden">
          <div className="px-3 py-2 border-b border-[var(--border-1)]">
            <span className="text-sm font-semibold">Calculadora FIRE</span>
            <p className="text-xs text-[var(--text-2)]">Financial Independence, Retire Early</p>
          </div>
          <div className="p-3 space-y-3">
            <CurrencyInput
              label="Patrimônio Atual"
              placeholder="R$ 100.000"
              value={formData.currentAmount}
              onChange={(value) => setFormData({ ...formData, currentAmount: value })}
            />
            <CurrencyInput
              label="Despesas Mensais"
              placeholder="R$ 5.000"
              value={formData.monthlyExpenses}
              onChange={(value) => setFormData({ ...formData, monthlyExpenses: value })}
              required
            />
            <CurrencyInput
              label="Aporte Mensal"
              placeholder="R$ 2.000"
              value={formData.monthlyContribution}
              onChange={(value) => setFormData({ ...formData, monthlyContribution: value })}
            />
            <SliderInput
              label="Rentabilidade Anual"
              value={formData.annualReturn}
              onChange={(value) => setFormData({ ...formData, annualReturn: value })}
              min={1} max={20} step={0.5} suffix="% a.a."
            />
            <SliderInput
              label="Taxa de Retirada Segura"
              value={formData.safeWithdrawalRate}
              onChange={(value) => setFormData({ ...formData, safeWithdrawalRate: value })}
              min={2} max={6} step={0.5} suffix="%"
            />
            {isFetching && (
              <p className="text-xs text-[var(--text-2)] text-center animate-pulse">Calculando...</p>
            )}
          </div>
        </div>

        {/* Resultados */}
        <div className="border border-[var(--border-1)]/20 rounded-[var(--radius)] bg-[var(--surface-1)] overflow-hidden">
          <div className="px-3 py-2 border-b border-[var(--border-1)]">
            <span className="text-sm font-semibold">Resultado</span>
          </div>
          <div className="p-3">
            {fireResult ? (
              <div className="space-y-3">
                {/* Número FIRE */}
                <div className="text-center py-3 px-4 rounded-lg bg-[var(--surface-2)]">
                  <p className="text-xs text-[var(--text-2)] uppercase tracking-wider mb-0.5">Número FIRE</p>
                  <p className="text-xl font-bold font-mono">
                    {formatCurrency(fireResult.fireNumber)}
                  </p>
                  <p className="text-xs text-[var(--text-2)] mt-1">
                    Patrimônio necessário para viver de renda
                  </p>
                </div>

                {/* Progresso */}
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-[var(--text-2)]">Progresso</span>
                    <span className="font-mono font-medium">{fireResult.currentProgress.toFixed(1)}%</span>
                  </div>
                  <div className="h-1.5 bg-[var(--surface-2)] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[var(--accent-1)] rounded-full transition-all duration-1000"
                      style={{ width: `${Math.min(fireResult.currentProgress, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Estatísticas */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-center p-2.5 rounded-lg bg-[var(--surface-2)]">
                    <p className="text-lg font-bold font-mono">
                      {fireResult.yearsToFire < 100 ? fireResult.yearsToFire : '100+'}
                    </p>
                    <p className="text-xs text-[var(--text-2)]">anos para FIRE</p>
                  </div>
                  <div className="text-center p-2.5 rounded-lg bg-[var(--surface-2)]">
                    <p className="text-lg font-bold font-mono">
                      {fireResult.projectedDate.getFullYear()}
                    </p>
                    <p className="text-xs text-[var(--text-2)]">ano projetado</p>
                  </div>
                </div>

                {/* Aporte Necessário */}
                <div className="p-2.5 rounded-lg bg-[var(--surface-2)]">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Aporte para FIRE em 20 anos</p>
                      <p className="text-xs text-[var(--text-2)]">Considerando a rentabilidade informada</p>
                    </div>
                    <p className="text-sm font-bold font-mono">
                      {formatCurrency(fireResult.monthlyContributionNeeded, { compact: true })}/mês
                    </p>
                  </div>
                </div>

                {/* Gráfico de projeção FIRE */}
                <ProjectionChart
                  initialAmount={debouncedInputs.currentAmount}
                  monthlyContribution={debouncedInputs.monthlyContribution}
                  annualReturn={debouncedInputs.annualReturn}
                  targetAmount={fireResult.fireNumber}
                  years={Math.min(Math.ceil(fireResult.yearsToFire * 1.3), 50)}
                />

                {/* Simulação Monte Carlo (Elite) */}
                <MonteCarloSection
                  currentAmount={debouncedInputs.currentAmount}
                  monthlyContribution={debouncedInputs.monthlyContribution}
                  annualReturn={debouncedInputs.annualReturn}
                  years={Math.min(Math.ceil(fireResult.yearsToFire * 1.3), 50)}
                  targetValue={fireResult.fireNumber}
                />

                <Button variant="secondary" onClick={handleCreateGoal} className="w-full text-xs" size="sm" disabled={createFIREGoal.isPending}>
                  {createFIREGoal.isPending ? 'Salvando...' : 'Salvar como Meta'}
                </Button>
                {fireSuccess && <p className="text-xs text-[var(--text-2)] text-center">Meta FIRE criada.</p>}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <h4 className="text-sm font-semibold mb-1">Calcule sua independência</h4>
                <p className="text-xs text-[var(--text-2)]">
                  Preencha os dados ao lado para descobrir quando alcançar a liberdade financeira
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </PaywallGate>
  )
}

// ===========================================
// Seção Monte Carlo (Elite)
// ===========================================

function MonteCarloSection({
  currentAmount,
  monthlyContribution,
  annualReturn,
  years,
  targetValue,
}: {
  currentAmount: number
  monthlyContribution: number
  annualReturn: number
  years: number
  targetValue: number
}) {
  // Calcular Monte Carlo client-side (sem rota tRPC — prompt diz "cálculo client-side")
  const mcResult = useMemo(() => {
    if (currentAmount <= 0 && monthlyContribution <= 0) return null
    const cappedYears = Math.min(years, 50)

    // Volatilidade estimada baseada no retorno anual
    // Retorno mais alto → mais risco
    const volatility = Math.max(0.10, annualReturn * 1.5)

    return runMonteCarlo({
      initialValue: currentAmount,
      monthlyContribution,
      positions: [
        { ticker: 'PORTFOLIO', weight: 1.0, expectedReturn: annualReturn, volatility },
      ],
      years: cappedYears,
      simulations: 1000,
    })
  }, [currentAmount, monthlyContribution, annualReturn, years])

  if (!mcResult) return null

  return (
    <PaywallGate requiredPlan="elite" feature="Simulação Monte Carlo" showPreview>
      <div className="space-y-3">
        <MonteCarloChart
          result={mcResult}
          years={Math.min(years, 50)}
          initialValue={currentAmount}
          targetValue={targetValue}
        />
        <MonteCarloStats
          result={mcResult}
          targetValue={targetValue}
        />
      </div>
    </PaywallGate>
  )
}
