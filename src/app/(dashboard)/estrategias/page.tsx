'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, Skeleton, Disclaimer } from '@/components/ui'
import { trpc } from '@/lib/trpc/client'
import { PaywallGate } from '@/components/billing'
import { cn } from '@/lib/utils'
type Tab = 'carteiras' | 'alocacao' | 'shorts'

export default function EstrategiasPage() {
  const [tab, setTab] = useState<Tab>('carteiras')

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <p className="text-[var(--text-caption)] font-bold text-[var(--accent-1)] uppercase tracking-[0.12em]">IQ-Cognit Strategy Engine</p>
        <h1 className="font-display text-[var(--text-title)] font-bold tracking-tight">
          Estratégias IQ
        </h1>
        <p className="text-[var(--text-small)] text-[var(--text-2)] mt-0.5">
          Seleções algorítmicas, alocação ótima e oportunidades de short — tudo baseado no motor IQ-Cognit
        </p>
      </div>

      {/* Tab Bar */}
      <div className="flex gap-1 bg-[var(--surface-2)] rounded-lg p-0.5 w-fit">
        <TabButton active={tab === 'carteiras'} onClick={() => setTab('carteiras')}>Carteiras IQ</TabButton>
        <TabButton active={tab === 'alocacao'} onClick={() => setTab('alocacao')}>Alocação Ótima</TabButton>
        <TabButton active={tab === 'shorts'} onClick={() => setTab('shorts')}>Short Candidates</TabButton>
      </div>

      <PaywallGate requiredPlan="pro" feature="Estratégias IQ" showPreview>
        {tab === 'carteiras' && <CarteirasTab />}
        {tab === 'alocacao' && <AlocacaoTab />}
        {tab === 'shorts' && <ShortsTab />}

        <div className="mt-6 p-4 rounded-lg bg-[var(--surface-2)]/50 border border-[var(--border-1)]">
          <Disclaimer variant="footer" />
        </div>
      </PaywallGate>
    </div>
  )
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'px-4 py-2 text-[var(--text-small)] font-semibold rounded-md transition-colors',
        active ? 'bg-[var(--surface-1)] text-[var(--text-1)] shadow-sm' : 'text-[var(--text-3)] hover:text-[var(--text-1)]'
      )}
    >
      {children}
    </button>
  )
}

// ─── Tab: Carteiras IQ (migrado de /carteiras-inteligentes) ────────
function CarteirasTab() {
  const { data: portfolios, isLoading } = trpc.smartPortfolios.list.useQuery()

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5].map(i => (
          <Skeleton key={i} className="h-52 rounded-[var(--radius)]" />
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {portfolios?.map(portfolio => (
        <Link
          key={portfolio.id}
          href={`/estrategias/${portfolio.id}` as any}
        >
          <Card hover className="h-full">
            <CardContent className="p-5 flex flex-col h-full">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-[var(--text-heading)]">{portfolio.icon}</span>
                <div>
                  <h3 className="font-semibold text-[var(--text-1)]">{portfolio.name}</h3>
                  <span className="text-[var(--text-caption)] text-[var(--text-3)]">
                    {portfolio.stockCount}/{portfolio.maxStocks} ações
                  </span>
                </div>
              </div>
              <p className="text-[var(--text-caption)] text-[var(--text-2)] leading-relaxed mb-4 flex-1">
                {portfolio.description}
              </p>
              {portfolio.topStocks.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {portfolio.topStocks.map(stock => (
                    <span
                      key={stock.ticker}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[var(--text-caption)] bg-[var(--surface-2)] text-[var(--text-2)]"
                    >
                      <span className="font-medium">{stock.ticker}</span>
                      <span className="text-[var(--text-3)]">{stock.lensScore.toFixed(0)}</span>
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
  )
}

// ─── Tab: Alocação Ótima (migrado do StrategyHub) ─────────────────
function AlocacaoTab() {
  const { data, isLoading } = trpc.backtest.portfolioRecommendation.useQuery(undefined, {
    staleTime: 15 * 60 * 1000,
  })

  if (isLoading) {
    return (
      <div className="border border-[var(--border-1)] rounded-[var(--radius)] shadow-sm bg-[var(--surface-1)] p-6 animate-pulse">
        <div className="h-4 w-48 bg-[var(--surface-2)] rounded mb-4" />
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-10 bg-[var(--surface-2)] rounded" />)}</div>
      </div>
    )
  }

  if (!data?.available || !data.positions?.length) {
    return (
      <div className="border border-[var(--border-1)]/30 rounded-[var(--radius)] bg-[var(--surface-1)] p-8 text-center">
        <p className="text-[var(--text-body)] text-[var(--text-2)]">Recomendação de alocação indisponível no momento.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Rationale */}
      {data.rationale && (
        <div className="p-4 border border-[var(--border-1)] rounded-[var(--radius)] bg-[var(--surface-1)]">
          <p className="text-[var(--text-body)] text-[var(--text-1)] leading-relaxed">{data.rationale}</p>
        </div>
      )}

      {/* Positions table */}
      <div className="border border-[var(--border-1)] rounded-[var(--radius)] shadow-sm bg-[var(--surface-1)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[var(--text-small)]">
            <thead>
              <tr className="border-b border-[var(--border-1)] text-[var(--text-3)]">
                <th className="text-left p-3 font-semibold">Ativo</th>
                <th className="text-right p-3 font-semibold">IQ Score</th>
                <th className="text-right p-3 font-semibold">Peso</th>
                <th className="text-left p-3 font-semibold">Racional</th>
              </tr>
            </thead>
            <tbody>
              {data.positions.map((p: { ticker: string; weight: number; iq_score: number; rationale: string }) => (
                <tr key={p.ticker} className="border-b border-[var(--border-1)]/10 hover:bg-[var(--surface-2)]/20">
                  <td className="p-3">
                    <Link href={`/ativo/${p.ticker}`} className="font-mono font-bold text-[var(--accent-1)] hover:underline">
                      {p.ticker}
                    </Link>
                  </td>
                  <td className="p-3 text-right">
                    <span className={cn(
                      'font-mono font-bold',
                      p.iq_score >= 70 ? 'text-teal' : p.iq_score >= 40 ? 'text-amber' : 'text-red'
                    )}>
                      {p.iq_score}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-16 h-1.5 bg-[var(--surface-2)] rounded-full overflow-hidden">
                        <div className="h-full bg-[var(--accent-1)] rounded-full" style={{ width: `${p.weight * 100}%` }} />
                      </div>
                      <span className="font-mono font-bold w-10 text-right">{(p.weight * 100).toFixed(1)}%</span>
                    </div>
                  </td>
                  <td className="p-3 text-[var(--text-2)] max-w-[300px]">{p.rationale}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ─── Tab: Short Candidates ─────────────────────────────────────────
function ShortsTab() {
  const { data, isLoading } = trpc.backtest.shortCandidates.useQuery(undefined, {
    staleTime: 15 * 60 * 1000,
  })

  if (isLoading) {
    return (
      <div className="border border-[var(--border-1)] rounded-[var(--radius)] shadow-sm bg-[var(--surface-1)] p-6 animate-pulse">
        <div className="h-4 w-48 bg-[var(--surface-2)] rounded mb-4" />
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-10 bg-[var(--surface-2)] rounded" />)}</div>
      </div>
    )
  }

  if (!data?.available || !data.candidates?.length) {
    return (
      <div className="border border-[var(--border-1)]/30 rounded-[var(--radius)] bg-[var(--surface-1)] p-8 text-center">
        <p className="text-[var(--text-body)] text-[var(--text-2)]">Nenhum candidato a short identificado — bom sinal para o mercado.</p>
      </div>
    )
  }

  return (
    <div className="border border-[var(--border-1)] rounded-[var(--radius)] shadow-sm bg-[var(--surface-1)] overflow-hidden">
      <div className="p-4 border-b border-[var(--border-1)] bg-red/5">
        <p className="text-[var(--text-caption)] font-bold text-red uppercase tracking-wider">
          Critérios: IQ &lt; 35 | Merton PD &gt; 15% | Momentum &lt; -30%
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-[var(--text-small)]">
          <thead>
            <tr className="border-b border-[var(--border-1)] text-[var(--text-3)]">
              <th className="text-left p-3 font-semibold">Ativo</th>
              <th className="text-right p-3 font-semibold">IQ Score</th>
              <th className="text-right p-3 font-semibold">Merton PD</th>
              <th className="text-right p-3 font-semibold">Momentum 6M</th>
              <th className="text-left p-3 font-semibold">Motivo</th>
            </tr>
          </thead>
          <tbody>
            {data.candidates.map((c: { ticker: string; iq_score: number; merton_pd: number | null; momentum_6m: number | null; reason: string }) => (
              <tr key={c.ticker} className="border-b border-[var(--border-1)]/10 hover:bg-red/5">
                <td className="p-3">
                  <Link href={`/ativo/${c.ticker}`} className="font-mono font-bold text-red hover:underline">
                    {c.ticker}
                  </Link>
                </td>
                <td className="p-3 text-right font-mono font-bold text-red">{c.iq_score}</td>
                <td className="p-3 text-right font-mono">
                  {c.merton_pd != null ? `${(c.merton_pd * 100).toFixed(1)}%` : '—'}
                </td>
                <td className="p-3 text-right font-mono text-red">
                  {c.momentum_6m != null ? `${(c.momentum_6m * 100).toFixed(1)}%` : '—'}
                </td>
                <td className="p-3 text-[var(--text-2)] max-w-[250px]">{c.reason}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
