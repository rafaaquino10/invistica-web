// ─── Kill Switch (Next.js side) ──────────────────────────────
// Checks news articles for critical keywords associated with a ticker.
// Mirrors gateway/src/intelligence/kill-switch.ts logic for batch processing.

import type { GatewayNewsItem } from '../gateway-client'

export interface KillSwitchResult {
  triggered: boolean
  reason: string | null
}

const CRITICAL_KEYWORDS = [
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
 * Check kill switch for a ticker against a batch of news articles.
 * Used in buildLiveDataset() for batch processing all assets.
 */
export function checkKillSwitch(
  ticker: string,
  companyName: string,
  news: GatewayNewsItem[],
): KillSwitchResult {
  const upperTicker = ticker.toUpperCase()
  const tickerBase = upperTicker.replace(/\d+$/, '')
  const lowerCompany = companyName.toLowerCase()
  const cutoffDate = Date.now() - MAX_AGE_DAYS * 24 * 60 * 60 * 1000

  for (const article of news) {
    const articleDate = new Date(article.date).getTime()
    if (articleDate < cutoffDate) continue

    // Check if article is associated with this ticker
    const isRelated =
      article.tickers.some(t => t.toUpperCase() === upperTicker) ||
      article.title.toUpperCase().includes(upperTicker) ||
      article.title.toLowerCase().includes(lowerCompany) ||
      (tickerBase.length >= 3 && article.title.toUpperCase().includes(tickerBase))

    if (!isRelated) continue

    // Check for critical keywords
    const fullText = `${article.title} ${article.summary}`.toLowerCase()

    for (const keyword of CRITICAL_KEYWORDS) {
      if (fullText.includes(keyword)) {
        return {
          triggered: true,
          reason: `${keyword.charAt(0).toUpperCase() + keyword.slice(1)} — "${article.title}"`,
        }
      }
    }
  }

  return { triggered: false, reason: null }
}
