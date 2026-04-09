'use client'

import { useState, lazy, Suspense } from 'react'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui'
import { PaywallGate } from '@/components/billing/paywall-gate'

// Lazy load tab contents from existing pages
const BacktestTab = lazy(() => import('@/app/(dashboard)/backtest-lab/page'))
const ModeloTab = lazy(() => import('@/app/(dashboard)/analytics/modelo/page'))
const FeedbackTab = lazy(() => import('@/app/(dashboard)/analytics/feedback/page'))
const SignalDecayTab = lazy(() => import('@/app/(dashboard)/analytics/signal-decay/page'))

type Tab = 'backtest' | 'modelo' | 'feedback' | 'signal-decay'

const tabs: { id: Tab; label: string }[] = [
  { id: 'backtest', label: 'Backtest' },
  { id: 'modelo', label: 'Modelo' },
  { id: 'feedback', label: 'Feedback Loop' },
  { id: 'signal-decay', label: 'Signal Decay' },
]

function TabSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-4 w-96" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Skeleton className="h-32 rounded-[var(--radius)]" />
        <Skeleton className="h-32 rounded-[var(--radius)]" />
        <Skeleton className="h-32 rounded-[var(--radius)]" />
      </div>
      <Skeleton className="h-64 rounded-[var(--radius)]" />
    </div>
  )
}

export default function LabPage() {
  const [activeTab, setActiveTab] = useState<Tab>('backtest')

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <p className="text-[var(--text-caption)] font-bold text-[var(--accent-1)] uppercase tracking-[0.12em]">IQ-Cognit Engine</p>
        <h1 className="font-display text-[var(--text-title)] font-bold tracking-tight">
          Lab
        </h1>
        <p className="text-[var(--text-small)] text-[var(--text-2)] mt-0.5">
          Backtest, transparencia do modelo, feedback loop e monitoramento de sinais
        </p>
      </div>

      {/* Tab Bar */}
      <div className="flex gap-1 bg-[var(--surface-2)] rounded-lg p-0.5 w-fit overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'px-4 py-2 text-[var(--text-small)] font-semibold rounded-md transition-colors whitespace-nowrap',
              activeTab === tab.id
                ? 'bg-[var(--surface-1)] text-[var(--text-1)] shadow-sm'
                : 'text-[var(--text-3)] hover:text-[var(--text-1)]'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <PaywallGate requiredPlan="pro" feature="Lab IQ-Cognit" showPreview>
        <Suspense fallback={<TabSkeleton />}>
          {activeTab === 'backtest' && <BacktestTab />}
          {activeTab === 'modelo' && <ModeloTab />}
          {activeTab === 'feedback' && <FeedbackTab />}
          {activeTab === 'signal-decay' && <SignalDecayTab />}
        </Suspense>
      </PaywallGate>
    </div>
  )
}
