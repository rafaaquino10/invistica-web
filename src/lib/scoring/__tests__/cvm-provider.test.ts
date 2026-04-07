// ─── CVM Provider Tests ──────────────────────────────────────────
// Tests for the CVM (Comissão de Valores Mobiliários) data provider.
// Covers CSV parsing, indicator calculation, CNPJ→Ticker mapping,
// CAGR calculation, and edge cases.

import { describe, it, expect } from 'vitest'
import {
  buildCnpjTickerMap,
  getCvmFundamentals,
  parseCvmCsv,
  parseCadastro,
  aggregateStatements,
  calculateIndicators,
  calculateCAGR,
  normalizeName,
  type MarketQuote,
  type CvmCompanyData,
  type CvmStatementData,
  type CnpjTickerMapFile,
} from '../../../../gateway/src/providers/cvm-financials-client'

// ─── Name Normalization Tests ────────────────────────────────

describe('normalizeName', () => {
  it('should remove accents', () => {
    expect(normalizeName('PETRÓLEO')).toBe('PETROLEO')
  })

  it('should remove S.A. variants', () => {
    expect(normalizeName('WEG S.A.')).toBe('WEG')
    expect(normalizeName('WEG S/A')).toBe('WEG')
    expect(normalizeName('WEG SA')).toBe('WEG')
  })

  it('should remove common stop words', () => {
    const result = normalizeName('BANCO DO BRASIL S.A.')
    expect(result).not.toContain(' DO ')
    expect(result).toContain('BANCO')
    // Note: BRASIL is also removed as a stop word in normalization
  })

  it('should remove holding/participacoes/etc', () => {
    expect(normalizeName('ITAU HOLDING PARTICIPACOES')).toBe('ITAU')
  })

  it('should handle empty string', () => {
    expect(normalizeName('')).toBe('')
  })
})

// ─── CSV Parsing Tests ──────────────────────────────────────────

describe('parseCvmCsv', () => {
  it('should parse semicolon-separated CSV with ÚLTIMO filter', () => {
    const csv = [
      'CNPJ_CIA;DENOM_CIA;CD_CVM;DT_REFER;DT_FIM_EXERC;ORDEM_EXERC;CD_CONTA;DS_CONTA;VL_CONTA',
      '33.000.167/0001-01;PETROBRAS;9512;2024-12-31;2024-12-31;ÚLTIMO;1;Ativo Total;1000000000',
      '33.000.167/0001-01;PETROBRAS;9512;2024-12-31;2024-12-31;PENÚLTIMO;1;Ativo Total;900000000',
    ].join('\n')

    const rows = parseCvmCsv(csv, true)
    // Should only include ÚLTIMO
    expect(rows).toHaveLength(1)
    expect(rows[0]!.vlConta).toBe(1000000000)
    expect(rows[0]!.isConsolidated).toBe(true)
  })

  it('should handle both ÚLTIMO and ULTIMO (no accent)', () => {
    const csv = [
      'CNPJ_CIA;DENOM_CIA;CD_CVM;DT_REFER;DT_FIM_EXERC;ORDEM_EXERC;CD_CONTA;DS_CONTA;VL_CONTA',
      '33.000.167/0001-01;PETROBRAS;9512;2024-12-31;2024-12-31;ULTIMO;1;Ativo Total;500000000',
    ].join('\n')

    const rows = parseCvmCsv(csv, false)
    expect(rows).toHaveLength(1)
    expect(rows[0]!.isConsolidated).toBe(false)
  })

  it('should skip rows with invalid values', () => {
    const csv = [
      'CNPJ_CIA;DENOM_CIA;CD_CVM;DT_REFER;DT_FIM_EXERC;ORDEM_EXERC;CD_CONTA;DS_CONTA;VL_CONTA',
      '33.000.167/0001-01;PETROBRAS;9512;2024-12-31;2024-12-31;ÚLTIMO;1;Ativo Total;abc',
    ].join('\n')

    const rows = parseCvmCsv(csv, true)
    expect(rows).toHaveLength(0)
  })

  it('should handle empty CSV', () => {
    expect(parseCvmCsv('', true)).toHaveLength(0)
    expect(parseCvmCsv('header only', true)).toHaveLength(0)
  })

  it('should parse comma decimal separator', () => {
    const csv = [
      'CNPJ_CIA;DENOM_CIA;CD_CVM;DT_REFER;DT_FIM_EXERC;ORDEM_EXERC;CD_CONTA;DS_CONTA;VL_CONTA',
      '33.000.167/0001-01;PETROBRAS;9512;2024-12-31;2024-12-31;ÚLTIMO;1;Ativo Total;1000000,50',
    ].join('\n')

    const rows = parseCvmCsv(csv, true)
    expect(rows).toHaveLength(1)
    expect(rows[0]!.vlConta).toBeCloseTo(1000000.50)
  })
})

describe('parseCadastro', () => {
  it('should parse cadastro CSV', () => {
    const csv = [
      'CNPJ_CIA;DENOM_CIA;DENOM_COMERCIAL;CD_CVM;SIT_REG;TP_MERC',
      '33.000.167/0001-01;PETROLEO BRASILEIRO S.A.;PETROBRAS;9512;ATIVO;BOLSA',
      '60.872.504/0001-23;ITAU UNIBANCO HOLDING S.A.;ITAU UNIBANCO;19348;ATIVO;BOLSA',
    ].join('\n')

    const companies = parseCadastro(csv)
    expect(companies).toHaveLength(2)
    expect(companies[0]!.cnpj).toBe('33.000.167/0001-01')
    expect(companies[0]!.denomComercial).toBe('PETROBRAS')
    expect(companies[0]!.sitReg).toBe('ATIVO')
  })

  it('should handle empty CSV', () => {
    expect(parseCadastro('')).toHaveLength(0)
  })
})

// ─── Aggregation Tests ──────────────────────────────────────────

describe('aggregateStatements', () => {
  it('should aggregate BPA, BPP, DRE, DFC rows into company statements', () => {
    const bpa = [
      { cnpj: '33.000.167/0001-01', companyName: 'PETROBRAS', cdCvm: '9512', dtRefer: '2024-12-31', dtFimExerc: '2024-12-31', ordemExerc: 'ÚLTIMO', cdConta: '1', dsConta: 'Ativo Total', vlConta: 1000, isConsolidated: true },
      { cnpj: '33.000.167/0001-01', companyName: 'PETROBRAS', cdCvm: '9512', dtRefer: '2024-12-31', dtFimExerc: '2024-12-31', ordemExerc: 'ÚLTIMO', cdConta: '1.01', dsConta: 'Ativo Circulante', vlConta: 200, isConsolidated: true },
    ]

    const bpp = [
      { cnpj: '33.000.167/0001-01', companyName: 'PETROBRAS', cdCvm: '9512', dtRefer: '2024-12-31', dtFimExerc: '2024-12-31', ordemExerc: 'ÚLTIMO', cdConta: '2.03', dsConta: 'Patrimônio Líquido', vlConta: 400, isConsolidated: true },
    ]

    const dre = [
      { cnpj: '33.000.167/0001-01', companyName: 'PETROBRAS', cdCvm: '9512', dtRefer: '2024-12-31', dtFimExerc: '2024-12-31', ordemExerc: 'ÚLTIMO', cdConta: '3.01', dsConta: 'Receita Líquida', vlConta: 500, isConsolidated: true },
      { cnpj: '33.000.167/0001-01', companyName: 'PETROBRAS', cdCvm: '9512', dtRefer: '2024-12-31', dtFimExerc: '2024-12-31', ordemExerc: 'ÚLTIMO', cdConta: '3.11', dsConta: 'Lucro Líquido', vlConta: 100, isConsolidated: true },
    ]

    const companies = aggregateStatements(bpa, bpp, dre, [])
    const petro = companies.get('9512')!

    expect(petro).toBeDefined()
    expect(petro.statements['2024-12']).toBeDefined()
    expect(petro.statements['2024-12']!.ativoTotal).toBe(1000)
    expect(petro.statements['2024-12']!.ativoCirculante).toBe(200)
    expect(petro.statements['2024-12']!.patrimonioLiquido).toBe(400)
    expect(petro.statements['2024-12']!.receitaLiquida).toBe(500)
    expect(petro.statements['2024-12']!.lucroLiquido).toBe(100)
  })
})

// ─── Indicator Calculation Tests ────────────────────────────────

describe('calculateIndicators', () => {
  const makeCompany = (stmt: Partial<CvmStatementData>): CvmCompanyData => ({
    cnpj: '33.000.167/0001-01',
    cdCvm: '9512',
    companyName: 'TEST CO',
    statements: {
      '2024': {
        ativoTotal: null,
        ativoCirculante: null,
        caixaEquivalentes: null,
        passivoCirculante: null,
        patrimonioLiquido: null,
        emprestimosCp: null,
        emprestimosLp: null,
        receitaLiquida: null,
        ebit: null,
        resultadoFinanceiro: null,
        lucroLiquido: null,
        depreciation: null,
        contasAReceber: null,
        estoques: null,
        fornecedores: null,
        capitalSocial: null,
        fco: null,
        capexImobilizado: null,
        capexIntangivel: null,
        ...stmt,
      },
    },
  })

  // CVM values are in R$ mil (thousands). E.g., 100e6 in CVM = 100 billion BRL.
  // marketCap from brapi is in full BRL.
  const market: MarketQuote = { ticker: 'TEST3', price: 40, marketCap: 500e9 }

  it('should calculate P/L correctly', () => {
    // lucroLiquido=100e6 (R$ mil) = 100B BRL. P/L = 500B / 100B = 5
    const company = makeCompany({ lucroLiquido: 100e6, receitaLiquida: 500e6 })
    const result = calculateIndicators(company, 'TEST3', market)!
    expect(result.peRatio).toBe(5)
  })

  it('should calculate ROE correctly', () => {
    const company = makeCompany({
      lucroLiquido: 93e6,
      patrimonioLiquido: 350e6,
      receitaLiquida: 500e6,
    })
    const result = calculateIndicators(company, 'TEST3', market)!
    // ROE = 93/350 * 100 = 26.57% (CVM-to-CVM ratio, no scaling needed)
    expect(result.roe).toBeCloseTo(26.57, 1)
  })

  it('should calculate margins correctly', () => {
    const company = makeCompany({
      ebit: 150e6,
      lucroLiquido: 93e6,
      receitaLiquida: 500e6,
    })
    const result = calculateIndicators(company, 'TEST3', market)!
    // Margem EBIT = 150/500 * 100 = 30%
    expect(result.margemEbit).toBe(30)
    // Margem Líquida = 93/500 * 100 = 18.6%
    expect(result.margemLiquida).toBe(18.6)
  })

  it('should calculate liquidez corrente correctly', () => {
    const company = makeCompany({
      ativoCirculante: 200e6,
      passivoCirculante: 150e6,
      receitaLiquida: 100e6,
    })
    const result = calculateIndicators(company, 'TEST3', market)!
    // Liquidez = 200/150 = 1.33
    expect(result.liquidezCorrente).toBeCloseTo(1.33, 1)
  })

  it('should return null for division by zero', () => {
    const company = makeCompany({
      receitaLiquida: 0,
      lucroLiquido: 100e6,
    })
    const result = calculateIndicators(company, 'TEST3', market)!
    expect(result.margemEbit).toBeNull()
    expect(result.margemLiquida).toBeNull()
  })

  it('should return null when no financial data', () => {
    const company = makeCompany({})
    const result = calculateIndicators(company, 'TEST3', market)
    expect(result).toBeNull()
  })

  it('should handle negative equity (P/VP null, ROE null)', () => {
    const company = makeCompany({
      patrimonioLiquido: -5e6,
      lucroLiquido: -8e6,
      receitaLiquida: 30e6,
    })
    const result = calculateIndicators(company, 'TEST3', market)!
    expect(result.pbRatio).toBeNull()
    expect(result.roe).toBeNull()
  })

  it('should not produce NaN or Infinity', () => {
    const company = makeCompany({
      ativoTotal: 0,
      ativoCirculante: 0,
      passivoCirculante: 0,
      patrimonioLiquido: 0,
      receitaLiquida: 100e6,
      lucroLiquido: 50e6,
    })
    const result = calculateIndicators(company, 'TEST3', market)!
    // Check no NaN/Infinity in any field
    for (const [key, value] of Object.entries(result)) {
      if (typeof value === 'number') {
        expect(isFinite(value), `${key} should be finite, got ${value}`).toBe(true)
      }
    }
  })
})

// ─── CAGR Tests ─────────────────────────────────────────────────

describe('calculateCAGR', () => {
  it('should calculate CAGR for growing revenue', () => {
    const statements: Record<string, CvmStatementData> = {
      '2020': { ...nullStmt(), receitaLiquida: 100 },
      '2021': { ...nullStmt(), receitaLiquida: 110 },
      '2022': { ...nullStmt(), receitaLiquida: 120 },
      '2023': { ...nullStmt(), receitaLiquida: 130 },
      '2024': { ...nullStmt(), receitaLiquida: 150 },
    }
    const years = ['2024', '2023', '2022', '2021', '2020']
    const cagr = calculateCAGR(statements, 'receitaLiquida', years)
    // CAGR = (150/100)^(1/4) - 1 = 10.67%
    expect(cagr).not.toBeNull()
    expect(cagr!).toBeCloseTo(10.67, 0)
  })

  it('should return null for negative initial value', () => {
    const statements: Record<string, CvmStatementData> = {
      '2020': { ...nullStmt(), lucroLiquido: -100 },
      '2024': { ...nullStmt(), lucroLiquido: 50 },
    }
    const cagr = calculateCAGR(statements, 'lucroLiquido', ['2024', '2020'])
    expect(cagr).toBeNull()
  })

  it('should return null for negative final value', () => {
    const statements: Record<string, CvmStatementData> = {
      '2020': { ...nullStmt(), lucroLiquido: 100 },
      '2024': { ...nullStmt(), lucroLiquido: -50 },
    }
    const cagr = calculateCAGR(statements, 'lucroLiquido', ['2024', '2020'])
    expect(cagr).toBeNull()
  })

  it('should return null for single year', () => {
    const statements: Record<string, CvmStatementData> = {
      '2024': { ...nullStmt(), receitaLiquida: 100 },
    }
    const cagr = calculateCAGR(statements, 'receitaLiquida', ['2024'])
    expect(cagr).toBeNull()
  })

  it('should return null for null values', () => {
    const statements: Record<string, CvmStatementData> = {
      '2020': { ...nullStmt() },
      '2024': { ...nullStmt() },
    }
    const cagr = calculateCAGR(statements, 'receitaLiquida', ['2024', '2020'])
    expect(cagr).toBeNull()
  })
})

// ─── CNPJ → Ticker Mapping Tests ────────────────────────────────

describe('buildCnpjTickerMap', () => {
  it('should match companies by exact normalized name', () => {
    const cadastro = [
      {
        cnpj: '33.000.167/0001-01',
        denomCia: 'PETROLEO BRASILEIRO S.A. - PETROBRAS',
        denomComercial: 'PETROBRAS',
        cdCvm: '9512',
        sitReg: 'ATIVO',
        tpMerc: 'BOLSA',
        categReg: '',
        setorAtiv: '',
      },
    ]

    const knownTickers = new Map([
      ['PETR4', 'PETROBRAS'],
      ['PETR3', 'PETROBRAS'],
      ['VALE3', 'VALE'],
    ])

    const result = buildCnpjTickerMap(cadastro, knownTickers)
    expect(result.mapFile.count).toBeGreaterThanOrEqual(1)

    // Both PETR3 and PETR4 should be mapped (same base symbol)
    expect(result.mapFile.mappings['PETR4']).toBeDefined()
    expect(result.mapFile.mappings['PETR3']).toBeDefined()
    expect(result.mapFile.mappings['PETR4']!.cnpj).toBe('33.000.167/0001-01')
    expect(result.mapFile.mappings['PETR3']!.cnpj).toBe('33.000.167/0001-01')
  })

  it('should match by contains when exact fails', () => {
    const cadastro = [
      {
        cnpj: '60.872.504/0001-23',
        denomCia: 'ITAU UNIBANCO HOLDING S.A.',
        denomComercial: 'ITAU UNIBANCO',
        cdCvm: '19348',
        sitReg: 'ATIVO',
        tpMerc: 'BOLSA',
        categReg: '',
        setorAtiv: '',
      },
    ]

    const knownTickers = new Map([
      ['ITUB4', 'ITAU UNIBANCO HOLDING'],
    ])

    const result = buildCnpjTickerMap(cadastro, knownTickers)
    expect(result.mapFile.count).toBeGreaterThanOrEqual(1)
  })

  it('should skip inactive or non-listed companies', () => {
    const cadastro = [
      {
        cnpj: '00.000.000/0001-00',
        denomCia: 'EMPRESA CANCELADA S.A.',
        denomComercial: 'CANCELADA',
        cdCvm: '99999',
        sitReg: 'CANCELADO',
        tpMerc: 'BOLSA',
        categReg: '',
        setorAtiv: '',
      },
      {
        cnpj: '11.111.111/0001-11',
        denomCia: 'EMPRESA BALCAO S.A.',
        denomComercial: 'BALCAO',
        cdCvm: '88888',
        sitReg: 'ATIVO',
        tpMerc: 'BALCÃO ORGANIZADO',
        categReg: '',
        setorAtiv: '',
      },
    ]

    const knownTickers = new Map([
      ['CANC3', 'CANCELADA'],
      ['BALC3', 'BALCAO'],
    ])

    const result = buildCnpjTickerMap(cadastro, knownTickers)
    // Cancelled company should be excluded
    expect(result.mapFile.mappings['CANC3']).toBeUndefined()
    // Balcão company should be excluded (only BOLSA accepted)
    expect(result.mapFile.mappings['BALC3']).toBeUndefined()
  })

  it('should handle empty inputs (still includes manual overrides)', () => {
    const result = buildCnpjTickerMap([], new Map())
    // Manual overrides (BPAC11, BPAC5, BPAC3) are always included
    expect(result.mapFile.count).toBe(3)
    expect(Object.keys(result.mapFile.mappings)).toHaveLength(3)
    expect(result.mapFile.mappings['BPAC11']).toBeDefined()
  })

  it('should map ON and PN variants to same CNPJ', () => {
    const cadastro = [
      {
        cnpj: '33.000.167/0001-01',
        denomCia: 'PETROLEO BRASILEIRO S.A.',
        denomComercial: 'PETROBRAS',
        cdCvm: '9512',
        sitReg: 'ATIVO',
        tpMerc: 'BOLSA',
        categReg: '',
        setorAtiv: '',
      },
    ]

    const knownTickers = new Map([
      ['PETR3', 'Petrobras ON'],
      ['PETR4', 'Petrobras PN'],
    ])

    const result = buildCnpjTickerMap(cadastro, knownTickers)
    const petr3 = result.mapFile.mappings['PETR3']
    const petr4 = result.mapFile.mappings['PETR4']

    // Both should exist and point to same CNPJ
    expect(petr3).toBeDefined()
    expect(petr4).toBeDefined()
    if (petr3 && petr4) {
      expect(petr3.cnpj).toBe(petr4.cnpj)
    }
  })

  it('should report unmatched tickers', () => {
    const cadastro = [
      {
        cnpj: '33.000.167/0001-01',
        denomCia: 'PETROBRAS',
        denomComercial: 'PETROBRAS',
        cdCvm: '9512',
        sitReg: 'ATIVO',
        tpMerc: 'BOLSA',
        categReg: '',
        setorAtiv: '',
      },
    ]

    const knownTickers = new Map([
      ['PETR4', 'PETROBRAS'],
      ['XYZW3', 'EMPRESA QUE NAO EXISTE NA CVM'],
    ])

    const result = buildCnpjTickerMap(cadastro, knownTickers)
    expect(result.unmatched.some(u => u.ticker === 'XYZW3')).toBe(true)
  })
})

// ─── getCvmFundamentals Tests ───────────────────────────────────

describe('getCvmFundamentals', () => {
  it('should calculate indicators from CVM data + market quotes', () => {
    const cvmData = {
      version: 1,
      updatedAt: new Date().toISOString(),
      yearsAvailable: [2024],
      companyCount: 1,
      companies: {
        '9512': {
          cnpj: '33.000.167/0001-01',
          cdCvm: '9512',
          companyName: 'PETROBRAS',
          statements: {
            '2024': {
              ativoTotal: 1000e6,
              ativoCirculante: 200e6,
              caixaEquivalentes: 80e6,
              passivoCirculante: 150e6,
              patrimonioLiquido: 400e6,
              emprestimosCp: 30e6,
              emprestimosLp: 200e6,
              receitaLiquida: 500e6,
              ebit: 150e6,
              resultadoFinanceiro: null,
              lucroLiquido: 100e6,
              depreciation: -40e6,
              contasAReceber: null,
              estoques: null,
              fornecedores: null,
              capitalSocial: null,
              fco: null,
              capexImobilizado: null,
              capexIntangivel: null,
            },
          },
        },
      },
    }

    // New ticker-keyed format
    const tickerMap: CnpjTickerMapFile = {
      version: 2,
      updatedAt: new Date().toISOString(),
      count: 1,
      mappings: {
        'PETR4': {
          cnpj: '33.000.167/0001-01',
          cdCvm: '9512',
          denomSocial: 'PETROLEO BRASILEIRO S.A.',
          matchMethod: 'exact',
        },
      },
    }

    const marketQuotes: MarketQuote[] = [
      { ticker: 'PETR4', price: 40.0, marketCap: 500e9 },
    ]

    const results = getCvmFundamentals(cvmData, tickerMap, marketQuotes)

    expect(results).toHaveLength(1)
    const petr = results[0]!
    expect(petr.ticker).toBe('PETR4')
    expect(petr.cotacao).toBe(40.0)

    // P/L = 500B / 100B = 5
    expect(petr.peRatio).toBe(5)
    // P/VP = 500B / 400B = 1.25
    expect(petr.pbRatio).toBe(1.25)
    // PSR = 500B / 500B = 1
    expect(petr.psr).toBe(1)
    // ROE = 100B / 400B * 100 = 25%
    expect(petr.roe).toBe(25)
    // Margem EBIT = 150B / 500B * 100 = 30%
    expect(petr.margemEbit).toBe(30)
    // Margem Líquida = 100B / 500B * 100 = 20%
    expect(petr.margemLiquida).toBe(20)
    // Liquidez = 200B / 150B = 1.33
    expect(petr.liquidezCorrente).toBeCloseTo(1.33, 1)
    // DY is null (comes from brapi, not CVM)
    expect(petr.dividendYield).toBeNull()
    // liq2meses is null
    expect(petr.liq2meses).toBeNull()
  })

  it('should return empty array when CVM data is null', () => {
    expect(getCvmFundamentals(null, null, [])).toHaveLength(0)
  })

  it('should return empty array when no market quotes match', () => {
    const cvmData = {
      version: 1,
      updatedAt: new Date().toISOString(),
      yearsAvailable: [2024],
      companyCount: 1,
      companies: {
        '9512': {
          cnpj: '33.000.167/0001-01',
          cdCvm: '9512',
          companyName: 'PETROBRAS',
          statements: {
            '2024': { ...nullStmt(), receitaLiquida: 500e6, lucroLiquido: 100e6 },
          },
        },
      },
    }

    const tickerMap: CnpjTickerMapFile = {
      version: 2,
      updatedAt: new Date().toISOString(),
      count: 1,
      mappings: {
        'PETR4': {
          cnpj: '33.000.167/0001-01',
          cdCvm: '9512',
          denomSocial: 'PETROBRAS',
          matchMethod: 'exact',
        },
      },
    }

    // No market quotes for PETR4
    const results = getCvmFundamentals(cvmData, tickerMap, [])
    expect(results).toHaveLength(0)
  })
})

// ─── Merge Integration Test ─────────────────────────────────────

describe('CVM + Market merge', () => {
  it('should calculate P/L from quote price + CVM profit', () => {
    const cvmData = {
      version: 1,
      updatedAt: new Date().toISOString(),
      yearsAvailable: [2024],
      companyCount: 1,
      companies: {
        '9512': {
          cnpj: '33.000.167/0001-01',
          cdCvm: '9512',
          companyName: 'PETROBRAS',
          statements: {
            '2024': {
              ...nullStmt(),
              receitaLiquida: 500e6,
              ebit: 150e6,
              lucroLiquido: 93e6,
              patrimonioLiquido: 350e6,
              ativoTotal: 1000e6,
            },
          },
        },
      },
    }

    const tickerMap: CnpjTickerMapFile = {
      version: 2,
      updatedAt: new Date().toISOString(),
      count: 1,
      mappings: {
        'PETR4': {
          cnpj: '33.000.167/0001-01',
          cdCvm: '9512',
          denomSocial: 'PETROBRAS',
          matchMethod: 'exact',
        },
      },
    }

    const quotes: MarketQuote[] = [
      { ticker: 'PETR4', price: 37, marketCap: 500e9 },
    ]

    const results = getCvmFundamentals(cvmData, tickerMap, quotes)
    expect(results).toHaveLength(1)
    const petr = results[0]!

    // P/L = marketCap / lucroLiquido = 500B / 93B ≈ 5.38
    expect(petr.peRatio).toBeCloseTo(5.38, 1)

    // P/VP = marketCap / PL = 500B / 350B ≈ 1.43
    expect(petr.pbRatio).toBeCloseTo(1.43, 1)
  })

  it('should return null multiples when marketCap is missing', () => {
    const cvmData = {
      version: 1,
      updatedAt: new Date().toISOString(),
      yearsAvailable: [2024],
      companyCount: 1,
      companies: {
        '9512': {
          cnpj: '33.000.167/0001-01',
          cdCvm: '9512',
          companyName: 'PETROBRAS',
          statements: {
            '2024': { ...nullStmt(), receitaLiquida: 500e6, lucroLiquido: 100e6 },
          },
        },
      },
    }

    const tickerMap: CnpjTickerMapFile = {
      version: 2,
      updatedAt: new Date().toISOString(),
      count: 1,
      mappings: {
        'PETR4': {
          cnpj: '33.000.167/0001-01',
          cdCvm: '9512',
          denomSocial: 'PETROBRAS',
          matchMethod: 'exact',
        },
      },
    }

    // marketCap = 0 → calculateIndicators returns null
    const results = getCvmFundamentals(cvmData, tickerMap, [
      { ticker: 'PETR4', price: 37, marketCap: 0 },
    ])
    expect(results).toHaveLength(0) // null marketCap → excluded
  })

  it('should handle partial CVM data', () => {
    const cvmData = {
      version: 1,
      updatedAt: new Date().toISOString(),
      yearsAvailable: [2024],
      companyCount: 1,
      companies: {
        '9512': {
          cnpj: '33.000.167/0001-01',
          cdCvm: '9512',
          companyName: 'PETROBRAS',
          statements: {
            '2024': {
              ...nullStmt(),
              // Only has revenue and profit — no balance sheet
              receitaLiquida: 500e6,
              lucroLiquido: 100e6,
            },
          },
        },
      },
    }

    const tickerMap: CnpjTickerMapFile = {
      version: 2,
      updatedAt: new Date().toISOString(),
      count: 1,
      mappings: {
        'PETR4': {
          cnpj: '33.000.167/0001-01',
          cdCvm: '9512',
          denomSocial: 'PETROBRAS',
          matchMethod: 'exact',
        },
      },
    }

    const results = getCvmFundamentals(cvmData, tickerMap, [
      { ticker: 'PETR4', price: 37, marketCap: 500e9 },
    ])
    expect(results).toHaveLength(1)
    const petr = results[0]!

    // Should have P/L and margin but not P/VP (no PL)
    expect(petr.peRatio).toBeDefined()
    expect(petr.pbRatio).toBeNull()
    expect(petr.margemLiquida).toBe(20)
  })
})

// ─── Helper ─────────────────────────────────────────────────────

function nullStmt(): CvmStatementData {
  return {
    ativoTotal: null,
    ativoCirculante: null,
    caixaEquivalentes: null,
    passivoCirculante: null,
    patrimonioLiquido: null,
    emprestimosCp: null,
    emprestimosLp: null,
    receitaLiquida: null,
    ebit: null,
    resultadoFinanceiro: null,
    lucroLiquido: null,
    depreciation: null,
    contasAReceber: null,
    estoques: null,
    fornecedores: null,
    capitalSocial: null,
    fco: null,
    capexImobilizado: null,
    capexIntangivel: null,
  }
}
