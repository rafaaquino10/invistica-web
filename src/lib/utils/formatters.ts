/**
 * Format a number as Brazilian Real currency
 */
export function formatCurrency(value: number, options?: { compact?: boolean }): string {
  if (options?.compact) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value)
  }

  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

/**
 * Format a number as percentage
 */
export function formatPercent(value: number, options?: { decimals?: number; showSign?: boolean }): string {
  const decimals = options?.decimals ?? 2
  const formatted = new Intl.NumberFormat('pt-BR', {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value / 100)

  if (options?.showSign && value > 0) {
    return `+${formatted}`
  }

  return formatted
}

/**
 * Format a number with thousands separator
 */
export function formatNumber(value: number, options?: { decimals?: number; compact?: boolean }): string {
  if (options?.compact) {
    return new Intl.NumberFormat('pt-BR', {
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value)
  }

  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: options?.decimals ?? 0,
    maximumFractionDigits: options?.decimals ?? 2,
  }).format(value)
}

/**
 * Format a date in Brazilian format
 */
export function formatDate(date: Date | string, options?: { format?: 'short' | 'long' | 'relative' }): string {
  const d = typeof date === 'string' ? new Date(date) : date

  if (options?.format === 'relative') {
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000)

    if (diffInSeconds < 60) return 'agora'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} min`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} h`
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} d`
  }

  if (options?.format === 'long') {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).format(d)
  }

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d)
}

/**
 * Format market cap or large numbers with appropriate suffix
 */
export function formatMarketCap(value: number): string {
  if (value >= 1e12) return `R$ ${(value / 1e12).toFixed(2)} T`
  if (value >= 1e9) return `R$ ${(value / 1e9).toFixed(2)} B`
  if (value >= 1e6) return `R$ ${(value / 1e6).toFixed(2)} M`
  if (value >= 1e3) return `R$ ${(value / 1e3).toFixed(2)} K`
  return `R$ ${value.toFixed(2)}`
}

/**
 * Format volume with appropriate suffix (no currency prefix)
 */
export function formatVolume(value: number): string {
  if (value >= 1e9) return `${(value / 1e9).toFixed(1)}B`
  if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`
  if (value >= 1e3) return `${(value / 1e3).toFixed(0)}K`
  return String(value)
}

/**
 * Format ticker symbol (ensure uppercase)
 */
export function formatTicker(ticker: string): string {
  return ticker.toUpperCase().trim()
}

/**
 * Format IQ-Score with color indicator
 */
export function getScoreColor(score: number): 'critical' | 'attention' | 'healthy' | 'exceptional' {
  if (score <= 30) return 'critical'
  if (score <= 60) return 'attention'
  if (score <= 80) return 'healthy'
  return 'exceptional'
}

/**
 * Get score label in Portuguese
 */
export function getScoreLabel(score: number): string {
  if (score <= 30) return 'Crítico'
  if (score <= 60) return 'Atenção'
  if (score <= 80) return 'Saudável'
  return 'Excepcional'
}

/**
 * Get Tailwind text color class for IQ-Score
 */
export function getScoreTextClass(score: number): string {
  if (score >= 81) return 'text-[var(--accent-1)]'
  if (score >= 61) return 'text-teal'
  if (score >= 31) return 'text-amber'
  return 'text-red'
}

/**
 * Get Tailwind background color class for IQ-Score
 */
export function getScoreBgClass(score: number): string {
  if (score >= 81) return 'bg-[var(--accent-1)]'
  if (score >= 61) return 'bg-teal'
  if (score >= 31) return 'bg-amber'
  return 'bg-red'
}

/**
 * Get Tailwind light background + text color classes for IQ-Score badges
 */
export function getScoreBgLightClass(score: number): string {
  if (score >= 81) return 'bg-[var(--accent-1)]/10 text-[var(--accent-1)]'
  if (score >= 61) return 'bg-teal/10 text-teal'
  if (score >= 31) return 'bg-amber/10 text-amber'
  return 'bg-red/10 text-red'
}

/**
 * Get hex color string for IQ-Score (for inline styles, SVGs, charts)
 */
export function getScoreHex(score: number): string {
  if (score >= 81) return '#1A73E8'
  if (score >= 61) return '#0D9488'
  if (score >= 31) return '#D97706'
  return '#EF4444'
}
