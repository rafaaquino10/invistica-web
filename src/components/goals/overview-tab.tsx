'use client'

import { Button, Skeleton } from '@/components/ui'
import { cn } from '@/lib/utils'
import { formatCurrency } from './currency-helpers'
import { ProgressBar, MainGoalCard, MilestonesCard, GoalsListCard } from './goal-card'

// ===========================================
// Aba de Visão Geral de Metas
// ===========================================

export function OverviewTab({ onCreateClick }: { onCreateClick: () => void }) {
  const { data: goals, isLoading: loadingGoals } = { data: undefined, isLoading: false }
  const { data: mainGoal, isLoading: loadingMain } = { data: undefined, isLoading: false }
  const { data: passiveIncome, isLoading: loadingIncome } = { data: undefined, isLoading: false }

  if (loadingGoals || loadingMain || loadingIncome) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-40 rounded-[var(--radius)]" />
        <div className="grid md:grid-cols-2 gap-3">
          <Skeleton className="h-28 rounded-[var(--radius)]" />
          <Skeleton className="h-28 rounded-[var(--radius)]" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Meta Principal */}
      {mainGoal ? (
        <MainGoalCard goal={mainGoal} />
      ) : (
        <div className="border border-[var(--border-1)]/20 rounded-[var(--radius)] bg-[var(--surface-1)]">
          <div className="p-5 text-center py-8">
            <h3 className="text-sm font-semibold mb-1">Defina sua meta principal</h3>
            <p className="text-xs text-[var(--text-2)] mb-4 max-w-sm mx-auto">
              Crie uma meta para acompanhar seu progresso rumo à independência financeira
            </p>
            <Button variant="primary" size="sm" onClick={onCreateClick} className="text-xs">
              Criar Meta Principal
            </Button>
          </div>
        </div>
      )}

      {/* Grade de Metas Secundárias */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Renda Passiva */}
        <div className="border border-[var(--border-1)]/20 rounded-[var(--radius)] bg-[var(--surface-1)] overflow-hidden">
          <div className="px-3 py-2 border-b border-[var(--border-1)]">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-2)]">Renda Passiva</span>
          </div>
          <div className="p-3">
            {passiveIncome?.goal ? (
              <div>
                <div className="flex items-baseline justify-between mb-2">
                  <p className={cn('text-2xl font-bold font-mono', passiveIncome.progress >= 100 ? 'text-[var(--pos)]' : passiveIncome.progress >= 50 ? 'text-[var(--accent-1)]' : 'text-[var(--text-1)]')}>{passiveIncome.progress.toFixed(0)}%</p>
                  <p className="text-sm font-bold font-mono">
                    {formatCurrency(passiveIncome.targetMonthlyIncome, { compact: true })}<span className="text-[var(--text-caption)] font-normal text-[var(--text-2)]">/mes</span>
                  </p>
                </div>
                <ProgressBar progress={passiveIncome.progress} className="mb-2" />
                <p className="text-[var(--text-caption)] text-[var(--text-2)] font-sans">
                  Atual: <span className="font-mono">{formatCurrency(passiveIncome.currentMonthlyIncome, { showCents: true })}</span>/mes
                </p>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-xs text-[var(--text-2)] mb-2">
                  Defina uma meta de renda passiva mensal
                </p>
                <Button size="sm" variant="secondary" onClick={onCreateClick} className="text-xs">
                  Criar Meta
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Meta FIRE */}
        <div className="border border-[var(--border-1)]/20 rounded-[var(--radius)] bg-[var(--surface-1)] overflow-hidden">
          <div className="px-3 py-2 border-b border-[var(--border-1)]">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-2)]">Independência Financeira</span>
          </div>
          <div className="p-3">
            {goals?.find((g) => g.type === 'fire') ? (
              (() => {
                const fireGoal = goals.find((g) => g.type === 'fire')! as any
                const yearsRemaining = fireGoal.targetDate
                  ? Math.max(0, Math.ceil((new Date(fireGoal.targetDate).getTime() - Date.now()) / (365.25 * 24 * 60 * 60 * 1000)))
                  : null
                return (
                  <div>
                    <div className="flex items-baseline justify-between mb-2">
                      <p className={cn('text-2xl font-bold font-mono', fireGoal.progress >= 100 ? 'text-[var(--pos)]' : fireGoal.progress >= 50 ? 'text-[var(--accent-1)]' : 'text-[var(--text-1)]')}>{fireGoal.progress.toFixed(0)}%</p>
                      <p className="text-sm font-mono text-[var(--text-2)]">
                        {yearsRemaining !== null ? yearsRemaining : '?'} <span className="text-[var(--text-caption)]">anos</span>
                      </p>
                    </div>
                    <ProgressBar progress={fireGoal.progress} className="mb-2" />
                    <p className="text-[var(--text-caption)] text-[var(--text-2)] font-sans">
                      Meta: <span className="font-mono">{formatCurrency(fireGoal.targetAmount, { compact: true })}</span>
                    </p>
                  </div>
                )
              })()
            ) : (
              <div className="text-center py-4">
                <p className="text-xs text-[var(--text-2)] mb-2">
                  Calcule quando você pode atingir a independência financeira
                </p>
                <Button
                  size="sm"
                  variant="secondary"
                  className="text-xs"
                  onClick={() => {
                    const params = new URLSearchParams(window.location.search)
                    params.set('aba', 'fire')
                    window.history.replaceState({}, '', `?${params.toString()}`)
                    window.dispatchEvent(new PopStateEvent('popstate'))
                  }}
                >
                  Calcular FIRE
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Marcos */}
      {mainGoal && mainGoal.milestones.length > 0 && (
        <MilestonesCard milestones={mainGoal.milestones} currentAmount={mainGoal.currentAmount} />
      )}

      {/* Lista de Todas as Metas */}
      {goals && goals.length > 0 && <GoalsListCard goals={goals} />}
    </div>
  )
}
