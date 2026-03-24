'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { useQuery } from '@tanstack/react-query'
import { free } from '@/lib/api/endpoints'

const MARQUEE_TICKERS = [
  'PETR4', 'VALE3', 'ITUB4', 'BBAS3', 'WEGE3', 'ABEV3', 'RENT3', 'SUZB3',
  'BBSE3', 'EQTL3', 'B3SA3', 'GGBR4', 'JBSS3', 'RADL3', 'VIVT3', 'TOTS3',
  'LREN3', 'PRIO3', 'CSAN3', 'ELET3', 'TAEE11', 'SBSP3', 'ENEV3', 'RDOR3',
]

interface TickerQuote {
  ticker: string
  close: number
  change: number
}

export function TickerTape() {
  const [isPaused, setIsPaused] = useState(false)

  // Fetch quotes for marquee tickers
  const { data: tickersData } = useQuery({
    queryKey: ['ticker-tape'],
    queryFn: async () => {
      const results: TickerQuote[] = []
      // Fetch quotes in parallel (batch of main tickers)
      const promises = MARQUEE_TICKERS.map(async (ticker) => {
        try {
          const quote = await free.getQuote(ticker)
          return { ticker, close: quote.close, change: 0 }
        } catch {
          return null
        }
      })
      const settled = await Promise.all(promises)
      for (const r of settled) {
        if (r) results.push(r)
      }
      return results
    },
    staleTime: 15 * 60 * 1000, // 15min cache
    refetchInterval: 15 * 60 * 1000,
  })

  const tickers = tickersData ?? []

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
            const price = a.close ?? 0
            return (
              <Link
                key={`${a.ticker}-${i}`}
                href={`/ativo/${a.ticker}`}
                className="group inline-flex items-center gap-1.5 flex-shrink-0 hover:opacity-80 transition-opacity relative"
                title={`${a.ticker} — R$ ${Number(price).toFixed(2)}`}
              >
                <span className="text-[11px] font-semibold text-[var(--text-2)]">
                  {a.ticker}
                </span>
                <span className="text-[11px] font-mono tabular-nums text-[var(--text-3)]">
                  {Number(price).toFixed(2)}
                </span>
                <span className="text-[var(--border-2)] text-[6px] ml-1">&bull;</span>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
