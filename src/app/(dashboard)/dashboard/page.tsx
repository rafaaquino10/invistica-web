'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Skeleton, Disclaimer } from '@/components/ui'
import { AssetLogo } from '@/components/ui/asset-logo'
import { cn } from '@/lib/utils'
import { pro, free } from '@/lib/api/endpoints'
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
  STRONG_BUY: 'Compra Forte', BUY: 'Acumular', HOLD: 'Neutro',
  REDUCE: 'Reduzir', AVOID: 'Evitar',
}

const RATING_COLORS: Record<string, string> = {
  STRONG_BUY: 'bg-emerald-500/15 text-emerald-600',
  BUY: 'bg-blue-500/15 text-blue-600',
  HOLD: 'bg-amber-500/15 text-amber-600',
  REDUCE: 'bg-orange-500/15 text-orange-600',
  AVOID: 'bg-red-500/15 text-red-600',
}

const REGIME_LABELS: Record<string, { label: string; color: string }> = {
  RISK_ON: { label: 'Risk On', color: 'text-[var(--pos)]' },
  RISK_OFF: { label: 'Risk Off', color: 'text-[var(--neg)]' },
  RECOVERY: { label: 'Recuperação', color: 'text-[var(--accent-1)]' },
  STAGFLATION: { label: 'Estagflação', color: 'text-amber-500' },
}

// ─── Main Dashboard Page ─────────────────────────────────────
export default function DashboardPage() {
  const { token } = useAuth()

  // Macro regime
  const { data: macroRegime } = useQuery({
    queryKey: ['macro-regime'],
    queryFn: () => pro.getMacroRegime(token ?? undefined).catch(() => null),
    retry: 0,
  })

  // Top opportunities — usar screener que filtra nulls
  const { data: topData, isLoading: loadingTop } = useQuery({
    queryKey: ['dashboard-top'],
    queryFn: () => pro.getScreener({ min_score: 55, limit: 5 }, token ?? undefined).catch(() => null),
    retry: 1,
  })

  // Dividend radar
  const { data: divRadar } = useQuery({
    queryKey: ['dashboard-div-radar'],
    queryFn: () => pro.getDividendRadar(70, token ?? undefined).catch(() => null),
    retry: 0,
  })

  // Portfolio
  const { data: rawPortfolio, isLoading: loadingPortfolio } = useQuery({
    queryKey: ['portfolio'],
    queryFn: () => pro.getPortfolio(token ?? undefined).catch(() => null),
    retry: 1,
  })

  // Catalysts (news)
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

  return (
    <motion.div className="space-y-6" {...staggerContainer}>

      {/* ─── Seção 1: Barra Macro ──────────────────────── */}
      {macroRegime && (
        <motion.div {...fadeInUp} className="flex flex-wrap items-center gap-x-6 gap-y-2 px-5 py-3 bg-[var(--surface-1)] rounded-[var(--radius)] border border-[var(--border-1)]">
          <MacroItem label="SELIC" value={`${macroRegime.macro.selic.toFixed(2)}%`} />
          <div className="w-px h-5 bg-[var(--border-1)]" />
          <MacroItem label="IPCA" value={`${macroRegime.macro.ipca.toFixed(1)}%`} />
          <div className="w-px h-5 bg-[var(--border-1)]" />
          <MacroItem label="Dólar" value={`R$ ${macroRegime.macro.cambio_usd.toFixed(2)}`} />
          <div className="w-px h-5 bg-[var(--border-1)]" />
          <div className="flex items-center gap-2">
            <span className="text-[var(--text-caption)] text-[var(--text-2)] font-medium">Regime</span>
            <span className={cn('font-semibold text-sm', REGIME_LABELS[macroRegime.regime]?.color ?? 'text-[var(--text-1)]')}>
              {REGIME_LABELS[macroRegime.regime]?.label ?? macroRegime.regime}
            </span>
          </div>
        </motion.div>
      )}

      {/* ─── Seção 2: Hero Patrimônio ─────────────────── */}
      {portfolio && portfolio.positionsCount > 0 && (
        <motion.div {...fadeInUp} className="rounded-[var(--radius)] border border-[var(--border-1)] p-6 bg-gradient-to-br from-[var(--surface-1)] via-[var(--surface-1)] to-[var(--accent-2)]">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <p className="text-[var(--text-caption)] font-medium text-[var(--text-2)] uppercase tracking-wider mb-1">Patrimônio Total</p>
              <p className="font-mono text-3xl md:text-4xl font-bold text-[var(--text-1)] leading-none">
                {fmt(portfolio.totalValue)}
              </p>
              <p className="text-[var(--text-small)] text-[var(--text-2)] mt-1 font-mono">
                Custo: {fmt(portfolio.totalCost, { compact: true })} | Ganho: {fmt(portfolio.gainLoss, { compact: true })}
              </p>
            </div>
            <div className={cn(
              'text-right px-5 py-3 rounded-xl',
              portfolio.gainLossPercent >= 0 ? 'bg-[var(--pos)]/10' : 'bg-[var(--neg)]/10'
            )}>
              <p className={cn('font-mono text-2xl font-bold', portfolio.gainLossPercent >= 0 ? 'text-[var(--pos)]' : 'text-[var(--neg)]')}>
                {pct(portfolio.gainLossPercent)}
              </p>
              <p className="text-[var(--text-caption)] text-[var(--text-2)]">Rentabilidade</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* ─── Seção 3: Top 5 Oportunidades ─────────────── */}
      <motion.div {...fadeInUp}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-base font-semibold text-[var(--text-1)]">Melhores Oportunidades</h2>
            <p className="text-[var(--text-caption)] text-[var(--text-2)]">Ações com maior IQ-Score</p>
          </div>
          <Link href="/explorer" className="text-[var(--text-small)] font-medium text-[var(--accent-1)] hover:underline">
            Ver todas
          </Link>
        </div>
        {loadingTop ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-[var(--radius)]" />)}
          </div>
        ) : topPicks.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {topPicks.map((pick) => (
              <Link
                key={pick.ticker}
                href={`/ativo/${pick.ticker}`}
                className="bg-[var(--surface-1)] rounded-[var(--radius)] border border-[var(--border-1)] p-4 hover:border-[var(--accent-1)]/40 hover:shadow-sm transition-all group"
              >
                <div className="flex items-center gap-2.5 mb-3">
                  <AssetLogo ticker={pick.ticker} size={32} />
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-[var(--text-1)] group-hover:text-[var(--accent-1)] transition-colors">{pick.ticker}</p>
                    <p className="text-[10px] text-[var(--text-2)] truncate">{pick.company_name}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <div className={cn(
                    'w-10 h-10 rounded-lg flex items-center justify-center font-mono text-sm font-bold',
                    (pick.iq_score ?? 0) >= 75 ? 'bg-[var(--pos)]/12 text-[var(--pos)]' :
                    (pick.iq_score ?? 0) >= 62 ? 'bg-[var(--accent-1)]/12 text-[var(--accent-1)]' :
                    'bg-[var(--bg)] text-[var(--text-2)]'
                  )}>
                    {pick.iq_score ?? '--'}
                  </div>
                  <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full', RATING_COLORS[pick.rating] ?? 'bg-[var(--bg)] text-[var(--text-2)]')}>
                    {RATING_LABELS[pick.rating] ?? pick.rating ?? '--'}
                  </span>
                </div>
                <div className="space-y-1 text-[11px]">
                  {pick.safety_margin != null && (
                    <div className="flex justify-between">
                      <span className="text-[var(--text-2)]">Desconto</span>
                      <span className={cn('font-mono font-medium', pick.safety_margin > 0 ? 'text-[var(--pos)]' : 'text-[var(--neg)]')}>
                        {(pick.safety_margin * 100).toFixed(0)}%
                      </span>
                    </div>
                  )}
                  {pick.dividend_yield_proj != null && pick.dividend_yield_proj > 0 && (
                    <div className="flex justify-between">
                      <span className="text-[var(--text-2)]">DY Proj.</span>
                      <span className="font-mono font-medium text-[var(--text-1)]">{(pick.dividend_yield_proj * 100).toFixed(1)}%</span>
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-[var(--surface-1)] rounded-[var(--radius)] border border-[var(--border-1)] p-8 text-center text-sm text-[var(--text-2)]">
            Nenhuma oportunidade disponível no momento.
          </div>
        )}
      </motion.div>

      {/* ─── Seção 4: Dividendos em Destaque ──────────── */}
      {topDividends.length > 0 && (
        <motion.div {...fadeInUp}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-base font-semibold text-[var(--text-1)]">Dividendos Seguros</h2>
              <p className="text-[var(--text-caption)] text-[var(--text-2)]">Ações com alta segurança de dividendo</p>
            </div>
            <Link href="/dividends" className="text-[var(--text-small)] font-medium text-[var(--accent-1)] hover:underline">
              Ver radar
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {topDividends.map((d: any) => (
              <Link
                key={d.ticker}
                href={`/ativo/${d.ticker}`}
                className="bg-[var(--surface-1)] rounded-[var(--radius)] border border-[var(--border-1)] p-4 hover:border-teal/40 transition-all"
              >
                <div className="flex items-center gap-3 mb-3">
                  <AssetLogo ticker={d.ticker} size={28} />
                  <div>
                    <p className="font-semibold text-sm">{d.ticker}</p>
                    <p className="text-[10px] text-[var(--text-2)] truncate">{d.company_name}</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-[10px] text-[var(--text-2)]">DY Proj.</p>
                    <p className="font-mono text-sm font-bold text-[var(--accent-1)]">{((d.dividend_yield_proj ?? 0) * 100).toFixed(1)}%</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-[var(--text-2)]">Safety</p>
                    <p className={cn('font-mono text-sm font-bold', (d.dividend_safety ?? 0) >= 70 ? 'text-[var(--pos)]' : 'text-amber-500')}>{d.dividend_safety ?? '--'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-[var(--text-2)]">IQ-Score</p>
                    <p className="font-mono text-sm font-bold text-[var(--text-1)]">{d.iq_score ?? '--'}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </motion.div>
      )}

      {/* ─── Seção 5: Minha Carteira ──────────────────── */}
      {!loadingPortfolio && portfolio && portfolio.positionsCount > 0 ? (
        <motion.div {...fadeInUp} className="bg-[var(--surface-1)] rounded-[var(--radius)] shadow-sm border border-[var(--border-1)] overflow-hidden">
          <div className="px-5 py-4 border-b border-[var(--border-1)] flex items-center justify-between">
            <h2 className="text-base font-semibold text-[var(--text-1)]">Minha Carteira</h2>
            <Link href="/portfolio" className="text-[var(--text-small)] font-medium text-[var(--accent-1)] hover:underline">
              Gerenciar
            </Link>
          </div>
          <div className="divide-y divide-[var(--border-1)]">
            {portfolio.positions.slice(0, 6).map((pos) => (
              <Link
                key={pos.id}
                href={`/ativo/${pos.ticker}`}
                className="flex items-center justify-between px-5 py-3 hover:bg-[var(--surface-2)] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <AssetLogo ticker={pos.ticker} size={32} />
                  <div>
                    <p className="font-semibold text-[var(--text-1)] text-sm">{pos.ticker}</p>
                    <p className="text-[var(--text-caption)] text-[var(--text-2)]">
                      {pos.quantity} cotas | {pos.weight.toFixed(1)}%
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="font-mono text-sm text-[var(--text-1)]">{fmt(pos.totalValue)}</p>
                    <p className={cn('font-mono text-xs', pos.gainLossPercent >= 0 ? 'text-[var(--pos)]' : 'text-[var(--neg)]')}>
                      {pct(pos.gainLossPercent)}
                    </p>
                  </div>
                  {pos.iqScore != null && (
                    <div className={cn(
                      'w-9 h-9 rounded-lg flex items-center justify-center font-mono text-xs font-bold',
                      pos.iqScore >= 65 ? 'bg-[var(--pos)]/10 text-[var(--pos)]' : 'bg-[var(--bg)] text-[var(--text-2)]'
                    )}>
                      {pos.iqScore}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </motion.div>
      ) : !loadingPortfolio ? (
        <motion.div {...fadeInUp} className="rounded-[var(--radius)] border border-dashed border-[var(--accent-1)]/30 p-8 text-center bg-[var(--accent-2)]/20">
          <h3 className="text-lg font-semibold text-[var(--text-1)] mb-1">Monte sua carteira</h3>
          <p className="text-sm text-[var(--text-2)] max-w-md mx-auto mb-4">
            Adicione suas posições para acompanhar patrimônio, receber insights e recomendações personalizadas.
          </p>
          <Link
            href="/portfolio"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-[var(--accent-1)] text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity"
          >
            Ir para Carteira
          </Link>
        </motion.div>
      ) : null}

      {/* ─── Seção 6: Últimas Notícias ────────────────── */}
      {recentNews.length > 0 && (
        <motion.div {...fadeInUp}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-[var(--text-1)]">Mercado Hoje</h2>
            <Link href="/news" className="text-[var(--text-small)] font-medium text-[var(--accent-1)] hover:underline">
              Ver todas
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {recentNews.map((item, i) => (
              <a
                key={i}
                href={item.url ?? '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[var(--surface-1)] rounded-[var(--radius)] border border-[var(--border-1)] p-4 hover:border-[var(--accent-1)]/30 transition-all group"
              >
                <p className="text-sm font-medium text-[var(--text-1)] group-hover:text-[var(--accent-1)] transition-colors line-clamp-2 mb-2">
                  {item.title}
                </p>
                <div className="flex items-center gap-3 text-[var(--text-caption)] text-[var(--text-2)]">
                  <span className={cn(
                    'px-1.5 py-0.5 rounded text-[10px] font-medium',
                    item.type === 'dividendo' ? 'bg-teal/10 text-teal' :
                    item.type === 'fato_relevante' ? 'bg-amber-500/10 text-amber-600' :
                    'bg-[var(--bg)] text-[var(--text-2)]'
                  )}>
                    {item.type === 'dividendo' ? 'Dividendo' : item.type === 'fato_relevante' ? 'Fato Relevante' : 'Notícia'}
                  </span>
                  {item.source && <span>{item.source.replace('_', ' ')}</span>}
                  {item.date && <span>{new Date(item.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</span>}
                </div>
              </a>
            ))}
          </div>
        </motion.div>
      )}

      <Disclaimer variant="footer" />
    </motion.div>
  )
}

// ─── Macro Item ──────────────────────────────────────────────
function MacroItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[var(--text-caption)] text-[var(--text-2)] font-medium">{label}</span>
      <span className="font-mono text-sm font-semibold text-[var(--text-1)]">{value}</span>
    </div>
  )
}
