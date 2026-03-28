'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { Card, CardContent, Skeleton, Disclaimer } from '@/components/ui'
import { PaywallGate } from '@/components/billing'
import { cn } from '@/lib/utils'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/hooks/use-auth'
import { pro } from '@/lib/api/endpoints'
import { AssetLogo } from '@/components/ui/asset-logo'
import { formatCurrency } from '@/lib/utils/formatters'

const CVM_DISCLAIMER = `As Carteiras Inteligentes são seleções algorítmicas baseadas em critérios quantitativos públicos (dados CVM e B3). Não constituem recomendação de investimento, análise de valores mobiliários, ou consultoria financeira nos termos da Resolução CVM 20/2021. O InvestIQ não é registrado como analista ou consultor de valores mobiliários. Decisões de investimento são de responsabilidade exclusiva do investidor. Critérios completos disponíveis em cada carteira.`

const MANDATE_META: Record<string, { emoji: string; description: string; targetPositions: string; sizing: string }> = {
  CONSERVADOR: {
    emoji: '🛡️',
    description: 'Foco em valuation, qualidade e baixo risco. Inverse volatility, sem alavancagem.',
    targetPositions: '12-15 ativos',
    sizing: 'Inverse Volatility',
  },
  EQUILIBRADO: {
    emoji: '⚖️',
    description: 'Pesos balanceados entre pilares quantitativo, qualitativo e valuation. Black-Litterman.',
    targetPositions: '10-12 ativos',
    sizing: 'Black-Litterman',
  },
  ARROJADO: {
    emoji: '🚀',
    description: 'Foco em growth e momentum. Concentração moderada, alavancagem regime-dependente.',
    targetPositions: '8-10 ativos',
    sizing: 'Conviction-Weighted',
  },
}

export default function CarteirasInteligentesPage() {
  const { token } = useAuth()

  // Fetch top picks for each mandate from the real IQ-Cognit engine
  const { data: conservador, isLoading: loadC } = useQuery({
    queryKey: ['smart-portfolio', 'CONSERVADOR'],
    queryFn: () => pro.getScreener({ min_score: 60, limit: 15 }, token ?? undefined),
    enabled: !!token,
    staleTime: 10 * 60 * 1000,
  })

  const { data: equilibrado, isLoading: loadE } = useQuery({
    queryKey: ['smart-portfolio', 'EQUILIBRADO'],
    queryFn: () => pro.getScreener({ min_score: 60, limit: 12 }, token ?? undefined),
    enabled: !!token,
    staleTime: 10 * 60 * 1000,
  })

  const { data: arrojado, isLoading: loadA } = useQuery({
    queryKey: ['smart-portfolio', 'ARROJADO'],
    queryFn: () => pro.getScreener({ min_score: 60, limit: 10 }, token ?? undefined),
    enabled: !!token,
    staleTime: 10 * 60 * 1000,
  })

  const isLoading = loadC || loadE || loadA

  const portfolios = useMemo(() => {
    const mandates = [
      { key: 'CONSERVADOR', label: 'Conservador', data: conservador },
      { key: 'EQUILIBRADO', label: 'Equilibrado', data: equilibrado },
      { key: 'ARROJADO', label: 'Arrojado', data: arrojado },
    ] as const

    return mandates.map(m => {
      const results = m.data?.results ?? []
      const meta = MANDATE_META[m.key]!
      const avgScore = results.length > 0
        ? Math.round(results.reduce((s, r) => s + r.iq_score, 0) / results.length)
        : 0
      const avgMargin = results.length > 0
        ? (results.reduce((s, r) => s + (r.safety_margin ?? 0), 0) / results.length)
        : 0
      const avgDY = results.length > 0
        ? (results.reduce((s, r) => s + (r.dividend_yield_proj ?? 0), 0) / results.length)
        : 0

      return {
        id: m.key.toLowerCase(),
        name: m.label,
        
        emoji: meta.emoji,
        description: meta.description,
        targetPositions: meta.targetPositions,
        sizing: meta.sizing,
        stockCount: results.length,
        topStocks: results.slice(0, 5).map(r => ({
          ticker: r.ticker,
          score: r.iq_score,
          rating: r.rating_label,
        })),
        metrics: {
          avgScore,
          avgMargin: avgMargin.toFixed(1),
          avgDY: (avgDY * 100).toFixed(1),
        },
      }
    })
  }, [conservador, equilibrado, arrojado])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-[var(--text-title)] font-bold tracking-tight">
          Carteiras Inteligentes
        </h1>
        <p className="text-[var(--text-small)] text-[var(--text-2)] mt-0.5">
          Seleções algorítmicas do IQ-Cognit com critérios 100% transparentes e quantitativos
        </p>
      </div>

      <PaywallGate requiredPlan="pro" feature="Carteiras Inteligentes" showPreview>
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-72 rounded-[var(--radius)]" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {portfolios.map(portfolio => (
              <Card key={portfolio.id} hover className="h-full">
                <CardContent className="p-5 flex flex-col h-full">
                  {/* Icon + Name */}
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-[var(--text-heading)]">{portfolio.emoji}</span>
                    <div>
                      <h3 className="font-semibold text-[var(--text-1)]">
                        {portfolio.name}
                      </h3>
                      <span className="text-[var(--text-caption)] text-[var(--text-3)]">
                        {portfolio.stockCount} ativos qualificados · {portfolio.sizing}
                      </span>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-[var(--text-caption)] text-[var(--text-2)] leading-relaxed mb-3 flex-1">
                    {portfolio.description}
                  </p>

                  {/* Real Metrics */}
                  <div className="grid grid-cols-3 gap-2 mb-3 py-2 border-y border-[var(--border-1)]/30">
                    <div className="text-center">
                      <p className="text-[var(--text-caption)] text-[var(--text-3)]">IQ Médio</p>
                      <p className={cn('font-mono font-bold', portfolio.metrics.avgScore >= 65 ? 'text-[var(--pos)]' : 'text-[var(--text-1)]')}>
                        {portfolio.metrics.avgScore}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-[var(--text-caption)] text-[var(--text-3)]">Margem</p>
                      <p className="font-mono font-bold text-[var(--accent-1)]">{portfolio.metrics.avgMargin}%</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[var(--text-caption)] text-[var(--text-3)]">DY Proj.</p>
                      <p className="font-mono font-bold text-[var(--text-1)]">{portfolio.metrics.avgDY}%</p>
                    </div>
                  </div>

                  {/* Top Stocks (real data) */}
                  {portfolio.topStocks.length > 0 ? (
                    <div className="space-y-1.5">
                      {portfolio.topStocks.map(stock => (
                        <Link
                          key={stock.ticker}
                          href={`/ativo/${stock.ticker}`}
                          className="flex items-center gap-2 py-1 hover:bg-[var(--surface-2)] rounded px-1.5 -mx-1.5 transition-colors"
                        >
                          <AssetLogo ticker={stock.ticker} size={20} />
                          <span className="font-mono font-medium text-[var(--text-small)]">{stock.ticker}</span>
                          <span className="flex-1" />
                          <span className={cn(
                            'font-mono text-[var(--text-caption)] font-bold',
                            stock.score >= 75 ? 'text-[var(--pos)]' : stock.score >= 60 ? 'text-[var(--accent-1)]' : 'text-[var(--text-2)]'
                          )}>
                            {stock.score}
                          </span>
                          <span className="text-[var(--text-caption)] text-[var(--text-3)]">{stock.rating}</span>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[var(--text-caption)] text-[var(--text-3)] italic">
                      Nenhuma ação qualificada
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* CVM Disclaimer */}
        <div className="mt-6 p-4 rounded-lg bg-[var(--surface-2)]/50 border border-[var(--border-1)]">
          <p className="text-[var(--text-caption)] text-[var(--text-3)] leading-relaxed">
            {CVM_DISCLAIMER}
          </p>
          <Disclaimer variant="inline" className="block mt-1" />
        </div>
      </PaywallGate>
    </div>
  )
}
