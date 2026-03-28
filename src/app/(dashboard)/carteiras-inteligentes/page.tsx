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

const CVM_DISCLAIMER = `As Carteiras Inteligentes são seleções algorítmicas baseadas em critérios quantitativos públicos (dados CVM e B3). Não constituem recomendação de investimento, análise de valores mobiliários, ou consultoria financeira nos termos da Resolução CVM 20/2021. O InvestIQ não é registrado como analista ou consultor de valores mobiliários. Decisões de investimento são de responsabilidade exclusiva do investidor. Critérios completos disponíveis em cada carteira.`

export default function CarteirasInteligentesPage() {
  const { token } = useAuth()

  const { data: topAcoes, isLoading: loadTop } = useQuery({
    queryKey: ['smart-portfolio', 'top-acoes'],
    queryFn: () => pro.getScreener({ min_score: 65, limit: 15 }, token ?? undefined),
    enabled: !!token,
    staleTime: 10 * 60 * 1000,
  })

  const { data: dividendos, isLoading: loadDiv } = useQuery({
    queryKey: ['smart-portfolio', 'dividendos'],
    queryFn: () => pro.getScreener({ min_score: 60, limit: 12 }, token ?? undefined),
    enabled: !!token,
    staleTime: 10 * 60 * 1000,
  })

  const { data: valor, isLoading: loadVal } = useQuery({
    queryKey: ['smart-portfolio', 'valor'],
    queryFn: () => pro.getScreener({ min_score: 60, limit: 10 }, token ?? undefined),
    enabled: !!token,
    staleTime: 10 * 60 * 1000,
  })

  const isLoading = loadTop || loadDiv || loadVal

  const portfolios = useMemo(() => {
    const configs = [
      {
        id: 'top-acoes',
        name: 'Top Ações',
        description: 'Ações com as melhores notas no IQ-Score, reunindo fundamentos sólidos e bom potencial de valorização.',
        data: topAcoes,
      },
      {
        id: 'dividendos',
        name: 'Foco em Dividendos',
        description: 'Seleção de ações com histórico consistente de distribuição de proventos e dividend yield atrativo.',
        data: dividendos,
      },
      {
        id: 'valor',
        name: 'Ações com Desconto',
        description: 'Ações negociando abaixo do preço justo estimado, com desconto favorável ao investidor.',
        data: valor,
      },
    ]

    return configs.map(cfg => {
      const results = cfg.data?.results ?? []
      const avgScore = results.length > 0
        ? Math.round(results.reduce((s, r) => s + r.iq_score, 0) / results.length)
        : 0
      const avgDY = results.length > 0
        ? (results.reduce((s, r) => s + (r.dividend_yield_proj ?? 0), 0) / results.length)
        : 0

      return {
        id: cfg.id,
        name: cfg.name,
        description: cfg.description,
        stockCount: results.length,
        topStocks: results.slice(0, 5).map(r => ({
          ticker: r.ticker,
          score: r.iq_score,
        })),
        avgScore,
        avgDY: (avgDY * 100).toFixed(1),
      }
    })
  }, [topAcoes, dividendos, valor])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-[var(--text-title)] font-bold tracking-tight">
          Carteiras Inteligentes
        </h1>
        <p className="text-[var(--text-small)] text-[var(--text-2)] mt-0.5">
          Seleções automáticas com critérios 100% quantitativos e transparentes
        </p>
      </div>

      <PaywallGate requiredPlan="pro" feature="Carteiras Inteligentes" showPreview>
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-64 rounded-[var(--radius)]" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {portfolios.map(portfolio => (
              <Card key={portfolio.id} hover className="h-full">
                <CardContent className="p-5 flex flex-col h-full">
                  {/* Nome e quantidade de ativos */}
                  <div className="mb-3">
                    <h3 className="font-semibold text-[var(--text-1)]">
                      {portfolio.name}
                    </h3>
                    <span className="text-[var(--text-caption)] text-[var(--text-3)]">
                      {portfolio.stockCount} {portfolio.stockCount === 1 ? 'ativo' : 'ativos'}
                    </span>
                  </div>

                  {/* Descrição */}
                  <p className="text-[var(--text-caption)] text-[var(--text-2)] leading-relaxed mb-3 flex-1">
                    {portfolio.description}
                  </p>

                  {/* Indicadores */}
                  <div className="flex items-center gap-4 mb-3 py-2 border-y border-[var(--border-1)]/30">
                    <div>
                      <p className="text-[var(--text-caption)] text-[var(--text-3)]">IQ Médio</p>
                      <p className={cn('font-mono font-bold', portfolio.avgScore >= 65 ? 'text-[var(--pos)]' : 'text-[var(--text-1)]')}>
                        {portfolio.avgScore}
                      </p>
                    </div>
                    <div>
                      <p className="text-[var(--text-caption)] text-[var(--text-3)]">DY Projetado</p>
                      <p className="font-mono font-bold text-[var(--text-1)]">{portfolio.avgDY}%</p>
                    </div>
                  </div>

                  {/* Principais ações */}
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
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[var(--text-caption)] text-[var(--text-3)] italic">
                      Nenhuma ação qualificada no momento
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Aviso CVM */}
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
