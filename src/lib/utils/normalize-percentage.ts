/**
 * ─── Normalização de Percentuais ─────────────────────────────
 *
 * PADRÃO CANÔNICO do InvestIQ:
 *   Percentuais são armazenados internamente como WHOLE NUMBERS.
 *   13.84 significa 13.84% (NÃO 0.1384)
 *
 * Fontes de dados:
 *   - CVM: calcula ratio → *100 no gateway (já sai como whole number)
 *   - brapi modules: returnOnEquity etc. são decimais → *100 no gateway
 *   - demo-data: already whole numbers
 *   - Gateway unificado: sempre whole numbers na saída
 *
 * Na UI: exibir diretamente + "%" — NUNCA multiplicar por 100.
 *   Use formatPercent() de formatters.ts (que faz /100 para Intl.NumberFormat).
 *
 * Esta função é um GUARDRAIL para detectar e corrigir valores que
 * chegaram como decimais (< 1 em absoluto) quando deveriam ser whole numbers.
 */

export type PercentageSource = 'cvm' | 'brapi' | 'demo' | 'gateway' | 'unknown'

/**
 * Lista de campos percentuais em AssetData.fundamentals.
 * Estes campos seguem o padrão whole number (13.84 = 13.84%).
 */
export const PERCENTAGE_FIELDS = [
  'roe',
  'roic',
  'margemEbit',
  'margemLiquida',
  'dividendYield',
  'crescimentoReceita5a',
] as const

/**
 * Normaliza um valor percentual para o padrão canônico (whole number).
 *
 * Heurística: se o valor absoluto for < 1 E a source for 'cvm' ou 'brapi',
 * assume que está em formato decimal e converte para whole number.
 *
 * NOTA: valores entre -1 e 1 que são genuinamente < 1% (ex: ROE 0.5%)
 * são raros em ações brasileiras e não são afetados pelo threshold.
 *
 * @param value - Valor percentual (pode ser decimal ou whole number)
 * @param source - Fonte dos dados (para decidir se converter)
 * @returns Valor normalizado como whole number, ou null se input for null/undefined
 */
export function normalizePercentage(
  value: number | null | undefined,
  source: PercentageSource = 'unknown'
): number | null {
  if (value === null || value === undefined || isNaN(value)) return null

  // CVM e brapi podem enviar como decimal (0.1384 → 13.84)
  // Gateway e demo já enviam como whole number
  if ((source === 'cvm' || source === 'brapi') && Math.abs(value) < 1 && value !== 0) {
    return Math.round(value * 10000) / 100 // 0.1384 → 13.84
  }

  return value
}

/**
 * Aplica normalizePercentage em um objeto de fundamentals,
 * convertendo apenas os campos que são percentuais.
 *
 * @param fundamentals - Objeto com campos fundamentalistas
 * @param source - Fonte dos dados
 * @returns Novo objeto com percentuais normalizados
 */
export function normalizeFundamentalPercentages<
  T extends Record<string, number | null | undefined>
>(fundamentals: T, source: PercentageSource = 'gateway'): T {
  const result = { ...fundamentals }

  for (const field of PERCENTAGE_FIELDS) {
    if (field in result) {
      (result as Record<string, number | null | undefined>)[field] =
        normalizePercentage(result[field as keyof T] as number | null | undefined, source)
    }
  }

  return result
}
