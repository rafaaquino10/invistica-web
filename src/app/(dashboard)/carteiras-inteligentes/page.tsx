'use client'

import Link from 'next/link'
import { Card, CardContent, Skeleton, Disclaimer } from '@/components/ui'
import { PaywallGate } from '@/components/billing'
import { cn } from '@/lib/utils'

const CVM_DISCLAIMER = `As Carteiras Inteligentes são seleções algorítmicas baseadas em critérios quantitativos públicos (dados CVM e B3). Não constituem recomendação de investimento, análise de valores mobiliários, ou consultoria financeira nos termos da Resolução CVM 20/2021. O InvestIQ não é registrado como analista ou consultor de valores mobiliários. Decisões de investimento são de responsabilidade exclusiva do investidor. Critérios completos disponíveis em cada carteira.`

export default function CarteirasInteligentesPage() {
  const portfolios = [
    {
      id: 'conservador',
      name: 'Conservador',
      description: 'Foco em valuation, qualidade e risco. Inverse volatility, sem alavancagem.',
      emoji: '🛡️',
      mandate: 'CONSERVADOR',
      targetPositions: '12-15 ativos',
      rebalance: 'Trimestral',
      topStocks: [
        { ticker: 'BBSE3', weight: 17.1 },
        { ticker: 'ITUB4', weight: 12.3 },
        { ticker: 'WEGE3', weight: 10.5 },
        { ticker: 'ELET3', weight: 9.8 },
        { ticker: 'BBDC4', weight: 8.2 },
      ],
      metrics: { cagr: '+15.0%', sharpe: '0.73', maxDD: '-34.8%' },
    },
    {
      id: 'equilibrado',
      name: 'Equilibrado',
      description: 'Pesos balanceados entre pilares. Black-Litterman, sem alavancagem.',
      emoji: '⚖️',
      mandate: 'EQUILIBRADO',
      targetPositions: '10-12 ativos',
      rebalance: 'Trimestral',
      topStocks: [
        { ticker: 'PRIO3', weight: 15.0 },
        { ticker: 'VALE3', weight: 12.8 },
        { ticker: 'ITUB4', weight: 11.0 },
        { ticker: 'WEGE3', weight: 10.2 },
        { ticker: 'RENT3', weight: 9.5 },
      ],
      metrics: { cagr: '+16.7%', sharpe: '0.78', maxDD: '-32.8%' },
    },
    {
      id: 'arrojado',
      name: 'Arrojado',
      description: 'Foco em growth e momentum. Concentração moderada + alavancagem regime-dependente.',
      emoji: '🚀',
      mandate: 'ARROJADO',
      targetPositions: '8-10 ativos',
      rebalance: 'Trimestral',
      topStocks: [
        { ticker: 'PRIO3', weight: 18.0 },
        { ticker: 'MGLU3', weight: 14.5 },
        { ticker: 'QUAL3', weight: 13.0 },
        { ticker: 'VALE3', weight: 12.0 },
        { ticker: 'WEGE3', weight: 10.5 },
      ],
      metrics: { cagr: '+17.9%', sharpe: '0.75', maxDD: '-40.0%' },
    },
  ]
  const isLoading = false

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-[var(--text-title)] font-bold tracking-tight">
          Carteiras Inteligentes
        </h1>
        <p className="text-[var(--text-small)] text-[var(--text-2)] mt-0.5">
          Seleções algorítmicas com critérios 100% transparentes e quantitativos
        </p>
      </div>

      <PaywallGate requiredPlan="pro" feature="Carteiras Inteligentes" showPreview>
        {/* Portfolio Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5].map(i => (
              <Skeleton key={i} className="h-52 rounded-[var(--radius)]" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {portfolios?.map(portfolio => (
              <Link
                key={portfolio.id}
                href={`/carteiras-inteligentes/${portfolio.id}` as any}
              >
                <Card hover className="h-full">
                  <CardContent className="p-5 flex flex-col h-full">
                    {/* Icon + Name */}
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-[var(--text-heading)]">{portfolio.icon}</span>
                      <div>
                        <h3 className="font-semibold text-[var(--text-1)]">
                          {portfolio.name}
                        </h3>
                        <span className="text-[var(--text-caption)] text-[var(--text-3)]">
                          {portfolio.stockCount}/{portfolio.maxStocks} ações
                        </span>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-[var(--text-caption)] text-[var(--text-2)] leading-relaxed mb-4 flex-1">
                      {portfolio.description}
                    </p>

                    {/* Top Stocks Preview */}
                    {portfolio.topStocks.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {portfolio.topStocks.map((stock: any) => (
                          <span
                            key={stock.ticker}
                            className={cn(
                              'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[var(--text-caption)]',
                              'bg-[var(--surface-2)] text-[var(--text-2)]',
                            )}
                          >
                            <span className="font-medium">{stock.ticker}</span>
                            <span className="text-[var(--text-3)]">
                              {stock.lensScore.toFixed(0)}
                            </span>
                          </span>
                        ))}
                        {portfolio.stockCount > 3 && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[var(--text-caption)] text-[var(--text-3)]">
                            +{portfolio.stockCount - 3}
                          </span>
                        )}
                      </div>
                    ) : (
                      <p className="text-[var(--text-caption)] text-[var(--text-3)] italic">
                        Nenhuma ação qualificada
                      </p>
                    )}
                  </CardContent>
                </Card>
              </Link>
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
