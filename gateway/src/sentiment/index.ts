// ─── Sentiment Module ───────────────────────────────────────────
// Re-exports for clean imports from other modules.

export { analyzeSentiment, analyzeSentimentBatch, type SentimentResult } from './analyzer.js'
export { extractTickers, extractTickersFromFields, setValidTickers, getValidTickerCount } from './ticker-extractor.js'
export { POSITIVE_WORDS, NEGATIVE_WORDS, UNCERTAINTY_WORDS, NEGATION_WORDS, INTENSIFIER_WORDS } from './financial-dictionary-pt.js'
