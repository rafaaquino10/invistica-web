'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor,
  useSensor, useSensors, type DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates,
  verticalListSortingStrategy, useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Skeleton } from '@/components/ui'
import { AssetLogo } from '@/components/ui/asset-logo'
import { cn } from '@/lib/utils'
import { pro } from '@/lib/api/endpoints'
import { adaptPortfolio } from '@/lib/api/adapters'
import { useAuth } from '@/hooks/use-auth'
import { staggerContainer, fadeInUp } from '@/lib/utils/motion'

// ─── Formatters ──────────────────────────────────────────────
function fmt(value: number, opts?: { compact?: boolean }): string {
  if (opts?.compact && Math.abs(value) >= 1_000_000) return `R$ ${(value / 1_000_000).toFixed(1).replace('.', ',')}M`
  if (opts?.compact && Math.abs(value) >= 1_000) return `R$ ${(value / 1_000).toFixed(1).replace('.', ',')}k`
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value)
}

function pct(value: number): string {
  const sign = value >= 0 ? '+' : ''
  return `${sign}${value.toFixed(2).replace('.', ',')}%`
}

const RATING_LABELS: Record<string, string> = {
  STRONG_BUY: 'Compra Forte', BUY: 'Acumular', HOLD: 'Neutro', REDUCE: 'Reduzir', AVOID: 'Evitar',
}
const RATING_COLORS: Record<string, string> = {
  STRONG_BUY: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30',
  BUY: 'bg-blue-500/15 text-blue-600 border-blue-500/30',
  HOLD: 'bg-amber-500/15 text-amber-600 border-amber-500/30',
  REDUCE: 'bg-orange-500/15 text-orange-600 border-orange-500/30',
  AVOID: 'bg-red-500/15 text-red-600 border-red-500/30',
}
const REGIME_META: Record<string, { label: string; color: string; bg: string }> = {
  RISK_ON: { label: 'Risk On', color: 'text-emerald-600', bg: 'bg-emerald-500/10' },
  RISK_OFF: { label: 'Risk Off', color: 'text-red-500', bg: 'bg-red-500/10' },
  RECOVERY: { label: 'Recuperação', color: 'text-blue-600', bg: 'bg-blue-500/10' },
  STAGFLATION: { label: 'Estagflação', color: 'text-amber-600', bg: 'bg-amber-500/10' },
}

const STORAGE_KEY = 'investiq-dashboard-order'
const DEFAULT_ORDER = ['macro', 'patrimonio', 'oportunidades', 'dividendos', 'carteira', 'noticias']

function loadOrder(): string[] {
  if (typeof window === 'undefined') return DEFAULT_ORDER
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      if (Array.isArray(parsed) && parsed.length === DEFAULT_ORDER.length) return parsed
    }
  } catch { /* ignore */ }
  return DEFAULT_ORDER
}

// ─── Sortable Widget Wrapper ─────────────────────────────────
function SortableWidget({ id, isEditing, children }: { id: string; isEditing: boolean; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.85 : 1,
  }

  return (
    <div ref={setNodeRef} style={style}>
      {isEditing && (
        <div
          {...attributes}
          {...listeners}
          className="flex items-center gap-2 px-3 py-1.5 mb-1 rounded-lg cursor-grab active:cursor-grabbing bg-[var(--surface-2)] border border-[var(--border-1)] text-[var(--text-2)] text-xs font-medium select-none"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="5" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="19" r="1"/></svg>
          Arraste para reorganizar
        </div>
      )}
      {children}
    </div>
  )
}

// ─── Main Dashboard ──────────────────────────────────────────
export default function DashboardPage() {
  const { token } = useAuth()
  const [widgetOrder, setWidgetOrder] = useState<string[]>(DEFAULT_ORDER)
  const [isEditing, setIsEditing] = useState(false)

  useEffect(() => { setWidgetOrder(loadOrder()) }, [])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      setWidgetOrder((prev) => {
        const oldIndex = prev.indexOf(active.id as string)
        const newIndex = prev.indexOf(over.id as string)
        const next = arrayMove(prev, oldIndex, newIndex)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
        return next
      })
    }
  }, [])

  // ─── Data Queries ────────────────────────────────
  const { data: macroRegime } = useQuery({
    queryKey: ['macro-regime'],
    queryFn: () => pro.getMacroRegime(token ?? undefined).catch(() => null),
    retry: 0,
  })

  const { data: topData, isLoading: loadingTop } = useQuery({
    queryKey: ['dashboard-top'],
    queryFn: () => pro.getScreener({ min_score: 55, limit: 5 }, token ?? undefined).catch(() => null),
    retry: 1,
  })

  const { data: divRadar } = useQuery({
    queryKey: ['dashboard-div-radar'],
    queryFn: () => pro.getDividendRadar(70, token ?? undefined).catch(() => null),
    retry: 0,
  })

  const { data: rawPortfolio, isLoading: loadingPortfolio } = useQuery({
    queryKey: ['portfolio'],
    queryFn: () => pro.getPortfolio(token ?? undefined).catch(() => null),
    retry: 1,
  })

  const { data: catalysts } = useQuery({
    queryKey: ['dashboard-catalysts'],
    queryFn: () => pro.getCatalysts(7, token ?? undefined).catch(() => null),
    retry: 0,
  })

  const portfolio = useMemo(() => {
    if (!rawPortfolio?.positions) return null
    return adaptPortfolio(rawPortfolio.positions)
  }, [rawPortfolio])

  const topPicks = topData?.results?.slice(0, 5) ?? []
  const topDividends = (divRadar as any)?.radar?.slice(0, 3) ?? []
  const recentNews = catalysts?.catalysts?.slice(0, 4) ?? []
  const regime = REGIME_META[macroRegime?.regime] ?? null

  // ─── Widget Map ──────────────────────────────────
  const widgets: Record<string, React.ReactNode> = {
    macro: macroRegime ? (
      <div>
        <SectionHeader title="Cenário Macroeconômico" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MacroCard label="SELIC" value={`${macroRegime.macro.selic.toFixed(2)}%`} sub="Taxa básica de juros" />
          <MacroCard label="IPCA" value={`${macroRegime.macro.ipca.toFixed(1)}%`} sub="Inflação acumulada" />
          <MacroCard label="Dólar" value={`R$ ${macroRegime.macro.cambio_usd.toFixed(2)}`} sub="Câmbio comercial" />
          <div className={cn('rounded-[var(--radius)] border border-[var(--border-1)] p-4', regime?.bg)}>
            <p className="text-[var(--text-caption)] text-[var(--text-2)] font-medium mb-1">Regime</p>
            <p className={cn('font-semibold text-lg', regime?.color ?? 'text-[var(--text-1)]')}>{regime?.label ?? macroRegime.regime}</p>
            <p className="text-[10px] text-[var(--text-2)] mt-0.5">Classificação IQ-Cognit</p>
          </div>
        </div>
      </div>
    ) : null,

    patrimonio: portfolio && portfolio.positionsCount > 0 ? (
      <div className="rounded-[var(--radius)] border border-[var(--border-1)] p-6 bg-gradient-to-br from-[var(--surface-1)] via-[var(--surface-1)] to-[var(--accent-2)]">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <p className="text-[var(--text-caption)] font-medium text-[var(--text-2)] uppercase tracking-wider mb-1">Patrimônio Total</p>
            <p className="font-mono text-3xl md:text-4xl font-bold text-[var(--text-1)] leading-none">{fmt(portfolio.totalValue)}</p>
            <p className="text-[var(--text-small)] text-[var(--text-2)] mt-1 font-mono">
              Custo: {fmt(portfolio.totalCost, { compact: true })} | Ganho: {fmt(portfolio.gainLoss, { compact: true })}
            </p>
          </div>
          <div className={cn('text-right px-5 py-3 rounded-xl', portfolio.gainLossPercent >= 0 ? 'bg-[var(--pos)]/10' : 'bg-[var(--neg)]/10')}>
            <p className={cn('font-mono text-2xl font-bold', portfolio.gainLossPercent >= 0 ? 'text-[var(--pos)]' : 'text-[var(--neg)]')}>{pct(portfolio.gainLossPercent)}</p>
            <p className="text-[var(--text-caption)] text-[var(--text-2)]">Rentabilidade</p>
          </div>
        </div>
      </div>
    ) : null,

    oportunidades: (
      <div>
        <SectionHeader title="Melhores Oportunidades" sub="Top ações por IQ-Score" href="/explorer" linkLabel="Ver screener" />
        {loadingTop ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-48 rounded-[var(--radius)]" />)}
          </div>
        ) : topPicks.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {topPicks.map((pick) => {
              const hasDiscount = pick.safety_margin != null && pick.safety_margin > 0
              const dyProj = pick.dividend_yield_proj != null && pick.dividend_yield_proj > 0 ? (pick.dividend_yield_proj * 100).toFixed(1) : null
              return (
                <Link key={pick.ticker} href={`/ativo/${pick.ticker}`}
                  className="bg-[var(--surface-1)] rounded-[var(--radius)] border border-[var(--border-1)] p-4 hover:border-[var(--accent-1)]/40 hover:shadow-md transition-all group flex flex-col">
                  <div className="flex items-center gap-3 mb-4">
                    <AssetLogo ticker={pick.ticker} size={36} />
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-[var(--text-1)] group-hover:text-[var(--accent-1)] transition-colors">{pick.ticker}</p>
                      <p className="text-[11px] text-[var(--text-2)] truncate leading-tight">{pick.company_name}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mb-3">
                    <div className={cn('flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg',
                      (pick.iq_score ?? 0) >= 75 ? 'bg-[var(--pos)]/10' : (pick.iq_score ?? 0) >= 62 ? 'bg-[var(--accent-1)]/10' : 'bg-[var(--bg)]')}>
                      <span className={cn('font-mono text-lg font-bold',
                        (pick.iq_score ?? 0) >= 75 ? 'text-[var(--pos)]' : (pick.iq_score ?? 0) >= 62 ? 'text-[var(--accent-1)]' : 'text-[var(--text-2)]')}>
                        {pick.iq_score ?? '--'}
                      </span>
                      <span className="text-[10px] text-[var(--text-2)] font-medium">IQ</span>
                    </div>
                    <span className={cn('text-[10px] font-semibold px-2 py-1 rounded-full border', RATING_COLORS[pick.rating] ?? 'bg-[var(--bg)] text-[var(--text-2)] border-[var(--border-1)]')}>
                      {RATING_LABELS[pick.rating] ?? '--'}
                    </span>
                  </div>
                  <div className="mt-auto space-y-1.5 pt-3 border-t border-[var(--border-1)]/50">
                    <MetricRow label="Preço vs Justo"
                      value={hasDiscount ? `${(pick.safety_margin! * 100).toFixed(0)}% abaixo` : pick.safety_margin != null ? `${Math.abs(pick.safety_margin * 100).toFixed(0)}% acima` : '--'}
                      color={hasDiscount ? 'text-[var(--pos)]' : 'text-[var(--neg)]'} />
                    {dyProj && <MetricRow label="Dividendo Proj." value={`${dyProj}% a.a.`} color="text-[var(--accent-1)]" />}
                    {pick.score_quanti != null && <MetricRow label="Fundamentos" value={`${pick.score_quanti}/100`} />}
                  </div>
                </Link>
              )
            })}
          </div>
        ) : (
          <div className="bg-[var(--surface-1)] rounded-[var(--radius)] border border-[var(--border-1)] p-8 text-center text-sm text-[var(--text-2)]">
            Nenhuma oportunidade disponível no momento.
          </div>
        )}
      </div>
    ),

    dividendos: topDividends.length > 0 ? (
      <div>
        <SectionHeader title="Dividendos Seguros" sub="Alto yield projetado com dividendo sustentável" href="/dividends" linkLabel="Ver radar" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {topDividends.map((d: any) => (
            <Link key={d.ticker} href={`/ativo/${d.ticker}`}
              className="bg-[var(--surface-1)] rounded-[var(--radius)] border border-[var(--border-1)] p-5 hover:border-teal/40 hover:shadow-md transition-all group">
              <div className="flex items-center gap-3 mb-4">
                <AssetLogo ticker={d.ticker} size={32} />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-[var(--text-1)] group-hover:text-teal transition-colors">{d.ticker}</p>
                  <p className="text-[11px] text-[var(--text-2)] truncate">{d.company_name}</p>
                </div>
                {d.iq_score != null && (
                  <div className="w-9 h-9 rounded-lg bg-[var(--bg)] flex items-center justify-center font-mono text-xs font-bold text-[var(--text-1)]">{d.iq_score}</div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-teal/5 rounded-lg p-3 text-center">
                  <p className="text-[10px] text-[var(--text-2)] font-medium mb-0.5">Dividend Yield</p>
                  <p className="font-mono text-xl font-bold text-teal">{((d.dividend_yield_proj ?? 0) * 100).toFixed(1)}%</p>
                  <p className="text-[10px] text-[var(--text-2)]">projetado 12m</p>
                </div>
                <div className="bg-[var(--bg)] rounded-lg p-3 text-center">
                  <p className="text-[10px] text-[var(--text-2)] font-medium mb-0.5">Segurança</p>
                  <p className={cn('font-mono text-xl font-bold', (d.dividend_safety ?? 0) >= 80 ? 'text-[var(--pos)]' : (d.dividend_safety ?? 0) >= 60 ? 'text-amber-500' : 'text-[var(--neg)]')}>{d.dividend_safety ?? '--'}</p>
                  <p className="text-[10px] text-[var(--text-2)]">de 0 a 100</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    ) : null,

    carteira: !loadingPortfolio ? (
      portfolio && portfolio.positionsCount > 0 ? (
        <div className="bg-[var(--surface-1)] rounded-[var(--radius)] shadow-sm border border-[var(--border-1)] overflow-hidden">
          <div className="px-5 py-4 border-b border-[var(--border-1)] flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-[var(--text-1)]">Minha Carteira</h2>
              <p className="text-[var(--text-caption)] text-[var(--text-2)]">{portfolio.positionsCount} posições</p>
            </div>
            <Link href="/portfolio" className="text-[var(--text-small)] font-medium text-[var(--accent-1)] hover:underline">Gerenciar</Link>
          </div>
          <div className="divide-y divide-[var(--border-1)]">
            {portfolio.positions.slice(0, 6).map((pos) => (
              <Link key={pos.id} href={`/ativo/${pos.ticker}`} className="flex items-center justify-between px-5 py-3.5 hover:bg-[var(--surface-2)] transition-colors">
                <div className="flex items-center gap-3">
                  <AssetLogo ticker={pos.ticker} size={32} />
                  <div>
                    <p className="font-semibold text-[var(--text-1)] text-sm">{pos.ticker}</p>
                    <p className="text-[var(--text-caption)] text-[var(--text-2)]">{pos.quantity} cotas | {pos.weight.toFixed(1)}%</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="font-mono text-sm text-[var(--text-1)]">{fmt(pos.totalValue)}</p>
                    <p className={cn('font-mono text-xs', pos.gainLossPercent >= 0 ? 'text-[var(--pos)]' : 'text-[var(--neg)]')}>{pct(pos.gainLossPercent)}</p>
                  </div>
                  {pos.iqScore != null && (
                    <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center font-mono text-xs font-bold',
                      pos.iqScore >= 65 ? 'bg-[var(--pos)]/10 text-[var(--pos)]' : 'bg-[var(--bg)] text-[var(--text-2)]')}>{pos.iqScore}</div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-[var(--radius)] border border-dashed border-[var(--accent-1)]/30 p-8 text-center bg-[var(--accent-2)]/10">
          <h3 className="text-lg font-semibold text-[var(--text-1)] mb-1">Monte sua carteira</h3>
          <p className="text-sm text-[var(--text-2)] max-w-md mx-auto mb-4">Adicione posições para acompanhar patrimônio e receber recomendações.</p>
          <Link href="/portfolio" className="inline-flex px-6 py-2.5 bg-[var(--accent-1)] text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity">Ir para Carteira</Link>
        </div>
      )
    ) : null,

    noticias: recentNews.length > 0 ? (
      <div>
        <SectionHeader title="Mercado Hoje" sub="Notícias e catalisadores recentes" href="/news" linkLabel="Ver todas" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {recentNews.map((item, i) => (
            <a key={i} href={item.url ?? '#'} target="_blank" rel="noopener noreferrer"
              className="bg-[var(--surface-1)] rounded-[var(--radius)] border border-[var(--border-1)] p-4 hover:border-[var(--accent-1)]/30 hover:shadow-sm transition-all group">
              <p className="text-sm font-medium text-[var(--text-1)] group-hover:text-[var(--accent-1)] transition-colors line-clamp-2 mb-2.5">{item.title}</p>
              <div className="flex items-center gap-2 text-[var(--text-caption)] text-[var(--text-2)]">
                <span className={cn('px-1.5 py-0.5 rounded text-[10px] font-medium',
                  item.type === 'dividendo' ? 'bg-teal/10 text-teal' : item.type === 'fato_relevante' ? 'bg-amber-500/10 text-amber-600' : 'bg-[var(--surface-2)] text-[var(--text-2)]')}>
                  {item.type === 'dividendo' ? 'Dividendo' : item.type === 'fato_relevante' ? 'Fato Relevante' : 'Notícia'}
                </span>
                {item.source && <span className="text-[var(--text-3)]">{item.source.replace(/_/g, ' ')}</span>}
                {item.date && <span className="text-[var(--text-3)]">{new Date(item.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</span>}
              </div>
            </a>
          ))}
        </div>
      </div>
    ) : null,
  }

  return (
    <motion.div className="space-y-8" {...staggerContainer}>
      {/* Edit toggle */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[var(--text-1)]">Dashboard</h1>
          <p className="text-[var(--text-caption)] text-[var(--text-2)]">Visão geral do mercado e seus investimentos</p>
        </div>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className={cn(
            'flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors',
            isEditing
              ? 'bg-[var(--accent-1)] text-white border-[var(--accent-1)]'
              : 'bg-[var(--surface-1)] text-[var(--text-2)] border-[var(--border-1)] hover:bg-[var(--surface-2)]'
          )}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="9" cy="5" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="19" r="1"/>
            <circle cx="15" cy="5" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="19" r="1"/>
          </svg>
          {isEditing ? 'Concluir' : 'Personalizar'}
        </button>
      </div>

      {/* Sortable widgets */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={widgetOrder} strategy={verticalListSortingStrategy}>
          <div className="space-y-6">
            {widgetOrder.map((id) => {
              const content = widgets[id]
              if (!content) return null
              return (
                <SortableWidget key={id} id={id} isEditing={isEditing}>
                  <motion.div {...fadeInUp}>{content}</motion.div>
                </SortableWidget>
              )
            })}
          </div>
        </SortableContext>
      </DndContext>
    </motion.div>
  )
}

// ─── Shared Components ───────────────────────────────────────
function SectionHeader({ title, sub, href, linkLabel }: { title: string; sub?: string; href?: string; linkLabel?: string }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <div>
        <h2 className="text-base font-semibold text-[var(--text-1)]">{title}</h2>
        {sub && <p className="text-[var(--text-caption)] text-[var(--text-2)]">{sub}</p>}
      </div>
      {href && linkLabel && (
        <Link href={href} className="text-[var(--text-small)] font-medium text-[var(--accent-1)] hover:underline">{linkLabel}</Link>
      )}
    </div>
  )
}

function MacroCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="bg-[var(--surface-1)] rounded-[var(--radius)] border border-[var(--border-1)] p-4">
      <p className="text-[var(--text-caption)] text-[var(--text-2)] font-medium mb-1">{label}</p>
      <p className="font-mono text-lg font-bold text-[var(--text-1)]">{value}</p>
      <p className="text-[10px] text-[var(--text-2)] mt-0.5">{sub}</p>
    </div>
  )
}

function MetricRow({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex items-center justify-between text-[11px]">
      <span className="text-[var(--text-2)]">{label}</span>
      <span className={cn('font-mono font-medium', color ?? 'text-[var(--text-1)]')}>{value}</span>
    </div>
  )
}
