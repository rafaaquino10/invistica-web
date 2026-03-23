import { describe, it, expect } from 'vitest'
import { simulateIncome } from '../income-simulator'
import type { QualifiedStock } from '../types'

// ─── Test Helpers ────────────────────────────────────────────

function makeStock(ticker: string, dy: number | null = 8): QualifiedStock {
  return {
    ticker,
    name: `${ticker} SA`,
    sector: 'Outros',
    price: 25,
    score: 70,
    lensScore: 65,
    dy,
    peRatio: 10,
    roe: 15,
    divEbitda: 1.5,
    confidence: 85,
    rank: 1,
  }
}

// ─── Tests ───────────────────────────────────────────────────

describe('simulateIncome', () => {
  it('calculates monthly income correctly', () => {
    const stocks = [makeStock('PETR4', 8), makeStock('VALE3', 10)]
    const result = simulateIncome(stocks, 100_000, 13.15)

    // Avg DY = (8 + 10) / 2 = 9%
    // Monthly = 100000 * 9% / 12 = 750
    expect(result.portfolioAvgYield).toBe(9)
    expect(result.monthlyIncome).toBe(750)
  })

  it('calculates comparisons correctly', () => {
    const stocks = [makeStock('PETR4', 8)]
    const result = simulateIncome(stocks, 100_000, 13.15)

    // Savings: 100000 * 7% / 12 = 583.33
    expect(result.comparisons.savings).toBeCloseTo(583.33, 0)
    // CDI: 100000 * 13.15% / 12 = 1095.83
    expect(result.comparisons.cdi).toBeCloseTo(1095.83, 0)
    expect(result.comparisons.selicRate).toBe(13.15)
  })

  it('distributes equally across stocks', () => {
    const stocks = [makeStock('PETR4', 8), makeStock('VALE3', 6)]
    const result = simulateIncome(stocks, 100_000, 13.15)

    expect(result.perStock).toHaveLength(2)
    expect(result.perStock[0]!.allocation).toBe(50)
    expect(result.perStock[1]!.allocation).toBe(50)

    // PETR4: 50000 * 8% / 12 = 333.33
    expect(result.perStock[0]!.monthlyIncome).toBeCloseTo(333.33, 0)
    // VALE3: 50000 * 6% / 12 = 250
    expect(result.perStock[1]!.monthlyIncome).toBe(250)
  })

  it('returns zero income for empty portfolio', () => {
    const result = simulateIncome([], 100_000, 13.15)

    expect(result.monthlyIncome).toBe(0)
    expect(result.portfolioAvgYield).toBe(0)
    expect(result.perStock).toHaveLength(0)
    // Comparisons still calculated
    expect(result.comparisons.savings).toBeGreaterThan(0)
    expect(result.comparisons.cdi).toBeGreaterThan(0)
  })

  it('handles stocks with null DY', () => {
    const stocks = [makeStock('PETR4', 8), makeStock('VALE3', null)]
    const result = simulateIncome(stocks, 100_000, 13.15)

    // Only PETR4 has DY, so avg = 8%
    expect(result.portfolioAvgYield).toBe(8)
  })

  it('uses default amount of R$ 100k', () => {
    const stocks = [makeStock('PETR4', 10)]
    const result = simulateIncome(stocks)

    expect(result.investedAmount).toBe(100_000)
    // Monthly = 100000 * 10% / 12 = 833.33
    expect(result.monthlyIncome).toBeCloseTo(833.33, 0)
  })

  it('uses default SELIC rate', () => {
    const stocks = [makeStock('PETR4', 8)]
    const result = simulateIncome(stocks, 100_000)

    expect(result.comparisons.selicRate).toBe(13.15)
  })

  it('handles different investment amounts', () => {
    const stocks = [makeStock('PETR4', 12)]

    const result50k = simulateIncome(stocks, 50_000, 13.15)
    const result200k = simulateIncome(stocks, 200_000, 13.15)

    // 50k * 12% / 12 = 500
    expect(result50k.monthlyIncome).toBe(500)
    // 200k * 12% / 12 = 2000
    expect(result200k.monthlyIncome).toBe(2000)
  })
})
