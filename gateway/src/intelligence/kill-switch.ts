// ─── Kill Switch ─────────────────────────────────────────────
// Monitors news for critical keywords indicating severe risk.
// If triggered, the asset's score should be zeroed out.

import type { NormalizedNewsItem } from '../routes/news.js'

export interface KillSwitchResult {
  triggered: boolean
  reason: string | null
  article: NormalizedNewsItem | null
}

/**
 * Critical keywords that indicate severe corporate risk.
 * Must appear in combination with the ticker/company for a trigger.
 */
export const CRITICAL_KEYWORDS = [
  'recuperação judicial',
  'pedido de falência',
  'fraude contábil',
  'cvm suspende',
  'cvm condena',
  'intervenção do banco central',
  'rombo contábil',
  'investigação pela pf',
  'investigação da polícia federal',
  'delação premiada',
  'insider trading',
  'manipulação de mercado',
  'irregularidades contábeis',
  'balanço fraudulento',
]

const MAX_AGE_DAYS = 7

/**
 * Check if any critical event is associated with a ticker in recent news.
 *
 * A kill switch triggers when:
 * 1. A critical keyword is found in an article's title or summary
 * 2. The article is associated with the ticker (via tickers[] array, title, or summary)
 * 3. The article is from the last 7 days
 */
export function checkKillSwitch(
  ticker: string,
  companyName: string,
  news: NormalizedNewsItem[],
): KillSwitchResult {
  const upperTicker = ticker.toUpperCase()
  const tickerBase = upperTicker.replace(/\d+$/, '')
  const lowerCompany = companyName.toLowerCase()
  const cutoffDate = Date.now() - MAX_AGE_DAYS * 24 * 60 * 60 * 1000

  for (const article of news) {
    // Recency check
    const articleDate = new Date(article.date).getTime()
    if (articleDate < cutoffDate) continue

    // Check if article is associated with this ticker
    const isRelated =
      article.tickers.some(t => t.toUpperCase() === upperTicker) ||
      article.title.toUpperCase().includes(upperTicker) ||
      article.title.toLowerCase().includes(lowerCompany) ||
      (tickerBase.length >= 3 && article.title.toUpperCase().includes(tickerBase))

    if (!isRelated) continue

    // Check for critical keywords in title + summary
    const fullText = `${article.title} ${article.summary}`.toLowerCase()

    for (const keyword of CRITICAL_KEYWORDS) {
      if (fullText.includes(keyword)) {
        return {
          triggered: true,
          reason: `${keyword.charAt(0).toUpperCase() + keyword.slice(1)} — "${article.title}"`,
          article,
        }
      }
    }
  }

  return { triggered: false, reason: null, article: null }
}
