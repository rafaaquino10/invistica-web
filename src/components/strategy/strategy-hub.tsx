'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/utils/formatters'
import { trpc } from '@/lib/trpc/provider'
import Link from 'next/link'

type Tab = 'recommendation' | 'shorts'

export function StrategyHub() {
  const [tab, setTab] = useState<Tab>('recommendation')

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-[10px] font-bold text-[var(--accent-1)] uppercase tracking-[0.15em]">IQ-Cognit Strategy Engine</p>
          <h2 className="text-[var(--text-heading)] font-bold">Centro Estrategico</h2>
        </div>
        <div className="flex bg-[var(--surface-2)] rounded-lg p-0.5">
          <TabBtn active={tab === 'recommendation'} onClick={() => setTab('recommendation')}>Alocacao Otima</TabBtn>
          <TabBtn active={tab === 'shorts'} onClick={() => setTab('shorts')}>Short Candidates</TabBtn>
        </div>
      </div>

      {tab === 'recommendation' && <RecommendationPanel />}
      {tab === 'shorts' && <ShortCandidatesPanel />}
    </div>
  )
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'px-3 py-1.5 text-[11px] font-semibold rounded-md transition-colors',
        active ? 'bg-[var(--surface-1)] text-[var(--text-1)] shadow-sm' : 'text-[var(--text-3)] hover:text-[var(--text-1)]'
      )}
    >
      {children}
    </button>
  )
}

function RecommendationPanel() {
  const { data, isLoading } = trpc.backtest.portfolioRecommendation.useQuery(undefined, {
    staleTime: 15 * 60 * 1000,
  })

  if (isLoading) return <LoadingCard />

  if (!data?.available || !data.positions?.length) {
    return <EmptyCard message="Recomendacao de alocacao indisponivel no momento." />
  }

  return (
    <div className="border border-[var(--border-1)] rounded-[var(--radius)] shadow-sm bg-[var(--surface-1)]">
      {/* Rationale */}
      {data.rationale && (
        <div className="p-4 border-b border-[var(--border-1)]/20">
          <p className="text-[13px] text-[var(--text-1)] leading-relaxed">{data.rationale}</p>
        </div>
      )}

      {/* Positions table */}
      <div className="overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-[var(--border-1)]/20 text-[var(--text-3)]">
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
                <td className="p-3 text-[var(--text-2)] max-w-[250px] truncate">{p.rationale}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function ShortCandidatesPanel() {
  const { data, isLoading } = trpc.backtest.shortCandidates.useQuery(undefined, {
    staleTime: 15 * 60 * 1000,
  })

  if (isLoading) return <LoadingCard />

  if (!data?.available || !data.candidates?.length) {
    return <EmptyCard message="Nenhum candidato a short identificado — bom sinal para o mercado." />
  }

  return (
    <div className="border border-[var(--border-1)] rounded-[var(--radius)] shadow-sm bg-[var(--surface-1)]">
      <div className="p-4 border-b border-[var(--border-1)]/20 bg-red/5">
        <p className="text-[11px] font-bold text-red uppercase tracking-wider">
          Criterios: IQ &lt; 35 | Merton PD &gt; 15% | Momentum &lt; -30%
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-[var(--border-1)]/20 text-[var(--text-3)]">
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
                <td className="p-3 text-[var(--text-2)] max-w-[200px] truncate">{c.reason}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function LoadingCard() {
  return (
    <div className="border border-[var(--border-1)] rounded-[var(--radius)] shadow-sm bg-[var(--surface-1)] p-6 animate-pulse">
      <div className="h-4 w-48 bg-[var(--surface-2)] rounded mb-4" />
      <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-10 bg-[var(--surface-2)] rounded" />)}</div>
    </div>
  )
}

function EmptyCard({ message }: { message: string }) {
  return (
    <div className="border border-[var(--border-1)]/30 rounded-[var(--radius)] bg-[var(--surface-1)] p-8 text-center">
      <p className="text-[13px] text-[var(--text-2)]">{message}</p>
    </div>
  )
}
