// ─── Multi-Lens Scoring Configuration ────────────────────────────
// 6 investment lenses that reweight the 5 pillars for different strategies.
// The base pillar scores (with sector calibration) remain unchanged.
// Only the pillar WEIGHTS change per lens.

export interface PillarWeights {
  valuation: number
  quality: number
  risk: number
  dividends: number
  growth: number
}

export interface LensConfig {
  id: string
  name: string
  nameShort: string
  description: string
  icon: string
  pillarWeights: PillarWeights
  technicalWeight?: number  // % of score from technical data (Momentum lens)
}

export interface MultiLensScores {
  general: number
  value: number
  dividends: number
  growth: number
  defensive: number
  momentum: number | null  // null until Parte D (Motor de Momento) is implemented
}

export const LENSES: LensConfig[] = [
  {
    id: 'general',
    name: 'aQ Geral',
    nameShort: 'Geral',
    description: 'Visão equilibrada de todos os fundamentos',
    icon: 'G',
    pillarWeights: { valuation: 25, quality: 25, risk: 20, dividends: 15, growth: 15 },
    // Note: general lens uses PESOS_POR_SETOR (sector weights) instead of these
  },
  {
    id: 'value',
    name: 'Valor Profundo',
    nameShort: 'Valor',
    description: 'Empresas saudáveis negociando abaixo do valor justo',
    icon: 'V',
    pillarWeights: { valuation: 40, quality: 25, risk: 20, dividends: 5, growth: 10 },
  },
  {
    id: 'dividends',
    name: 'Renda Passiva',
    nameShort: 'Dividendos',
    description: 'Dividendos consistentes e sustentáveis no longo prazo',
    icon: 'D',
    pillarWeights: { valuation: 10, quality: 15, risk: 25, dividends: 40, growth: 10 },
  },
  {
    id: 'growth',
    name: 'Crescimento',
    nameShort: 'Crescimento',
    description: 'Empresas expandindo receita e lucro de forma acelerada',
    icon: 'C',
    pillarWeights: { valuation: 10, quality: 25, risk: 15, dividends: 5, growth: 45 },
  },
  {
    id: 'defensive',
    name: 'Fortaleza',
    nameShort: 'Defensiva',
    description: 'Balanço blindado, baixa volatilidade, resistência a crises',
    icon: 'F',
    pillarWeights: { valuation: 15, quality: 20, risk: 35, dividends: 25, growth: 5 },
  },
  {
    id: 'momentum',
    name: 'Momentum',
    nameShort: 'Momentum',
    description: 'Tendência técnica + fundamentos. Timing de mercado.',
    icon: 'M',
    pillarWeights: { valuation: 10, quality: 10, risk: 10, dividends: 5, growth: 15 },
    technicalWeight: 50,
  },
]

/**
 * Get a lens config by ID. Returns general lens as fallback.
 */
export function getLens(id: string): LensConfig {
  return LENSES.find(l => l.id === id) ?? LENSES[0]!
}

/**
 * Get all lens IDs.
 */
export function getLensIds(): string[] {
  return LENSES.map(l => l.id)
}
