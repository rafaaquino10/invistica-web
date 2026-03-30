'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Skeleton, Disclaimer } from '@/components/ui'
import { AssetLogo } from '@/components/ui/asset-logo'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/utils/formatters'
import { pro } from '@/lib/api/endpoints'
import { adaptPortfolio } from '@/lib/api/adapters'
import { useAuth } from '@/hooks/use-auth'
import { CSVImport } from '@/components/portfolio/csv-import'
import { staggerContainer, fadeInUp } from '@/lib/utils/motion'
import { toast } from 'sonner'
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

// ─── IQ Badge color scale (dark) ────────────────────────────
function iqBadgeClasses(score: number): string {
  if (score >= 80) return 'bg-emerald-400/15 text-emerald-400 ring-1 ring-emerald-400/20'
  if (score >= 65) return 'bg-blue-400/15 text-blue-400 ring-1 ring-blue-400/20'
  if (score >= 50) return 'bg-amber-400/15 text-amber-400 ring-1 ring-amber-400/20'
  return 'bg-[var(--surface-2)] text-[var(--text-3)] ring-1 ring-[var(--border-1)]'
}

// ─── Main Page ──────────────────────────────────────────────
export default function PortfolioPage() {
  const router = useRouter()
  const { token } = useAuth()
  const queryClient = useQueryClient()

  // UI state
  const [showAddForm, setShowAddForm] = useState(false)
  const [showCSVImport, setShowCSVImport] = useState(false)
  const [newTicker, setNewTicker] = useState('')
  const [newQty, setNewQty] = useState('')
  const [newPrice, setNewPrice] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editQty, setEditQty] = useState('')
  const [editPrice, setEditPrice] = useState('')

  // API
  const { data: rawPortfolio, isLoading, isError } = useQuery({
    queryKey: ['portfolio'],
    queryFn: () => pro.getPortfolio(token ?? undefined),
    retry: 1,
  })

  const portfolio = useMemo(() => {
    if (!rawPortfolio?.positions) return null
    return adaptPortfolio(rawPortfolio.positions)
  }, [rawPortfolio])

  // Smart Contribution — AI recommendation on where to invest next
  const { data: smartContrib } = useQuery({
    queryKey: ['smart-contribution'],
    queryFn: () => pro.getSmartContribution(1000, token ?? undefined).catch(() => null),
    enabled: !!token && (portfolio?.positions.length ?? 0) > 0,
    retry: 0,
  })

  // Macro regime (for CDI/SELIC benchmark)
  const { data: macroRegime } = useQuery({
    queryKey: ['macro-regime'],
    queryFn: () => pro.getMacroRegime(token ?? undefined).catch(() => null),
    enabled: !!token,
    retry: 0,
  })

  // Portfolio Attribution — P&L decomposition by sector
  const { data: attribution } = useQuery({
    queryKey: ['portfolio-attribution', 'default'],
    queryFn: () => pro.getPortfolioAttribution('default', token ?? undefined).catch(() => null),
    enabled: !!token && (portfolio?.positions.length ?? 0) > 0,
    retry: 0,
  })

  // Portfolio Risk — concentration analysis
  const { data: riskAnalysis } = useQuery({
    queryKey: ['portfolio-risk', 'default'],
    queryFn: () => pro.getPortfolioRisk('default', token ?? undefined).catch(() => null),
    enabled: !!token && (portfolio?.positions.length ?? 0) > 0,
    retry: 0,
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
      {/* ─── Error Banner ─────────────────────────────── */}
      {isError && (
        <div className="rounded-xl border border-amber-400/20 bg-amber-400/5 p-4 text-sm text-amber-400">
          Erro ao carregar portfolio. Verifique sua conexao e tente novamente.
        </div>
      )}

      {/* ─── Header ──────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[var(--text-1)]">Portfolio</h1>
          <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-3)]">
            {positions.length} {positions.length === 1 ? 'posicao' : 'posicoes'}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowCSVImport(true)}
            aria-label="Importar posicoes de arquivo CSV"
            className="px-4 py-2 bg-[var(--surface-1)] text-[var(--text-2)] text-sm font-medium rounded-xl border border-[var(--border-1)] hover:bg-[var(--surface-2)] transition-colors"
          >
            CSV
          </button>
          <button
            onClick={() => setShowAddForm(true)}
            className="px-5 py-2 bg-[var(--accent-1)] text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity shadow-sm"
          >
            + Adicionar Acao
          </button>
        </div>
      </div>

      {/* ─── Smart Contribution — AI recommendation ─── */}
      {smartContrib?.suggestions && smartContrib.suggestions.length > 0 && (
        <div className="bg-[var(--surface-1)] rounded-xl border border-[var(--accent-1)]/20 p-4">
          <div className="flex items-center gap-2 mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--accent-1)]">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-3)]">Proximo Aporte Inteligente</h3>
            <span className="font-mono text-xs text-[var(--text-3)] ml-auto">Aporte: {formatCurrency(smartContrib.aporte_total)}</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {smartContrib.suggestions.slice(0, 3).map((s) => (
              <Link
                key={s.ticker}
                href={`/ativo/${s.ticker}`}
                className="flex items-center gap-3 p-3 rounded-xl bg-[var(--bg)] border border-[var(--border-1)]/50 hover:border-[var(--accent-1)]/40 transition-colors"
              >
                <AssetLogo ticker={s.ticker} size={28} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-semibold text-sm text-[var(--text-1)]">{s.ticker}</span>
                    <span className="font-mono text-sm font-bold text-[var(--accent-1)]">{formatCurrency(s.valor_recomendado)}</span>
                  </div>
                  <p className="text-[10px] text-[var(--text-3)] truncate">{s.motivo}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ─── Summary Cards (gradient KPIs) ────────────── */}
      {portfolio && positions.length > 0 && (
        <motion.div {...fadeInUp} className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Patrimonio — accent gradient */}
          <div className="rounded-xl bg-gradient-to-br from-[var(--accent-1)]/10 to-[var(--accent-1)]/5 border border-[var(--accent-1)]/20 p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-3)] mb-1">Patrimonio</p>
            <p className="font-mono text-lg font-bold text-[var(--text-1)]">{fmtR$(portfolio.totalValue)}</p>
          </div>
          {/* Custo Total */}
          <div className="rounded-xl bg-[var(--surface-1)] border border-[var(--border-1)] p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-3)] mb-1">Custo Total</p>
            <p className="font-mono text-lg font-bold text-[var(--text-1)]">{fmtCompact(portfolio.totalCost)}</p>
          </div>
          {/* Ganho/Perda — pos/neg gradient */}
          <div className={cn(
            'rounded-xl border p-4',
            portfolio.gainLoss >= 0
              ? 'bg-gradient-to-br from-emerald-400/10 to-emerald-400/5 border-emerald-400/20'
              : 'bg-gradient-to-br from-red-400/10 to-red-400/5 border-red-400/20'
          )}>
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-3)] mb-1">Ganho/Perda</p>
            <p className={cn('font-mono text-lg font-bold', portfolio.gainLoss >= 0 ? 'text-emerald-400' : 'text-red-400')}>
              {fmtR$(portfolio.gainLoss)}
            </p>
          </div>
          {/* Rentabilidade */}
          <div className={cn(
            'rounded-xl border p-4',
            portfolio.gainLossPercent >= 0
              ? 'bg-gradient-to-br from-emerald-400/10 to-emerald-400/5 border-emerald-400/20'
              : 'bg-gradient-to-br from-red-400/10 to-red-400/5 border-red-400/20'
          )}>
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-3)] mb-1">Rentabilidade</p>
            <p className={cn('font-mono text-lg font-bold', portfolio.gainLossPercent >= 0 ? 'text-emerald-400' : 'text-red-400')}>
              {pct(portfolio.gainLossPercent)}
            </p>
          </div>
          {/* IQ-Score Medio */}
          <div className="rounded-xl bg-[var(--surface-1)] border border-[var(--border-1)] p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-3)] mb-1">IQ-Score Medio</p>
            <p className={cn(
              'font-mono text-lg font-bold',
              portfolio.avgIqScore >= 70 ? 'text-emerald-400' : portfolio.avgIqScore >= 50 ? 'text-blue-400' : 'text-amber-400'
            )}>
              {portfolio.avgIqScore.toFixed(0)}
            </p>
          </div>
        </motion.div>
      )}

      {/* ─── Benchmark Comparison ──────────────────────── */}
      {portfolio && positions.length > 0 && macroRegime && (
        <div className="bg-[var(--surface-1)] rounded-xl border border-[var(--border-1)] p-5">
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-3)] mb-4">vs Benchmarks</h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Portfolio Return */}
            <div className="text-center p-3 rounded-xl bg-[var(--accent-1)]/5 border border-[var(--accent-1)]/20">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-3)]">Sua Carteira</p>
              <p className={cn('font-mono text-xl font-bold mt-1', portfolio.gainLossPercent >= 0 ? 'text-emerald-400' : 'text-red-400')}>
                {portfolio.gainLossPercent >= 0 ? '+' : ''}{portfolio.gainLossPercent.toFixed(1)}%
              </p>
            </div>
            {/* CDI proxy (SELIC annual) */}
            <div className="text-center p-3 rounded-xl bg-[var(--bg)] border border-[var(--border-1)]/50">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-3)]">CDI (SELIC)</p>
              <p className="font-mono text-xl font-bold text-[var(--text-1)] mt-1">
                {macroRegime.macro.selic.toFixed(1)}% a.a.
              </p>
              {(() => {
                const alpha = portfolio.gainLossPercent - macroRegime.macro.selic
                return (
                  <span className={cn(
                    'inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold',
                    alpha >= 0 ? 'bg-emerald-400/10 text-emerald-400' : 'bg-red-400/10 text-red-400'
                  )}>
                    Alpha: {alpha >= 0 ? '+' : ''}{alpha.toFixed(1)}pp
                  </span>
                )
              })()}
            </div>
            {/* IPCA */}
            <div className="text-center p-3 rounded-xl bg-[var(--bg)] border border-[var(--border-1)]/50">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-3)]">IPCA</p>
              <p className="font-mono text-xl font-bold text-[var(--text-1)] mt-1">
                {macroRegime.macro.ipca.toFixed(1)}% a.a.
              </p>
              {(() => {
                const realReturn = portfolio.gainLossPercent - macroRegime.macro.ipca
                return (
                  <span className={cn(
                    'inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold',
                    realReturn >= 0 ? 'bg-emerald-400/10 text-emerald-400' : 'bg-red-400/10 text-red-400'
                  )}>
                    Real: {realReturn >= 0 ? '+' : ''}{realReturn.toFixed(1)}pp
                  </span>
                )
              })()}
            </div>
            {/* Cambio USD */}
            <div className="text-center p-3 rounded-xl bg-[var(--bg)] border border-[var(--border-1)]/50">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-3)]">Dolar</p>
              <p className="font-mono text-xl font-bold text-[var(--text-1)] mt-1">
                R$ {macroRegime.macro.cambio_usd.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ─── Insights Automaticos ────────────────────── */}
      {portfolio && positions.length > 0 && (riskAnalysis || attribution) && (
        <div className="space-y-2">
          {(() => {
            const insights: { text: string; type: 'info' | 'warning' | 'success' }[] = []
            // Concentration insight
            if (riskAnalysis?.hhi && riskAnalysis.hhi >= 0.25) {
              insights.push({ text: `Sua carteira esta muito concentrada (HHI ${(riskAnalysis.hhi * 100).toFixed(0)}%). Considere diversificar adicionando mais posicoes.`, type: 'warning' })
            } else if (riskAnalysis?.hhi && riskAnalysis.hhi < 0.10) {
              insights.push({ text: `Boa diversificacao! Sua carteira tem concentracao baixa (HHI ${(riskAnalysis.hhi * 100).toFixed(0)}%).`, type: 'success' })
            }
            // Top 3 weight
            if (riskAnalysis?.top3_weight_pct && riskAnalysis.top3_weight_pct > 70) {
              insights.push({ text: `As 3 maiores posicoes representam ${riskAnalysis.top3_weight_pct.toFixed(0)}% da carteira. Considere rebalancear.`, type: 'warning' })
            }
            // Sector concentration
            if (riskAnalysis?.max_sector_weight_pct && riskAnalysis.max_sector_weight_pct > 40) {
              insights.push({ text: `Um setor representa ${riskAnalysis.max_sector_weight_pct.toFixed(0)}% da carteira. Exposicao setorial elevada.`, type: 'warning' })
            }
            // IQ-Score average
            if (portfolio.avgIqScore >= 70) {
              insights.push({ text: `IQ-Score medio de ${portfolio.avgIqScore.toFixed(0)} — carteira de alta qualidade.`, type: 'success' })
            } else if (portfolio.avgIqScore < 50 && portfolio.avgIqScore > 0) {
              insights.push({ text: `IQ-Score medio de ${portfolio.avgIqScore.toFixed(0)} — considere trocar posicoes de baixa qualidade.`, type: 'warning' })
            }
            // Positions with losses
            const losers = positions.filter(p => p.gainLossPercent < -10)
            if (losers.length > 0) {
              insights.push({ text: `${losers.length} posicao(oes) com perda > 10%: ${losers.map(l => l.ticker).join(', ')}. Verifique a tese de investimento.`, type: 'info' })
            }
            if (insights.length === 0) return null
            return insights.map((ins, i) => (
              <div key={i} className={cn(
                'flex items-start gap-3 p-3 rounded-xl border text-sm',
                ins.type === 'warning' ? 'bg-amber-400/5 border-amber-400/20 text-amber-400' :
                ins.type === 'success' ? 'bg-emerald-400/5 border-emerald-400/20 text-emerald-400' :
                'bg-blue-400/5 border-blue-400/20 text-blue-400'
              )}>
                <span className={cn(
                  'mt-0.5 flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold',
                  ins.type === 'warning' ? 'bg-amber-400/15 text-amber-400' :
                  ins.type === 'success' ? 'bg-emerald-400/15 text-emerald-400' :
                  'bg-blue-400/15 text-blue-400'
                )}>
                  {ins.type === 'warning' ? '!' : ins.type === 'success' ? '>' : 'i'}
                </span>
                <p>{ins.text}</p>
              </div>
            ))
          })()}
        </div>
      )}

      {/* ─── Portfolio Analytics (Attribution + Risk) ──── */}
      {(attribution || riskAnalysis) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Attribution by Sector */}
          {attribution?.by_sector && attribution.by_sector.length > 0 && (
            <div className="bg-[var(--surface-1)] rounded-xl border border-[var(--border-1)] p-5">
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-3)] mb-3">Retorno por Setor</h3>
              <div className="space-y-2">
                {attribution.by_sector.map((s) => (
                  <div key={s.cluster_id} className="flex items-center gap-3">
                    <span className="text-xs text-[var(--text-3)] w-20 truncate">
                      {s.tickers.slice(0, 2).join(', ')}{s.tickers.length > 2 ? ` +${s.tickers.length - 2}` : ''}
                    </span>
                    <div className="flex-1 h-1.5 bg-[var(--bg)] rounded-full overflow-hidden">
                      <div
                        className={cn('h-full rounded-full', s.return_pct >= 0 ? 'bg-emerald-400' : 'bg-red-400')}
                        style={{ width: `${Math.min(Math.abs(s.return_pct) * 2, 100)}%` }}
                      />
                    </div>
                    <span className={cn('font-mono text-xs font-bold w-14 text-right', s.return_pct >= 0 ? 'text-emerald-400' : 'text-red-400')}>
                      {s.return_pct >= 0 ? '+' : ''}{s.return_pct.toFixed(1)}%
                    </span>
                    <span className="font-mono text-[10px] text-[var(--text-3)] w-10 text-right">{s.weight_pct.toFixed(0)}%</span>
                  </div>
                ))}
              </div>
              {attribution.total_return_pct != null && (
                <div className="mt-3 pt-3 border-t border-[var(--border-1)]/30 flex items-center justify-between">
                  <span className="text-xs text-[var(--text-3)]">Retorno Total</span>
                  <span className={cn('font-mono font-bold', attribution.total_return_pct >= 0 ? 'text-emerald-400' : 'text-red-400')}>
                    {attribution.total_return_pct >= 0 ? '+' : ''}{attribution.total_return_pct.toFixed(1)}%
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Risk Concentration */}
          {riskAnalysis && (
            <div className="bg-[var(--surface-1)] rounded-xl border border-[var(--border-1)] p-5">
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-3)] mb-3">Risco & Concentracao</h3>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="text-center p-3 rounded-xl bg-[var(--bg)] border border-[var(--border-1)]/50">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-3)]">Herfindahl (HHI)</p>
                  <p className={cn('font-mono text-lg font-bold mt-1', riskAnalysis.hhi < 0.15 ? 'text-emerald-400' : riskAnalysis.hhi < 0.25 ? 'text-amber-400' : 'text-red-400')}>
                    {(riskAnalysis.hhi * 100).toFixed(0)}%
                  </p>
                  <p className="text-[10px] text-[var(--text-3)]">{riskAnalysis.concentration}</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-[var(--bg)] border border-[var(--border-1)]/50">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-3)]">Top 3 Peso</p>
                  <p className={cn('font-mono text-lg font-bold mt-1', riskAnalysis.top3_weight_pct < 50 ? 'text-emerald-400' : 'text-amber-400')}>
                    {riskAnalysis.top3_weight_pct.toFixed(0)}%
                  </p>
                </div>
              </div>
              <div className="text-[10px] font-mono text-[var(--text-3)]">
                {riskAnalysis.positions} posicoes | Maior setor: {riskAnalysis.max_sector_weight_pct.toFixed(0)}%
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── Add Form (dark inputs) ───────────────────── */}
      {showAddForm && (
        <motion.div {...fadeInUp} className="bg-[var(--surface-1)] rounded-xl border border-[var(--accent-1)]/30 p-5">
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-3)] mb-4">Nova Posicao</h3>
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-3)] block mb-1.5">Ticker</label>
              <input
                value={newTicker}
                onChange={(e) => setNewTicker(e.target.value.toUpperCase())}
                placeholder="VALE3"
                className="w-32 px-3 py-2 text-sm rounded-xl bg-[var(--bg)] border border-[var(--border-1)] text-[var(--text-1)] font-mono placeholder:text-[var(--text-3)] focus:ring-2 focus:ring-[var(--accent-1)]/30 focus:border-[var(--accent-1)] transition-all outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-3)] block mb-1.5">Quantidade</label>
              <input
                type="number"
                value={newQty}
                onChange={(e) => setNewQty(e.target.value)}
                placeholder="100"
                className="w-28 px-3 py-2 text-sm rounded-xl bg-[var(--bg)] border border-[var(--border-1)] text-[var(--text-1)] font-mono placeholder:text-[var(--text-3)] focus:ring-2 focus:ring-[var(--accent-1)]/30 focus:border-[var(--accent-1)] transition-all outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-3)] block mb-1.5">Preco Medio (R$)</label>
              <input
                type="number"
                step="0.01"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                placeholder="85.00"
                className="w-32 px-3 py-2 text-sm rounded-xl bg-[var(--bg)] border border-[var(--border-1)] text-[var(--text-1)] font-mono placeholder:text-[var(--text-3)] focus:ring-2 focus:ring-[var(--accent-1)]/30 focus:border-[var(--accent-1)] transition-all outline-none"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => addMutation.mutate({ ticker: newTicker, qty: Number(newQty), avg_price: Number(newPrice) })}
                disabled={!newTicker || !newQty || !newPrice || addMutation.isPending}
                className="px-5 py-2 bg-[var(--accent-1)] text-white text-sm font-semibold rounded-xl hover:opacity-90 disabled:opacity-40 transition-all"
              >
                {addMutation.isPending ? 'Salvando...' : 'Salvar'}
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 text-sm text-[var(--text-2)] hover:text-[var(--text-1)] border border-[var(--border-1)] rounded-xl transition-colors"
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
        <motion.div {...fadeInUp} className="lg:col-span-8 bg-[var(--surface-1)] rounded-xl border border-[var(--border-1)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border-1)]">
                  <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-[var(--text-3)]">Ativo</th>
                  <th className="text-right px-3 py-3 text-[10px] font-bold uppercase tracking-wider text-[var(--text-3)]">Qtd</th>
                  <th className="text-right px-3 py-3 text-[10px] font-bold uppercase tracking-wider text-[var(--text-3)]">PM</th>
                  <th className="text-right px-3 py-3 text-[10px] font-bold uppercase tracking-wider text-[var(--text-3)]">Atual</th>
                  <th className="text-right px-3 py-3 text-[10px] font-bold uppercase tracking-wider text-[var(--text-3)]">Valor</th>
                  <th className="text-right px-3 py-3 text-[10px] font-bold uppercase tracking-wider text-[var(--text-3)]">Peso</th>
                  <th className="text-right px-3 py-3 text-[10px] font-bold uppercase tracking-wider text-[var(--text-3)]">Ganho</th>
                  <th className="text-center px-3 py-3 text-[10px] font-bold uppercase tracking-wider text-[var(--text-3)]">IQ</th>
                  <th className="text-center px-3 py-3 text-[10px] font-bold uppercase tracking-wider text-[var(--text-3)]">Acoes</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-[var(--border-1)]/20">
                      <td className="px-4 py-3" colSpan={9}><Skeleton className="h-8" /></td>
                    </tr>
                  ))
                ) : positions.length > 0 ? (
                  positions.map((pos, idx) => (
                    <tr
                      key={pos.id}
                      className={cn(
                        'border-b border-[var(--border-1)]/10 hover:bg-[var(--surface-2)]/50 transition-colors',
                        idx % 2 === 1 && 'bg-[var(--bg)]/30'
                      )}
                    >
                      <td className="px-4 py-2.5">
                        <Link href={`/ativo/${pos.ticker}`} className="flex items-center gap-2.5 hover:text-[var(--accent-1)] transition-colors">
                          <AssetLogo ticker={pos.ticker} size={28} />
                          <div>
                            <p className="font-mono font-semibold text-sm text-[var(--text-1)]">{pos.ticker}</p>
                            <p className="text-[10px] text-[var(--text-3)] truncate max-w-[100px]">{pos.name}</p>
                          </div>
                        </Link>
                      </td>
                      {editingId === pos.id ? (
                        <>
                          <td className="px-3 py-2.5">
                            <input type="number" value={editQty} onChange={(e) => setEditQty(e.target.value)}
                              className="w-16 px-2 py-1 text-xs rounded-lg bg-[var(--bg)] border border-[var(--border-1)] font-mono text-[var(--text-1)] outline-none focus:ring-1 focus:ring-[var(--accent-1)]/30" />
                          </td>
                          <td className="px-3 py-2.5">
                            <input type="number" step="0.01" value={editPrice} onChange={(e) => setEditPrice(e.target.value)}
                              className="w-20 px-2 py-1 text-xs rounded-lg bg-[var(--bg)] border border-[var(--border-1)] font-mono text-[var(--text-1)] outline-none focus:ring-1 focus:ring-[var(--accent-1)]/30" />
                          </td>
                          <td colSpan={4} />
                          <td className="px-3 py-2.5 text-center">
                            <div className="flex gap-1.5 justify-center">
                              <button onClick={() => updateMutation.mutate({ id: pos.id, data: { qty: Number(editQty), avg_price: Number(editPrice) } })}
                                className="text-[10px] font-bold text-emerald-400 hover:underline">Salvar</button>
                              <button onClick={() => setEditingId(null)}
                                className="text-[10px] text-[var(--text-3)] hover:underline">Cancelar</button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-3 py-2.5 text-right font-mono text-sm text-[var(--text-1)]">{pos.quantity}</td>
                          <td className="px-3 py-2.5 text-right font-mono text-sm text-[var(--text-1)]">{fmtR$(pos.avgPrice)}</td>
                          <td className="px-3 py-2.5 text-right font-mono text-sm text-[var(--text-1)]">{fmtR$(pos.currentPrice)}</td>
                          <td className="px-3 py-2.5 text-right font-mono text-sm text-[var(--text-1)]">{fmtCompact(pos.totalValue)}</td>
                          <td className="px-3 py-2.5 text-right font-mono text-sm text-[var(--text-2)]">{(pos.weight ?? 0).toFixed(1)}%</td>
                          <td className="px-3 py-2.5 text-right">
                            <span className={cn('font-mono text-sm', pos.gainLossPercent >= 0 ? 'text-emerald-400' : 'text-red-400')}>
                              {pct(pos.gainLossPercent)}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-center">
                            {pos.iqScore != null && (
                              <span className={cn(
                                'inline-flex items-center justify-center w-8 h-8 rounded-lg font-mono text-[11px] font-bold',
                                iqBadgeClasses(pos.iqScore)
                              )}>
                                {pos.iqScore}
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2.5 text-center">
                            <div className="flex gap-2 justify-center">
                              <button
                                onClick={() => { setEditingId(pos.id); setEditQty(String(pos.quantity)); setEditPrice(String(pos.avgPrice)) }}
                                className="text-[10px] text-blue-400 font-medium hover:underline"
                              >Editar</button>
                              <button
                                onClick={() => { if (confirm(`Remover ${pos.ticker}?`)) deleteMutation.mutate(pos.id) }}
                                className="text-[10px] text-red-400 font-medium hover:underline"
                              >Remover</button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  ))
                ) : (
                  /* ─── Empty State (dark themed, accent border) ─── */
                  <tr>
                    <td className="px-4 py-16 text-center" colSpan={9}>
                      <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-[var(--accent-1)]/30 p-8 mx-4">
                        <div className="w-12 h-12 rounded-xl bg-[var(--accent-1)]/10 flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[var(--accent-1)]">
                            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                            <polyline points="3.29 7 12 12 20.71 7" />
                            <line x1="12" y1="22" x2="12" y2="12" />
                          </svg>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-semibold text-[var(--text-1)]">Sua carteira ainda esta vazia</p>
                          <p className="text-xs max-w-sm text-[var(--text-3)]">
                            Adicione suas posicoes manualmente ou importe via CSV para acompanhar performance, receber insights e recomendacoes.
                          </p>
                        </div>
                        <div className="flex gap-3 mt-2">
                          <button
                            onClick={() => setShowAddForm(true)}
                            className="px-5 py-2 bg-[var(--accent-1)] text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity"
                          >
                            + Adicionar Acao
                          </button>
                          <button
                            onClick={() => setShowCSVImport(true)}
                            className="px-5 py-2 text-sm font-medium text-[var(--text-2)] border border-[var(--border-1)] rounded-xl hover:bg-[var(--surface-2)] transition-colors"
                          >
                            Importar CSV
                          </button>
                        </div>
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
          <motion.div {...fadeInUp} className="lg:col-span-4 bg-[var(--surface-1)] rounded-xl border border-[var(--border-1)] p-5">
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-3)] mb-4">Alocacao</h3>
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
                  contentStyle={{ backgroundColor: 'var(--surface-1)', border: '1px solid var(--border-1)', borderRadius: '12px', fontSize: '12px' }}
                  formatter={(value: number, name: string) => [fmtCompact(value), name]}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-1.5 mt-2">
              {allocationData.map((item, idx) => (
                <div key={item.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                    <span className="font-mono font-medium text-[var(--text-1)]">{item.name}</span>
                  </div>
                  <span className="font-mono text-[var(--text-3)]">{(item.weight ?? 0).toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      <Disclaimer variant="footer" />

      {/* CSV Import Modal */}
      <CSVImport
        isOpen={showCSVImport}
        onClose={() => setShowCSVImport(false)}
        portfolioId="default"
        onImport={async (transactions) => {
          let imported = 0
          let errors = 0
          for (const tx of transactions) {
            try {
              await pro.addPosition(
                { ticker: tx.ticker, qty: tx.quantity, avg_price: tx.price },
                token ?? undefined,
              )
              imported++
            } catch {
              errors++
            }
          }
          queryClient.invalidateQueries({ queryKey: ['portfolio'] })
          if (errors === 0) {
            toast.success(`${imported} posicoes importadas com sucesso`)
          } else {
            toast.warning(`${imported} importadas, ${errors} com erro`)
          }
        }}
      />
    </motion.div>
  )
}
