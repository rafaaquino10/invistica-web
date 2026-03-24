'use client'

import Link from 'next/link'
// TODO: Migrate to pro.getAlerts when /portfolio/alerts endpoint returns feed format
import { trpc } from '@/lib/trpc/client'
import { cn } from '@/lib/utils'

/**
 * Centro de alertas proativos do dashboard.
 * Exibe exit alerts (reavaliar, realizar lucro, risco) do feed unificado do Radar.
 */

const SEVERITY_CONFIG = {
  critical: {
    bg: 'bg-[var(--color-danger-500,#EF4444)]/10',
    border: 'border-[var(--color-danger-500,#EF4444)]/30',
    text: 'text-[var(--color-danger-500,#EF4444)]',
    icon: '!',
    label: 'Crítico',
  },
  warning: {
    bg: 'bg-[var(--color-warning-500,#FB923C)]/10',
    border: 'border-[var(--color-warning-500,#FB923C)]/30',
    text: 'text-[var(--color-warning-500,#FB923C)]',
    icon: '!',
    label: 'Atenção',
  },
  info: {
    bg: 'bg-[var(--color-info-500,#3B82F6)]/10',
    border: 'border-[var(--color-info-500,#3B82F6)]/30',
    text: 'text-[var(--color-info-500,#3B82F6)]',
    icon: 'i',
    label: 'Info',
  },
} as const

const EXIT_TYPE_LABELS: Record<string, string> = {
  reavaliar: 'Reavaliar tese',
  realizar_lucro: 'Realizar lucro',
  monitorar: 'Monitorar',
  risco_critico: 'Risco crítico',
}

export function AlertsCenter() {
  const { data: feed } = trpc.radar.feed.useQuery({ limit: 30 })

  // Filtrar apenas exit_alerts do feed
  const alerts = (feed ?? []).filter(
    (item: any) => item.type === 'exit_alert'
  )

  if (alerts.length === 0) return null

  return (
    <div className="bg-[var(--surface-1)] rounded-[var(--radius)] border border-[var(--border-1)]/20 overflow-hidden">
      <div className="px-4 py-3 border-b border-[var(--border-1)] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[var(--color-danger-500,#EF4444)] animate-pulse" />
          <h2 className="font-display text-[var(--text-subheading)] font-semibold">
            Radar de Alertas
          </h2>
          <span className="text-[var(--text-caption)] font-mono font-bold bg-[var(--color-danger-500,#EF4444)]/15 text-[var(--color-danger-500,#EF4444)] px-1.5 py-0.5 rounded-full">
            {alerts.length}
          </span>
        </div>
        <Link
          href="/radar"
          className="text-[var(--text-small)] font-medium text-[var(--accent-1)] hover:underline"
        >
          Ver Radar
        </Link>
      </div>

      <div className="divide-y divide-[var(--border-1)]">
        {alerts.slice(0, 5).map((alert: any) => {
          const severity = SEVERITY_CONFIG[alert.severity as keyof typeof SEVERITY_CONFIG] ?? SEVERITY_CONFIG.info
          const ticker = alert.tickers?.[0]

          return (
            <Link
              key={alert.id}
              href={ticker ? `/ativo/${ticker}` : '/radar'}
              className="flex items-start gap-3 px-4 py-3 hover:bg-[var(--surface-2)] transition-colors"
            >
              {/* Ícone de severidade */}
              <div className={cn(
                'flex-shrink-0 w-7 h-7 rounded-md flex items-center justify-center text-[11px] font-bold border',
                severity.bg,
                severity.border,
                severity.text,
              )}>
                {severity.icon}
              </div>

              {/* Conteúdo */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[var(--text-small)] font-medium text-[var(--text-1)] truncate">
                    {alert.title}
                  </span>
                </div>
                <p className="text-[var(--text-caption)] text-[var(--text-3)] mt-0.5 line-clamp-1">
                  {alert.message}
                </p>
              </div>

              {/* Tags */}
              <div className="flex-shrink-0 flex flex-col items-end gap-1">
                {ticker && (
                  <span className="text-[var(--text-caption)] font-mono font-bold text-[var(--text-1)]">
                    {ticker}
                  </span>
                )}
                {alert.exitType && (
                  <span className={cn(
                    'text-[10px] px-1.5 py-0.5 rounded-full font-semibold',
                    severity.bg,
                    severity.text,
                  )}>
                    {EXIT_TYPE_LABELS[alert.exitType] ?? alert.exitType}
                  </span>
                )}
              </div>
            </Link>
          )
        })}
      </div>

      {alerts.length > 5 && (
        <div className="px-4 py-2 border-t border-[var(--border-1)] text-center">
          <Link
            href="/radar"
            className="text-[var(--text-small)] font-medium text-[var(--accent-1)] hover:underline"
          >
            +{alerts.length - 5} alertas no Radar
          </Link>
        </div>
      )}
    </div>
  )
}
