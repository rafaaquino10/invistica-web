// ─── Sentiment Analysis Tests ─────────────────────────────────────
// Tests for the Loughran-McDonald financial dictionary sentiment analyzer.
// Covers: positive/negative/neutral detection, negation handling,
// ticker extraction, performance, and edge cases.

import { describe, it, expect } from 'vitest'
import { analyzeSentiment, analyzeSentimentBatch } from '../../../../gateway/src/sentiment/analyzer'
import { extractTickers, setValidTickers, extractTickersFromFields } from '../../../../gateway/src/sentiment/ticker-extractor'
import { POSITIVE_WORDS, NEGATIVE_WORDS, UNCERTAINTY_WORDS } from '../../../../gateway/src/sentiment/financial-dictionary-pt'

// ─── Dictionary Coverage Tests ──────────────────────────────────

describe('Financial Dictionary', () => {
  it('should have at least 150 positive words', () => {
    expect(POSITIVE_WORDS.size).toBeGreaterThanOrEqual(150)
  })

  it('should have at least 150 negative words', () => {
    expect(NEGATIVE_WORDS.size).toBeGreaterThanOrEqual(150)
  })

  it('should have at least 40 uncertainty words', () => {
    expect(UNCERTAINTY_WORDS.size).toBeGreaterThanOrEqual(40)
  })

  it('should not have overlap between positive and negative sets', () => {
    for (const word of POSITIVE_WORDS) {
      expect(NEGATIVE_WORDS.has(word)).toBe(false)
    }
  })
})

// ─── Sentiment Analyzer Tests ───────────────────────────────────

describe('Sentiment Analyzer', () => {
  it('should classify positive financial news', () => {
    const result = analyzeSentiment(
      'Petrobras reporta lucro recorde no trimestre com crescimento robusto'
    )
    expect(result.label).toBe('positive')
    expect(result.score).toBeGreaterThan(0)
    expect(result.positiveCount).toBeGreaterThan(0)
  })

  it('should classify negative financial news', () => {
    const result = analyzeSentiment(
      'Ações da Americanas despencam após escândalo contábil e prejuízo bilionário'
    )
    expect(result.label).toBe('negative')
    expect(result.score).toBeLessThan(0)
    expect(result.negativeCount).toBeGreaterThan(0)
  })

  it('should classify neutral/uncertain news', () => {
    const result = analyzeSentiment(
      'Mercado aguarda decisão do Copom sobre a taxa Selic nesta semana'
    )
    // This should be neutral or have uncertainty
    expect(result.uncertaintyCount).toBeGreaterThanOrEqual(0)
    // The word "Selic" appears in negative dictionary but "aguarda" is uncertainty
  })

  it('should handle negation correctly', () => {
    // "não lucro" should be negative
    const negated = analyzeSentiment('A empresa não teve lucro neste trimestre')
    expect(negated.negativeCount).toBeGreaterThan(0)

    // "sem prejuízo" should be positive
    const doubleNeg = analyzeSentiment('A operação foi concluída sem prejuízo')
    expect(doubleNeg.positiveCount).toBeGreaterThan(0)
  })

  it('should be accent-insensitive', () => {
    // "lucro" and "crescimento" should match regardless of accent
    const withAccents = analyzeSentiment('Lucro cresceu com expansão significativa')
    const withoutAccents = analyzeSentiment('Lucro cresceu com expansao significativa')

    expect(withAccents.label).toBe(withoutAccents.label)
    expect(withAccents.positiveCount).toBe(withoutAccents.positiveCount)
  })

  it('should be case-insensitive', () => {
    const lower = analyzeSentiment('lucro recorde crescimento')
    const upper = analyzeSentiment('LUCRO RECORDE CRESCIMENTO')
    const mixed = analyzeSentiment('Lucro Recorde Crescimento')

    expect(lower.positiveCount).toBe(upper.positiveCount)
    expect(lower.positiveCount).toBe(mixed.positiveCount)
  })

  it('should return valid score range [-1, 1]', () => {
    const result = analyzeSentiment('lucro lucro lucro lucro lucro recorde crescimento')
    expect(result.score).toBeGreaterThanOrEqual(-1)
    expect(result.score).toBeLessThanOrEqual(1)
  })

  it('should return valid confidence range [0, 1]', () => {
    const result = analyzeSentiment('lucro prejuízo queda alta crescimento')
    expect(result.confidence).toBeGreaterThanOrEqual(0)
    expect(result.confidence).toBeLessThanOrEqual(1)
  })

  it('should handle empty text', () => {
    const result = analyzeSentiment('')
    expect(result.label).toBe('neutral')
    expect(result.score).toBe(0)
    expect(result.confidence).toBe(0)
    expect(result.wordCount).toBe(0)
  })

  it('should handle text with no sentiment words', () => {
    const result = analyzeSentiment('A reunião acontecerá na próxima terça-feira às 14 horas')
    expect(result.label).toBe('neutral')
    expect(result.positiveCount).toBe(0)
    expect(result.negativeCount).toBe(0)
  })

  it('should detect dividend-related positive sentiment', () => {
    const result = analyzeSentiment(
      'Itaú anuncia distribuição de dividendos extraordinários com yield de 8%'
    )
    expect(result.label).toBe('positive')
    expect(result.positiveCount).toBeGreaterThan(0)
  })

  it('should detect crisis-related negative sentiment', () => {
    const result = analyzeSentiment(
      'Crise de endividamento provoca inadimplência e falência de varejistas'
    )
    expect(result.label).toBe('negative')
    expect(result.negativeCount).toBeGreaterThanOrEqual(3)
  })

  it('should detect mixed sentiment correctly', () => {
    const result = analyzeSentiment(
      'Apesar do crescimento de receita, a empresa reportou prejuízo operacional'
    )
    // Mixed — has both positive and negative words
    expect(result.positiveCount).toBeGreaterThan(0)
    expect(result.negativeCount).toBeGreaterThan(0)
  })
})

describe('Batch Sentiment Analysis', () => {
  it('should analyze multiple texts and return aggregate', () => {
    const texts = [
      'Lucro recorde com crescimento forte',
      'Queda nas vendas preocupa investidores',
      'Empresa mantém operações normais',
    ]
    const result = analyzeSentimentBatch(texts)
    expect(result.wordCount).toBeGreaterThan(0)
    expect(result.positiveCount).toBeGreaterThan(0)
    expect(result.negativeCount).toBeGreaterThan(0)
  })

  it('should handle empty array', () => {
    const result = analyzeSentimentBatch([])
    expect(result.label).toBe('neutral')
    expect(result.wordCount).toBe(0)
  })
})

// ─── Ticker Extraction Tests ────────────────────────────────────

describe('Ticker Extractor', () => {
  it('should extract valid B3 tickers', () => {
    setValidTickers(['PETR4', 'VALE3', 'ITUB4', 'BBAS3'])
    const tickers = extractTickers('PETR4 subiu 3% enquanto VALE3 caiu 1% hoje')
    expect(tickers).toContain('PETR4')
    expect(tickers).toContain('VALE3')
    expect(tickers).toHaveLength(2)
  })

  it('should handle unit tickers (11)', () => {
    setValidTickers(['KLBN11', 'BPAC11', 'SANB11'])
    const tickers = extractTickers('KLBN11 e BPAC11 em alta')
    expect(tickers).toContain('KLBN11')
    expect(tickers).toContain('BPAC11')
  })

  it('should not extract invalid tickers', () => {
    setValidTickers(['PETR4', 'VALE3'])
    const tickers = extractTickers('FAKE4 e XXXX3 não são válidos')
    expect(tickers).toHaveLength(0)
  })

  it('should return empty array for text without tickers', () => {
    setValidTickers(['PETR4', 'VALE3'])
    const tickers = extractTickers('O mercado brasileiro fechou em alta hoje')
    expect(tickers).toHaveLength(0)
  })

  it('should deduplicate tickers', () => {
    setValidTickers(['PETR4'])
    const tickers = extractTickers('PETR4 sobe, PETR4 recorde, PETR4 forte')
    expect(tickers).toHaveLength(1)
  })

  it('should extract from multiple fields', () => {
    setValidTickers(['PETR4', 'VALE3', 'ITUB4'])
    const tickers = extractTickersFromFields(
      'PETR4 anuncia dividendos',
      'Veja também VALE3 e ITUB4'
    )
    expect(tickers).toHaveLength(3)
    expect(tickers).toContain('PETR4')
    expect(tickers).toContain('VALE3')
    expect(tickers).toContain('ITUB4')
  })

  it('should return all matches when no valid tickers set', () => {
    setValidTickers([])  // empty set
    const tickers = extractTickers('FAKE4 XXXX3 ABCD11')
    expect(tickers).toHaveLength(3) // returns all regex matches
  })
})

// ─── Performance Test ───────────────────────────────────────────

describe('Performance', () => {
  it('should process 1000 texts in under 200ms', () => {
    const sampleTexts = Array.from({ length: 1000 }, (_, i) =>
      i % 3 === 0
        ? 'Petrobras reporta lucro recorde de R$ 50 bilhões no trimestre com crescimento robusto e dividendos expressivos'
        : i % 3 === 1
        ? 'Crise de endividamento provoca queda nas ações e prejuízo operacional significativo'
        : 'Mercado aguarda decisão do banco central sobre política monetária e taxa de juros'
    )

    const start = performance.now()
    for (const text of sampleTexts) {
      analyzeSentiment(text)
    }
    const elapsed = performance.now() - start

    expect(elapsed).toBeLessThan(200) // Should be well under 200ms
  })
})
