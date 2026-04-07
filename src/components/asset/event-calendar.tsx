'use client'

import { useMemo } from 'react'
import { cn } from '@/lib/utils'

/**
 * Cronograma de eventos do ativo: RI (CVM), dividendos, assembleias.
 * Consolida eventos de múltiplas fontes em linha do tempo unificada.
 */

interface CalendarEvent {
  id: string
  date: string          // ISO date string
  type: 'ri' | 'dividendo' | 'assembleia' | 'resultado'
  title: string
  detail?: string | null
  url?: string | null
}

interface EventCalendarProps {
  riEvents?: Array<{
    id?: string
    type?: string
    title?: string
    date?: string
    documentUrl?: string | null
    summary?: string | null
  }>
  dividends?: Array<{
    paymentDate?: string | Date | null
    rate?: number
    value?: number
    label?: string
    type?: string
    lastDatePrior?: string | null
  }>
  ticker: string
}

const TYPE_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  ri: { label: 'Fato Relevante', color: 'var(--color-danger-500, #EF4444)', icon: '!' },
  dividendo: { label: 'Dividendo', color: 'var(--color-success-500, #00D4AA)', icon: '$' },
  assembleia: { label: 'Assembleia', color: 'var(--color-info-500, #3B82F6)', icon: 'A' },
  resultado: { label: 'Resultado', color: 'var(--color-premium-500, #F59E0B)', icon: 'R' },
}

function mapRiType(type: string): CalendarEvent['type'] {
  if (type === 'fato_relevante' || type === 'comunicado_mercado') return 'ri'
  if (type === 'assembleia') return 'assembleia'
  if (type === 'resultado_trimestral') return 'resultado'
  return 'ri'
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
  } catch {
    return dateStr
  }
}

function daysFromNow(dateStr: string): number {
  const d = new Date(dateStr)
  const now = new Date()
  return Math.round((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

export function EventCalendar({ riEvents, dividends, ticker }: EventCalendarProps) {
  const events = useMemo(() => {
    const all: CalendarEvent[] = []

    // RI events
    if (riEvents) {
      for (const ev of riEvents) {
        if (!ev.date || !ev.title) continue
        all.push({
          id: ev.id ?? `ri-${ev.date}-${ev.title?.slice(0, 10)}`,
          date: ev.date,
          type: mapRiType(ev.type ?? 'ri'),
          title: ev.title,
          detail: ev.summary,
          url: ev.documentUrl,
        })
      }
    }

    // Dividends
    if (dividends) {
      for (const div of dividends) {
        const payDate = div.paymentDate instanceof Date
          ? div.paymentDate.toISOString().split('T')[0]!
          : div.paymentDate
        const amount = div.rate ?? div.value ?? 0
        if (payDate && amount > 0) {
          all.push({
            id: `div-${payDate}-${amount}`,
            date: payDate,
            type: 'dividendo',
            title: `${div.label ?? div.type ?? 'Dividendo'}: R$ ${amount.toFixed(4)}/ação`,
            detail: div.lastDatePrior ? `Data com: ${formatDate(div.lastDatePrior)}` : null,
          })
        }
      }
    }

    // Ordenar por data (mais recente primeiro)
    return all.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 15)
  }, [riEvents, dividends])

  if (events.length === 0) {
    return null
  }

  // Separar futuros vs passados
  const now = new Date().toISOString()
  const upcoming = events.filter(e => e.date >= now.slice(0, 10))
  const past = events.filter(e => e.date < now.slice(0, 10))

  return (
    <div>
      <h2 className="text-[11px] font-semibold text-[var(--text-3)] uppercase tracking-wider mb-2">
        Cronograma de Eventos
      </h2>
      <div className="border border-[var(--border-1)]/20 rounded-[var(--radius)] bg-[var(--surface-1)] p-4">

        {/* Próximos */}
        {upcoming.length > 0 && (
          <div className="mb-4">
            <div className="text-[10px] font-semibold uppercase tracking-widest text-[var(--color-success-500,#00D4AA)] mb-2">
              Próximos
            </div>
            <div className="space-y-2">
              {upcoming.map(ev => (
                <EventRow key={ev.id} event={ev} isFuture />
              ))}
            </div>
          </div>
        )}

        {/* Recentes */}
        {past.length > 0 && (
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-3)] mb-2">
              Recentes
            </div>
            <div className="space-y-2">
              {past.slice(0, 10).map(ev => (
                <EventRow key={ev.id} event={ev} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function EventRow({ event, isFuture }: { event: CalendarEvent; isFuture?: boolean }) {
  const config = TYPE_CONFIG[event.type] ?? TYPE_CONFIG['ri']!
  const days = daysFromNow(event.date)

  return (
    <div className={cn(
      'flex items-start gap-3 p-2 rounded-lg transition-colors',
      isFuture ? 'bg-[var(--bg-1)]' : 'hover:bg-[var(--bg-1)]'
    )}>
      {/* Ícone tipo */}
      <div
        className="flex-shrink-0 w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold text-white"
        style={{ backgroundColor: config.color }}
      >
        {config.icon}
      </div>

      {/* Conteúdo */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-medium text-[var(--text-1)] truncate">
            {event.title}
          </span>
          {isFuture && days >= 0 && days <= 7 && (
            <span className="flex-shrink-0 text-[9px] px-1.5 py-0.5 rounded-full bg-[var(--color-warning-500,#FB923C)]/15 text-[var(--color-warning-500,#FB923C)] font-semibold">
              {days === 0 ? 'Hoje' : days === 1 ? 'Amanhã' : `${days}d`}
            </span>
          )}
        </div>
        {event.detail && (
          <p className="text-[10px] text-[var(--text-3)] mt-0.5 truncate">{event.detail}</p>
        )}
      </div>

      {/* Data */}
      <div className="flex-shrink-0 text-right">
        <div className="text-[10px] text-[var(--text-3)]">{formatDate(event.date)}</div>
        <div className="text-[9px] text-[var(--text-3)]/60">{config.label}</div>
      </div>

      {/* Link externo */}
      {event.url && (
        <a
          href={event.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-shrink-0 text-[var(--text-3)] hover:text-[var(--accent-1)] transition-colors"
          title="Abrir documento"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
          </svg>
        </a>
      )}
    </div>
  )
}
