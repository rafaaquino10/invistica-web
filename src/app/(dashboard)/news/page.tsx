'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/hooks/use-auth'
import { pro } from '@/lib/api/endpoints'
import { Skeleton, Disclaimer, Input } from '@/components/ui'
import { AssetLogo } from '@/components/ui/asset-logo'
import { cn } from '@/lib/utils'
import Link from 'next/link'

const SENTIMENT_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  positive: { label: 'Positivo', color: 'text-[var(--pos)]', bg: 'bg-[var(--pos)]/10' },
  negative: { label: 'Negativo', color: 'text-[var(--neg)]', bg: 'bg-[var(--neg)]/10' },
  neutral: { label: 'Neutro', color: 'text-[var(--text-3)]', bg: 'bg-[var(--surface-2)]' },
}

export default function NewsPage() {
  const { token } = useAuth()
  const [ticker, setTicker] = useState('')
  const [searchTicker, setSearchTicker] = useState('')

  const { data: radarFeed, isLoading: loadingFeed } = useQuery({
    queryKey: ['radar-feed-news'],
    queryFn: () => pro.getRadarFeed(50, 'all', token ?? undefined),
    enabled: !!token,
    staleTime: 2 * 60 * 1000,
  })

  const { data: tickerNews, isLoading: loadingTicker } = useQuery({
    queryKey: ['news-ticker', searchTicker],
    queryFn: () => pro.getNews(searchTicker, 20, token ?? undefined),
    enabled: !!token && searchTicker.length >= 3,
    staleTime: 5 * 60 * 1000,
  })

  const handleSearch = () => {
    if (ticker.trim().length >= 3) {
      setSearchTicker(ticker.trim().toUpperCase())
    }
  }

  const feed = radarFeed?.feed ?? []
  const newsItems = tickerNews?.news ?? []
  const showTickerNews = searchTicker.length >= 3

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-[var(--text-title)] font-bold tracking-tight">Notícias & Eventos</h1>
        <p className="text-[var(--text-small)] text-[var(--text-2)] mt-0.5">Feed de notícias com análise de sentimento NLP</p>
      </div>

      {/* Search by ticker */}
      <div className="flex gap-2">
        <Input
          placeholder="Buscar por ticker (ex: VALE3)..."
          value={ticker}
          onChange={(e) => setTicker(e.target.value.toUpperCase())}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSearch() }}
          className="max-w-xs"
        />
        <button
          onClick={handleSearch}
          className="px-4 py-2 bg-[var(--accent-1)] text-white text-sm font-medium rounded-lg hover:opacity-90"
        >
          Buscar
        </button>
        {showTickerNews && (
          <button
            onClick={() => { setSearchTicker(''); setTicker('') }}
            className="px-3 py-2 text-sm text-[var(--text-2)] hover:text-[var(--text-1)]"
          >
            Limpar
          </button>
        )}
      </div>

      {/* Ticker-specific news */}
      {showTickerNews && (
        <div className="bg-[var(--surface-1)] rounded-[var(--radius)] border border-[var(--border-1)] overflow-hidden">
          <div className="px-5 py-3 border-b border-[var(--border-1)]/30 flex items-center gap-2">
            <AssetLogo ticker={searchTicker} size={24} />
            <h2 className="text-sm font-semibold">{searchTicker}</h2>
            <span className="text-[var(--text-caption)] text-[var(--text-2)]">{newsItems.length} notícias</span>
          </div>
          {loadingTicker ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-16" />)}
            </div>
          ) : newsItems.length > 0 ? (
            <div className="divide-y divide-[var(--border-1)]/20">
              {newsItems.map((n) => (
                <NewsCard key={n.id} news={n} />
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-[var(--text-2)]">
              Nenhuma notícia encontrada para {searchTicker}
            </div>
          )}
        </div>
      )}

      {/* General feed */}
      {!showTickerNews && (
        <div className="bg-[var(--surface-1)] rounded-[var(--radius)] border border-[var(--border-1)] overflow-hidden">
          <div className="px-5 py-3 border-b border-[var(--border-1)]/30">
            <h2 className="text-sm font-semibold">Feed Geral</h2>
            <p className="text-[var(--text-caption)] text-[var(--text-2)]">Últimos eventos do mercado B3</p>
          </div>
          {loadingFeed ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-16" />)}
            </div>
          ) : feed.length > 0 ? (
            <div className="divide-y divide-[var(--border-1)]/20">
              {feed.map((item) => (
                <div key={item.id} className="px-5 py-3 hover:bg-[var(--surface-2)] transition-colors">
                  <div className="flex items-start gap-3">
                    <span className={cn(
                      'mt-1 w-2 h-2 rounded-full shrink-0',
                      item.severity === 'high' ? 'bg-[var(--neg)]' :
                      item.severity === 'medium' ? 'bg-amber-500' :
                      'bg-[var(--text-3)]'
                    )} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-[var(--surface-2)] text-[var(--text-3)]">{item.type}</span>
                        {item.tickers.length > 0 && (
                          <div className="flex gap-1">
                            {item.tickers.slice(0, 3).map(t => (
                              <Link key={t} href={`/ativo/${t}`} className="text-[10px] font-mono font-medium text-[var(--accent-1)] hover:underline">{t}</Link>
                            ))}
                          </div>
                        )}
                        {item.sentiment && (
                          <span className={cn('text-[10px] px-1.5 py-0.5 rounded', SENTIMENT_LABELS[item.sentiment]?.bg, SENTIMENT_LABELS[item.sentiment]?.color)}>
                            {SENTIMENT_LABELS[item.sentiment]?.label}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-[var(--text-1)]">{item.title}</p>
                      <p className="text-[var(--text-caption)] text-[var(--text-2)] mt-0.5">{item.message}</p>
                      <div className="flex items-center gap-2 mt-1 text-[10px] text-[var(--text-3)]">
                        {item.source && <span>{item.source}</span>}
                        <span>{new Date(item.date).toLocaleDateString('pt-BR')}</span>
                        {item.url && (
                          <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-[var(--accent-1)] hover:underline">
                            Ver mais
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-[var(--text-2)]">
              Nenhum evento disponível
            </div>
          )}
        </div>
      )}

      <Disclaimer variant="inline" className="block" />
    </div>
  )
}

function NewsCard({ news }: { news: { id: string; title: string; summary: string | null; url: string | null; source: string | null; published_at: string; sentiment: string | null; sentiment_score: number | null } }) {
  const sent = SENTIMENT_LABELS[news.sentiment ?? ''] ?? SENTIMENT_LABELS['neutral']!
  return (
    <a
      href={news.url ?? '#'}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-start gap-3 px-5 py-3 hover:bg-[var(--surface-2)] transition-colors"
    >
      <span className={cn('mt-1.5 w-2 h-2 rounded-full shrink-0', sent.bg.replace('/10', ''))} />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-[var(--text-1)] font-medium line-clamp-2">{news.title}</p>
        {news.summary && <p className="text-[var(--text-caption)] text-[var(--text-2)] mt-0.5 line-clamp-2">{news.summary}</p>}
        <div className="flex items-center gap-2 mt-1 text-[10px] text-[var(--text-3)]">
          {news.source && <span>{news.source}</span>}
          <span>{new Date(news.published_at).toLocaleDateString('pt-BR')}</span>
          {news.sentiment_score != null && (
            <span className={cn('px-1.5 py-0.5 rounded', sent.bg, sent.color)}>
              {news.sentiment_score > 0 ? '+' : ''}{(news.sentiment_score * 100).toFixed(0)}%
            </span>
          )}
        </div>
      </div>
    </a>
  )
}
