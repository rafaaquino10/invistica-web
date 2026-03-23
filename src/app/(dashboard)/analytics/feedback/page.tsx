/**
 * Página do Feedback Loop — Hit Rate e Acurácia do Modelo.
 * Mostra se os scores estão realmente prevendo retornos superiores.
 * Gated: Elite only.
 */
'use client'

import { useState } from 'react'
import { trpc } from '@/lib/trpc/client'
import { PaywallGate } from '@/components/billing'
import { HitRateCards } from '@/components/analytics/hit-rate-cards'
import { ICTimeline } from '@/components/analytics/ic-timeline'
import { ReturnByClassification } from '@/components/analytics/return-by-classification'
import { QuintileSpread } from '@/components/analytics/quintile-spread'
import { SnapshotTimeline } from '@/components/analytics/snapshot-timeline'

// Seletor de período de forward days
const FORWARD_OPTIONS = [
  { value: 30, label: '30d' },
  { value: 60, label: '60d' },
  { value: 90, label: '90d' },
  { value: 180, label: '180d' },
]

function FeedbackHeader({
  forwardDays,
  onChangeForwardDays,
}: {
  forwardDays: number
  onChangeForwardDays: (days: number) => void
}) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="font-display text-[var(--text-title)] font-bold tracking-tight">Feedback Loop</h1>
        <p className="text-[var(--text-small)] text-muted-foreground">
          Acurácia do aQ Score — retornos reais vs previsões
        </p>
      </div>
      <div className="flex items-center gap-1 rounded-lg border bg-card p-1">
        <span className="px-2 text-[var(--text-caption)] text-muted-foreground">Horizonte:</span>
        {FORWARD_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onChangeForwardDays(opt.value)}
            className={[
              'rounded px-3 py-1 text-[var(--text-small)] transition-colors',
              forwardDays === opt.value
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-muted',
            ].join(' ')}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}

function EarlyAccessState({ snapshotCount }: { snapshotCount: number }) {
  const TARGET = 12
  const pct = Math.min(100, Math.round((snapshotCount / TARGET) * 100))

  return (
    <div className="flex flex-col items-center gap-6 py-16 text-center">
      <div className="rounded-full bg-muted p-6">
        <svg className="h-12 w-12 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
        </svg>
      </div>
      <div className="max-w-md space-y-2">
        <h2 className="text-[var(--text-heading)] font-semibold">Feedback Loop em Construção</h2>
        <p className="text-[var(--text-small)] text-muted-foreground">
          Os scores estão sendo gravados semanalmente. Em ~3 meses você verá
          se as previsões do aQ Score estão acertando.
        </p>
      </div>
      {/* Progresso */}
      <div className="w-full max-w-sm space-y-1">
        <div className="flex justify-between text-[var(--text-caption)] text-muted-foreground">
          <span>{snapshotCount} de {TARGET} snapshots gravados</span>
          <span>{pct}%</span>
        </div>
        <div className="h-2 w-full rounded-full bg-muted">
          <div
            className="h-2 rounded-full bg-primary transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
      {/* FAQ */}
      <div className="w-full max-w-md space-y-3 text-left">
        <details className="rounded-lg border p-3">
          <summary className="cursor-pointer text-[var(--text-small)] font-medium">O que é o Feedback Loop?</summary>
          <p className="mt-2 text-[var(--text-caption)] text-muted-foreground">
            O Feedback Loop compara os scores atribuídos pelo aQ Score com os
            retornos reais obtidos nos meses seguintes. Se ativos com score
            alto performam melhor, o modelo está funcionando.
          </p>
        </details>
        <details className="rounded-lg border p-3">
          <summary className="cursor-pointer text-[var(--text-small)] font-medium">Como funciona o Hit Rate?</summary>
          <p className="mt-2 text-[var(--text-caption)] text-muted-foreground">
            O Hit Rate mede quantos ativos classificados como &quot;Excepcional&quot;
            ou &quot;Saudável&quot; superaram o IBOV no horizonte escolhido. Um Hit
            Rate acima de 50% indica signal preditivo.
          </p>
        </details>
      </div>
    </div>
  )
}

function FeedbackContent({ forwardDays }: { forwardDays: number }) {
  const endDate = new Date()
  const startDate = new Date()
  startDate.setMonth(startDate.getMonth() - 12)

  const { data: metrics, isLoading: metricsLoading } = trpc.scoreSnapshots.feedbackMetrics.useQuery({
    startDate,
    endDate,
    forwardDays,
  })

  const { data: timeline } = trpc.scoreSnapshots.snapshotTimeline.useQuery({ limit: 12 })
  const snapshotCount = timeline?.length ?? 0

  if (snapshotCount < 4) {
    return <EarlyAccessState snapshotCount={snapshotCount} />
  }

  return (
    <div className="space-y-6">
      {/* Hit Rate Cards */}
      <HitRateCards
        hitRate={metrics?.hitRate ?? null}
        forwardDays={forwardDays}
        isLoading={metricsLoading}
      />

      {/* IC Timeline + Retorno por Classificação */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ICTimeline startDate={startDate} endDate={endDate} forwardDays={forwardDays} />
        <ReturnByClassification metrics={metrics ?? null} forwardDays={forwardDays} isLoading={metricsLoading} />
      </div>

      {/* Quintile Spread */}
      <QuintileSpread metrics={metrics ?? null} forwardDays={forwardDays} isLoading={metricsLoading} />

      {/* Timeline de Snapshots */}
      <SnapshotTimeline />
    </div>
  )
}

export default function FeedbackPage() {
  const [forwardDays, setForwardDays] = useState(90)

  return (
    <PaywallGate requiredPlan="elite">
      <div className="space-y-6">
        <FeedbackHeader forwardDays={forwardDays} onChangeForwardDays={setForwardDays} />
        <FeedbackContent forwardDays={forwardDays} />
      </div>
    </PaywallGate>
  )
}
