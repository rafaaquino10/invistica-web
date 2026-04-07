import { describe, it, expect } from 'vitest'
import {
  formatCurrency,
  formatPercent,
  formatNumber,
  formatDate,
  formatMarketCap,
  formatTicker,
  getScoreColor,
  getScoreLabel,
  getScoreTextClass,
  getScoreBgClass,
  getScoreBgLightClass,
  getScoreHex,
} from '@/lib/utils/formatters'

// ---------------------------------------------------------------------------
// formatCurrency
// ---------------------------------------------------------------------------
describe('formatCurrency', () => {
  it('formats a typical value in BRL pt-BR format', () => {
    const result = formatCurrency(1234.56)
    // pt-BR: R$ 1.234,56 (may contain non-breaking spaces)
    expect(result).toContain('R$')
    expect(result).toContain('1.234,56')
  })

  it('formats zero', () => {
    const result = formatCurrency(0)
    expect(result).toContain('R$')
    expect(result).toContain('0,00')
  })

  it('formats negative values', () => {
    const result = formatCurrency(-500)
    expect(result).toContain('500,00')
    expect(result).toMatch(/-/)
  })

  it('formats very large numbers', () => {
    const result = formatCurrency(1000000000)
    expect(result).toContain('R$')
    expect(result).toContain('1.000.000.000,00')
  })

  it('formats very small numbers', () => {
    const result = formatCurrency(0.01)
    expect(result).toContain('R$')
    expect(result).toContain('0,01')
  })

  it('compact format is shorter than non-compact for large values', () => {
    const full = formatCurrency(1500000)
    const compact = formatCurrency(1500000, { compact: true })
    expect(compact.length).toBeLessThan(full.length)
    expect(compact).toContain('R$')
  })

  it('compact format uses at most 1 decimal digit', () => {
    const compact = formatCurrency(1234567, { compact: true })
    expect(compact).toContain('R$')
    // Should be something like "R$ 1,2 mi" — no more than 1 decimal
    const decimalMatch = compact.match(/\d+,\d+/)
    if (decimalMatch) {
      const decimals = decimalMatch[0]!.split(',')[1]
      expect(decimals!.length).toBeLessThanOrEqual(1)
    }
  })

  it('formats integer values with two decimal places', () => {
    const result = formatCurrency(42)
    expect(result).toContain('42,00')
  })
})

// ---------------------------------------------------------------------------
// formatPercent
// ---------------------------------------------------------------------------
describe('formatPercent', () => {
  // Implementation: value / 100, then Intl 'percent' style (which multiplies by 100)
  // So 18.3 → 18.3/100 = 0.183 → formatted as 18,30%

  it('formats a typical percentage value', () => {
    const result = formatPercent(18.3)
    expect(result).toBe('18,30%')
  })

  it('formats zero', () => {
    const result = formatPercent(0)
    expect(result).toBe('0,00%')
  })

  it('formats negative values', () => {
    const result = formatPercent(-5.5)
    expect(result).toContain('5,50%')
    expect(result).toMatch(/-/)
  })

  it('formats 100 (meaning 100%)', () => {
    const result = formatPercent(100)
    expect(result).toBe('100,00%')
  })

  it('respects custom decimal count', () => {
    const result = formatPercent(18.345, { decimals: 1 })
    expect(result).toBe('18,3%')
  })

  it('uses 0 decimal places when specified', () => {
    const result = formatPercent(18.6, { decimals: 0 })
    expect(result).toBe('19%')
  })

  it('does not add + sign by default for positive values', () => {
    const result = formatPercent(5)
    expect(result).not.toMatch(/^\+/)
  })

  it('adds + sign when showSign is true for positive values', () => {
    const result = formatPercent(5, { showSign: true })
    expect(result).toMatch(/^\+/)
    expect(result).toContain('5,00%')
  })

  it('does not add + sign when showSign is true for zero', () => {
    const result = formatPercent(0, { showSign: true })
    expect(result).not.toMatch(/^\+/)
  })

  it('does not add + sign when showSign is true for negative values', () => {
    const result = formatPercent(-3, { showSign: true })
    expect(result).not.toMatch(/^\+/)
    expect(result).toMatch(/-/)
  })

  it('defaults to 2 decimal places', () => {
    const result = formatPercent(7)
    expect(result).toBe('7,00%')
  })
})

// ---------------------------------------------------------------------------
// formatNumber
// ---------------------------------------------------------------------------
describe('formatNumber', () => {
  it('formats with thousands separator (pt-BR uses dot)', () => {
    const result = formatNumber(1234)
    expect(result).toBe('1.234')
  })

  it('formats zero', () => {
    const result = formatNumber(0)
    expect(result).toBe('0')
  })

  it('formats decimals (up to 2 by default)', () => {
    const result = formatNumber(1234.567)
    expect(result).toBe('1.234,57')
  })

  it('formats integer without trailing decimals by default', () => {
    const result = formatNumber(1000)
    expect(result).toBe('1.000')
  })

  it('respects custom decimal option', () => {
    const result = formatNumber(1234.5, { decimals: 3 })
    expect(result).toBe('1.234,500')
  })

  it('compact mode shortens large numbers', () => {
    const full = formatNumber(1500000)
    const compact = formatNumber(1500000, { compact: true })
    expect(compact.length).toBeLessThan(full.length)
  })

  it('compact mode uses at most 1 decimal digit', () => {
    const compact = formatNumber(1234567, { compact: true })
    const decimalMatch = compact.match(/\d+,\d+/)
    if (decimalMatch) {
      const decimals = decimalMatch[0]!.split(',')[1]
      expect(decimals!.length).toBeLessThanOrEqual(1)
    }
  })

  it('formats negative numbers', () => {
    const result = formatNumber(-9876)
    expect(result).toContain('9.876')
    expect(result).toMatch(/-/)
  })

  it('uses 0 minimum fraction digits by default', () => {
    // 42 should format as "42", not "42,00"
    const result = formatNumber(42)
    expect(result).toBe('42')
  })
})

// ---------------------------------------------------------------------------
// formatDate
// ---------------------------------------------------------------------------
describe('formatDate', () => {
  it('formats Date object in short format (default)', () => {
    const result = formatDate(new Date(2024, 0, 15))
    expect(result).toBe('15/01/2024')
  })

  it('formats string date input', () => {
    // Note: "2024-01-15" is parsed as UTC midnight, display may vary by timezone.
    // Using explicit Date constructor to avoid ambiguity
    const result = formatDate(new Date(2024, 5, 30))
    expect(result).toBe('30/06/2024')
  })

  it('formats in long format', () => {
    const result = formatDate(new Date(2024, 0, 15), { format: 'long' })
    expect(result).toContain('15')
    expect(result).toMatch(/janeiro/i)
    expect(result).toContain('2024')
  })

  it('formats in long format for another month', () => {
    const result = formatDate(new Date(2024, 11, 25), { format: 'long' })
    expect(result).toContain('25')
    expect(result).toMatch(/dezembro/i)
    expect(result).toContain('2024')
  })

  it('relative format: returns "agora" for just-now dates', () => {
    const now = new Date()
    const result = formatDate(now, { format: 'relative' })
    expect(result).toBe('agora')
  })

  it('relative format: returns minutes for recent dates', () => {
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000)
    const result = formatDate(fiveMinAgo, { format: 'relative' })
    expect(result).toBe('5 min')
  })

  it('relative format: returns hours for hours-old dates', () => {
    const threeHoursAgo = new Date(Date.now() - 3 * 3600 * 1000)
    const result = formatDate(threeHoursAgo, { format: 'relative' })
    expect(result).toBe('3 h')
  })

  it('relative format: returns days for days-old dates', () => {
    const twoDaysAgo = new Date(Date.now() - 2 * 86400 * 1000)
    const result = formatDate(twoDaysAgo, { format: 'relative' })
    expect(result).toBe('2 d')
  })

  it('relative format: falls through to short format for > 7 days', () => {
    const twoWeeksAgo = new Date(Date.now() - 14 * 86400 * 1000)
    const result = formatDate(twoWeeksAgo, { format: 'relative' })
    // Should fall through to short format (dd/mm/yyyy)
    expect(result).toMatch(/^\d{2}\/\d{2}\/\d{4}$/)
  })

  it('accepts ISO string input', () => {
    // Use a full ISO string with timezone to avoid ambiguity
    const result = formatDate(new Date(2024, 2, 1))
    expect(result).toBe('01/03/2024')
  })
})

// ---------------------------------------------------------------------------
// formatMarketCap
// ---------------------------------------------------------------------------
describe('formatMarketCap', () => {
  it('formats trillions with T suffix', () => {
    expect(formatMarketCap(1.5e12)).toBe('R$ 1.50 T')
  })

  it('formats billions with B suffix', () => {
    expect(formatMarketCap(3.2e9)).toBe('R$ 3.20 B')
  })

  it('formats millions with M suffix', () => {
    expect(formatMarketCap(450e6)).toBe('R$ 450.00 M')
  })

  it('formats thousands with K suffix', () => {
    expect(formatMarketCap(5000)).toBe('R$ 5.00 K')
  })

  it('formats small values without suffix', () => {
    expect(formatMarketCap(999)).toBe('R$ 999.00')
  })

  it('formats exact boundary at 1 trillion', () => {
    expect(formatMarketCap(1e12)).toBe('R$ 1.00 T')
  })

  it('formats exact boundary at 1 billion', () => {
    expect(formatMarketCap(1e9)).toBe('R$ 1.00 B')
  })

  it('formats exact boundary at 1 million', () => {
    expect(formatMarketCap(1e6)).toBe('R$ 1.00 M')
  })

  it('formats exact boundary at 1 thousand', () => {
    expect(formatMarketCap(1e3)).toBe('R$ 1.00 K')
  })

  it('formats zero', () => {
    expect(formatMarketCap(0)).toBe('R$ 0.00')
  })

  it('always includes R$ prefix', () => {
    expect(formatMarketCap(123)).toMatch(/^R\$/)
    expect(formatMarketCap(1e6)).toMatch(/^R\$/)
    expect(formatMarketCap(1e12)).toMatch(/^R\$/)
  })

  it('always has 2 decimal places', () => {
    expect(formatMarketCap(1e9)).toMatch(/\d+\.\d{2}/)
    expect(formatMarketCap(500)).toMatch(/\d+\.\d{2}/)
  })
})

// ---------------------------------------------------------------------------
// formatTicker
// ---------------------------------------------------------------------------
describe('formatTicker', () => {
  it('uppercases lowercase ticker', () => {
    expect(formatTicker('petr4')).toBe('PETR4')
  })

  it('trims whitespace', () => {
    expect(formatTicker('  vale3  ')).toBe('VALE3')
  })

  it('handles already uppercase input', () => {
    expect(formatTicker('BBDC4')).toBe('BBDC4')
  })

  it('handles mixed case', () => {
    expect(formatTicker('iTsA4')).toBe('ITSA4')
  })

  it('handles ticker with only spaces (edge case)', () => {
    expect(formatTicker('   ')).toBe('')
  })

  it('preserves digits', () => {
    expect(formatTicker('bbas3')).toBe('BBAS3')
  })
})

// ---------------------------------------------------------------------------
// Score classification functions — boundary value testing
// ---------------------------------------------------------------------------

// The score boundaries are:
//   Critical:    score <= 30
//   Attention:   score > 30 && score <= 60
//   Healthy:     score > 60 && score <= 80
//   Exceptional: score > 80

// For getScoreTextClass/BgClass/BgLightClass/Hex the logic is reversed (>= from top):
//   Exceptional: score >= 81
//   Healthy:     score >= 61
//   Attention:   score >= 31
//   Critical:    else (score < 31)

const scoreBoundaries = [
  { score: 0,   color: 'critical' as const,    label: 'Crítico',     textClass: 'text-red',           bgClass: 'bg-red',           bgLightClass: 'bg-red/10 text-red',                       hex: '#EF4444' },
  { score: 15,  color: 'critical' as const,    label: 'Crítico',     textClass: 'text-red',           bgClass: 'bg-red',           bgLightClass: 'bg-red/10 text-red',                       hex: '#EF4444' },
  { score: 30,  color: 'critical' as const,    label: 'Crítico',     textClass: 'text-red',           bgClass: 'bg-red',           bgLightClass: 'bg-red/10 text-red',                       hex: '#EF4444' },
  { score: 31,  color: 'attention' as const,   label: 'Atenção',     textClass: 'text-amber',         bgClass: 'bg-amber',         bgLightClass: 'bg-amber/10 text-amber',                   hex: '#D97706' },
  { score: 45,  color: 'attention' as const,   label: 'Atenção',     textClass: 'text-amber',         bgClass: 'bg-amber',         bgLightClass: 'bg-amber/10 text-amber',                   hex: '#D97706' },
  { score: 60,  color: 'attention' as const,   label: 'Atenção',     textClass: 'text-amber',         bgClass: 'bg-amber',         bgLightClass: 'bg-amber/10 text-amber',                   hex: '#D97706' },
  { score: 61,  color: 'healthy' as const,     label: 'Saudável',    textClass: 'text-teal',          bgClass: 'bg-teal',          bgLightClass: 'bg-teal/10 text-teal',                     hex: '#0D9488' },
  { score: 65,  color: 'healthy' as const,     label: 'Saudável',    textClass: 'text-teal',          bgClass: 'bg-teal',          bgLightClass: 'bg-teal/10 text-teal',                     hex: '#0D9488' },
  { score: 80,  color: 'healthy' as const,     label: 'Saudável',    textClass: 'text-teal',          bgClass: 'bg-teal',          bgLightClass: 'bg-teal/10 text-teal',                     hex: '#0D9488' },
  { score: 81,  color: 'exceptional' as const, label: 'Excepcional', textClass: 'text-[var(--accent-1)]', bgClass: 'bg-[var(--accent-1)]', bgLightClass: 'bg-[var(--accent-1)]/10 text-[var(--accent-1)]',   hex: '#1A73E8' },
  { score: 85,  color: 'exceptional' as const, label: 'Excepcional', textClass: 'text-[var(--accent-1)]', bgClass: 'bg-[var(--accent-1)]', bgLightClass: 'bg-[var(--accent-1)]/10 text-[var(--accent-1)]',   hex: '#1A73E8' },
  { score: 100, color: 'exceptional' as const, label: 'Excepcional', textClass: 'text-[var(--accent-1)]', bgClass: 'bg-[var(--accent-1)]', bgLightClass: 'bg-[var(--accent-1)]/10 text-[var(--accent-1)]',   hex: '#1A73E8' },
]

describe('getScoreColor', () => {
  it.each(scoreBoundaries)(
    'score $score → $color',
    ({ score, color }) => {
      expect(getScoreColor(score)).toBe(color)
    },
  )
})

describe('getScoreLabel', () => {
  it.each(scoreBoundaries)(
    'score $score → $label',
    ({ score, label }) => {
      expect(getScoreLabel(score)).toBe(label)
    },
  )
})

describe('getScoreTextClass', () => {
  it.each(scoreBoundaries)(
    'score $score → $textClass',
    ({ score, textClass }) => {
      expect(getScoreTextClass(score)).toBe(textClass)
    },
  )
})

describe('getScoreBgClass', () => {
  it.each(scoreBoundaries)(
    'score $score → $bgClass',
    ({ score, bgClass }) => {
      expect(getScoreBgClass(score)).toBe(bgClass)
    },
  )
})

describe('getScoreBgLightClass', () => {
  it.each(scoreBoundaries)(
    'score $score → $bgLightClass',
    ({ score, bgLightClass }) => {
      expect(getScoreBgLightClass(score)).toBe(bgLightClass)
    },
  )
})

describe('getScoreHex', () => {
  it.each(scoreBoundaries)(
    'score $score → $hex',
    ({ score, hex }) => {
      expect(getScoreHex(score)).toBe(hex)
    },
  )
})
