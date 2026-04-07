import { describe, it, expect } from 'vitest'
import { calculateAssetSignal } from '../asset-signal.js'
import type { TechnicalData } from '../technical-calculator.js'
import type { ScoreHistory } from '../asset-signal.js'

describe('calculateAssetSignal', () => {
  const baseTechnical: TechnicalData = {
    mm200: null,
    mm50: null,
    beta: null,
    avgVolume2m: null,
    todayVolume: null,
    high52w: null,
    low52w: null,
    price: 30,
  }

  const neutralScore: ScoreHistory = { current: 60, previous30d: null }

  it('returns NEUTRO with no technical data', () => {
    const result = calculateAssetSignal(baseTechnical, neutralScore, 0)
    expect(result.signal).toBe(0)
    expect(result.label).toBe('NEUTRO')
    expect(result.factors).toHaveLength(0)
  })

  it('BULL when above MM200 + high volume upward', () => {
    const tech: TechnicalData = {
      ...baseTechnical,
      mm200: 25,
      mm50: 28,
      avgVolume2m: 100000,
      todayVolume: 200000,
      price: 30,
    }
    const result = calculateAssetSignal(tech, neutralScore, 2.5)
    expect(result.signal).toBeGreaterThan(0.3)
    expect(result.label).toBe('BULL')
    expect(result.factors.length).toBeGreaterThanOrEqual(2)
  })

  it('BEAR when below MM200 + score dropping', () => {
    const tech: TechnicalData = {
      ...baseTechnical,
      mm200: 35,
      mm50: 33,
      price: 28,
    }
    const score: ScoreHistory = { current: 45, previous30d: 55 }
    const result = calculateAssetSignal(tech, score, -1.5)
    expect(result.signal).toBeLessThan(-0.3)
    expect(result.label).toBe('BEAR')
  })

  it('near 52w low adds BULL factor', () => {
    const tech: TechnicalData = {
      ...baseTechnical,
      high52w: 50,
      low52w: 20,
      price: 22,
    }
    const result = calculateAssetSignal(tech, neutralScore, 0)
    expect(result.factors.some(f => f.includes('mínima'))).toBe(true)
    expect(result.signal).toBeGreaterThan(0)
  })

  it('near 52w high adds BEAR caution factor', () => {
    const tech: TechnicalData = {
      ...baseTechnical,
      high52w: 50,
      low52w: 20,
      price: 48,
    }
    const result = calculateAssetSignal(tech, neutralScore, 0)
    expect(result.factors.some(f => f.includes('máxima'))).toBe(true)
    expect(result.signal).toBeLessThan(0)
  })

  it('score improving 30d adds BULL factor', () => {
    const score: ScoreHistory = { current: 70, previous30d: 60 }
    const result = calculateAssetSignal(baseTechnical, score, 0)
    expect(result.signal).toBeGreaterThan(0)
    expect(result.factors.some(f => f.includes('subindo'))).toBe(true)
  })

  it('score deteriorating 30d adds BEAR factor', () => {
    const score: ScoreHistory = { current: 40, previous30d: 50 }
    const result = calculateAssetSignal(baseTechnical, score, 0)
    expect(result.signal).toBeLessThan(0)
    expect(result.factors.some(f => f.includes('caindo'))).toBe(true)
  })

  it('signal is clamped to [-1, +1]', () => {
    const tech: TechnicalData = {
      ...baseTechnical,
      mm200: 20,
      mm50: 22,
      avgVolume2m: 100000,
      todayVolume: 500000,
      high52w: 50,
      low52w: 20,
      price: 30,
    }
    const score: ScoreHistory = { current: 80, previous30d: 70 }
    const result = calculateAssetSignal(tech, score, 5)
    expect(result.signal).toBeGreaterThanOrEqual(-1)
    expect(result.signal).toBeLessThanOrEqual(1)
  })
})
