import { describe, it, expect } from 'vitest'
import {
  normalizePercentage,
  normalizeFundamentalPercentages,
  PERCENTAGE_FIELDS,
} from '../normalize-percentage'

describe('normalizePercentage', () => {
  // ─── Null/undefined/NaN handling ──────────────────────────
  it('retorna null para null', () => {
    expect(normalizePercentage(null)).toBeNull()
  })

  it('retorna null para undefined', () => {
    expect(normalizePercentage(undefined)).toBeNull()
  })

  it('retorna null para NaN', () => {
    expect(normalizePercentage(NaN)).toBeNull()
  })

  // ─── Gateway/demo: whole numbers passam direto ────────────
  it('mantém whole number de gateway inalterado (13.84)', () => {
    expect(normalizePercentage(13.84, 'gateway')).toBe(13.84)
  })

  it('mantém whole number de demo inalterado (25.5)', () => {
    expect(normalizePercentage(25.5, 'demo')).toBe(25.5)
  })

  it('mantém zero inalterado', () => {
    expect(normalizePercentage(0, 'gateway')).toBe(0)
  })

  it('mantém valores negativos whole number inalterados (-5.2)', () => {
    expect(normalizePercentage(-5.2, 'gateway')).toBe(-5.2)
  })

  // ─── CVM: detecta decimal e converte ─────────────────────
  it('converte decimal CVM para whole number (0.1384 → 13.84)', () => {
    expect(normalizePercentage(0.1384, 'cvm')).toBe(13.84)
  })

  it('converte decimal negativo CVM (-0.05 → -5.00)', () => {
    expect(normalizePercentage(-0.05, 'cvm')).toBe(-5)
  })

  it('converte decimal brapi para whole number (0.2550 → 25.50)', () => {
    expect(normalizePercentage(0.255, 'brapi')).toBe(25.5)
  })

  it('NÃO converte CVM se valor >= 1 (já é whole number)', () => {
    expect(normalizePercentage(13.84, 'cvm')).toBe(13.84)
  })

  it('NÃO converte CVM se valor é zero', () => {
    expect(normalizePercentage(0, 'cvm')).toBe(0)
  })

  // ─── Unknown source: conservador, não converte ────────────
  it('mantém valor inalterado com source unknown', () => {
    expect(normalizePercentage(0.15, 'unknown')).toBe(0.15)
  })

  it('mantém valor inalterado sem source (default)', () => {
    expect(normalizePercentage(0.15)).toBe(0.15)
  })
})

describe('normalizeFundamentalPercentages', () => {
  it('normaliza apenas campos percentuais', () => {
    const input = {
      peRatio: 15.2,        // ratio — não deve ser alterado
      roe: 13.84,           // percentual — whole number, mantém
      margemEbit: 0.25,     // se fosse CVM, converteria
      liquidezCorrente: 1.5, // ratio — não deve ser alterado
    }

    // Com source 'gateway', nenhuma conversão (já são whole numbers)
    const result = normalizeFundamentalPercentages(input, 'gateway')
    expect(result.peRatio).toBe(15.2)
    expect(result.roe).toBe(13.84)
    expect(result.margemEbit).toBe(0.25)
    expect(result.liquidezCorrente).toBe(1.5)
  })

  it('converte campos percentuais com source cvm', () => {
    const input = {
      roe: 0.1384,
      roic: 0.08,
      margemEbit: 0.22,
      margemLiquida: 0.15,
      dividendYield: 0.05,
      crescimentoReceita5a: 0.12,
      peRatio: 15.2,  // não-percentual, não toca
    }

    const result = normalizeFundamentalPercentages(input, 'cvm')
    expect(result.roe).toBe(13.84)
    expect(result.roic).toBe(8)
    expect(result.margemEbit).toBe(22)
    expect(result.margemLiquida).toBe(15)
    expect(result.dividendYield).toBe(5)
    expect(result.crescimentoReceita5a).toBe(12)
    expect(result.peRatio).toBe(15.2)  // inalterado
  })

  it('lida com null em campos percentuais', () => {
    const input = {
      roe: null,
      roic: undefined,
      margemEbit: 22.5,
    }

    const result = normalizeFundamentalPercentages(input, 'gateway')
    expect(result.roe).toBeNull()
    expect(result.roic).toBeNull()
    expect(result.margemEbit).toBe(22.5)
  })
})

describe('PERCENTAGE_FIELDS', () => {
  it('contém os 6 campos percentuais esperados', () => {
    expect(PERCENTAGE_FIELDS).toContain('roe')
    expect(PERCENTAGE_FIELDS).toContain('roic')
    expect(PERCENTAGE_FIELDS).toContain('margemEbit')
    expect(PERCENTAGE_FIELDS).toContain('margemLiquida')
    expect(PERCENTAGE_FIELDS).toContain('dividendYield')
    expect(PERCENTAGE_FIELDS).toContain('crescimentoReceita5a')
    expect(PERCENTAGE_FIELDS).toHaveLength(6)
  })
})
