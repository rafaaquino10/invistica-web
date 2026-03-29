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
import { Skeleton, Term } from '@/components/ui'
import { AssetLogo } from '@/components/ui/asset-logo'
import { cn } from '@/lib/utils'
import { pro } from '@/lib/api/endpoints'
import { adaptPortfolio } from '@/lib/api/adapters'
import { useAuth } from '@/hooks/use-auth'

// ─── Helpers ─────────────────────────────────────────────────
function fmtR$(v: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v)
}
function fmtCompact(v: number): string {
  if (Math.abs(v) >= 1e6) return `R$ ${(v / 1e6).toFixed(1)}M`
  if (Math.abs(v) >= 1e3) return `R$ ${(v / 1e3).toFixed(0)}k`
  return fmtR$(v)
}
function pct(v: number): string { return `${v >= 0 ? '+' : ''}${v.toFixed(2)}%` }

const RL: Record<string, string> = { STRONG_BUY: 'Compra Forte', BUY: 'Acumular', HOLD: 'Neutro', REDUCE: 'Reduzir', AVOID: 'Evitar' }
const RC: Record<string, string> = {
  STRONG_BUY: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  BUY: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  HOLD: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  REDUCE: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
  AVOID: 'bg-red-500/15 text-red-400 border-red-500/30',
}
const REGIME_STYLES: Record<string, { color: string; bg: string; glow: string }> = {
  RISK_ON: { color: 'text-emerald-400', bg: 'from-emerald-500/8 to-transparent', glow: 'shadow-emerald-500/10' },
  RISK_OFF: { color: 'text-red-400', bg: 'from-red-500/8 to-transparent', glow: 'shadow-red-500/10' },
  RECOVERY: { color: 'text-blue-400', bg: 'from-blue-500/8 to-transparent', glow: 'shadow-blue-500/10' },
  STAGFLATION: { color: 'text-amber-400', bg: 'from-amber-500/8 to-transparent', glow: 'shadow-amber-500/10' },
}
const REGIME_LABELS: Record<string, string> = { RISK_ON: 'Risk On', RISK_OFF: 'Risk Off', RECOVERY: 'Recuperação', STAGFLATION: 'Estagflação' }

const STORAGE_KEY = 'investiq-dashboard-order'
const DEFAULT_ORDER = ['macro', 'patrimonio', 'oportunidades', 'dividendos', 'carteira', 'noticias']
function loadOrder(): string[] {
  if (typeof window === 'undefined') return DEFAULT_ORDER
  try { const s = localStorage.getItem(STORAGE_KEY); if (s) { const p = JSON.parse(s); if (Array.isArray(p) && p.length === DEFAULT_ORDER.length) return p } } catch {}
  return DEFAULT_ORDER
}

// ─── Sortable Widget ─────────────────────────────────────────
function SortableWidget({ id, editing, children }: { id: string; editing: boolean; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 50 : undefined, opacity: isDragging ? 0.8 : 1 }}>
      {editing && (
        <div {...attributes} {...listeners} className="flex items-center gap-2 px-3 py-1 mb-1.5 rounded-lg cursor-grab active:cursor-grabbing bg-[var(--surface-2)]/60 border border-[var(--border-1)] text-[var(--text-3)] text-[10px] font-medium select-none backdrop-blur-sm">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="5" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="19" r="1"/></svg>
          Arraste para reorganizar
        </div>
      )}
      {children}
    </div>
  )
}

// ─── Dashboard ───────────────────────────────────────────────
export default function DashboardPage() {
  const { token } = useAuth()
  const [order, setOrder] = useState<string[]>(DEFAULT_ORDER)
  const [editing, setEditing] = useState(false)
  useEffect(() => { setOrder(loadOrder()) }, [])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )
  const onDragEnd = useCallback((e: DragEndEvent) => {
    const { active, over } = e
    if (over && active.id !== over.id) {
      setOrder(prev => {
        const next = arrayMove(prev, prev.indexOf(active.id as string), prev.indexOf(over.id as string))
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
        return next
      })
    }
  }, [])

  // ─── Data ────────────────────────────────────
  const { data: regime } = useQuery({ queryKey: ['regime'], queryFn: () => pro.getMacroRegime(token ?? undefined).catch(() => null), retry: 0 })
  const { data: topData, isLoading: loadingTop } = useQuery({ queryKey: ['dash-top'], queryFn: () => pro.getScreener({ min_score: 50, limit: 6 }, token ?? undefined).catch(() => null), retry: 1 })
  const { data: divRadar } = useQuery({ queryKey: ['dash-div'], queryFn: () => pro.getDividendRadar(70, token ?? undefined).catch(() => null), retry: 0 })
  const { data: rawPortfolio, isLoading: loadingPf } = useQuery({ queryKey: ['portfolio'], queryFn: () => pro.getPortfolio(token ?? undefined).catch(() => null), retry: 1 })
  const { data: catalysts } = useQuery({ queryKey: ['dash-cat'], queryFn: () => pro.getCatalysts(7, token ?? undefined).catch(() => null), retry: 0 })

  const portfolio = useMemo(() => rawPortfolio?.positions ? adaptPortfolio(rawPortfolio.positions) : null, [rawPortfolio])
  const picks = topData?.results?.slice(0, 6) ?? []
  const divs = (divRadar as any)?.radar?.slice(0, 3) ?? []
  const news = catalysts?.catalysts?.slice(0, 4) ?? []
  const rs = REGIME_STYLES[regime?.regime] ?? REGIME_STYLES.RISK_OFF
  const sectorTilts = regime?.sector_rotation ?? {}

  // Generate insight text for top picks
  const generateInsight = (pick: any): string => {
    const parts: string[] = []
    if (pick.safety_margin != null && pick.safety_margin > 0) parts.push(`${(pick.safety_margin * 100).toFixed(0)}% abaixo do preço justo`)
    else if (pick.safety_margin != null) parts.push(`${Math.abs(pick.safety_margin * 100).toFixed(0)}% acima do justo`)
    if (pick.dividend_yield_proj != null && pick.dividend_yield_proj > 0.05) parts.push(`DY ${(pick.dividend_yield_proj * 100).toFixed(1)}%`)
    if (pick.score_quanti != null && pick.score_quanti >= 70) parts.push(`fundamentos fortes`)
    return parts.join(' · ') || 'Análise disponível'
  }

  // ─── Widgets ─────────────────────────────────
  const widgets: Record<string, React.ReactNode> = {
    // ── MACRO PANEL ──
    macro: regime ? (
      <div className={cn('rounded-xl border border-[var(--border-1)] overflow-hidden bg-gradient-to-br', rs.bg)}>
        {/* Regime Header */}
        <div className="px-6 pt-5 pb-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={cn('w-3 h-3 rounded-full animate-pulse', regime.regime === 'RISK_ON' ? 'bg-emerald-400' : regime.regime === 'RISK_OFF' ? 'bg-red-400' : regime.regime === 'RECOVERY' ? 'bg-blue-400' : 'bg-amber-400')} />
              <div>
                <p className={cn('text-lg font-bold tracking-tight', rs.color)}>{REGIME_LABELS[regime.regime] ?? regime.regime}</p>
                <p className="text-[11px] text-[var(--text-3)]">{regime.description ?? 'Classificação IQ-Cognit'}</p>
              </div>
            </div>
            {regime.kill_switch_active && (
              <span className="text-[10px] font-semibold px-2 py-1 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse">Kill Switch Ativo</span>
            )}
          </div>

          {/* Macro Indicators */}
          <div className="grid grid-cols-4 gap-3">
            <MacroIndicator label="SELIC" value={`${regime.macro.selic.toFixed(2)}%`} />
            <MacroIndicator label="IPCA" value={`${regime.macro.ipca.toFixed(1)}%`} />
            <MacroIndicator label="Dólar" value={`R$ ${regime.macro.cambio_usd.toFixed(2)}`} />
            <MacroIndicator label="Brent" value={`US$ ${regime.macro.brent.toFixed(0)}`} />
          </div>
        </div>

        {/* Sector Tilts */}
        {Object.keys(sectorTilts).length > 0 && (
          <div className="px-6 py-3 border-t border-[var(--border-1)]/50 bg-[var(--surface-1)]/30">
            <div className="flex flex-wrap gap-2">
              {Object.entries(sectorTilts)
                .sort((a: any, b: any) => (b[1]?.tilt_points ?? 0) - (a[1]?.tilt_points ?? 0))
                .map(([name, data]: any) => {
                  const tilt = data?.tilt_points ?? 0
                  if (tilt === 0) return null
                  return (
                    <span key={name} className={cn(
                      'text-[10px] font-medium px-2 py-0.5 rounded-full border',
                      tilt > 0 ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-red-400 bg-red-500/10 border-red-500/20'
                    )}>
                      {name.split(' ')[0]} {tilt > 0 ? `+${tilt}` : tilt}
                    </span>
                  )
                })}
            </div>
          </div>
        )}
      </div>
    ) : null,

    // ── PATRIMÔNIO ──
    patrimonio: portfolio && portfolio.positionsCount > 0 ? (
      <div className="rounded-xl border border-[var(--border-1)] p-6 bg-gradient-to-br from-[var(--surface-1)] to-[var(--surface-2)]/50">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold text-[var(--text-3)] uppercase tracking-widest mb-1">Patrimônio Total</p>
            <p className="font-mono text-3xl md:text-4xl font-bold text-[var(--text-1)] tracking-tight">{fmtR$(portfolio.totalValue)}</p>
            <p className="text-xs text-[var(--text-3)] mt-1 font-mono">Custo {fmtCompact(portfolio.totalCost)} · Ganho {fmtCompact(portfolio.gainLoss)}</p>
          </div>
          <div className={cn('px-5 py-3 rounded-xl', portfolio.gainLossPercent >= 0 ? 'bg-emerald-500/10' : 'bg-red-500/10')}>
            <p className={cn('font-mono text-2xl font-bold', portfolio.gainLossPercent >= 0 ? 'text-[var(--pos)]' : 'text-[var(--neg)]')}>{pct(portfolio.gainLossPercent)}</p>
            <p className="text-[10px] text-[var(--text-3)]">Rentabilidade total</p>
          </div>
        </div>
        {regime?.macro && (
          <div className="mt-4 pt-3 border-t border-[var(--border-1)]/30 flex gap-4 text-[10px] text-[var(--text-3)]">
            <span>vs <Term>CDI</Term>: <span className={cn('font-mono font-semibold', (portfolio.gainLossPercent - regime.macro.selic) >= 0 ? 'text-[var(--pos)]' : 'text-[var(--neg)]')}>{pct(portfolio.gainLossPercent - regime.macro.selic)}</span></span>
            <span>vs <Term>IPCA</Term>: <span className={cn('font-mono font-semibold', (portfolio.gainLossPercent - regime.macro.ipca) >= 0 ? 'text-[var(--pos)]' : 'text-[var(--neg)]')}>{pct(portfolio.gainLossPercent - regime.macro.ipca)}</span></span>
          </div>
        )}
      </div>
    ) : null,

    // ── OPORTUNIDADES ──
    oportunidades: (
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-[var(--text-1)]">Oportunidades IQ-Cognit</h2>
            <p className="text-[10px] text-[var(--text-3)]">Top ações ranqueadas pelo motor — ajustadas ao regime atual</p>
          </div>
          <Link href="/explorer" className="text-[10px] font-semibold text-[var(--accent-1)] hover:underline">Ver screener</Link>
        </div>
        {loadingTop ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-36 rounded-xl" />)}</div>
        ) : picks.length > 0 ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            {picks.map((p: any, i: number) => (
              <Link key={p.ticker} href={`/ativo/${p.ticker}`}
                className="group rounded-xl border border-[var(--border-1)] bg-[var(--surface-1)] p-4 hover:border-[var(--accent-1)]/30 hover:bg-[var(--surface-2)]/50 transition-all">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <AssetLogo ticker={p.ticker} size={28} />
                    <div>
                      <p className="font-bold text-sm text-[var(--text-1)] group-hover:text-[var(--accent-1)] transition-colors">{p.ticker}</p>
                      <p className="text-[10px] text-[var(--text-3)] truncate max-w-[100px]">{p.company_name?.split(' ').slice(0, 2).join(' ')}</p>
                    </div>
                  </div>
                  <div className={cn('flex items-center gap-1 px-2 py-1 rounded-lg',
                    (p.iq_score ?? 0) >= 70 ? 'bg-emerald-500/10' : (p.iq_score ?? 0) >= 50 ? 'bg-[var(--accent-1)]/10' : 'bg-[var(--surface-2)]')}>
                    <span className={cn('font-mono text-base font-bold',
                      (p.iq_score ?? 0) >= 70 ? 'text-[var(--pos)]' : (p.iq_score ?? 0) >= 50 ? 'text-[var(--accent-1)]' : 'text-[var(--text-2)]')}>
                      {p.iq_score ?? '--'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs text-[var(--text-2)]">R$ {p.close?.toFixed(2) ?? '--'}</span>
                  <span className={cn('text-[9px] font-semibold px-1.5 py-0.5 rounded-full border', RC[p.rating] ?? 'text-[var(--text-3)] border-[var(--border-1)]')}>
                    {RL[p.rating] ?? '--'}
                  </span>
                </div>
                <p className="text-[10px] text-[var(--text-3)] leading-relaxed line-clamp-2">{generateInsight(p)}</p>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-[var(--border-1)] p-10 text-center text-xs text-[var(--text-3)]">Nenhuma oportunidade disponível</div>
        )}
      </div>
    ),

    // ── DIVIDENDOS ──
    dividendos: divs.length > 0 ? (
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-[var(--text-1)]">Dividendos Seguros</h2>
            <p className="text-[10px] text-[var(--text-3)]">Alto yield projetado com dividendo sustentável</p>
          </div>
          <Link href="/dividends" className="text-[10px] font-semibold text-[var(--accent-1)] hover:underline">Ver radar</Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {divs.map((d: any) => (
            <Link key={d.ticker} href={`/ativo/${d.ticker}`}
              className="group rounded-xl border border-[var(--border-1)] bg-[var(--surface-1)] p-4 hover:border-emerald-500/30 transition-all">
              <div className="flex items-center gap-3 mb-3">
                <AssetLogo ticker={d.ticker} size={28} />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-[var(--text-1)] group-hover:text-emerald-400 transition-colors">{d.ticker}</p>
                  <p className="text-[10px] text-[var(--text-3)] truncate">{d.company_name?.split(' ').slice(0, 2).join(' ')}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg bg-emerald-500/5 p-2.5 text-center">
                  <p className="text-[9px] text-[var(--text-3)]">DY Projetado</p>
                  <p className="font-mono text-lg font-bold text-emerald-400">{((d.dividend_yield_proj ?? 0) * 100).toFixed(1)}%</p>
                </div>
                <div className="rounded-lg bg-[var(--surface-2)] p-2.5 text-center">
                  <p className="text-[9px] text-[var(--text-3)]"><Term>Safety</Term></p>
                  <p className={cn('font-mono text-lg font-bold', (d.dividend_safety ?? 0) >= 80 ? 'text-[var(--pos)]' : 'text-amber-400')}>{d.dividend_safety ?? '--'}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    ) : null,

    // ── CARTEIRA ──
    carteira: !loadingPf ? (
      portfolio && portfolio.positionsCount > 0 ? (
        <div className="rounded-xl border border-[var(--border-1)] bg-[var(--surface-1)] overflow-hidden">
          <div className="px-5 py-3.5 border-b border-[var(--border-1)] flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-[var(--text-1)]">Minha Carteira</h2>
              <p className="text-[10px] text-[var(--text-3)]">{portfolio.positionsCount} posições</p>
            </div>
            <Link href="/portfolio" className="text-[10px] font-semibold text-[var(--accent-1)] hover:underline">Gerenciar</Link>
          </div>
          <div className="divide-y divide-[var(--border-1)]/50">
            {portfolio.positions.slice(0, 6).map((pos) => (
              <Link key={pos.id} href={`/ativo/${pos.ticker}`} className="flex items-center justify-between px-5 py-3 hover:bg-[var(--surface-2)]/30 transition-colors">
                <div className="flex items-center gap-3">
                  <AssetLogo ticker={pos.ticker} size={28} />
                  <div>
                    <p className="font-semibold text-xs text-[var(--text-1)]">{pos.ticker}</p>
                    <p className="text-[10px] text-[var(--text-3)]">{pos.quantity} · {pos.weight.toFixed(1)}%</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="font-mono text-xs text-[var(--text-1)]">{fmtCompact(pos.totalValue)}</p>
                    <p className={cn('font-mono text-[10px]', pos.gainLossPercent >= 0 ? 'text-[var(--pos)]' : 'text-[var(--neg)]')}>{pct(pos.gainLossPercent)}</p>
                  </div>
                  {pos.iqScore != null && (
                    <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center font-mono text-[10px] font-bold',
                      pos.iqScore >= 65 ? 'bg-emerald-500/10 text-[var(--pos)]' : 'bg-[var(--surface-2)] text-[var(--text-3)]')}>{pos.iqScore}</div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-[var(--accent-1)]/20 p-8 text-center bg-[var(--accent-1)]/3">
          <h3 className="text-sm font-bold text-[var(--text-1)] mb-1">Monte sua carteira</h3>
          <p className="text-[11px] text-[var(--text-2)] max-w-sm mx-auto mb-4">Adicione posições para acompanhar patrimônio, benchmark e receber alertas.</p>
          <Link href="/portfolio" className="inline-flex px-5 py-2 bg-[var(--accent-1)] text-white text-xs font-semibold rounded-lg hover:opacity-90 transition-opacity">Ir para Carteira</Link>
        </div>
      )
    ) : null,

    // ── NOTÍCIAS ──
    noticias: news.length > 0 ? (
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-[var(--text-1)]">Mercado Hoje</h2>
            <p className="text-[10px] text-[var(--text-3)]">Notícias e catalisadores recentes</p>
          </div>
          <Link href="/news" className="text-[10px] font-semibold text-[var(--accent-1)] hover:underline">Ver todas</Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {news.map((item: any, i: number) => (
            <a key={i} href={item.url ?? '#'} target="_blank" rel="noopener noreferrer"
              className="group rounded-xl border border-[var(--border-1)] bg-[var(--surface-1)] p-4 hover:border-[var(--accent-1)]/20 transition-all">
              <p className="text-xs font-medium text-[var(--text-1)] group-hover:text-[var(--accent-1)] transition-colors line-clamp-2 mb-2">{item.title}</p>
              <div className="flex items-center gap-2 text-[10px] text-[var(--text-3)]">
                <span className={cn('px-1.5 py-0.5 rounded text-[9px] font-medium',
                  item.type === 'dividendo' ? 'bg-emerald-500/10 text-emerald-400' :
                  item.type === 'fato_relevante' ? 'bg-amber-500/10 text-amber-400' :
                  'bg-[var(--surface-2)] text-[var(--text-3)]')}>
                  {item.type === 'dividendo' ? 'Dividendo' : item.type === 'fato_relevante' ? 'Fato Relevante' : 'Notícia'}
                </span>
                {item.source && <span>{item.source.replace(/_/g, ' ')}</span>}
                {item.date && <span>{new Date(item.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</span>}
              </div>
            </a>
          ))}
        </div>
      </div>
    ) : null,
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[var(--text-1)] tracking-tight">Dashboard</h1>
          <p className="text-[10px] text-[var(--text-3)]">Centro de comando — mercado e investimentos</p>
        </div>
        <button onClick={() => setEditing(!editing)}
          className={cn('flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-medium rounded-lg border transition-all',
            editing ? 'bg-[var(--accent-1)] text-white border-[var(--accent-1)]' : 'bg-transparent text-[var(--text-3)] border-[var(--border-1)] hover:text-[var(--text-2)]')}>
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="5" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="19" r="1"/></svg>
          {editing ? 'Concluir' : 'Personalizar'}
        </button>
      </div>

      {/* Widgets */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={order} strategy={verticalListSortingStrategy}>
          <div className="space-y-6">
            {order.map(id => {
              const content = widgets[id]
              if (!content) return null
              return (
                <SortableWidget key={id} id={id} editing={editing}>
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                    {content}
                  </motion.div>
                </SortableWidget>
              )
            })}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  )
}

// ─── Components ──────────────────────────────────────────────
function MacroIndicator({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-[var(--surface-1)]/40 backdrop-blur-sm p-3">
      <p className="text-[9px] text-[var(--text-3)] font-medium uppercase tracking-wider mb-0.5"><Term>{label}</Term></p>
      <p className="font-mono text-sm font-bold text-[var(--text-1)]">{value}</p>
    </div>
  )
}
