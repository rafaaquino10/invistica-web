import { describe, it, expect } from 'vitest'
import { calculateLensScores } from '../lens-calculator'
import { calcularAqScore, type DadosFundamentalistas } from '../iq-score'
import { LENSES } from '../lenses'

// ─── Test Helpers ──────────────────────────────────────────────

function makeDados(overrides: Partial<DadosFundamentalistas> = {}): DadosFundamentalistas {
  return {
    ticker: 'TEST4',
    cotacao: 25,
    P_L: 10,
    P_VP: 1.5,
    PSR: 1.0,
    P_EBIT: 8,
    EV_EBIT: 10,
    EV_EBITDA: 7,
    ROIC: 18,
    ROE: 20,
    MRG_EBIT: 25,
    MRG_LIQUIDA: 15,
    LIQ_CORRENTE: 1.8,
    DIV_BRUT_PATRIM: 0.5,
    P_CAP_GIRO: 5,
    P_ATIV_CIRC_LIQ: 2,
    P_ATIVO: 0.6,
    PATRIM_LIQUIDO: 5_000_000_000,
    DIV_YIELD: 6,
    DIV_EBITDA: 1.0,
    PAYOUT: 40,
    CRESC_REC_5A: 15,
    CRESC_LUCRO_5A: 20,
    LIQ_2MESES: 10_000_000,
    MARKET_CAP: 20_000_000_000,
    SETOR: 'Outros',
    ...overrides,
  }
}

// ─── Tests ──────────────────────────────────────────────────────

describe('calculateLensScores', () => {
  it('returns scores for all 5 fundamental lenses + null momentum', () => {
    const dados = makeDados()
    const scoreResult = calcularAqScore(dados)
    const lenses = calculateLensScores(scoreResult)

    expect(lenses.general).toBe(scoreResult.score)
    expect(typeof lenses.value).toBe('number')
    expect(typeof lenses.dividends).toBe('number')
    expect(typeof lenses.growth).toBe('number')
    expect(typeof lenses.defensive).toBe('number')
    expect(lenses.momentum).toBeNull()
  })

  it('all lens scores are between 0 and 100', () => {
    const dados = makeDados()
    const scoreResult = calcularAqScore(dados)
    const lenses = calculateLensScores(scoreResult)

    expect(lenses.general).toBeGreaterThanOrEqual(0)
    expect(lenses.general).toBeLessThanOrEqual(100)
    expect(lenses.value).toBeGreaterThanOrEqual(0)
    expect(lenses.value).toBeLessThanOrEqual(100)
    expect(lenses.dividends).toBeGreaterThanOrEqual(0)
    expect(lenses.dividends).toBeLessThanOrEqual(100)
    expect(lenses.growth).toBeGreaterThanOrEqual(0)
    expect(lenses.growth).toBeLessThanOrEqual(100)
    expect(lenses.defensive).toBeGreaterThanOrEqual(0)
    expect(lenses.defensive).toBeLessThanOrEqual(100)
  })

  it('each lens produces different scores for the same asset', () => {
    const dados = makeDados()
    const scoreResult = calcularAqScore(dados)
    const lenses = calculateLensScores(scoreResult)

    // With different weights, at least some lenses should differ
    const scores = [lenses.general, lenses.value, lenses.dividends, lenses.growth, lenses.defensive]
    const unique = new Set(scores)
    expect(unique.size).toBeGreaterThan(1)
  })

  it('high DY stock scores higher in dividends lens than growth lens', () => {
    // BBAS3-like: high DY, low growth
    const dados = makeDados({
      ticker: 'BBAS3',
      DIV_YIELD: 9,
      PAYOUT: 50,
      CRESC_REC_5A: 3,
      CRESC_LUCRO_5A: 2,
      SETOR: 'Bancos',
    })
    const scoreResult = calcularAqScore(dados)
    const lenses = calculateLensScores(scoreResult)

    expect(lenses.dividends).toBeGreaterThan(lenses.growth)
  })

  it('high growth stock scores higher in growth lens than value lens', () => {
    // WEGE3-like: high growth, premium valuation
    const dados = makeDados({
      ticker: 'WEGE3',
      P_L: 30,
      P_VP: 8,
      EV_EBITDA: 20,
      DIV_YIELD: 1.5,
      CRESC_REC_5A: 22,
      CRESC_LUCRO_5A: 25,
      SETOR: 'Bens Industriais',
    })
    const scoreResult = calcularAqScore(dados)
    const lenses = calculateLensScores(scoreResult)

    expect(lenses.growth).toBeGreaterThan(lenses.value)
  })

  it('high valuation + low risk stock scores high in value lens', () => {
    // Cheap, safe stock
    const dados = makeDados({
      P_L: 6,
      P_VP: 0.8,
      EV_EBITDA: 4,
      LIQ_CORRENTE: 2.5,
      DIV_BRUT_PATRIM: 0.2,
    })
    const scoreResult = calcularAqScore(dados)
    const lenses = calculateLensScores(scoreResult)

    // Value lens heavily weights valuation (40%) — should be high
    expect(lenses.value).toBeGreaterThan(60)
  })

  it('applies same caps (patrimonio negativo) to all lenses', () => {
    const dados = makeDados({
      PATRIM_LIQUIDO: -1_000_000,
    })
    const scoreResult = calcularAqScore(dados)
    const lenses = calculateLensScores(scoreResult)

    // All lenses should be capped at 25
    expect(lenses.general).toBeLessThanOrEqual(25)
    expect(lenses.value).toBeLessThanOrEqual(25)
    expect(lenses.dividends).toBeLessThanOrEqual(25)
    expect(lenses.growth).toBeLessThanOrEqual(25)
    expect(lenses.defensive).toBeLessThanOrEqual(25)
  })

  it('defensive lens scores higher for low-risk, dividend-paying stock', () => {
    // Utility-like: safe, steady dividends
    const dados = makeDados({
      SETOR: 'Energia Elétrica',
      LIQ_CORRENTE: 2.0,
      DIV_BRUT_PATRIM: 0.3,
      DIV_YIELD: 7,
      CRESC_REC_5A: 5,
    })
    const scoreResult = calcularAqScore(dados)
    const lenses = calculateLensScores(scoreResult)

    // Defensive heavily weights risk (35%) + dividends (25%)
    expect(lenses.defensive).toBeGreaterThan(lenses.growth)
  })

  it('sum of pillar weights equals 100 for each lens', () => {
    for (const lens of LENSES) {
      const sum = lens.pillarWeights.valuation + lens.pillarWeights.quality +
        lens.pillarWeights.risk + lens.pillarWeights.dividends + lens.pillarWeights.growth
      expect(sum).toBe(lens.id === 'momentum' ? 50 : 100)
    }
  })
})
