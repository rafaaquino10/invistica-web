'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button, Modal, Input, Skeleton } from '@/components/ui'
import { cn } from '@/lib/utils'
import { pro } from '@/lib/api/endpoints'
import { useAuth } from '@/hooks/use-auth'

function fmtR$(val: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)
}

function pct(value: number): string {
  const sign = value >= 0 ? '+' : ''
  return `${sign}${value.toFixed(2).replace('.', ',')}%`
}

export default function PortfolioPage() {
  const { token } = useAuth()
  const queryClient = useQueryClient()
  const [showAddForm, setShowAddForm] = useState(false)
  const [newTicker, setNewTicker] = useState('')
  const [newQty, setNewQty] = useState('')
  const [newPrice, setNewPrice] = useState('')

  const { data: portfolio, isLoading } = useQuery({
    queryKey: ['portfolio'],
    queryFn: () => pro.getPortfolio(token ?? undefined),
  })

  const addMutation = useMutation({
    mutationFn: (data: { ticker: string; qty: number; avg_price: number }) =>
      pro.addPosition(data, token ?? undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolio'] })
      setShowAddForm(false)
      setNewTicker('')
      setNewQty('')
      setNewPrice('')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => pro.deletePosition(id, token ?? undefined),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['portfolio'] }),
  })

  const positions = portfolio?.positions ?? []
  const totalValue = positions.reduce((s, p) => s + p.current_price * p.qty, 0)
  const totalCost = positions.reduce((s, p) => s + p.avg_price * p.qty, 0)
  const totalGain = totalValue - totalCost
  const totalGainPct = totalCost > 0 ? (totalGain / totalCost) * 100 : 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[var(--text-1)]">Portfolio</h1>
          <p className="text-[var(--text-small)] text-[var(--text-2)]">{positions.length} posicoes</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="px-4 py-2 bg-[var(--accent-1)] text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity"
        >
          + Adicionar Acao
        </button>
      </div>

      {/* Summary */}
      {positions.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <SummaryCard label="Patrimonio" value={fmtR$(totalValue)} />
          <SummaryCard label="Custo Total" value={fmtR$(totalCost)} />
          <SummaryCard
            label="Ganho/Perda"
            value={fmtR$(totalGain)}
            valueColor={totalGain >= 0 ? 'text-[var(--pos)]' : 'text-[var(--neg)]'}
          />
          <SummaryCard
            label="Rentabilidade"
            value={pct(totalGainPct)}
            valueColor={totalGainPct >= 0 ? 'text-[var(--pos)]' : 'text-[var(--neg)]'}
          />
        </div>
      )}

      {/* Add Form */}
      {showAddForm && (
        <div className="bg-[var(--surface-1)] rounded-[var(--radius)] border border-[var(--border-1)] p-4">
          <h3 className="font-semibold text-[var(--text-1)] mb-3">Adicionar Posicao</h3>
          <div className="flex flex-wrap gap-3 items-end">
            <div>
              <label className="text-[var(--text-caption)] text-[var(--text-2)] block mb-1">Ticker</label>
              <input
                value={newTicker}
                onChange={(e) => setNewTicker(e.target.value.toUpperCase())}
                placeholder="VALE3"
                className="w-28 px-3 py-2 text-sm rounded-lg bg-[var(--bg)] border border-[var(--border-1)] text-[var(--text-1)] font-mono"
              />
            </div>
            <div>
              <label className="text-[var(--text-caption)] text-[var(--text-2)] block mb-1">Quantidade</label>
              <input
                type="number"
                value={newQty}
                onChange={(e) => setNewQty(e.target.value)}
                placeholder="100"
                className="w-24 px-3 py-2 text-sm rounded-lg bg-[var(--bg)] border border-[var(--border-1)] text-[var(--text-1)] font-mono"
              />
            </div>
            <div>
              <label className="text-[var(--text-caption)] text-[var(--text-2)] block mb-1">Preco Medio</label>
              <input
                type="number"
                step="0.01"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                placeholder="85.00"
                className="w-28 px-3 py-2 text-sm rounded-lg bg-[var(--bg)] border border-[var(--border-1)] text-[var(--text-1)] font-mono"
              />
            </div>
            <button
              onClick={() => addMutation.mutate({
                ticker: newTicker,
                qty: Number(newQty),
                avg_price: Number(newPrice),
              })}
              disabled={!newTicker || !newQty || !newPrice || addMutation.isPending}
              className="px-4 py-2 bg-[var(--accent-1)] text-white text-sm font-medium rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {addMutation.isPending ? 'Salvando...' : 'Salvar'}
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 text-sm text-[var(--text-2)] hover:text-[var(--text-1)] transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Positions Table */}
      <div className="bg-[var(--surface-1)] rounded-[var(--radius)] border border-[var(--border-1)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border-1)] bg-[var(--bg)]">
                <th className="text-left px-4 py-3 text-[var(--text-2)] font-medium">Ativo</th>
                <th className="text-right px-4 py-3 text-[var(--text-2)] font-medium">Qtd</th>
                <th className="text-right px-4 py-3 text-[var(--text-2)] font-medium">PM</th>
                <th className="text-right px-4 py-3 text-[var(--text-2)] font-medium">Atual</th>
                <th className="text-right px-4 py-3 text-[var(--text-2)] font-medium">Valor</th>
                <th className="text-right px-4 py-3 text-[var(--text-2)] font-medium">Ganho</th>
                <th className="text-right px-4 py-3 text-[var(--text-2)] font-medium">IQ-Score</th>
                <th className="text-center px-4 py-3 text-[var(--text-2)] font-medium">Acoes</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-[var(--border-1)]/50">
                    <td className="px-4 py-3" colSpan={8}><Skeleton className="h-6" /></td>
                  </tr>
                ))
              ) : positions.length > 0 ? (
                positions.map((pos) => {
                  const value = pos.current_price * pos.qty
                  const cost = pos.avg_price * pos.qty
                  const gain = value - cost
                  const gainPct = cost > 0 ? (gain / cost) * 100 : 0

                  return (
                    <tr key={pos.id} className="border-b border-[var(--border-1)]/50 hover:bg-[var(--surface-2)] transition-colors">
                      <td className="px-4 py-3">
                        <Link href={`/ativo/${pos.ticker}`} className="hover:text-[var(--accent-1)]">
                          <p className="font-semibold text-[var(--text-1)]">{pos.ticker}</p>
                          <p className="text-[var(--text-caption)] text-[var(--text-2)] truncate max-w-[150px]">{pos.company_name}</p>
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-[var(--text-1)]">{pos.qty}</td>
                      <td className="px-4 py-3 text-right font-mono text-[var(--text-1)]">{fmtR$(pos.avg_price)}</td>
                      <td className="px-4 py-3 text-right font-mono text-[var(--text-1)]">{fmtR$(pos.current_price)}</td>
                      <td className="px-4 py-3 text-right font-mono text-[var(--text-1)]">{fmtR$(value)}</td>
                      <td className="px-4 py-3 text-right">
                        <span className={cn('font-mono', gain >= 0 ? 'text-[var(--pos)]' : 'text-[var(--neg)]')}>
                          {pct(gainPct)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={cn('font-mono font-bold',
                          (pos.iq_score ?? 0) >= 65 ? 'text-[var(--pos)]' : 'text-[var(--text-1)]'
                        )}>
                          {pos.iq_score ?? '--'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => {
                            if (confirm(`Remover ${pos.ticker} do portfolio?`)) {
                              deleteMutation.mutate(pos.id)
                            }
                          }}
                          className="text-[var(--neg)] hover:text-[var(--neg)]/80 text-xs"
                        >
                          Remover
                        </button>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td className="px-4 py-12 text-center text-[var(--text-2)]" colSpan={8}>
                    <p className="text-lg mb-2">Nenhuma posicao</p>
                    <p className="text-sm">Clique em &quot;+ Adicionar Acao&quot; para comecar.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function SummaryCard({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <div className="bg-[var(--surface-1)] rounded-[var(--radius)] border border-[var(--border-1)] p-4">
      <p className="text-[var(--text-caption)] text-[var(--text-2)] uppercase tracking-wider mb-1">{label}</p>
      <p className={cn('font-mono text-lg font-bold', valueColor || 'text-[var(--text-1)]')}>{value}</p>
    </div>
  )
}
