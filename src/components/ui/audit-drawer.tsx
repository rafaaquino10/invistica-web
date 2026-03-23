'use client'

import { useState, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

/* ═══════════════════════════════════════════════
   AuditDrawer — Technical details on demand
   Closed by default, opens to show technical tables
   No decorative blocks, just data
   ═══════════════════════════════════════════════ */

export interface AuditSection {
  title: string
  content: ReactNode
}

export interface AuditDrawerProps {
  sections: AuditSection[]
  /** Trigger label */
  label?: string
  className?: string
}

export function AuditDrawer({ sections, label = 'Auditoria do Score', className }: AuditDrawerProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className={cn('border border-[var(--border-1)] rounded-[var(--radius)] overflow-hidden', className)}>
      {/* Toggle button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-full flex items-center justify-between px-4 py-3',
          'text-[var(--text-body)] font-medium text-[var(--text-2)]',
          'hover:bg-[var(--surface-2)] transition-colors',
          isOpen && 'bg-[var(--surface-2)] border-b border-[var(--border-1)]'
        )}
      >
        <span className="flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
          </svg>
          {label}
        </span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={cn('transition-transform', isOpen && 'rotate-180')}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Content */}
      {isOpen && (
        <div className="bg-[var(--surface-1)]">
          {sections.map((section, index) => (
            <div
              key={section.title}
              className={cn(
                'px-4 py-3',
                index > 0 && 'border-t border-[var(--border-1)]'
              )}
            >
              <h4 className="text-[var(--text-small)] font-semibold text-[var(--text-2)] uppercase tracking-wider mb-2">
                {section.title}
              </h4>
              <div className="text-[var(--text-body)] text-[var(--text-1)]">
                {section.content}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/** Helper: Audit key-value table row */
export function AuditRow({ label, value, tooltip }: { label: string; value: ReactNode; tooltip?: string }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-[var(--text-body)] text-[var(--text-2)]" title={tooltip}>
        {label}
      </span>
      <span className="text-[var(--text-body)] font-mono tabular-nums text-[var(--text-1)]">
        {value}
      </span>
    </div>
  )
}
