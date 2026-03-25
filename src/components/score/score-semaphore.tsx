'use client'

import { cn } from '@/lib/utils'

// ─── Badge semáforo (Camada 1 — Free) ───────────────────────────────

interface SemaphoreBadgeProps {
  label: string
  color: string
  size?: 'sm' | 'md'
  className?: string
}

export function SemaphoreBadge({ label, color, size = 'sm', className }: SemaphoreBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-[var(--radius-sm)] border font-medium',
        size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-[11px]',
        className,
      )}
      style={{
        color,
        borderColor: `${color}33`,
        backgroundColor: `${color}15`,
      }}
    >
      <span
        className="inline-block rounded-full"
        style={{
          width: size === 'sm' ? 6 : 7,
          height: size === 'sm' ? 6 : 7,
          backgroundColor: color,
        }}
      />
      {label}
    </span>
  )
}

// ─── One-liner + badge (usado na página do ativo e tooltip do explorer) ──

interface ScoreSemaphoreProps {
  label: string
  color: string
  oneLiner: string
  className?: string
}

export function ScoreSemaphore({ label, color, oneLiner, className }: ScoreSemaphoreProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <SemaphoreBadge label={label} color={color} size="md" />
      <span className="text-[13px] text-[var(--text-2)]">{oneLiner}</span>
    </div>
  )
}

// ─── Research Note (Camada 2 — Pro) ─────────────────────────────────

interface ResearchNoteProps {
  researchNote: string
  highlights: {
    strengths: string[]
    weaknesses: string[]
    context: string
  }
  className?: string
}

export function ResearchNote({ researchNote, highlights, className }: ResearchNoteProps) {
  return (
    <div className={cn('border border-[var(--border-1)]/20 rounded-[var(--radius)] bg-[var(--surface-1)] p-4 space-y-3', className)}>
      <div className="flex items-center gap-2 mb-1">
        <h3 className="text-[11px] font-semibold text-[var(--text-3)] uppercase tracking-wider">Diagnóstico IQ</h3>
        <span className="text-[10px] px-1.5 py-0.5 rounded-[var(--radius-sm)] bg-[var(--accent-1)]/10 text-[var(--accent-1)] font-medium">Pro</span>
      </div>

      <p className="text-[13px] text-[var(--text-2)] leading-relaxed">{researchNote}</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        {highlights.strengths.length > 0 && (
          <div>
            <p className="text-[11px] font-medium text-green-500 mb-1">Pontos fortes</p>
            <ul className="space-y-0.5">
              {highlights.strengths.map((s, i) => (
                <li key={i} className="text-[12px] text-[var(--text-2)] flex items-start gap-1">
                  <span className="text-green-500 mt-0.5">+</span>
                  {s}
                </li>
              ))}
            </ul>
          </div>
        )}
        {highlights.weaknesses.length > 0 && (
          <div>
            <p className="text-[11px] font-medium text-red-500 mb-1">Pontos de atenção</p>
            <ul className="space-y-0.5">
              {highlights.weaknesses.map((w, i) => (
                <li key={i} className="text-[12px] text-[var(--text-2)] flex items-start gap-1">
                  <span className="text-red-500 mt-0.5">-</span>
                  {w}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <p className="text-[11px] text-[var(--text-3)] italic pt-1 border-t border-[var(--border-1)]/10">{highlights.context}</p>
    </div>
  )
}
