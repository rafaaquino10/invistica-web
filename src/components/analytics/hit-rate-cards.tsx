/**
 * Cards de Hit Rate por classificação aQ Score.
 * Mostra % de acertos (superou IBOV) para cada nível.
 */
'use client'

interface HitRateData {
  excepcional: number | null
  saudavel: number | null
  atencao: number | null
  critico: number | null
  overall: number | null
}

interface HitRateCardsProps {
  hitRate: HitRateData | null
  forwardDays: number
  isLoading?: boolean
}

const CLASSIFICACOES = [
  { key: 'excepcional' as const, label: 'Excepcional', cor: '#00D4AA' },
  { key: 'saudavel' as const, label: 'Saudável', cor: '#4ADE80' },
  { key: 'atencao' as const, label: 'Atenção', cor: '#FB923C' },
  { key: 'critico' as const, label: 'Crítico', cor: '#EF4444' },
]

function HitRateCard({
  label,
  cor,
  hitRate,
  forwardDays,
  isLoading,
}: {
  label: string
  cor: string
  hitRate: number | null
  forwardDays: number
  isLoading?: boolean
}) {
  const pct = hitRate !== null ? Math.round(hitRate * 100) : null
  const positive = pct !== null && pct >= 50

  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span
          className="rounded-full px-2 py-0.5 text-xs font-medium text-white"
          style={{ backgroundColor: cor }}
        >
          {label}
        </span>
        {!isLoading && pct !== null && (
          <span className={positive ? 'text-green-500' : 'text-red-500'}>
            {positive ? 'OK' : 'X'}
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="h-8 w-16 animate-pulse rounded bg-muted" />
      ) : pct !== null ? (
        <div>
          <span className="text-3xl font-bold" style={{ color: positive ? '#22C55E' : '#EF4444' }}>
            {pct}%
          </span>
          <p className="text-xs text-muted-foreground mt-1">
            bateu IBOV em {forwardDays} dias
          </p>
        </div>
      ) : (
        <div>
          <span className="text-2xl font-bold text-muted-foreground">—</span>
          <p className="text-xs text-muted-foreground mt-1">dados insuficientes</p>
        </div>
      )}

      {/* Mini barra de progresso */}
      {!isLoading && pct !== null && (
        <div className="h-1.5 w-full rounded-full bg-muted">
          <div
            className="h-1.5 rounded-full transition-all"
            style={{ width: `${pct}%`, backgroundColor: cor }}
          />
        </div>
      )}
    </div>
  )
}

export function HitRateCards({ hitRate, forwardDays, isLoading }: HitRateCardsProps) {
  const overall = hitRate?.overall
  const overallPct = overall !== null && overall !== undefined ? Math.round(overall * 100) : null

  return (
    <div className="space-y-3">
      {overallPct !== null && (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Hit Rate Geral:</span>
          <span
            className="font-semibold"
            style={{ color: overallPct >= 50 ? '#22C55E' : '#EF4444' }}
          >
            {overallPct}%
          </span>
          <span className="text-muted-foreground">dos ativos superaram o IBOV em {forwardDays}d</span>
        </div>
      )}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {CLASSIFICACOES.map((c) => (
          <HitRateCard
            key={c.key}
            label={c.label}
            cor={c.cor}
            hitRate={hitRate?.[c.key] ?? null}
            forwardDays={forwardDays}
            isLoading={isLoading}
          />
        ))}
      </div>
    </div>
  )
}
