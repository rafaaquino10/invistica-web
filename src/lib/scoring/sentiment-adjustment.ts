// ─── Sentiment Adjustment ────────────────────────────────────────
// Ajuste multiplicativo suave no score final baseado no sentimento
// agregado de notícias recentes do ticker.
//
// Regras:
// - Máximo ±5% do score (factor 0.95 a 1.05)
// - Mínimo 2 artigos para aplicar (1 pode ser ruído)
// - Decay temporal: artigos > 7 dias ignorados
// - Ponderado por confiança e recência

export interface NewsSentimentInput {
  ticker: string
  articles: { sentimentScore: number; sentimentConfidence: number; date: string }[]
}

export interface SentimentAdjustment {
  factor: number        // 0.95 a 1.05 (multiplicativo no score final)
  reason: string | null // Descrição ou null se neutro
  articleCount: number
  avgSentiment: number  // -1.0 a +1.0
}

const MAX_AGE_DAYS = 7
const MIN_ARTICLES = 2
const DEAD_ZONE = 0.15      // |avgSentiment| < 0.15 → neutro
const MAX_ADJUSTMENT = 0.05 // ±5%
const SENSITIVITY = 0.1     // avgSentiment × 0.1 → factor delta

const NEUTRAL: SentimentAdjustment = {
  factor: 1.0,
  reason: null,
  articleCount: 0,
  avgSentiment: 0,
}

/**
 * Calcula o ajuste de sentimento para um ticker baseado em notícias recentes.
 */
export function calculateSentimentAdjustment(input: NewsSentimentInput): SentimentAdjustment {
  if (!input.articles.length) return NEUTRAL

  const now = Date.now()
  const maxAgeMs = MAX_AGE_DAYS * 24 * 60 * 60 * 1000

  // 1. Filtrar artigos dos últimos 7 dias e calcular peso de recência
  const recentArticles: { score: number; confidence: number; recencyWeight: number }[] = []
  for (const art of input.articles) {
    const articleDate = new Date(art.date).getTime()
    const ageMs = now - articleDate
    if (ageMs > maxAgeMs || ageMs < 0) continue

    // Decay linear: hoje = 1.0, 7 dias = 0.3
    const ageDays = ageMs / (24 * 60 * 60 * 1000)
    const recencyWeight = 1.0 - (ageDays / MAX_AGE_DAYS) * 0.7

    recentArticles.push({
      score: art.sentimentScore,
      confidence: art.sentimentConfidence,
      recencyWeight,
    })
  }

  const articleCount = recentArticles.length

  // Mínimo 2 artigos para aplicar
  if (articleCount < MIN_ARTICLES) {
    return { ...NEUTRAL, articleCount }
  }

  // 2. Média ponderada: sentimentScore × confidence × recencyWeight
  let weightedSum = 0
  let totalWeight = 0
  for (const art of recentArticles) {
    const weight = art.confidence * art.recencyWeight
    weightedSum += art.score * weight
    totalWeight += weight
  }

  const avgSentiment = totalWeight > 0 ? weightedSum / totalWeight : 0
  const roundedAvg = Math.round(avgSentiment * 1000) / 1000

  // 3. Converter para fator multiplicativo
  let factor = 1.0
  let reason: string | null = null

  if (avgSentiment > DEAD_ZONE) {
    const delta = Math.min(MAX_ADJUSTMENT, avgSentiment * SENSITIVITY)
    factor = 1 + delta
    reason = `Sentimento positivo (${articleCount} notícias, avg ${roundedAvg > 0 ? '+' : ''}${roundedAvg})`
  } else if (avgSentiment < -DEAD_ZONE) {
    const delta = Math.min(MAX_ADJUSTMENT, Math.abs(avgSentiment) * SENSITIVITY)
    factor = 1 - delta
    reason = `Sentimento negativo (${articleCount} notícias, avg ${roundedAvg})`
  }

  // Clamp final de segurança
  factor = Math.max(1 - MAX_ADJUSTMENT, Math.min(1 + MAX_ADJUSTMENT, factor))
  factor = Math.round(factor * 10000) / 10000

  return { factor, reason, articleCount, avgSentiment: roundedAvg }
}
