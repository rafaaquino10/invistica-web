'use client'

import { cn } from '@/lib/utils'
import { formatCurrency } from './currency-helpers'

// ===========================================
// Barra de Progresso (fina, institucional)
// ===========================================

export function ProgressBar({ progress, className }: { progress: number; className?: string }) {
  return (
    <div className={cn('h-1 bg-[var(--surface-2)] rounded-full w-full overflow-hidden', className)}>
      <div
        className="h-full bg-[var(--accent-1)] rounded-full transition-all duration-700"
        style={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }}
      />
    </div>
  )
}

// ===========================================
// Card de Meta Principal
// ===========================================

export function MainGoalCard({ goal }: { goal: any }) {
  const progressColor = goal.progress >= 75 ? 'text-[var(--pos)]' : goal.progress >= 50 ? 'text-[var(--accent-1)]' : 'text-[var(--text-1)]'

  return (
    <div className="border border-[var(--border-1)]/20 rounded-[var(--radius)] bg-[var(--surface-1)] overflow-hidden">
      <div className="px-3 py-2 border-b border-[var(--border-1)]">
        <span className="text-[var(--text-caption)] font-semibold uppercase tracking-wider text-[var(--text-2)]">Meta Principal</span>
      </div>
      <div className="p-5">
        <div className="flex items-baseline justify-between mb-1">
          <p className={cn('text-3xl font-bold font-mono', progressColor)}>{goal.progress.toFixed(0)}%</p>
          <p className="text-lg font-bold font-mono">{formatCurrency(goal.targetAmount)}</p>
        </div>
        <p className="text-[var(--text-small)] text-[var(--text-2)] mb-3 font-sans">{goal.name}</p>

        {/* Barra de Progresso */}
        <div className="mb-4">
          <ProgressBar progress={goal.progress} className="h-1.5" />
          <div className="flex justify-between text-[var(--text-caption)] text-[var(--text-2)] mt-1">
            <span className="font-mono">{formatCurrency(goal.currentAmount)}</span>
            <span className="font-mono">{formatCurrency(goal.targetAmount)}</span>
          </div>
        </div>

        {/* Linha de estatísticas */}
        <div className="flex gap-6">
          <div>
            <p className="text-sm font-bold font-mono">{goal.yearsToTarget ?? '-'}</p>
            <p className="text-[var(--text-caption)] text-[var(--text-2)] font-sans">anos restantes</p>
          </div>
          <div>
            <p className="text-sm font-bold font-mono">
              {goal.monthlyContribution ? formatCurrency(goal.monthlyContribution, { compact: true }) : '-'}
            </p>
            <p className="text-[var(--text-caption)] text-[var(--text-2)] font-sans">aporte/mes</p>
          </div>
          <div>
            <p className="text-sm font-bold font-mono">
              {goal.expectedReturn ? (goal.expectedReturn * 100).toFixed(0) : '-'}%
            </p>
            <p className="text-[var(--text-caption)] text-[var(--text-2)] font-sans">rentab. a.a.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ===========================================
// Card de Marcos
// ===========================================

export function MilestonesCard({ milestones, currentAmount }: { milestones: any[]; currentAmount: number }) {
  return (
    <div className="border border-[var(--border-1)]/20 rounded-[var(--radius)] bg-[var(--surface-1)] overflow-hidden">
      <div className="px-3 py-2 border-b border-[var(--border-1)]">
        <span className="text-[var(--text-caption)] font-semibold uppercase tracking-wider text-[var(--text-3)]">Marcos</span>
      </div>
      <div className="p-3">
        <div className="relative">
          <div className="absolute left-3 top-1 bottom-1 w-px bg-[var(--border-1)]" />
          <div className="space-y-2">
            {milestones.map((milestone) => (
              <div key={milestone.id} className="flex gap-3 items-center relative">
                <div className={cn(
                  'w-6 h-6 rounded-full flex items-center justify-center z-10 flex-shrink-0',
                  milestone.isCompleted
                    ? 'bg-[var(--pos)]/15 border border-[var(--pos)]/40 text-[var(--pos)]'
                    : 'bg-[var(--surface-2)] border border-[var(--border-1)] text-[var(--text-3)]'
                )}>
                  {milestone.isCompleted ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
                    <span className="text-[10px] font-mono font-bold">
                      {Math.round((milestone.targetAmount / milestones[milestones.length - 1].targetAmount) * 100)}%
                    </span>
                  )}
                </div>
                <div className="flex-1 flex items-center justify-between py-1">
                  <div>
                    <p className={cn(
                      'text-sm font-sans font-medium',
                      milestone.isCompleted ? 'text-[var(--text-1)]' : 'text-[var(--text-2)]'
                    )}>
                      {milestone.title}
                    </p>
                    {milestone.isCompleted && milestone.completedAt && (
                      <p className="text-[var(--text-caption)] text-[var(--text-2)]">
                        Alcancado em <span className="font-mono">{new Date(milestone.completedAt).toLocaleDateString('pt-BR')}</span>
                      </p>
                    )}
                  </div>
                  <span className="font-mono text-sm text-[var(--text-2)]">
                    {formatCurrency(milestone.targetAmount, { compact: true })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ===========================================
// Card de Lista de Metas
// ===========================================

export function GoalsListCard({ goals }: { goals: any[] }) {
  const nonMainGoals = goals.filter((g) => !g.isMain)
  if (nonMainGoals.length === 0) return null

  return (
    <div className="border border-[var(--border-1)]/20 rounded-[var(--radius)] bg-[var(--surface-1)] overflow-hidden">
      <div className="px-3 py-2 border-b border-[var(--border-1)]">
        <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-3)]">Todas as Metas</span>
      </div>
      <div className="divide-y divide-[var(--border-1)]">
        {nonMainGoals.map((goal) => (
          <div key={goal.id} className="flex items-center gap-3 px-3 py-2 hover:bg-[var(--surface-2)] transition-colors">
            <span className={cn('text-xs font-bold font-mono w-10 text-right tabular-nums', goal.progress >= 100 ? 'text-[var(--pos)]' : goal.progress >= 50 ? 'text-[var(--accent-1)]' : 'text-[var(--text-1)]')}>{goal.progress.toFixed(0)}%</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-sans font-medium truncate">{goal.name}</p>
              <p className="text-[var(--text-caption)] text-[var(--text-2)]">
                <span className="font-mono">{formatCurrency(goal.currentAmount, { compact: true })}</span>
                {' de '}
                <span className="font-mono">{formatCurrency(goal.targetAmount, { compact: true })}</span>
              </p>
            </div>
            <span className="text-xs text-[var(--text-2)] font-mono">
              {goal.type === 'fire' ? 'FIRE' : goal.type === 'passive_income' ? 'Renda' : 'Meta'}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
