// ─── News Filter by Ticker ───────────────────────────────────
// Filters the existing news cache for articles related to a specific ticker.
// Uses: tickers[] array (pre-extracted), ticker base, company name.

import type { NormalizedNewsItem } from '../routes/news.js'
import type { CvmRiEvent } from '../providers/cvm-ri-client.js'

/**
 * Get news articles related to a specific ticker.
 * Matches by:
 * 1. Pre-extracted tickers[] array (most reliable)
 * 2. Ticker base in title/summary (e.g., "PETR" from "PETR4")
 * 3. Company name in title/summary
 */
export function getNewsForTicker(
  ticker: string,
  companyName: string,
  allNews: NormalizedNewsItem[],
): NormalizedNewsItem[] {
  const upperTicker = ticker.toUpperCase()
  const tickerBase = upperTicker.replace(/\d+$/, '') // "PETR4" → "PETR"
  const lowerCompany = companyName.toLowerCase()

  // Minimum 3 chars for company name match to avoid false positives
  const useCompanyMatch = lowerCompany.length >= 3

  return allNews
    .filter(article => {
      // 1. Exact ticker in pre-extracted tickers array
      if (article.tickers.some(t => t.toUpperCase() === upperTicker)) return true

      const titleLower = article.title.toLowerCase()
      const summaryLower = (article.summary || '').toLowerCase()
      const fullText = `${titleLower} ${summaryLower}`

      // 2. Ticker base in text (e.g., "petr" in title)
      if (tickerBase.length >= 3 && fullText.includes(tickerBase.toLowerCase())) return true

      // 3. Company name in text
      if (useCompanyMatch && fullText.includes(lowerCompany)) return true

      return false
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10)
}

/**
 * Get news articles mentioning "fato relevante" related to a ticker,
 * plus CVM RI events when available.
 */
export function getRelevantFacts(
  ticker: string,
  companyName: string,
  allNews: NormalizedNewsItem[],
  riEvents?: CvmRiEvent[],
): (NormalizedNewsItem | CvmRiEvent)[] {
  const tickerNews = getNewsForTicker(ticker, companyName, allNews)

  const newsResults = tickerNews.filter(article => {
    const fullText = `${article.title} ${article.summary}`.toLowerCase()
    return fullText.includes('fato relevante') ||
           fullText.includes('fatos relevantes') ||
           fullText.includes('comunicado ao mercado')
  })

  // Include CVM RI events for this ticker
  const riResults = riEvents
    ? riEvents.filter(e => e.ticker === ticker.toUpperCase())
    : []

  // Merge and sort by date descending
  const combined: (NormalizedNewsItem | CvmRiEvent)[] = [...newsResults, ...riResults]
  combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return combined.slice(0, 20)
}
