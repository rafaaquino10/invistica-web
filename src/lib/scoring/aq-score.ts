/**
 * IQ-Score™ Engine v3
 *
 * Proprietary scoring system (0-100) for Brazilian stocks.
 * 5 Pillars: Valuation 25%, Qualidade 25%, Risco 20%, Dividendos 15%, Crescimento 15%
 *
 * Features:
 * - Sector-calibrated weights and thresholds
 * - Post-calculation adjustments (liquidity, negative equity, triple negative)
 * - Confidence index based on data availability
 * - Deterministic, server-side only
 */

// ─── Types ──────────────────────────────────────────────────────────

export type AqClassificacao = 'Excepcional' | 'Saudável' | 'Atenção' | 'Crítico'

// ─── Sector Benchmarks ──────────────────────────────────────────────

export interface SectorBenchmarks {
  fairPE?: number
  fairPBV?: number
  targetROE?: number
  typicalMargin?: number
  maxDebtEbitda?: number
}

export type Setor =
  | 'bancos_financeiro'
  | 'seguradoras'
  | 'utilities_energia'
  | 'saneamento'
  | 'petroleo_gas'
  | 'mineracao'
  | 'siderurgia'
  | 'papel_celulose'
  | 'construcao_civil'
  | 'varejo_consumo'
  | 'tecnologia'
  | 'saude'
  | 'educacao'
  | 'telecom'
  | 'industrial'
  | 'agro'
  | 'transporte_logistica'
  | 'outros'

export interface DadosFundamentalistas {
  ticker: string
  cotacao: number | null

  // Valuation
  P_L: number | null
  P_VP: number | null
  PSR: number | null
  P_EBIT: number | null
  EV_EBIT: number | null
  EV_EBITDA: number | null

  // Quality
  ROIC: number | null
  ROE: number | null
  MRG_EBIT: number | null
  MRG_LIQUIDA: number | null

  // Risk
  LIQ_CORRENTE: number | null
  DIV_BRUT_PATRIM: number | null
  P_CAP_GIRO: number | null
  P_ATIV_CIRC_LIQ: number | null
  P_ATIVO: number | null
  PATRIM_LIQUIDO: number | null

  // Dividends
  DIV_YIELD: number | null
  DIV_EBITDA: number | null
  PAYOUT: number | null

  // Growth
  CRESC_REC_5A: number | null
  CRESC_LUCRO_5A: number | null

  // Meta
  LIQ_2MESES: number | null
  MARKET_CAP: number | null
  SETOR: string

  // Beta vs IBOV (rolling 12M) — opcional
  BETA?: number | null

  // Dividend Safety — FCF Coverage (FCF / Dividendos pagos estimados)
  FCF_COVERAGE?: number | null

  // Médias históricas 5 anos (para sinal contrarian e trend)
  ROE_MEDIA_5A?: number | null
  MRG_LIQUIDA_MEDIA_5A?: number | null

  // DCF Upside (%)
  DCF_UPSIDE?: number | null

  // ─── Qualitative Metrics v2 ─────────────────────────────────
  MOAT_SCORE?: number | null           // 0-100, vantagem competitiva
  EARNINGS_QUALITY?: number | null     // 0-100, qualidade dos lucros
  MANAGEMENT_SCORE?: number | null     // 0-100, qualidade da gestão
  DEBT_SUSTAINABILITY?: number | null  // 0-100, sustentabilidade da dívida
  REGULATORY_RISK?: number | null      // 0-100, risco regulatório

  // ─── Live Signals (Frente D) ────────────────────────────────
  GOVERNANCE_SCORE?: number | null     // 0-100, governança corporativa
  NEWS_SENTIMENT?: number | null       // 0-100 (50=neutro)
  CEO_TENURE?: number | null           // 0-100
  BUYBACK_SIGNAL?: number | null       // 80 se ativo, 40 se não
  LISTING_SEGMENT?: number | null      // 0-100 (NM=100, N2=80, etc.)
  FREE_FLOAT?: number | null           // 0-100
  CVM_SANCTIONS?: number | null        // 0-100 (0 sanções=100)
  CATALYST_ALERT?: number | null       // 0-100 (0 alertas=100)
  RI_EVENT_VOLUME?: number | null      // Volume de comunicados 30d
}

export interface SubNota {
  indicador: string
  valor: number | null
  nota: number       // 0-10
  pesoInterno: number
  direcao: 'menor_melhor' | 'maior_melhor'
  referencia: { nota10: number; nota5: number; nota0: number }
}

export interface PilarResult {
  nota: number          // 0-100
  pesoEfetivo: number
  subNotas: SubNota[]
  destaque: string
}

export interface AjustesAplicados {
  filtroLiquidez: number         // Equivalent penalty in pts for display
  fatorLiquidez: number          // Multiplicative factor (0.0-1.0)
  fatorConfianca: number         // Confidence factor (0.0-1.0)
  fatorMacro: number             // Macro factor (0.85-1.05)
  macroReason: string | null     // Explanation for macro adjustment
  penalPatrimNegativo: boolean
  penalTriploNegativo: boolean
  sanityWarnings: string[]
  scoreBruto: number             // Raw weighted score before adjustments
  total: number                  // Effective penalty in pts (approximate)
  betaPenalty: {
    applied: boolean
    beta: number | null
    penaltyFactor: number        // 1.0 se não aplicado
    regime: string
  }
  cagedAdjustment: {
    applied: boolean
    trend: CagedTrend | null
    adjustment: number           // +2, 0, -2
  }
  sentimentAdjustment: {
    applied: boolean
    factor: number               // 0.95-1.05, 1.0 se não aplicado
    reason: string | null
  }
  trendAdjustment: {
    applied: boolean
    score: number                // -2 a +2, 0 se não aplicado
  }
}

export interface ContrarianSignal {
  triggered: boolean
  reason: string | null
  indicators: { name: string; current: number; media5a: number; ratio: number }[]
}

export interface AqScoreResult {
  ticker: string
  score: number
  classificacao: AqClassificacao
  pilares: {
    valuation: PilarResult
    qualidade: PilarResult
    risco: PilarResult
    dividendos: PilarResult
    crescimento: PilarResult
    qualitativo: PilarResult
  }
  sectorBenchmarks: SectorBenchmarks
  ajustes: AjustesAplicados
  contrarian: ContrarianSignal
  metadata: {
    dataCalculo: Date
    indicadoresDisponiveis: number
    indicadoresTotais: number
    confiabilidade: number
  }
}

// ─── Legacy-compatible exports ──────────────────────────────────────
// Kept for backward compat with components that consume the old shape

export interface FundamentalData {
  peRatio?: number | null
  pbRatio?: number | null
  evEbitda?: number | null
  roe?: number | null
  roic?: number | null
  netMargin?: number | null
  ebitdaMargin?: number | null
  revenueGrowth?: number | null
  earningsGrowth?: number | null
  dividendYield?: number | null
  payoutRatio?: number | null
  dividendYearsConsistent?: number | null
  netDebtEbitda?: number | null
  beta?: number | null
  volatility252d?: number | null
}

export interface AQScoreResult {
  scoreTotal: number
  scoreValuation: number
  scoreQuanti: number
  scoreOperational: number
  scoreQuali: number
  scoreQuanti: number
  breakdown: {
    valuation: Record<string, { value: number | null; score: number; weight: number }>
    quality: Record<string, { value: number | null; score: number; weight: number }>
    growth: Record<string, { value: number | null; score: number; weight: number }>
    dividends: Record<string, { value: number | null; score: number; weight: number }>
    risk: Record<string, { value: number | null; score: number; weight: number }>
  }
  // v3 extended fields (optional for backward compat)
  classificacao?: AqClassificacao
  confiabilidade?: number
  ajustes?: AjustesAplicados
  pilaresDetalhados?: AqScoreResult['pilares'] extends never ? never : {
    valuation: PilarResult
    qualidade: PilarResult
    risco: PilarResult
    dividendos: PilarResult
    crescimento: PilarResult
    qualitativo: PilarResult
  }
}

// ─── Constants ──────────────────────────────────────────────────────

// ─── Peso Quantitativo/Qualitativo (60/40 quantamental) ─────────
export const QUANT_WEIGHT = 0.40
export const QUAL_WEIGHT = 0.60

export const PILLAR_WEIGHTS = {
  valuation: 0.22,
  quality: 0.25,
  risk: 0.18,
  dividends: 0.08,
  growth: 0.12,
  qualitativo: 0.15,
} as const

export const CORES_CLASSIFICACAO = {
  Excepcional: '#1A73E8',
  Saudável: '#0D9488',
  Atenção: '#D97706',
  Crítico: '#EF4444',
} as const

// ─── Pillar Configs ─────────────────────────────────────────────────

interface IndicadorConfig {
  peso: number
  direcao: 'menor_melhor' | 'maior_melhor'
  penalizarNegativo: boolean
  faixas: { nota10: number; nota5: number; nota0: number }
}

const VALUATION_CONFIG: Record<string, IndicadorConfig> = {
  P_L:        { peso: 0.19, direcao: 'menor_melhor', penalizarNegativo: true,  faixas: { nota10: 8, nota5: 15, nota0: 40 } },
  P_VP:       { peso: 0.17, direcao: 'menor_melhor', penalizarNegativo: false, faixas: { nota10: 1.0, nota5: 2.5, nota0: 6.0 } },
  PSR:        { peso: 0.07, direcao: 'menor_melhor', penalizarNegativo: false, faixas: { nota10: 0.5, nota5: 2.0, nota0: 6.0 } },
  P_EBIT:     { peso: 0.13, direcao: 'menor_melhor', penalizarNegativo: true,  faixas: { nota10: 6, nota5: 12, nota0: 25 } },
  EV_EBIT:    { peso: 0.13, direcao: 'menor_melhor', penalizarNegativo: true,  faixas: { nota10: 8, nota5: 14, nota0: 25 } },
  EV_EBITDA:  { peso: 0.17, direcao: 'menor_melhor', penalizarNegativo: true,  faixas: { nota10: 5, nota5: 9, nota0: 20 } },
  // DCF Upside: desconto ao valor intrínseco (>30% = barato, <-20% = caro)
  // Nota padrão 4 quando DCF indisponível (confidence baixa ou FCF negativo)
  DCF_UPSIDE: { peso: 0.14, direcao: 'maior_melhor', penalizarNegativo: false, faixas: { nota10: 30, nota5: 0, nota0: -20 } },
}

const QUALIDADE_CONFIG: Record<string, IndicadorConfig> = {
  ROIC:        { peso: 0.30, direcao: 'maior_melhor', penalizarNegativo: true, faixas: { nota10: 20, nota5: 10, nota0: 2 } },
  ROE:         { peso: 0.25, direcao: 'maior_melhor', penalizarNegativo: true, faixas: { nota10: 25, nota5: 12, nota0: 2 } },
  MRG_EBIT:    { peso: 0.25, direcao: 'maior_melhor', penalizarNegativo: true, faixas: { nota10: 30, nota5: 15, nota0: 3 } },
  MRG_LIQUIDA: { peso: 0.20, direcao: 'maior_melhor', penalizarNegativo: true, faixas: { nota10: 20, nota5: 10, nota0: 1 } },
}

const RISCO_CONFIG: Record<string, IndicadorConfig> = {
  LIQ_CORRENTE:    { peso: 0.25, direcao: 'maior_melhor', penalizarNegativo: false, faixas: { nota10: 2.0, nota5: 1.2, nota0: 0.5 } },
  DIV_BRUT_PATRIM: { peso: 0.30, direcao: 'menor_melhor', penalizarNegativo: false, faixas: { nota10: 0.3, nota5: 1.0, nota0: 2.5 } },
  BETA:            { peso: 0.15, direcao: 'menor_melhor', penalizarNegativo: false, faixas: { nota10: 0.6, nota5: 1.0, nota0: 1.8 } },
  P_CAP_GIRO:      { peso: 0.12, direcao: 'menor_melhor', penalizarNegativo: false, faixas: { nota10: 3, nota5: 8, nota0: 20 } },
  P_ATIV_CIRC_LIQ: { peso: 0.08, direcao: 'menor_melhor', penalizarNegativo: false, faixas: { nota10: 1, nota5: 3, nota0: 10 } },
  P_ATIVO:         { peso: 0.10, direcao: 'menor_melhor', penalizarNegativo: false, faixas: { nota10: 0.3, nota5: 0.8, nota0: 2.0 } },
}

const DIVIDENDOS_CONFIG: Record<string, IndicadorConfig> = {
  DIV_YIELD:    { peso: 0.45, direcao: 'maior_melhor', penalizarNegativo: false, faixas: { nota10: 8, nota5: 4, nota0: 0.5 } },
  DIV_EBITDA:   { peso: 0.20, direcao: 'menor_melhor', penalizarNegativo: false, faixas: { nota10: 0.5, nota5: 1.5, nota0: 4.0 } },
  PAYOUT:       { peso: 0.15, direcao: 'maior_melhor', penalizarNegativo: false, faixas: { nota10: 60, nota5: 30, nota0: 5 } },
  FCF_COVERAGE: { peso: 0.20, direcao: 'maior_melhor', penalizarNegativo: false, faixas: { nota10: 2.0, nota5: 1.2, nota0: 0.5 } },
}

const CRESCIMENTO_CONFIG: Record<string, IndicadorConfig> = {
  CRESC_REC_5A:   { peso: 0.60, direcao: 'maior_melhor', penalizarNegativo: false, faixas: { nota10: 20, nota5: 8, nota0: -5 } },
  CRESC_LUCRO_5A: { peso: 0.25, direcao: 'maior_melhor', penalizarNegativo: false, faixas: { nota10: 25, nota5: 10, nota0: -10 } },
  PEG_RATIO:      { peso: 0.15, direcao: 'menor_melhor', penalizarNegativo: true,  faixas: { nota10: 0.5, nota5: 1.2, nota0: 3.0 } },
}

// ─── 6º Pilar: Qualitativo (60% do score final no modelo 60/40) ──────
// 5 blocos redesenhados com dados vivos + CVM:
//   Moat 30%, Gestão 25%, Governança 20%, Regulatório 15%, Earnings Quality 10%
const QUALITATIVO_CONFIG: Record<string, IndicadorConfig> = {
  // Bloco 1: Moat / Vantagem Competitiva (30%)
  MOAT_SCORE:            { peso: 0.30, direcao: 'maior_melhor', penalizarNegativo: false, faixas: { nota10: 80, nota5: 50, nota0: 20 } },
  // Bloco 2: Qualidade da Gestão (25%) — CVM + live signals
  MANAGEMENT_SCORE:      { peso: 0.25, direcao: 'maior_melhor', penalizarNegativo: false, faixas: { nota10: 80, nota5: 50, nota0: 20 } },
  // Bloco 3: Governança Corporativa (20%) — B3 listing + free float + sanctions
  GOVERNANCE_SCORE:      { peso: 0.20, direcao: 'maior_melhor', penalizarNegativo: false, faixas: { nota10: 80, nota5: 50, nota0: 20 } },
  // Bloco 4: Risco Regulatório (15%) — setor + catalyst alerts + RI events
  REGULATORY_RISK:       { peso: 0.15, direcao: 'maior_melhor', penalizarNegativo: false, faixas: { nota10: 80, nota5: 50, nota0: 20 } },
  // Bloco 5: Earnings Quality (10%)
  EARNINGS_QUALITY:      { peso: 0.10, direcao: 'maior_melhor', penalizarNegativo: false, faixas: { nota10: 85, nota5: 55, nota0: 25 } },
}

// ─── Sector Weights ─────────────────────────────────────────────────

interface PesosSetor {
  valuation: number
  qualidade: number
  risco: number
  dividendos: number
  crescimento: number
  qualitativo: number
}

// Pesos setoriais: modelo 60/40 quantamental.
// Qualitativo = 60% do score final. Os 5 pilares quantitativos = 40%.
// Dentro dos 40% quant, distribuição por setor normalizada para somar 0.40.
// Qualitativo fixo 0.60 para todos os setores.
export const PESOS_POR_SETOR: Record<Setor, PesosSetor> = {
  outros:               { valuation: 0.10, qualidade: 0.12, risco: 0.08, dividendos: 0.04, crescimento: 0.06, qualitativo: 0.60 },
  bancos_financeiro:    { valuation: 0.13, qualidade: 0.11, risco: 0.03, dividendos: 0.08, crescimento: 0.05, qualitativo: 0.60 },
  seguradoras:          { valuation: 0.13, qualidade: 0.11, risco: 0.03, dividendos: 0.08, crescimento: 0.05, qualitativo: 0.60 },
  utilities_energia:    { valuation: 0.08, qualidade: 0.08, risco: 0.08, dividendos: 0.10, crescimento: 0.06, qualitativo: 0.60 },
  saneamento:           { valuation: 0.08, qualidade: 0.08, risco: 0.10, dividendos: 0.08, crescimento: 0.06, qualitativo: 0.60 },
  petroleo_gas:         { valuation: 0.13, qualidade: 0.11, risco: 0.08, dividendos: 0.04, crescimento: 0.04, qualitativo: 0.60 },
  mineracao:            { valuation: 0.13, qualidade: 0.11, risco: 0.08, dividendos: 0.04, crescimento: 0.04, qualitativo: 0.60 },
  siderurgia:           { valuation: 0.13, qualidade: 0.11, risco: 0.08, dividendos: 0.04, crescimento: 0.04, qualitativo: 0.60 },
  papel_celulose:       { valuation: 0.10, qualidade: 0.12, risco: 0.08, dividendos: 0.04, crescimento: 0.06, qualitativo: 0.60 },
  construcao_civil:     { valuation: 0.10, qualidade: 0.10, risco: 0.10, dividendos: 0.02, crescimento: 0.08, qualitativo: 0.60 },
  varejo_consumo:       { valuation: 0.08, qualidade: 0.12, risco: 0.08, dividendos: 0.02, crescimento: 0.10, qualitativo: 0.60 },
  tecnologia:           { valuation: 0.05, qualidade: 0.11, risco: 0.05, dividendos: 0.01, crescimento: 0.18, qualitativo: 0.60 },
  saude:                { valuation: 0.10, qualidade: 0.12, risco: 0.10, dividendos: 0.02, crescimento: 0.06, qualitativo: 0.60 },
  educacao:             { valuation: 0.10, qualidade: 0.12, risco: 0.08, dividendos: 0.02, crescimento: 0.08, qualitativo: 0.60 },
  telecom:              { valuation: 0.10, qualidade: 0.08, risco: 0.08, dividendos: 0.10, crescimento: 0.04, qualitativo: 0.60 },
  industrial:           { valuation: 0.10, qualidade: 0.12, risco: 0.08, dividendos: 0.04, crescimento: 0.06, qualitativo: 0.60 },
  agro:                 { valuation: 0.10, qualidade: 0.12, risco: 0.10, dividendos: 0.02, crescimento: 0.06, qualitativo: 0.60 },
  transporte_logistica: { valuation: 0.10, qualidade: 0.12, risco: 0.08, dividendos: 0.04, crescimento: 0.06, qualitativo: 0.60 },
}

// ─── Sector Adjustments ─────────────────────────────────────────────

interface AjusteSetorial {
  valuation_tolerancia: number
  margens_ajuste: { nota10: number; nota5: number; nota0: number } | null
  ignorar_indicadores: string[]
  /** Per-indicator threshold overrides for this sector */
  threshold_overrides?: Record<string, { nota10: number; nota5: number; nota0: number }>
}

export const AJUSTES_SETORIAIS: Partial<Record<Setor, AjusteSetorial>> = {
  bancos_financeiro: {
    valuation_tolerancia: 1.0,
    margens_ajuste: null,
    ignorar_indicadores: ['P_CAP_GIRO', 'P_ATIV_CIRC_LIQ', 'LIQ_CORRENTE', 'PSR', 'ROIC', 'MRG_EBIT', 'MRG_LIQUIDA', 'EV_EBIT', 'EV_EBITDA', 'DIV_EBITDA'],
    threshold_overrides: {
      // Quality: ROE thresholds calibrated for Brazilian banks (Itaú ~20%, BB ~18%)
      ROE:             { nota10: 20, nota5: 12, nota0: 2 },
      // Risk: Banks naturally operate with high leverage — use banking thresholds
      DIV_BRUT_PATRIM: { nota10: 30, nota5: 80, nota0: 150 },
      // Dividends: DY 4-5% is normal/healthy for large banks
      DIV_YIELD:       { nota10: 7,  nota5: 4,  nota0: 0.5 },
      PAYOUT:          { nota10: 50, nota5: 30, nota0: 5 },
      // Growth: Mature banks grow 3-8%/year, not 20%
      CRESC_REC_5A:    { nota10: 12, nota5: 5,  nota0: -5 },
      CRESC_LUCRO_5A:  { nota10: 15, nota5: 7,  nota0: -10 },
    },
  },
  seguradoras: {
    valuation_tolerancia: 1.0,
    margens_ajuste: null,
    ignorar_indicadores: ['P_CAP_GIRO', 'P_ATIV_CIRC_LIQ', 'LIQ_CORRENTE', 'PSR', 'ROIC', 'MRG_EBIT', 'MRG_LIQUIDA', 'EV_EBIT', 'EV_EBITDA', 'DIV_EBITDA'],
    threshold_overrides: {
      ROE:             { nota10: 20, nota5: 12, nota0: 2 },
      DIV_BRUT_PATRIM: { nota10: 30, nota5: 80, nota0: 150 },
      DIV_YIELD:       { nota10: 7,  nota5: 4,  nota0: 0.5 },
      PAYOUT:          { nota10: 50, nota5: 30, nota0: 5 },
      CRESC_REC_5A:    { nota10: 12, nota5: 5,  nota0: -5 },
      CRESC_LUCRO_5A:  { nota10: 15, nota5: 7,  nota0: -10 },
    },
  },
  utilities_energia: {
    valuation_tolerancia: 1.2,
    margens_ajuste: null,
    ignorar_indicadores: [],
  },
  varejo_consumo: {
    valuation_tolerancia: 1.0,
    margens_ajuste: { nota10: 12, nota5: 5, nota0: 0 },
    ignorar_indicadores: [],
  },
  tecnologia: {
    valuation_tolerancia: 1.5,
    margens_ajuste: null,
    ignorar_indicadores: [],
  },
  petroleo_gas: {
    valuation_tolerancia: 1.0,
    margens_ajuste: null,
    ignorar_indicadores: ['P_CAP_GIRO'],
  },
  construcao_civil: {
    valuation_tolerancia: 0.9,
    margens_ajuste: { nota10: 15, nota5: 8, nota0: 1 },
    ignorar_indicadores: [],
  },
  industrial: {
    valuation_tolerancia: 1.15,
    margens_ajuste: null,
    ignorar_indicadores: [],
  },
  saude: {
    valuation_tolerancia: 1.1,
    margens_ajuste: null,
    ignorar_indicadores: [],
  },
}

// ─── Sector Benchmarks Map ──────────────────────────────────────────

export const SECTOR_BENCHMARKS: Partial<Record<Setor, SectorBenchmarks>> = {
  bancos_financeiro:    { fairPE: 10, targetROE: 18 },
  tecnologia:           { fairPE: 25, targetROE: 15 },
  varejo_consumo:       { fairPE: 15, typicalMargin: 3, maxDebtEbitda: 3.0 },
  utilities_energia:    { fairPE: 12, targetROE: 12 },
  mineracao:            { fairPE: 7, targetROE: 20 },
  petroleo_gas:         { fairPE: 7, targetROE: 20 },
  saude:                { fairPE: 18, targetROE: 15 },
  construcao_civil:     { fairPE: 10, maxDebtEbitda: 4.0 },
  siderurgia:           { fairPE: 8, targetROE: 15, maxDebtEbitda: 3.0 },
  papel_celulose:       { fairPE: 10, targetROE: 12, maxDebtEbitda: 3.5 },
  seguradoras:          { fairPE: 12, targetROE: 18 },
  saneamento:           { fairPE: 12, targetROE: 10 },
  telecom:              { fairPE: 14, targetROE: 12 },
  industrial:           { fairPE: 15, targetROE: 15 },
  educacao:             { fairPE: 15, targetROE: 12 },
  agro:                 { fairPE: 10, targetROE: 15, maxDebtEbitda: 3.0 },
  transporte_logistica: { fairPE: 12, targetROE: 12, maxDebtEbitda: 3.5 },
}

export function getSectorBenchmarks(setor: Setor): SectorBenchmarks {
  return SECTOR_BENCHMARKS[setor] ?? {}
}

// ─── Sector Mapping ─────────────────────────────────────────────────

const SETOR_MAP: Record<string, Setor> = {
  'Bancos': 'bancos_financeiro',
  'Financeiro': 'bancos_financeiro',
  'Seguros': 'seguradoras',
  'Energia Elétrica': 'utilities_energia',
  'Saneamento': 'saneamento',
  'Petróleo e Gás': 'petroleo_gas',
  'Mineração': 'mineracao',
  'Siderurgia': 'siderurgia',
  'Papel e Celulose': 'papel_celulose',
  'Imobiliário': 'construcao_civil',
  'Shopping Centers': 'construcao_civil',
  'Varejo': 'varejo_consumo',
  'Alimentos e Bebidas': 'varejo_consumo',
  'Atacado': 'varejo_consumo',
  'Tecnologia': 'tecnologia',
  'Saúde': 'saude',
  'Educação': 'educacao',
  'Telecomunicações': 'telecom',
  'Bens Industriais': 'industrial',
  'Agronegócio': 'agro',
  'Logística': 'transporte_logistica',
  'Transporte': 'transporte_logistica',
  'Locação': 'transporte_logistica',
  'Outros': 'outros',
}

export function mapearSetor(setorBruto: string, _ticker?: string): Setor {
  return SETOR_MAP[setorBruto] || 'outros'
}

// ─── Core Normalization ─────────────────────────────────────────────

function normalizar(
  valor: number | null | undefined,
  nota10: number,
  nota0: number,
  direcao: 'menor_melhor' | 'maior_melhor',
  penalizarNegativo: boolean = false
): number {
  if (valor === null || valor === undefined || isNaN(valor)) return 4

  if (penalizarNegativo && valor < 0) return 0

  if (direcao === 'menor_melhor') {
    if (valor <= nota10) return 10
    if (valor >= nota0) return 0
    return 10 * (nota0 - valor) / (nota0 - nota10)
  } else {
    if (valor >= nota10) return 10
    if (valor <= nota0) return 0
    return 10 * (valor - nota0) / (nota10 - nota0)
  }
}

// ─── Sector-adjusted config helpers ─────────────────────────────────

function ajustarConfigPorSetor(
  config: Record<string, IndicadorConfig>,
  setor: Setor,
  pilar: 'valuation' | 'qualidade' | 'risco' | 'dividendos' | 'crescimento' | 'qualitativo'
): Record<string, IndicadorConfig> {
  const ajuste = AJUSTES_SETORIAIS[setor]
  if (!ajuste) return config

  const resultado: Record<string, IndicadorConfig> = {}

  for (const [key, cfg] of Object.entries(config)) {
    if (ajuste.ignorar_indicadores.includes(key)) continue

    let faixas = { ...cfg.faixas }

    // Apply per-indicator threshold overrides (highest priority)
    if (ajuste.threshold_overrides?.[key]) {
      faixas = { ...ajuste.threshold_overrides[key] }
    }
    // Apply valuation tolerance
    else if (pilar === 'valuation' && ajuste.valuation_tolerancia !== 1.0 && cfg.direcao === 'menor_melhor') {
      faixas = {
        nota10: faixas.nota10 * ajuste.valuation_tolerancia,
        nota5: faixas.nota5 * ajuste.valuation_tolerancia,
        nota0: faixas.nota0 * ajuste.valuation_tolerancia,
      }
    }
    // Apply margin adjustments for quality pillar
    else if (pilar === 'qualidade' && ajuste.margens_ajuste && (key === 'MRG_EBIT' || key === 'MRG_LIQUIDA')) {
      faixas = { ...ajuste.margens_ajuste }
    }

    resultado[key] = { ...cfg, faixas }
  }

  return resultado
}

// ─── Pillar Calculators ─────────────────────────────────────────────

function calcularPilar(
  dados: DadosFundamentalistas,
  configBase: Record<string, IndicadorConfig>,
  setor: Setor,
  pilar: 'valuation' | 'qualidade' | 'risco' | 'dividendos' | 'crescimento' | 'qualitativo',
  extraValues?: Record<string, number | null>
): PilarResult {
  const config = ajustarConfigPorSetor(configBase, setor, pilar)
  const subNotas: SubNota[] = []
  let somaNotaPonderada = 0
  let somaPesos = 0

  for (const [key, cfg] of Object.entries(config)) {
    const valor = extraValues?.[key] !== undefined
      ? extraValues[key]
      : (dados as any)[key] as number | null ?? null

    const nota = normalizar(valor, cfg.faixas.nota10, cfg.faixas.nota0, cfg.direcao, cfg.penalizarNegativo)

    subNotas.push({
      indicador: key,
      valor,
      nota,
      pesoInterno: cfg.peso,
      direcao: cfg.direcao,
      referencia: cfg.faixas,
    })

    somaNotaPonderada += nota * cfg.peso
    somaPesos += cfg.peso
  }

  const notaPilar = somaPesos > 0 ? (somaNotaPonderada / somaPesos) * 10 : 50
  const pesos = PESOS_POR_SETOR[setor]

  const pesoMap: Record<string, number> = {
    valuation: pesos.valuation,
    qualidade: pesos.qualidade,
    risco: pesos.risco,
    dividendos: pesos.dividendos,
    crescimento: pesos.crescimento,
    qualitativo: pesos.qualitativo,
  }

  return {
    nota: Math.round(notaPilar * 10) / 10,
    pesoEfetivo: pesoMap[pilar] ?? 0.15,
    subNotas,
    destaque: gerarDestaque(pilar, subNotas),
  }
}

function calcularValuation(dados: DadosFundamentalistas, setor: Setor): PilarResult {
  return calcularPilar(dados, VALUATION_CONFIG, setor, 'valuation')
}

function calcularQualidade(dados: DadosFundamentalistas, setor: Setor): PilarResult {
  return calcularPilar(dados, QUALIDADE_CONFIG, setor, 'qualidade')
}

function calcularRisco(dados: DadosFundamentalistas, setor: Setor): PilarResult {
  const result = calcularPilar(dados, RISCO_CONFIG, setor, 'risco')

  // Special rule: negative equity caps risk score at 25
  if (dados.PATRIM_LIQUIDO !== null && dados.PATRIM_LIQUIDO < 0) {
    result.nota = Math.min(result.nota, 25)
    result.destaque = 'Patrimônio líquido negativo'
  }

  // Special rule: Dív/Patrim > 3 caps risk score at 20
  if (dados.DIV_BRUT_PATRIM !== null && dados.DIV_BRUT_PATRIM > 3) {
    result.nota = Math.min(result.nota, 20)
    if (!result.destaque.includes('Patrimônio')) {
      result.destaque = 'Endividamento excessivo'
    }
  }

  return result
}

function calcularDividendos(dados: DadosFundamentalistas, setor: Setor): PilarResult {
  const result = calcularPilar(dados, DIVIDENDOS_CONFIG, setor, 'dividendos')

  // Special rule: FCF coverage < 1.0 = dividendo insustentável → penaliza -3pts na sub-nota
  if (dados.FCF_COVERAGE != null && dados.FCF_COVERAGE < 1.0 && dados.FCF_COVERAGE >= 0) {
    const fcfSub = result.subNotas.find(s => s.indicador === 'FCF_COVERAGE')
    if (fcfSub) {
      fcfSub.nota = Math.max(0, fcfSub.nota - 3)
    }
    if (!result.destaque.includes('Payout')) {
      result.destaque = 'Dividendo em risco: FCF não cobre distribuição'
    }
  } else if (dados.FCF_COVERAGE != null && dados.FCF_COVERAGE >= 1.0 && dados.FCF_COVERAGE < 1.5) {
    // Warning intermediário: coverage entre 1.0x e 1.5x — sustentabilidade frágil
    if (!result.destaque.includes('Payout') && !result.destaque.includes('FCF')) {
      result.destaque = 'Atenção: cobertura de dividendos por FCF abaixo de 1.5x'
    }
  }

  // Special rule: payout > 100% penalizes
  if (dados.PAYOUT !== null && dados.PAYOUT > 100) {
    const payoutSub = result.subNotas.find(s => s.indicador === 'PAYOUT')
    if (payoutSub) {
      payoutSub.nota = Math.max(0, payoutSub.nota - 4)
    }
    // Recalculate pillar score
    let soma = 0, pesos = 0
    for (const sub of result.subNotas) {
      soma += sub.nota * sub.pesoInterno
      pesos += sub.pesoInterno
    }
    result.nota = pesos > 0 ? Math.round((soma / pesos) * 100) / 10 : 50
  }

  return result
}

function calcularCrescimento(dados: DadosFundamentalistas, setor: Setor): PilarResult {
  // Calculate PEG ratio as derived indicator
  // PEG = P/L / Crescimento de LUCRO (não receita). Definição original Peter Lynch.
  // Fallback para crescimento de receita só se lucro indisponível.
  let pegRatio: number | null = null
  if (dados.P_L && dados.P_L > 0) {
    if (dados.CRESC_LUCRO_5A && dados.CRESC_LUCRO_5A > 0) {
      pegRatio = dados.P_L / dados.CRESC_LUCRO_5A
    } else if (dados.CRESC_REC_5A && dados.CRESC_REC_5A > 0) {
      pegRatio = dados.P_L / dados.CRESC_REC_5A
    }
  }

  return calcularPilar(dados, CRESCIMENTO_CONFIG, setor, 'crescimento', { PEG_RATIO: pegRatio })
}

function calcularQualitativo(dados: DadosFundamentalistas, setor: Setor): PilarResult {
  return calcularPilar(dados, QUALITATIVO_CONFIG, setor, 'qualitativo')
}

// ─── Multiplicative Liquidity Factor ────────────────────────────────

function calcularFatorLiquidez(dados: DadosFundamentalistas): number {
  const liq = dados.LIQ_2MESES
  const mktCap = dados.MARKET_CAP

  if (liq !== null && liq > 0) {
    if (liq >= 10_000_000) return 1.00
    if (liq >= 5_000_000)  return 0.98
    if (liq >= 1_000_000)  return 0.95
    if (liq >= 500_000)    return 0.90
    if (liq >= 100_000)    return 0.80
    return 0.65
  }

  // No volume data — use market cap as proxy
  if (mktCap !== null && mktCap > 0) {
    if (mktCap >= 10_000_000_000) return 0.95
    if (mktCap >= 1_000_000_000)  return 0.85
    return 0.70
  }

  return 0.60  // No data at all
}

// ─── Confidence Penalty (Multiplicative) ────────────────────────────

function calcularFatorConfianca(disponveis: number, totais: number): number {
  if (totais === 0) return 0.60
  const ratio = disponveis / totais
  // Smooth linear curve instead of harsh step functions
  if (ratio >= 0.85) return 1.00
  if (ratio >= 0.50) return 0.80 + (ratio - 0.50) * (0.20 / 0.35)  // 0.80 → 1.00
  return 0.65 + (ratio / 0.50) * 0.15                               // 0.65 → 0.80
}

// ─── Sanity Checks ──────────────────────────────────────────────────

function aplicarSanityChecks(
  score: number,
  scoreBruto: number,
  dados: DadosFundamentalistas,
  conf: { disponveis: number; totais: number }
): { score: number; warnings: string[] } {
  const warnings: string[] = []
  let s = score

  // Micro cap + illiquid → cap 80 (check bruto score to detect the condition)
  if ((dados.MARKET_CAP ?? 0) < 500_000_000 && (dados.LIQ_2MESES ?? 0) < 100_000) {
    if (scoreBruto > 80) { warnings.push('Score limitado: micro cap com liquidez baixa') }
    if (s > 80) { s = 80 }
  }

  // Low data coverage → warning only (confidence factor already penalizes proportionally)
  if (conf.totais > 0 && (conf.disponveis / conf.totais) < 0.50) {
    warnings.push('Dados limitados: menos de 50% dos indicadores disponíveis')
  }

  // DY > 20% → warning only
  if (dados.DIV_YIELD !== null && dados.DIV_YIELD > 20) {
    warnings.push('DY > 20%: possível dividendo extraordinário')
  }

  return { score: s, warnings }
}

// ─── Post-calculation Adjustments ───────────────────────────────────

function calcularAjustes(dados: DadosFundamentalistas): Omit<AjustesAplicados, 'fatorLiquidez' | 'fatorConfianca' | 'fatorMacro' | 'macroReason' | 'sanityWarnings' | 'scoreBruto' | 'betaPenalty' | 'cagedAdjustment' | 'sentimentAdjustment' | 'trendAdjustment'> {
  const ajustes = {
    filtroLiquidez: 0,
    penalPatrimNegativo: false,
    penalTriploNegativo: false,
    total: 0,
  }

  // Liquidity filter (kept for display — shows equivalent additive penalty)
  if (dados.LIQ_2MESES !== null) {
    if (dados.LIQ_2MESES < 100_000) {
      ajustes.filtroLiquidez = -100
    } else if (dados.LIQ_2MESES < 500_000) {
      ajustes.filtroLiquidez = -10
    } else if (dados.LIQ_2MESES < 1_000_000) {
      ajustes.filtroLiquidez = -5
    }
  }

  // Negative equity
  if (dados.PATRIM_LIQUIDO !== null && dados.PATRIM_LIQUIDO < 0) {
    ajustes.penalPatrimNegativo = true
  }

  // Triple negative (ROIC < 0 AND ROE < 0 AND Mrg Líq < 0)
  if (
    dados.ROIC !== null && dados.ROIC < 0 &&
    dados.ROE !== null && dados.ROE < 0 &&
    dados.MRG_LIQUIDA !== null && dados.MRG_LIQUIDA < 0
  ) {
    ajustes.penalTriploNegativo = true
  }

  return ajustes
}

// ─── Confidence Index ───────────────────────────────────────────────

function calcularConfiabilidade(dados: DadosFundamentalistas, setor: Setor): { disponveis: number; totais: number; confiabilidade: number } {
  const essenciais = ['P_L', 'P_VP', 'EV_EBITDA', 'ROE', 'ROIC', 'MRG_LIQUIDA', 'DIV_BRUT_PATRIM', 'LIQ_CORRENTE', 'DIV_YIELD', 'CRESC_REC_5A',
    'MOAT_SCORE', 'MANAGEMENT_SCORE', 'GOVERNANCE_SCORE']
  const secundarios = ['PSR', 'P_EBIT', 'EV_EBIT', 'MRG_EBIT', 'P_CAP_GIRO', 'P_ATIV_CIRC_LIQ', 'P_ATIVO', 'BETA', 'FCF_COVERAGE', 'LIQ_2MESES',
    'EARNINGS_QUALITY', 'REGULATORY_RISK', 'NEWS_SENTIMENT']

  // Exclude indicators that are ignored for this sector
  const ajuste = AJUSTES_SETORIAIS[setor]
  const ignorados = ajuste?.ignorar_indicadores ?? []

  const filteredEssenciais = essenciais.filter(ind => !ignorados.includes(ind))
  const filteredSecundarios = secundarios.filter(ind => !ignorados.includes(ind))

  let pontos = 0
  let total = 0
  let disponveis = 0

  for (const ind of filteredEssenciais) {
    total += 2
    const val = (dados as any)[ind]
    if (val !== null && val !== undefined) { pontos += 2; disponveis++ }
  }
  for (const ind of filteredSecundarios) {
    total += 1
    const val = (dados as any)[ind]
    if (val !== null && val !== undefined) { pontos += 1; disponveis++ }
  }

  return {
    disponveis,
    totais: filteredEssenciais.length + filteredSecundarios.length,
    confiabilidade: total > 0 ? Math.round((pontos / total) * 100) : 0,
  }
}

// ─── Classification ─────────────────────────────────────────────────

function classificar(score: number): AqClassificacao {
  if (score >= 81) return 'Excepcional'
  if (score >= 61) return 'Saudável'
  if (score >= 31) return 'Atenção'
  return 'Crítico'
}

// ─── Highlight generators ───────────────────────────────────────────

function gerarDestaque(pilar: string, subNotas: SubNota[]): string {
  if (subNotas.length === 0) return ''

  const melhor = subNotas.reduce((a, b) => a.nota > b.nota ? a : b)
  const pior = subNotas.reduce((a, b) => a.nota < b.nota ? a : b)

  const nomes: Record<string, string> = {
    P_L: 'P/L', P_VP: 'P/VP', PSR: 'PSR', P_EBIT: 'P/EBIT', EV_EBIT: 'EV/EBIT', EV_EBITDA: 'EV/EBITDA',
    ROIC: 'ROIC', ROE: 'ROE', MRG_EBIT: 'Mrg. EBIT', MRG_LIQUIDA: 'Mrg. Líquida',
    LIQ_CORRENTE: 'Liq. Corrente', DIV_BRUT_PATRIM: 'Dív/Patrim', P_CAP_GIRO: 'P/Cap.Giro',
    BETA: 'Beta', P_ATIV_CIRC_LIQ: 'P/At.Circ.Líq', P_ATIVO: 'P/Ativo',
    DIV_YIELD: 'Div. Yield', DIV_EBITDA: 'Dív/EBITDA', PAYOUT: 'Payout', FCF_COVERAGE: 'Cobertura FCF',
    CRESC_REC_5A: 'Cresc. Receita', CRESC_LUCRO_5A: 'Cresc. Lucro', PEG_RATIO: 'PEG',
  }

  const nome = (key: string) => nomes[key] || key

  if (melhor.nota >= 8) return `Destaque: ${nome(melhor.indicador)}`
  if (pior.nota <= 2) return `Atenção: ${nome(pior.indicador)}`
  return `${nome(melhor.indicador)} é o ponto forte`
}

// ─── Contrarian Signal (Cyclical Sectors) ───────────────────────

const SETORES_CICLICOS: Setor[] = [
  'mineracao', 'siderurgia', 'papel_celulose', 'petroleo_gas', 'agro',
]

function detectarContrarianSignal(dados: DadosFundamentalistas, setor: Setor): ContrarianSignal {
  const noSignal: ContrarianSignal = { triggered: false, reason: null, indicators: [] }

  if (!SETORES_CICLICOS.includes(setor)) return noSignal

  const indicators: ContrarianSignal['indicators'] = []

  // ROE atual < 50% da média 5a
  if (dados.ROE != null && dados.ROE_MEDIA_5A != null && dados.ROE_MEDIA_5A > 0) {
    const ratio = dados.ROE / dados.ROE_MEDIA_5A
    if (ratio < 0.5) {
      indicators.push({ name: 'ROE', current: dados.ROE, media5a: dados.ROE_MEDIA_5A, ratio: Math.round(ratio * 100) / 100 })
    }
  }

  // Margem líquida atual < 50% da média 5a
  if (dados.MRG_LIQUIDA != null && dados.MRG_LIQUIDA_MEDIA_5A != null && dados.MRG_LIQUIDA_MEDIA_5A > 0) {
    const ratio = dados.MRG_LIQUIDA / dados.MRG_LIQUIDA_MEDIA_5A
    if (ratio < 0.5) {
      indicators.push({ name: 'Margem Líquida', current: dados.MRG_LIQUIDA, media5a: dados.MRG_LIQUIDA_MEDIA_5A, ratio: Math.round(ratio * 100) / 100 })
    }
  }

  if (indicators.length === 0) return noSignal

  const nomes = indicators.map(i => i.name).join(' e ')
  return {
    triggered: true,
    reason: `Possível oportunidade contrarian: ${nomes} em mínima cíclica (< 50% da média 5a)`,
    indicators,
  }
}

// ─── Main Calculator ────────────────────────────────────────────────

export interface RegimeWeights {
  valuation: number
  quality: number
  risk: number
  dividends: number
  growth: number
}

export type CagedTrend = 'expanding' | 'stable' | 'contracting'

export function calcularAqScore(
  dados: DadosFundamentalistas,
  macroFactor?: { factor: number; reason: string | null },
  regimeWeights?: RegimeWeights,
  cagedTrend?: CagedTrend | null,
  sentimentFactor?: { factor: number; reason: string | null },
  trendScore?: number | null,
): AqScoreResult {
  const setor = mapearSetor(dados.SETOR, dados.ticker)
  const sectorPesos = PESOS_POR_SETOR[setor]

  // Blend sector weights with regime weights (if provided)
  // Regime weights override the base distribution; sector-specific adjustments are preserved
  // by averaging sector weights with regime weights (50/50 blend)
  const pesos: PesosSetor = regimeWeights ? {
    valuation:   (sectorPesos.valuation + regimeWeights.valuation) / 2,
    qualidade:   (sectorPesos.qualidade + regimeWeights.quality) / 2,
    risco:       (sectorPesos.risco + regimeWeights.risk) / 2,
    dividendos:  (sectorPesos.dividendos + regimeWeights.dividends) / 2,
    crescimento: (sectorPesos.crescimento + regimeWeights.growth) / 2,
    qualitativo: sectorPesos.qualitativo, // Pilar qualitativo não é afetado por regime macro
  } : sectorPesos

  // 1. Calculate each pillar
  const valuation = calcularValuation(dados, setor)
  const qualidade = calcularQualidade(dados, setor)
  const risco = calcularRisco(dados, setor)
  const dividendos = calcularDividendos(dados, setor)
  const crescimento = calcularCrescimento(dados, setor)
  const qualitativo = calcularQualitativo(dados, setor)

  // 1b. CAGED adjustment on Growth pillar (+2 expanding, -2 contracting)
  let cagedAdjustment = 0
  if (cagedTrend === 'expanding') cagedAdjustment = +2
  else if (cagedTrend === 'contracting') cagedAdjustment = -2

  if (cagedAdjustment !== 0) {
    crescimento.nota = Math.max(0, Math.min(100, crescimento.nota + cagedAdjustment))
    const trendLabel = cagedTrend === 'expanding' ? 'expandindo' : 'contraindo'
    crescimento.destaque = `CAGED: emprego ${trendLabel} no setor (${cagedAdjustment > 0 ? '+' : ''}${cagedAdjustment}pts)`
  }

  // 1c. Trend Score adjustment on Quality pillar (+2 improving, -2 deteriorating)
  const effectiveTrend = trendScore ?? 0
  if (effectiveTrend !== 0) {
    qualidade.nota = Math.max(0, Math.min(100, qualidade.nota + effectiveTrend))
    const label = effectiveTrend > 0 ? 'melhorando' : 'deteriorando'
    qualidade.destaque = `Tendência: ROE/margens ${label} (${effectiveTrend > 0 ? '+' : ''}${effectiveTrend}pts)`
  }

  // 2. Weighted base score → scoreBruto
  const scoreBruto =
    valuation.nota * pesos.valuation +
    qualidade.nota * pesos.qualidade +
    risco.nota * pesos.risco +
    dividendos.nota * pesos.dividendos +
    crescimento.nota * pesos.crescimento +
    qualitativo.nota * pesos.qualitativo

  // 3. Calculate confidence index (sector-aware: excludes ignored indicators)
  const conf = calcularConfiabilidade(dados, setor)

  // 4. Multiplicative factors
  const fatorLiq = calcularFatorLiquidez(dados)
  const fatorConf = calcularFatorConfianca(conf.disponveis, conf.totais)
  const fatorMacro = macroFactor?.factor ?? 1.00

  // 5. Apply multiplicative factors (4 factors: liquidity × confidence × macro × sentiment)
  const fatorSentiment = sentimentFactor?.factor ?? 1.0
  let scoreFinal = scoreBruto * fatorLiq * fatorConf * fatorMacro * fatorSentiment

  // 5b. Beta penalty: apenas em regime risk_off (growth <= 0.10 nos pesos)
  // Penalização gradual: beta 1.5→0%, 2.0→-5%, 2.5+→-10% (cap em -10%)
  const isRiskOff = regimeWeights ? regimeWeights.growth <= 0.10 : false
  let betaPenaltyFactor = 1.0
  const betaValue = dados.BETA ?? null

  if (isRiskOff && betaValue != null && betaValue > 1.5) {
    const excessBeta = Math.min(betaValue - 1.5, 1.0) // Cap excess at 1.0
    betaPenaltyFactor = 1 - (excessBeta * 0.10)       // [0.90, 1.00]
    scoreFinal *= betaPenaltyFactor
  }

  // 5c. Beta bonus: ações defensivas (Beta < 0.7) em risk_off ganham bônus
  if (isRiskOff && betaValue != null && betaValue < 0.7 && betaValue > 0) {
    const defensiveBonus = Math.min((0.7 - betaValue) * 0.08, 0.05) // max +5%
    scoreFinal *= (1 + defensiveBonus)
  }

  // 6. Sanity checks (caps)
  const sanity = aplicarSanityChecks(scoreFinal, scoreBruto, dados, conf)
  scoreFinal = sanity.score

  // 7. Legacy boolean caps
  const baseAjustes = calcularAjustes(dados)

  // Cap for negative equity
  if (baseAjustes.penalPatrimNegativo) {
    scoreFinal = Math.min(scoreFinal, 25)
  }

  // Cap for triple negative
  if (baseAjustes.penalTriploNegativo) {
    scoreFinal = Math.min(scoreFinal, 15)
  }

  // 8. Clamp and round
  scoreFinal = Math.max(0, Math.min(100, scoreFinal))
  scoreFinal = Math.round(scoreFinal * 10) / 10

  // Build full AjustesAplicados
  const ajustes: AjustesAplicados = {
    filtroLiquidez: baseAjustes.filtroLiquidez,
    fatorLiquidez: fatorLiq,
    fatorConfianca: fatorConf,
    fatorMacro,
    macroReason: macroFactor?.reason ?? null,
    penalPatrimNegativo: baseAjustes.penalPatrimNegativo,
    penalTriploNegativo: baseAjustes.penalTriploNegativo,
    sanityWarnings: sanity.warnings,
    scoreBruto: Math.round(scoreBruto * 10) / 10,
    total: Math.round((scoreFinal - scoreBruto) * 10) / 10,
    betaPenalty: {
      applied: betaPenaltyFactor < 1.0,
      beta: betaValue,
      penaltyFactor: Math.round(betaPenaltyFactor * 10000) / 10000,
      regime: regimeWeights ? (isRiskOff ? 'risk_off' : 'outro') : 'sem_regime',
    },
    cagedAdjustment: {
      applied: cagedAdjustment !== 0,
      trend: cagedTrend ?? null,
      adjustment: cagedAdjustment,
    },
    sentimentAdjustment: {
      applied: fatorSentiment !== 1.0,
      factor: fatorSentiment,
      reason: sentimentFactor?.reason ?? null,
    },
    trendAdjustment: {
      applied: effectiveTrend !== 0,
      score: effectiveTrend,
    },
  }

  // 9. Contrarian signal for cyclical sectors
  const contrarian = detectarContrarianSignal(dados, setor)

  return {
    ticker: dados.ticker,
    score: scoreFinal,
    classificacao: classificar(scoreFinal),
    pilares: { valuation, qualidade, risco, dividendos, crescimento, qualitativo },
    sectorBenchmarks: getSectorBenchmarks(setor),
    ajustes,
    contrarian,
    metadata: {
      dataCalculo: new Date(),
      indicadoresDisponiveis: conf.disponveis,
      indicadoresTotais: conf.totais,
      confiabilidade: conf.confiabilidade,
    },
  }
}

// ─── Legacy-compatible wrapper ──────────────────────────────────────
// Used by existing components that expect the old interface

export function calculateAQScore(data: FundamentalData): AQScoreResult {
  // Map old interface to new DadosFundamentalistas
  const dados: DadosFundamentalistas = {
    ticker: '',
    cotacao: null,
    P_L: data.peRatio ?? null,
    P_VP: data.pbRatio ?? null,
    PSR: null,
    P_EBIT: null,
    EV_EBIT: null,
    EV_EBITDA: data.evEbitda ?? null,
    ROIC: data.roic ?? null,
    ROE: data.roe ?? null,
    MRG_EBIT: data.ebitdaMargin ?? null,
    MRG_LIQUIDA: data.netMargin ?? null,
    LIQ_CORRENTE: null,
    DIV_BRUT_PATRIM: null,
    P_CAP_GIRO: null,
    P_ATIV_CIRC_LIQ: null,
    P_ATIVO: null,
    PATRIM_LIQUIDO: null,
    DIV_YIELD: data.dividendYield ?? null,
    DIV_EBITDA: data.netDebtEbitda ?? null,
    PAYOUT: data.payoutRatio ?? null,
    CRESC_REC_5A: data.revenueGrowth ?? null,
    CRESC_LUCRO_5A: data.earningsGrowth ?? null,
    LIQ_2MESES: null,
    MARKET_CAP: null,
    SETOR: 'Outros',
  }

  const result = calcularAqScore(dados)
  const p = result.pilares

  // Convert SubNota[] to old MetricScores format
  function toMetricScores(subNotas: SubNota[]): Record<string, { value: number | null; score: number; weight: number }> {
    const out: Record<string, { value: number | null; score: number; weight: number }> = {}
    for (const s of subNotas) {
      out[s.indicador] = { value: s.valor, score: s.nota * 10, weight: s.pesoInterno }
    }
    return out
  }

  return {
    scoreTotal: result.score,
    scoreValuation: p.valuation.nota,
    scoreQuanti: p.qualidade.nota,
    scoreOperational: p.crescimento.nota,
    scoreQuali: p.dividendos.nota,
    scoreQuanti: p.risco.nota,
    breakdown: {
      valuation: toMetricScores(p.valuation.subNotas),
      quality: toMetricScores(p.qualidade.subNotas),
      growth: toMetricScores(p.crescimento.subNotas),
      dividends: toMetricScores(p.dividendos.subNotas),
      risk: toMetricScores(p.risco.subNotas),
    },
    classificacao: result.classificacao,
    confiabilidade: result.metadata.confiabilidade,
    ajustes: result.ajustes,
  }
}

// ─── Score Category (legacy compat) ─────────────────────────────────

export function getScoreCategory(score: number): {
  label: string
  labelPt: string
  color: string
} {
  if (score >= 81) return { label: 'exceptional', labelPt: 'Excepcional', color: CORES_CLASSIFICACAO.Excepcional }
  if (score >= 61) return { label: 'healthy', labelPt: 'Saudável', color: CORES_CLASSIFICACAO.Saudável }
  if (score >= 31) return { label: 'attention', labelPt: 'Atenção', color: CORES_CLASSIFICACAO.Atenção }
  return { label: 'critical', labelPt: 'Crítico', color: CORES_CLASSIFICACAO.Crítico }
}
