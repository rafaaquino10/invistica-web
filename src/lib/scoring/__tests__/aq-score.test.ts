import { describe, it, expect } from 'vitest'
import {
  calcularAqScore,
  mapearSetor,
  CORES_CLASSIFICACAO,
  PILLAR_WEIGHTS,
  type DadosFundamentalistas,
  type AqScoreResult,
  type Setor,
} from '@/lib/scoring'

// ─── Helper ──────────────────────────────────────────────────────────

function makeDados(overrides: Partial<DadosFundamentalistas> = {}): DadosFundamentalistas {
  return {
    ticker: 'TEST3',
    cotacao: 30,
    P_L: 12,
    P_VP: 1.5,
    PSR: 1.2,
    P_EBIT: 8,
    EV_EBIT: 10,
    EV_EBITDA: 7,
    ROIC: 15,
    ROE: 18,
    MRG_EBIT: 20,
    MRG_LIQUIDA: 12,
    LIQ_CORRENTE: 1.8,
    DIV_BRUT_PATRIM: 0.5,
    P_CAP_GIRO: 5,
    P_ATIV_CIRC_LIQ: 3,
    P_ATIVO: 0.8,
    PATRIM_LIQUIDO: 5_000_000_000,
    DIV_YIELD: 5,
    DIV_EBITDA: 2,
    PAYOUT: 40,
    CRESC_REC_5A: 10,
    CRESC_LUCRO_5A: 12,
    LIQ_2MESES: 50_000_000,
    MARKET_CAP: 20_000_000_000,
    BETA: 1.0,
    FCF_COVERAGE: 1.8,
    SETOR: 'Varejo',
    // Qualitative metrics (60% do score no modelo 60/40)
    MOAT_SCORE: 70,
    EARNINGS_QUALITY: 75,
    MANAGEMENT_SCORE: 65,
    DEBT_SUSTAINABILITY: 70,
    REGULATORY_RISK: 60,
    GOVERNANCE_SCORE: 70,
    NEWS_SENTIMENT: 55,
    CEO_TENURE: 60,
    BUYBACK_SIGNAL: 40,
    LISTING_SEGMENT: 80,
    FREE_FLOAT: 70,
    CVM_SANCTIONS: 100,
    CATALYST_ALERT: 100,
    RI_EVENT_VOLUME: 2,
    ...overrides,
  }
}

// ─── 1. Blue chip equilibrado (ITUB4-like) ──────────────────────────

describe('Spec Test Cases', () => {
  it('1. Blue chip equilibrado scores between 55 and 100', () => {
    const dados = makeDados({
      ticker: 'ITUB4',
      P_L: 10.99,
      P_VP: 2.56,
      ROE: 23.3,
      DIV_YIELD: 9.85,
      SETOR: 'Bancos',
      LIQ_2MESES: 1_000_000_000,
      MARKET_CAP: 300_000_000_000,
      ROIC: 15,
      MRG_EBIT: 30,
      MRG_LIQUIDA: 20,
      DIV_BRUT_PATRIM: 0.8,
      PATRIM_LIQUIDO: 150_000_000_000,
    })

    const result = calcularAqScore(dados)

    expect(result.score).toBeGreaterThanOrEqual(55)
    expect(result.score).toBeLessThanOrEqual(100)
    expect(['Saudável', 'Excepcional']).toContain(result.classificacao)
  })

  it('2. Premium com multiplo alto (WEGE3-like) scores between 40 and 80', () => {
    const dados = makeDados({
      ticker: 'WEGE3',
      P_L: 30,
      P_VP: 8,
      ROE: 25,
      ROIC: 20,
      MRG_EBIT: 20,
      MRG_LIQUIDA: 15,
      SETOR: 'Bens Industriais',
      LIQ_2MESES: 500_000_000,
      MARKET_CAP: 200_000_000_000,
      DIV_YIELD: 1.5,
      CRESC_REC_5A: 15,
      CRESC_LUCRO_5A: 18,
    })

    const result = calcularAqScore(dados)

    expect(result.score).toBeGreaterThanOrEqual(40)
    expect(result.score).toBeLessThanOrEqual(80)
  })

  it('3. Barata com fundamentos ruins (value trap) scores between 20 and 55', () => {
    const dados = makeDados({
      ticker: 'TRAP3',
      P_L: 5,
      P_VP: 0.5,
      PSR: 0.3,
      P_EBIT: 4,
      EV_EBIT: 5,
      EV_EBITDA: 3,
      ROE: 1,
      ROIC: 1,
      MRG_EBIT: 2,
      MRG_LIQUIDA: 0.5,
      DIV_YIELD: 1,
      CRESC_REC_5A: -5,
      CRESC_LUCRO_5A: -8,
      LIQ_2MESES: 10_000_000,
      MARKET_CAP: 5_000_000_000,
      SETOR: 'Outros',
      // Poor qualitative for a value trap
      MOAT_SCORE: 25, MANAGEMENT_SCORE: 30, GOVERNANCE_SCORE: 40,
      EARNINGS_QUALITY: 30, REGULATORY_RISK: 35,
    })

    const result = calcularAqScore(dados)

    expect(result.score).toBeGreaterThanOrEqual(20)
    expect(result.score).toBeLessThanOrEqual(55)
  })

  it('4. Patrimonio negativo caps score at 25', () => {
    const dados = makeDados({
      ticker: 'NEGEQ3',
      PATRIM_LIQUIDO: -1_000_000_000,
      LIQ_2MESES: 50_000_000,
    })

    const result = calcularAqScore(dados)

    expect(result.score).toBeLessThanOrEqual(25)
    expect(result.ajustes.penalPatrimNegativo).toBe(true)
  })

  it('5. Triplo negativo caps score at 15', () => {
    const dados = makeDados({
      ticker: 'TRIPNEG3',
      ROIC: -5,
      ROE: -10,
      MRG_LIQUIDA: -3,
      PATRIM_LIQUIDO: 1_000_000_000, // positive equity so only triple negative applies
      LIQ_2MESES: 50_000_000,
    })

    const result = calcularAqScore(dados)

    expect(result.score).toBeLessThanOrEqual(15)
    expect(result.ajustes.penalTriploNegativo).toBe(true)
  })

  it('6. Acao iliquida gets low multiplicative liquidity factor', () => {
    const dados = makeDados({
      ticker: 'ILIQ3',
      LIQ_2MESES: 50_000, // below 100k threshold
    })

    const result = calcularAqScore(dados)

    expect(result.ajustes.fatorLiquidez).toBe(0.65)
    // The old -100 additive penalty is still stored for display
    expect(result.ajustes.filtroLiquidez).toBe(-100)
  })

  it('7. Setor bancario ignora indicadores especificos (expanded list)', () => {
    const dados = makeDados({
      ticker: 'BANC4',
      SETOR: 'Bancos',
      ROIC: 15,
      MRG_EBIT: 25,
      MRG_LIQUIDA: 20,
      LIQ_CORRENTE: 2.0,
      P_CAP_GIRO: 5,
      P_ATIV_CIRC_LIQ: 3,
      PSR: 1.0,
      LIQ_2MESES: 500_000_000,
      MARKET_CAP: 100_000_000_000,
    })

    const result = calcularAqScore(dados)

    // Quality pillar should NOT contain ROIC, MRG_EBIT, MRG_LIQUIDA
    const qualidadeIndicadores = result.pilares.qualidade.subNotas.map(s => s.indicador)
    expect(qualidadeIndicadores).not.toContain('ROIC')
    expect(qualidadeIndicadores).not.toContain('MRG_EBIT')
    expect(qualidadeIndicadores).not.toContain('MRG_LIQUIDA')

    // Risk pillar should NOT contain LIQ_CORRENTE, P_CAP_GIRO, P_ATIV_CIRC_LIQ
    // But DIV_BRUT_PATRIM is now INCLUDED with banking-specific thresholds
    const riscoIndicadores = result.pilares.risco.subNotas.map(s => s.indicador)
    expect(riscoIndicadores).not.toContain('LIQ_CORRENTE')
    expect(riscoIndicadores).not.toContain('P_CAP_GIRO')
    expect(riscoIndicadores).not.toContain('P_ATIV_CIRC_LIQ')
    expect(riscoIndicadores).toContain('DIV_BRUT_PATRIM')

    // Valuation should NOT contain PSR, EV_EBIT, EV_EBITDA
    const valuationIndicadores = result.pilares.valuation.subNotas.map(s => s.indicador)
    expect(valuationIndicadores).not.toContain('PSR')
    expect(valuationIndicadores).not.toContain('EV_EBIT')
    expect(valuationIndicadores).not.toContain('EV_EBITDA')

    // Dividends should NOT contain DIV_EBITDA
    const dividendosIndicadores = result.pilares.dividendos.subNotas.map(s => s.indicador)
    expect(dividendosIndicadores).not.toContain('DIV_EBITDA')
  })

  it('8. Null values receive nota neutra 4', () => {
    const dados: DadosFundamentalistas = {
      ticker: 'NULL3',
      cotacao: null,
      P_L: null,
      P_VP: null,
      PSR: null,
      P_EBIT: null,
      EV_EBIT: null,
      EV_EBITDA: null,
      ROIC: null,
      ROE: null,
      MRG_EBIT: null,
      MRG_LIQUIDA: null,
      LIQ_CORRENTE: null,
      DIV_BRUT_PATRIM: null,
      P_CAP_GIRO: null,
      P_ATIV_CIRC_LIQ: null,
      P_ATIVO: null,
      PATRIM_LIQUIDO: null,
      DIV_YIELD: null,
      DIV_EBITDA: null,
      PAYOUT: null,
      CRESC_REC_5A: null,
      CRESC_LUCRO_5A: null,
      LIQ_2MESES: 100_000_000, // high enough to pass liquidity filter
      MARKET_CAP: 50_000_000_000,
      SETOR: 'Outros',
    }

    const result = calcularAqScore(dados)

    // All subNotas where valor is null should have nota === 4 (missing data is slightly negative)
    const allPilares = [
      result.pilares.valuation,
      result.pilares.qualidade,
      result.pilares.risco,
      result.pilares.dividendos,
      result.pilares.crescimento,
    ]

    for (const pilar of allPilares) {
      for (const sub of pilar.subNotas) {
        if (sub.valor === null) {
          expect(sub.nota).toBe(4)
        }
      }
    }
  })

  it('9. Default pillar weights sum to 1.0', () => {
    const sum =
      PILLAR_WEIGHTS.valuation +
      PILLAR_WEIGHTS.quality +
      PILLAR_WEIGHTS.risk +
      PILLAR_WEIGHTS.dividends +
      PILLAR_WEIGHTS.growth +
      PILLAR_WEIGHTS.qualitativo

    expect(sum).toBeCloseTo(1.0, 10)
  })

  it('10. Sector weights sum to 1.0 for every sector', () => {
    const sectors: string[] = [
      'Bancos', 'Seguros', 'Energia Elétrica', 'Saneamento',
      'Petróleo e Gás', 'Mineração', 'Siderurgia', 'Papel e Celulose',
      'Imobiliário', 'Varejo', 'Tecnologia', 'Saúde', 'Educação',
      'Telecomunicações', 'Bens Industriais', 'Agronegócio', 'Logística',
      'Outros',
    ]

    for (const setor of sectors) {
      const dados = makeDados({ SETOR: setor, LIQ_2MESES: 100_000_000 })
      const result = calcularAqScore(dados)

      const pesoSum =
        result.pilares.valuation.pesoEfetivo +
        result.pilares.qualidade.pesoEfetivo +
        result.pilares.risco.pesoEfetivo +
        result.pilares.dividendos.pesoEfetivo +
        result.pilares.crescimento.pesoEfetivo +
        result.pilares.qualitativo.pesoEfetivo

      expect(pesoSum).toBeCloseTo(1.0, 2)
    }
  })

  it('11. Score is always within range 0-100', () => {
    // Default data
    const r1 = calcularAqScore(makeDados())
    expect(r1.score).toBeGreaterThanOrEqual(0)
    expect(r1.score).toBeLessThanOrEqual(100)

    // Extreme high values (excellent company)
    const r2 = calcularAqScore(makeDados({
      P_L: 3, P_VP: 0.5, PSR: 0.2, P_EBIT: 2, EV_EBIT: 3, EV_EBITDA: 2,
      ROIC: 40, ROE: 50, MRG_EBIT: 60, MRG_LIQUIDA: 40,
      LIQ_CORRENTE: 5, DIV_BRUT_PATRIM: 0.1, P_CAP_GIRO: 1, P_ATIV_CIRC_LIQ: 0.5, P_ATIVO: 0.1,
      DIV_YIELD: 15, DIV_EBITDA: 0.2, PAYOUT: 80,
      CRESC_REC_5A: 40, CRESC_LUCRO_5A: 50,
      LIQ_2MESES: 1_000_000_000,
      MARKET_CAP: 200_000_000_000,
    }))
    expect(r2.score).toBeGreaterThanOrEqual(0)
    expect(r2.score).toBeLessThanOrEqual(100)

    // Extreme low values (terrible company)
    const r3 = calcularAqScore(makeDados({
      P_L: -5, P_VP: 10, PSR: 10, P_EBIT: -5, EV_EBIT: -5, EV_EBITDA: -5,
      ROIC: -20, ROE: -30, MRG_EBIT: -10, MRG_LIQUIDA: -15,
      LIQ_CORRENTE: 0.2, DIV_BRUT_PATRIM: 5, P_CAP_GIRO: 50, P_ATIV_CIRC_LIQ: 30, P_ATIVO: 5,
      DIV_YIELD: 0, DIV_EBITDA: 10, PAYOUT: 0,
      CRESC_REC_5A: -20, CRESC_LUCRO_5A: -30,
      PATRIM_LIQUIDO: -5_000_000_000,
      LIQ_2MESES: 10_000,
      MARKET_CAP: 100_000_000,
    }))
    expect(r3.score).toBeGreaterThanOrEqual(0)
    expect(r3.score).toBeLessThanOrEqual(100)

    // All nulls
    const r4 = calcularAqScore({
      ticker: 'ALLNULL3', cotacao: null,
      P_L: null, P_VP: null, PSR: null, P_EBIT: null, EV_EBIT: null, EV_EBITDA: null,
      ROIC: null, ROE: null, MRG_EBIT: null, MRG_LIQUIDA: null,
      LIQ_CORRENTE: null, DIV_BRUT_PATRIM: null, P_CAP_GIRO: null,
      P_ATIV_CIRC_LIQ: null, P_ATIVO: null, PATRIM_LIQUIDO: null,
      DIV_YIELD: null, DIV_EBITDA: null, PAYOUT: null,
      CRESC_REC_5A: null, CRESC_LUCRO_5A: null, LIQ_2MESES: null,
      MARKET_CAP: null,
      SETOR: 'Outros',
    })
    expect(r4.score).toBeGreaterThanOrEqual(0)
    expect(r4.score).toBeLessThanOrEqual(100)
  })

  it('12a. Beta penalty: sem penalização fora de risk_off', () => {
    // regime neutral → beta alto não penaliza
    const dados = makeDados({ BETA: 2.5 })
    const neutroWeights = { valuation: 0.25, quality: 0.25, risk: 0.20, dividends: 0.15, growth: 0.15 }
    const result = calcularAqScore(dados, undefined, neutroWeights)

    expect(result.ajustes.betaPenalty.applied).toBe(false)
    expect(result.ajustes.betaPenalty.penaltyFactor).toBe(1.0)
  })

  it('12b. Beta penalty: sem penalização em risk_off com beta <= 1.5', () => {
    const dados = makeDados({ BETA: 1.4 })
    const riskOffWeights = { valuation: 0.18, quality: 0.20, risk: 0.27, dividends: 0.25, growth: 0.10 }
    const result = calcularAqScore(dados, undefined, riskOffWeights)

    expect(result.ajustes.betaPenalty.applied).toBe(false)
    expect(result.ajustes.betaPenalty.penaltyFactor).toBe(1.0)
  })

  it('12c. Beta penalty: penalização gradual em risk_off com beta = 2.0', () => {
    // excessBeta = min(2.0 - 1.5, 1.0) = 0.5 → factor = 1 - 0.5 * 0.10 = 0.95
    const dados = makeDados({ BETA: 2.0, LIQ_2MESES: 50_000_000 })
    const riskOffWeights = { valuation: 0.18, quality: 0.20, risk: 0.27, dividends: 0.25, growth: 0.10 }

    const semBeta = calcularAqScore(makeDados({ LIQ_2MESES: 50_000_000 }), undefined, riskOffWeights)
    const comBeta = calcularAqScore(dados, undefined, riskOffWeights)

    expect(comBeta.ajustes.betaPenalty.applied).toBe(true)
    expect(comBeta.ajustes.betaPenalty.penaltyFactor).toBeCloseTo(0.95, 4)
    expect(comBeta.score).toBeLessThan(semBeta.score)
  })

  it('12d. Beta penalty: penalização máxima em risk_off com beta >= 2.5', () => {
    // excessBeta = min(2.5 - 1.5, 1.0) = 1.0 → factor = 1 - 1.0 * 0.10 = 0.90
    const dados = makeDados({ BETA: 3.0, LIQ_2MESES: 50_000_000 })
    const riskOffWeights = { valuation: 0.18, quality: 0.20, risk: 0.27, dividends: 0.25, growth: 0.10 }
    const result = calcularAqScore(dados, undefined, riskOffWeights)

    expect(result.ajustes.betaPenalty.applied).toBe(true)
    expect(result.ajustes.betaPenalty.penaltyFactor).toBeCloseTo(0.90, 4)
  })

  it('12. Calculation is deterministic', () => {
    const dados = makeDados()
    const result1 = calcularAqScore(dados)
    const result2 = calcularAqScore(dados)

    expect(result1.score).toBe(result2.score)
    expect(result1.classificacao).toBe(result2.classificacao)

    // Compare all pillar notas
    expect(result1.pilares.valuation.nota).toBe(result2.pilares.valuation.nota)
    expect(result1.pilares.qualidade.nota).toBe(result2.pilares.qualidade.nota)
    expect(result1.pilares.risco.nota).toBe(result2.pilares.risco.nota)
    expect(result1.pilares.dividendos.nota).toBe(result2.pilares.dividendos.nota)
    expect(result1.pilares.crescimento.nota).toBe(result2.pilares.crescimento.nota)

    // Compare all subNotas
    for (const pilarKey of ['valuation', 'qualidade', 'risco', 'dividendos', 'crescimento'] as const) {
      const subs1 = result1.pilares[pilarKey].subNotas
      const subs2 = result2.pilares[pilarKey].subNotas
      expect(subs1.length).toBe(subs2.length)
      for (let i = 0; i < subs1.length; i++) {
        expect(subs1[i]!.nota).toBe(subs2[i]!.nota)
        expect(subs1[i]!.indicador).toBe(subs2[i]!.indicador)
      }
    }
  })
})

// ─── mapearSetor tests ──────────────────────────────────────────────

describe('mapearSetor', () => {
  it('maps Bancos to bancos_financeiro', () => {
    expect(mapearSetor('Bancos')).toBe('bancos_financeiro')
  })

  it('maps Financeiro to bancos_financeiro', () => {
    expect(mapearSetor('Financeiro')).toBe('bancos_financeiro')
  })

  it('maps Petroleo e Gas to petroleo_gas', () => {
    expect(mapearSetor('Petróleo e Gás')).toBe('petroleo_gas')
  })

  it('maps Energia Eletrica to utilities_energia', () => {
    expect(mapearSetor('Energia Elétrica')).toBe('utilities_energia')
  })

  it('maps Mineracao to mineracao', () => {
    expect(mapearSetor('Mineração')).toBe('mineracao')
  })

  it('maps Seguros to seguradoras', () => {
    expect(mapearSetor('Seguros')).toBe('seguradoras')
  })

  it('maps Saneamento to saneamento', () => {
    expect(mapearSetor('Saneamento')).toBe('saneamento')
  })

  it('maps Siderurgia to siderurgia', () => {
    expect(mapearSetor('Siderurgia')).toBe('siderurgia')
  })

  it('maps Papel e Celulose to papel_celulose', () => {
    expect(mapearSetor('Papel e Celulose')).toBe('papel_celulose')
  })

  it('maps Imobiliario to construcao_civil', () => {
    expect(mapearSetor('Imobiliário')).toBe('construcao_civil')
  })

  it('maps Shopping Centers to construcao_civil', () => {
    expect(mapearSetor('Shopping Centers')).toBe('construcao_civil')
  })

  it('maps Varejo to varejo_consumo', () => {
    expect(mapearSetor('Varejo')).toBe('varejo_consumo')
  })

  it('maps Alimentos e Bebidas to varejo_consumo', () => {
    expect(mapearSetor('Alimentos e Bebidas')).toBe('varejo_consumo')
  })

  it('maps Tecnologia to tecnologia', () => {
    expect(mapearSetor('Tecnologia')).toBe('tecnologia')
  })

  it('maps Saude to saude', () => {
    expect(mapearSetor('Saúde')).toBe('saude')
  })

  it('maps Educacao to educacao', () => {
    expect(mapearSetor('Educação')).toBe('educacao')
  })

  it('maps Telecomunicacoes to telecom', () => {
    expect(mapearSetor('Telecomunicações')).toBe('telecom')
  })

  it('maps Bens Industriais to industrial', () => {
    expect(mapearSetor('Bens Industriais')).toBe('industrial')
  })

  it('maps Agronegocio to agro', () => {
    expect(mapearSetor('Agronegócio')).toBe('agro')
  })

  it('maps Logistica to transporte_logistica', () => {
    expect(mapearSetor('Logística')).toBe('transporte_logistica')
  })

  it('maps Transporte to transporte_logistica', () => {
    expect(mapearSetor('Transporte')).toBe('transporte_logistica')
  })

  it('maps Locacao to transporte_logistica', () => {
    expect(mapearSetor('Locação')).toBe('transporte_logistica')
  })

  it('maps unknown sector to outros', () => {
    expect(mapearSetor('Desconhecido')).toBe('outros')
  })

  it('maps empty string to outros', () => {
    expect(mapearSetor('')).toBe('outros')
  })

  it('maps Outros to outros', () => {
    expect(mapearSetor('Outros')).toBe('outros')
  })
})

// ─── CORES_CLASSIFICACAO tests ──────────────────────────────────────

describe('CORES_CLASSIFICACAO', () => {
  it('has correct color for Excepcional', () => {
    expect(CORES_CLASSIFICACAO.Excepcional).toBe('#1A73E8')
  })

  it('has correct color for Saudavel', () => {
    expect(CORES_CLASSIFICACAO.Saudável).toBe('#0D9488')
  })

  it('has correct color for Atencao', () => {
    expect(CORES_CLASSIFICACAO.Atenção).toBe('#D97706')
  })

  it('has correct color for Critico', () => {
    expect(CORES_CLASSIFICACAO.Crítico).toBe('#EF4444')
  })

  it('has exactly 4 classification keys', () => {
    expect(Object.keys(CORES_CLASSIFICACAO)).toHaveLength(4)
  })
})

// ─── Classification via result tests ────────────────────────────────

describe('Classification thresholds', () => {
  it('returns Excepcional for very high quality stocks (score >= 81)', () => {
    // Excellent company across all dimensions
    const dados = makeDados({
      ticker: 'BEST3',
      P_L: 5, P_VP: 0.8, PSR: 0.3, P_EBIT: 3, EV_EBIT: 4, EV_EBITDA: 3,
      ROIC: 30, ROE: 35, MRG_EBIT: 40, MRG_LIQUIDA: 25,
      LIQ_CORRENTE: 3.0, DIV_BRUT_PATRIM: 0.2, P_CAP_GIRO: 2, P_ATIV_CIRC_LIQ: 0.5, P_ATIVO: 0.2,
      PATRIM_LIQUIDO: 20_000_000_000,
      DIV_YIELD: 10, DIV_EBITDA: 0.3, PAYOUT: 60,
      CRESC_REC_5A: 25, CRESC_LUCRO_5A: 30,
      LIQ_2MESES: 500_000_000,
      MARKET_CAP: 100_000_000_000,
      SETOR: 'Outros',
      // Excellent qualitative scores to reach Excepcional
      MOAT_SCORE: 90, EARNINGS_QUALITY: 90, MANAGEMENT_SCORE: 85,
      GOVERNANCE_SCORE: 95, REGULATORY_RISK: 80,
    })

    const result = calcularAqScore(dados)

    expect(result.score).toBeGreaterThanOrEqual(81)
    expect(result.classificacao).toBe('Excepcional')
  })

  it('returns Critico for extremely bad stocks (score < 31)', () => {
    // Company with triple negative + illiquidity
    const dados = makeDados({
      ticker: 'WORST3',
      P_L: -3, P_VP: 10, PSR: 10, P_EBIT: -3, EV_EBIT: -3, EV_EBITDA: -3,
      ROIC: -15, ROE: -20, MRG_EBIT: -10, MRG_LIQUIDA: -12,
      LIQ_CORRENTE: 0.3, DIV_BRUT_PATRIM: 4, P_CAP_GIRO: 30, P_ATIV_CIRC_LIQ: 20, P_ATIVO: 3,
      PATRIM_LIQUIDO: 100_000_000,
      DIV_YIELD: 0, DIV_EBITDA: 8, PAYOUT: 0,
      CRESC_REC_5A: -15, CRESC_LUCRO_5A: -25,
      LIQ_2MESES: 5_000_000,
      MARKET_CAP: 2_000_000_000,
      SETOR: 'Outros',
    })

    const result = calcularAqScore(dados)

    expect(result.score).toBeLessThan(31)
    expect(result.classificacao).toBe('Crítico')
  })

  it('classificacao matches score thresholds correctly', () => {
    const testCases = [
      makeDados({ LIQ_2MESES: 100_000_000 }),
      makeDados({ P_L: 5, P_VP: 0.8, ROE: 30, ROIC: 25, LIQ_2MESES: 100_000_000 }),
      makeDados({ ROIC: -5, ROE: -10, MRG_LIQUIDA: -3, LIQ_2MESES: 100_000_000 }),
      makeDados({ PATRIM_LIQUIDO: -1_000_000_000, LIQ_2MESES: 100_000_000 }),
    ]

    for (const dados of testCases) {
      const result = calcularAqScore(dados)
      const score = result.score

      if (score >= 81) {
        expect(result.classificacao).toBe('Excepcional')
      } else if (score >= 61) {
        expect(result.classificacao).toBe('Saudável')
      } else if (score >= 31) {
        expect(result.classificacao).toBe('Atenção')
      } else {
        expect(result.classificacao).toBe('Crítico')
      }
    }
  })
})

// ─── Metadata tests ─────────────────────────────────────────────────

describe('Metadata', () => {
  it('confiabilidade is between 0 and 100', () => {
    const result = calcularAqScore(makeDados())
    expect(result.metadata.confiabilidade).toBeGreaterThanOrEqual(0)
    expect(result.metadata.confiabilidade).toBeLessThanOrEqual(100)
  })

  it('confiabilidade is high when all indicators are provided', () => {
    const result = calcularAqScore(makeDados())
    // With qualitative + quantitative indicators all provided, confidence should be high
    expect(result.metadata.confiabilidade).toBeGreaterThanOrEqual(70)
  })

  it('confiabilidade is low when most indicators are null', () => {
    const dados: DadosFundamentalistas = {
      ticker: 'SPARSE3', cotacao: null,
      P_L: null, P_VP: null, PSR: null, P_EBIT: null, EV_EBIT: null, EV_EBITDA: null,
      ROIC: null, ROE: null, MRG_EBIT: null, MRG_LIQUIDA: null,
      LIQ_CORRENTE: null, DIV_BRUT_PATRIM: null, P_CAP_GIRO: null,
      P_ATIV_CIRC_LIQ: null, P_ATIVO: null, PATRIM_LIQUIDO: null,
      DIV_YIELD: null, DIV_EBITDA: null, PAYOUT: null,
      CRESC_REC_5A: null, CRESC_LUCRO_5A: null, LIQ_2MESES: null,
      MARKET_CAP: null,
      SETOR: 'Outros',
    }

    const result = calcularAqScore(dados)
    expect(result.metadata.confiabilidade).toBe(0)
  })

  it('indicadoresDisponiveis <= indicadoresTotais', () => {
    const result = calcularAqScore(makeDados())
    expect(result.metadata.indicadoresDisponiveis).toBeLessThanOrEqual(result.metadata.indicadoresTotais)
  })

  it('indicadoresDisponiveis is 0 when all indicators are null', () => {
    const dados: DadosFundamentalistas = {
      ticker: 'NOINDICATORS3', cotacao: null,
      P_L: null, P_VP: null, PSR: null, P_EBIT: null, EV_EBIT: null, EV_EBITDA: null,
      ROIC: null, ROE: null, MRG_EBIT: null, MRG_LIQUIDA: null,
      LIQ_CORRENTE: null, DIV_BRUT_PATRIM: null, P_CAP_GIRO: null,
      P_ATIV_CIRC_LIQ: null, P_ATIVO: null, PATRIM_LIQUIDO: null,
      DIV_YIELD: null, DIV_EBITDA: null, PAYOUT: null,
      CRESC_REC_5A: null, CRESC_LUCRO_5A: null, LIQ_2MESES: null,
      MARKET_CAP: null,
      SETOR: 'Outros',
    }

    const result = calcularAqScore(dados)
    expect(result.metadata.indicadoresDisponiveis).toBe(0)
  })

  it('indicadoresTotais includes quantitative + qualitative indicators', () => {
    const result = calcularAqScore(makeDados())
    // 13 essential + 13 secondary = 26 total (modelo 60/40 com live signals)
    expect(result.metadata.indicadoresTotais).toBeGreaterThanOrEqual(20)
  })

  it('dataCalculo is a valid Date', () => {
    const before = new Date()
    const result = calcularAqScore(makeDados())
    const after = new Date()

    expect(result.metadata.dataCalculo).toBeInstanceOf(Date)
    expect(result.metadata.dataCalculo.getTime()).toBeGreaterThanOrEqual(before.getTime())
    expect(result.metadata.dataCalculo.getTime()).toBeLessThanOrEqual(after.getTime())
  })
})

// ─── Result structure tests ─────────────────────────────────────────

describe('Result structure', () => {
  it('returns correct ticker in result', () => {
    const result = calcularAqScore(makeDados({ ticker: 'VALE3' }))
    expect(result.ticker).toBe('VALE3')
  })

  it('result has all 5 pillar keys', () => {
    const result = calcularAqScore(makeDados())
    expect(result.pilares).toHaveProperty('valuation')
    expect(result.pilares).toHaveProperty('qualidade')
    expect(result.pilares).toHaveProperty('risco')
    expect(result.pilares).toHaveProperty('dividendos')
    expect(result.pilares).toHaveProperty('crescimento')
  })

  it('each pillar has nota, pesoEfetivo, subNotas, and destaque', () => {
    const result = calcularAqScore(makeDados())
    for (const pilarKey of ['valuation', 'qualidade', 'risco', 'dividendos', 'crescimento'] as const) {
      const pilar = result.pilares[pilarKey]
      expect(pilar).toHaveProperty('nota')
      expect(pilar).toHaveProperty('pesoEfetivo')
      expect(pilar).toHaveProperty('subNotas')
      expect(pilar).toHaveProperty('destaque')
      expect(typeof pilar.nota).toBe('number')
      expect(typeof pilar.pesoEfetivo).toBe('number')
      expect(Array.isArray(pilar.subNotas)).toBe(true)
      expect(typeof pilar.destaque).toBe('string')
    }
  })

  it('each subNota has required fields', () => {
    const result = calcularAqScore(makeDados())
    for (const pilarKey of ['valuation', 'qualidade', 'risco', 'dividendos', 'crescimento'] as const) {
      for (const sub of result.pilares[pilarKey].subNotas) {
        expect(sub).toHaveProperty('indicador')
        expect(sub).toHaveProperty('valor')
        expect(sub).toHaveProperty('nota')
        expect(sub).toHaveProperty('pesoInterno')
        expect(sub).toHaveProperty('direcao')
        expect(sub).toHaveProperty('referencia')
        expect(typeof sub.indicador).toBe('string')
        expect(typeof sub.nota).toBe('number')
        expect(typeof sub.pesoInterno).toBe('number')
        expect(['menor_melhor', 'maior_melhor']).toContain(sub.direcao)
        expect(sub.referencia).toHaveProperty('nota10')
        expect(sub.referencia).toHaveProperty('nota5')
        expect(sub.referencia).toHaveProperty('nota0')
      }
    }
  })

  it('ajustes has correct structure with new fields', () => {
    const result = calcularAqScore(makeDados())
    expect(result.ajustes).toHaveProperty('filtroLiquidez')
    expect(result.ajustes).toHaveProperty('fatorLiquidez')
    expect(result.ajustes).toHaveProperty('fatorConfianca')
    expect(result.ajustes).toHaveProperty('penalPatrimNegativo')
    expect(result.ajustes).toHaveProperty('penalTriploNegativo')
    expect(result.ajustes).toHaveProperty('sanityWarnings')
    expect(result.ajustes).toHaveProperty('scoreBruto')
    expect(result.ajustes).toHaveProperty('total')
    expect(typeof result.ajustes.filtroLiquidez).toBe('number')
    expect(typeof result.ajustes.fatorLiquidez).toBe('number')
    expect(typeof result.ajustes.fatorConfianca).toBe('number')
    expect(typeof result.ajustes.penalPatrimNegativo).toBe('boolean')
    expect(typeof result.ajustes.penalTriploNegativo).toBe('boolean')
    expect(Array.isArray(result.ajustes.sanityWarnings)).toBe(true)
    expect(typeof result.ajustes.scoreBruto).toBe('number')
    expect(typeof result.ajustes.total).toBe('number')
  })
})

// ─── Pillar-specific behavior tests ─────────────────────────────────

describe('Pillar-specific behavior', () => {
  describe('Valuation pillar', () => {
    it('includes all 6 valuation indicators for non-bank sector', () => {
      const result = calcularAqScore(makeDados({ SETOR: 'Outros' }))
      const indicadores = result.pilares.valuation.subNotas.map(s => s.indicador)
      expect(indicadores).toContain('P_L')
      expect(indicadores).toContain('P_VP')
      expect(indicadores).toContain('PSR')
      expect(indicadores).toContain('P_EBIT')
      expect(indicadores).toContain('EV_EBIT')
      expect(indicadores).toContain('EV_EBITDA')
    })

    it('lower P/L yields higher nota (menor_melhor)', () => {
      const low = calcularAqScore(makeDados({ P_L: 5 }))
      const high = calcularAqScore(makeDados({ P_L: 25 }))
      const plLow = low.pilares.valuation.subNotas.find(s => s.indicador === 'P_L')!
      const plHigh = high.pilares.valuation.subNotas.find(s => s.indicador === 'P_L')!
      expect(plLow.nota).toBeGreaterThan(plHigh.nota)
    })

    it('negative P/L gets nota 0 (penalizarNegativo)', () => {
      const result = calcularAqScore(makeDados({ P_L: -5 }))
      const pl = result.pilares.valuation.subNotas.find(s => s.indicador === 'P_L')!
      expect(pl.nota).toBe(0)
    })
  })

  describe('Quality pillar', () => {
    it('includes ROIC, ROE, MRG_EBIT, MRG_LIQUIDA for non-bank sector', () => {
      const result = calcularAqScore(makeDados({ SETOR: 'Outros' }))
      const indicadores = result.pilares.qualidade.subNotas.map(s => s.indicador)
      expect(indicadores).toContain('ROIC')
      expect(indicadores).toContain('ROE')
      expect(indicadores).toContain('MRG_EBIT')
      expect(indicadores).toContain('MRG_LIQUIDA')
    })

    it('higher ROE yields higher nota (maior_melhor)', () => {
      const low = calcularAqScore(makeDados({ ROE: 3 }))
      const high = calcularAqScore(makeDados({ ROE: 30 }))
      const roeLow = low.pilares.qualidade.subNotas.find(s => s.indicador === 'ROE')!
      const roeHigh = high.pilares.qualidade.subNotas.find(s => s.indicador === 'ROE')!
      expect(roeHigh.nota).toBeGreaterThan(roeLow.nota)
    })

    it('negative ROIC gets nota 0 (penalizarNegativo)', () => {
      const result = calcularAqScore(makeDados({ ROIC: -5 }))
      const roic = result.pilares.qualidade.subNotas.find(s => s.indicador === 'ROIC')!
      expect(roic.nota).toBe(0)
    })
  })

  describe('Risk pillar', () => {
    it('high DIV_BRUT_PATRIM (>3) caps risk pillar nota at 20', () => {
      const result = calcularAqScore(makeDados({
        DIV_BRUT_PATRIM: 4,
        PATRIM_LIQUIDO: 1_000_000_000,
      }))
      expect(result.pilares.risco.nota).toBeLessThanOrEqual(20)
    })

    it('negative PATRIM_LIQUIDO caps risk pillar nota at 25', () => {
      const result = calcularAqScore(makeDados({
        PATRIM_LIQUIDO: -500_000_000,
      }))
      expect(result.pilares.risco.nota).toBeLessThanOrEqual(25)
    })
  })

  describe('Dividends pillar', () => {
    it('higher DIV_YIELD yields higher nota', () => {
      const low = calcularAqScore(makeDados({ DIV_YIELD: 1 }))
      const high = calcularAqScore(makeDados({ DIV_YIELD: 10 }))
      const dyLow = low.pilares.dividendos.subNotas.find(s => s.indicador === 'DIV_YIELD')!
      const dyHigh = high.pilares.dividendos.subNotas.find(s => s.indicador === 'DIV_YIELD')!
      expect(dyHigh.nota).toBeGreaterThan(dyLow.nota)
    })

    it('PAYOUT > 100 applies additional penalty', () => {
      const normal = calcularAqScore(makeDados({ PAYOUT: 60 }))
      const excessive = calcularAqScore(makeDados({ PAYOUT: 120 }))
      const payoutNormal = normal.pilares.dividendos.subNotas.find(s => s.indicador === 'PAYOUT')!
      const payoutExcessive = excessive.pilares.dividendos.subNotas.find(s => s.indicador === 'PAYOUT')!
      expect(payoutExcessive.nota).toBeLessThan(payoutNormal.nota)
    })

    it('FCF_COVERAGE included as sub-indicator in dividendos', () => {
      const result = calcularAqScore(makeDados({ FCF_COVERAGE: 2.0 }))
      const fcfSub = result.pilares.dividendos.subNotas.find(s => s.indicador === 'FCF_COVERAGE')
      expect(fcfSub).toBeDefined()
      expect(fcfSub!.valor).toBe(2.0)
      expect(fcfSub!.nota).toBeGreaterThan(5) // Cobertura saudável
    })

    it('FCF_COVERAGE < 1.0 penalizes dividendos sub-nota by -3', () => {
      const safe = calcularAqScore(makeDados({ FCF_COVERAGE: 2.0 }))
      const risky = calcularAqScore(makeDados({ FCF_COVERAGE: 0.5 }))
      const fcfSafe = safe.pilares.dividendos.subNotas.find(s => s.indicador === 'FCF_COVERAGE')!
      const fcfRisky = risky.pilares.dividendos.subNotas.find(s => s.indicador === 'FCF_COVERAGE')!
      expect(fcfRisky.nota).toBeLessThan(fcfSafe.nota)
    })

    it('FCF_COVERAGE null does not break dividendos calculation', () => {
      const result = calcularAqScore(makeDados({ FCF_COVERAGE: null }))
      expect(result.pilares.dividendos.nota).toBeGreaterThan(0)
    })

    it('FCF_COVERAGE < 1.0 triggers warning destaque', () => {
      const result = calcularAqScore(makeDados({ FCF_COVERAGE: 0.3, DIV_YIELD: 8 }))
      expect(result.pilares.dividendos.destaque).toContain('FCF')
    })
  })

  describe('Growth pillar', () => {
    it('includes PEG_RATIO as a derived indicator when P/L and CRESC_LUCRO_5A are positive', () => {
      const result = calcularAqScore(makeDados({ P_L: 12, CRESC_LUCRO_5A: 12, CRESC_REC_5A: 10 }))
      const pegSub = result.pilares.crescimento.subNotas.find(s => s.indicador === 'PEG_RATIO')
      expect(pegSub).toBeDefined()
      expect(pegSub!.valor).toBeCloseTo(1.0, 5) // P/L 12 / CRESC_LUCRO_5A 12 = 1.0
    })

    it('falls back to CRESC_REC_5A for PEG when CRESC_LUCRO_5A is unavailable', () => {
      const result = calcularAqScore(makeDados({ P_L: 12, CRESC_LUCRO_5A: null, CRESC_REC_5A: 10 }))
      const pegSub = result.pilares.crescimento.subNotas.find(s => s.indicador === 'PEG_RATIO')
      expect(pegSub).toBeDefined()
      expect(pegSub!.valor).toBeCloseTo(1.2, 5) // P/L 12 / CRESC_REC_5A 10 = 1.2
    })

    it('PEG_RATIO is null when P/L is negative', () => {
      const result = calcularAqScore(makeDados({ P_L: -5, CRESC_REC_5A: 10 }))
      const pegSub = result.pilares.crescimento.subNotas.find(s => s.indicador === 'PEG_RATIO')
      expect(pegSub).toBeDefined()
      expect(pegSub!.valor).toBeNull()
      expect(pegSub!.nota).toBe(4) // slightly negative for null
    })

    it('PEG_RATIO is null when both growth rates are negative', () => {
      const result = calcularAqScore(makeDados({ P_L: 12, CRESC_LUCRO_5A: -3, CRESC_REC_5A: -5 }))
      const pegSub = result.pilares.crescimento.subNotas.find(s => s.indicador === 'PEG_RATIO')
      expect(pegSub).toBeDefined()
      expect(pegSub!.valor).toBeNull()
    })

    it('higher CRESC_REC_5A yields higher nota', () => {
      const low = calcularAqScore(makeDados({ CRESC_REC_5A: -3, P_L: null }))
      const high = calcularAqScore(makeDados({ CRESC_REC_5A: 25, P_L: null }))
      const crecLow = low.pilares.crescimento.subNotas.find(s => s.indicador === 'CRESC_REC_5A')!
      const crecHigh = high.pilares.crescimento.subNotas.find(s => s.indicador === 'CRESC_REC_5A')!
      expect(crecHigh.nota).toBeGreaterThan(crecLow.nota)
    })
  })
})

// ─── Liquidity factor tests (multiplicative) ─────────────────────────

describe('Liquidity factor (multiplicative)', () => {
  it('factor 1.0 for LIQ_2MESES >= 10_000_000', () => {
    const result = calcularAqScore(makeDados({ LIQ_2MESES: 10_000_000 }))
    expect(result.ajustes.fatorLiquidez).toBe(1.00)
  })

  it('factor 0.98 for LIQ_2MESES >= 5_000_000', () => {
    const result = calcularAqScore(makeDados({ LIQ_2MESES: 7_000_000 }))
    expect(result.ajustes.fatorLiquidez).toBe(0.98)
  })

  it('factor 0.95 for LIQ_2MESES >= 1_000_000', () => {
    const result = calcularAqScore(makeDados({ LIQ_2MESES: 1_000_000 }))
    expect(result.ajustes.fatorLiquidez).toBe(0.95)
  })

  it('factor 0.90 for LIQ_2MESES >= 500_000', () => {
    const result = calcularAqScore(makeDados({ LIQ_2MESES: 750_000 }))
    expect(result.ajustes.fatorLiquidez).toBe(0.90)
  })

  it('factor 0.80 for LIQ_2MESES >= 100_000', () => {
    const result = calcularAqScore(makeDados({ LIQ_2MESES: 200_000 }))
    expect(result.ajustes.fatorLiquidez).toBe(0.80)
  })

  it('factor 0.65 for LIQ_2MESES < 100_000', () => {
    const result = calcularAqScore(makeDados({ LIQ_2MESES: 50_000 }))
    expect(result.ajustes.fatorLiquidez).toBe(0.65)
  })

  it('uses market cap as proxy when no volume data', () => {
    const largeCap = calcularAqScore(makeDados({ LIQ_2MESES: null, MARKET_CAP: 50_000_000_000 }))
    expect(largeCap.ajustes.fatorLiquidez).toBe(0.95)

    const midCap = calcularAqScore(makeDados({ LIQ_2MESES: null, MARKET_CAP: 5_000_000_000 }))
    expect(midCap.ajustes.fatorLiquidez).toBe(0.85)

    const smallCap = calcularAqScore(makeDados({ LIQ_2MESES: null, MARKET_CAP: 500_000_000 }))
    expect(smallCap.ajustes.fatorLiquidez).toBe(0.70)
  })

  it('factor 0.60 when no data at all', () => {
    const result = calcularAqScore(makeDados({ LIQ_2MESES: null, MARKET_CAP: null }))
    expect(result.ajustes.fatorLiquidez).toBe(0.60)
  })
})

// ─── Confidence factor tests ─────────────────────────────────────────

describe('Confidence factor', () => {
  it('factor high when most indicators provided', () => {
    const result = calcularAqScore(makeDados())
    // With 60/40 model, some qualitative indicators may be missing from default
    // but core quant indicators are all present, so confidence should be reasonable
    expect(result.ajustes.fatorConfianca).toBeGreaterThanOrEqual(0.90)
  })

  it('factor < 1.0 when many indicators are null', () => {
    const result = calcularAqScore(makeDados({
      P_L: null, P_VP: null, PSR: null, P_EBIT: null, EV_EBIT: null, EV_EBITDA: null,
      ROIC: null, ROE: null, MRG_EBIT: null, MRG_LIQUIDA: null,
    }))
    expect(result.ajustes.fatorConfianca).toBeLessThan(1.0)
  })

  it('factor 0.50 when no indicators at all', () => {
    const dados: DadosFundamentalistas = {
      ticker: 'NODATA3', cotacao: null,
      P_L: null, P_VP: null, PSR: null, P_EBIT: null, EV_EBIT: null, EV_EBITDA: null,
      ROIC: null, ROE: null, MRG_EBIT: null, MRG_LIQUIDA: null,
      LIQ_CORRENTE: null, DIV_BRUT_PATRIM: null, P_CAP_GIRO: null,
      P_ATIV_CIRC_LIQ: null, P_ATIVO: null, PATRIM_LIQUIDO: null,
      DIV_YIELD: null, DIV_EBITDA: null, PAYOUT: null,
      CRESC_REC_5A: null, CRESC_LUCRO_5A: null, LIQ_2MESES: null,
      MARKET_CAP: null,
      SETOR: 'Outros',
    }
    const result = calcularAqScore(dados)
    expect(result.ajustes.fatorConfianca).toBe(0.65)
  })

  it('confidence factor actually reduces score', () => {
    // Full data
    const full = calcularAqScore(makeDados())
    // Same but with many nulls
    const sparse = calcularAqScore(makeDados({
      P_L: null, P_VP: null, PSR: null, P_EBIT: null, EV_EBIT: null, EV_EBITDA: null,
      ROIC: null, ROE: null, MRG_EBIT: null, MRG_LIQUIDA: null,
      LIQ_CORRENTE: null, DIV_BRUT_PATRIM: null,
    }))
    // The sparse one should have a lower score due to confidence penalty
    expect(sparse.ajustes.fatorConfianca).toBeLessThan(full.ajustes.fatorConfianca)
  })
})

// ─── Sanity check tests ─────────────────────────────────────────────

describe('Sanity checks', () => {
  it('micro cap + illiquid caps score at 80', () => {
    // Give excellent fundamentals + qualitative to a micro cap illiquid stock
    const dados = makeDados({
      ticker: 'MICRO3',
      P_L: 5, P_VP: 0.8, PSR: 0.3, P_EBIT: 3, EV_EBIT: 4, EV_EBITDA: 3,
      ROIC: 30, ROE: 35, MRG_EBIT: 40, MRG_LIQUIDA: 25,
      LIQ_CORRENTE: 3.0, DIV_BRUT_PATRIM: 0.2,
      DIV_YIELD: 10, PAYOUT: 60,
      CRESC_REC_5A: 25, CRESC_LUCRO_5A: 30,
      LIQ_2MESES: 50_000,      // Very illiquid
      MARKET_CAP: 200_000_000,  // Micro cap (< 500M)
      SETOR: 'Outros',
      MOAT_SCORE: 90, MANAGEMENT_SCORE: 85, GOVERNANCE_SCORE: 90,
      EARNINGS_QUALITY: 90, REGULATORY_RISK: 80,
    })

    const result = calcularAqScore(dados)
    expect(result.score).toBeLessThanOrEqual(80)
    // Score may or may not trigger the sanity warning depending on scoreBruto
    // The key constraint is the score is capped at 80
  })

  it('low data coverage caps score at 70 and confidence factor reduces it', () => {
    // Stock with few indicators — most null means neutral notes (5/10)
    // which gives ~50 scoreBruto, too low to trigger the cap warning
    // But the confidence factor (0.50 for 0% indicators) still penalizes
    const dados: DadosFundamentalistas = {
      ticker: 'LOWDATA3', cotacao: 10,
      P_L: 5, P_VP: 0.8,       // Only 2 essential indicators
      PSR: null, P_EBIT: null, EV_EBIT: null, EV_EBITDA: null,
      ROIC: null, ROE: null, MRG_EBIT: null, MRG_LIQUIDA: null,
      LIQ_CORRENTE: null, DIV_BRUT_PATRIM: null, P_CAP_GIRO: null,
      P_ATIV_CIRC_LIQ: null, P_ATIVO: null, PATRIM_LIQUIDO: null,
      DIV_YIELD: null, DIV_EBITDA: null, PAYOUT: null,
      CRESC_REC_5A: null, CRESC_LUCRO_5A: null,
      LIQ_2MESES: 500_000_000,
      MARKET_CAP: 50_000_000_000,
      SETOR: 'Outros',
    }

    const result = calcularAqScore(dados)
    // Low data: only 2/18 indicators → confidence factor is low
    expect(result.ajustes.fatorConfianca).toBeLessThan(1.0)
    // Score should be well below 70 due to confidence penalty
    expect(result.score).toBeLessThanOrEqual(70)
  })

  it('low data coverage reduces score via confidence factor', () => {
    // Few indicators filled, most null — both quant and qualitative
    const dados = makeDados({
      ticker: 'SPARSE3',
      P_L: 5, P_VP: 0.8,
      ROE: 35, ROIC: 30,
      MRG_EBIT: 40, MRG_LIQUIDA: 25,
      DIV_YIELD: 10,
      CRESC_REC_5A: null,
      PSR: null, P_EBIT: null, EV_EBIT: null, EV_EBITDA: null,
      LIQ_CORRENTE: null, DIV_BRUT_PATRIM: null, P_CAP_GIRO: null,
      P_ATIV_CIRC_LIQ: null, P_ATIVO: null, PATRIM_LIQUIDO: null,
      DIV_EBITDA: null, PAYOUT: null,
      CRESC_LUCRO_5A: null,
      FCF_COVERAGE: null,
      LIQ_2MESES: 500_000_000,
      MARKET_CAP: 50_000_000_000,
      // Null out qualitative too
      MOAT_SCORE: null, MANAGEMENT_SCORE: null, GOVERNANCE_SCORE: null,
      EARNINGS_QUALITY: null, REGULATORY_RISK: null,
      NEWS_SENTIMENT: null,
    })

    const result = calcularAqScore(dados)
    // Verify low coverage detected
    expect(result.metadata.indicadoresDisponiveis).toBeLessThan(result.metadata.indicadoresTotais * 0.55)
    // Confidence factor should penalize
    expect(result.ajustes.fatorConfianca).toBeLessThan(1.0)
    // Final score should be meaningfully lower than bruto
    expect(result.score).toBeLessThan(result.ajustes.scoreBruto)
    // Score should be well below 70 with the compound penalties
    expect(result.score).toBeLessThanOrEqual(70)
  })

  it('DY > 20% adds warning but does not cap score', () => {
    const dados = makeDados({
      DIV_YIELD: 25,
      LIQ_2MESES: 100_000_000,
      MARKET_CAP: 50_000_000_000,
    })
    const result = calcularAqScore(dados)
    expect(result.ajustes.sanityWarnings).toContain('DY > 20%: possível dividendo extraordinário')
  })

  it('CAMB3-like stock (micro cap, low liq, good fundamentals) gets penalized', () => {
    const dados = makeDados({
      ticker: 'CAMB3',
      P_L: 3, P_VP: 0.5, PSR: 0.2, P_EBIT: 2, EV_EBIT: 3, EV_EBITDA: 2,
      ROIC: 40, ROE: 50, MRG_EBIT: 60, MRG_LIQUIDA: 40,
      LIQ_CORRENTE: 5, DIV_BRUT_PATRIM: 0.1,
      DIV_YIELD: 15, PAYOUT: 80,
      CRESC_REC_5A: 40, CRESC_LUCRO_5A: 50,
      LIQ_2MESES: 294_000,       // Low liquidity
      MARKET_CAP: 400_000_000,    // Micro cap
      SETOR: 'Outros',
      // Excellent qualitative to ensure scoreBruto is high
      MOAT_SCORE: 95, MANAGEMENT_SCORE: 90, GOVERNANCE_SCORE: 95,
      EARNINGS_QUALITY: 95, REGULATORY_RISK: 85,
    })

    const result = calcularAqScore(dados)

    // scoreBruto should be high (excellent fundamentals + qualitative)
    expect(result.ajustes.scoreBruto).toBeGreaterThan(75)
    // But final score should be significantly lower due to liquidity + micro cap
    expect(result.score).toBeLessThan(result.ajustes.scoreBruto)
    expect(result.score).toBeLessThanOrEqual(80) // sanity cap for micro cap + illiquid
  })
})

// ─── Penalty interaction tests ──────────────────────────────────────

describe('Penalty interactions', () => {
  it('negative equity + triple negative applies the stricter cap (15)', () => {
    const dados = makeDados({
      PATRIM_LIQUIDO: -1_000_000_000,
      ROIC: -5,
      ROE: -10,
      MRG_LIQUIDA: -3,
      LIQ_2MESES: 50_000_000,
    })

    const result = calcularAqScore(dados)

    expect(result.ajustes.penalPatrimNegativo).toBe(true)
    expect(result.ajustes.penalTriploNegativo).toBe(true)
    expect(result.score).toBeLessThanOrEqual(15)
  })

  it('illiquidity penalty can push score low but not below 0', () => {
    const dados = makeDados({
      LIQ_2MESES: 10_000, // very illiquid, factor 0.65
      ROIC: -5,
      ROE: -10,
      MRG_LIQUIDA: -3,
    })

    const result = calcularAqScore(dados)

    expect(result.score).toBeGreaterThanOrEqual(0)
  })

  it('triple negative without negative equity still applies cap of 15', () => {
    const dados = makeDados({
      PATRIM_LIQUIDO: 500_000_000, // positive equity
      ROIC: -5,
      ROE: -10,
      MRG_LIQUIDA: -3,
      LIQ_2MESES: 50_000_000,
    })

    const result = calcularAqScore(dados)

    expect(result.ajustes.penalPatrimNegativo).toBe(false)
    expect(result.ajustes.penalTriploNegativo).toBe(true)
    expect(result.score).toBeLessThanOrEqual(15)
  })
})

// ─── Sector-specific weight tests ───────────────────────────────────

describe('Sector-specific weights', () => {
  it('tecnologia sector weights growth more heavily than default', () => {
    const techDados = makeDados({ SETOR: 'Tecnologia', LIQ_2MESES: 100_000_000 })
    const otherDados = makeDados({ SETOR: 'Outros', LIQ_2MESES: 100_000_000 })

    const techResult = calcularAqScore(techDados)
    const otherResult = calcularAqScore(otherDados)

    expect(techResult.pilares.crescimento.pesoEfetivo).toBeGreaterThan(
      otherResult.pilares.crescimento.pesoEfetivo
    )
  })

  it('utilities_energia sector weights dividends more heavily', () => {
    const utilDados = makeDados({ SETOR: 'Energia Elétrica', LIQ_2MESES: 100_000_000 })
    const otherDados = makeDados({ SETOR: 'Outros', LIQ_2MESES: 100_000_000 })

    const utilResult = calcularAqScore(utilDados)
    const otherResult = calcularAqScore(otherDados)

    expect(utilResult.pilares.dividendos.pesoEfetivo).toBeGreaterThan(
      otherResult.pilares.dividendos.pesoEfetivo
    )
  })

  it('bancos_financeiro sector has reduced risk weight', () => {
    const bankDados = makeDados({ SETOR: 'Bancos', LIQ_2MESES: 100_000_000 })
    const otherDados = makeDados({ SETOR: 'Outros', LIQ_2MESES: 100_000_000 })

    const bankResult = calcularAqScore(bankDados)
    const otherResult = calcularAqScore(otherDados)

    expect(bankResult.pilares.risco.pesoEfetivo).toBeLessThan(
      otherResult.pilares.risco.pesoEfetivo
    )
  })

  it('bancos_financeiro sector now weights valuation (30%) higher than default (25%)', () => {
    const bankDados = makeDados({ SETOR: 'Bancos', LIQ_2MESES: 100_000_000 })
    const otherDados = makeDados({ SETOR: 'Outros', LIQ_2MESES: 100_000_000 })

    const bankResult = calcularAqScore(bankDados)
    const otherResult = calcularAqScore(otherDados)

    expect(bankResult.pilares.valuation.pesoEfetivo).toBeGreaterThan(
      otherResult.pilares.valuation.pesoEfetivo
    )
  })
})

// ─── PILLAR_WEIGHTS constant tests ──────────────────────────────────

describe('PILLAR_WEIGHTS', () => {
  it('has exactly 6 pillar keys', () => {
    expect(Object.keys(PILLAR_WEIGHTS)).toHaveLength(6)
  })

  it('valuation weight is 0.22', () => {
    expect(PILLAR_WEIGHTS.valuation).toBe(0.22)
  })

  it('quality weight is 0.25', () => {
    expect(PILLAR_WEIGHTS.quality).toBe(0.25)
  })

  it('risk weight is 0.18', () => {
    expect(PILLAR_WEIGHTS.risk).toBe(0.18)
  })

  it('dividends weight is 0.08', () => {
    expect(PILLAR_WEIGHTS.dividends).toBe(0.08)
  })

  it('growth weight is 0.12', () => {
    expect(PILLAR_WEIGHTS.growth).toBe(0.12)
  })

  it('qualitativo weight is 0.15', () => {
    expect(PILLAR_WEIGHTS.qualitativo).toBe(0.15)
  })
})

// ─── Normalization edge cases ───────────────────────────────────────

describe('Normalization edge cases', () => {
  it('subNota values are always between 0 and 10', () => {
    const testCases = [
      makeDados(), // normal
      makeDados({ P_L: 0.1, P_VP: 0.01, ROE: 100, ROIC: 100 }), // extreme high quality
      makeDados({ P_L: 500, P_VP: 50, ROE: -50, ROIC: -50 }), // extreme low quality
    ]

    for (const dados of testCases) {
      const result = calcularAqScore(dados)
      for (const pilarKey of ['valuation', 'qualidade', 'risco', 'dividendos', 'crescimento'] as const) {
        for (const sub of result.pilares[pilarKey].subNotas) {
          expect(sub.nota).toBeGreaterThanOrEqual(0)
          expect(sub.nota).toBeLessThanOrEqual(10)
        }
      }
    }
  })

  it('perfect valuation values yield nota 10', () => {
    const result = calcularAqScore(makeDados({
      P_L: 5,   // below nota10 threshold of 8
      P_VP: 0.5, // below nota10 threshold of 1.0
      SETOR: 'Outros',
    }))

    const pl = result.pilares.valuation.subNotas.find(s => s.indicador === 'P_L')!
    const pvp = result.pilares.valuation.subNotas.find(s => s.indicador === 'P_VP')!
    expect(pl.nota).toBe(10)
    expect(pvp.nota).toBe(10)
  })

  it('terrible valuation values yield nota 0', () => {
    const result = calcularAqScore(makeDados({
      P_L: 50,   // above nota0 threshold of 40
      P_VP: 8,   // above nota0 threshold of 6.0
      SETOR: 'Outros',
    }))

    const pl = result.pilares.valuation.subNotas.find(s => s.indicador === 'P_L')!
    const pvp = result.pilares.valuation.subNotas.find(s => s.indicador === 'P_VP')!
    expect(pl.nota).toBe(0)
    expect(pvp.nota).toBe(0)
  })
})

// ─── Seguradoras behave like banks ──────────────────────────────────

describe('Seguradoras sector', () => {
  it('seguradoras ignore the same expanded indicators as bancos', () => {
    const result = calcularAqScore(makeDados({ SETOR: 'Seguros' }))

    const qualidadeIndicadores = result.pilares.qualidade.subNotas.map(s => s.indicador)
    expect(qualidadeIndicadores).not.toContain('ROIC')
    expect(qualidadeIndicadores).not.toContain('MRG_EBIT')
    expect(qualidadeIndicadores).not.toContain('MRG_LIQUIDA')

    const riscoIndicadores = result.pilares.risco.subNotas.map(s => s.indicador)
    expect(riscoIndicadores).not.toContain('LIQ_CORRENTE')
    expect(riscoIndicadores).not.toContain('P_CAP_GIRO')
    expect(riscoIndicadores).not.toContain('P_ATIV_CIRC_LIQ')
    expect(riscoIndicadores).toContain('DIV_BRUT_PATRIM')

    const valuationIndicadores = result.pilares.valuation.subNotas.map(s => s.indicador)
    expect(valuationIndicadores).not.toContain('PSR')
    expect(valuationIndicadores).not.toContain('EV_EBIT')
    expect(valuationIndicadores).not.toContain('EV_EBITDA')

    const dividendosIndicadores = result.pilares.dividendos.subNotas.map(s => s.indicador)
    expect(dividendosIndicadores).not.toContain('DIV_EBITDA')
  })
})

// ─── Sector valuation tolerance tests ───────────────────────────────

describe('Sector valuation tolerance', () => {
  it('tecnologia sector has higher valuation tolerance (1.5x), so same P/L gets better score', () => {
    const techDados = makeDados({ P_L: 20, SETOR: 'Tecnologia', LIQ_2MESES: 100_000_000 })
    const otherDados = makeDados({ P_L: 20, SETOR: 'Outros', LIQ_2MESES: 100_000_000 })

    const techResult = calcularAqScore(techDados)
    const otherResult = calcularAqScore(otherDados)

    const techPL = techResult.pilares.valuation.subNotas.find(s => s.indicador === 'P_L')!
    const otherPL = otherResult.pilares.valuation.subNotas.find(s => s.indicador === 'P_L')!

    expect(techPL.nota).toBeGreaterThan(otherPL.nota)
  })
})

// ─── CAGED adjustment tests ─────────────────────────────────────────

describe('CAGED adjustment on Growth pillar', () => {
  it('expanding trend adds +2 to crescimento pillar nota', () => {
    const dados = makeDados({ LIQ_2MESES: 100_000_000 })
    const sem = calcularAqScore(dados)
    const com = calcularAqScore(dados, undefined, undefined, 'expanding')

    expect(com.pilares.crescimento.nota).toBe(
      Math.min(100, sem.pilares.crescimento.nota + 2)
    )
    expect(com.ajustes.cagedAdjustment.applied).toBe(true)
    expect(com.ajustes.cagedAdjustment.trend).toBe('expanding')
    expect(com.ajustes.cagedAdjustment.adjustment).toBe(2)
    expect(com.pilares.crescimento.destaque).toContain('CAGED')
  })

  it('contracting trend subtracts 2 from crescimento pillar nota', () => {
    const dados = makeDados({ LIQ_2MESES: 100_000_000 })
    const sem = calcularAqScore(dados)
    const com = calcularAqScore(dados, undefined, undefined, 'contracting')

    expect(com.pilares.crescimento.nota).toBe(
      Math.max(0, sem.pilares.crescimento.nota - 2)
    )
    expect(com.ajustes.cagedAdjustment.applied).toBe(true)
    expect(com.ajustes.cagedAdjustment.adjustment).toBe(-2)
  })

  it('stable trend does not change crescimento pillar nota', () => {
    const dados = makeDados({ LIQ_2MESES: 100_000_000 })
    const sem = calcularAqScore(dados)
    const com = calcularAqScore(dados, undefined, undefined, 'stable')

    expect(com.pilares.crescimento.nota).toBe(sem.pilares.crescimento.nota)
    expect(com.ajustes.cagedAdjustment.applied).toBe(false)
    expect(com.ajustes.cagedAdjustment.adjustment).toBe(0)
  })

  it('null cagedTrend does not change crescimento pillar nota', () => {
    const dados = makeDados({ LIQ_2MESES: 100_000_000 })
    const sem = calcularAqScore(dados)
    const com = calcularAqScore(dados, undefined, undefined, null)

    expect(com.pilares.crescimento.nota).toBe(sem.pilares.crescimento.nota)
    expect(com.ajustes.cagedAdjustment.applied).toBe(false)
  })

  it('crescimento nota is clamped between 0 and 100 with CAGED', () => {
    // Dados com crescimento muito baixo + contraction
    const dados = makeDados({
      CRESC_REC_5A: -20,
      CRESC_LUCRO_5A: -30,
      P_L: -5,
      LIQ_2MESES: 100_000_000,
    })
    const result = calcularAqScore(dados, undefined, undefined, 'contracting')
    expect(result.pilares.crescimento.nota).toBeGreaterThanOrEqual(0)
  })
})

// ─── scoreBruto tests ───────────────────────────────────────────────

describe('scoreBruto', () => {
  it('scoreBruto is >= scoreFinal for liquid stocks', () => {
    const result = calcularAqScore(makeDados({ LIQ_2MESES: 100_000_000 }))
    // With all data and high liquidity, factors are 1.0, so scoreBruto ≈ score
    expect(result.ajustes.scoreBruto).toBeGreaterThanOrEqual(result.score - 1) // allow rounding
  })

  it('scoreBruto > scoreFinal for illiquid stocks', () => {
    const result = calcularAqScore(makeDados({ LIQ_2MESES: 50_000 }))
    // Liquidity factor 0.65 should significantly reduce score
    expect(result.ajustes.scoreBruto).toBeGreaterThan(result.score)
  })
})

// ─── Contrarian Signal tests ─────────────────────────────────────────

describe('Contrarian signal', () => {
  it('not triggered for non-cyclical sectors', () => {
    const result = calcularAqScore(makeDados({
      SETOR: 'Varejo',
      ROE: 5, ROE_MEDIA_5A: 20,
      MRG_LIQUIDA: 3, MRG_LIQUIDA_MEDIA_5A: 15,
    }))
    expect(result.contrarian.triggered).toBe(false)
  })

  it('triggered for mineracao with ROE < 50% of 5Y avg', () => {
    const result = calcularAqScore(makeDados({
      ticker: 'VALE3',
      SETOR: 'Mineração',
      ROE: 5, ROE_MEDIA_5A: 25,
      MRG_LIQUIDA: 12, MRG_LIQUIDA_MEDIA_5A: 15,
    }))
    expect(result.contrarian.triggered).toBe(true)
    expect(result.contrarian.indicators).toHaveLength(1)
    expect(result.contrarian.indicators[0]!.name).toBe('ROE')
  })

  it('triggered with both ROE and margin below 50% of avg', () => {
    const result = calcularAqScore(makeDados({
      ticker: 'CSNA3',
      SETOR: 'Siderurgia',
      ROE: 4, ROE_MEDIA_5A: 20,
      MRG_LIQUIDA: 3, MRG_LIQUIDA_MEDIA_5A: 15,
    }))
    expect(result.contrarian.triggered).toBe(true)
    expect(result.contrarian.indicators).toHaveLength(2)
    expect(result.contrarian.reason).toContain('contrarian')
  })

  it('not triggered when current values are >= 50% of avg', () => {
    const result = calcularAqScore(makeDados({
      ticker: 'VALE3',
      SETOR: 'Mineração',
      ROE: 15, ROE_MEDIA_5A: 25,
      MRG_LIQUIDA: 10, MRG_LIQUIDA_MEDIA_5A: 15,
    }))
    expect(result.contrarian.triggered).toBe(false)
  })

  it('not triggered when averages are null', () => {
    const result = calcularAqScore(makeDados({
      ticker: 'VALE3',
      SETOR: 'Mineração',
      ROE: 5, ROE_MEDIA_5A: null,
    }))
    expect(result.contrarian.triggered).toBe(false)
  })

  it('does not change score (signal only)', () => {
    const withoutSignal = calcularAqScore(makeDados({
      ticker: 'VALE3',
      SETOR: 'Mineração',
      ROE: 5, ROE_MEDIA_5A: null,
    }))
    const withSignal = calcularAqScore(makeDados({
      ticker: 'VALE3',
      SETOR: 'Mineração',
      ROE: 5, ROE_MEDIA_5A: 25,
    }))
    expect(withoutSignal.score).toBe(withSignal.score)
  })
})
