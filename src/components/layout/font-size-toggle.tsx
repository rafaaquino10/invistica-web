'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'

type FontScale = 'compact' | 'normal' | 'large'

const SCALES: { key: FontScale; label: string; icon: string }[] = [
  { key: 'compact', label: 'Menor', icon: 'A' },
  { key: 'normal', label: 'Normal', icon: 'A' },
  { key: 'large', label: 'Maior', icon: 'A' },
]

const ZOOM_MAP: Record<FontScale, string> = {
  compact: '0.92',
  normal: '1',
  large: '1.08',
}

function applyZoom(scale: FontScale) {
  document.documentElement.style.setProperty('--content-zoom', ZOOM_MAP[scale] ?? '1')
  document.documentElement.setAttribute('data-font-size', scale)
}

export function FontSizeToggle({ className }: { className?: string }) {
  const [scale, setScale] = useState<FontScale>('normal')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const saved = localStorage.getItem('aqinvest-font-size') as FontScale | null
    if (saved && ZOOM_MAP[saved]) {
      setScale(saved)
      applyZoom(saved)
    }
  }, [])

  if (!mounted) return null

  const cycle = () => {
    const order: FontScale[] = ['compact', 'normal', 'large']
    const idx = order.indexOf(scale)
    const next = order[(idx + 1) % order.length] as FontScale
    setScale(next)
    applyZoom(next)
    localStorage.setItem('aqinvest-font-size', next)
  }

  const currentLabel = SCALES.find(s => s.key === scale)?.label ?? 'Normal'

  return (
    <button
      onClick={cycle}
      className={cn(
        'flex items-center gap-1 rounded-lg p-2.5 transition-colors',
        'hover:bg-[var(--surface-2)] text-[var(--text-2)]',
        'hover:text-[var(--text-1)]',
        className
      )}
      aria-label={`Tamanho: ${currentLabel}. Clique para alternar.`}
      title={`Fonte: ${currentLabel}`}
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="4 7 4 4 20 4 20 7" />
        <line x1="9" y1="20" x2="15" y2="20" />
        <line x1="12" y1="4" x2="12" y2="20" />
      </svg>
      {scale !== 'normal' && (
        <span className="text-[9px] font-semibold uppercase tracking-wider">
          {scale === 'compact' ? '−' : '+'}
        </span>
      )}
    </button>
  )
}
