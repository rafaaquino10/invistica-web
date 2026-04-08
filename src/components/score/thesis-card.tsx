'use client'

import { cn } from '@/lib/utils'

interface ThesisCardProps {
  ticker: string
  thesis: string
  dividendData?: {
    dividend_safety: number | null
    projected_yield: number | null
    dividend_cagr_5y: number | null
  } | null
}

export function ThesisCard({ ticker, thesis, dividendData }: ThesisCardProps) {
  if (!thesis) return null // Silently hide — thesis not generated for all assets

  return (
    <div>
      <h2 className="text-[11px] font-semibold text-[var(--text-3)] uppercase tracking-wider mb-2">
        Tese de Investimento — {ticker}
      </h2>
      <div className="border border-[var(--border-1)] rounded-[var(--radius)] shadow-sm bg-[var(--surface-1)] p-4">
        <p className="text-[13px] text-[var(--text-1)] leading-relaxed whitespace-pre-line">
          {thesis}
        </p>

        {/* Dividend metrics strip */}
        {dividendData && (dividendData.projected_yield != null || dividendData.dividend_safety != null) && (
          <div className="mt-4 pt-3 border-t border-[var(--border-1)]/20">
            <p className="text-[10px] font-semibold text-[var(--text-3)] uppercase tracking-wider mb-2">Dividendos</p>
            <div className="flex items-center gap-6 text-[12px]">
              {dividendData.projected_yield != null && (
                <span className="text-[var(--text-2)]">
                  Yield Projetado{' '}
                  <span className="font-mono font-bold text-[var(--pos)]">
                    {(dividendData.projected_yield * 100).toFixed(1)}%
                  </span>
                </span>
              )}
              {dividendData.dividend_safety != null && (
                <span className="text-[var(--text-2)]">
                  Safety Score{' '}
                  <span className={cn(
                    'font-mono font-bold',
                    dividendData.dividend_safety >= 70 ? 'text-teal' :
                    dividendData.dividend_safety >= 40 ? 'text-amber' : 'text-red'
                  )}>
                    {dividendData.dividend_safety}/100
                  </span>
                </span>
              )}
              {dividendData.dividend_cagr_5y != null && (
                <span className="text-[var(--text-2)]">
                  CAGR 5a{' '}
                  <span className={cn(
                    'font-mono font-bold',
                    dividendData.dividend_cagr_5y > 0 ? 'text-teal' : 'text-red'
                  )}>
                    {(dividendData.dividend_cagr_5y * 100).toFixed(1)}%
                  </span>
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
