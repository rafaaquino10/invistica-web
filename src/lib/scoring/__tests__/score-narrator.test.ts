import { describe, it, expect } from 'vitest'
import { generateNarrative } from '../score-narrator'
import type { AqScoreResult } from '../iq-score'
import type { RegimeConfig } from '../regime-detector'

// ─── Helpers ────────────────────────────────────────────────────────

function makeResult(overrides: Partial<AqScoreResult> & { score: number; classificacao: AqScoreResult['classificacao'] }): AqScoreResult {
  const defaults: AqScoreResult = {
    ticker: 'TEST3',
    score: 50,
    classificacao: 'Atenção',
    pilares: {
      valuation:    { nota: 60, pesoEfetivo: 0.25, subNotas: [], destaque: '' },
      qualidade:    { nota: 55, pesoEfetivo: 0.25, subNotas: [], destaque: '' },
      risco:        { nota: 50, pesoEfetivo: 0.20, subNotas: [], destaque: '' },
      dividendos:   { nota: 45, pesoEfetivo: 0.15, subNotas: [], destaque: '' },
      crescimento:  { nota: 40, pesoEfetivo: 0.15, subNotas: [], destaque: '' },
      qualitativo:  { nota: 50, pesoEfetivo: 0.13, subNotas: [], destaque: '' },
    },
    sectorBenchmarks: { fairPE: 15, targetROE: 15, typicalMargin: 10, maxDebtEbitda: 3 },
    ajustes: {
      filtroLiquidez: 0, fatorLiquidez: 1, fatorConfianca: 1, fatorMacro: 1,
      macroReason: null, penalPatrimNegativo: false, penalTriploNegativo: false,
      sanityWarnings: [], scoreBruto: 50, total: 0,
      betaPenalty: { applied: false, beta: null, penaltyFactor: 1.0, regime: 'sem_regime' },
      cagedAdjustment: { applied: false, trend: null, adjustment: 0 },
      sentimentAdjustment: { applied: false, factor: 1.0, reason: null },
      trendAdjustment: { applied: false, score: 0 },
    },
    contrarian: { triggered: false, reason: null, indicators: [] },
    metadata: {
      dataCalculo: new Date(), indicadoresDisponiveis: 14,
      indicadoresTotais: 20, confiabilidade: 78,
    },
  }
  return { ...defaults, ...overrides }
}

const riskOff: RegimeConfig = {
  regime: 'risk_off',
  pillarWeights: { valuation: 0.18, quality: 0.20, risk: 0.27, dividends: 0.25, growth: 0.10 },
  description: 'Juros reais elevados — foco em solidez, baixo endividamento e dividendos',
  selicReal: NaN,
  inputSelic: 14,
  inputIpca: 0,
}

const riskOn: RegimeConfig = {
  regime: 'risk_on',
  pillarWeights: { valuation: 0.25, quality: 0.18, risk: 0.12, dividends: 0.10, growth: 0.35 },
  description: 'Juros reais baixos — foco em crescimento e valuation de longo prazo',
  selicReal: NaN,
  inputSelic: 5,
  inputIpca: 0,
}

const neutral: RegimeConfig = {
  regime: 'neutral',
  pillarWeights: { valuation: 0.25, quality: 0.25, risk: 0.20, dividends: 0.15, growth: 0.15 },
  description: 'Regime neutro — pesos equilibrados',
  selicReal: NaN,
  inputSelic: 10,
  inputIpca: 0,
}

// ─── Tests ──────────────────────────────────────────────────────────

describe('generateNarrative', () => {
  // ─── Badge ──────────────────────────────────────────────────
  it('should return correct badge for Excepcional', () => {
    const result = makeResult({ score: 85, classificacao: 'Excepcional', ticker: 'WEGE3' })
    const narrative = generateNarrative(result)
    expect(narrative.badge.label).toBe('Excepcional')
    expect(narrative.badge.color).toBe('#1A73E8')
  })

  it('should return correct badge for Saudável', () => {
    const result = makeResult({ score: 70, classificacao: 'Saudável' })
    const narrative = generateNarrative(result)
    expect(narrative.badge.label).toBe('Saudável')
    expect(narrative.badge.color).toBe('#0D9488')
  })

  it('should return correct badge for Atenção', () => {
    const result = makeResult({ score: 45, classificacao: 'Atenção' })
    const narrative = generateNarrative(result)
    expect(narrative.badge.label).toBe('Atenção')
    expect(narrative.badge.color).toBe('#D97706')
  })

  it('should return correct badge for Crítico', () => {
    const result = makeResult({ score: 20, classificacao: 'Crítico' })
    const narrative = generateNarrative(result)
    expect(narrative.badge.label).toBe('Crítico')
    expect(narrative.badge.color).toBe('#EF4444')
  })

  // ─── One-liner ──────────────────────────────────────────────
  it('Excepcional oneLiner mentions ticker', () => {
    const result = makeResult({ score: 90, classificacao: 'Excepcional', ticker: 'WEGE3' })
    const narrative = generateNarrative(result)
    expect(narrative.oneLiner).toContain('Excepcional')
    expect(narrative.oneLiner).toContain('WEGE3')
  })

  it('Saudável oneLiner highlights best pillar', () => {
    const result = makeResult({
      score: 70, classificacao: 'Saudável',
      pilares: {
        valuation:   { nota: 90, pesoEfetivo: 0.25, subNotas: [], destaque: '' },
        qualidade:   { nota: 70, pesoEfetivo: 0.25, subNotas: [], destaque: '' },
        risco:       { nota: 60, pesoEfetivo: 0.20, subNotas: [], destaque: '' },
        dividendos:  { nota: 50, pesoEfetivo: 0.15, subNotas: [], destaque: '' },
        crescimento: { nota: 40, pesoEfetivo: 0.15, subNotas: [], destaque: '' },
        qualitativo: { nota: 50, pesoEfetivo: 0.13, subNotas: [], destaque: '' },
      },
    })
    const narrative = generateNarrative(result)
    expect(narrative.oneLiner).toContain('Valuation')
  })

  it('Atenção oneLiner mentions worst pillar', () => {
    const result = makeResult({
      score: 45, classificacao: 'Atenção',
      pilares: {
        valuation:   { nota: 60, pesoEfetivo: 0.25, subNotas: [], destaque: '' },
        qualidade:   { nota: 55, pesoEfetivo: 0.25, subNotas: [], destaque: '' },
        risco:       { nota: 50, pesoEfetivo: 0.20, subNotas: [], destaque: '' },
        dividendos:  { nota: 45, pesoEfetivo: 0.15, subNotas: [], destaque: '' },
        crescimento: { nota: 20, pesoEfetivo: 0.15, subNotas: [], destaque: '' },
        qualitativo: { nota: 50, pesoEfetivo: 0.13, subNotas: [], destaque: '' },
      },
    })
    const narrative = generateNarrative(result)
    expect(narrative.oneLiner).toContain('Crescimento')
  })

  it('Crítico oneLiner mentions múltiplos indicadores', () => {
    const result = makeResult({ score: 15, classificacao: 'Crítico' })
    const narrative = generateNarrative(result)
    expect(narrative.oneLiner).toContain('múltiplos indicadores')
  })

  // ─── Research Note ──────────────────────────────────────────
  it('research note contains score and classificação', () => {
    const result = makeResult({ score: 72, classificacao: 'Saudável', ticker: 'ITUB4' })
    const narrative = generateNarrative(result, neutral)
    expect(narrative.researchNote).toContain('72')
    expect(narrative.researchNote).toContain('Saudável')
    expect(narrative.researchNote).toContain('ITUB4')
  })

  it('research note mentions patrimônio negativo penalty', () => {
    const result = makeResult({
      score: 20, classificacao: 'Crítico',
      ajustes: {
        filtroLiquidez: 0, fatorLiquidez: 1, fatorConfianca: 1, fatorMacro: 1,
        macroReason: null, penalPatrimNegativo: true, penalTriploNegativo: false,
        sanityWarnings: [], scoreBruto: 50, total: -30,
        betaPenalty: { applied: false, beta: null, penaltyFactor: 1.0, regime: 'sem_regime' },
        cagedAdjustment: { applied: false, trend: null, adjustment: 0 },
        sentimentAdjustment: { applied: false, factor: 1.0, reason: null },
        trendAdjustment: { applied: false, score: 0 },
      },
    })
    const narrative = generateNarrative(result)
    expect(narrative.researchNote).toContain('patrimônio líquido negativo')
  })

  it('research note mentions low confidence', () => {
    const result = makeResult({
      score: 45, classificacao: 'Atenção',
      metadata: {
        dataCalculo: new Date(), indicadoresDisponiveis: 6,
        indicadoresTotais: 18, confiabilidade: 33,
      },
    })
    const narrative = generateNarrative(result)
    expect(narrative.researchNote).toContain('confiabilidade')
    expect(narrative.researchNote).toContain('33%')
  })

  it('research note adapts to risk_off regime with good dividends', () => {
    const result = makeResult({
      score: 70, classificacao: 'Saudável',
      pilares: {
        valuation:   { nota: 60, pesoEfetivo: 0.25, subNotas: [], destaque: '' },
        qualidade:   { nota: 65, pesoEfetivo: 0.25, subNotas: [], destaque: '' },
        risco:       { nota: 70, pesoEfetivo: 0.20, subNotas: [], destaque: '' },
        dividendos:  { nota: 85, pesoEfetivo: 0.15, subNotas: [], destaque: '' },
        crescimento: { nota: 50, pesoEfetivo: 0.15, subNotas: [], destaque: '' },
        qualitativo: { nota: 50, pesoEfetivo: 0.13, subNotas: [], destaque: '' },
      },
    })
    const narrative = generateNarrative(result, riskOff)
    expect(narrative.researchNote).toContain('Dividendos')
    expect(narrative.researchNote).toContain('juros altos')
  })

  it('research note adapts to risk_on regime with good growth', () => {
    const result = makeResult({
      score: 70, classificacao: 'Saudável',
      pilares: {
        valuation:   { nota: 60, pesoEfetivo: 0.25, subNotas: [], destaque: '' },
        qualidade:   { nota: 65, pesoEfetivo: 0.25, subNotas: [], destaque: '' },
        risco:       { nota: 70, pesoEfetivo: 0.20, subNotas: [], destaque: '' },
        dividendos:  { nota: 50, pesoEfetivo: 0.15, subNotas: [], destaque: '' },
        crescimento: { nota: 80, pesoEfetivo: 0.15, subNotas: [], destaque: '' },
        qualitativo: { nota: 50, pesoEfetivo: 0.13, subNotas: [], destaque: '' },
      },
    })
    const narrative = generateNarrative(result, riskOn)
    expect(narrative.researchNote).toContain('Crescimento')
    expect(narrative.researchNote).toContain('juros baixos')
  })

  // ─── Highlights ─────────────────────────────────────────────
  it('strengths include pillars >= 60', () => {
    const result = makeResult({
      score: 70, classificacao: 'Saudável',
      pilares: {
        valuation:   { nota: 80, pesoEfetivo: 0.25, subNotas: [], destaque: '' },
        qualidade:   { nota: 75, pesoEfetivo: 0.25, subNotas: [], destaque: '' },
        risco:       { nota: 60, pesoEfetivo: 0.20, subNotas: [], destaque: '' },
        dividendos:  { nota: 35, pesoEfetivo: 0.15, subNotas: [], destaque: '' },
        crescimento: { nota: 30, pesoEfetivo: 0.15, subNotas: [], destaque: '' },
        qualitativo: { nota: 50, pesoEfetivo: 0.13, subNotas: [], destaque: '' },
      },
    })
    const narrative = generateNarrative(result)
    expect(narrative.highlights.strengths).toHaveLength(3)
    expect(narrative.highlights.strengths[0]).toContain('Valuation')
  })

  it('weaknesses include pillars < 40', () => {
    const result = makeResult({
      score: 40, classificacao: 'Atenção',
      pilares: {
        valuation:   { nota: 70, pesoEfetivo: 0.25, subNotas: [], destaque: '' },
        qualidade:   { nota: 60, pesoEfetivo: 0.25, subNotas: [], destaque: '' },
        risco:       { nota: 30, pesoEfetivo: 0.20, subNotas: [], destaque: '' },
        dividendos:  { nota: 15, pesoEfetivo: 0.15, subNotas: [], destaque: '' },
        crescimento: { nota: 10, pesoEfetivo: 0.15, subNotas: [], destaque: '' },
        qualitativo: { nota: 50, pesoEfetivo: 0.13, subNotas: [], destaque: '' },
      },
    })
    const narrative = generateNarrative(result)
    expect(narrative.highlights.weaknesses).toHaveLength(3)
    expect(narrative.highlights.weaknesses[0]).toContain('Crescimento')
  })

  it('context reflects regime', () => {
    const result = makeResult({ score: 50, classificacao: 'Atenção' })
    expect(generateNarrative(result, riskOff).highlights.context).toContain('juros altos')
    expect(generateNarrative(result, riskOn).highlights.context).toContain('juros baixos')
    expect(generateNarrative(result, neutral).highlights.context).toContain('neutro')
  })

  it('context fallback when no regime', () => {
    const result = makeResult({ score: 50, classificacao: 'Atenção' })
    const narrative = generateNarrative(result)
    expect(narrative.highlights.context).toContain('Sem dados')
  })

  // ─── Max 3 strengths/weaknesses ─────────────────────────────
  it('strengths capped at 3', () => {
    const result = makeResult({
      score: 85, classificacao: 'Excepcional',
      pilares: {
        valuation:   { nota: 90, pesoEfetivo: 0.25, subNotas: [], destaque: '' },
        qualidade:   { nota: 85, pesoEfetivo: 0.25, subNotas: [], destaque: '' },
        risco:       { nota: 80, pesoEfetivo: 0.20, subNotas: [], destaque: '' },
        dividendos:  { nota: 75, pesoEfetivo: 0.15, subNotas: [], destaque: '' },
        crescimento: { nota: 70, pesoEfetivo: 0.15, subNotas: [], destaque: '' },
        qualitativo: { nota: 50, pesoEfetivo: 0.13, subNotas: [], destaque: '' },
      },
    })
    const narrative = generateNarrative(result)
    expect(narrative.highlights.strengths.length).toBeLessThanOrEqual(3)
  })
})
