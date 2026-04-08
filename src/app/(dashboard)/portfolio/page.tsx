'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Button, Modal, Input, ScoreBadge, ChangeIndicator, ScrollableStrip } from '@/components/ui'
import { AssetLogo } from '@/components/ui/asset-logo'
import { trpc } from '@/lib/trpc/provider'
import { formatCurrency } from '@/lib/utils/formatters'
import { cn } from '@/lib/utils'
import { staggerContainer, fadeInUp } from '@/lib/utils/motion'
import { SmartContribution } from '@/components/portfolio/smart-contribution'
import { SAMPLE_PORTFOLIO_POSITIONS as SAMPLE_PORTFOLIO } from '@/lib/demo-data'

export default function PortfolioPage() {
  const router = useRouter()
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [newPortfolioName, setNewPortfolioName] = useState('')
  const [isCreatingSample, setIsCreatingSample] = useState(false)

  const utils = trpc.useUtils()

  const { data: portfolios, isLoading } = trpc.portfolio.list.useQuery()

  const createPortfolio = trpc.portfolio.create.useMutation({
    onSuccess: (data) => {
      utils.portfolio.list.invalidate()
      setIsCreateModalOpen(false)
      setNewPortfolioName('')
      // Redireciona para a carteira criada
      if (data?.id) {
        router.push(`/portfolio/${data.id}`)
      }
    },
  })

  const addTransaction = trpc.portfolio.addTransaction.useMutation()

  const handleCreatePortfolio = () => {
    if (newPortfolioName.trim()) {
      createPortfolio.mutate({
        name: newPortfolioName.trim(),
        isDefault: portfolios?.length === 0,
      })
    }
  }

  const handleCreateSamplePortfolio = async () => {
    setIsCreatingSample(true)
    try {
      const portfolio = await createPortfolio.mutateAsync({
        name: 'Minha Carteira',
        description: 'Carteira de exemplo com 5 ações',
        isDefault: true,
      })
      if (portfolio?.id) {
        for (const stock of SAMPLE_PORTFOLIO) {
          await addTransaction.mutateAsync({
            portfolioId: portfolio.id,
            ticker: stock.ticker,
            type: 'BUY',
            date: new Date(),
            quantity: stock.quantity,
            price: stock.price,
            fees: 0,
          })
        }
        utils.portfolio.list.invalidate()
        router.push(`/portfolio/${portfolio.id}`)
      }
    } finally {
      setIsCreatingSample(false)
    }
  }

  // Totals
  const totalValue = portfolios?.reduce((sum, p) => sum + p.totalValue, 0) ?? 0
  const totalCost = portfolios?.reduce((sum, p) => sum + p.totalCost, 0) ?? 0
  const totalGainLoss = totalValue - totalCost
  const totalGainLossPercent = totalCost > 0 ? (totalGainLoss / totalCost) * 100 : 0
  const avgAqScore = portfolios?.length
    ? portfolios.reduce((sum, p) => sum + p.avgAqScore, 0) / portfolios.length
    : 0
  const totalPositions = portfolios?.reduce((sum, p) => sum + p.positionsCount, 0) ?? 0

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 bg-[var(--surface-2)] rounded-lg animate-pulse" />
        <div className="h-20 bg-[var(--surface-2)] rounded-[var(--radius)] animate-pulse" />
        <div className="h-64 bg-[var(--surface-2)] rounded-[var(--radius)] animate-pulse" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-[var(--text-title)] font-bold tracking-tight">Portfólio</h1>
          <p className="text-[var(--text-small)] text-[var(--text-2)] mt-0.5">
            {portfolios?.length ?? 0} carteira{(portfolios?.length ?? 0) !== 1 ? 's' : ''} · {totalPositions} posições
          </p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)} size="sm">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1.5">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Nova Carteira
        </Button>
      </div>

      {/* KPI Strip — inline horizontal */}
      <ScrollableStrip>
        <div className="flex items-center gap-8 pb-1">
          <div>
            <p className="text-[var(--text-caption)] text-[var(--text-2)] mb-0.5">Patrimônio</p>
            <p className="text-[var(--text-heading)] font-bold font-mono">{formatCurrency(totalValue)}</p>
          </div>
          <div className="w-px h-10 bg-[var(--border-1)]/30 flex-shrink-0" />
          <div>
            <p className="text-[var(--text-caption)] text-[var(--text-2)] mb-0.5">Resultado</p>
            <p className={cn('text-[var(--text-heading)] font-bold font-mono', totalGainLoss >= 0 ? 'text-[var(--pos)]' : 'text-[var(--neg)]')}>
              {totalGainLoss >= 0 ? '+' : ''}{formatCurrency(totalGainLoss)}
            </p>
            <ChangeIndicator value={totalGainLossPercent} size="sm" />
          </div>
          <div className="w-px h-10 bg-[var(--border-1)]/30 flex-shrink-0" />
          <div>
            <p className="text-[var(--text-caption)] text-[var(--text-2)] mb-0.5">Score Médio</p>
            <ScoreBadge score={avgAqScore} size="lg" showBar />
          </div>
          <div className="w-px h-10 bg-[var(--border-1)]/30 flex-shrink-0" />
          <div>
            <p className="text-[var(--text-caption)] text-[var(--text-2)] mb-0.5">Custo Total</p>
            <p className="text-[var(--text-heading)] font-bold font-mono text-[var(--text-2)]">{formatCurrency(totalCost)}</p>
          </div>
        </div>
      </ScrollableStrip>

      {/* ─── Smart Contribution (Elite) ──────────────────────── */}
      {portfolios && portfolios.length > 0 && (
        <SmartContribution />
      )}

      {/* Empty State */}
      {(!portfolios || portfolios.length === 0) && (
        <div className="py-16 text-center border border-dashed border-[var(--border-1)] rounded-[var(--radius)]">
          <div className="w-14 h-14 mx-auto mb-4 rounded-[var(--radius)] bg-[var(--accent-1)]/10 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--accent-1)]">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            </svg>
          </div>
          <h3 className="font-semibold mb-1">Comece em menos de 3 minutos</h3>
          <p className="text-[var(--text-small)] text-[var(--text-2)] mb-5 max-w-sm mx-auto">
            Adicione suas 3 principais ações ou use nossa carteira de exemplo para ver o diagnóstico completo.
          </p>
          <div className="flex items-center gap-3 justify-center">
            <Button onClick={() => setIsCreateModalOpen(true)} size="sm">
              Criar Carteira
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleCreateSamplePortfolio}
              disabled={isCreatingSample}
            >
              {isCreatingSample ? 'Criando...' : 'Usar carteira de exemplo'}
            </Button>
          </div>
        </div>
      )}

      {/* Portfolio Cards — ordenado: principal primeiro, depois por valor */}
      {portfolios && portfolios.length > 0 && (
        <motion.div
          className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
          variants={staggerContainer}
          initial="hidden"
          animate="show"
        >
          {[...portfolios]
            .sort((a, b) => {
              if (a.isDefault && !b.isDefault) return -1
              if (!a.isDefault && b.isDefault) return 1
              return b.totalValue - a.totalValue
            })
            .map((portfolio) => {
              const health = portfolio.avgAqScore
              const borderColor = health > 60
                ? 'border-[var(--pos)]/30'
                : health > 30
                  ? 'border-amber-500/30'
                  : 'border-[var(--neg)]/30'

              return (
                <motion.div key={portfolio.id} variants={fadeInUp}>
                <Link href={`/portfolio/${portfolio.id}`} className="group">
                  <div className={cn(
                    'h-full rounded-[var(--radius)] bg-[var(--surface-1)] p-5 transition-all group-hover:shadow-md border',
                    borderColor,
                    portfolio.isDefault && 'ring-1 ring-[var(--accent-1)]/30',
                  )}>
                    {/* Card Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-[var(--text-base)] font-semibold truncate group-hover:text-[var(--accent-1)] transition-colors">
                            {portfolio.name}
                          </h3>
                          {portfolio.isDefault && (
                            <span className="shrink-0 text-[9px] uppercase tracking-wider font-semibold text-[var(--accent-1)] bg-[var(--accent-1)]/10 px-1.5 py-0.5 rounded">
                              Principal
                            </span>
                          )}
                        </div>
                        <p className="text-[var(--text-caption)] text-[var(--text-2)] mt-0.5">
                          {portfolio.positionsCount} {portfolio.positionsCount === 1 ? 'posição' : 'posições'}
                        </p>
                      </div>
                      <ScoreBadge score={portfolio.avgAqScore} size="lg" showLabel />
                    </div>

                    {/* Value + Return */}
                    <div className="flex items-baseline gap-2 mb-3">
                      <span className="text-[var(--text-heading)] font-semibold font-mono">{formatCurrency(portfolio.totalValue)}</span>
                      <span className={cn(
                        'text-[var(--text-small)] font-mono',
                        portfolio.gainLossPercent >= 0 ? 'text-[var(--pos)]' : 'text-[var(--neg)]'
                      )}>
                        {portfolio.gainLossPercent >= 0 ? '+' : ''}{portfolio.gainLossPercent.toFixed(2)}%
                      </span>
                    </div>

                    {/* Top 3 posições com logos */}
                    {portfolio.topPositions && portfolio.topPositions.length > 0 && (
                      <div className="flex items-center gap-1.5 mt-2">
                        {portfolio.topPositions.map((p: { ticker: string; name: string }) => (
                          <AssetLogo key={p.ticker} ticker={p.ticker} size={22} />
                        ))}
                        {portfolio.positionsCount > 3 && (
                          <span className="text-[var(--text-caption)] text-[var(--text-2)] ml-1">
                            +{portfolio.positionsCount - 3}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Score bar */}
                    <div className="mt-3">
                      <ScoreBadge score={portfolio.avgAqScore} size="sm" showBar />
                    </div>
                  </div>
                </Link>
                </motion.div>
              )
            })}

          {/* New Portfolio Card */}
          <motion.div variants={fadeInUp}>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="h-full min-h-[160px] border border-dashed border-[var(--border-1)] rounded-[var(--radius)] transition-colors hover:border-[var(--accent-1)]/30 group"
          >
            <div className="flex flex-col items-center justify-center h-full text-[var(--text-2)] group-hover:text-[var(--accent-1)] transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mb-2">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span className="text-[var(--text-small)] font-medium">Nova Carteira</span>
            </div>
          </button>
          </motion.div>
        </motion.div>
      )}

      {/* Create Portfolio Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Nova Carteira"
      >
        <div className="space-y-4">
          <p className="text-[13px] text-[var(--text-2)]">
            Adicione suas 3 principais ações para começar a ver o diagnóstico completo.
          </p>
          <div>
            <label className="block text-[var(--text-small)] font-medium mb-1.5">Nome da Carteira</label>
            <Input
              value={newPortfolioName}
              onChange={(e) => setNewPortfolioName(e.target.value)}
              placeholder="Ex: Carteira Principal, Dividendos..."
              autoFocus
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-2 justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCreateSamplePortfolio}
              disabled={isCreatingSample || createPortfolio.isPending}
            >
              {isCreatingSample ? 'Criando...' : 'Usar carteira de exemplo'}
            </Button>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setIsCreateModalOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleCreatePortfolio}
                disabled={!newPortfolioName.trim() || createPortfolio.isPending}
              >
                {createPortfolio.isPending ? 'Criando...' : 'Criar'}
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}
