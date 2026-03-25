'use client'

import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/hooks/use-auth'
import { pro } from '@/lib/api/endpoints'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui'

interface NewsSectionProps {
  ticker: string
  companyName: string
}

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'agora'
  if (minutes < 60) return `${minutes}min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d`
  return new Date(dateStr).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })
}

function SentimentBadge({ sentiment }: { sentiment: string }) {
  if (sentiment === 'neutral') return null
  const isPositive = sentiment === 'positive'
  return (
    <span className={cn(
      'text-[10px] font-semibold px-1.5 py-0.5 rounded',
      isPositive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
    )}>
      {isPositive ? 'Positivo' : 'Negativo'}
    </span>
  )
}

const RI_TYPE_LABEL: Record<string, string> = {
  fato_relevante: 'Fato Relevante',
  comunicado_mercado: 'Comunicado ao Mercado',
  aviso_acionistas: 'Aviso aos Acionistas',
  assembleia: 'Assembleia',
  resultado_trimestral: 'Resultado Trimestral',
}

export function NewsSection({ ticker, companyName }: NewsSectionProps) {
  const { token } = useAuth()
  const { data: newsData, isLoading: newsLoading } = useQuery({
    queryKey: ['news', ticker],
    queryFn: () => pro.getNews(ticker, 8, token ?? undefined),
    enabled: !!ticker && !!token,
    staleTime: 5 * 60 * 1000,
  })

  const { data: riData, isLoading: riLoading } = useQuery({
    queryKey: ['ri-events', ticker],
    queryFn: () => pro.getInvestorRelations(ticker, 10, token ?? undefined),
    enabled: !!ticker && !!token,
    staleTime: 10 * 60 * 1000,
  })

  const news = newsData?.news ?? []
  const isLoading = newsLoading || riLoading
  const hasNews = news.length > 0
  const riEvents: any[] = (riData?.events ?? []).map(e => ({
    id: e.id,
    title: e.title,
    type: e.event_type || 'fato_relevante',
    date: e.published_at,
    documentUrl: e.url,
  }))
  const hasRi = riEvents.length > 0

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-16 rounded-[var(--radius)]" />
        ))}
      </div>
    )
  }

  if (!hasNews && !hasRi) {
    return (
      <div className="border border-[var(--border-1)]/20 rounded-[var(--radius)] bg-[var(--surface-1)] p-8 flex flex-col items-center justify-center gap-2">
        <p className="text-[var(--text-small)] font-medium text-[var(--text-2)]">Nenhuma notícia recente</p>
        <p className="text-[var(--text-caption)] text-[var(--text-3)]">Não encontramos notícias recentes para {ticker}.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Fatos Relevantes CVM */}
      {hasRi && (
        <div>
          <h3 className="text-[11px] font-semibold text-[var(--text-3)] uppercase tracking-wider mb-2">Fatos Relevantes CVM</h3>
          <div className="border border-[var(--border-1)]/20 rounded-[var(--radius)] bg-[var(--surface-1)] divide-y divide-[var(--border-1)]/10">
            {riEvents.map(ri => (
              <a
                key={ri.id}
                href={ri.documentUrl ?? undefined}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  'flex items-start gap-3 p-3 transition-colors first:rounded-t-xl last:rounded-b-xl',
                  ri.documentUrl ? 'hover:bg-[var(--surface-2)]/50 cursor-pointer' : 'cursor-default'
                )}
              >
                {/* Ícone documento */}
                <div className="w-8 h-8 rounded-full bg-orange-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-orange-400">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[var(--text-1)] line-clamp-2 leading-snug">{ri.title}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-orange-500/10 text-orange-400">
                      {RI_TYPE_LABEL[ri.type] ?? ri.type}
                    </span>
                    <span className="text-[10px] text-[var(--text-3)]">{relativeTime(ri.date)}</span>
                  </div>
                </div>
                {ri.documentUrl && (
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--text-3)] flex-shrink-0 mt-1">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                )}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Notícias Recentes */}
      {hasNews && (
        <div>
          <h3 className="text-[11px] font-semibold text-[var(--text-3)] uppercase tracking-wider mb-2">Notícias Recentes</h3>
          <div className="border border-[var(--border-1)]/20 rounded-[var(--radius)] bg-[var(--surface-1)] divide-y divide-[var(--border-1)]/10">
            {news.map(item => (
              <a
                key={item.id}
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-3 p-3 hover:bg-[var(--surface-2)]/50 transition-colors first:rounded-t-xl last:rounded-b-xl"
              >
                {/* Ícone notícia */}
                <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400">
                    <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" /><path d="M18 14h-8" /><path d="M15 18h-5" /><path d="M10 6h8v4h-8V6Z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[var(--text-1)] line-clamp-2 leading-snug">{item.title}</p>
                  {item.summary && (
                    <p className="text-[var(--text-caption)] text-[var(--text-3)] mt-0.5 line-clamp-1">{item.summary}</p>
                  )}
                  <div className="flex items-center gap-2 mt-1.5">
                    <span
                      className="text-[10px] font-medium px-1.5 py-0.5 rounded"
                      style={{ backgroundColor: (item.sourceColor ?? '#6366f1') + '20', color: item.sourceColor ?? '#6366f1' }}
                    >
                      {item.source}
                    </span>
                    <span className="text-[10px] text-[var(--text-3)]">{relativeTime(item.date)}</span>
                    <SentimentBadge sentiment={item.sentiment} />
                  </div>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--text-3)] flex-shrink-0 mt-1">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
                </svg>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
