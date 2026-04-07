'use client'

import { cn } from '@/lib/utils'

interface RegimeData {
  regime: string
  label: string
  macro: { selic: number; ipca: number; cambio_usd: number; brent: number }
  sector_rotation: Record<string, { signal: string; tilt_points: number }>
}

function regimeColor(regime: string) {
  const r = regime.toUpperCase()
  if (r.includes('RISK_ON') || r.includes('RECOVERY')) return 'text-[var(--pos)]'
  if (r.includes('RISK_OFF')) return 'text-[var(--neg)]'
  return 'text-[var(--warn)]'
}

function regimeBg(regime: string) {
  const r = regime.toUpperCase()
  if (r.includes('RISK_ON') || r.includes('RECOVERY')) return 'bg-[var(--pos)]/10'
  if (r.includes('RISK_OFF')) return 'bg-[var(--neg)]/10'
  return 'bg-[var(--warn)]/10'
}

export function RegimePanel({ data }: { data: RegimeData | null }) {
  if (!data) return <div className="flex items-center justify-center h-full text-[var(--text-3)] text-xs">Carregando...</div>

  const favored = Object.entries(data.sector_rotation).filter(([, v]) => v.signal === 'favorecido').map(([k]) => k)
  const unfavored = Object.entries(data.sector_rotation).filter(([, v]) => v.signal === 'desfavorecido').map(([k]) => k)

  return (
    <div className="flex flex-col gap-2.5">
      {/* Regime badge */}
      <div className="flex items-center gap-2">
        <span className={cn('text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded', regimeBg(data.regime), regimeColor(data.regime))}>
          {data.label}
        </span>
      </div>

      {/* KPIs 2x2 */}
      <div className="grid grid-cols-2 gap-1.5">
        {[
          { label: 'SELIC', value: `${data.macro.selic.toFixed(2)}%` },
          { label: 'IPCA', value: `${data.macro.ipca.toFixed(1)}%` },
          { label: 'USD/BRL', value: `R$ ${data.macro.cambio_usd.toFixed(2)}` },
          { label: 'Brent', value: `US$ ${data.macro.brent.toFixed(0)}` },
        ].map(k => (
          <div key={k.label} className="rounded bg-[var(--surface-2)]/50 px-2 py-1.5">
            <span className="text-[9px] uppercase tracking-wider text-[var(--text-3)] block">{k.label}</span>
            <span className="font-mono text-[13px] font-bold text-[var(--text-1)]">{k.value}</span>
          </div>
        ))}
      </div>

      {/* Rotation mini */}
      {favored.length > 0 && (
        <div className="text-[10px]">
          <span className="text-[var(--pos)] font-semibold">▲</span>
          <span className="text-[var(--text-3)] ml-1">{favored.join(', ')}</span>
        </div>
      )}
      {unfavored.length > 0 && (
        <div className="text-[10px]">
          <span className="text-[var(--neg)] font-semibold">▼</span>
          <span className="text-[var(--text-3)] ml-1">{unfavored.join(', ')}</span>
        </div>
      )}
    </div>
  )
}
