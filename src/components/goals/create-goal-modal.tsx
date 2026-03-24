'use client'

import { useState } from 'react'
import { Button, Modal, Input } from '@/components/ui'
import { cn } from '@/lib/utils'
import { parseCurrencyInput } from './currency-helpers'
import { CurrencyInput, SliderInput } from './input-components'

// ===========================================
// Modal de Criação de Meta
// ===========================================

export function CreateGoalModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [formData, setFormData] = useState({
    type: 'patrimony' as 'patrimony' | 'passive_income' | 'fire' | 'custom',
    name: '',
    targetAmount: '',
    monthlyContribution: '',
    expectedReturn: 8,
    isMain: false,
  })

  const createGoal = { mutate: () => {}, mutateAsync: async () => undefined, isLoading: false, isPending: false }

  const [formError, setFormError] = useState<string | null>(null)

  const resetForm = () => {
    setFormData({
      type: 'patrimony',
      name: '',
      targetAmount: '',
      monthlyContribution: '',
      expectedReturn: 8,
      isMain: false,
    })
    setFormError(null)
  }

  const handleSubmit = () => {
    if (!formData.name || !formData.targetAmount) {
      setFormError('Preencha o nome e o valor da meta')
      return
    }
    setFormError(null)

    createGoal.mutate({
      type: formData.type,
      name: formData.name,
      targetAmount: parseFloat(parseCurrencyInput(formData.targetAmount)) || 0,
      monthlyContribution: formData.monthlyContribution
        ? parseFloat(parseCurrencyInput(formData.monthlyContribution))
        : undefined,
      expectedReturn: formData.expectedReturn / 100,
      isMain: formData.isMain,
    })
  }

  const goalTypes = [
    { value: 'patrimony', label: 'Patrimônio', description: 'Acumular valor' },
    { value: 'passive_income', label: 'Renda Passiva', description: 'Dividendos mensais' },
    { value: 'custom', label: 'Personalizada', description: 'Meta flexível' },
  ]

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nova Meta">
      <div className="space-y-3">
        {/* Seletor de Tipo de Meta */}
        <div>
          <label className="block text-xs font-medium text-[var(--text-2)] uppercase tracking-wider mb-1">Tipo de Meta</label>
          <div className="grid grid-cols-3 gap-2">
            {goalTypes.map((type) => (
              <button
                key={type.value}
                onClick={() => setFormData({ ...formData, type: type.value as any })}
                className={cn(
                  'p-2 rounded-lg border text-center transition-all',
                  formData.type === type.value
                    ? 'border-[var(--accent-1)] bg-[var(--accent-1)]/5'
                    : 'border-[var(--border-1)] hover:border-[var(--text-2)]'
                )}
              >
                <p className="text-sm font-medium">{type.label}</p>
                <p className="text-xs text-[var(--text-2)]">{type.description}</p>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-[var(--text-2)] uppercase tracking-wider mb-1">Nome da Meta</label>
          <Input
            placeholder="Ex: R$ 1 milhão até 2030"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="h-8 text-sm"
          />
        </div>

        <CurrencyInput
          label="Valor Alvo"
          value={formData.targetAmount}
          onChange={(value) => setFormData({ ...formData, targetAmount: value })}
          placeholder="R$ 1.000.000"
          required
        />

        <CurrencyInput
          label="Aporte Mensal (opcional)"
          value={formData.monthlyContribution}
          onChange={(value) => setFormData({ ...formData, monthlyContribution: value })}
          placeholder="R$ 2.000"
        />

        <SliderInput
          label="Rentabilidade Esperada"
          value={formData.expectedReturn}
          onChange={(value) => setFormData({ ...formData, expectedReturn: value })}
          min={1} max={20} step={0.5} suffix="% a.a."
        />

        <label className="flex items-center gap-2 p-2 rounded-lg bg-[var(--surface-2)] cursor-pointer">
          <input
            type="checkbox"
            checked={formData.isMain}
            onChange={(e) => setFormData({ ...formData, isMain: e.target.checked })}
            className="w-4 h-4 rounded border-[var(--border-1)] text-[var(--accent-1)] focus:ring-[var(--accent-1)]"
          />
          <div>
            <span className="text-sm font-medium">Definir como meta principal</span>
            <p className="text-xs text-[var(--text-2)]">Aparecerá em destaque no topo</p>
          </div>
        </label>

        {formError && <p className="text-xs text-red text-center">{formError}</p>}

        <div className="flex gap-2 pt-1">
          <Button variant="secondary" onClick={onClose} className="flex-1 text-xs" size="sm">
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={createGoal.isPending} className="flex-1 text-xs" size="sm">
            {createGoal.isPending ? 'Criando...' : 'Criar Meta'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
