import { describe, it, expect } from 'vitest'
import { detectRegime } from '../regime-detector'

describe('detectRegime', () => {
  // ─── Fallback SELIC Nominal (sem IPCA) ─────────────────────────
  it('should return risk_off when SELIC > 11.5% (nominal fallback)', () => {
    const result = detectRegime(13.75)
    expect(result.regime).toBe('risk_off')
    expect(result.description).toContain('Juros reais elevados')
  })

  it('should return risk_off at SELIC = 12% (nominal fallback)', () => {
    const result = detectRegime(12)
    expect(result.regime).toBe('risk_off')
  })

  it('should return risk_off at SELIC = 11.51% (nominal fallback)', () => {
    const result = detectRegime(11.51)
    expect(result.regime).toBe('risk_off')
  })

  // ─── Risk On SELIC Nominal ─────────────────────────────────────
  it('should return risk_on when SELIC < 8% (nominal fallback)', () => {
    const result = detectRegime(6.5)
    expect(result.regime).toBe('risk_on')
    expect(result.description).toContain('Juros reais baixos')
  })

  it('should return risk_on at SELIC = 7.99% (nominal fallback)', () => {
    const result = detectRegime(7.99)
    expect(result.regime).toBe('risk_on')
  })

  it('should return risk_on at SELIC = 2% (nominal fallback)', () => {
    const result = detectRegime(2)
    expect(result.regime).toBe('risk_on')
  })

  // ─── Neutral SELIC Nominal ─────────────────────────────────────
  it('should return neutral when SELIC is between 8% and 11.5% (nominal fallback)', () => {
    const result = detectRegime(10)
    expect(result.regime).toBe('neutral')
    expect(result.description).toContain('neutro')
  })

  it('should return neutral at SELIC = 8% (boundary, nominal fallback)', () => {
    const result = detectRegime(8)
    expect(result.regime).toBe('neutral')
  })

  it('should return neutral at SELIC = 11.5% (boundary, nominal fallback)', () => {
    const result = detectRegime(11.5)
    expect(result.regime).toBe('neutral')
  })

  // ─── Pillar Weights ────────────────────────────────────────────
  it('risk_off should heavily favor risk and dividends', () => {
    const { pillarWeights } = detectRegime(15, 4.1) // Real ~10.9% → risk_off
    expect(pillarWeights.risk).toBe(0.27)
    expect(pillarWeights.dividends).toBe(0.25)
    expect(pillarWeights.growth).toBe(0.10)
  })

  it('risk_on should heavily favor growth', () => {
    const { pillarWeights } = detectRegime(2.25, 2.1) // Real ~0.15% → risk_on
    expect(pillarWeights.growth).toBe(0.35)
    expect(pillarWeights.risk).toBe(0.12)
    expect(pillarWeights.dividends).toBe(0.10)
  })

  it('neutral weights unchanged', () => {
    const { pillarWeights } = detectRegime(6.5, 3.2) // Real ~3.3% → neutral
    expect(pillarWeights.valuation).toBe(0.25)
    expect(pillarWeights.quality).toBe(0.25)
    expect(pillarWeights.risk).toBe(0.20)
    expect(pillarWeights.dividends).toBe(0.15)
    expect(pillarWeights.growth).toBe(0.15)
  })

  it('all regime weights sum to 1.0', () => {
    for (const [selic, ipca] of [[15, 4.1], [6.5, 3.2], [2.25, 2.1]]) {
      const { pillarWeights } = detectRegime(selic as number, ipca as number)
      const sum = Object.values(pillarWeights).reduce((a, b) => a + b, 0)
      expect(sum).toBeCloseTo(1.0, 5)
    }
  })

  it('all regimes (nominal fallback) should have weights summing to 1.0', () => {
    for (const selic of [5, 10, 14]) {
      const { pillarWeights } = detectRegime(selic)
      const sum = pillarWeights.valuation + pillarWeights.quality + pillarWeights.risk + pillarWeights.dividends + pillarWeights.growth
      expect(sum).toBeCloseTo(1.0, 5)
    }
  })

  // ─── SELIC Real tests ──────────────────────────────────────────
  it('should use SELIC Real when IPCA is provided', () => {
    // SELIC 15%, IPCA 4.1% → Real 10.9% → risk_off
    const result = detectRegime(15, 4.1)
    expect(result.regime).toBe('risk_off')
    expect(result.selicReal).toBeCloseTo(10.9, 1)
  })

  it('should return risk_on when SELIC Real < 3%', () => {
    // SELIC 2.25%, IPCA 2.1% → Real 0.15%
    const result = detectRegime(2.25, 2.1)
    expect(result.regime).toBe('risk_on')
  })

  it('should return neutral when SELIC Real between 3% and 6%', () => {
    // SELIC 6.5%, IPCA 3.2% → Real 3.3%
    const result = detectRegime(6.5, 3.2)
    expect(result.regime).toBe('neutral')
  })

  it('should handle negative SELIC Real (IPCA > SELIC)', () => {
    // SELIC 2%, IPCA 5% → Real -3% → risk_on
    const result = detectRegime(2, 5)
    expect(result.regime).toBe('risk_on')
    expect(result.selicReal).toBeCloseTo(-3, 1)
  })

  it('should fallback to nominal SELIC when IPCA is 0', () => {
    // SELIC 13%, IPCA 0 → fallback nominal → risk_off
    const result = detectRegime(13, 0)
    expect(result.regime).toBe('risk_off')
  })

  it('should fallback to nominal SELIC when IPCA not provided', () => {
    // SELIC 13% → fallback nominal → risk_off
    const result = detectRegime(13)
    expect(result.regime).toBe('risk_off')
  })

  // ─── Boundary tests for SELIC Real ────────────────────────────
  it('should return risk_off at selicReal = 6.01%', () => {
    const result = detectRegime(10.01, 4) // Real = 6.01
    expect(result.regime).toBe('risk_off')
  })

  it('should return neutral at selicReal = 6.0%', () => {
    const result = detectRegime(10, 4) // Real = 6.0
    expect(result.regime).toBe('neutral')
  })

  it('should return neutral at selicReal = 3.0%', () => {
    const result = detectRegime(7, 4) // Real = 3.0
    expect(result.regime).toBe('neutral')
  })

  it('should return risk_on at selicReal = 2.99%', () => {
    const result = detectRegime(6.99, 4) // Real = 2.99
    expect(result.regime).toBe('risk_on')
  })

  // ─── Metadata tests ────────────────────────────────────────────
  it('should include selicReal in result', () => {
    const result = detectRegime(15, 4.1)
    expect(result.selicReal).toBeCloseTo(10.9, 1)
    expect(result.inputSelic).toBe(15)
    expect(result.inputIpca).toBe(4.1)
  })

  it('should have NaN selicReal when using nominal fallback', () => {
    const result = detectRegime(13)
    expect(result.inputSelic).toBe(13)
    expect(result.inputIpca).toBe(0)
    expect(isNaN(result.selicReal)).toBe(true)
  })

  // ─── Weight sum validation with IPCA ─────────────────────────
  it('all regimes should have weights summing to 1.0 with IPCA', () => {
    for (const [selic, ipca] of [[15, 4.1], [6.5, 3.2], [2.25, 2.1]]) {
      const { pillarWeights } = detectRegime(selic as number, ipca as number)
      const sum = pillarWeights.valuation + pillarWeights.quality +
                  pillarWeights.risk + pillarWeights.dividends + pillarWeights.growth
      expect(sum).toBeCloseTo(1.0, 5)
    }
  })

  // ─── Volatilidade IBOV (vol30d) ──────────────────────────────
  it('should force risk_off when vol30d > 30%', () => {
    // Mesmo com SELIC real neutra, vol alta = risk_off
    const result = detectRegime(6.5, 3.2, 35)
    expect(result.regime).toBe('risk_off')
  })

  it('should reinforce risk_on when vol30d < 12% and SELIC real near threshold', () => {
    // SELIC 6.9%, IPCA 3.2% → Real 3.7% (normalmente neutro), mas vol baixa → risk_on
    const result = detectRegime(6.9, 3.2, 10)
    expect(result.regime).toBe('risk_on')
  })

  it('should not override to risk_on when vol30d < 12% but SELIC real high', () => {
    // SELIC 15%, IPCA 4.1% → Real 10.9% → risk_off (vol baixa não muda)
    const result = detectRegime(15, 4.1, 10)
    expect(result.regime).toBe('risk_off')
  })

  // ─── Validação com dados reais históricos ─────────────────────
  it('Mar/2026: SELIC 15%, IPCA 4.1% → Real 10.9% → risk_off', () => {
    expect(detectRegime(15, 4.1).regime).toBe('risk_off')
  })

  it('Jun/2020: SELIC 2.25%, IPCA 2.1% → Real 0.15% → risk_on', () => {
    expect(detectRegime(2.25, 2.1).regime).toBe('risk_on')
  })

  it('Jul/2019: SELIC 6.5%, IPCA 3.2% → Real 3.3% → neutral', () => {
    expect(detectRegime(6.5, 3.2).regime).toBe('neutral')
  })

  it('Jan/2023: SELIC 13.75%, IPCA 5.8% → Real 7.95% → risk_off', () => {
    expect(detectRegime(13.75, 5.8).regime).toBe('risk_off')
  })
})
