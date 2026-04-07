import { describe, it, expect } from 'vitest'
import { checkKillSwitch } from '../kill-switch.js'
import type { NormalizedNewsItem } from '../../routes/news.js'

function makeNews(overrides: Partial<NormalizedNewsItem> = {}): NormalizedNewsItem {
  return {
    id: 'test_1',
    title: 'Notícia genérica',
    summary: '',
    source: 'InfoMoney',
    sourceColor: '#FF6B35',
    link: 'https://example.com',
    tickers: [],
    date: new Date().toISOString(),
    category: 'mercado',
    sentiment: 'neutral',
    ...overrides,
  }
}

describe('checkKillSwitch', () => {
  it('triggers on "recuperação judicial" + matching ticker', () => {
    const news = [
      makeNews({
        title: 'AMER3: Americanas pede recuperação judicial',
        tickers: ['AMER3'],
        summary: 'Empresa entra com pedido de recuperação judicial no RJ',
      }),
    ]
    const result = checkKillSwitch('AMER3', 'Americanas', news)
    expect(result.triggered).toBe(true)
    expect(result.reason).toContain('Recuperação judicial')
    expect(result.article).toBeDefined()
  })

  it('triggers on "fraude contábil" + matching ticker', () => {
    const news = [
      makeNews({
        title: 'Fraude contábil descoberta na Empresa X',
        tickers: ['XPTO3'],
      }),
    ]
    const result = checkKillSwitch('XPTO3', 'Empresa X', news)
    expect(result.triggered).toBe(true)
    expect(result.reason).toContain('Fraude contábil')
  })

  it('triggers when ticker is in title but not in tickers[]', () => {
    const news = [
      makeNews({
        title: 'CVM suspende negociação de AMER3',
        tickers: [],
      }),
    ]
    const result = checkKillSwitch('AMER3', 'Americanas', news)
    expect(result.triggered).toBe(true)
    expect(result.reason).toContain('Cvm suspende')
  })

  it('does NOT trigger when keyword present but ticker does not match', () => {
    const news = [
      makeNews({
        title: 'Empresa Y pede recuperação judicial',
        tickers: ['EMPX3'],
      }),
    ]
    const result = checkKillSwitch('PETR4', 'Petrobras', news)
    expect(result.triggered).toBe(false)
  })

  it('ignores articles older than 7 days', () => {
    const oldDate = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
    const news = [
      makeNews({
        title: 'AMER3: Americanas pede recuperação judicial',
        tickers: ['AMER3'],
        date: oldDate,
      }),
    ]
    const result = checkKillSwitch('AMER3', 'Americanas', news)
    expect(result.triggered).toBe(false)
  })

  it('returns the triggering article', () => {
    const news = [
      makeNews({
        id: 'critical_1',
        title: 'Rombo contábil na Petrobras preocupa mercado',
        tickers: ['PETR4'],
      }),
    ]
    const result = checkKillSwitch('PETR4', 'Petrobras', news)
    expect(result.triggered).toBe(true)
    expect(result.article!.id).toBe('critical_1')
  })

  it('returns not triggered when no critical keywords', () => {
    const news = [
      makeNews({
        title: 'Petrobras anuncia lucro recorde',
        tickers: ['PETR4'],
      }),
    ]
    const result = checkKillSwitch('PETR4', 'Petrobras', news)
    expect(result.triggered).toBe(false)
    expect(result.reason).toBeNull()
    expect(result.article).toBeNull()
  })

  it('matches by company name in title', () => {
    const news = [
      makeNews({
        title: 'Petrobras investigação pela PF revela esquema',
        tickers: [],
      }),
    ]
    const result = checkKillSwitch('PETR4', 'Petrobras', news)
    expect(result.triggered).toBe(true)
  })
})
