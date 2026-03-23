'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Skeleton, Disclaimer } from '@/components/ui'
import { AssetLogo } from '@/components/ui/asset-logo'
import { cn } from '@/lib/utils'
import { pro } from '@/lib/api/endpoints'
import { adaptPortfolio } from '@/lib/api/adapters'
import { useAuth } from '@/hooks/use-auth'
import { staggerContainer, fadeInUp } from '@/lib/utils/motion'
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
} from 'recharts'

// ─── Formatters ──────────────────────────────────────────────
function fmtR$(val: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)
}

function fmtCompact(val: number): string {
  if (Math.abs(val) >= 1e6) return `R$${(val / 1e6).toFixed(1)}M`
  if (Math.abs(val) >= 1e3) return `R$${(val / 1e3).toFixed(0)}k`
  return fmtR$(val)
}

function pct(value: number): string {
  const sign = value >= 0 ? '+' : ''
  return `${sign}${value.toFixed(2).replace('.', ',')}%`
}

const COLORS = ['#1A73E8', '#00BFA5', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#6366F1', '#F97316', '#06B6D4']

const RATING_LABELS: Record<string, string> = {
  STRONG_BUY: 'Compra Forte', BUY: 'Acumular', HOLD: 'Neutro',
  REDUCE: 'Reduzir', AVOID: 'Evitar',
}

// ─── Main Page ──────────────────────────────────────────────
export default function PortfolioPage() {
  const router = useRouter()
  const { token } = useAuth()
  const queryClient = useQueryClient()

  // UI state
  const [showAddForm, setShowAddForm] = useState(false)
  const [newTicker, setNewTicker] = useState('')
  const [newQty, setNewQty] = useState('')
  const [newPrice, setNewPrice] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editQty, setEditQty] = useState('')
  const [editPrice, setEditPrice] = useState('')

  // API
  const { data: rawPortfolio, isLoading } = useQuery({
    queryKey: ['portfolio'],
    queryFn: () => pro.getPortfolio(token ?? undefined),
  })

  const portfolio = useMemo(() => {
    if (!rawPortfolio?.positions) return null
    return adaptPortfolio(rawPortfolio.positions)
  }, [rawPortfolio])

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

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { qty: number; avg_price: number } }) =>
      pro.updatePosition(id, data, token ?? undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolio'] })
      setEditingId(null)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => pro.deletePosition(id, token ?? undefined),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['portfolio'] }),
  })

  // Allocation data for pie chart
  const allocationData = useMemo(() => {
    if (!portfolio?.positions) return []
    return portfolio.positions.map((p) => ({
      name: p.ticker,
      value: p.totalValue,
      weight: p.weight,
    }))
  }, [portfolio])

  const positions = portfolio?.positions ?? []

  return (
    <motion.div className="space-y-6" {...staggerContainer}>
      {/* ─── Header ──────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[var(--text-1)]">Portfolio</h1>
          <p className="text-[var(--text-small)] text-[var(--text-2)]">
            {positions.length} posicoes | Mandato: EQUILIBRADO
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="px-5 py-2.5 bg-[var(--accent-1)] text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity shadow-sm"
        >
          + Adicionar Acao
        </button>
      </div>

      {/* ─── Summary Cards ───────────────────────────── */}
      {portfolio && positions.length > 0 && (
        <motion.div {...fadeInUp} className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <SummaryCard label="Patrimonio" value={fmtR$(portfolio.totalValue)} />
          <SummaryCard label="Custo Total" value={fmtCompact(portfolio.totalCost)} />
          <SummaryCard
            label="Ganho/Perda"
            value={fmtR$(portfolio.gainLoss)}
            valueColor={portfolio.gainLoss >= 0 ? 'text-[var(--pos)]' : 'text-[var(--neg)]'}
          />
          <SummaryCard
            label="Rentabilidade"
            value={pct(portfolio.gainLossPercent)}
            valueColor={portfolio.gainLossPercent >= 0 ? 'text-[var(--pos)]' : 'text-[var(--neg)]'}
          />
          <SummaryCard
            label="IQ-Score Medio"
            value={portfolio.avgAqScore.toFixed(0)}
            valueColor={portfolio.avgAqScore >= 65 ? 'text-[var(--pos)]' : 'text-[var(--text-1)]'}
          />
        </motion.div>
      )}

      {/* ─── Add Form ────────────────────────────────── */}
      {showAddForm && (
        <motion.div {...fadeInUp} className="bg-[var(--surface-1)] rounded-[var(--radius)] border border-[var(--accent-1)]/30 p-5 shadow-sm">
          <h3 className="font-semibold text-[var(--text-1)] mb-4">Nova Posicao</h3>
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="text-[var(--text-caption)] text-[var(--text-2)] font-medium block mb-1.5">Ticker</label>
              <input
                value={newTicker}
                onChange={(e) => setNewTicker(e.target.value.toUpperCase())}
                placeholder="VALE3"
                className="w-32 px-3 py-2.5 text-sm rounded-lg bg-[var(--bg)] border border-[var(--border-1)] text-[var(--text-1)] font-mono focus:ring-2 focus:ring-[var(--accent-1)]/30 focus:border-[var(--accent-1)] transition-all"
              />
            </div>
            <div>
              <label className="text-[var(--text-caption)] text-[var(--text-2)] font-medium block mb-1.5">Quantidade</label>
              <input
                type="number"
                value={newQty}
                onChange={(e) => setNewQty(e.target.value)}
                placeholder="100"
                className="w-28 px-3 py-2.5 text-sm rounded-lg bg-[var(--bg)] border border-[var(--border-1)] text-[var(--text-1)] font-mono focus:ring-2 focus:ring-[var(--accent-1)]/30 focus:border-[var(--accent-1)] transition-all"
              />
            </div>
            <div>
              <label className="text-[var(--text-caption)] text-[var(--text-2)] font-medium block mb-1.5">Preco Medio (R$)</label>
              <input
                type="number"
                step="0.01"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                placeholder="85.00"
                className="w-32 px-3 py-2.5 text-sm rounded-lg bg-[var(--bg)] border border-[var(--border-1)] text-[var(--text-1)] font-mono focus:ring-2 focus:ring-[var(--accent-1)]/30 focus:border-[var(--accent-1)] transition-all"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => addMutation.mutate({ ticker: newTicker, qty: Number(newQty), avg_price: Number(newPrice) })}
                disabled={!newTicker || !newQty || !newPrice || addMutation.isPending}
                className="px-5 py-2.5 bg-[var(--accent-1)] text-white text-sm font-semibold rounded-lg hover:opacity-90 disabled:opacity-40 transition-all"
              >
                {addMutation.isPending ? 'Salvando...' : 'Salvar'}
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2.5 text-sm text-[var(--text-2)] hover:text-[var(--text-1)] border border-[var(--border-1)] rounded-lg transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* ─── Main Content: Table + Allocation Chart ──── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Positions Table */}
        <motion.div {...fadeInUp} className="lg:col-span-8 bg-[var(--surface-1)] rounded-[var(--radius)] shadow-sm border border-[var(--border-1)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border-1)] bg-[var(--bg)]">
                  <th className="text-left px-4 py-3.5 text-[var(--text-2)] font-medium">Ativo</th>
                  <th className="text-right px-3 py-3.5 text-[var(--text-2)] font-medium">Qtd</th>
                  <th className="text-right px-3 py-3.5 text-[var(--text-2)] font-medium">PM</th>
                  <th className="text-right px-3 py-3.5 text-[var(--text-2)] font-medium">Atual</th>
                  <th className="text-right px-3 py-3.5 text-[var(--text-2)] font-medium">Valor</th>
                  <th className="text-right px-3 py-3.5 text-[var(--text-2)] font-medium">Peso</th>
                  <th className="text-right px-3 py-3.5 text-[var(--text-2)] font-medium">Ganho</th>
                  <th className="text-center px-3 py-3.5 text-[var(--text-2)] font-medium">IQ</th>
                  <th className="text-center px-3 py-3.5 text-[var(--text-2)] font-medium">Acoes</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-[var(--border-1)]/30">
                      <td className="px-4 py-4" colSpan={9}><Skeleton className="h-10" /></td>
                    </tr>
                  ))
                ) : positions.length > 0 ? (
                  positions.map((pos, idx) => (
                    <tr key={pos.id} className="border-b border-[var(--border-1)]/20 hover:bg-[var(--surface-2)] transition-colors">
                      <td className="px-4 py-3">
                        <Link href={`/ativo/${pos.ticker}`} className="flex items-center gap-3 hover:text-[var(--accent-1)] transition-colors">
                          <AssetLogo ticker={pos.ticker} size={32} />
                          <div>
                            <p className="font-semibold text-[var(--text-1)]">{pos.ticker}</p>
                            <p className="text-[var(--text-caption)] text-[var(--text-2)] truncate max-w-[120px]">{pos.name}</p>
                          </div>
                        </Link>
                      </td>
                      {editingId === pos.id ? (
                        <>
                          <td className="px-3 py-3">
                            <input type="number" value={editQty} onChange={(e) => setEditQty(e.target.value)}
                              className="w-16 px-2 py-1 text-xs rounded bg-[var(--bg)] border border-[var(--border-1)] font-mono" />
                          </td>
                          <td className="px-3 py-3">
                            <input type="number" step="0.01" value={editPrice} onChange={(e) => setEditPrice(e.target.value)}
                              className="w-20 px-2 py-1 text-xs rounded bg-[var(--bg)] border border-[var(--border-1)] font-mono" />
                          </td>
                          <td colSpan={4} />
                          <td className="px-3 py-3 text-center">
                            <div className="flex gap-1 justify-center">
                              <button onClick={() => updateMutation.mutate({ id: pos.id, data: { qty: Number(editQty), avg_price: Number(editPrice) } })}
                                className="text-[10px] text-[var(--pos)] font-medium">Salvar</button>
                              <button onClick={() => setEditingId(null)}
                                className="text-[10px] text-[var(--text-2)]">Cancelar</button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-3 py-3 text-right font-mono text-[var(--text-1)]">{pos.quantity}</td>
                          <td className="px-3 py-3 text-right font-mono text-[var(--text-1)]">{fmtR$(pos.avgPrice)}</td>
                          <td className="px-3 py-3 text-right font-mono text-[var(--text-1)]">{fmtR$(pos.currentPrice)}</td>
                          <td className="px-3 py-3 text-right font-mono text-[var(--text-1)]">{fmtCompact(pos.totalValue)}</td>
                          <td className="px-3 py-3 text-right font-mono text-[var(--text-2)]">{pos.weight.toFixed(1)}%</td>
                          <td className="px-3 py-3 text-right">
                            <span className={cn('font-mono text-sm', pos.gainLossPercent >= 0 ? 'text-[var(--pos)]' : 'text-[var(--neg)]')}>
                              {pct(pos.gainLossPercent)}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-center">
                            {pos.aqScore != null && (
                              <span className={cn(
                                'inline-flex items-center justify-center w-9 h-9 rounded-lg font-mono text-xs font-bold',
                                pos.aqScore >= 75 ? 'bg-[var(--pos)]/10 text-[var(--pos)]' :
                                pos.aqScore >= 62 ? 'bg-[var(--accent-1)]/10 text-[var(--accent-1)]' :
                                'bg-[var(--bg)] text-[var(--text-2)]'
                              )}>
                                {pos.aqScore}
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-3 text-center">
                            <div className="flex gap-2 justify-center">
                              <button
                                onClick={() => { setEditingId(pos.id); setEditQty(String(pos.quantity)); setEditPrice(String(pos.avgPrice)) }}
                                className="text-[10px] text-[var(--accent-1)] font-medium hover:underline"
                              >Editar</button>
                              <button
                                onClick={() => { if (confirm(`Remover ${pos.ticker}?`)) deleteMutation.mutate(pos.id) }}
                                className="text-[10px] text-[var(--neg)] font-medium hover:underline"
                              >Remover</button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="px-4 py-16 text-center text-[var(--text-2)]" colSpan={9}>
                      <div className="flex flex-col items-center gap-3">
                        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-[var(--text-2)]/50">
                          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                          <polyline points="3.29 7 12 12 20.71 7" />
                          <line x1="12" y1="22" x2="12" y2="12" />
                        </svg>
                        <p className="text-lg font-medium">Portfolio vazio</p>
                        <p className="text-sm max-w-xs">Clique em &quot;+ Adicionar Acao&quot; para comecar a construir sua carteira.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Allocation Chart */}
        {allocationData.length > 0 && (
          <motion.div {...fadeInUp} className="lg:col-span-4 bg-[var(--surface-1)] rounded-[var(--radius)] shadow-sm border border-[var(--border-1)] p-5">
            <h3 className="text-sm font-semibold text-[var(--text-1)] mb-4">Alocacao</h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={allocationData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {allocationData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--surface-1)', border: '1px solid var(--border-1)', borderRadius: '8px', fontSize: '12px' }}
                  formatter={(value: number, name: string) => [fmtCompact(value), name]}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 mt-2">
              {allocationData.map((item, idx) => (
                <div key={item.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                    <span className="font-medium text-[var(--text-1)]">{item.name}</span>
                  </div>
                  <span className="font-mono text-[var(--text-2)]">{item.weight.toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      <Disclaimer variant="footer" />
    </motion.div>
  )
}

// ─── Summary Card ────────────────────────────────────────────
function SummaryCard({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <div className="bg-[var(--surface-1)] rounded-[var(--radius)] border border-[var(--border-1)] p-4 hover:shadow-sm transition-shadow">
      <p className="text-[var(--text-caption)] text-[var(--text-2)] uppercase tracking-wider mb-1">{label}</p>
      <p className={cn('font-mono text-lg font-bold', valueColor || 'text-[var(--text-1)]')}>{value}</p>
    </div>
  )
}
