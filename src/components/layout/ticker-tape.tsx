'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { trpc } from '@/lib/trpc/client'

const MARQUEE_TICKERS = [
  'PETR4', 'VALE3', 'ITUB4', 'BBAS3', 'WEGE3', 'ABEV3', 'RENT3', 'SUZB3',
  'BBSE3', 'EQTL3', 'B3SA3', 'GGBR4', 'JBSS3', 'RADL3', 'VIVT3', 'TOTS3',
  'LREN3', 'PRIO3', 'CSAN3', 'ELET3', 'TAEE11', 'SBSP3', 'ENEV3', 'RDOR3',
]

interface MacroItem {
  label: string
  value: string
  change?: number
}

export function TickerTape() {
  const [isPaused, setIsPaused] = useState(false)

  const { data } = trpc.screener.query.useQuery({
    pageSize: 50,
    sortBy: 'scoreTotal',
    sortOrder: 'desc',
  })

  const { data: economy } = trpc.economy.indicators.useQuery()

  const macroItems = useMemo<MacroItem[]>(() => {
    if (!economy) return []
    const items: MacroItem[] = []
    if (economy.ibov?.points) {
      items.push({ label: 'IBOV', value: economy.ibov.points.toLocaleString('pt-BR'), change: economy.ibov.change })
    }
    if (economy.usdBrl?.bid) {
      items.push({ label: 'USD/BRL', value: `R$ ${Number(economy.usdBrl.bid).toFixed(2)}`, change: economy.usdBrl.change })
    }
    if (economy.eurBrl?.bid) {
      items.push({ label: 'EUR/BRL', value: `R$ ${Number(economy.eurBrl.bid).toFixed(2)}`, change: economy.eurBrl.change })
    }
    return items
  }, [economy])

  const tickers = useMemo(() => {
    if (!data?.assets) return []
    const assetMap = new Map(data.assets.map((a: any) => [a.ticker, a]))
    const result: any[] = []
    const seen = new Set<string>()

    for (const t of MARQUEE_TICKERS) {
      const a = assetMap.get(t)
      if (a) { result.push(a); seen.add(t) }
    }
    for (const a of data.assets as any[]) {
      if (!seen.has(a.ticker) && result.length < 30) {
        result.push(a); seen.add(a.ticker)
      }
    }
    return result
  }, [data])

  if (tickers.length === 0) return null

  // Duplicate for seamless loop
  const items = [...tickers, ...tickers]

  return (
    <div className="h-8 bg-[var(--surface-1)] border-b border-[var(--border-1)] overflow-hidden relative select-none z-10 flex items-stretch">
      {/* Pause toggle */}
      <button
        onClick={() => setIsPaused(!isPaused)}
        className={cn(
          'flex-shrink-0 w-7 flex items-center justify-center',
          'border-r border-[var(--border-1)]',
          'text-[var(--text-3)] hover:text-[var(--text-2)] transition-colors',
        )}
        aria-label={isPaused ? 'Retomar ticker' : 'Pausar ticker'}
        title={isPaused ? 'Retomar' : 'Pausar'}
      >
        {isPaused ? (
          <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="currentColor" stroke="none">
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="currentColor" stroke="none">
            <rect x="6" y="4" width="4" height="16" />
            <rect x="14" y="4" width="4" height="16" />
          </svg>
        )}
      </button>

      {/* Scrolling content */}
      <div className="flex-1 overflow-hidden">
        <div
          className={cn(
            'ticker-scroll flex items-center h-full gap-5 whitespace-nowrap',
            isPaused && 'ticker-paused'
          )}
        >
          {items.map((a, i) => {
            const change = a.latestQuote?.changePercent ?? 0
            const price = a.latestQuote?.close ?? 0
            const isUp = Number(change) >= 0
            return (
              <Link
                key={`${a.ticker}-${i}`}
                href={`/ativo/${a.ticker}`}
                className="group inline-flex items-center gap-1.5 flex-shrink-0 hover:opacity-80 transition-opacity relative"
                title={`${a.ticker} — R$ ${Number(price).toFixed(2)} (${isUp ? '+' : ''}${Number(change).toFixed(2)}%)`}
              >
                <span className="text-[11px] font-semibold text-[var(--text-2)]">
                  {a.ticker}
                </span>
                <span className="text-[11px] font-mono tabular-nums text-[var(--text-3)]">
                  {Number(price).toFixed(2)}
                </span>
                <span className={cn(
                  'text-[11px] font-mono tabular-nums font-semibold',
                  isUp ? 'text-[var(--pos)]' : 'text-[var(--neg)]'
                )}>
                  {isUp ? '+' : ''}{Number(change).toFixed(2)}%
                </span>
                <span className="text-[var(--border-2)] text-[6px] ml-1">•</span>
              </Link>
            )
          })}
          {/* Macro indicators inline */}
          {macroItems.length > 0 && items.length > tickers.length && macroItems.map((m, i) => {
            const isUp = (m.change ?? 0) >= 0
            return (
              <span
                key={`macro-${m.label}-${i}`}
                className="inline-flex items-center gap-1.5 flex-shrink-0"
              >
                <span className="text-[11px] font-bold text-[var(--text-1)]">
                  {m.label}
                </span>
                <span className="text-[11px] font-mono tabular-nums text-[var(--text-2)]">
                  {m.value}
                </span>
                {m.change != null && m.change !== 0 && (
                  <span className={cn(
                    'text-[11px] font-mono tabular-nums font-semibold',
                    isUp ? 'text-[var(--pos)]' : 'text-[var(--neg)]'
                  )}>
                    {isUp ? '+' : ''}{Number(m.change).toFixed(2)}%
                  </span>
                )}
                <span className="text-[var(--border-2)] text-[6px] ml-1">•</span>
              </span>
            )
          })}
        </div>
      </div>
    </div>
  )
}
