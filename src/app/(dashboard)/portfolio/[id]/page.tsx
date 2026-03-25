'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Badge, Button, Modal, Input, ScoreBadge, ChangeIndicator, EmptyState, ScrollableStrip } from '@/components/ui'
import { AssetLogo } from '@/components/ui/asset-logo'
import { AllocationDonut, AllocationTreemap } from '@/components/charts'
import { CSVImport } from '@/components/portfolio/csv-import'
import { AnalyticsTab } from '@/components/portfolio/analytics-tab'
import { PortfolioDiagnostics } from '@/components/portfolio/portfolio-diagnostics'
import { PaywallGate } from '@/components/billing/paywall-gate'
import { MonteCarloSection } from '@/components/simulation/monte-carlo-chart'
import { IRPFCalculator } from '@/components/portfolio/irpf-calculator'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/hooks/use-auth'
import { pro } from '@/lib/api/endpoints'
import { formatCurrency, formatDate } from '@/lib/utils/formatters'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

export default function PortfolioDetailPage() {
  const params = useParams()
  const router = useRouter()
  const portfolioId = params['id'] as string

  const [isAddTransactionOpen, setIsAddTransactionOpen] = useState(false)
  const [isCSVImportOpen, setIsCSVImportOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics'>('overview')
  const [transactionForm, setTransactionForm] = useState({
    ticker: '',
    type: 'BUY' as 'BUY' | 'SELL',
    date: new Date().toISOString().split('T')[0],
    quantity: '',
    price: '',
    fees: '0',
    notes: '',
  })
  const [tickerSelected, setTickerSelected] = useState(false)

  const { token } = useAuth()

  const { data: portfolio, isLoading, error } = useQuery({
    queryKey: ['portfolio', portfolioId],
    queryFn: () => pro.getPortfolio(token ?? undefined),
    enabled: !!portfolioId && !!token,
  })

  const { data: attribution } = useQuery({
    queryKey: ['portfolio-attribution', portfolioId],
    queryFn: () => pro.getPortfolioAttribution(portfolioId, token ?? undefined),
    enabled: !!portfolioId && !!token,
  })

  const { data: riskData } = useQuery({
    queryKey: ['portfolio-risk', portfolioId],
    queryFn: () => pro.getPortfolioRisk(portfolioId, token ?? undefined),
    enabled: !!portfolioId && !!token,
  })

  const performance = attribution ? {
    totalReturn: attribution.total_return_pct,
    totalInvested: attribution.total_invested,
    totalCurrent: attribution.total_current,
    bySector: attribution.by_sector,
  } : undefined

  const { data: searchResults } = { data: undefined as any, isLoading: false }

  const addTransaction = { mutate: (() => {}) as any, mutateAsync: (async () => undefined) as any, isLoading: false, isPending: false }

  const deleteTransaction = { mutate: (() => {}) as any, mutateAsync: (async () => undefined) as any, isLoading: false, isPending: false }

  const handleAddTransaction = () => {
    if (!transactionForm.ticker || !transactionForm.quantity || !transactionForm.price) return

    addTransaction.mutate({
      portfolioId,
      ticker: transactionForm.ticker,
      type: transactionForm.type,
      date: new Date(transactionForm.date || Date.now()),
      quantity: parseFloat(transactionForm.quantity),
      price: parseFloat(transactionForm.price),
      fees: parseFloat(transactionForm.fees) || 0,
      notes: transactionForm.notes || undefined,
    })
  }

  const handleCSVImport = async (transactions: Array<{ ticker: string; type: 'BUY' | 'SELL'; date: Date; quantity: number; price: number; fees: number }>) => {
    let imported = 0
    let errors = 0
    for (const tx of transactions) {
      try {
        await addTransaction.mutateAsync({
          portfolioId,
          ticker: tx.ticker,
          type: tx.type,
          date: tx.date,
          quantity: tx.quantity,
          price: tx.price,
          fees: tx.fees,
        })
        imported++
      } catch {
        errors++
      }
    }
    if (errors === 0) {
      toast.success(`${imported} operações importadas com sucesso`)
    } else {
      toast.warning(`${imported} importadas, ${errors} com erro`)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-[var(--surface-2)] rounded animate-pulse" />
        <div className="h-20 bg-[var(--surface-2)] rounded-[var(--radius)] animate-pulse" />
        <div className="h-52 bg-[var(--surface-2)] rounded-[var(--radius)] animate-pulse" />
      </div>
    )
  }

  if (error || !portfolio) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <h2 className="text-[var(--text-heading)] font-bold mb-4">Carteira não encontrada</h2>
        <Link href="/portfolio">
          <Button>Voltar para Portfólios</Button>
        </Link>
      </div>
    )
  }

  const allocationBySectorData = Object.entries(portfolio.summary.allocationBySector).map(([name, data]) => ({
    name,
    value: data.value,
    percent: data.percent,
  }))

  const treemapData = portfolio.positions.map((pos) => ({
    name: pos.name,
    ticker: pos.ticker,
    value: pos.currentValue,
    percent: portfolio.summary.totalValue > 0
      ? (pos.currentValue / portfolio.summary.totalValue) * 100
      : 0,
    gainLossPercent: pos.gainLossPercent,
  }))

  const gainLoss = portfolio.summary.totalGainLoss
  const gainLossPercent = portfolio.summary.totalGainLossPercent

  return (
    <div className="space-y-6">
      {/* Breadcrumb + Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-[var(--text-caption)] text-[var(--text-2)] mb-1">
            <Link href="/portfolio" className="hover:text-[var(--accent-1)] transition-colors">
              Portfólio
            </Link>
            <span>/</span>
            <span className="font-medium text-[var(--text-1)]">{portfolio.name}</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-[var(--text-title)] font-bold tracking-tight">{portfolio.name}</h1>
            {portfolio.isDefault && (
              <span className="text-[var(--text-caption)] uppercase tracking-wider font-semibold text-[var(--accent-1)] bg-[var(--accent-1)]/10 px-1.5 py-0.5 rounded">
                Principal
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button variant="secondary" size="sm" onClick={() => setIsCSVImportOpen(true)}>
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1.5">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            CSV
          </Button>
          <Button size="sm" onClick={() => setIsAddTransactionOpen(true)}>
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1.5">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Operação
          </Button>
        </div>
      </div>

      {/* KPI Strip — inline horizontal */}
      <ScrollableStrip>
        <div className="flex items-center gap-8 pb-1">
          <div>
            <p className="text-[var(--text-caption)] text-[var(--text-2)] mb-0.5">Patrimônio</p>
            <p className="font-mono text-[var(--text-display)] font-bold">{formatCurrency(portfolio.summary.totalValue)}</p>
          </div>
          <div className="w-px h-10 bg-[var(--border-1)]/30 flex-shrink-0" />
          <div>
            <p className="text-[var(--text-caption)] text-[var(--text-2)] mb-0.5">Custo</p>
            <p className="font-mono text-[var(--text-display)] font-bold text-[var(--text-2)]">{formatCurrency(portfolio.summary.totalCost)}</p>
          </div>
          <div className="w-px h-10 bg-[var(--border-1)]/30 flex-shrink-0" />
          <div>
            <p className="text-[var(--text-caption)] text-[var(--text-2)] mb-0.5">Resultado</p>
            <div className="flex items-baseline gap-2">
              <p className={cn('font-mono text-[var(--text-display)] font-bold', gainLoss >= 0 ? 'text-[var(--pos)]' : 'text-[var(--neg)]')}>
                {gainLoss >= 0 ? '+' : ''}{formatCurrency(gainLoss)}
              </p>
              <ChangeIndicator value={gainLossPercent} size="sm" />
            </div>
          </div>
          <div className="w-px h-10 bg-[var(--border-1)]/30 flex-shrink-0" />
          <div>
            <p className="text-[var(--text-caption)] text-[var(--text-2)] mb-0.5">Score Médio</p>
            <ScoreBadge score={portfolio.summary.avgAqScore} size="lg" showBar showLabel />
          </div>
          {performance?.benchmarks && (
            <>
              <div className="w-px h-10 bg-[var(--border-1)]/30 flex-shrink-0" />
              <div>
                <p className="text-[var(--text-caption)] text-[var(--text-2)] mb-0.5">vs CDI</p>
                <ChangeIndicator
                  value={performance.percentReturn - performance.benchmarks.cdi.percentReturn}
                  suffix="pp"
                  size="lg"
                />
              </div>
              <div className="w-px h-10 bg-[var(--border-1)]/30 flex-shrink-0" />
              <div>
                <p className="text-[var(--text-caption)] text-[var(--text-2)] mb-0.5">vs IBOV</p>
                <ChangeIndicator
                  value={performance.percentReturn - performance.benchmarks.ibov.percentReturn}
                  suffix="pp"
                  size="lg"
                />
              </div>
            </>
          )}
        </div>
      </ScrollableStrip>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-[var(--border-1)]">
        {[
          { id: 'overview' as const, label: 'Visão Geral' },
          { id: 'analytics' as const, label: 'Analytics' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'px-4 py-2 text-[var(--text-body)] font-medium transition-colors border-b-2 -mb-px',
              activeTab === tab.id
                ? 'border-[var(--accent-1)] text-[var(--accent-1)]'
                : 'border-transparent text-[var(--text-2)] hover:text-[var(--text-1)]'
            )}
          >
            {tab.label}
            {tab.id === 'analytics' && (
              <span className="ml-1.5 text-[var(--text-caption)] px-1 py-0.5 rounded bg-[var(--accent-1)]/10 text-[var(--accent-1)]">Elite</span>
            )}
          </button>
        ))}
      </div>

      {/* ─── Tab: Analytics ──────────────────────────────────── */}
      {activeTab === 'analytics' && (
        <PaywallGate requiredPlan="pro" feature="Analytics de Portfólio" showPreview>
          <AnalyticsTab portfolioId={portfolioId} />
        </PaywallGate>
      )}

      {/* ─── Tab: Overview (conteúdo original) ───────────────── */}
      {activeTab === 'overview' && <>

      {/* Diagnóstico da Carteira */}
      {portfolio.positions.length > 0 && (
        <PortfolioDiagnostics
          positions={portfolio.positions}
          totalValue={portfolio.summary.totalValue}
          avgAqScore={portfolio.summary.avgAqScore}
        />
      )}

      {/* Charts Row */}
      {portfolio.positions.length > 0 && (
        <div className="grid lg:grid-cols-5 gap-6">
          {/* Treemap — 3 columns */}
          <div className="lg:col-span-3">
            <h2 className="text-[var(--text-small)] font-semibold text-[var(--text-2)] mb-3">Mapa de Alocação</h2>
            <div className="border border-[var(--border-1)] rounded-[var(--radius)] shadow-sm bg-[var(--surface-1)] p-4">
              <AllocationTreemap data={treemapData} height={240} />
            </div>
          </div>

          {/* Sector breakdown — 2 columns */}
          <div className="lg:col-span-2">
            <h2 className="text-[var(--text-small)] font-semibold text-[var(--text-2)] mb-3">Por Setor</h2>
            <div className="border border-[var(--border-1)] rounded-[var(--radius)] shadow-sm bg-[var(--surface-1)] p-4">
              <AllocationDonut data={allocationBySectorData} />
            </div>
          </div>
        </div>
      )}

      {/* Monte Carlo (Elite) */}
      {portfolio.positions.length > 0 && (
        <PaywallGate requiredPlan="elite" feature="Simulação Monte Carlo" showPreview>
          <MonteCarloSection portfolioId={portfolioId} />
        </PaywallGate>
      )}

      {/* Calculadora IRPF */}
      <IRPFCalculator />

      {/* Positions Table */}
      <div>
        <h2 className="text-[var(--text-small)] font-semibold text-[var(--text-2)] mb-3">
          Posições ({portfolio.positions.length})
        </h2>
        {portfolio.positions.length === 0 ? (
          <EmptyState
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            }
            title="Nenhuma posição nesta carteira"
            description="Adicione suas primeiras operações ou importe via CSV da sua corretora."
            actions={[
              { label: 'Adicionar Operação', onClick: () => setIsAddTransactionOpen(true) },
              { label: 'Importar CSV', onClick: () => setIsCSVImportOpen(true), variant: 'secondary' },
            ]}
          />
        ) : (
          <div className="overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <table className="w-full text-[var(--text-small)]">
              <thead>
                <tr className="text-left text-[var(--text-caption)] text-[var(--text-2)] border-b border-[var(--border-1)]">
                  <th className="pb-2 pl-1 font-medium">Ativo</th>
                  <th className="pb-2 font-medium text-right">Qtd</th>
                  <th className="pb-2 font-medium text-right">PM</th>
                  <th className="pb-2 font-medium text-right">Preço</th>
                  <th className="pb-2 font-medium text-right">Valor</th>
                  <th className="pb-2 font-medium text-right">L/P</th>
                  <th className="pb-2 pr-1 font-medium text-center">Score</th>
                </tr>
              </thead>
              <tbody>
                {portfolio.positions.map((pos) => (
                  <tr key={pos.id} className="border-b border-[var(--border-1)] last:border-0 hover:bg-[var(--surface-2)]/30">
                    <td className="py-3 pl-1">
                      <Link href={`/ativo/${pos.ticker}`} className="group flex items-center gap-2.5">
                        <AssetLogo ticker={pos.ticker} size={28} />
                        <div className="min-w-0">
                          <p className="font-mono font-medium text-[var(--text-small)] group-hover:text-[var(--accent-1)] transition-colors leading-tight">{pos.ticker}</p>
                          <p className="text-[10px] text-[var(--text-3)] truncate leading-tight">{pos.name}</p>
                        </div>
                      </Link>
                    </td>
                    <td className="py-3 text-right font-mono text-[var(--text-small)]">{pos.quantity}</td>
                    <td className="py-3 text-right font-mono text-[var(--text-small)] text-[var(--text-2)]">{formatCurrency(pos.avgCost)}</td>
                    <td className="py-3 text-right font-mono text-[var(--text-small)]">{formatCurrency(pos.currentPrice)}</td>
                    <td className="py-3 text-right font-mono text-[var(--text-small)] font-medium">{formatCurrency(pos.currentValue)}</td>
                    <td className="py-3 text-right">
                      <ChangeIndicator value={pos.gainLossPercent} size="sm" />
                    </td>
                    <td className="py-3 pr-1 text-center">
                      <ScoreBadge score={pos.aqScore} size="sm" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Transactions History */}
      <div>
        <h2 className="text-[var(--text-small)] font-semibold text-[var(--text-2)] mb-3">
          Operações ({portfolio.transactions.length})
        </h2>
        {portfolio.transactions.length === 0 ? (
          <EmptyState
            compact
            title="Nenhuma operação registrada"
            description="Registre compras e vendas para acompanhar seu custo médio e rentabilidade."
          />
        ) : (
          <div className="overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <table className="w-full text-[var(--text-small)]">
              <thead>
                <tr className="text-left text-[var(--text-caption)] text-[var(--text-2)] border-b border-[var(--border-1)]">
                  <th className="pb-2 pl-1 font-medium">Data</th>
                  <th className="pb-2 font-medium">Ativo</th>
                  <th className="pb-2 font-medium text-center">Tipo</th>
                  <th className="pb-2 font-medium text-right">Qtd</th>
                  <th className="pb-2 font-medium text-right">Preço</th>
                  <th className="pb-2 font-medium text-right">Total</th>
                  <th className="pb-2 pr-1 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {portfolio.transactions.map((tx) => (
                  <tr key={tx.id} className="border-b border-[var(--border-1)] last:border-0 hover:bg-[var(--surface-2)]/30">
                    <td className="py-3 pl-1 font-mono text-[var(--text-small)] text-[var(--text-2)]">{formatDate(tx.date, { format: 'short' })}</td>
                    <td className="py-3 font-mono font-medium text-[var(--text-small)]">{tx.ticker}</td>
                    <td className="py-3 text-center">
                      <span className={cn(
                        'text-[var(--text-caption)] uppercase tracking-wider font-semibold px-2 py-0.5 rounded',
                        tx.type === 'BUY' ? 'text-[var(--pos)] bg-[var(--pos)]/10' : 'text-[var(--neg)] bg-[var(--neg)]/10'
                      )}>
                        {tx.type === 'BUY' ? 'Compra' : 'Venda'}
                      </span>
                    </td>
                    <td className="py-3 text-right font-mono text-[var(--text-small)]">{tx.quantity}</td>
                    <td className="py-3 text-right font-mono text-[var(--text-small)]">{formatCurrency(tx.price)}</td>
                    <td className="py-3 text-right font-mono text-[var(--text-small)] font-medium">{formatCurrency(tx.total)}</td>
                    <td className="py-3 pr-1 text-right">
                      <button
                        onClick={() => {
                          toast(`Excluir operação de ${tx.ticker}?`, {
                            action: {
                              label: 'Confirmar',
                              onClick: () => deleteTransaction.mutate({ id: tx.id }),
                            },
                            cancel: { label: 'Cancelar', onClick: () => {} },
                          })
                        }}
                        className="p-1 text-[var(--text-2)] hover:text-red transition-colors rounded"
                        title="Excluir"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      </>}

      {/* Add Transaction Modal */}
      <Modal
        isOpen={isAddTransactionOpen}
        onClose={() => setIsAddTransactionOpen(false)}
        title="Adicionar Operação"
      >
        <div className="space-y-4">
          {/* Ticker */}
          <div className="relative">
            <label className="block text-[var(--text-small)] font-medium mb-1.5">Ativo</label>
            <Input
              value={transactionForm.ticker}
              onChange={(e) => {
                setTransactionForm({ ...transactionForm, ticker: e.target.value.toUpperCase() })
                setTickerSelected(false)
              }}
              placeholder="Ex: PETR4, VALE3..."
            />
            {searchResults && searchResults.length > 0 && transactionForm.ticker.length >= 2 && !tickerSelected && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-[var(--surface-1)] border border-[var(--border-1)] rounded-lg shadow-[var(--shadow-overlay)] z-50 max-h-48 overflow-y-auto">
                {searchResults.map((asset) => (
                  <button
                    key={asset.id}
                    onClick={() => {
                      setTransactionForm({
                        ...transactionForm,
                        ticker: asset.ticker,
                        price: asset.price ? asset.price.toFixed(2) : transactionForm.price,
                      })
                      setTickerSelected(true)
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-[var(--surface-2)] flex items-center gap-2.5 text-[var(--text-small)]"
                  >
                    <AssetLogo ticker={asset.ticker} size={20} />
                    <span className="font-semibold">{asset.ticker}</span>
                    <span className="text-[var(--text-2)] flex-1 truncate text-[var(--text-caption)]">{asset.name}</span>
                    {asset.price != null && (
                      <span className="text-[var(--text-2)] text-[var(--text-caption)] font-mono">R$ {asset.price.toFixed(2)}</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Type */}
          <div>
            <label className="block text-[var(--text-small)] font-medium mb-1.5">Tipo</label>
            <div className="flex gap-2">
              <button
                onClick={() => setTransactionForm({ ...transactionForm, type: 'BUY' })}
                className={cn(
                  'flex-1 py-2 rounded-lg text-[var(--text-small)] font-medium transition-colors',
                  transactionForm.type === 'BUY'
                    ? 'bg-teal text-white'
                    : 'bg-[var(--surface-2)] text-[var(--text-2)]'
                )}
              >
                Compra
              </button>
              <button
                onClick={() => setTransactionForm({ ...transactionForm, type: 'SELL' })}
                className={cn(
                  'flex-1 py-2 rounded-lg text-[var(--text-small)] font-medium transition-colors',
                  transactionForm.type === 'SELL'
                    ? 'bg-amber text-white'
                    : 'bg-[var(--surface-2)] text-[var(--text-2)]'
                )}
              >
                Venda
              </button>
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="block text-[var(--text-small)] font-medium mb-1.5">Data</label>
            <Input
              type="date"
              value={transactionForm.date}
              onChange={(e) => setTransactionForm({ ...transactionForm, date: e.target.value })}
            />
          </div>

          {/* Quantity and Price */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[var(--text-small)] font-medium mb-1.5">Quantidade</label>
              <Input
                type="number"
                min="0"
                step="1"
                value={transactionForm.quantity}
                onChange={(e) => setTransactionForm({ ...transactionForm, quantity: e.target.value })}
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-[var(--text-small)] font-medium mb-1.5">Preço</label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={transactionForm.price}
                onChange={(e) => setTransactionForm({ ...transactionForm, price: e.target.value })}
                placeholder="0,00"
              />
            </div>
          </div>

          {/* Total preview */}
          {transactionForm.quantity && transactionForm.price && (
            <div className="p-3 bg-[var(--surface-2)] rounded-lg">
              <p className="text-[var(--text-caption)] text-[var(--text-2)]">Total da Operação</p>
              <p className="text-[var(--text-subheading)] font-bold font-mono">
                {formatCurrency(parseFloat(transactionForm.quantity) * parseFloat(transactionForm.price))}
              </p>
            </div>
          )}

          {/* Fees */}
          <div>
            <label className="block text-[var(--text-small)] font-medium mb-1.5">Taxas (opcional)</label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={transactionForm.fees}
              onChange={(e) => setTransactionForm({ ...transactionForm, fees: e.target.value })}
              placeholder="0,00"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 justify-end pt-2">
            <Button variant="ghost" size="sm" onClick={() => setIsAddTransactionOpen(false)}>
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleAddTransaction}
              disabled={!transactionForm.ticker || !transactionForm.quantity || !transactionForm.price || addTransaction.isPending}
            >
              {addTransaction.isPending ? 'Salvando...' : 'Adicionar'}
            </Button>
          </div>
        </div>
      </Modal>

      <CSVImport
        isOpen={isCSVImportOpen}
        onClose={() => setIsCSVImportOpen(false)}
        onImport={handleCSVImport}
        portfolioId={portfolioId}
      />
    </div>
  )
}
