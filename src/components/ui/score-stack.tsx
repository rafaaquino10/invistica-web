'use client'

import { cn } from '@/lib/utils'

/* ═══════════════════════════════════════════════
   ScoreStack — V2 dominant score display
   Score total is the largest element on asset page
   No badge/circle/medal, no gradient
   ═══════════════════════════════════════════════ */

interface ScoreLayer {
  label: string
  value: number | null
}

export interface ScoreStackProps {
  /** Total aQ Score (0-100) */
  score: number | null
  /** Classification text (Excepcional, Saudável, Atenção, Crítico) */
  classification: string
  /** Score layers: Structural, Sectoral, Macro */
  layers?: ScoreLayer[]
  /** Sector percentile (e.g. "Top 15%") */
  percentile?: string
  /** Confidence percentage */
  confidence?: number
  className?: string
}

function getScoreColor(score: number): string {
  if (score >= 81) return 'var(--score-exceptional)'
  if (score >= 61) return 'var(--score-healthy)'
  if (score >= 31) return 'var(--score-attention)'
  return 'var(--score-critical)'
}

export function ScoreStack({ score, classification, layers, percentile, confidence, className }: ScoreStackProps) {
  if (score === null || score === undefined) {
    return (
      <div className={cn('', className)}>
        <span className="text-[var(--text-display)] font-mono font-bold tabular-nums text-[var(--text-3)]">
          —
        </span>
        <p className="text-[var(--text-small)] text-[var(--text-3)] mt-1">Sem dados</p>
      </div>
    )
  }

  const rounded = Math.round(score)
  const color = getScoreColor(rounded)

  return (
    <div className={cn('', className)}>
      {/* Score Total — dominant element */}
      <div className="flex items-baseline gap-3">
        <span
          className="text-[var(--text-display)] font-mono font-bold tabular-nums leading-none"
          style={{ color }}
        >
          {rounded}
        </span>
        <div>
          <span
            className="text-[var(--text-body)] font-medium"
            style={{ color }}
          >
            {classification}
          </span>
          {percentile && (
            <span className="text-[var(--text-caption)] text-[var(--text-3)] ml-2">
              {percentile}
            </span>
          )}
        </div>
      </div>

      {/* Score bar */}
      <div className="mt-2 w-full max-w-xs">
        <div className="h-[3px] rounded-full bg-[var(--border-1)] overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${rounded}%`, backgroundColor: color }}
          />
        </div>
      </div>

      {/* Layers — compact, side by side */}
      {layers && layers.length > 0 && (
        <div className="flex items-center gap-4 mt-3">
          {layers.map((layer) => (
            <div key={layer.label} className="flex items-center gap-1.5">
              <span className="text-[var(--text-caption)] text-[var(--text-3)]">
                {layer.label}
              </span>
              <span className="text-[var(--text-small)] font-mono tabular-nums font-medium text-[var(--text-2)]">
                {layer.value !== null ? Math.round(layer.value) : '—'}
              </span>
            </div>
          ))}
          {confidence !== undefined && (
            <div className="flex items-center gap-1.5">
              <span className="text-[var(--text-caption)] text-[var(--text-3)]">
                Confiança
              </span>
              <span className="text-[var(--text-small)] font-mono tabular-nums font-medium text-[var(--text-2)]">
                {Math.round(confidence)}%
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
