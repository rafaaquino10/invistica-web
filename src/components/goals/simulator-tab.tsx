'use client'

import { useState } from 'react'
import { Button } from '@/components/ui'
import { trpc } from '@/lib/trpc/client'
import { PaywallGate } from '@/components/billing'
import { cn } from '@/lib/utils'
import { parseCurrencyInput, formatCurrency } from './currency-helpers'
import { CurrencyInput, SliderInput } from './input-components'

// ===========================================
// Aba do Simulador de Investimentos
// ===========================================

export function SimulatorTab() {
  const [formData, setFormData] = useState({
    initialAmount: '100000',
    monthlyContribution: '2000',
    targetAmount: '1000000',
    annualReturn: 8,
    years: 20,
  })

  const [simulationInput, setSimulationInput] = useState<any>(null)

  const { data: simulation, isFetching } = trpc.goals.simulate.useQuery(simulationInput!, {
    enabled: !!simulationInput,
  })

  const handleSimulate = () => {
    setSimulationInput({
      initialAmount: parseFloat(parseCurrencyInput(formData.initialAmount)) || 0,
      monthlyContribution: parseFloat(parseCurrencyInput(formData.monthlyContribution)) || 0,
      targetAmount: parseFloat(parseCurrencyInput(formData.targetAmount)) || 1000000,
      annualReturn: formData.annualReturn / 100,
      years: formData.years,
    })
  }

  return (
    <PaywallGate requiredPlan="pro" feature="Simulador de Investimentos" showPreview>
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Formulário */}
        <div className="border border-[var(--border-1)]/20 rounded-[var(--radius)] bg-[var(--surface-1)] overflow-hidden">
          <div className="px-3 py-2 border-b border-[var(--border-1)]">
            <span className="text-sm font-semibold">Parâmetros</span>
          </div>
          <div className="p-3 space-y-3">
            <CurrencyInput
              label="Valor Inicial"
              value={formData.initialAmount}
              onChange={(value) => setFormData({ ...formData, initialAmount: value })}
            />
            <CurrencyInput
              label="Aporte Mensal"
              value={formData.monthlyContribution}
              onChange={(value) => setFormData({ ...formData, monthlyContribution: value })}
            />
            <CurrencyInput
              label="Meta"
              value={formData.targetAmount}
              onChange={(value) => setFormData({ ...formData, targetAmount: value })}
            />
            <SliderInput
              label="Rentabilidade Anual"
              value={formData.annualReturn}
              onChange={(value) => setFormData({ ...formData, annualReturn: value })}
              min={1} max={20} step={0.5} suffix="% a.a."
            />
            <SliderInput
              label="Período"
              value={formData.years}
              onChange={(value) => setFormData({ ...formData, years: value })}
              min={1} max={50} step={1} suffix=" anos"
            />
            <Button variant="primary" onClick={handleSimulate} className="w-full text-xs" size="sm" disabled={isFetching}>
              {isFetching ? 'Simulando...' : 'Simular'}
            </Button>
          </div>
        </div>

        {/* Resultados */}
        <div className="lg:col-span-2 space-y-4">
          {simulation ? (
            <>
              {/* Resumo */}
              <div className="border border-[var(--border-1)]/20 rounded-[var(--radius)] bg-[var(--surface-1)] overflow-hidden">
                <div className="px-3 py-2 border-b border-[var(--border-1)]">
                  <span className="text-sm font-semibold">Resultado da Simulação</span>
                </div>
                <div className="p-3">
                  <div className="grid grid-cols-3 gap-2">
                    <div className="text-center p-2.5 rounded-lg bg-[var(--surface-2)]">
                      <p className="text-xs text-[var(--text-2)]">Valor Final</p>
                      <p className="text-sm font-bold font-mono">
                        {formatCurrency(simulation.finalValue ?? 0, { compact: true })}
                      </p>
                    </div>
                    <div className="text-center p-2.5 rounded-lg bg-[var(--surface-2)]">
                      <p className="text-xs text-[var(--text-2)]">Total Aportado</p>
                      <p className="text-sm font-bold font-mono">
                        {formatCurrency(simulation.totalContributions ?? 0, { compact: true })}
                      </p>
                    </div>
                    <div className="text-center p-2.5 rounded-lg bg-[var(--surface-2)]">
                      <p className="text-xs text-[var(--text-2)]">Ganho com Juros</p>
                      <p className="text-sm font-bold font-mono">
                        {formatCurrency(simulation.totalReturns ?? 0, { compact: true })}
                      </p>
                    </div>
                  </div>
                  {simulation.base.targetReached && (
                    <div className="mt-2 p-2 rounded-lg bg-[var(--surface-2)] text-center">
                      <p className="text-sm font-medium text-[var(--text-1)]">
                        Meta atingida no ano {simulation.base.yearTargetReached}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Cenários */}
              <div className="border border-[var(--border-1)]/20 rounded-[var(--radius)] bg-[var(--surface-1)] overflow-hidden">
                <div className="px-3 py-2 border-b border-[var(--border-1)]">
                  <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-3)]">Cenários</span>
                </div>
                <div className="divide-y divide-[var(--border-1)]">
                  {simulation.scenarios.map((scenario) => (
                    <div key={scenario.name} className="flex items-center justify-between px-3 py-2 hover:bg-[var(--surface-2)] transition-colors">
                      <div>
                        <p className="text-sm font-medium">{scenario.name}</p>
                        <p className="text-xs text-[var(--text-2)]">
                          {(scenario.annualReturn * 100).toFixed(0)}% ao ano
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold font-mono">
                          {formatCurrency(scenario.result.values[scenario.result.values.length - 1] ?? 0, { compact: true })}
                        </p>
                        {scenario.result.targetReached && (
                          <span className="text-xs text-[var(--text-2)]">
                            Meta no ano {scenario.result.yearTargetReached}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tabela de Projeção */}
              <div className="border border-[var(--border-1)]/20 rounded-[var(--radius)] bg-[var(--surface-1)] overflow-hidden">
                <div className="px-3 py-2 border-b border-[var(--border-1)]">
                  <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-3)]">Projeção Anual</span>
                </div>
                <div className="overflow-x-auto max-h-64">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-[var(--surface-1)]">
                      <tr className="border-b border-[var(--border-1)]">
                        <th className="text-left px-3 py-1.5 text-xs font-medium uppercase tracking-wider text-[var(--text-3)]">Ano</th>
                        <th className="text-right px-3 py-1.5 text-xs font-medium uppercase tracking-wider text-[var(--text-3)]">Patrimônio</th>
                        <th className="text-right px-3 py-1.5 text-xs font-medium uppercase tracking-wider text-[var(--text-3)]">Aportado</th>
                        <th className="text-right px-3 py-1.5 text-xs font-medium uppercase tracking-wider text-[var(--text-3)]">Rendimentos</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-1)]">
                      {simulation.base.years.map((year, index) => (
                        <tr key={year} className={cn(
                          'hover:bg-[var(--surface-2)] transition-colors',
                          simulation.base.yearTargetReached === year && 'bg-[var(--surface-2)]'
                        )}>
                          <td className="px-3 py-1.5">{year}</td>
                          <td className="px-3 py-1.5 text-right font-mono">
                            {formatCurrency(simulation.base.values[index] ?? 0, { compact: true })}
                          </td>
                          <td className="px-3 py-1.5 text-right font-mono text-[var(--text-2)]">
                            {formatCurrency(simulation.base.contributions[index] ?? 0, { compact: true })}
                          </td>
                          <td className="px-3 py-1.5 text-right font-mono text-[var(--accent-1)]">
                            {formatCurrency(simulation.base.returns[index] ?? 0, { compact: true })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="border border-[var(--border-1)]/20 rounded-[var(--radius)] bg-[var(--surface-1)]">
              <div className="flex flex-col items-center justify-center py-10 text-center px-4">
                <h4 className="text-sm font-semibold mb-1">Simule cenários</h4>
                <p className="text-xs text-[var(--text-2)]">
                  Ajuste os parâmetros ao lado e veja como seu patrimônio pode evoluir
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </PaywallGate>
  )
}
