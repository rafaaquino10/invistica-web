'use client'

import type { GatewayNewsItem } from '@/lib/gateway-client'
import { cn } from '@/lib/utils'

interface AssetNewsProps {
  news: GatewayNewsItem[]
  killSwitch?: { triggered: boolean; reason: string | null } | null
}

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 60) return `${minutes}min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  return `${days}d`
}

function cleanTitle(title: string): string {
  // Remove common RSS garbage
  return title
    .replace(/The post .+ appeared first on .+$/i, '')
    .replace(/O post .+ apareceu primeiro em .+$/i, '')
    .trim()
}

export function AssetNews({ news, killSwitch }: AssetNewsProps) {
  if (news.length === 0 && !killSwitch?.triggered) return null

  return (
    <div>
      {/* Kill switch banner */}
      {killSwitch?.triggered && (
        <div className="mb-3 p-3 rounded-lg bg-red/10 border border-red/30">
          <div className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red flex-shrink-0">
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
              <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <div>
              <p className="text-sm font-bold text-red">ALERTA CRÍTICO</p>
              <p className="text-xs text-red/80 mt-0.5">{killSwitch.reason ?? 'Evento crítico detectado — score zerado'}</p>
            </div>
          </div>
        </div>
      )}

      {/* News list */}
      {news.length > 0 && (
        <div className="border border-[var(--border-1)]/20 rounded-[var(--radius)] bg-[var(--surface-1)] divide-y divide-[var(--border-1)]/10">
          {news.slice(0, 5).map(item => (
            <a
              key={item.id}
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-3 p-3 hover:bg-[var(--surface-2)]/50 transition-colors first:rounded-t-xl last:rounded-b-xl"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm text-[var(--text-1)] line-clamp-2 leading-snug">
                  {cleanTitle(item.title)}
                </p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span
                    className="text-[10px] font-medium px-1.5 py-0.5 rounded"
                    style={{ backgroundColor: item.sourceColor + '20', color: item.sourceColor }}
                  >
                    {item.source}
                  </span>
                  <span className="text-[10px] text-[var(--text-3)]">{relativeTime(item.date)}</span>
                  {item.sentiment !== 'neutral' && (
                    <span className={cn(
                      'text-[10px] font-medium',
                      item.sentiment === 'positive' ? 'text-[var(--pos)]' : 'text-[var(--neg)]',
                    )}>
                      {item.sentiment === 'positive' ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--text-3)] flex-shrink-0 mt-1">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
