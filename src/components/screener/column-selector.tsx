'use client'
import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'

// Colunas Invscore — alinhadas com o propósito da plataforma
export const ALL_COLUMNS = [
  { key: 'sector', label: 'Setor' },
  { key: 'close', label: 'Preço' },
  { key: 'changePercent', label: 'Dia' },
  { key: 'marketCap', label: 'Mkt Cap' },
  { key: 'scoreTotal', label: 'Invscore' },
  { key: 'rating', label: 'Rating' },
  { key: 'scoreQuali', label: 'Quali' },
  { key: 'scoreQuanti', label: 'Quanti' },
  { key: 'scoreValuation', label: 'Valuation' },
  { key: 'fairValue', label: 'Fair Value' },
  { key: 'safetyMargin', label: 'Margem' },
  { key: 'dyProj', label: 'DY Proj' },
  { key: 'dividendSafety', label: 'Safety' },
] as const

export type ColumnKey = (typeof ALL_COLUMNS)[number]['key']

// Colunas padrão — as mais relevantes para o investidor
export const DEFAULT_COLUMNS: ColumnKey[] = [
  'sector', 'close', 'changePercent', 'scoreTotal', 'rating',
  'scoreQuali', 'scoreQuanti', 'scoreValuation',
  'fairValue', 'safetyMargin', 'dyProj', 'dividendSafety',
]

// Colunas recomendadas por lens — ativadas automaticamente ao trocar lens
export const LENS_COLUMNS: Record<string, ColumnKey[]> = {
  general: ['sector', 'close', 'changePercent', 'scoreTotal', 'rating', 'scoreQuali', 'scoreQuanti', 'scoreValuation', 'fairValue', 'safetyMargin', 'dyProj', 'dividendSafety'],
  value: ['sector', 'close', 'scoreTotal', 'scoreValuation', 'fairValue', 'safetyMargin', 'dyProj'],
  dividends: ['sector', 'close', 'scoreTotal', 'dyProj', 'dividendSafety', 'safetyMargin'],
  growth: ['sector', 'close', 'scoreTotal', 'scoreQuanti', 'scoreQuali', 'scoreValuation'],
  defensive: ['sector', 'close', 'scoreTotal', 'dividendSafety', 'safetyMargin', 'dyProj'],
  momentum: ['sector', 'close', 'changePercent', 'scoreTotal', 'scoreQuanti', 'marketCap'],
}

const STORAGE_KEY = 'aq-explorer-columns-v2'

export function useColumnSelector() {
  const [visibleColumns, setVisibleColumns] = useState<ColumnKey[]>(() => {
    if (typeof window === 'undefined') return DEFAULT_COLUMNS
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved) as ColumnKey[]
        const valid = parsed.filter(k => ALL_COLUMNS.some(c => c.key === k))
        if (valid.length > 0) return valid
      }
    } catch {}
    return DEFAULT_COLUMNS
  })

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(visibleColumns)) } catch {}
  }, [visibleColumns])

  return { visibleColumns, setVisibleColumns }
}

interface ColumnSelectorProps {
  visibleColumns: ColumnKey[]
  onChange: (cols: ColumnKey[]) => void
}

export function ColumnSelector({ visibleColumns, onChange }: ColumnSelectorProps) {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border border-[var(--border-1)] text-[var(--text-2)] hover:text-[var(--text-1)] hover:border-[var(--text-2)] transition-colors"
        aria-label="Selecionar colunas"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
        </svg>
        Colunas
        <span className="text-xs bg-[var(--accent-1)]/10 text-[var(--accent-1)] px-1.5 rounded">
          {visibleColumns.length}
        </span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 z-50 w-52 bg-[var(--surface-1)] border border-[var(--border-1)]/30 rounded-[var(--radius)] shadow-[var(--shadow-overlay)] p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-[var(--text-2)] uppercase tracking-wider">Colunas</span>
              <button onClick={() => onChange(DEFAULT_COLUMNS)} className="text-xs text-[var(--accent-1)] hover:underline">Padrão</button>
            </div>
            <div className="space-y-1">
              {ALL_COLUMNS.map(col => (
                <label key={col.key} className={cn('flex items-center gap-2 px-1 py-1 rounded hover:bg-[var(--surface-2)] cursor-pointer')}>
                  <input
                    type="checkbox"
                    checked={visibleColumns.includes(col.key)}
                    onChange={(e) => {
                      if (e.target.checked) onChange([...visibleColumns, col.key])
                      else onChange(visibleColumns.filter(k => k !== col.key))
                    }}
                    className="rounded"
                  />
                  <span className="text-sm">{col.label}</span>
                </label>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
