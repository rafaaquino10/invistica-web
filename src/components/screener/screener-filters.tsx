'use client'

import { useState } from 'react'
import { Badge, Button, Input, Select } from '@/components/ui'
import { cn } from '@/lib/utils'

export interface ScreenerFiltersState {
  types: ('stock')[]
  sectors: string[]
  minScore?: number
  maxScore?: number
  minDividendYield?: number
  maxDividendYield?: number
  minPeRatio?: number
  maxPeRatio?: number
  minRoe?: number
  maxNetDebtEbitda?: number
  minRoic?: number
  minNetMargin?: number
  maxPbRatio?: number
  sortBy: string
  sortOrder: 'asc' | 'desc'
}

interface ScreenerFiltersProps {
  filters: ScreenerFiltersState
  onFiltersChange: (filters: ScreenerFiltersState) => void
  sectors: string[]
  className?: string
}

const sortOptions = [
  { value: 'scoreTotal', label: 'IQ-Score' },
  { value: 'ticker', label: 'Ticker' },
  { value: 'sector', label: 'Setor' },
  { value: 'changePercent', label: 'Variação Dia' },
  { value: 'dividendYield', label: 'Dividend Yield' },
  { value: 'peRatio', label: 'P/L' },
  { value: 'roe', label: 'ROE' },
  { value: 'scoreValuation', label: 'Valuation' },
  { value: 'scoreQuality', label: 'Qualidade' },
  { value: 'scoreGrowth', label: 'Crescimento' },
  { value: 'scoreDividends', label: 'Dividendos' },
  { value: 'scoreRisk', label: 'Risco' },
]

export function ScreenerFilters({
  filters,
  onFiltersChange,
  sectors,
  className,
}: ScreenerFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const updateFilter = <K extends keyof ScreenerFiltersState>(
    key: K,
    value: ScreenerFiltersState[K]
  ) => {
    onFiltersChange({ ...filters, [key]: value })
  }

  const clearFilters = () => {
    onFiltersChange({
      types: [],
      sectors: [],
      sortBy: 'scoreTotal',
      sortOrder: 'desc',
    })
  }

  const activeFiltersCount = [
    filters.sectors.length > 0,
    filters.minScore !== undefined,
    filters.maxScore !== undefined,
    filters.minDividendYield !== undefined,
    filters.maxDividendYield !== undefined,
    filters.minPeRatio !== undefined,
    filters.maxPeRatio !== undefined,
    filters.minRoe !== undefined,
    filters.maxNetDebtEbitda !== undefined,
    filters.minRoic !== undefined,
    filters.minNetMargin !== undefined,
    filters.maxPbRatio !== undefined,
  ].filter(Boolean).length

  return (
    <div className={className}>
      {/* Quick Filters Bar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Sort */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-medium text-[var(--text-2)] uppercase tracking-wider">Ordenar:</span>
          <Select
            value={filters.sortBy}
            onChange={(e) => updateFilter('sortBy', e.target.value)}
            className="w-40"
          >
            {sortOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
          <button
            onClick={() => updateFilter('sortOrder', filters.sortOrder === 'asc' ? 'desc' : 'asc')}
            className="p-2 rounded-lg bg-[var(--surface-2)] hover:bg-[var(--border-1)] transition-colors"
            title={filters.sortOrder === 'asc' ? 'Crescente' : 'Decrescente'}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={cn('transition-transform', filters.sortOrder === 'asc' && 'rotate-180')}
            >
              <path d="m3 16 4 4 4-4" />
              <path d="M7 20V4" />
              <path d="M11 4h10" />
              <path d="M11 8h7" />
              <path d="M11 12h4" />
            </svg>
          </button>
        </div>

        <div className="flex-1" />

        {/* Expand/Collapse */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg bg-[var(--surface-2)] hover:bg-[var(--border-1)] transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
          </svg>
          Filtros
          {activeFiltersCount > 0 && (
            <Badge variant="primary" size="sm">
              {activeFiltersCount}
            </Badge>
          )}
        </button>
      </div>

      {/* Expanded Filters - Glassmorphic Panel */}
      {isExpanded && (
        <div className="mt-3 p-4 rounded-[var(--radius)] border border-[var(--border-1)]/50 backdrop-blur-md bg-[var(--surface-1)]/80">
          {/* Faixas de Score */}
          <div className="mb-4">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-[var(--accent-1)]/70 mb-2">Faixas de Score</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-[var(--text-2)]">
                  IQ-Score Min
                </label>
                <Input
                  type="number"
                  placeholder="0"
                  min={0}
                  max={100}
                  value={filters.minScore ?? ''}
                  onChange={(e) => updateFilter('minScore', e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full bg-[var(--bg)]/50"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-[var(--text-2)]">
                  IQ-Score Max
                </label>
                <Input
                  type="number"
                  placeholder="100"
                  min={0}
                  max={100}
                  value={filters.maxScore ?? ''}
                  onChange={(e) => updateFilter('maxScore', e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full bg-[var(--bg)]/50"
                />
              </div>
            </div>
          </div>

          {/* Indicadores */}
          <div className="mb-4">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-[var(--accent-1)]/70 mb-2">Indicadores</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-[var(--text-2)]">DY Min (%)</label>
                <Input
                  type="number"
                  placeholder="Min"
                  min={0}
                  step={0.5}
                  value={filters.minDividendYield ?? ''}
                  onChange={(e) => updateFilter('minDividendYield', e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full bg-[var(--bg)]/50"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-[var(--text-2)]">DY Max (%)</label>
                <Input
                  type="number"
                  placeholder="Max"
                  min={0}
                  step={0.5}
                  value={filters.maxDividendYield ?? ''}
                  onChange={(e) => updateFilter('maxDividendYield', e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full bg-[var(--bg)]/50"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-[var(--text-2)]">P/L Min</label>
                <Input
                  type="number"
                  placeholder="Min"
                  step={0.5}
                  value={filters.minPeRatio ?? ''}
                  onChange={(e) => updateFilter('minPeRatio', e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full bg-[var(--bg)]/50"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-[var(--text-2)]">P/L Max</label>
                <Input
                  type="number"
                  placeholder="Max"
                  step={0.5}
                  value={filters.maxPeRatio ?? ''}
                  onChange={(e) => updateFilter('maxPeRatio', e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full bg-[var(--bg)]/50"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-[var(--text-2)]">ROE Min (%)</label>
                <Input
                  type="number"
                  placeholder="Min"
                  min={0}
                  step={1}
                  value={filters.minRoe ?? ''}
                  onChange={(e) => updateFilter('minRoe', e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full bg-[var(--bg)]/50"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-[var(--text-2)]">Dív.Líq/EBITDA Max</label>
                <Input
                  type="number"
                  placeholder="Max"
                  step={0.5}
                  value={filters.maxNetDebtEbitda ?? ''}
                  onChange={(e) => updateFilter('maxNetDebtEbitda', e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full bg-[var(--bg)]/50"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-[var(--text-2)]">ROIC Min (%)</label>
                <Input
                  type="number"
                  placeholder="Min"
                  min={0}
                  step={1}
                  value={filters.minRoic ?? ''}
                  onChange={(e) => updateFilter('minRoic', e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full bg-[var(--bg)]/50"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-[var(--text-2)]">Mrg. Líquida Min (%)</label>
                <Input
                  type="number"
                  placeholder="Min"
                  step={1}
                  value={filters.minNetMargin ?? ''}
                  onChange={(e) => updateFilter('minNetMargin', e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full bg-[var(--bg)]/50"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-[var(--text-2)]">P/VP Max</label>
                <Input
                  type="number"
                  placeholder="Max"
                  min={0}
                  step={0.5}
                  value={filters.maxPbRatio ?? ''}
                  onChange={(e) => updateFilter('maxPbRatio', e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full bg-[var(--bg)]/50"
                />
              </div>
            </div>
          </div>

          {/* Setores */}
          {sectors.length > 0 && (
            <div className="mb-3">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-[var(--accent-1)]/70 mb-2">Setores</h4>
              <div className="flex flex-wrap gap-1.5">
                {sectors.map((sector) => (
                  <button
                    key={sector}
                    onClick={() => {
                      const newSectors = filters.sectors.includes(sector)
                        ? filters.sectors.filter((s) => s !== sector)
                        : [...filters.sectors, sector]
                      updateFilter('sectors', newSectors)
                    }}
                    className={cn(
                      'px-2 py-0.5 text-[11px] font-medium rounded transition-colors',
                      filters.sectors.includes(sector)
                        ? 'bg-[var(--accent-1)] text-white'
                        : 'bg-[var(--bg)]/60 text-[var(--text-2)] hover:text-[var(--text-1)] hover:bg-[var(--surface-2)]'
                    )}
                  >
                    {sector}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Clear Filters */}
          {activeFiltersCount > 0 && (
            <div className="flex justify-end pt-2 border-t border-[var(--border-1)]/30">
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Limpar filtros
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
