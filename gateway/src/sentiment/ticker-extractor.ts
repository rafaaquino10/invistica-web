// ─── Ticker Extractor ───────────────────────────────────────────
// Extracts valid B3 stock tickers from text using regex + validation.
// Supports dynamic ticker list from fundamentals cache.

// B3 ticker pattern: 4 uppercase letters + 1-2 digits (e.g., PETR4, KLBN11)
const TICKER_REGEX = /\b([A-Z]{4}\d{1,2})\b/g

// Set of valid tickers — updated from fundamentals cache
let validTickers: Set<string> = new Set()

/**
 * Update the set of valid tickers (called when fundamentals cache refreshes).
 */
export function setValidTickers(tickers: string[]): void {
  validTickers = new Set(tickers)
}

/**
 * Get current valid tickers count.
 */
export function getValidTickerCount(): number {
  return validTickers.size
}

/**
 * Extract valid B3 tickers from text.
 * Returns unique tickers that match the known ticker set.
 * If no ticker set is loaded, returns all regex matches.
 */
export function extractTickers(text: string): string[] {
  // Search in uppercase version of text
  const upperText = text.toUpperCase()
  const matches = upperText.match(TICKER_REGEX) || []

  // Deduplicate
  const unique = [...new Set(matches)]

  // Validate against known tickers if available
  if (validTickers.size > 0) {
    return unique.filter(t => validTickers.has(t))
  }

  return unique
}

/**
 * Extract tickers from multiple text fields (title, description, etc.)
 */
export function extractTickersFromFields(...fields: string[]): string[] {
  const allTickers = new Set<string>()
  for (const field of fields) {
    for (const ticker of extractTickers(field)) {
      allTickers.add(ticker)
    }
  }
  return [...allTickers]
}
