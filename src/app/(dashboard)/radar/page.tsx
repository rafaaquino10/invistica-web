'use client'

import { useState } from 'react'
import { Button, Modal, Input, Skeleton, Tabs, TabPanel, ScrollableStrip } from '@/components/ui'
import { PaywallGate } from '@/components/billing'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/hooks/use-auth'
import { pro } from '@/lib/api/endpoints'
import { cn } from '@/lib/utils'
import { AssetLogo } from '@/components/ui/asset-logo'

export default function RadarPage() {
  const [showCreateAlert, setShowCreateAlert] = useState(false)
  const { token } = useAuth()

  const { data: feedData } = useQuery({
    queryKey: ['radar-feed'],
    queryFn: () => pro.getRadarFeed(30, 'all', token ?? undefined),
    enabled: !!token,
    staleTime: 5 * 60 * 1000,
  })
  const feed = feedData?.feed ?? undefined

  const queryClient = useQueryClient()

  const { data: alertsData } = useQuery({
    queryKey: ['radar-alerts'],
    queryFn: () => pro.getAlerts(token ?? undefined),
    enabled: !!token,
  })
  const alerts = alertsData?.alerts ?? undefined

  const { mutate: deleteAlert } = useMutation({
    mutationFn: (alertId: string) => pro.deleteAlert(alertId, token ?? undefined),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['radar-alerts'] }),
  })

  const feedCount = feed?.length ?? 0
  const alertCount = alerts?.filter((a) => a.is_active)?.length ?? 0

  const radarTabs = [
    {
      id: 'feed',
      label: 'Feed',
      badge: feedCount > 0 ? feedCount : undefined,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M4 11a9 9 0 0 1 9 9" /><path d="M4 4a16 16 0 0 1 16 16" /><circle cx="5" cy="19" r="1" />
        </svg>
      )
    },
    {
      id: 'alerts',
      label: 'Alertas',
      badge: alertCount > 0 ? alertCount : undefined,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
      )
    },
    {
      id: 'health',
      label: 'Saúde',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
        </svg>
      )
    },
  ]

  return (
    <div className="space-y-6">
      {/* Cabeçalho da página */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-[var(--text-title)] font-bold tracking-tight">Radar</h1>
          <p className="text-[var(--text-small)] text-[var(--text-2)] mt-0.5">
            <span className="font-mono">{feedCount}</span> insights
            <span className="mx-1">&middot;</span>
            <span className="font-mono">{alertCount}</span> alertas ativos
          </p>
        </div>
        <Button variant="primary" onClick={() => setShowCreateAlert(true)}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" />
          </svg>
          Novo Alerta
        </Button>
      </div>

      <Tabs tabs={radarTabs} defaultTab="feed" urlParam="aba">
        <div className="mt-6">
          <TabPanel id="feed"><FeedTab /></TabPanel>
          <TabPanel id="alerts"><AlertsTab onCreateClick={() => setShowCreateAlert(true)} /></TabPanel>
          <TabPanel id="health"><HealthTab /></TabPanel>
        </div>
      </Tabs>

      <CreateAlertModal isOpen={showCreateAlert} onClose={() => setShowCreateAlert(false)} />
    </div>
  )
}

// ===========================================
// Aba Feed — Estilo Timeline (Unificado com Notícias)
// ===========================================

// Filtros disponíveis no feed unificado
const FEED_FILTERS = [
  { value: 'all', label: 'Todos' },
  { value: 'news', label: 'Notícias' },
  { value: 'ri_event', label: 'RI / CVM' },
  { value: 'exit_alert', label: 'Alertas' },
  { value: 'score_change', label: 'Score' },
  { value: 'momentum_shift', label: 'Momento' },
] as const

/** Converte uma data em rótulo relativo agrupado */
function getRelativeGroupLabel(date: Date): string {
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfYesterday = new Date(startOfToday.getTime() - 86400000)
  const startOfWeek = new Date(startOfToday.getTime() - 6 * 86400000)

  const itemDay = new Date(date.getFullYear(), date.getMonth(), date.getDate())

  if (itemDay.getTime() === startOfToday.getTime()) return 'Hoje'
  if (itemDay.getTime() === startOfYesterday.getTime()) return 'Ontem'
  if (itemDay >= startOfWeek) return 'Esta Semana'
  return 'Mais Antigo'
}

/** Ordem de exibição dos grupos relativos */
const GROUP_ORDER = ['Hoje', 'Ontem', 'Esta Semana', 'Mais Antigo']

function FeedTab() {
  const { token } = useAuth()
  const { data: feedData, isLoading } = useQuery({
    queryKey: ['radar-feed-tab'],
    queryFn: () => pro.getRadarFeed(30, 'all', token ?? undefined),
    enabled: !!token,
    staleTime: 5 * 60 * 1000,
  })
  const feed = feedData?.feed
  const [feedFilter, setFeedFilter] = useState<string>('all')

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex gap-4">
            <div className="flex flex-col items-center">
              <Skeleton className="w-10 h-10 rounded-full" />
              <Skeleton className="w-0.5 flex-1 mt-2" />
            </div>
            <Skeleton className="flex-1 h-20 rounded-[var(--radius)]" />
          </div>
        ))}
      </div>
    )
  }

  const allItems = feed ?? []

  if (allItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <h3 className="text-[var(--text-subheading)] font-semibold mb-2">Seu feed está vazio</h3>
        <p className="text-[var(--text-small)] text-[var(--text-2)] max-w-sm">
          Aguardando notícias, fatos relevantes e insights do motor de análise
        </p>
      </div>
    )
  }

  // Filtro por tipo
  const filteredFeed = feedFilter === 'all'
    ? allItems
    : allItems.filter((item: any) => {
        if (feedFilter === 'news') return item.type === 'news'
        if (feedFilter === 'ri_event') return item.type === 'ri_event'
        if (feedFilter === 'exit_alert') return item.type === 'exit_alert'
        if (feedFilter === 'momentum_shift') return item.insightType === 'momentum_shift' || item.type === 'momentum_shift'
        if (feedFilter === 'score_change') return item.insightType === 'score_change' || item.type === 'score_change'
        return item.type === feedFilter
      })

  // Estatísticas do feed
  const unreadCount = allItems.filter((item: any) => !item.isRead).length
  const exitAlertCount = allItems.filter((item: any) => item.type === 'exit_alert').length
  const today = new Date()

  // Agrupamento por rótulo relativo
  const groupedFeed = filteredFeed.reduce((groups: Record<string, any[]>, item: any) => {
    const label = getRelativeGroupLabel(new Date(item.date))
    if (!groups[label]) groups[label] = []
    groups[label]!.push(item)
    return groups
  }, {} as Record<string, any[]>)

  // Ordena os grupos na sequência correta
  const orderedGroups = GROUP_ORDER.filter((label) => !!groupedFeed[label])

  return (
    <div className="space-y-6">
      {/* Resumo do feed */}
      <div className="flex flex-wrap items-center gap-3 px-4 py-3 bg-[var(--surface-1)] border border-[var(--border-1)] rounded-[var(--radius)] shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[var(--accent-1)] animate-pulse" />
          <span className="text-[var(--text-small)] font-medium">
            {unreadCount > 0
              ? `${unreadCount} ${unreadCount === 1 ? 'nova atualização' : 'novas atualizações'}`
              : 'Tudo lido'}
          </span>
        </div>
        {exitAlertCount > 0 && (
          <>
            <span className="text-[var(--text-2)] text-[var(--text-small)]">&middot;</span>
            <span className="text-[var(--text-small)] text-[var(--text-2)]">
              <span className="font-mono font-semibold text-orange-400">{exitAlertCount}</span> alerta{exitAlertCount !== 1 ? 's' : ''} de saída
            </span>
          </>
        )}
        <span className="text-[var(--text-2)] text-[var(--text-small)] ml-auto">
          {today.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </span>
      </div>

      {/* Chips de filtro com fade indicator */}
      <ScrollableStrip>
        <div className="flex gap-2">
          {FEED_FILTERS.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setFeedFilter(filter.value)}
              className={cn(
                'px-3 py-1.5 text-[var(--text-small)] font-medium rounded-lg transition-all whitespace-nowrap',
                feedFilter === filter.value
                  ? 'bg-[var(--accent-1)] text-white'
                  : 'bg-[var(--surface-2)] text-[var(--text-2)] hover:text-[var(--text-1)]'
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </ScrollableStrip>

      {/* Lista filtrada vazia */}
      {filteredFeed.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-[var(--text-small)] text-[var(--text-2)]">Nenhum item nesta categoria</p>
        </div>
      )}

      {/* Grupos por período relativo */}
      {orderedGroups.map((label) => {
        const items = groupedFeed[label]!
        return (
          <div key={label}>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-[var(--text-small)] font-medium uppercase tracking-wider text-[var(--text-2)]">{label}</span>
              <div className="flex-1 h-px bg-[var(--border-1)]" />
            </div>
            <div className="relative">
              <div className="absolute left-5 top-6 bottom-6 w-px bg-gradient-to-b from-[var(--border-1)] via-[var(--border-1)] to-transparent" />
              <div className="space-y-1">
                {items.map((item, index) => (
                  <TimelineItem
                    key={item.id}
                    item={item}
                    isLast={index === items.length - 1}
                    onRead={() => { /* TODO: implement markRead when API endpoint available */ }}
                  />
                ))}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function SentimentBadge({ sentiment }: { sentiment?: string }) {
  if (!sentiment || sentiment === 'neutral') return null
  const isPositive = sentiment === 'positive'
  return (
    <span className={cn(
      'px-1.5 py-0.5 text-[var(--text-caption)] font-medium rounded',
      isPositive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
    )}>
      {isPositive ? 'Positivo' : 'Negativo'}
    </span>
  )
}

function TimelineItem({ item, isLast, onRead }: { item: any; isLast: boolean; onRead: () => void }) {
  const getIconConfig = () => {
    const neutral = { bg: 'bg-[var(--surface-2)]', textColor: 'text-[var(--text-2)]', borderColor: '' }

    // Notícia do feed unificado
    if (item.type === 'news') {
      return { icon: 'newspaper', bg: 'bg-blue-500/10', textColor: 'text-blue-400', borderColor: '' }
    }

    // RI CVM (fatos relevantes, comunicados)
    if (item.type === 'ri_event') {
      return { icon: 'file-text', bg: 'bg-orange-500/10', textColor: 'text-orange-400', borderColor: 'border-l-2 border-l-orange-400' }
    }

    // Exit alert (motor de carteiras)
    if (item.type === 'exit_alert') {
      const isCritical = item.severity === 'critical'
      return {
        icon: 'shield-alert',
        bg: isCritical ? 'bg-red-500/15' : 'bg-amber-500/15',
        textColor: isCritical ? 'text-red-400' : 'text-amber-400',
        borderColor: isCritical ? 'border-l-2 border-l-red-400' : 'border-l-2 border-l-amber-400',
      }
    }

    // Itens do tipo alerta (preço, dividendo)
    if (item.type === 'alert') {
      switch (item.category) {
        case 'price_below': return { ...neutral, icon: 'arrow-down' }
        case 'price_above': return { ...neutral, icon: 'arrow-up' }
        case 'dividend': return { ...neutral, icon: 'dollar' }
        default: return { ...neutral, icon: 'bell' }
      }
    }

    // Relatório Focus (BCB)
    if (item.type === 'focus') {
      return { icon: 'focus', bg: 'bg-blue-500/15', textColor: 'text-blue-400', borderColor: 'border-l-2 border-l-blue-400' }
    }

    // Alerta crítico kill switch
    if (item.insightType === 'kill_switch_critical') {
      return { icon: 'shield-alert', bg: 'bg-red-500/15', textColor: 'text-red-400', borderColor: 'border-l-2 border-l-red-400' }
    }

    // Mudança de momentum
    if (item.insightType === 'momentum_shift') {
      return { icon: 'zap', bg: 'bg-purple-500/15', textColor: 'text-purple-400', borderColor: 'border-l-2 border-l-purple-400' }
    }

    // Estilo baseado na categoria
    switch (item.category) {
      case 'opportunity': return { icon: 'trending-up', bg: 'bg-emerald-500/15', textColor: 'text-emerald-400', borderColor: 'border-l-2 border-l-emerald-400' }
      case 'risk': return { icon: 'alert', bg: 'bg-orange-500/15', textColor: 'text-orange-400', borderColor: 'border-l-2 border-l-orange-400' }
      case 'milestone': return { icon: 'star', bg: 'bg-amber-500/15', textColor: 'text-amber-400', borderColor: 'border-l-2 border-l-amber-400' }
      case 'valuation': return { ...neutral, icon: 'search' }
      case 'quality': return { ...neutral, icon: 'star' }
      case 'info': return { icon: 'info', bg: 'bg-blue-500/10', textColor: 'text-blue-400', borderColor: '' }
      default: return { ...neutral, icon: 'info' }
    }
  }

  const config = getIconConfig()

  // Links: news → fonte original, ri_event → PDF CVM
  const hasExternalLink = item.type === 'news' ? !!item.link : item.type === 'ri_event' ? !!item.documentUrl : false
  const externalHref = item.type === 'news' ? item.link : item.type === 'ri_event' ? item.documentUrl : undefined
  const Wrapper = hasExternalLink ? 'a' : 'div'
  const wrapperProps = hasExternalLink
    ? { href: externalHref, target: '_blank', rel: 'noopener noreferrer' }
    : { onClick: onRead }

  const hasTickers = item.tickers && item.tickers.length > 0

  return (
    <Wrapper
      {...(wrapperProps as any)}
      className={cn(
        'group relative flex gap-4 py-3 px-2 -mx-2 rounded-[var(--radius)] cursor-pointer transition-all duration-200',
        'hover:bg-[var(--surface-2)]',
        !item.isRead && 'bg-[var(--accent-1)]/[0.02]',
        config.borderColor && `pl-4 ${config.borderColor}`
      )}
    >
      <div className="relative z-10 flex-shrink-0">
        <div className={cn('w-10 h-10 rounded-full flex items-center justify-center', config.bg)}>
          <TimelineIcon type={config.icon} className={config.textColor} />
        </div>
        {!item.isRead && <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-[var(--accent-1)] rounded-full border-2 border-[var(--bg)]" />}
      </div>
      <div className="flex-1 min-w-0 pt-1">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            {item.type === 'news' && item.source && (
              <span className="text-[var(--text-caption)] font-mono text-[var(--text-2)] block mb-0.5">{item.source}</span>
            )}
            {item.type === 'ri_event' && (
              <span className="text-[var(--text-caption)] font-mono text-orange-400 block mb-0.5">CVM / RI</span>
            )}
            {item.type === 'exit_alert' && (
              <span className={cn('text-[var(--text-caption)] font-mono block mb-0.5', item.severity === 'critical' ? 'text-red-400' : 'text-amber-400')}>
                {item.severity === 'critical' ? 'ALERTA CRÍTICO' : 'ATENÇÃO'}
              </span>
            )}
            <span className="font-medium text-[var(--text-1)] text-[var(--text-body)]">{item.title}</span>
            <p className="text-[var(--text-small)] text-[var(--text-2)] mt-0.5 line-clamp-2">{item.message}</p>
            {/* Tickers clicáveis + Sentiment badge */}
            {(hasTickers || item.sentiment) && (
              <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                {hasTickers && item.tickers.map((t: string) => (
                  <a
                    key={t}
                    href={`/ativo/${t}`}
                    onClick={(e) => e.stopPropagation()}
                    className="px-2 py-0.5 text-[var(--text-caption)] font-mono font-bold rounded bg-[var(--accent-1)]/10 text-[var(--accent-1)] hover:bg-[var(--accent-1)]/20 transition-colors"
                  >
                    {t}
                  </a>
                ))}
                {item.type === 'news' && <SentimentBadge sentiment={item.sentiment} />}
              </div>
            )}
          </div>
          <span className="text-[var(--text-caption)] font-mono text-[var(--text-2)] whitespace-nowrap flex-shrink-0 pt-1">
            {formatTimeAgo(new Date(item.date))}
          </span>
        </div>
      </div>
    </Wrapper>
  )
}

function TimelineIcon({ type, className }: { type: string; className?: string }) {
  const icons: Record<string, React.ReactNode> = {
    'arrow-down': <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="12" y1="5" x2="12" y2="19" /><polyline points="19 12 12 19 5 12" /></svg>,
    'arrow-up': <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="12" y1="19" x2="12" y2="5" /><polyline points="5 12 12 5 19 12" /></svg>,
    'dollar': <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>,
    'bell': <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /></svg>,
    'star': <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>,
    'alert': <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>,
    'search': <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>,
    'info': <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>,
    'zap': <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>,
    'shield-alert': <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>,
    'trending-up': <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></svg>,
    'focus': <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="3" /><path d="M12 2v4" /><path d="M12 18v4" /><path d="M4.93 4.93l2.83 2.83" /><path d="M16.24 16.24l2.83 2.83" /><path d="M2 12h4" /><path d="M18 12h4" /><path d="M4.93 19.07l2.83-2.83" /><path d="M16.24 7.76l2.83-2.83" /></svg>,
    'newspaper': <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" /><path d="M18 14h-8" /><path d="M15 18h-5" /><path d="M10 6h8v4h-8V6Z" /></svg>,
    'file-text': <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>,
  }
  return <>{icons[type] ?? icons['info']}</>
}

// ===========================================
// Aba de Alertas
// ===========================================

function AlertsTab({ onCreateClick }: { onCreateClick: () => void }) {
  const { token } = useAuth()
  const queryClient = useQueryClient()

  const { data: alertsData, isLoading } = useQuery({
    queryKey: ['radar-alerts'],
    queryFn: () => pro.getAlerts(token ?? undefined),
    enabled: !!token,
  })
  const alerts = alertsData?.alerts

  const deleteAlertMut = useMutation({
    mutationFn: (alertId: string) => pro.deleteAlert(alertId, token ?? undefined),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['radar-alerts'] }),
  })

  if (isLoading) {
    return <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 rounded-[var(--radius)]" />)}</div>
  }

  if (!alerts || alerts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <h3 className="text-[var(--text-subheading)] font-semibold mb-2">Nenhuma variação significativa de score detectada.</h3>
        <p className="text-[var(--text-small)] text-[var(--text-2)] max-w-sm mb-6">
          Crie alertas para ser notificado sobre mudanças de preço, dividendos e score
        </p>
        <Button variant="primary" onClick={onCreateClick}>Criar Primeiro Alerta</Button>
      </div>
    )
  }

  const activeAlerts = alerts.filter((a: any) => a.is_active)
  const inactiveAlerts = alerts.filter((a: any) => !a.is_active)

  return (
    <div className="space-y-6">
      <p className="text-[var(--text-small)] text-[var(--text-2)]">
        <span className="font-mono font-bold text-[var(--text-1)]">{activeAlerts.length}</span> ativos
        <span className="mx-2">&middot;</span>
        <span className="font-mono font-bold text-[var(--text-1)]">{inactiveAlerts.length}</span> inativos
      </p>

      {activeAlerts.length > 0 && (
        <div>
          <h3 className="text-[var(--text-small)] font-semibold uppercase tracking-wider text-[var(--text-3)] mb-3">Alertas Ativos</h3>
          <div className="bg-[var(--surface-1)] rounded-[var(--radius)] shadow-sm border border-[var(--border-1)] divide-y divide-[var(--border-1)]">
            {activeAlerts.map((alert: any) => (
              <AlertRow key={alert.id} alert={alert} onToggle={() => {}} onDelete={() => deleteAlertMut.mutate(alert.id)} />
            ))}
          </div>
        </div>
      )}

      {inactiveAlerts.length > 0 && (
        <div>
          <h3 className="text-[var(--text-small)] font-semibold uppercase tracking-wider text-[var(--text-3)] mb-3">Alertas Inativos</h3>
          <div className="bg-[var(--surface-1)] rounded-[var(--radius)] shadow-sm border border-[var(--border-1)] divide-y divide-[var(--border-1)] opacity-60">
            {inactiveAlerts.map((alert: any) => (
              <AlertRow key={alert.id} alert={alert} onToggle={() => {}} onDelete={() => deleteAlertMut.mutate(alert.id)} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function AlertRow({ alert, onToggle, onDelete }: { alert: any; onToggle: () => void; onDelete: () => void }) {
  const typeConfig: Record<string, { label: string }> = {
    price_above: { label: 'Preço acima de' },
    price_below: { label: 'Preço abaixo de' },
    score_change: { label: 'Mudança no Score' },
    dividend: { label: 'Novo dividendo' },
  }

  const config = typeConfig[alert.type] ?? typeConfig['dividend']!

  return (
    <div className="flex items-center gap-4 px-4 py-3 group hover:bg-[var(--surface-2)] transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-mono font-semibold text-[var(--text-small)]">{alert.ticker}</span>
        </div>
        <p className="text-[var(--text-small)] text-[var(--text-2)]">
          {config.label}{' '}
          {alert.threshold && <span className="font-mono font-medium text-[var(--text-1)]">R$ {alert.threshold.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <button onClick={onToggle} className={cn('relative w-11 h-6 rounded-full transition-colors', alert.is_active ? 'bg-teal' : 'bg-[var(--border-1)]')}>
          <span className={cn('absolute top-1 w-4 h-4 rounded-full bg-white transition-transform', alert.is_active ? 'left-6' : 'left-1')} />
        </button>
        <button onClick={onDelete} className="p-2 text-[var(--text-2)] hover:text-red hover:bg-red/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
        </button>
      </div>
    </div>
  )
}

// ===========================================
// Aba de Saúde da Carteira
// ===========================================

function HealthTab() {
  const { token } = useAuth()

  const { data: risk, isLoading } = useQuery({
    queryKey: ['portfolio-health'],
    queryFn: () => pro.getPortfolioRisk('default', token ?? undefined),
    enabled: !!token,
  })

  if (isLoading) {
    return <div className="space-y-6"><Skeleton className="h-40 rounded-[var(--radius)]" /><div className="grid md:grid-cols-2 gap-4">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24 rounded-[var(--radius)]" />)}</div></div>
  }

  if (!risk || risk.positions === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <h3 className="text-[var(--text-subheading)] font-semibold mb-2">Análise indisponível</h3>
        <p className="text-[var(--text-small)] text-[var(--text-2)] max-w-sm">Adicione ativos ao portfólio para ver a análise de saúde</p>
      </div>
    )
  }

  // Compute health score from risk metrics
  const diversScore = risk.hhi < 1500 ? 90 : risk.hhi < 2500 ? 60 : 30
  const concScore = risk.top3_weight_pct < 50 ? 85 : risk.top3_weight_pct < 70 ? 55 : 25
  const sectorScore = risk.max_sector_weight_pct < 30 ? 90 : risk.max_sector_weight_pct < 50 ? 60 : 30
  const posScore = risk.positions >= 8 ? 90 : risk.positions >= 5 ? 70 : 40
  const overallScore = Math.round((diversScore + concScore + sectorScore + posScore) / 4)

  const scoreColor = overallScore >= 75 ? 'text-teal' : overallScore >= 50 ? 'text-amber' : 'text-red'
  const barGradient = overallScore >= 75 ? 'from-teal to-teal/50' : overallScore >= 50 ? 'from-amber to-amber/50' : 'from-red to-red/50'

  const metrics = [
    { title: 'Diversificação', score: diversScore, message: risk.hhi < 1500 ? 'Boa diversificação entre ativos' : risk.hhi < 2500 ? 'Concentração moderada — considere diversificar' : 'Alta concentração — risco elevado' },
    { title: 'Concentração Top 3', score: concScore, message: `Top 3 posições representam ${risk.top3_weight_pct.toFixed(1)}% da carteira` },
    { title: 'Setorial', score: sectorScore, message: `Maior setor: ${risk.max_sector_weight_pct.toFixed(1)}% da carteira` },
    { title: 'Posições', score: posScore, message: `${risk.positions} posição${risk.positions > 1 ? 'ões' : ''} — ${risk.positions >= 8 ? 'diversificação adequada' : 'considere mais ativos'}` },
  ]

  const recommendations: string[] = []
  if (risk.hhi > 2500) recommendations.push('Reduza a concentração — HHI acima de 2500 indica risco elevado')
  if (risk.top3_weight_pct > 60) recommendations.push('As 3 maiores posições dominam a carteira — rebalanceie')
  if (risk.max_sector_weight_pct > 40) recommendations.push('Exposição setorial acima de 40% — diversifique entre setores')
  if (risk.positions < 5) recommendations.push('Menos de 5 posições — aumente a diversificação')

  return (
    <PaywallGate requiredPlan="pro" feature="Análise de Saúde da Carteira" showPreview>
      <div className="space-y-4">
        {/* Pontuação geral */}
        <div className="bg-[var(--surface-1)] border border-[var(--border-1)] rounded-[var(--radius)] shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[var(--text-small)] text-[var(--text-2)] mb-1">Saúde Geral</p>
              <div className="flex items-baseline gap-2">
                <span className={`text-[var(--text-display)] font-bold font-mono ${scoreColor}`}>{overallScore}</span>
                <span className="text-[var(--text-small)] text-[var(--text-2)]">/100</span>
              </div>
            </div>
            <div className="w-20 h-20 relative">
              <svg className="w-20 h-20 transform -rotate-90">
                <circle cx="40" cy="40" r="32" fill="none" stroke="var(--border-1)" strokeWidth="6" />
                <circle cx="40" cy="40" r="32" fill="none" className={scoreColor.replace('text-', 'stroke-')} strokeWidth="6" strokeLinecap="round" strokeDasharray={`${(overallScore / 100) * 201} 201`} style={{ transition: 'stroke-dasharray 1s ease-out' }} />
              </svg>
            </div>
          </div>
          <div className="h-2 rounded-full bg-[var(--border-1)] overflow-hidden">
            <div className={`h-full rounded-full bg-gradient-to-r ${barGradient} transition-all duration-1000`} style={{ width: `${overallScore}%` }} />
          </div>
          <div className="flex justify-between mt-1.5 text-[var(--text-small)] text-[var(--text-2)]">
            <span>Crítico</span><span>Atenção</span><span>Saudável</span><span>Excepcional</span>
          </div>
        </div>

        {/* Métricas */}
        <div className="grid md:grid-cols-2 gap-3">
          {metrics.map((m) => (
            <div key={m.title} className="p-4 rounded-[var(--radius)] shadow-sm border border-[var(--border-1)] bg-[var(--surface-1)]">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-[var(--text-small)]">{m.title}</h4>
                <span className="text-[var(--text-heading)] font-bold font-mono">{m.score}</span>
              </div>
              <p className="text-[var(--text-small)] text-[var(--text-2)]">{m.message}</p>
            </div>
          ))}
        </div>

        {recommendations.length > 0 && (
          <div className="bg-[var(--surface-1)] rounded-[var(--radius)] shadow-sm border border-[var(--border-1)] overflow-hidden">
            <div className="px-4 py-2.5 border-b border-[var(--border-1)]"><h3 className="text-[var(--text-small)] font-semibold">Recomendações</h3></div>
            <div className="divide-y divide-[var(--border-1)]">
              {recommendations.map((rec: any, i: number) => (
                <div key={i} className="flex items-start gap-3 px-4 py-2.5">
                  <span className="text-[var(--text-caption)] text-[var(--text-2)] flex-shrink-0 mt-0.5">&bull;</span>
                  <p className="text-[var(--text-small)] text-[var(--text-2)]">{rec}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </PaywallGate>
  )
}

// ===========================================
// Modal de Criação de Alerta
// ===========================================

function CreateAlertModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [formData, setFormData] = useState({ ticker: '', type: 'price_below' as 'price_above' | 'price_below' | 'score_change' | 'dividend', threshold: '' })
  const { token } = useAuth()
  const queryClient = useQueryClient()

  const createAlertMut = useMutation({
    mutationFn: (params: { assetId: string; type: string; threshold?: number }) =>
      pro.createAlert(params.assetId, params.type, params.threshold, token ?? undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['radar-alerts'] })
      resetForm()
      onClose()
    },
  })

  const resetForm = () => { setFormData({ ticker: '', type: 'price_below', threshold: '' }) }

  const handleSubmit = () => {
    if (!formData.ticker.trim()) return
    createAlertMut.mutate({ assetId: formData.ticker, type: formData.type, threshold: formData.threshold ? parseFloat(formData.threshold) : undefined })
  }

  const alertTypes = [
    { value: 'price_below', label: 'Preço abaixo de' },
    { value: 'price_above', label: 'Preço acima de' },
    { value: 'score_change', label: 'Mudança no Score' },
    { value: 'dividend', label: 'Novo dividendo' },
  ]

  const needsThreshold = formData.type === 'price_above' || formData.type === 'price_below'

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Criar Alerta">
      <div className="space-y-5">
        <div>
          <label className="block text-[var(--text-small)] font-medium mb-2">Ativo</label>
          <Input placeholder="Ex: PETR4" value={formData.ticker} onChange={(e) => setFormData({ ...formData, ticker: e.target.value.toUpperCase() })} className="font-mono" />
        </div>

        <div>
          <label className="block text-[var(--text-small)] font-medium mb-2">Tipo de Alerta</label>
          <div className="grid grid-cols-2 gap-2">
            {alertTypes.map((type) => (
              <button key={type.value} onClick={() => setFormData({ ...formData, type: type.value as any })} className={cn('p-3 rounded-[var(--radius)] border text-left text-[var(--text-small)] transition-all', formData.type === type.value ? 'border-[var(--accent-1)] bg-[var(--accent-1)]/5 font-medium' : 'border-[var(--border-1)] hover:border-[var(--text-2)]')}>
                {type.label}
              </button>
            ))}
          </div>
        </div>

        {needsThreshold && (
          <div>
            <label className="block text-[var(--text-small)] font-medium mb-2">Valor (R$)</label>
            <Input type="number" step="0.01" placeholder="Ex: 35.00" value={formData.threshold} onChange={(e) => setFormData({ ...formData, threshold: e.target.value })} />
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <Button variant="secondary" onClick={onClose} className="flex-1">Cancelar</Button>
          <Button variant="primary" onClick={handleSubmit} disabled={!formData.ticker.trim() || (needsThreshold && !formData.threshold) || createAlertMut.isPending} className="flex-1">
            {createAlertMut.isPending ? 'Criando...' : 'Criar Alerta'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

// ===========================================
// Utilitários
// ===========================================

function formatTimeAgo(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'agora'
  if (diffMins < 60) return `${diffMins}min`
  if (diffHours < 24) return `${diffHours}h`
  if (diffDays < 7) return `${diffDays}d`
  return date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })
}
