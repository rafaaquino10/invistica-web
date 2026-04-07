'use client'

import { use } from 'react'
import Link from 'next/link'
import { Card, CardContent, Skeleton, Badge } from '@/components/ui'
import { trpc } from '@/lib/trpc/client'
import { PaywallGate } from '@/components/billing'
import { AssetLogo } from '@/components/ui/asset-logo'
import { cn } from '@/lib/utils'
import { IncomeSimulatorCard } from '@/components/smart-portfolios/income-simulator'
import type { AlmostQualified } from '@/lib/smart-portfolios/types'

const CVM_DISCLAIMER = `As Carteiras Inteligentes são seleções algorítmicas baseadas em critérios quantitativos públicos (dados CVM e B3). Não constituem recomendação de investimento, análise de valores mobiliários, ou consultoria financeira nos termos da Resolução CVM 20/2021. O InvestIQ não é registrado como analista ou consultor de valores mobiliários. Decisões de investimento são de responsabilidade exclusiva do investidor.`

function formatCriteria(criteria: Record<string, unknown>): string[] {
  const labels: string[] = []
  if (criteria['minScore']) labels.push(`Score min: ${criteria['minScore']}`)
  if (criteria['minLensScore']) {
    const ls = criteria['minLensScore'] as { lens: string; min: number }
    labels.push(`${ls.lens} min: ${ls.min}`)
  }
  if (criteria['minROE']) labels.push(`ROE min: ${criteria['minROE']}%`)
  if (criteria['maxDivEbitda'] != null) labels.push(`Div/EBITDA max: ${criteria['maxDivEbitda']}x`)
  if (criteria['minDY']) labels.push(`DY min: ${criteria['minDY']}%`)
  if (criteria['maxDY']) labels.push(`DY max: ${criteria['maxDY']}%`)
  if (criteria['minConfidence']) labels.push(`Confiança min: ${criteria['minConfidence']}%`)
  return labels
}

// ─── Seção: Quase Qualificados ────────────────────────────────

function QuaseQualificadosSection({ ativos }: { ativos: AlmostQualified[] }) {
  if (ativos.length === 0) return null

  return (
    <div className="space-y-3">
      {/* Título da seção */}
      <div className="flex items-center gap-2">
        <span className="text-[var(--text-small)] font-semibold text-[var(--text-1)]">
          Quase Qualificados
        </span>
        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[var(--text-caption)] font-medium bg-amber-500/10 text-amber-500 border border-amber-500/20">
          {ativos.length} ativo{ativos.length !== 1 ? 's' : ''}
        </span>
      </div>
      <p className="text-[var(--text-caption)] text-[var(--text-3)]">
        Ativos que faltam apenas 1–2 critérios para entrar nesta carteira. Monitore-os para possível inclusão futura.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {ativos.map(ativo => (
          <Card key={ativo.ticker} className="border border-amber-500/20 bg-amber-500/5">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                {/* Ativo info */}
                <Link
                  href={`/ativo/${ativo.ticker}` as any}
                  className="flex items-center gap-2 hover:text-[var(--accent-1)] transition-colors min-w-0"
                >
                  <AssetLogo ticker={ativo.ticker} size={32} />
                  <div className="min-w-0">
                    <span className="font-medium text-[var(--text-1)] text-[var(--text-small)] block">{ativo.ticker}</span>
                    <span className="text-[var(--text-caption)] text-[var(--text-3)] truncate block max-w-[120px]">{ativo.name}</span>
                  </div>
                </Link>

                {/* Score */}
                <div className="text-right shrink-0">
                  <span className={cn(
                    'text-[var(--text-small)] font-semibold',
                    ativo.score >= 70 ? 'text-green-500' : ativo.score >= 50 ? 'text-amber-500' : 'text-red-500'
                  )}>
                    {ativo.score.toFixed(0)}
                  </span>
                  <span className="text-[var(--text-caption)] text-[var(--text-3)] block">score</span>
                </div>
              </div>

              {/* Critérios faltando */}
              <div className="mt-3 space-y-1">
                {ativo.criteriosFaltando.map((criterio, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-1.5 text-[var(--text-caption)] text-amber-600 dark:text-amber-400"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="11"
                      height="11"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="shrink-0"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    <span>{criterio}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

// ─── Página principal ─────────────────────────────────────────

export default function SmartPortfolioDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const { data: portfolio, isLoading } = trpc.smartPortfolios.detail.useQuery({ portfolioId: id })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
        <Skeleton className="h-96 rounded-[var(--radius)]" />
      </div>
    )
  }

  if (!portfolio) {
    return (
      <div className="space-y-6">
        <h1 className="font-display text-[var(--text-title)] font-bold tracking-tight">Carteira não encontrada</h1>
        <Link href="/carteiras-inteligentes" className="text-[var(--text-small)] text-[var(--accent-1)] hover:underline">
          Voltar para Carteiras Inteligentes
        </Link>
      </div>
    )
  }

  const criteriaLabels = formatCriteria(portfolio.criteria as Record<string, unknown>)
  const temAtivos = portfolio.stocks.length > 0
  // closest pode ser undefined se a query for de uma versão anterior do router sem este campo
  const closest: AlmostQualified[] = (portfolio as any).closest ?? []
  const regime = (portfolio as any).regime as {
    current: string; label: string; emoji: string; color: string
    calibrationActive: boolean; rationale: string | null
  } | undefined

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-[var(--text-caption)] text-[var(--text-3)]">
        <Link href="/carteiras-inteligentes" className="hover:text-[var(--text-2)]">
          Carteiras Inteligentes
        </Link>
        <span>/</span>
        <span className="text-[var(--text-2)]">{portfolio.name}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <span className="text-[var(--text-display)]">{portfolio.icon}</span>
          <div>
            <h1 className="font-display text-[var(--text-title)] font-bold tracking-tight">{portfolio.name}</h1>
            <p className="text-[var(--text-small)] text-[var(--text-2)] mt-1">{portfolio.description}</p>
            <div className="flex flex-wrap gap-1.5 mt-3">
              {criteriaLabels.map((label, i) => (
                <span
                  key={i}
                  className="inline-flex px-2 py-0.5 rounded-md text-[var(--text-caption)] font-medium bg-[var(--surface-2)] text-[var(--text-2)] border border-[var(--border-1)]"
                >
                  {label}
                </span>
              ))}
            </div>

            {/* Badge de Regime Macro */}
            {regime && (
              <div className="mt-3 flex items-start gap-2 p-2.5 rounded-lg border border-[var(--border-1)] bg-[var(--surface-2)]/50">
                <span className="text-[var(--text-body)] leading-none">{regime.emoji}</span>
                <div className="min-w-0">
                  <p className="text-[var(--text-caption)] font-semibold" style={{ color: regime.color }}>
                    Regime Atual: {regime.label}
                  </p>
                  <p className="text-[var(--text-caption)] text-[var(--text-3)] mt-0.5">
                    {regime.rationale ?? 'Critérios padrão ativos para este regime.'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Botão Gerar Carteira */}
        <button
          disabled={!temAtivos}
          title={temAtivos ? 'Carteira gerada pelo algoritmo' : 'Sem ativos qualificados no momento'}
          className={cn(
            'shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-lg text-[var(--text-small)] font-medium transition-colors',
            temAtivos
              ? 'bg-[var(--accent-1)] text-white hover:opacity-90'
              : 'bg-[var(--surface-2)] text-[var(--text-3)] cursor-not-allowed opacity-60',
          )}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
          Gerar Carteira
        </button>
      </div>

      <PaywallGate requiredPlan="pro" feature="Carteiras Inteligentes" showPreview>
        {/* Income Simulator (only for passive-income) */}
        {portfolio.id === 'passive-income' && (
          <IncomeSimulatorCard />
        )}

        {/* Tabela de ativos qualificados */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              <table className="w-full text-[var(--text-small)]">
                <colgroup>
                  <col className="w-9" />
                  <col className="w-auto" />
                  <col className="w-auto" />
                  <col style={{ width: '90px' }} />
                  <col style={{ width: '65px' }} />
                  <col style={{ width: '65px' }} />
                  <col style={{ width: '65px' }} />
                  <col style={{ width: '65px' }} />
                  <col style={{ width: '65px' }} />
                  <col style={{ width: '80px' }} />
                </colgroup>
                <thead>
                  <tr className="border-b border-[var(--border-1)] text-[var(--text-3)] text-[var(--text-caption)]">
                    <th className="text-left py-2.5 px-3 font-medium">#</th>
                    <th className="text-left py-2.5 px-2 font-medium">Ativo</th>
                    <th className="text-left py-2.5 px-2 font-medium">Setor</th>
                    <th className="text-right py-2.5 px-2 font-medium">Cotacao</th>
                    <th className="text-right py-2.5 px-2 font-medium">Score</th>
                    <th className="text-right py-2.5 px-2 font-medium">Lens</th>
                    <th className="text-right py-2.5 px-2 font-medium">DY</th>
                    <th className="text-right py-2.5 px-2 font-medium">P/L</th>
                    <th className="text-right py-2.5 px-2 font-medium">ROE</th>
                    <th className="text-right py-2.5 px-3 font-medium">Div/EBITDA</th>
                  </tr>
                </thead>
                <tbody>
                  {portfolio.stocks.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-16 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-12 h-12 rounded-[var(--radius)] bg-[var(--accent-1)]/10 flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--accent-1)]">
                              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                            </svg>
                          </div>
                          <p className="text-[var(--text-small)] font-medium text-[var(--text-2)]">
                            Nenhum ativo qualificado agora
                          </p>
                          <p className="text-[var(--text-caption)] text-[var(--text-3)] max-w-sm">
                            Os critérios desta carteira são exigentes. Revise periodicamente — ações entram e saem conforme publicam resultados.
                          </p>
                          <Link
                            href="/explorer"
                            className="mt-2 px-4 py-1.5 rounded-lg text-[var(--text-small)] font-medium bg-[var(--accent-1)]/10 text-[var(--accent-1)] hover:bg-[var(--accent-1)]/20 transition-colors"
                          >
                            Ver Explorer
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    portfolio.stocks.map(stock => (
                      <tr
                        key={stock.ticker}
                        className="border-b border-[var(--border-1)] hover:bg-[var(--surface-2)]/30 transition-colors"
                      >
                        <td className="py-3 px-3 text-[var(--text-3)] text-[var(--text-caption)] font-mono">
                          {stock.rank}
                        </td>
                        <td className="py-3 px-2">
                          <Link
                            href={`/ativo/${stock.ticker}` as any}
                            className="flex items-center gap-2 hover:text-[var(--accent-1)] transition-colors"
                          >
                            <AssetLogo ticker={stock.ticker} size={24} />
                            <div>
                              <span className="font-medium text-[var(--text-1)]">{stock.ticker}</span>
                              <span className="block text-[10px] text-[var(--text-3)] max-w-[120px] truncate leading-tight">
                                {stock.name}
                              </span>
                            </div>
                          </Link>
                        </td>
                        <td className="py-3 px-2 text-[var(--text-caption)] text-[var(--text-2)] max-w-[100px] truncate">
                          {stock.sector}
                        </td>
                        <td className="py-3 px-2 text-right font-mono text-[var(--text-1)]">
                          R$ {stock.price.toFixed(2)}
                        </td>
                        <td className="py-3 px-2 text-right">
                          <span className={cn(
                            'font-semibold',
                            stock.score >= 70 ? 'text-green-500' : stock.score >= 50 ? 'text-amber-500' : 'text-red-500'
                          )}>
                            {stock.score.toFixed(1)}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-right font-mono text-[var(--text-2)]">
                          {stock.lensScore.toFixed(1)}
                        </td>
                        <td className="py-3 px-2 text-right font-mono text-[var(--text-2)]">
                          {stock.dy != null ? `${stock.dy.toFixed(1)}%` : '—'}
                        </td>
                        <td className="py-3 px-2 text-right font-mono text-[var(--text-2)]">
                          {stock.peRatio != null ? `${stock.peRatio.toFixed(1)}x` : '—'}
                        </td>
                        <td className="py-3 px-2 text-right font-mono text-[var(--text-2)]">
                          {stock.roe != null ? `${stock.roe.toFixed(1)}%` : '—'}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-[var(--text-2)]">
                          {stock.divEbitda != null ? `${stock.divEbitda.toFixed(1)}x` : '—'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Seção de quase qualificados (exibida somente quando há poucos ativos qualificados) */}
        {closest.length > 0 && (
          <QuaseQualificadosSection ativos={closest} />
        )}

        {/* Critérios de Saída */}
        {portfolio.exitCriteria.length > 0 && (
          <Card>
            <CardContent className="p-5">
              <h3 className="text-[var(--text-small)] font-semibold text-[var(--text-1)] mb-3">
                Critérios de Saída
              </h3>
              <p className="text-[var(--text-caption)] text-[var(--text-3)] mb-3">
                Sinais que indicam quando reavaliar ou sair de uma posição desta carteira:
              </p>
              <ul className="space-y-2">
                {portfolio.exitCriteria.map((ec, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-amber-500 mt-0.5">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                        <line x1="12" y1="9" x2="12" y2="13" />
                        <line x1="12" y1="17" x2="12.01" y2="17" />
                      </svg>
                    </span>
                    <span className="text-[var(--text-caption)] text-[var(--text-2)]">{ec.description}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Aviso legal CVM */}
        <div className="p-4 rounded-lg bg-[var(--surface-2)]/50 border border-[var(--border-1)]">
          <p className="text-[var(--text-caption)] text-[var(--text-3)] leading-relaxed">
            {CVM_DISCLAIMER}
          </p>
        </div>
      </PaywallGate>
    </div>
  )
}
