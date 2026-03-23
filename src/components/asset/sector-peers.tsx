'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'
import { ScoreBadge, ChangeIndicator } from '@/components/ui'
import { AssetLogo } from '@/components/ui/asset-logo'

interface SectorPeer {
  ticker: string
  name: string
  logo: string
  scoreTotal: number | null
  peRatio: number | null
  roe: number | null
  dividendYield: number | null
  price: number
  changePercent: number
}

interface SectorPeersProps {
  peers: SectorPeer[]
  currentTicker: string
  sector: string
}

function fmtR(val: number | null | undefined, d = 1): string {
  if (val == null || isNaN(val) || val === 0) return '—'
  return val.toFixed(d)
}

function fmtP(val: number | null | undefined): string {
  if (val == null || isNaN(val) || val === 0) return '—'
  return `${val.toFixed(1)}%`
}

export function SectorPeers({ peers, currentTicker }: SectorPeersProps) {
  if (peers.length === 0) return null

  return (
    <div className="border border-[var(--border-1)]/20 rounded-[var(--radius)] bg-[var(--surface-1)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border-1)]/10">
                <th className="text-left py-2.5 px-3 text-xs font-medium text-[var(--text-3)] uppercase tracking-wide">Ativo</th>
                <th className="text-center py-2.5 px-3 text-xs font-medium text-[var(--text-3)] uppercase tracking-wide">Score</th>
                <th className="text-right py-2.5 px-3 text-xs font-medium text-[var(--text-3)] uppercase tracking-wide">P/L</th>
                <th className="text-right py-2.5 px-3 text-xs font-medium text-[var(--text-3)] uppercase tracking-wide">ROE</th>
                <th className="text-right py-2.5 px-3 text-xs font-medium text-[var(--text-3)] uppercase tracking-wide">DY</th>
                <th className="text-right py-2.5 px-3 text-xs font-medium text-[var(--text-3)] uppercase tracking-wide">Variação</th>
              </tr>
            </thead>
            <tbody>
              {peers.map(peer => (
                <tr
                  key={peer.ticker}
                  className={cn(
                    'border-b border-[var(--border-1)]/5 last:border-0 hover:bg-[var(--surface-2)]/50 transition-colors',
                    peer.ticker === currentTicker && 'bg-[var(--accent-1)]/5',
                  )}
                >
                  <td className="py-2 px-3">
                    <Link href={`/ativo/${peer.ticker}`} className="flex items-center gap-2 hover:text-[var(--accent-1)] transition-colors">
                      <AssetLogo ticker={peer.ticker} logo={peer.logo} size={24} />
                      <div>
                        <span className="font-mono font-medium text-[var(--text-1)]">{peer.ticker}</span>
                        <p className="text-[10px] text-[var(--text-3)] truncate max-w-[120px]">{peer.name}</p>
                      </div>
                    </Link>
                  </td>
                  <td className="py-2 px-3 text-center">
                    <ScoreBadge score={peer.scoreTotal} size="sm" />
                  </td>
                  <td className="py-2 px-3 text-right font-mono text-[var(--text-2)]">{fmtR(peer.peRatio)}</td>
                  <td className="py-2 px-3 text-right font-mono text-[var(--text-2)]">{fmtP(peer.roe)}</td>
                  <td className="py-2 px-3 text-right font-mono text-[var(--text-2)]">{fmtP(peer.dividendYield)}</td>
                  <td className="py-2 px-3 text-right">
                    <ChangeIndicator value={peer.changePercent} size="sm" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
  )
}
