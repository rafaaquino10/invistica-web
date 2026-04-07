import { describe, it, expect } from 'vitest'
import { calculateMomentum, momentumToScore } from '../momentum-engine.js'
import type { MacroSignal } from '../macro-signal.js'
import type { SectorSignal } from '../sector-signal.js'
import type { AssetSignal } from '../asset-signal.js'

describe('momentumToScore', () => {
  it('converts -1 to 0', () => {
    expect(momentumToScore(-1)).toBe(0)
  })

  it('converts 0 to 50', () => {
    expect(momentumToScore(0)).toBe(50)
  })

  it('converts +1 to 100', () => {
    expect(momentumToScore(1)).toBe(100)
  })

  it('converts +0.5 to 75', () => {
    expect(momentumToScore(0.5)).toBe(75)
  })
})

describe('calculateMomentum', () => {
  const bullMacro: MacroSignal = { signal: 0.6, label: 'BULL', factors: [] }
  const bearMacro: MacroSignal = { signal: -0.6, label: 'BEAR', factors: [] }
  const neutralMacro: MacroSignal = { signal: 0, label: 'NEUTRO', factors: [] }

  const bullSector: SectorSignal = { signal: 0.5, label: 'BULL', description: '' }
  const bearSector: SectorSignal = { signal: -0.5, label: 'BEAR', description: '' }
  const neutralSector: SectorSignal = { signal: 0, label: 'NEUTRO', description: '' }

  const bullAsset: AssetSignal = { signal: 0.7, label: 'BULL', factors: [] }
  const bearAsset: AssetSignal = { signal: -0.7, label: 'BEAR', factors: [] }
  const neutralAsset: AssetSignal = { signal: 0, label: 'NEUTRO', factors: [] }

  it('all BULL → overall BULL with high score', () => {
    const result = calculateMomentum(bullMacro, bullSector, bullAsset)
    expect(result.overall.label).toBe('BULL')
    expect(result.overall.signal).toBeGreaterThan(0.25)
    expect(result.overall.score).toBeGreaterThan(60)
  })

  it('all BEAR → overall BEAR with low score', () => {
    const result = calculateMomentum(bearMacro, bearSector, bearAsset)
    expect(result.overall.label).toBe('BEAR')
    expect(result.overall.signal).toBeLessThan(-0.25)
    expect(result.overall.score).toBeLessThan(40)
  })

  it('all neutral → overall NEUTRO with score ~50', () => {
    const result = calculateMomentum(neutralMacro, neutralSector, neutralAsset)
    expect(result.overall.label).toBe('NEUTRO')
    expect(result.overall.signal).toBe(0)
    expect(result.overall.score).toBe(50)
  })

  it('macro BEAR overrides asset BULL due to higher weight', () => {
    // macro 40% * -0.6 = -0.24, sector 30% * 0 = 0, asset 30% * 0.7 = 0.21
    // total = -0.03 → NEUTRO (not BULL despite asset being BULL)
    const result = calculateMomentum(bearMacro, neutralSector, bullAsset)
    expect(result.overall.signal).toBeLessThan(0.1)
    expect(result.overall.label).not.toBe('BULL')
  })

  it('weights sum correctly: 40% macro + 30% sector + 30% asset', () => {
    // macro 40% * 1 = 0.4, sector 30% * 1 = 0.3, asset 30% * 1 = 0.3 = 1.0
    const maxMacro: MacroSignal = { signal: 1, label: 'BULL', factors: [] }
    const maxSector: SectorSignal = { signal: 1, label: 'BULL', description: '' }
    const maxAsset: AssetSignal = { signal: 1, label: 'BULL', factors: [] }
    const result = calculateMomentum(maxMacro, maxSector, maxAsset)
    expect(result.overall.signal).toBe(1)
    expect(result.overall.score).toBe(100)
  })

  it('overall signal is clamped to [-1, +1]', () => {
    const result = calculateMomentum(bullMacro, bullSector, bullAsset)
    expect(result.overall.signal).toBeGreaterThanOrEqual(-1)
    expect(result.overall.signal).toBeLessThanOrEqual(1)
  })

  it('preserves individual layer signals in result', () => {
    const result = calculateMomentum(bullMacro, bearSector, neutralAsset)
    expect(result.macro.signal).toBe(0.6)
    expect(result.sector.signal).toBe(-0.5)
    expect(result.asset.signal).toBe(0)
  })
})
