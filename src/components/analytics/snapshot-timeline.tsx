/**
 * Timeline de snapshots gravados semanalmente.
 * Mostra data, contagem de ativos e status (completo/parcial).
 */
'use client'

import { useState } from 'react'
// TODO: Migrate to InvestIQ API when endpoint is available
import { trpc } from '@/lib/trpc/client'

export function SnapshotTimeline() {
  const [expanded, setExpanded] = useState(false)
  const { data: snapshots, isLoading } = trpc.scoreSnapshots.snapshotTimeline.useQuery({
    limit: expanded ? 52 : 12,
  })

  return (
    <div className="rounded-lg border bg-card p-4 space-y-4">
      <h3 className="font-semibold">Timeline de Snapshots</h3>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-10 animate-pulse rounded bg-muted" />
          ))}
        </div>
      ) : !snapshots || snapshots.length === 0 ? (
        <div className="py-8 text-center">
          <p className="text-sm text-muted-foreground">
            Nenhum snapshot gravado ainda.
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            O job semanal grava automaticamente às sextas-feiras.
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {snapshots.map((s) => {
              const date = new Date(s.date)
              const isComplete = s.count >= 350
              return (
                <div
                  key={date.toISOString()}
                  className="flex items-center justify-between rounded-md bg-muted/30 px-3 py-2"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: isComplete ? '#22C55E' : '#FB923C' }}
                    />
                    <span className="text-sm font-medium">
                      {date.toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">{s.count} ativos</span>
                    <span
                      className="rounded-full px-2 py-0.5 text-xs font-medium"
                      style={{
                        backgroundColor: isComplete ? '#22C55E20' : '#FB923C20',
                        color: isComplete ? '#16A34A' : '#C2410C',
                      }}
                    >
                      {isComplete ? 'Completo' : 'Parcial'}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>

          {!expanded && (snapshots.length ?? 0) >= 12 && (
            <button
              onClick={() => setExpanded(true)}
              className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Ver mais snapshots →
            </button>
          )}
        </>
      )}
    </div>
  )
}
