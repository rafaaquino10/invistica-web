/**
 * Comparação Q1 (top 20% por score) vs Q5 (bottom 20%).
 * Spread positivo = modelo funciona.
 */
'use client'

interface QuintileSpreadProps {
  metrics: {
    quintileSpread: {
      q1AvgReturn: number | null
      q5AvgReturn: number | null
      spreadPositive: boolean
    }
  } | null
  forwardDays: number
  isLoading?: boolean
}

function formatPct(v: number | null | undefined): string {
  if (v === null || v === undefined) return '—'
  return `${(v * 100).toFixed(1)}%`
}

export function QuintileSpread({ metrics, forwardDays, isLoading }: QuintileSpreadProps) {
  const qs = metrics?.quintileSpread
  const q1 = qs?.q1AvgReturn ?? null
  const q5 = qs?.q5AvgReturn ?? null
  const spread = q1 !== null && q5 !== null ? q1 - q5 : null
  const spreadPositive = spread !== null ? spread > 0 : (qs?.spreadPositive ?? false)

  if (isLoading) {
    return (
      <div className="rounded-lg border bg-card p-4 space-y-4">
        <div className="h-5 w-48 animate-pulse rounded bg-muted" />
        <div className="grid grid-cols-2 gap-4">
          <div className="h-24 animate-pulse rounded bg-muted" />
          <div className="h-24 animate-pulse rounded bg-muted" />
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-lg border bg-card p-4 space-y-4">
      <div>
        <h3 className="font-semibold">Spread Q1 vs Q5</h3>
        <p className="text-xs text-muted-foreground">
          Top 20% por score vs Bottom 20% — horizonte {forwardDays}d
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Q1 */}
        <div className="rounded-lg bg-green-500/10 p-4 space-y-1">
          <p className="text-xs font-medium text-green-600 dark:text-green-400">Q1 — Melhores Scores</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
            {formatPct(q1)}
          </p>
          <p className="text-xs text-muted-foreground">retorno médio ({forwardDays}d)</p>
        </div>

        {/* Q5 */}
        <div className="rounded-lg bg-red-500/10 p-4 space-y-1">
          <p className="text-xs font-medium text-red-600 dark:text-red-400">Q5 — Piores Scores</p>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">
            {formatPct(q5)}
          </p>
          <p className="text-xs text-muted-foreground">retorno médio ({forwardDays}d)</p>
        </div>
      </div>

      {/* Spread e status */}
      {spread !== null ? (
        <div
          className="rounded-md px-4 py-3 flex items-center justify-between"
          style={{
            backgroundColor: spreadPositive ? '#22C55E20' : '#EF444420',
          }}
        >
          <div>
            <p
              className="text-sm font-semibold"
              style={{ color: spreadPositive ? '#16A34A' : '#DC2626' }}
            >
              {spreadPositive ? 'Modelo preditivo' : 'Atencao: modelo invertido'}
            </p>
            <p className="text-xs text-muted-foreground">
              {spreadPositive
                ? `Q1 superou Q5 em ${formatPct(spread)} nos últimos ${forwardDays} dias`
                : `Q5 superou Q1 — revisar calibração do modelo`}
            </p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold" style={{ color: spreadPositive ? '#16A34A' : '#DC2626' }}>
              {spread > 0 ? '+' : ''}{formatPct(spread)}
            </p>
            <p className="text-xs text-muted-foreground">spread</p>
          </div>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">
          Dados insuficientes para calcular spread quintil.
        </p>
      )}
    </div>
  )
}
