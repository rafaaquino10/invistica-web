/**
 * Gráfico de barras: retorno médio forward por classificação IQ-Score.
 * Espera-se: Excepcional > Saudável > Atenção > Crítico (monotonicidade).
 */
'use client'

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer, Cell,
} from 'recharts'

interface ReturnByClassificationProps {
  metrics: {
    avgReturn: {
      excepcional: number | null
      saudavel: number | null
      atencao: number | null
      critico: number | null
    }
  } | null
  forwardDays: number
  isLoading?: boolean
}

const CLASSIFICACOES_CONFIG = [
  { key: 'excepcional', label: 'Excepcional', cor: '#00D4AA' },
  { key: 'saudavel', label: 'Saudável', cor: '#4ADE80' },
  { key: 'atencao', label: 'Atenção', cor: '#FB923C' },
  { key: 'critico', label: 'Crítico', cor: '#EF4444' },
]

export function ReturnByClassification({
  metrics,
  forwardDays,
  isLoading,
}: ReturnByClassificationProps) {
  const avgReturn = metrics?.avgReturn

  if (isLoading) {
    return (
      <div className="rounded-lg border bg-card p-4 space-y-4">
        <div className="h-5 w-48 animate-pulse rounded bg-muted" />
        <div className="h-[200px] animate-pulse rounded bg-muted" />
      </div>
    )
  }

  const hasData = avgReturn && Object.values(avgReturn).some((v) => v !== null)

  const chartData = CLASSIFICACOES_CONFIG.map((c) => ({
    label: c.label,
    retorno: avgReturn ? ((avgReturn as Record<string, number | null>)[c.key] ?? null) : null,
    cor: c.cor,
  }))

  // Verificar monotonicidade
  const vals = chartData.map((d) => d.retorno).filter((v): v is number => v !== null)
  const isMonotonic =
    vals.length >= 2 &&
    vals.every((v, i) => i === 0 || v <= vals[i - 1]!)

  return (
    <div className="rounded-lg border bg-card p-4 space-y-4">
      <div>
        <h3 className="font-semibold">Retorno Médio por Classificação</h3>
        <p className="text-xs text-muted-foreground">
          Retorno forward de {forwardDays}d por nível de score
        </p>
      </div>

      {!hasData ? (
        <div className="flex h-[200px] flex-col items-center justify-center gap-2 text-center">
          <p className="text-sm text-muted-foreground">Dados insuficientes</p>
          <p className="text-xs text-muted-foreground max-w-xs">
            O feedback loop começa a gerar resultados após ~3 meses de snapshots semanais.
          </p>
        </div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} />
              <YAxis
                tick={{ fontSize: 11 }}
                tickFormatter={(v: number) => `${(v * 100).toFixed(0)}%`}
              />
              <ReferenceLine y={0} stroke="hsl(var(--border))" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px',
                  fontSize: '12px',
                }}
                formatter={(v: number) => [`${(v * 100).toFixed(1)}%`, 'Retorno Médio']}
              />
              <Bar dataKey="retorno" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, idx) => (
                  <Cell key={idx} fill={entry.cor} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          {/* Status de monotonicidade */}
          <div
            className="rounded-md px-3 py-2 text-xs"
            style={{
              backgroundColor: isMonotonic ? '#22C55E20' : '#EF444420',
              color: isMonotonic ? '#16A34A' : '#DC2626',
            }}
          >
            {isMonotonic
              ? 'Monotonicidade confirmada: Excepcional > Saudavel > Atencao > Critico'
              : 'Ordem nao monotonica — revisar calibracao do modelo'}
          </div>
        </>
      )}
    </div>
  )
}
