'use client'

/**
 * Decomposição DuPont do ROE
 * ROE = Margem Líquida × Giro do Ativo × Multiplicador de Equity
 *
 * Mostra visualmente como o ROE é composto, ajudando o investidor
 * a entender se a rentabilidade vem de eficiência, volume ou alavancagem.
 */

interface DuPontProps {
  roe: number              // ROE em % (ex: 15 = 15%)
  margemLiquida: number | null  // Margem líquida em % (ex: 10 = 10%)
  patrimLiquido: number | null  // PL em R$
  divBrutPatrim: number | null  // Dívida Bruta / PL (ex: 1.5)
}

function qualityLabel(value: number, thresholds: [number, number]): { text: string; color: string } {
  if (value >= thresholds[1]) return { text: 'Alto', color: 'var(--color-success-500, #00D4AA)' }
  if (value >= thresholds[0]) return { text: 'Moderado', color: 'var(--color-warning-500, #FB923C)' }
  return { text: 'Baixo', color: 'var(--color-danger-500, #EF4444)' }
}

function leverageLabel(multiplier: number | null): { text: string; color: string } {
  if (multiplier == null) return { text: '—', color: 'var(--text-3)' }
  if (multiplier <= 2.0) return { text: 'Conservadora', color: 'var(--color-success-500, #00D4AA)' }
  if (multiplier <= 3.5) return { text: 'Moderada', color: 'var(--color-warning-500, #FB923C)' }
  return { text: 'Elevada', color: 'var(--color-danger-500, #EF4444)' }
}

export function DuPontDecomposition({ roe, margemLiquida, patrimLiquido, divBrutPatrim }: DuPontProps) {
  // Multiplicador de Equity = Ativo Total / PL = 1 + (Dívida / PL)
  const multiplicador = divBrutPatrim != null && divBrutPatrim >= 0
    ? 1 + divBrutPatrim
    : null

  // Giro do Ativo = ROE / (Margem × Multiplicador)
  // Se temos ROE, margem e multiplicador, podemos derivar o giro
  const giroAtivo = margemLiquida != null && margemLiquida !== 0 && multiplicador != null && multiplicador !== 0
    ? (roe / (margemLiquida * multiplicador))
    : null

  const roeQuality = qualityLabel(roe, [8, 15])
  const margemQuality = margemLiquida != null ? qualityLabel(margemLiquida, [5, 12]) : null
  const levLabel = leverageLabel(multiplicador)

  return (
    <div>
      <h2 className="text-[11px] font-semibold text-[var(--text-3)] uppercase tracking-wider mb-2">
        Decomposição DuPont
      </h2>
      <div className="border border-[var(--border-1)]/20 rounded-[var(--radius)] bg-[var(--surface-1)] p-4">
        {/* Fórmula visual */}
        <div className="flex items-center justify-center gap-1 text-[var(--text-caption)] text-[var(--text-3)] mb-4">
          <span>ROE</span>
          <span className="text-[var(--text-3)]/50">=</span>
          <span>Margem Líquida</span>
          <span className="text-[var(--text-3)]/50">×</span>
          <span>Giro do Ativo</span>
          <span className="text-[var(--text-3)]/50">×</span>
          <span>Alavancagem</span>
        </div>

        {/* Cards dos componentes */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* ROE */}
          <div className="rounded-lg bg-[var(--bg-1)] border border-[var(--border-1)]/10 p-3 text-center">
            <div className="text-[var(--text-caption)] text-[var(--text-3)] mb-1">ROE</div>
            <div className="text-lg font-semibold" style={{ color: roeQuality.color }}>
              {roe.toFixed(1)}%
            </div>
            <div className="text-[10px] mt-1" style={{ color: roeQuality.color }}>
              {roeQuality.text}
            </div>
          </div>

          {/* Margem Líquida */}
          <div className="rounded-lg bg-[var(--bg-1)] border border-[var(--border-1)]/10 p-3 text-center">
            <div className="text-[var(--text-caption)] text-[var(--text-3)] mb-1">Margem Líquida</div>
            <div className="text-lg font-semibold" style={{ color: margemQuality?.color ?? 'var(--text-3)' }}>
              {margemLiquida != null ? `${margemLiquida.toFixed(1)}%` : '—'}
            </div>
            <div className="text-[10px] mt-1" style={{ color: margemQuality?.color ?? 'var(--text-3)' }}>
              {margemQuality?.text ?? 'Indisponível'}
            </div>
            <div className="text-[9px] text-[var(--text-3)]/60 mt-0.5">Eficiência</div>
          </div>

          {/* Giro do Ativo */}
          <div className="rounded-lg bg-[var(--bg-1)] border border-[var(--border-1)]/10 p-3 text-center">
            <div className="text-[var(--text-caption)] text-[var(--text-3)] mb-1">Giro do Ativo</div>
            <div className="text-lg font-semibold text-[var(--text-1)]">
              {giroAtivo != null ? `${giroAtivo.toFixed(2)}x` : '—'}
            </div>
            <div className="text-[10px] mt-1 text-[var(--text-3)]">
              {giroAtivo != null ? (giroAtivo >= 0.8 ? 'Bom uso dos ativos' : giroAtivo >= 0.4 ? 'Uso moderado' : 'Capital intensivo') : 'Indisponível'}
            </div>
            <div className="text-[9px] text-[var(--text-3)]/60 mt-0.5">Volume</div>
          </div>

          {/* Alavancagem */}
          <div className="rounded-lg bg-[var(--bg-1)] border border-[var(--border-1)]/10 p-3 text-center">
            <div className="text-[var(--text-caption)] text-[var(--text-3)] mb-1">Alavancagem</div>
            <div className="text-lg font-semibold" style={{ color: levLabel.color }}>
              {multiplicador != null ? `${multiplicador.toFixed(2)}x` : '—'}
            </div>
            <div className="text-[10px] mt-1" style={{ color: levLabel.color }}>
              {levLabel.text}
            </div>
            <div className="text-[9px] text-[var(--text-3)]/60 mt-0.5">Ativo/PL</div>
          </div>
        </div>

        {/* Insight contextual */}
        <div className="mt-3 text-[var(--text-caption)] text-[var(--text-3)]/80 leading-relaxed">
          {roe >= 15 && margemLiquida != null && margemLiquida >= 12 && multiplicador != null && multiplicador <= 2 && (
            <span>ROE alto sustentado por margens sólidas e baixa alavancagem — perfil de qualidade.</span>
          )}
          {roe >= 15 && multiplicador != null && multiplicador > 3 && (
            <span>ROE elevado impulsionado por alavancagem — monitorar capacidade de servir a dívida.</span>
          )}
          {roe < 8 && margemLiquida != null && margemLiquida < 5 && (
            <span>ROE baixo reflexo de margens comprimidas — avaliar potencial de recuperação operacional.</span>
          )}
          {roe >= 8 && roe < 15 && (
            <span>ROE moderado — entender a composição ajuda a identificar alavancas de melhoria.</span>
          )}
        </div>
      </div>
    </div>
  )
}
