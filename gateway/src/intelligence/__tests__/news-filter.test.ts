import { describe, it, expect } from 'vitest'
import { getNewsForTicker, getRelevantFacts } from '../news-filter.js'
import type { NormalizedNewsItem } from '../../routes/news.js'

function makeNews(overrides: Partial<NormalizedNewsItem> = {}): NormalizedNewsItem {
  return {
    id: 'test_1',
    title: 'Notícia genérica do mercado',
    summary: 'Resumo da notícia',
    source: 'InfoMoney',
    sourceColor: '#FF6B35',
    link: 'https://example.com/1',
    tickers: [],
    date: new Date().toISOString(),
    category: 'mercado',
    sentiment: 'neutral',
    ...overrides,
  }
}

describe('getNewsForTicker', () => {
  it('matches by tickers[] array', () => {
    const news = [
      makeNews({ id: 'n1', title: 'Resultados do 4T', tickers: ['PETR4'] }),
      makeNews({ id: 'n2', title: 'Outra notícia', tickers: ['VALE3'] }),
    ]
    const result = getNewsForTicker('PETR4', 'Petrobras', news)
    expect(result).toHaveLength(1)
    expect(result[0]!.id).toBe('n1')
  })

  it('matches by company name in title', () => {
    const news = [
      makeNews({ id: 'n1', title: 'Petrobras anuncia dividendos recordes' }),
      makeNews({ id: 'n2', title: 'Vale reporta lucro' }),
    ]
    const result = getNewsForTicker('PETR4', 'Petrobras', news)
    expect(result).toHaveLength(1)
    expect(result[0]!.id).toBe('n1')
  })

  it('matches by ticker base (PETR → PETR4 news)', () => {
    const news = [
      makeNews({ id: 'n1', title: 'Análise: PETR em alta após relatório' }),
    ]
    const result = getNewsForTicker('PETR4', 'Petrobras', news)
    expect(result).toHaveLength(1)
  })

  it('returns empty for unknown ticker', () => {
    const news = [
      makeNews({ id: 'n1', title: 'Vale sobe 5%', tickers: ['VALE3'] }),
    ]
    const result = getNewsForTicker('WEGE3', 'WEG', news)
    expect(result).toHaveLength(0)
  })

  it('sorts by date descending', () => {
    const news = [
      makeNews({ id: 'n1', title: 'Petrobras ontem', tickers: ['PETR4'], date: '2026-02-14T10:00:00Z' }),
      makeNews({ id: 'n2', title: 'Petrobras hoje', tickers: ['PETR4'], date: '2026-02-15T10:00:00Z' }),
    ]
    const result = getNewsForTicker('PETR4', 'Petrobras', news)
    expect(result[0]!.id).toBe('n2')
    expect(result[1]!.id).toBe('n1')
  })

  it('limits to 10 articles', () => {
    const news = Array.from({ length: 15 }, (_, i) =>
      makeNews({ id: `n${i}`, title: `Petrobras ${i}`, tickers: ['PETR4'], date: new Date(Date.now() - i * 3600000).toISOString() }),
    )
    const result = getNewsForTicker('PETR4', 'Petrobras', news)
    expect(result).toHaveLength(10)
  })

  it('does not match short company names to avoid false positives', () => {
    const news = [
      makeNews({ id: 'n1', title: 'BB Seguridade reporta lucro' }),
    ]
    // "BB" is only 2 chars, should not match
    const result = getNewsForTicker('BBSE3', 'BB', news)
    expect(result).toHaveLength(0)
  })
})

describe('getRelevantFacts', () => {
  it('returns articles with "fato relevante" for ticker', () => {
    const news = [
      makeNews({ id: 'n1', title: 'Petrobras publica fato relevante', tickers: ['PETR4'] }),
      makeNews({ id: 'n2', title: 'Petrobras sobe 3%', tickers: ['PETR4'] }),
    ]
    const result = getRelevantFacts('PETR4', 'Petrobras', news)
    expect(result).toHaveLength(1)
    expect(result[0]!.id).toBe('n1')
  })

  it('matches "comunicado ao mercado"', () => {
    const news = [
      makeNews({ id: 'n1', title: 'Comunicado ao mercado — Petrobras', tickers: ['PETR4'] }),
    ]
    const result = getRelevantFacts('PETR4', 'Petrobras', news)
    expect(result).toHaveLength(1)
  })

  it('returns empty when no relevant facts', () => {
    const news = [
      makeNews({ id: 'n1', title: 'Petrobras sobe 5%', tickers: ['PETR4'] }),
    ]
    const result = getRelevantFacts('PETR4', 'Petrobras', news)
    expect(result).toHaveLength(0)
  })
})
