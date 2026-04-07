'use client'

import Link from 'next/link'
import type { Insight } from '@/lib/insights'

// ─── Category Config ────────────────────────────────────────

const CATEGORY_CONFIG: Record<
  Insight['category'],
  { borderColor: string; iconBg: string; iconColor: string }
> = {
  opportunity: {
    borderColor: 'border-l-[#4ADE80]',
    iconBg: 'bg-[#4ADE80]/10',
    iconColor: 'text-[#4ADE80]',
  },
  risk: {
    borderColor: 'border-l-[#EF4444]',
    iconBg: 'bg-[#EF4444]/10',
    iconColor: 'text-[#EF4444]',
  },
  info: {
    borderColor: 'border-l-[#3B82F6]',
    iconBg: 'bg-[#3B82F6]/10',
    iconColor: 'text-[#3B82F6]',
  },
  milestone: {
    borderColor: 'border-l-[#F59E0B]',
    iconBg: 'bg-[#F59E0B]/10',
    iconColor: 'text-[#F59E0B]',
  },
}

// ─── Category Icons (lucide-style SVGs) ─────────────────────

function OpportunityIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
      <polyline points="16 7 22 7 22 13" />
    </svg>
  )
}

function RiskIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  )
}

function InfoIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  )
}

function MilestoneIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </svg>
  )
}

function getCategoryIcon(category: Insight['category'], className?: string) {
  switch (category) {
    case 'opportunity':
      return <OpportunityIcon className={className} />
    case 'risk':
      return <RiskIcon className={className} />
    case 'info':
      return <InfoIcon className={className} />
    case 'milestone':
      return <MilestoneIcon className={className} />
  }
}

// ─── Relative Timestamp ─────────────────────────────────────

function formatRelativeTime(isoDate: string): string {
  const now = new Date()
  const date = new Date(isoDate)
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'agora'
  if (diffMins < 60) return `ha ${diffMins}min`
  if (diffHours < 24) return `ha ${diffHours}h`
  if (diffDays === 0) return 'hoje'
  if (diffDays === 1) return 'ontem'
  if (diffDays < 7) return `ha ${diffDays}d`
  return date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })
}

// ─── Severity Badge ─────────────────────────────────────────

const SEVERITY_CONFIG: Record<string, { label: string; className: string }> = {
  high: { label: 'Alta', className: 'bg-[#EF4444]/10 text-[#EF4444]' },
  medium: { label: 'Media', className: 'bg-[#F59E0B]/10 text-[#F59E0B]' },
  low: { label: 'Baixa', className: 'bg-[#3B82F6]/10 text-[#3B82F6]' },
}

// ─── Component ──────────────────────────────────────────────

interface InsightCardProps {
  insight: Insight
  showScore?: number | null
}

export function InsightCard({ insight, showScore }: InsightCardProps) {
  const config = CATEGORY_CONFIG[insight.category]
  const severity = SEVERITY_CONFIG[insight.severity]

  return (
    <div
      className={`
        bg-[var(--surface-1)] border border-[var(--border-1)]/20
        border-l-4 ${config.borderColor}
        rounded-[var(--radius)] p-4 transition-all duration-200
        hover:border-[var(--border-1)]/40
      `}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div
          className={`flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center ${config.iconBg}`}
        >
          {getCategoryIcon(insight.category, config.iconColor)}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold text-sm text-[var(--text-1)] truncate">
              {insight.title}
            </h4>
            {severity && (
              <span
                className={`flex-shrink-0 px-1.5 py-0.5 text-[10px] font-medium rounded ${severity.className}`}
              >
                {severity.label}
              </span>
            )}
          </div>

          <p className="text-sm text-[var(--text-2)] line-clamp-2 mb-2">
            {insight.description}
          </p>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Ticker Badge */}
            {insight.ticker && (
              <Link
                href={`/ativo/${insight.ticker}`}
                className="inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-mono font-bold rounded bg-[var(--accent-1)]/10 text-[var(--accent-1)] hover:bg-[var(--accent-1)]/20 transition-colors"
              >
                {insight.ticker}
                {showScore != null && (
                  <span className="text-[var(--text-2)] font-normal">
                    ({showScore})
                  </span>
                )}
              </Link>
            )}

            {/* Sector Badge */}
            {insight.sector && !insight.ticker && (
              <span className="px-2 py-0.5 text-xs font-medium rounded bg-[var(--surface-2)] text-[var(--text-2)]">
                {insight.sector}
              </span>
            )}

            {/* Timestamp */}
            <span className="text-xs text-[var(--text-3)]">
              {formatRelativeTime(insight.createdAt)}
            </span>

            {/* Action Button */}
            {insight.actionable && insight.action && insight.ticker && (
              <Link
                href={`/ativo/${insight.ticker}`}
                className="ml-auto text-xs font-medium text-[var(--accent-1)] hover:text-[var(--accent-1)]/80 transition-colors"
              >
                {insight.action}
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
