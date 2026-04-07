// ─── Sentiment Analyzer ─────────────────────────────────────────
// Financial sentiment analysis using Loughran-McDonald framework
// adapted for Portuguese. Uses dictionary matching with:
// - Accent-insensitive comparison (pre-computed normalized sets)
// - Negation handling (flips sentiment of following word)
// - Uncertainty detection (reduces confidence)
// - Configurable thresholds

import {
  POSITIVE_WORDS,
  NEGATIVE_WORDS,
  UNCERTAINTY_WORDS,
  NEGATION_WORDS,
} from './financial-dictionary-pt.js'

// ─── Types ──────────────────────────────────────────────────────

export interface SentimentResult {
  score: number          // -1.0 to +1.0
  label: 'positive' | 'negative' | 'neutral'
  confidence: number     // 0.0 to 1.0
  positiveCount: number
  negativeCount: number
  uncertaintyCount: number
  wordCount: number
}

// ─── Pre-computed Normalized Sets ───────────────────────────────
// Normalizing on every word match is O(n*m). Instead, pre-build
// normalized sets at module load time for O(1) lookup.

function normalizeWord(word: string): string {
  return word
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove accents
}

function buildNormalizedSet(original: Set<string>): Set<string> {
  const normalized = new Set<string>()
  for (const word of original) {
    normalized.add(normalizeWord(word))
  }
  return normalized
}

const NORM_POSITIVE = buildNormalizedSet(POSITIVE_WORDS)
const NORM_NEGATIVE = buildNormalizedSet(NEGATIVE_WORDS)
const NORM_UNCERTAINTY = buildNormalizedSet(UNCERTAINTY_WORDS)
const NORM_NEGATION = buildNormalizedSet(NEGATION_WORDS)

// ─── Analyzer ───────────────────────────────────────────────────

/**
 * Analyze sentiment of financial text in Portuguese.
 *
 * Algorithm:
 * 1. Tokenize text into words
 * 2. For each word, check against normalized dictionaries
 * 3. Handle negation: "não lucro" → negative instead of positive
 * 4. Calculate score = (positive - negative) / (positive + negative + 1)
 * 5. Confidence based on signal density and uncertainty
 */
export function analyzeSentiment(text: string): SentimentResult {
  // Normalize text
  const normalized = text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove accents
    .replace(/[^\w\s]/g, ' ')       // remove punctuation
    .replace(/\s+/g, ' ')           // normalize whitespace
    .trim()

  const words = normalized.split(' ').filter(w => w.length > 2)
  const wordCount = words.length

  if (wordCount === 0) {
    return { score: 0, label: 'neutral', confidence: 0, positiveCount: 0, negativeCount: 0, uncertaintyCount: 0, wordCount: 0 }
  }

  let positiveCount = 0
  let negativeCount = 0
  let uncertaintyCount = 0
  let isNegated = false

  for (let i = 0; i < words.length; i++) {
    const word = words[i]!

    // Check for negation (affects the NEXT sentiment word)
    if (NORM_NEGATION.has(word)) {
      isNegated = true
      continue
    }

    const isPositive = NORM_POSITIVE.has(word)
    const isNegative = NORM_NEGATIVE.has(word)
    const isUncertain = NORM_UNCERTAINTY.has(word)

    if (isPositive) {
      if (isNegated) {
        negativeCount++ // "não lucro" → negative
      } else {
        positiveCount++
      }
      isNegated = false
    } else if (isNegative) {
      if (isNegated) {
        positiveCount++ // "não prejuízo" → positive
      } else {
        negativeCount++
      }
      isNegated = false
    } else if (isUncertain) {
      uncertaintyCount++
      isNegated = false
    } else {
      // Non-sentiment word — reset negation after 2 non-sentiment words
      // (negation typically only affects the immediately following word)
      if (isNegated && i > 0) {
        const prevWord = words[i - 1]
        if (prevWord && !NORM_NEGATION.has(prevWord)) {
          isNegated = false
        }
      }
    }
  }

  // Calculate raw score: range [-1, +1]
  const totalSentiment = positiveCount + negativeCount
  const score = totalSentiment > 0
    ? (positiveCount - negativeCount) / (totalSentiment + 1)
    : 0

  // Confidence: based on signal density and uncertainty
  // Higher when more sentiment words found relative to text length
  const signalDensity = Math.min(1, totalSentiment / Math.max(wordCount * 0.1, 1))
  const uncertaintyPenalty = Math.min(0.5, uncertaintyCount / Math.max(wordCount * 0.05, 1))
  const confidence = Math.max(0, Math.min(1, signalDensity * (1 - uncertaintyPenalty)))

  // Label with threshold
  const THRESHOLD = 0.05
  const label = score > THRESHOLD ? 'positive' : score < -THRESHOLD ? 'negative' : 'neutral'

  return {
    score: Math.max(-1, Math.min(1, Math.round(score * 1000) / 1000)),
    label,
    confidence: Math.round(confidence * 1000) / 1000,
    positiveCount,
    negativeCount,
    uncertaintyCount,
    wordCount,
  }
}

/**
 * Batch analyze multiple texts. Returns average sentiment for a collection.
 */
export function analyzeSentimentBatch(texts: string[]): SentimentResult {
  if (texts.length === 0) {
    return { score: 0, label: 'neutral', confidence: 0, positiveCount: 0, negativeCount: 0, uncertaintyCount: 0, wordCount: 0 }
  }

  const results = texts.map(t => analyzeSentiment(t))

  const totalPos = results.reduce((s, r) => s + r.positiveCount, 0)
  const totalNeg = results.reduce((s, r) => s + r.negativeCount, 0)
  const totalUnc = results.reduce((s, r) => s + r.uncertaintyCount, 0)
  const totalWords = results.reduce((s, r) => s + r.wordCount, 0)
  const avgScore = results.reduce((s, r) => s + r.score, 0) / results.length
  const avgConfidence = results.reduce((s, r) => s + r.confidence, 0) / results.length

  const THRESHOLD = 0.05
  const label = avgScore > THRESHOLD ? 'positive' : avgScore < -THRESHOLD ? 'negative' : 'neutral'

  return {
    score: Math.round(avgScore * 1000) / 1000,
    label,
    confidence: Math.round(avgConfidence * 1000) / 1000,
    positiveCount: totalPos,
    negativeCount: totalNeg,
    uncertaintyCount: totalUnc,
    wordCount: totalWords,
  }
}
