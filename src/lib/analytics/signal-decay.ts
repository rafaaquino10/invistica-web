// ─── Signal Decay Analysis ───────────────────────────────────
// Monitora eficácia preditiva (IC) de cada pilar do IQ Score.
// Alerta quando IC < 0.05 (fator perdeu poder preditivo).

export interface MonthlyIC {
  month: string
  ic: number
}

export interface FactorDecayMetrics {
  pillar: string
  pillarLabel: string
  sector?: string
  icMean: number
  icTrend: 'improving' | 'stable' | 'degrading'
  icMonthly: MonthlyIC[]
  isDecaying: boolean
  lastEffectiveDate: string | null
  suggestedAction: string
}

interface ScoreSnapshotEntry {
  ticker: string
  date: Date
  scoreTotal: number
  scoreValuation: number
  scoreQuality: number
  scoreRisk: number
  scoreDividends: number
  scoreGrowth: number
  scoreMomentum: number | null
  price: number | null
}

interface ForwardReturnEntry {
  ticker: string
  snapshotDate: Date
  forwardReturn: number  // % return após N dias
}

const IC_THRESHOLD = 0.05
const MIN_SAMPLES = 12

const PILLAR_KEYS = ['valuation', 'quality', 'risk', 'dividends', 'growth', 'momentum'] as const
const PILLAR_LABELS: Record<string, string> = {
  valuation: 'Valuation',
  quality: 'Qualidade',
  risk: 'Risco',
  dividends: 'Dividendos',
  growth: 'Crescimento',
  momentum: 'Momentum',
}

const PILLAR_SCORE_MAP: Record<string, keyof ScoreSnapshotEntry> = {
  valuation: 'scoreValuation',
  quality: 'scoreQuality',
  risk: 'scoreRisk',
  dividends: 'scoreDividends',
  growth: 'scoreGrowth',
  momentum: 'scoreMomentum',
}

/**
 * Spearman rank correlation entre dois arrays.
 */
function spearmanCorrelation(x: number[], y: number[]): number {
  const n = x.length
  if (n < 3) return 0

  const rankX = rankArray(x)
  const rankY = rankArray(y)

  let sumD2 = 0
  for (let i = 0; i < n; i++) {
    const d = rankX[i]! - rankY[i]!
    sumD2 += d * d
  }

  return 1 - (6 * sumD2) / (n * (n * n - 1))
}

function rankArray(arr: number[]): number[] {
  const indexed = arr.map((v, i) => ({ v, i }))
  indexed.sort((a, b) => a.v - b.v)
  const ranks = new Array<number>(arr.length)
  for (let i = 0; i < indexed.length; i++) {
    ranks[indexed[i]!.i] = i + 1
  }
  return ranks
}

/**
 * Detecta tendência via regressão linear simples nos ICs mensais.
 */
function detectTrend(ics: number[]): 'improving' | 'stable' | 'degrading' {
  if (ics.length < 3) return 'stable'

  const n = ics.length
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0
  for (let i = 0; i < n; i++) {
    sumX += i
    sumY += ics[i]!
    sumXY += i * ics[i]!
    sumX2 += i * i
  }

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)

  if (slope > 0.005) return 'improving'
  if (slope < -0.005) return 'degrading'
  return 'stable'
}

/**
 * Analisa signal decay para todos os pilares.
 */
export function analyzeSignalDecay(
  snapshots: ScoreSnapshotEntry[],
  returns: ForwardReturnEntry[],
): FactorDecayMetrics[] {
  if (snapshots.length < MIN_SAMPLES || returns.length < MIN_SAMPLES) {
    return PILLAR_KEYS.map(pillar => ({
      pillar,
      pillarLabel: PILLAR_LABELS[pillar]!,
      icMean: 0,
      icTrend: 'stable' as const,
      icMonthly: [],
      isDecaying: false,
      lastEffectiveDate: null,
      suggestedAction: 'Dados insuficientes — aguardar mais snapshots.',
    }))
  }

  // Agrupar por mês
  const monthMap = new Map<string, { scores: Map<string, ScoreSnapshotEntry>; returns: Map<string, number> }>()

  for (const s of snapshots) {
    const month = `${s.date.getFullYear()}-${String(s.date.getMonth() + 1).padStart(2, '0')}`
    if (!monthMap.has(month)) monthMap.set(month, { scores: new Map(), returns: new Map() })
    monthMap.get(month)!.scores.set(s.ticker, s)
  }

  for (const r of returns) {
    const month = `${r.snapshotDate.getFullYear()}-${String(r.snapshotDate.getMonth() + 1).padStart(2, '0')}`
    if (monthMap.has(month)) {
      monthMap.get(month)!.returns.set(r.ticker, r.forwardReturn)
    }
  }

  const sortedMonths = [...monthMap.keys()].sort()

  const results: FactorDecayMetrics[] = []

  for (const pillar of PILLAR_KEYS) {
    const scoreKey = PILLAR_SCORE_MAP[pillar]!
    const monthlyICs: MonthlyIC[] = []

    for (const month of sortedMonths) {
      const data = monthMap.get(month)!
      const tickers = [...data.scores.keys()].filter(t => data.returns.has(t))
      if (tickers.length < 10) continue

      const pillarScores = tickers.map(t => {
        const val = data.scores.get(t)![scoreKey]
        return typeof val === 'number' ? val : 0
      })
      const fwdReturns = tickers.map(t => data.returns.get(t)!)

      const ic = spearmanCorrelation(pillarScores, fwdReturns)
      monthlyICs.push({ month, ic })
    }

    const recentICs = monthlyICs.slice(-6)
    const icValues = recentICs.map(m => m.ic)
    const icMean = icValues.length > 0
      ? icValues.reduce((s, v) => s + v, 0) / icValues.length
      : 0

    const icTrend = detectTrend(icValues)
    const isDecaying = icMean < IC_THRESHOLD

    // Último mês com IC efetivo
    const effective = [...monthlyICs].reverse().find(m => m.ic >= IC_THRESHOLD)

    let suggestedAction: string
    if (isDecaying && icTrend === 'degrading') {
      suggestedAction = `Recalibrar pesos do pilar ${PILLAR_LABELS[pillar]} — IC em queda livre.`
    } else if (isDecaying) {
      suggestedAction = `Monitorar pilar ${PILLAR_LABELS[pillar]} — IC abaixo do limiar.`
    } else if (icTrend === 'degrading') {
      suggestedAction = `Tendência de queda no IC de ${PILLAR_LABELS[pillar]} — observar próximos meses.`
    } else {
      suggestedAction = `Pilar ${PILLAR_LABELS[pillar]} estável — sem ação necessária.`
    }

    results.push({
      pillar,
      pillarLabel: PILLAR_LABELS[pillar]!,
      icMean,
      icTrend,
      icMonthly: monthlyICs,
      isDecaying,
      lastEffectiveDate: effective?.month ?? null,
      suggestedAction,
    })
  }

  return results
}

/**
 * Gera dados demo de signal decay (quando não há snapshots reais).
 */
export function generateDemoDecayMetrics(): FactorDecayMetrics[] {
  const months = ['2025-09', '2025-10', '2025-11', '2025-12', '2026-01', '2026-02']

  return PILLAR_KEYS.map((pillar, idx) => {
    // Simular IC trends diferentes por pilar
    const baseIC = [0.12, 0.09, 0.07, 0.11, 0.06, 0.03][idx] ?? 0.08
    const trend: ('improving' | 'stable' | 'degrading')[] = ['stable', 'improving', 'stable', 'stable', 'degrading', 'degrading']

    const monthlyICs = months.map((month, i) => ({
      month,
      ic: baseIC + (trend[idx] === 'improving' ? i * 0.01 : trend[idx] === 'degrading' ? -i * 0.015 : (Math.random() - 0.5) * 0.02),
    }))

    const recentICs = monthlyICs.slice(-6).map(m => m.ic)
    const icMean = recentICs.reduce((s, v) => s + v, 0) / recentICs.length

    return {
      pillar,
      pillarLabel: PILLAR_LABELS[pillar]!,
      icMean,
      icTrend: trend[idx]!,
      icMonthly: monthlyICs,
      isDecaying: icMean < IC_THRESHOLD,
      lastEffectiveDate: icMean >= IC_THRESHOLD ? months[months.length - 1]! : months[3]!,
      suggestedAction: icMean < IC_THRESHOLD
        ? `Recalibrar pesos do pilar ${PILLAR_LABELS[pillar]}.`
        : `Pilar ${PILLAR_LABELS[pillar]} estável.`,
    }
  })
}
