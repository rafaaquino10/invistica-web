// ===========================================
// Auxiliares de Formatação de Moeda
// ===========================================

export function formatCurrency(value: number, options?: { compact?: boolean; showCents?: boolean }): string {
  if (options?.compact && value >= 1000000) {
    return `R$ ${(value / 1000000).toFixed(1).replace('.', ',')}M`
  }
  if (options?.compact && value >= 1000) {
    return `R$ ${(value / 1000).toFixed(0)}k`
  }

  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: options?.showCents ? 2 : 0,
    maximumFractionDigits: options?.showCents ? 2 : 0,
  }).format(value)
}

export function parseCurrencyInput(value: string): string {
  return value.replace(/\D/g, '')
}

export function formatCurrencyInput(value: string): string {
  const numericValue = value.replace(/\D/g, '')
  if (!numericValue) return ''
  const number = parseInt(numericValue)
  return new Intl.NumberFormat('pt-BR').format(number)
}
