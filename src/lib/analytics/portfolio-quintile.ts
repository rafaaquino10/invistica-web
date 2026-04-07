/**
 * Portfolio Quintile Analysis
 *
 * Classifica a carteira em quintil (Q1-Q5) baseado no score médio ponderado.
 * Compara com distribuição do mercado.
 */

export interface QuintilePosition {
  ticker: string
  currentValue: number
  aqScore: number | null
}

export interface MarketAsset {
  ticker: string
  scoreTotal: number | null
}

export interface QuintileResult {
  portfolioQuintile: number  // 1-5
  portfolioAvgScore: number
  distribution: QuintileDistribution[]
  positionsByQuintile: Record<number, Array<{ ticker: string; score: number; weight: number }>>
}

export interface QuintileDistribution {
  quintile: number
  label: string
  portfolioWeight: number
  marketWeight: number
  color: string
}

const QUINTILE_COLORS = ['#1A73E8', '#0D9488', '#EAB308', '#D97706', '#EF4444']
const QUINTILE_LABELS = ['Q1 (Top 20%)', 'Q2', 'Q3', 'Q4', 'Q5 (Bottom 20%)']

function getQuintile(score: number, thresholds: number[]): number {
  for (let i = 0; i < thresholds.length; i++) {
    if (score >= thresholds[i]!) return i + 1
  }
  return 5
}

export function calculateQuintile(
  positions: QuintilePosition[],
  marketAssets: MarketAsset[],
): QuintileResult {
  // Filtrar posições com score
  const scoredPositions = positions.filter(p => p.aqScore != null && p.aqScore > 0)
  const totalValue = scoredPositions.reduce((sum, p) => sum + p.currentValue, 0)

  // Calcular score médio ponderado
  const portfolioAvgScore = totalValue > 0
    ? scoredPositions.reduce((sum, p) => sum + (p.aqScore! * p.currentValue / totalValue), 0)
    : 0

  // Calcular thresholds de quintil do mercado
  const marketScores = marketAssets
    .filter(a => a.scoreTotal != null && a.scoreTotal > 0)
    .map(a => a.scoreTotal!)
    .sort((a, b) => b - a)

  const n = marketScores.length
  const thresholds = [
    marketScores[Math.floor(n * 0.2)] ?? 70,   // Q1 cutoff
    marketScores[Math.floor(n * 0.4)] ?? 55,   // Q2 cutoff
    marketScores[Math.floor(n * 0.6)] ?? 40,   // Q3 cutoff
    marketScores[Math.floor(n * 0.8)] ?? 25,   // Q4 cutoff
  ]

  // Classificar portfólio por quintil
  const portfolioQuintile = portfolioAvgScore >= (thresholds[0] ?? 70) ? 1
    : portfolioAvgScore >= (thresholds[1] ?? 55) ? 2
    : portfolioAvgScore >= (thresholds[2] ?? 40) ? 3
    : portfolioAvgScore >= (thresholds[3] ?? 25) ? 4 : 5

  // Distribuição: % do portfólio e mercado em cada quintil
  const positionsByQuintile: Record<number, Array<{ ticker: string; score: number; weight: number }>> = {
    1: [], 2: [], 3: [], 4: [], 5: [],
  }

  for (const p of scoredPositions) {
    const q = getQuintile(p.aqScore!, thresholds)
    const weight = totalValue > 0 ? Math.round((p.currentValue / totalValue) * 10000) / 100 : 0
    positionsByQuintile[q]!.push({ ticker: p.ticker, score: Math.round(p.aqScore!), weight })
  }

  const marketByQuintile = [0, 0, 0, 0, 0]
  for (const s of marketScores) {
    const q = getQuintile(s, thresholds)
    marketByQuintile[q - 1]!++
  }

  const distribution: QuintileDistribution[] = [1, 2, 3, 4, 5].map(q => ({
    quintile: q,
    label: QUINTILE_LABELS[q - 1]!,
    portfolioWeight: positionsByQuintile[q]!.reduce((sum, p) => sum + p.weight, 0),
    marketWeight: n > 0 ? Math.round((marketByQuintile[q - 1]! / n) * 10000) / 100 : 20,
    color: QUINTILE_COLORS[q - 1]!,
  }))

  return {
    portfolioQuintile,
    portfolioAvgScore: Math.round(portfolioAvgScore * 10) / 10,
    distribution,
    positionsByQuintile,
  }
}
