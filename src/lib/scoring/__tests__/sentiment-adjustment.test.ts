import { describe, it, expect } from 'vitest'
import { calculateSentimentAdjustment, type NewsSentimentInput } from '../sentiment-adjustment'

function daysAgo(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString()
}

function makeInput(
  articles: { score: number; confidence: number; daysAgo: number }[],
): NewsSentimentInput {
  return {
    ticker: 'TEST3',
    articles: articles.map(a => ({
      sentimentScore: a.score,
      sentimentConfidence: a.confidence,
      date: daysAgo(a.daysAgo),
    })),
  }
}

describe('calculateSentimentAdjustment', () => {
  it('0 artigos → factor 1.0 (sem ajuste)', () => {
    const result = calculateSentimentAdjustment({ ticker: 'TEST3', articles: [] })
    expect(result.factor).toBe(1.0)
    expect(result.reason).toBeNull()
    expect(result.articleCount).toBe(0)
  })

  it('1 artigo → factor 1.0 (mínimo 2 para ajustar)', () => {
    const result = calculateSentimentAdjustment(
      makeInput([{ score: 0.8, confidence: 0.9, daysAgo: 0 }])
    )
    expect(result.factor).toBe(1.0)
    expect(result.reason).toBeNull()
    expect(result.articleCount).toBe(1)
  })

  it('3 artigos positivos (score 0.4) → factor ~1.04', () => {
    const result = calculateSentimentAdjustment(
      makeInput([
        { score: 0.4, confidence: 0.8, daysAgo: 0 },
        { score: 0.4, confidence: 0.8, daysAgo: 1 },
        { score: 0.4, confidence: 0.8, daysAgo: 2 },
      ])
    )
    expect(result.factor).toBeGreaterThan(1.0)
    expect(result.factor).toBeLessThanOrEqual(1.05)
    expect(result.reason).toContain('positivo')
    expect(result.articleCount).toBe(3)
  })

  it('3 artigos negativos (score -0.5) → factor ~0.95', () => {
    const result = calculateSentimentAdjustment(
      makeInput([
        { score: -0.5, confidence: 0.9, daysAgo: 0 },
        { score: -0.5, confidence: 0.9, daysAgo: 1 },
        { score: -0.5, confidence: 0.9, daysAgo: 2 },
      ])
    )
    expect(result.factor).toBeLessThan(1.0)
    expect(result.factor).toBeGreaterThanOrEqual(0.95)
    expect(result.reason).toContain('negativo')
  })

  it('mix positivo/negativo → factor ~1.0 (neutro)', () => {
    const result = calculateSentimentAdjustment(
      makeInput([
        { score: 0.5, confidence: 0.8, daysAgo: 0 },
        { score: -0.5, confidence: 0.8, daysAgo: 0 },
        { score: 0.1, confidence: 0.8, daysAgo: 1 },
        { score: -0.1, confidence: 0.8, daysAgo: 1 },
      ])
    )
    // Avg should be near 0 → within dead zone → factor 1.0
    expect(result.factor).toBe(1.0)
    expect(result.reason).toBeNull()
  })

  it('artigos antigos (> 7 dias) → ignorados', () => {
    const result = calculateSentimentAdjustment(
      makeInput([
        { score: -0.8, confidence: 0.9, daysAgo: 8 },
        { score: -0.8, confidence: 0.9, daysAgo: 10 },
        { score: -0.8, confidence: 0.9, daysAgo: 15 },
      ])
    )
    // Todos filtrados, count = 0
    expect(result.factor).toBe(1.0)
    expect(result.articleCount).toBe(0)
  })

  it('artigos com confiança baixa → peso reduzido', () => {
    // Mesmos scores mas confiança diferente
    const highConf = calculateSentimentAdjustment(
      makeInput([
        { score: 0.5, confidence: 0.9, daysAgo: 0 },
        { score: 0.5, confidence: 0.9, daysAgo: 1 },
      ])
    )
    const lowConf = calculateSentimentAdjustment(
      makeInput([
        { score: 0.5, confidence: 0.2, daysAgo: 0 },
        { score: 0.5, confidence: 0.2, daysAgo: 1 },
      ])
    )
    // High confidence should result in stronger factor
    // Both should be positive, but high conf should be higher
    expect(highConf.factor).toBeGreaterThanOrEqual(lowConf.factor)
  })

  it('factor nunca > 1.05 nem < 0.95', () => {
    // Extremamente positivo
    const pos = calculateSentimentAdjustment(
      makeInput([
        { score: 1.0, confidence: 1.0, daysAgo: 0 },
        { score: 1.0, confidence: 1.0, daysAgo: 0 },
        { score: 1.0, confidence: 1.0, daysAgo: 0 },
      ])
    )
    expect(pos.factor).toBeLessThanOrEqual(1.05)

    // Extremamente negativo
    const neg = calculateSentimentAdjustment(
      makeInput([
        { score: -1.0, confidence: 1.0, daysAgo: 0 },
        { score: -1.0, confidence: 1.0, daysAgo: 0 },
        { score: -1.0, confidence: 1.0, daysAgo: 0 },
      ])
    )
    expect(neg.factor).toBeGreaterThanOrEqual(0.95)
  })

  it('decay temporal: artigos recentes pesam mais que antigos', () => {
    // Artigos recentes negativos, antigos positivos
    const result = calculateSentimentAdjustment(
      makeInput([
        { score: -0.6, confidence: 0.9, daysAgo: 0 },
        { score: -0.6, confidence: 0.9, daysAgo: 1 },
        { score: 0.6, confidence: 0.9, daysAgo: 6 },
      ])
    )
    // Recentes (peso alto) são negativos → resultado deve ser negativo
    expect(result.avgSentiment).toBeLessThan(0)
    expect(result.factor).toBeLessThan(1.0)
  })
})
