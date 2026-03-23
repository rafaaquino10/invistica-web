'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

interface DividendEntry {
  type: string
  value: number
  paymentDate: Date | null
}

interface DividendSummaryProps {
  dividends: DividendEntry[]
  dividendYield: number | null | undefined
}

function formatDate(d: Date | null): string {
  if (!d) return '—'
  const date = new Date(d)
  return date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
}

export function DividendSummary({ dividends, dividendYield }: DividendSummaryProps) {
  // Sort by date desc for table, asc for chart
  const sorted = [...dividends]
    .filter(d => d.paymentDate)
    .sort((a, b) => new Date(b.paymentDate!).getTime() - new Date(a.paymentDate!).getTime())

  const chartData = [...sorted]
    .reverse()
    .slice(-12)
    .map(d => ({
      date: formatDate(d.paymentDate),
      value: d.value,
    }))

  const lastPayment = sorted[0]
  const hasData = sorted.length > 0 || (dividendYield != null && dividendYield > 0)

  if (!hasData) {
    return (
      <div className="border border-[var(--border-1)]/20 rounded-[var(--radius)] bg-[var(--surface-1)] p-4 flex items-center justify-center min-h-[120px]">
        <p className="text-sm text-[var(--text-3)]">Sem histórico de dividendos</p>
      </div>
    )
  }

  return (
    <div className="border border-[var(--border-1)]/20 rounded-[var(--radius)] bg-[var(--surface-1)] p-4">
        {/* Header stats */}
        <div className="flex items-center gap-6 mb-3">
          {dividendYield != null && dividendYield > 0 && (
            <div>
              <p className="text-[10px] text-[var(--text-3)] uppercase tracking-wide">DY 12m</p>
              <p className="text-lg font-mono font-bold text-[var(--pos)]">{dividendYield.toFixed(1)}%</p>
            </div>
          )}
          {lastPayment && (
            <div>
              <p className="text-[10px] text-[var(--text-3)] uppercase tracking-wide">Último pgto.</p>
              <p className="text-sm font-mono text-[var(--text-1)]">
                R$ {lastPayment.value.toFixed(4)} <span className="text-[var(--text-3)]">({formatDate(lastPayment.paymentDate)})</span>
              </p>
            </div>
          )}
        </div>

        {/* Mini bar chart */}
        {chartData.length >= 2 && (
          <div className="mb-4">
            <ResponsiveContainer width="100%" height={100}>
              <BarChart data={chartData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 9, fill: 'var(--text-3)' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis hide />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--surface-1)',
                    border: '1px solid var(--border-1)',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                  formatter={(value: number) => [`R$ ${value.toFixed(4)}`, 'Provento']}
                />
                <Bar dataKey="value" fill="var(--pos)" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Recent dividends table */}
        {sorted.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border-1)]/10">
                  <th className="text-left py-1.5 text-[10px] font-medium text-[var(--text-3)] uppercase tracking-wide">Data</th>
                  <th className="text-left py-1.5 text-[10px] font-medium text-[var(--text-3)] uppercase tracking-wide">Tipo</th>
                  <th className="text-right py-1.5 text-[10px] font-medium text-[var(--text-3)] uppercase tracking-wide">Valor/Ação</th>
                </tr>
              </thead>
              <tbody>
                {sorted.slice(0, 5).map((d, i) => (
                  <tr key={i} className="border-b border-[var(--border-1)]/5 last:border-0">
                    <td className="py-1.5 text-[var(--text-2)] font-mono text-xs">{formatDate(d.paymentDate)}</td>
                    <td className="py-1.5 text-[var(--text-2)] text-xs">{d.type}</td>
                    <td className="py-1.5 text-right font-mono text-xs text-[var(--text-1)]">R$ {d.value.toFixed(4)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
  )
}
