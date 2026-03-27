'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import type { Evidence } from '@/lib/api/endpoints'
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  Radar, ResponsiveContainer, Tooltip,
} from 'recharts'

interface IQCognitXRayProps {
  evidences: Evidence[]
  iqScore: number
  rating: string
  ratingLabel: string
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload?.[0]) {
    const d = payload[0].payload
    return (
      <div className="bg-[var(--surface-1)] border border-[var(--border-1)] rounded-lg px-3 py-2 shadow-lg max-w-xs">
        <p className="font-medium text-sm">{d.name}</p>
        <p className="font-mono text-lg font-bold" style={{ color: d.score >= 70 ? 'var(--pos)' : d.score >= 50 ? 'var(--accent-1)' : 'var(--neg)' }}>
          {d.score}/100
        </p>
        <p className="text-[10px] text-[var(--text-3)]">Peso: {(d.weight * 100).toFixed(0)}%</p>
      </div>
    )
  }
  return null
}

export function IQCognitXRay({ evidences, iqScore, rating, ratingLabel }: IQCognitXRayProps) {
  const [expandedId, setExpandedId] = useState<number | null>(null)

  if (!evidences || evidences.length === 0) return null

  // Sort by weight descending for the list, keep original for radar
  const sorted = [...evidences].sort((a, b) => b.weight - a.weight)

  // Radar data — use short names
  const radarData = evidences.map(ev => ({
    name: ev.criterion_name.length > 18 ? ev.criterion_name.slice(0, 16) + '...' : ev.criterion_name,
    fullName: ev.criterion_name,
    score: ev.score,
    weight: ev.weight,
  }))

  // Overall stats
  const avgScore = Math.round(evidences.reduce((s, e) => s + e.score * e.weight, 0) / Math.max(evidences.reduce((s, e) => s + e.weight, 0), 0.01))
  const strongCount = evidences.filter(e => e.score >= 70).length
  const weakCount = evidences.filter(e => e.score < 50).length

  return (
    <div className="bg-[var(--surface-1)] rounded-[var(--radius)] border border-[var(--border-1)] overflow-hidden">
      {/* Header */}
      <div className="px-6 pt-5 pb-4 border-b border-[var(--border-1)]/30">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-[var(--text-1)]">Score X-Ray — {evidences.length} Critérios</h3>
            <p className="text-[var(--text-caption)] text-[var(--text-2)] mt-0.5">
              Transparência total: cada critério com peso, score e evidências
            </p>
          </div>
          <div className="text-right">
            <span className={cn(
              'font-mono text-2xl font-bold',
              iqScore >= 75 ? 'text-[var(--pos)]' : iqScore >= 60 ? 'text-[var(--accent-1)]' : 'text-[var(--neg)]'
            )}>
              {iqScore}
            </span>
            <p className="text-[10px] text-[var(--text-3)]">{ratingLabel}</p>
          </div>
        </div>

        {/* Quick stats */}
        <div className="flex gap-4 mt-3">
          <span className="text-[var(--text-caption)] text-[var(--pos)]">{strongCount} fortes (&ge;70)</span>
          <span className="text-[var(--text-caption)] text-[var(--neg)]">{weakCount} fracos (&lt;50)</span>
          <span className="text-[var(--text-caption)] text-[var(--text-2)]">Média ponderada: {avgScore}</span>
        </div>
      </div>

      {/* Radar Chart */}
      <div className="px-4 py-3">
        <ResponsiveContainer width="100%" height={320}>
          <RadarChart cx="50%" cy="50%" outerRadius="65%" data={radarData}>
            <PolarGrid stroke="var(--border-1)" strokeDasharray="3 3" />
            <PolarAngleAxis
              dataKey="name"
              tick={{ fill: 'var(--text-2)', fontSize: 10 }}
              tickLine={false}
            />
            <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: 'var(--text-3)', fontSize: 9 }} tickCount={5} axisLine={false} />
            <Radar
              name="IQ-Score"
              dataKey="score"
              stroke="var(--accent-1)"
              fill="var(--accent-1)"
              fillOpacity={0.15}
              strokeWidth={2}
            />
            <Tooltip content={<CustomTooltip />} />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Criteria List — expandable */}
      <div className="border-t border-[var(--border-1)]/30">
        {sorted.map((ev) => {
          const isExpanded = expandedId === ev.criterion_id
          return (
            <div key={ev.criterion_id} className="border-b border-[var(--border-1)]/20 last:border-0">
              <button
                onClick={() => setExpandedId(isExpanded ? null : ev.criterion_id)}
                className="w-full flex items-center gap-3 px-5 py-3 hover:bg-[var(--surface-2)] transition-colors text-left"
              >
                {/* Score badge */}
                <span className={cn(
                  'w-9 h-9 rounded-lg flex items-center justify-center font-mono text-sm font-bold shrink-0',
                  ev.score >= 70 ? 'bg-[var(--pos)]/10 text-[var(--pos)]' :
                  ev.score >= 50 ? 'bg-[var(--accent-1)]/10 text-[var(--accent-1)]' :
                  'bg-[var(--neg)]/10 text-[var(--neg)]'
                )}>
                  {ev.score}
                </span>

                {/* Name + weight bar */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-[var(--text-1)] truncate">{ev.criterion_name}</span>
                    <span className="text-[10px] text-[var(--text-3)] font-mono shrink-0">{(ev.weight * 100).toFixed(0)}%</span>
                  </div>
                  <div className="mt-1 h-1 bg-[var(--bg)] rounded-full overflow-hidden">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all',
                        ev.score >= 70 ? 'bg-[var(--pos)]' : ev.score >= 50 ? 'bg-[var(--accent-1)]' : 'bg-[var(--neg)]'
                      )}
                      style={{ width: `${ev.score}%` }}
                    />
                  </div>
                </div>

                {/* Expand arrow */}
                <svg
                  xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
                  fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  className={cn('text-[var(--text-3)] transition-transform shrink-0', isExpanded && 'rotate-180')}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {/* Expanded content */}
              {isExpanded && (
                <div className="px-5 pb-4 space-y-3">
                  {/* Evidence text */}
                  {ev.evidence_text && (
                    <p className="text-[var(--text-caption)] text-[var(--text-2)] leading-relaxed">{ev.evidence_text}</p>
                  )}

                  {/* Bull / Bear points */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {ev.bull_points.length > 0 && (
                      <div className="p-3 rounded-lg bg-[var(--pos)]/5 border border-[var(--pos)]/10">
                        <p className="text-[10px] font-bold text-[var(--pos)] uppercase tracking-wider mb-1">Pontos Fortes</p>
                        <ul className="space-y-0.5">
                          {ev.bull_points.map((bp, i) => (
                            <li key={i} className="text-[var(--text-caption)] text-[var(--text-1)]">+ {bp}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {ev.bear_points.length > 0 && (
                      <div className="p-3 rounded-lg bg-[var(--neg)]/5 border border-[var(--neg)]/10">
                        <p className="text-[10px] font-bold text-[var(--neg)] uppercase tracking-wider mb-1">Riscos</p>
                        <ul className="space-y-0.5">
                          {ev.bear_points.map((bp, i) => (
                            <li key={i} className="text-[var(--text-caption)] text-[var(--text-1)]">- {bp}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Source */}
                  {ev.source_type && (
                    <p className="text-[10px] text-[var(--text-3)]">Fonte: {ev.source_type}</p>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
