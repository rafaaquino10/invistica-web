'use client'

import { cn } from '@/lib/utils'

/* ═══════════════════════════════════════════════
   NewsEventItem — Institutional news entry
   No thumbnail, no card shadow
   Tags discrete, CTA minimal
   ═══════════════════════════════════════════════ */

export interface NewsEventItemProps {
  title: string
  source: string
  date: string
  summary?: string
  tags?: string[]
  confidence?: 'baixa' | 'média' | 'alta'
  url?: string
  className?: string
}

export function NewsEventItem({ title, source, date, summary, tags, confidence, url, className }: NewsEventItemProps) {
  return (
    <div className={cn(
      'py-3 border-b border-[var(--border-1)] last:border-0',
      className
    )}>
      {/* Header: source + date */}
      <div className="flex items-center gap-2 mb-1">
        <span className="text-[var(--text-caption)] font-medium text-[var(--text-2)]">
          {source}
        </span>
        <span className="text-[var(--text-caption)] text-[var(--text-3)]">
          {date}
        </span>
        {confidence && (
          <span className={cn(
            'text-[var(--text-caption)] font-mono tabular-nums',
            confidence === 'alta' && 'text-[var(--pos)]',
            confidence === 'média' && 'text-[var(--text-2)]',
            confidence === 'baixa' && 'text-[var(--text-3)]',
          )}>
            {confidence}
          </span>
        )}
      </div>

      {/* Title */}
      <h4 className="text-[var(--text-body)] font-medium text-[var(--text-1)] leading-snug">
        {title}
      </h4>

      {/* Summary */}
      {summary && (
        <p className="text-[var(--text-small)] text-[var(--text-2)] mt-1 line-clamp-3 leading-relaxed">
          {summary}
        </p>
      )}

      {/* Tags + CTA */}
      <div className="flex items-center gap-2 mt-2">
        {tags && tags.map((tag) => (
          <span
            key={tag}
            className="text-[var(--text-caption)] text-[var(--text-3)] border border-[var(--border-1)] rounded-[var(--radius-xs)] px-1.5 py-px"
          >
            {tag}
          </span>
        ))}
        {url && (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--text-caption)] text-[var(--accent-1)] hover:underline ml-auto flex items-center gap-1"
          >
            Ler na fonte
            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </a>
        )}
      </div>
    </div>
  )
}
