import { describe, it, expect } from 'vitest'
import { calculateMacroSignal } from '../macro-signal.js'
import type { PredictionInput, IbovTechnical } from '../macro-signal.js'

describe('calculateMacroSignal', () => {
  const neutralIbov: IbovTechnical = { price: 130000, mm200: null, change30d: null }

  it('returns NEUTRO with no predictions and no IBOV data', () => {
    const result = calculateMacroSignal([], neutralIbov)
    expect(result.signal).toBe(0)
    expect(result.label).toBe('NEUTRO')
    expect(result.factors).toHaveLength(0)
  })

  it('returns BEAR when Kalshi 80% rate hike', () => {
    const predictions: PredictionInput[] = [
      { category: 'selic', probability: 80, volume: 100000 },
    ]
    const result = calculateMacroSignal(predictions, neutralIbov)
    expect(result.signal).toBeLessThan(0)
    expect(result.label).toBe('BEAR')
    expect(result.factors.some(f => f.name === 'Juros' && f.signal < 0)).toBe(true)
  })

  it('returns BULL when Kalshi 20% rate hike (80% rate cut)', () => {
    const predictions: PredictionInput[] = [
      { category: 'selic', probability: 20, volume: 100000 },
    ]
    const result = calculateMacroSignal(predictions, neutralIbov)
    expect(result.signal).toBeGreaterThan(0)
    expect(result.label).toBe('BULL')
    expect(result.factors.some(f => f.name === 'Juros' && f.signal > 0)).toBe(true)
  })

  it('IBOV above MM200 adds BULL factor', () => {
    const ibov: IbovTechnical = { price: 135000, mm200: 125000, change30d: null }
    const result = calculateMacroSignal([], ibov)
    expect(result.factors.some(f => f.name === 'IBOV' && f.signal > 0)).toBe(true)
  })

  it('IBOV below MM200 adds BEAR factor', () => {
    const ibov: IbovTechnical = { price: 115000, mm200: 125000, change30d: null }
    const result = calculateMacroSignal([], ibov)
    expect(result.factors.some(f => f.name === 'IBOV' && f.signal < 0)).toBe(true)
  })

  it('high dollar probability adds BEAR factor', () => {
    const predictions: PredictionInput[] = [
      { category: 'cambio', probability: 75, volume: 50000 },
    ]
    const result = calculateMacroSignal(predictions, neutralIbov)
    expect(result.factors.some(f => f.name === 'Dólar' && f.signal < 0)).toBe(true)
  })

  it('high inflation probability adds BEAR factor', () => {
    const predictions: PredictionInput[] = [
      { category: 'ipca', probability: 80, volume: 50000 },
    ]
    const result = calculateMacroSignal(predictions, neutralIbov)
    expect(result.factors.some(f => f.name === 'Inflação' && f.signal < 0)).toBe(true)
  })

  it('uses highest-volume contract per category', () => {
    const predictions: PredictionInput[] = [
      { category: 'selic', probability: 80, volume: 10000 },  // low volume
      { category: 'selic', probability: 20, volume: 50000 },  // high volume — should win
    ]
    const result = calculateMacroSignal(predictions, neutralIbov)
    // Should use the 20% prediction (high volume) → BULL
    expect(result.factors.some(f => f.name === 'Juros' && f.signal > 0)).toBe(true)
  })

  it('combines multiple factors into average signal', () => {
    const predictions: PredictionInput[] = [
      { category: 'selic', probability: 80, volume: 100000 },   // BEAR
      { category: 'cambio', probability: 75, volume: 50000 },   // BEAR
    ]
    const ibov: IbovTechnical = { price: 115000, mm200: 125000, change30d: null }
    const result = calculateMacroSignal(predictions, ibov)
    expect(result.signal).toBeLessThan(-0.3)
    expect(result.label).toBe('BEAR')
    expect(result.factors.length).toBeGreaterThanOrEqual(3)
  })
})
