import { describe, it, expect } from 'vitest'
import { filterAndRankPortfolio, getAllSmartPortfolios } from '../engine'
import { SMART_PORTFOLIOS } from '../portfolios'
import type { AssetData } from '../../data-source'
import type { SmartPortfolio } from '../types'

// ─── Test Helpers ────────────────────────────────────────────

function makeAsset(ticker: string, overrides: Partial<{
  score: number
  valueScore: number
  dividendsScore: number
  growthScore: number
  defensiveScore: number
  confidence: number
  roe: number
  dy: number
  peRatio: number
  netDebtEbitda: number
  margemLiquida: number
  liq2meses: number
  sector: string
}> = {}): AssetData {
  const score = overrides.score ?? 65
  return {
    id: '1',
    ticker,
    name: `${ticker} SA`,
    type: 'stock',
    sector: overrides.sector ?? 'Outros',
    price: 25,
    change: 0.5,
    changePercent: 2.0,
    logo: null,
    volume: 1_000_000,
    marketCap: 10_000_000_000,
    fiftyTwoWeekHigh: 30,
    fiftyTwoWeekLow: 20,
    hasFundamentals: true,
    iqScore: {
      scoreTotal: score,
      scoreBruto: score,
      scoreValuation: 60,
      scoreQuanti: 70,
      scoreOperational: 50,
      scoreQuali: 45,
      scoreQuanti: 55,
      scoreQuali: 0,
      confidence: overrides.confidence ?? 85,
    },
    lensScores: {
      general: score,
      value: overrides.valueScore ?? 60,
      dividends: overrides.dividendsScore ?? 50,
      growth: overrides.growthScore ?? 55,
      defensive: overrides.defensiveScore ?? 58,
      momentum: null,
    },
    scoreBreakdown: null,
    fundamentals: {
      peRatio: overrides.peRatio ?? 10,
      pbRatio: 1.5,
      psr: 2.0,
      pEbit: 8,
      evEbit: 10,
      evEbitda: 8,
      roe: overrides.roe ?? 15,
      roic: 12,
      margemEbit: 20,
      margemLiquida: overrides.margemLiquida ?? 15,
      liquidezCorrente: 1.5,
      divBrutPatrim: 0.8,
      pCapGiro: 5,
      pAtivCircLiq: -2,
      pAtivo: 0.5,
      patrimLiquido: 5_000_000_000,
      dividendYield: overrides.dy ?? 5.0,
      netDebtEbitda: overrides.netDebtEbitda ?? 1.5,
      crescimentoReceita5a: 10,
      liq2meses: overrides.liq2meses ?? 500_000,
      freeCashflow: null,
      netDebt: null,
      ebitda: null,
      fcfGrowthRate: null,
      debtCostEstimate: null,
      totalDebt: null,
    },
  }
}

/**
 * Helper: create enough passing assets so that progressive relaxation
 * doesn't kick in, then add specific test assets.
 */
function makeBaseAssets(count: number = 4): AssetData[] {
  return Array.from({ length: count }, (_, i) =>
    makeAsset(`BASE${i}`, { score: 80, roe: 20, dy: 8, confidence: 90, valueScore: 70 })
  )
}

// ─── Tests ───────────────────────────────────────────────────

describe('filterAndRankPortfolio', () => {
  it('filters by minScore', () => {
    const portfolio: SmartPortfolio = {
      ...SMART_PORTFOLIOS[0]!,
      criteria: { minScore: 60 },
      maxStocks: 20,
    }
    // Enough passing assets so relaxation won't trigger
    const assets = [
      ...makeBaseAssets(3),
      makeAsset('PETR4', { score: 70 }),
      makeAsset('VALE3', { score: 50 }),
      makeAsset('ITUB4', { score: 65 }),
    ]

    const result = filterAndRankPortfolio(portfolio, assets)
    const tickers = result.map(s => s.ticker)
    expect(tickers).toContain('PETR4')
    expect(tickers).toContain('ITUB4')
    expect(tickers).not.toContain('VALE3')
  })

  it('filters by minLensScore', () => {
    const portfolio: SmartPortfolio = {
      ...SMART_PORTFOLIOS[0]!,
      criteria: { minLensScore: { lens: 'value', min: 65 } },
      maxStocks: 20,
    }
    const assets = [
      ...makeBaseAssets(3),
      makeAsset('PETR4', { valueScore: 70 }),
      makeAsset('VALE3', { valueScore: 50 }),
    ]

    const result = filterAndRankPortfolio(portfolio, assets)
    const tickers = result.map(s => s.ticker)
    expect(tickers).toContain('PETR4')
    expect(tickers).not.toContain('VALE3')
  })

  it('filters by minROE', () => {
    const portfolio: SmartPortfolio = {
      ...SMART_PORTFOLIOS[0]!,
      criteria: { minROE: 12 },
      maxStocks: 20,
    }
    const assets = [
      ...makeBaseAssets(3),
      makeAsset('PETR4', { roe: 15 }),
      makeAsset('VALE3', { roe: 8 }),
    ]

    const result = filterAndRankPortfolio(portfolio, assets)
    const tickers = result.map(s => s.ticker)
    expect(tickers).toContain('PETR4')
    expect(tickers).not.toContain('VALE3')
  })

  it('filters by minDY and maxDY', () => {
    const portfolio: SmartPortfolio = {
      ...SMART_PORTFOLIOS[0]!,
      criteria: { minDY: 5, maxDY: 20 },
      maxStocks: 20,
    }
    const assets = [
      ...makeBaseAssets(3),
      makeAsset('PETR4', { dy: 8 }),
      makeAsset('VALE3', { dy: 3 }),
      makeAsset('ITUB4', { dy: 25 }),
    ]

    const result = filterAndRankPortfolio(portfolio, assets)
    const tickers = result.map(s => s.ticker)
    expect(tickers).toContain('PETR4')
    expect(tickers).not.toContain('VALE3')
    expect(tickers).not.toContain('ITUB4')
  })

  it('filters by maxDivEbitda', () => {
    const portfolio: SmartPortfolio = {
      ...SMART_PORTFOLIOS[0]!,
      criteria: { maxDivEbitda: 2.5 },
      maxStocks: 20,
    }
    const assets = [
      ...makeBaseAssets(3),
      makeAsset('PETR4', { netDebtEbitda: 1.5 }),
      makeAsset('VALE3', { netDebtEbitda: 4.0 }),
    ]

    const result = filterAndRankPortfolio(portfolio, assets)
    const tickers = result.map(s => s.ticker)
    expect(tickers).toContain('PETR4')
    expect(tickers).not.toContain('VALE3')
  })

  it('filters by minConfidence', () => {
    const portfolio: SmartPortfolio = {
      ...SMART_PORTFOLIOS[0]!,
      criteria: { minConfidence: 70 },
      maxStocks: 20,
    }
    const assets = [
      ...makeBaseAssets(3),
      makeAsset('PETR4', { confidence: 85 }),
      makeAsset('VALE3', { confidence: 50 }),
    ]

    const result = filterAndRankPortfolio(portfolio, assets)
    const tickers = result.map(s => s.ticker)
    expect(tickers).toContain('PETR4')
    expect(tickers).not.toContain('VALE3')
  })

  it('respects maxStocks limit', () => {
    const portfolio: SmartPortfolio = {
      ...SMART_PORTFOLIOS[0]!,
      criteria: {},
      maxStocks: 2,
    }
    const assets = [
      makeAsset('PETR4', { score: 80 }),
      makeAsset('VALE3', { score: 70 }),
      makeAsset('ITUB4', { score: 60 }),
    ]

    const result = filterAndRankPortfolio(portfolio, assets)
    expect(result).toHaveLength(2)
  })

  it('assigns rank starting at 1', () => {
    const portfolio: SmartPortfolio = {
      ...SMART_PORTFOLIOS[0]!,
      criteria: {},
      maxStocks: 10,
    }
    const assets = [
      makeAsset('PETR4', { score: 80 }),
      makeAsset('VALE3', { score: 70 }),
    ]

    const result = filterAndRankPortfolio(portfolio, assets)
    expect(result[0]!.rank).toBe(1)
    expect(result[1]!.rank).toBe(2)
  })

  it('momentum portfolio excludes assets without momentum data (thesis guard)', () => {
    const momentum = SMART_PORTFOLIOS.find(p => p.id === 'momentum')!
    const assets = [
      makeAsset('PETR4', { score: 90 }),
      makeAsset('VALE3', { score: 80 }),
    ]
    // All assets have momentum: null by default → thesis guard blocks them all
    const result = filterAndRankPortfolio(momentum, assets)
    expect(result.length).toBe(0)
  })

  it('skips assets without iqScore?', () => {
    const portfolio: SmartPortfolio = {
      ...SMART_PORTFOLIOS[0]!,
      criteria: {},
      maxStocks: 10,
    }
    const noScore: AssetData = { ...makeAsset('XPTO3'), iqScore: null }
    const assets = [makeAsset('PETR4'), noScore]

    const result = filterAndRankPortfolio(portfolio, assets)
    expect(result).toHaveLength(1)
    expect(result[0]!.ticker).toBe('PETR4')
  })

  it('applies AND logic for multiple criteria', () => {
    const portfolio: SmartPortfolio = {
      ...SMART_PORTFOLIOS[0]!,
      criteria: { minScore: 60, minROE: 12, maxDivEbitda: 2.0 },
      maxStocks: 20,
    }
    const assets = [
      ...makeBaseAssets(3),
      makeAsset('PETR4', { score: 70, roe: 15, netDebtEbitda: 1.5 }), // passes all
      makeAsset('VALE3', { score: 70, roe: 15, netDebtEbitda: 3.0 }), // fails maxDivEbitda
      makeAsset('ITUB4', { score: 50, roe: 15, netDebtEbitda: 1.0 }), // fails minScore
    ]

    const result = filterAndRankPortfolio(portfolio, assets)
    const tickers = result.map(s => s.ticker)
    expect(tickers).toContain('PETR4')
    expect(tickers).not.toContain('VALE3')
    expect(tickers).not.toContain('ITUB4')
  })

  it('uses progressive relaxation when strict criteria return too few results', () => {
    const portfolio: SmartPortfolio = {
      ...SMART_PORTFOLIOS[0]!,
      criteria: { minScore: 90, minConfidence: 95 },
      maxStocks: 10,
    }
    // No assets pass strict criteria, but relaxation should return results
    const assets = [
      makeAsset('PETR4', { score: 70, confidence: 85 }),
      makeAsset('VALE3', { score: 65, confidence: 80 }),
      makeAsset('ITUB4', { score: 60, confidence: 75 }),
    ]

    const result = filterAndRankPortfolio(portfolio, assets)
    expect(result.length).toBeGreaterThan(0)
  })

  it('thesis guard blocks assets that violate portfolio thesis', () => {
    const portfolio: SmartPortfolio = {
      ...SMART_PORTFOLIOS[0]!,
      criteria: {},
      maxStocks: 20,
      thesisGuard: (a) => a.fundamentals.dividendYield != null && a.fundamentals.dividendYield > 0,
    }
    const assets = [
      ...makeBaseAssets(3),
      makeAsset('GOOD1', { dy: 6 }),
      makeAsset('BAD1', { dy: 0 }),
    ]
    // Override BAD1 to have null DY
    const bad = assets.find(a => a.ticker === 'BAD1')!
    bad.fundamentals = { ...bad.fundamentals, dividendYield: null }

    const result = filterAndRankPortfolio(portfolio, assets)
    const tickers = result.map(s => s.ticker)
    expect(tickers).toContain('GOOD1')
    expect(tickers).not.toContain('BAD1')
  })

  it('thesis guard is never relaxed by progressive relaxation', () => {
    const portfolio: SmartPortfolio = {
      ...SMART_PORTFOLIOS[0]!,
      criteria: { minScore: 99 }, // impossibly strict to force relaxation
      maxStocks: 10,
      thesisGuard: (a) => (a.lensScores?.value ?? 0) > 50,
    }
    const assets = [
      makeAsset('HIGH_VAL', { score: 60, valueScore: 70 }),
      makeAsset('LOW_VAL', { score: 60, valueScore: 10 }),
      makeAsset('ZERO_VAL', { score: 60, valueScore: 0 }),
    ]

    const result = filterAndRankPortfolio(portfolio, assets)
    const tickers = result.map(s => s.ticker)
    expect(tickers).toContain('HIGH_VAL')
    expect(tickers).not.toContain('LOW_VAL')
    expect(tickers).not.toContain('ZERO_VAL')
  })

  it('sort direction desc puts highest values first', () => {
    const portfolio: SmartPortfolio = {
      ...SMART_PORTFOLIOS[0]!,
      criteria: {},
      sortBy: 'lensScores.value',
      sortDirection: 'desc',
      maxStocks: 10,
    }
    const assets = [
      makeAsset('LOW', { valueScore: 30 }),
      makeAsset('HIGH', { valueScore: 90 }),
      makeAsset('MID', { valueScore: 60 }),
    ]

    const result = filterAndRankPortfolio(portfolio, assets)
    expect(result[0]!.ticker).toBe('HIGH')
    expect(result[1]!.ticker).toBe('MID')
    expect(result[2]!.ticker).toBe('LOW')
  })

  it('passive-income portfolio never includes stocks with null DY', () => {
    const passiveIncome = SMART_PORTFOLIOS.find(p => p.id === 'passive-income')!
    const assets = [
      makeAsset('GOOD1', { score: 80, dy: 8, confidence: 90, dividendsScore: 70 }),
      makeAsset('GOOD2', { score: 75, dy: 7, confidence: 90, dividendsScore: 65 }),
      makeAsset('GOOD3', { score: 70, dy: 6, confidence: 85, dividendsScore: 60 }),
      makeAsset('NODIV', { score: 90, confidence: 90, dividendsScore: 80 }),
    ]
    // Set NODIV to have null DY
    const nodiv = assets.find(a => a.ticker === 'NODIV')!
    nodiv.fundamentals = { ...nodiv.fundamentals, dividendYield: null }

    const result = filterAndRankPortfolio(passiveIncome, assets)
    const tickers = result.map(s => s.ticker)
    expect(tickers).not.toContain('NODIV')
  })
})

describe('getAllSmartPortfolios', () => {
  it('returns results for all 8 portfolios', () => {
    const assets = [makeAsset('PETR4', { score: 70, roe: 15, dy: 7 })]
    const results = getAllSmartPortfolios(assets)

    expect(results).toHaveLength(8)
    expect(results.map(r => r.portfolio.id)).toEqual([
      'deep-value', 'quality-value', 'passive-income', 'growth', 'fortress', 'momentum', 'esg-sustentavel', 'quant-puro',
    ])
  })

  it('momentum portfolio returns empty when no assets have momentum data', () => {
    const assets = [
      makeAsset('PETR4', { score: 90 }),
      makeAsset('VALE3', { score: 80 }),
      makeAsset('ITUB4', { score: 70 }),
    ]
    const results = getAllSmartPortfolios(assets)
    const momentum = results.find(r => r.portfolio.id === 'momentum')!

    // Thesis guard blocks all assets without momentum lens data
    expect(momentum.stocks.length).toBe(0)
  })

  it('includes generatedAt date', () => {
    const results = getAllSmartPortfolios([])
    for (const r of results) {
      expect(r.generatedAt).toBeInstanceOf(Date)
    }
  })
})
