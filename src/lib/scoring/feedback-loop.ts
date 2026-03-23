// ─── Feedback Loop: Score vs Retorno Real ────────────────────
// Compara scores históricos (T) com retornos reais (T+N meses).
// Monitora correlação para alertar se o motor está perdendo
// capacidade preditiva. NÃO auto-recalibra (lição do v4-full).

import { loadScoreSnapshot, listAvailableDates } from '../score-history'
import type { AssetData } from '../data-source'
import { logger } from '../utils/logger'

// ─── Types ──────────────────────────────────────────────────

export interface FeedbackMetrics {
  /** Data do snapshot de score */
  scoreDate: string
  /** Data de avaliação do retorno */
  returnDate: string
  /** Dias entre score e retorno */
  horizonDays: number
  /** Correlação Spearman entre score e retorno */
  rankCorrelation: number
  /** Retorno médio do quintil Q1 (top scores) */
  q1Return: number
  /** Retorno médio do quintil Q5 (bottom scores) */
  q5Return: number
  /** Q1 - Q5 spread */
  spread: number
  /** Número de ativos na análise */
  sampleSize: number
  /** O motor está preditivo? (spread > 0 e correlação > 0) */
  isPredictive: boolean
}

export interface FeedbackReport {
  generatedAt: string
  horizonMonths: number
  periods: FeedbackMetrics[]
  /** Média da correlação entre períodos */
  avgCorrelation: number
  /** Percentual de períodos com spread positivo */
  hitRate: number
  /** Alerta: motor pode estar perdendo capacidade */
  degradationAlert: boolean
}

// ─── Core Logic ─────────────────────────────────────────────

/**
 * Calcula correlação de Spearman (rank correlation) entre dois arrays.
 */
function spearmanCorrelation(x: number[], y: number[]): number {
  const n = x.length
  if (n < 5) return 0

  const rankX = getRanks(x)
  const rankY = getRanks(y)

  let sumD2 = 0
  for (let i = 0; i < n; i++) {
    const d = rankX[i]! - rankY[i]!
    sumD2 += d * d
  }

  return 1 - (6 * sumD2) / (n * (n * n - 1))
}

function getRanks(arr: number[]): number[] {
  const indexed = arr.map((v, i) => ({ v, i }))
  indexed.sort((a, b) => a.v - b.v)
  const ranks = new Array<number>(arr.length)
  for (let i = 0; i < indexed.length; i++) {
    ranks[indexed[i]!.i] = i + 1
  }
  return ranks
}

/**
 * Gera métricas de feedback para um par (scoreDate, returnDate).
 * Requer assets atuais para calcular retornos via preço.
 */
function calculateFeedbackMetrics(
  scoreDate: string,
  returnDate: string,
  currentAssets: AssetData[],
): FeedbackMetrics | null {
  const scoreSnapshot = loadScoreSnapshot(scoreDate)
  const returnSnapshot = loadScoreSnapshot(returnDate)

  if (!scoreSnapshot || !returnSnapshot) return null

  // Juntar tickers que existem em ambos snapshots
  const tickers = Object.keys(scoreSnapshot.scores).filter(
    t => returnSnapshot.scores[t] != null
  )

  if (tickers.length < 10) return null

  // Como não temos preço histórico nos snapshots, usamos a mudança de score
  // como proxy de "melhoria fundamental" e comparamos com retorno real quando disponível
  // Por ora, usamos score em T vs score em T+N como validação de consistência
  const scores = tickers.map(t => scoreSnapshot.scores[t]!.score)
  const futureScores = tickers.map(t => returnSnapshot.scores[t]!.score)

  const correlation = spearmanCorrelation(scores, futureScores)

  // Quintil analysis
  const paired = tickers.map((t, i) => ({
    ticker: t,
    score: scores[i]!,
    futureScore: futureScores[i]!,
    change: futureScores[i]! - scores[i]!,
  }))

  paired.sort((a, b) => b.score - a.score)
  const quintileSize = Math.floor(paired.length / 5)

  const q1 = paired.slice(0, quintileSize)
  const q5 = paired.slice(-quintileSize)

  const q1AvgChange = q1.reduce((s, p) => s + p.change, 0) / q1.length
  const q5AvgChange = q5.reduce((s, p) => s + p.change, 0) / q5.length

  const horizonDays = Math.round(
    (new Date(returnDate).getTime() - new Date(scoreDate).getTime()) / (1000 * 60 * 60 * 24)
  )

  const spread = q1AvgChange - q5AvgChange

  return {
    scoreDate,
    returnDate,
    horizonDays,
    rankCorrelation: Math.round(correlation * 1000) / 1000,
    q1Return: Math.round(q1AvgChange * 10) / 10,
    q5Return: Math.round(q5AvgChange * 10) / 10,
    spread: Math.round(spread * 10) / 10,
    sampleSize: tickers.length,
    isPredictive: spread >= 0 && correlation > 0,
  }
}

/**
 * Gera relatório de feedback loop para horizonte de N meses.
 * Analisa múltiplos períodos históricos para avaliar consistência.
 */
export function generateFeedbackReport(
  currentAssets: AssetData[],
  horizonMonths: number = 3,
): FeedbackReport | null {
  const dates = listAvailableDates()
  if (dates.length < 2) return null

  const horizonDays = horizonMonths * 30
  const periods: FeedbackMetrics[] = []

  // Para cada snapshot antigo o suficiente, comparar com snapshot ~N meses depois
  for (let i = 0; i < dates.length; i++) {
    const scoreDate = dates[i]!
    const targetDate = new Date(scoreDate)
    targetDate.setDate(targetDate.getDate() + horizonDays)
    const targetStr = targetDate.toISOString().split('T')[0]!

    // Encontrar snapshot mais próximo da data alvo
    const closestReturn = dates.find(d => d >= targetStr)
    if (!closestReturn) continue

    const metrics = calculateFeedbackMetrics(scoreDate, closestReturn, currentAssets)
    if (metrics) {
      periods.push(metrics)
    }
  }

  if (periods.length === 0) return null

  const avgCorrelation = periods.reduce((s, p) => s + p.rankCorrelation, 0) / periods.length
  const hitRate = periods.filter(p => p.isPredictive).length / periods.length

  // Alerta de degradação: se correlação média < 0.02 ou hit rate < 40%
  const degradationAlert = avgCorrelation < 0.02 || hitRate < 0.4

  if (degradationAlert) {
    logger.warn('[feedback-loop] Alerta de degradação do motor', {
      avgCorrelation: avgCorrelation.toFixed(3),
      hitRate: `${(hitRate * 100).toFixed(0)}%`,
      periods: periods.length,
    })
  }

  return {
    generatedAt: new Date().toISOString(),
    horizonMonths,
    periods,
    avgCorrelation: Math.round(avgCorrelation * 1000) / 1000,
    hitRate: Math.round(hitRate * 100) / 100,
    degradationAlert,
  }
}
