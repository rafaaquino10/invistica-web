// ─── Income Simulator ────────────────────────────────────────
// Translates dividend yield into concrete monthly income for
// the Passive Income portfolio.

import type { QualifiedStock, IncomeSimulation } from './types'

const SAVINGS_ANNUAL_RATE = 7 // ~7% a.a. poupança

/**
 * Simulate monthly income from a smart portfolio's qualified stocks.
 * Equal allocation across all stocks (simplified).
 */
export function simulateIncome(
  stocks: QualifiedStock[],
  investedAmount: number = 100_000,
  selicRate: number = 13.15,
): IncomeSimulation {
  if (stocks.length === 0) {
    return {
      investedAmount,
      portfolioAvgYield: 0,
      monthlyIncome: 0,
      comparisons: {
        savings: (investedAmount * SAVINGS_ANNUAL_RATE / 100) / 12,
        cdi: (investedAmount * selicRate / 100) / 12,
        selicRate,
      },
      perStock: [],
    }
  }

  // DY average: simple mean of stocks that have DY
  const stocksWithDY = stocks.filter(s => s.dy != null && s.dy > 0)
  const avgYield = stocksWithDY.length > 0
    ? stocksWithDY.reduce((sum, s) => sum + (s.dy ?? 0), 0) / stocksWithDY.length
    : 0

  const monthlyIncome = (investedAmount * avgYield / 100) / 12
  const savingsMonthly = (investedAmount * SAVINGS_ANNUAL_RATE / 100) / 12
  const cdiMonthly = (investedAmount * selicRate / 100) / 12

  const allocationPct = 100 / stocks.length
  const perStockAmount = investedAmount / stocks.length

  return {
    investedAmount,
    portfolioAvgYield: Math.round(avgYield * 100) / 100,
    monthlyIncome: Math.round(monthlyIncome * 100) / 100,
    comparisons: {
      savings: Math.round(savingsMonthly * 100) / 100,
      cdi: Math.round(cdiMonthly * 100) / 100,
      selicRate,
    },
    perStock: stocks.map(s => ({
      ticker: s.ticker,
      allocation: Math.round(allocationPct * 100) / 100,
      annualYield: s.dy ?? 0,
      monthlyIncome: Math.round(((perStockAmount * (s.dy ?? 0) / 100) / 12) * 100) / 100,
    })),
  }
}
