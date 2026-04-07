import { describe, it, expect } from 'vitest'

// Test the insight generation logic extracted from focus-client.
// We test the pure functions, not the network fetches.

interface FocusExpectation {
  indicator: string
  referenceDate: string
  median: number
  previous: number | null
  date: string
  delta: number | null
}

/**
 * Mirror of the generateInsight function from focus-client.ts
 * for testability without network dependencies.
 */
function generateInsight(focus: {
  selic: FocusExpectation | null
  ipca: FocusExpectation | null
  pib: FocusExpectation | null
  cambio: FocusExpectation | null
}): string | null {
  const insights: string[] = []

  if (focus.selic?.delta != null && Math.abs(focus.selic.delta) >= 0.25) {
    const direction = focus.selic.delta > 0 ? 'elevou' : 'reduziu'
    const impact = focus.selic.delta < 0 ? 'positivo para renda variável' : 'pressão sobre renda variável'
    insights.push(
      `Mercado ${direction} projeção da Selic de ${focus.selic.previous?.toFixed(2)}% para ${focus.selic.median.toFixed(2)}% — ${impact}`,
    )
  }

  if (focus.ipca?.delta != null && Math.abs(focus.ipca.delta) >= 0.1) {
    const direction = focus.ipca.delta > 0 ? 'subiu' : 'caiu'
    insights.push(
      `Projeção do IPCA ${direction}: ${focus.ipca.previous?.toFixed(2)}% → ${focus.ipca.median.toFixed(2)}%`,
    )
  }

  if (focus.pib?.delta != null && Math.abs(focus.pib.delta) >= 0.1) {
    const direction = focus.pib.delta > 0 ? 'revisou para cima' : 'revisou para baixo'
    insights.push(
      `Mercado ${direction} projeção do PIB: ${focus.pib.previous?.toFixed(2)}% → ${focus.pib.median.toFixed(2)}%`,
    )
  }

  if (focus.cambio?.delta != null && Math.abs(focus.cambio.delta) >= 0.05) {
    const direction = focus.cambio.delta > 0 ? 'subiu' : 'caiu'
    insights.push(
      `Projeção do câmbio USD/BRL ${direction}: R$${focus.cambio.previous?.toFixed(2)} → R$${focus.cambio.median.toFixed(2)}`,
    )
  }

  return insights.length > 0 ? insights.join('. ') : null
}

function makeExpectation(overrides: Partial<FocusExpectation> = {}): FocusExpectation {
  return {
    indicator: 'SELIC',
    referenceDate: '2026',
    median: 12.0,
    previous: 12.0,
    date: '2026-02-15',
    delta: 0,
    ...overrides,
  }
}

describe('Focus insight generation', () => {
  it('generates insight when SELIC changes >= 0.25pp', () => {
    const result = generateInsight({
      selic: makeExpectation({ indicator: 'SELIC', median: 11.5, previous: 12.0, delta: -0.5 }),
      ipca: null,
      pib: null,
      cambio: null,
    })
    expect(result).not.toBeNull()
    expect(result).toContain('reduziu')
    expect(result).toContain('Selic')
    expect(result).toContain('positivo para renda variável')
  })

  it('generates insight when SELIC increases', () => {
    const result = generateInsight({
      selic: makeExpectation({ median: 12.5, previous: 12.0, delta: 0.5 }),
      ipca: null,
      pib: null,
      cambio: null,
    })
    expect(result).toContain('elevou')
    expect(result).toContain('pressão sobre renda variável')
  })

  it('returns null when no significant changes', () => {
    const result = generateInsight({
      selic: makeExpectation({ median: 12.1, previous: 12.0, delta: 0.1 }),
      ipca: makeExpectation({ indicator: 'IPCA', median: 4.01, previous: 4.0, delta: 0.01 }),
      pib: null,
      cambio: null,
    })
    expect(result).toBeNull()
  })

  it('combines multiple significant changes', () => {
    const result = generateInsight({
      selic: makeExpectation({ median: 11.5, previous: 12.0, delta: -0.5 }),
      ipca: makeExpectation({ indicator: 'IPCA', median: 3.8, previous: 4.0, delta: -0.2 }),
      pib: makeExpectation({ indicator: 'PIB', median: 2.5, previous: 2.2, delta: 0.3 }),
      cambio: makeExpectation({ indicator: 'Câmbio', median: 5.3, previous: 5.4, delta: -0.1 }),
    })
    expect(result).toContain('Selic')
    expect(result).toContain('IPCA')
    expect(result).toContain('PIB')
    expect(result).toContain('câmbio')
  })

  it('handles IPCA increase', () => {
    const result = generateInsight({
      selic: null,
      ipca: makeExpectation({ indicator: 'IPCA', median: 4.5, previous: 4.2, delta: 0.3 }),
      pib: null,
      cambio: null,
    })
    expect(result).toContain('subiu')
    expect(result).toContain('IPCA')
  })

  it('handles PIB revision downward', () => {
    const result = generateInsight({
      selic: null,
      ipca: null,
      pib: makeExpectation({ indicator: 'PIB', median: 1.8, previous: 2.0, delta: -0.2 }),
      cambio: null,
    })
    expect(result).toContain('revisou para baixo')
    expect(result).toContain('PIB')
  })

  it('returns null when all expectations are null', () => {
    const result = generateInsight({
      selic: null,
      ipca: null,
      pib: null,
      cambio: null,
    })
    expect(result).toBeNull()
  })

  it('handles delta computation for exchange rate', () => {
    const result = generateInsight({
      selic: null,
      ipca: null,
      pib: null,
      cambio: makeExpectation({ indicator: 'Câmbio', median: 5.5, previous: 5.3, delta: 0.2 }),
    })
    expect(result).toContain('subiu')
    expect(result).toContain('R$5.30')
    expect(result).toContain('R$5.50')
  })
})
