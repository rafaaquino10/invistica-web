export {
  // New v3 engine
  calcularAqScore,
  mapearSetor,
  CORES_CLASSIFICACAO,
  PESOS_POR_SETOR,
  AJUSTES_SETORIAIS,
  SECTOR_BENCHMARKS,
  getSectorBenchmarks,

  // Legacy-compatible wrapper
  calculateIQScore,
  getScoreCategory,
  PILLAR_WEIGHTS,

  // Types
  type FundamentalData,
  type IQScoreResult,
  type DadosFundamentalistas,
  type AqScoreResult,
  type AqClassificacao,
  type PilarResult,
  type SubNota,
  type AjustesAplicados,
  type Setor,
  type SectorBenchmarks,
  type RegimeWeights,
  type CagedTrend,
  type ContrarianSignal,
} from './iq-score'

export {
  detectRegime,
  REGIME_DISPLAY,
  type MacroRegime,
  type RegimeConfig,
  type RegimePillarWeights,
} from './regime-detector'

export {
  RATE_SENSITIVE_NEGATIVE,
  RATE_SENSITIVE_POSITIVE,
  FX_EXPORTERS,
  FX_IMPORTERS,
  COMMODITY_POSITIVE,
  COMMODITY_NEGATIVE,
  CYCLICAL_SECTORS,
  DEFENSIVE_SECTORS,
  isSectorIn,
} from './sector-sensitivity'

export {
  LENSES,
  getLens,
  getLensIds,
  type LensConfig,
  type PillarWeights,
  type MultiLensScores,
} from './lenses'

export {
  calculateLensScores,
} from './lens-calculator'

export {
  generateNarrative,
  getScoreBadge,
  type ScoreNarrative,
  type ScoreBadgeInfo,
} from './score-narrator'

export {
  calculateSentimentAdjustment,
  type NewsSentimentInput,
  type SentimentAdjustment,
} from './sentiment-adjustment'
