'use client'

import { useState } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

export interface Opportunity {
  ticker: string
  company_name: string
  iq_score: number
  rating_label: string
  change_pct?: number
}

interface Props {
  topScores: Opportunity[]
  catalysts: { title: string; date: string; ticker?: string; type: string }[]
}

function scoreBadge(score: number) {
  const cls = score >= 82 ? 'bg-emerald-500/15 text-emerald-400' : score >= 70 ? 'bg-teal-500/15 text-teal-400' : score >= 45 ? 'bg-amber-500/15 text-amber-400' : 'bg-red-500/15 text-red-400'
  return <span className={cn('font-mono text-[10px] font-bold px-1.5 py-0.5 rounded', cls)}>{score}</span>
}

export function OpportunitiesPanel({ topScores, catalysts }: Props) {
  const [tab, setTab] = useState<'scores' | 'events'>('scores')

  return (
    <div className="flex flex-col h-full">
      <div className="flex gap-1 mb-2">
        <button onClick={() => setTab('scores')} className={cn('px-2 py-1 rounded text-[10px] font-semibold transition-colors', tab === 'scores' ? 'bg-[var(--accent-2)] text-[var(--accent-1)]' : 'text-[var(--text-3)] hover:text-[var(--text-2)]')}>
          Top Scores
        </button>
        <button onClick={() => setTab('events')} className={cn('px-2 py-1 rounded text-[10px] font-semibold transition-colors', tab === 'events' ? 'bg-[var(--accent-2)] text-[var(--accent-1)]' : 'text-[var(--text-3)] hover:text-[var(--text-2)]')}>
          Eventos
        </button>
      </div>

      {tab === 'scores' ? (
        <div className="flex flex-col gap-1 overflow-y-auto">
          {topScores.slice(0, 6).map(a => (
            <Link key={a.ticker} href={`/ativo/${a.ticker}`} className="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-[var(--surface-2)]/30 transition-colors">
              <img src={`https://raw.githubusercontent.com/StatusInvest/Content/master/img/company/${a.ticker}.jpg`} alt="" className="w-4 h-4 rounded object-cover bg-[var(--surface-2)]" onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
              <span className="font-mono text-[11px] font-bold text-[var(--text-1)] min-w-[48px]">{a.ticker}</span>
              {scoreBadge(a.iq_score)}
              <span className="text-[10px] text-[var(--text-3)] flex-1 truncate">{a.rating_label}</span>
            </Link>
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-1 overflow-y-auto">
          {catalysts.slice(0, 6).map((c, i) => (
            <div key={i} className="flex items-center gap-2 py-1.5 px-2 rounded">
              <span className="font-mono text-[10px] text-[var(--text-3)] min-w-[36px]">{new Date(c.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</span>
              {c.ticker && <span className="font-mono text-[10px] font-bold text-[var(--accent-1)]">{c.ticker}</span>}
              <span className="text-[10px] text-[var(--text-2)] truncate">{c.title}</span>
            </div>
          ))}
          {catalysts.length === 0 && <span className="text-[var(--text-3)] text-xs py-4 text-center">Nenhum evento recente</span>}
        </div>
      )}
    </div>
  )
}
