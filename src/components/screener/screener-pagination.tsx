'use client'

import { Button } from '@/components/ui'
import { cn } from '@/lib/utils'

interface ScreenerPaginationProps {
  page: number
  pageSize: number
  total: number
  totalPages: number
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
}

export function ScreenerPagination({
  page,
  pageSize,
  total,
  totalPages,
  onPageChange,
  onPageSizeChange,
}: ScreenerPaginationProps) {
  const start = (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, total)

  const getVisiblePages = () => {
    const delta = 2
    const range: (number | 'ellipsis')[] = []

    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        (i >= page - delta && i <= page + delta)
      ) {
        range.push(i)
      } else if (
        (i === page - delta - 1 && i > 1) ||
        (i === page + delta + 1 && i < totalPages)
      ) {
        range.push('ellipsis')
      }
    }

    // Remove duplicate ellipsis
    return range.filter((item, index, arr) =>
      !(item === 'ellipsis' && arr[index - 1] === 'ellipsis')
    )
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-[var(--border-1)]">
      {/* Info */}
      <div className="text-sm text-[var(--text-2)]">
        Mostrando <span className="font-medium text-[var(--text-1)]">{start}</span> a{' '}
        <span className="font-medium text-[var(--text-1)]">{end}</span> de{' '}
        <span className="font-medium text-[var(--text-1)]">{total}</span> ativos
      </div>

      <div className="flex items-center gap-4">
        {/* Page Size */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-[var(--text-2)]">Por página:</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="px-2 py-1 text-sm bg-[var(--surface-2)] border border-[var(--border-1)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--accent-1)]"
          >
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
            <option value={300}>Todos</option>
          </select>
        </div>

        {/* Pagination */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className="p-2"
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
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </Button>

          {getVisiblePages().map((item, index) =>
            item === 'ellipsis' ? (
              <span
                key={`ellipsis-${index}`}
                className="px-2 text-[var(--text-2)]"
              >
                ...
              </span>
            ) : (
              <button
                key={item}
                onClick={() => onPageChange(item)}
                className={cn(
                  'min-w-[32px] h-8 px-2 text-sm font-medium rounded-lg transition-colors',
                  page === item
                    ? 'bg-[var(--accent-1)] text-white'
                    : 'bg-[var(--surface-2)] text-[var(--text-2)] hover:text-[var(--text-1)]'
                )}
              >
                {item}
              </button>
            )
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            className="p-2"
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
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </Button>
        </div>
      </div>
    </div>
  )
}
