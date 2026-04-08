'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { trpc } from '@/lib/trpc/provider'
import { Button } from '@/components/ui'

interface AlertsManagerProps {
  ticker?: string
}

export function AlertsManager({ ticker }: AlertsManagerProps) {
  const [showCreate, setShowCreate] = useState(false)
  const [alertType, setAlertType] = useState<'price' | 'score' | 'dividend'>('price')
  const [alertValue, setAlertValue] = useState('')

  const { data: alerts, isLoading, refetch } = trpc.radar.alerts.useQuery(undefined, {
    staleTime: 60 * 1000,
  })

  const createAlert = trpc.radar.createAlert.useMutation({
    onSuccess: () => {
      refetch()
      setShowCreate(false)
      setAlertValue('')
    },
  } as any)

  const deleteAlert = trpc.radar.deleteAlert.useMutation({
    onSuccess: () => refetch(),
  } as any)

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-[11px] font-semibold text-[var(--text-3)] uppercase tracking-wider">
          Alertas Personalizados
        </h2>
        <Button size="sm" onClick={() => setShowCreate(!showCreate)}>
          {showCreate ? 'Cancelar' : '+ Criar Alerta'}
        </Button>
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="border border-[var(--accent-1)]/30 rounded-[var(--radius)] bg-[var(--accent-1)]/5 p-4 mb-3">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <label className="text-[10px] font-semibold text-[var(--text-3)] uppercase block mb-1">Ticker</label>
              <input
                type="text"
                defaultValue={ticker ?? ''}
                placeholder="PETR4"
                className="w-full bg-[var(--surface-1)] border border-[var(--border-1)]/30 rounded px-2 py-1.5 text-[13px] font-mono"
                id="alert-ticker"
              />
            </div>
            <div>
              <label className="text-[10px] font-semibold text-[var(--text-3)] uppercase block mb-1">Tipo</label>
              <select
                value={alertType}
                onChange={e => setAlertType(e.target.value as any)}
                className="w-full bg-[var(--surface-1)] border border-[var(--border-1)]/30 rounded px-2 py-1.5 text-[13px]"
              >
                <option value="price">Preco</option>
                <option value="score">IQ Score</option>
                <option value="dividend">Dividendo</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-semibold text-[var(--text-3)] uppercase block mb-1">Valor</label>
              <input
                type="number"
                value={alertValue}
                onChange={e => setAlertValue(e.target.value)}
                placeholder={alertType === 'price' ? '35.00' : alertType === 'score' ? '70' : '0.50'}
                className="w-full bg-[var(--surface-1)] border border-[var(--border-1)]/30 rounded px-2 py-1.5 text-[13px] font-mono"
              />
            </div>
            <div className="flex items-end">
              <Button
                size="sm"
                onClick={() => {
                  const tickerInput = (document.getElementById('alert-ticker') as HTMLInputElement)?.value
                  if (!tickerInput || !alertValue) return
                  createAlert.mutate({
                    assetId: tickerInput.toUpperCase(),
                    type: alertType === 'price' ? 'price_below' : alertType === 'score' ? 'score_change' : 'dividend',
                    threshold: Number(alertValue),
                  } as any)
                }}
                disabled={createAlert.isPending}
              >
                {createAlert.isPending ? 'Criando...' : 'Criar'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Alerts list */}
      <div className="border border-[var(--border-1)] rounded-[var(--radius)] shadow-sm bg-[var(--surface-1)]">
        {isLoading ? (
          <div className="p-6 animate-pulse"><div className="h-20 bg-[var(--surface-2)] rounded" /></div>
        ) : !alerts?.length ? (
          <div className="p-8 text-center text-[13px] text-[var(--text-2)]">
            Nenhum alerta configurado. Crie alertas para ser notificado de mudancas.
          </div>
        ) : (
          <div className="divide-y divide-[var(--border-1)]/10">
            {(alerts as any[]).map((a) => (
              <div key={a.id} className="flex items-center justify-between p-3 hover:bg-[var(--surface-2)]/20">
                <div className="flex items-center gap-3">
                  <span className={cn(
                    'text-[9px] font-bold px-1.5 py-0.5 rounded uppercase',
                    String(a.type).includes('price') ? 'bg-blue-500/10 text-blue-400' :
                    String(a.type).includes('score') ? 'bg-teal/10 text-teal' :
                    'bg-amber/10 text-amber'
                  )}>
                    {a.type}
                  </span>
                  <span className="font-mono text-[13px] font-bold text-[var(--text-1)]">{a.ticker ?? a.asset?.ticker ?? '—'}</span>
                  <span className="text-[12px] text-[var(--text-2)]">
                    {a.message ?? (a.threshold != null ? `Limite: ${a.threshold}` : '')}
                  </span>
                  {a.triggered && (
                    <span className="text-[9px] font-bold text-[var(--pos)] bg-[var(--pos)]/10 px-1.5 py-0.5 rounded">DISPARADO</span>
                  )}
                </div>
                <button
                  onClick={() => deleteAlert.mutate({ id: a.id })}
                  className="text-[var(--text-3)] hover:text-red transition-colors p-1"
                  title="Remover alerta"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
