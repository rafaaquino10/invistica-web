'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

/**
 * Calculadora de IRPF para operações com ações brasileiras.
 * Regras vigentes (2024-2025):
 * - Vendas <= R$20.000/mês em ações: isento de IRPF sobre ganho de capital
 * - Vendas > R$20.000/mês: 15% sobre lucro (swing trade)
 * - Day trade: 20% sobre lucro
 * - JCP: 15% retido na fonte
 * - Dividendos: isentos
 *
 * NÃO substitui orientação de contador/tributarista.
 */

interface IRPFResult {
  totalVendas: number
  lucroLiquido: number
  isento: boolean
  aliquota: number
  impostoDevido: number
  tipo: 'swing' | 'daytrade'
}

function calcularIRPF(
  totalVendas: number,
  custoTotal: number,
  isDayTrade: boolean,
): IRPFResult {
  const lucroLiquido = totalVendas - custoTotal
  const tipo = isDayTrade ? 'daytrade' as const : 'swing' as const
  const aliquota = isDayTrade ? 0.20 : 0.15

  // Isenção: vendas <= R$20.000/mês em swing trade
  const isento = !isDayTrade && totalVendas <= 20000

  const impostoDevido = lucroLiquido > 0 && !isento
    ? lucroLiquido * aliquota
    : 0

  return { totalVendas, lucroLiquido, isento, aliquota, impostoDevido, tipo }
}

function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function IRPFCalculator() {
  const [totalVendas, setTotalVendas] = useState('')
  const [custoTotal, setCustoTotal] = useState('')
  const [isDayTrade, setIsDayTrade] = useState(false)
  const [jcpRecebido, setJcpRecebido] = useState('')
  const [result, setResult] = useState<IRPFResult | null>(null)

  const handleCalcular = () => {
    const vendas = parseFloat(totalVendas.replace(/[^\d.,]/g, '').replace(',', '.')) || 0
    const custo = parseFloat(custoTotal.replace(/[^\d.,]/g, '').replace(',', '.')) || 0
    setResult(calcularIRPF(vendas, custo, isDayTrade))
  }

  const jcpValue = parseFloat(jcpRecebido.replace(/[^\d.,]/g, '').replace(',', '.')) || 0
  const jcpImposto = jcpValue * 0.15

  return (
    <div>
      <h2 className="text-[11px] font-semibold text-[var(--text-3)] uppercase tracking-wider mb-2">
        Calculadora IRPF
      </h2>
      <div className="border border-[var(--border-1)]/20 rounded-[var(--radius)] bg-[var(--surface-1)] p-4 space-y-4">

        {/* Tipo de operação */}
        <div className="flex gap-2">
          <button
            onClick={() => setIsDayTrade(false)}
            className={cn(
              'px-3 py-1.5 text-[12px] font-medium rounded-lg transition-colors',
              !isDayTrade
                ? 'bg-[var(--accent-1)] text-white'
                : 'bg-[var(--bg-1)] text-[var(--text-2)] hover:bg-[var(--surface-2)]'
            )}
          >
            Swing Trade (15%)
          </button>
          <button
            onClick={() => setIsDayTrade(true)}
            className={cn(
              'px-3 py-1.5 text-[12px] font-medium rounded-lg transition-colors',
              isDayTrade
                ? 'bg-[var(--accent-1)] text-white'
                : 'bg-[var(--bg-1)] text-[var(--text-2)] hover:bg-[var(--surface-2)]'
            )}
          >
            Day Trade (20%)
          </button>
        </div>

        {/* Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-[var(--text-2)]">Total de vendas no mês (R$)</label>
            <input
              type="text"
              inputMode="decimal"
              placeholder="0,00"
              value={totalVendas}
              onChange={(e) => setTotalVendas(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg bg-[var(--bg-1)] border border-[var(--border-1)]/30 text-[var(--text-1)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-1)]/50"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-[var(--text-2)]">Custo total (preço médio × qtd)</label>
            <input
              type="text"
              inputMode="decimal"
              placeholder="0,00"
              value={custoTotal}
              onChange={(e) => setCustoTotal(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg bg-[var(--bg-1)] border border-[var(--border-1)]/30 text-[var(--text-1)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-1)]/50"
            />
          </div>
        </div>

        {/* JCP separado */}
        <div className="space-y-1">
          <label className="text-[11px] font-medium text-[var(--text-2)]">JCP recebido no mês (R$) — opcional</label>
          <input
            type="text"
            inputMode="decimal"
            placeholder="0,00"
            value={jcpRecebido}
            onChange={(e) => setJcpRecebido(e.target.value)}
            className="w-full md:w-1/2 px-3 py-2 text-sm rounded-lg bg-[var(--bg-1)] border border-[var(--border-1)]/30 text-[var(--text-1)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-1)]/50"
          />
        </div>

        {/* Calcular */}
        <button
          onClick={handleCalcular}
          className="px-4 py-2 text-sm font-medium rounded-lg bg-[var(--accent-1)] text-white hover:bg-[var(--accent-1)]/90 transition-colors"
        >
          Calcular IRPF
        </button>

        {/* Resultado */}
        {result && (
          <div className="mt-3 p-3 rounded-lg bg-[var(--bg-1)] border border-[var(--border-1)]/20 space-y-2">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="text-center">
                <div className="text-[10px] text-[var(--text-3)] uppercase">Vendas</div>
                <div className="text-sm font-semibold text-[var(--text-1)]">{formatBRL(result.totalVendas)}</div>
              </div>
              <div className="text-center">
                <div className="text-[10px] text-[var(--text-3)] uppercase">Lucro/Prejuízo</div>
                <div className={cn('text-sm font-semibold', result.lucroLiquido >= 0 ? 'text-[var(--color-success-500,#00D4AA)]' : 'text-[var(--color-danger-500,#EF4444)]')}>
                  {formatBRL(result.lucroLiquido)}
                </div>
              </div>
              <div className="text-center">
                <div className="text-[10px] text-[var(--text-3)] uppercase">Alíquota</div>
                <div className="text-sm font-semibold text-[var(--text-1)]">
                  {result.isento ? 'Isento' : `${(result.aliquota * 100).toFixed(0)}%`}
                </div>
              </div>
              <div className="text-center">
                <div className="text-[10px] text-[var(--text-3)] uppercase">IRPF Devido</div>
                <div className={cn('text-sm font-bold', result.impostoDevido > 0 ? 'text-[var(--color-warning-500,#FB923C)]' : 'text-[var(--color-success-500,#00D4AA)]')}>
                  {formatBRL(result.impostoDevido)}
                </div>
              </div>
            </div>

            {/* Isenção */}
            {result.isento && result.lucroLiquido > 0 && (
              <div className="text-[11px] text-[var(--color-success-500,#00D4AA)] bg-[var(--color-success-500,#00D4AA)]/10 px-3 py-1.5 rounded-md">
                Isento: vendas em swing trade abaixo de R$20.000 no mês.
              </div>
            )}

            {/* Prejuízo */}
            {result.lucroLiquido < 0 && (
              <div className="text-[11px] text-[var(--color-info-500,#3B82F6)] bg-[var(--color-info-500,#3B82F6)]/10 px-3 py-1.5 rounded-md">
                Prejuízo de {formatBRL(Math.abs(result.lucroLiquido))} pode ser compensado em meses futuros (mesmo tipo de operação).
              </div>
            )}

            {/* JCP */}
            {jcpValue > 0 && (
              <div className="text-[11px] text-[var(--text-2)] bg-[var(--bg-1)] px-3 py-1.5 rounded-md border border-[var(--border-1)]/10">
                JCP: {formatBRL(jcpValue)} bruto — IRRF retido na fonte: {formatBRL(jcpImposto)} (15%)
              </div>
            )}
          </div>
        )}

        {/* Disclaimer */}
        <p className="text-[10px] text-[var(--text-3)]/60 leading-relaxed">
          Cálculo simplificado para fins educativos. Não substitui orientação de contador ou consultor tributário.
          Regras vigentes: isenção para vendas em swing trade &le; R$20.000/mês; day trade 20%; JCP 15% na fonte.
          Dividendos são isentos. Prejuízos podem ser compensados em meses futuros no mesmo tipo de operação.
        </p>
      </div>
    </div>
  )
}
