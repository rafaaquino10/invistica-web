'use client'

import { useState } from 'react'
import { Button, Tabs, TabPanel } from '@/components/ui'
import { OverviewTab } from '@/components/goals/overview-tab'
import { FIRETab } from '@/components/goals/fire-tab'
import { SimulatorTab } from '@/components/goals/simulator-tab'
import { CreateGoalModal } from '@/components/goals/create-goal-modal'

// ===========================================
// Página Principal de Metas
// ===========================================

export default function GoalsPage() {
  const [showCreateGoal, setShowCreateGoal] = useState(false)

  const goalsTabs = [
    { id: 'overview', label: 'Visão Geral' },
    { id: 'fire', label: 'Calculadora FIRE' },
    { id: 'simulator', label: 'Simulador' },
  ]

  return (
    <div className="space-y-6">
      {/* Cabeçalho da Página */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-[var(--text-title)] font-bold tracking-tight">Metas</h1>
          <p className="text-[var(--text-small)] text-[var(--text-2)] mt-0.5">
            Planeje seu caminho para a independência financeira
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={() => setShowCreateGoal(true)}>
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="mr-1.5">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Nova Meta
        </Button>
      </div>

      <Tabs tabs={goalsTabs} defaultTab="overview" urlParam="aba">
        <div className="mt-6">
          <TabPanel id="overview"><OverviewTab onCreateClick={() => setShowCreateGoal(true)} /></TabPanel>
          <TabPanel id="fire"><FIRETab /></TabPanel>
          <TabPanel id="simulator"><SimulatorTab /></TabPanel>
        </div>
      </Tabs>

      {/* Modal de Criação de Meta */}
      <CreateGoalModal isOpen={showCreateGoal} onClose={() => setShowCreateGoal(false)} />
    </div>
  )
}
