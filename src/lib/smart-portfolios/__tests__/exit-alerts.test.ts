import { describe, it, expect, vi } from 'vitest'
import { generateExitAlerts } from '../exit-alerts'
import type { AssetData } from '../../data-source'

// Mock score-history module
vi.mock('../../score-history', () => ({
  getScoreHistory: vi.fn((_ticker: string, _days: number) => []),
}))

// Mock scoring module
vi.mock('../../scoring/aq-score', () => ({
  mapearSetor: vi.fn((s: string) => s.toLowerCase()),
  getSectorBenchmarks: vi.fn(() => ({ fairPE: 12 })),
}))

import { getScoreHistory } from '../../score-history'
import { getSectorBenchmarks } from '../../scoring/aq-score'

// ─── Test Helpers ────────────────────────────────────────────

function makeAsset(ticker: string, overrides: Partial<{
  score: number
  scoreRisk: number
  peRatio: number | null
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
    aqScore: {
      scoreTotal: score,
      scoreBruto: score,
      scoreValuation: 60,
      scoreQuality: 70,
      scoreGrowth: 50,
      scoreDividends: 45,
      scoreRisk: overrides.scoreRisk ?? 55,
      scoreQualitativo: 0,
      confidence: 85,
    },
    lensScores: null,
    scoreBreakdown: null,
    fundamentals: {
      peRatio: overrides.peRatio !== undefined ? overrides.peRatio : 10,
      pbRatio: 1.5,
      psr: 2.0,
      pEbit: 8,
      evEbit: 10,
      evEbitda: 8,
      roe: 15,
      roic: 12,
      margemEbit: 20,
      margemLiquida: 15,
      liquidezCorrente: 1.5,
      divBrutPatrim: 0.8,
      pCapGiro: 5,
      pAtivCircLiq: -2,
      pAtivo: 0.5,
      patrimLiquido: 5_000_000_000,
      dividendYield: 5.0,
      netDebtEbitda: 1.5,
      crescimentoReceita5a: 10,
      liq2meses: 500_000,
      freeCashflow: null,
      netDebt: null,
      ebitda: null,
      fcfGrowthRate: null,
      debtCostEstimate: null,
      totalDebt: null,
    },
  }
}

// ─── Tests ───────────────────────────────────────────────────

describe('generateExitAlerts', () => {
  it('returns empty when no positions', () => {
    const alerts = generateExitAlerts([], [makeAsset('PETR4')])
    expect(alerts).toHaveLength(0)
  })

  it('returns empty when position ticker not found in assets', () => {
    const alerts = generateExitAlerts(
      [{ ticker: 'XPTO3', quantity: 100 }],
      [makeAsset('PETR4')],
    )
    expect(alerts).toHaveLength(0)
  })

  it('generates thesis broken alert when score dropped >= 15 pts in 30 days', () => {
    vi.mocked(getScoreHistory).mockReturnValueOnce([
      { date: '2026-01-15', score: 75, valuation: 70, quality: 75, risk: 60, dividends: 50, growth: 55 },
      { date: '2026-02-14', score: 55, valuation: 50, quality: 55, risk: 45, dividends: 40, growth: 45 },
    ])

    const alerts = generateExitAlerts(
      [{ ticker: 'PETR4', quantity: 100 }],
      [makeAsset('PETR4', { score: 55 })],
    )

    const thesis = alerts.find(a => a.type === 'reavaliar' && a.severity === 'critical')
    expect(thesis).toBeDefined()
    expect(thesis!.ticker).toBe('PETR4')
    expect(thesis!.data['delta']).toBe(-20)
  })

  it('generates fair value reached alert when P/L >= sector fairPE', () => {
    vi.mocked(getScoreHistory).mockReturnValueOnce([])
    vi.mocked(getSectorBenchmarks).mockReturnValueOnce({ fairPE: 12 })

    const alerts = generateExitAlerts(
      [{ ticker: 'PETR4', quantity: 100 }],
      [makeAsset('PETR4', { peRatio: 15 })],
    )

    const fairValue = alerts.find(a => a.type === 'realizar_lucro')
    expect(fairValue).toBeDefined()
    expect(fairValue!.data['pl']).toBe(15)
    expect(fairValue!.data['fairPE']).toBe(12)
  })

  it('generates quality deterioration alert when quality dropped >= 20 pts', () => {
    vi.mocked(getScoreHistory).mockReturnValueOnce([
      { date: '2026-01-15', score: 70, valuation: 65, quality: 80, risk: 60, dividends: 50, growth: 55 },
      { date: '2026-02-14', score: 60, valuation: 60, quality: 55, risk: 55, dividends: 48, growth: 52 },
    ])

    const alerts = generateExitAlerts(
      [{ ticker: 'PETR4', quantity: 100 }],
      [makeAsset('PETR4', { score: 60, peRatio: 5 })],
    )

    const quality = alerts.find(a => a.title.includes('Qualidade'))
    expect(quality).toBeDefined()
    expect(quality!.severity).toBe('warning')
  })

  it('generates rising risk alert when risk score < 30', () => {
    vi.mocked(getScoreHistory).mockReturnValueOnce([])

    const alerts = generateExitAlerts(
      [{ ticker: 'PETR4', quantity: 100 }],
      [makeAsset('PETR4', { scoreRisk: 20, peRatio: 5 })],
    )

    const risk = alerts.find(a => a.type === 'monitorar')
    expect(risk).toBeDefined()
    expect(risk!.title).toContain('risco elevado')
  })

  it('sorts alerts by severity: critical first, then warning', () => {
    vi.mocked(getScoreHistory).mockReturnValueOnce([
      { date: '2026-01-15', score: 80, valuation: 70, quality: 80, risk: 65, dividends: 55, growth: 60 },
      { date: '2026-02-14', score: 60, valuation: 50, quality: 55, risk: 45, dividends: 40, growth: 45 },
    ])
    vi.mocked(getSectorBenchmarks).mockReturnValueOnce({ fairPE: 8 })

    const alerts = generateExitAlerts(
      [{ ticker: 'PETR4', quantity: 100 }],
      [makeAsset('PETR4', { score: 60, scoreRisk: 20, peRatio: 10 })],
    )

    // Should have critical alerts before warnings
    const criticalIdx = alerts.findIndex(a => a.severity === 'critical')
    const warningIdx = alerts.findIndex(a => a.severity === 'warning')
    if (criticalIdx >= 0 && warningIdx >= 0) {
      expect(criticalIdx).toBeLessThan(warningIdx)
    }
  })
})
