// ─── News Aggregation Route ──────────────────────────────────
// Aggregates RSS feeds from Brazilian financial news outlets.
// Enriches with ticker extraction, category classification, and sentiment.
// Cache: 10-minute TTL + disk persistence.

import { Router } from 'express'
import type { Request, Response } from 'express'
import Parser from 'rss-parser'
import { cache } from '../cache/index.js'
import { readJsonFile, writeJsonFile } from '../persistence/index.js'
import {
  analyzeSentiment as analyzeFinancialSentiment,
  extractTickersFromFields,
  setValidTickers,
} from '../sentiment/index.js'
import { getNewsForTicker } from '../intelligence/news-filter.js'

const router = Router()

const CACHE_KEY = 'news:all'
const PERSIST_FILE = 'news.json'
const CACHE_TTL = 10 * 60 * 1000 // 10 minutes

// ─── RSS Feed Configuration ─────────────────────────────────

interface FeedSource {
  url: string
  source: string
  color: string
  defaultCategory?: NewsCategory
}

const RSS_FEEDS: FeedSource[] = [
  // Direct RSS feeds
  { url: 'https://www.infomoney.com.br/mercados/feed/', source: 'InfoMoney', color: '#FF6B35' },
  { url: 'https://www.infomoney.com.br/economia/feed/', source: 'InfoMoney', color: '#FF6B35', defaultCategory: 'macro' },
  { url: 'https://www.moneytimes.com.br/feed/', source: 'Money Times', color: '#0D9488' },
  { url: 'https://www.seudinheiro.com/feed/', source: 'Seu Dinheiro', color: '#8B5CF6' },
  { url: 'https://pox.globo.com/rss/valor/', source: 'Valor Econômico', color: '#1A73E8' },
  { url: 'https://feeds.folha.uol.com.br/mercado/rss091.xml', source: 'Folha de S.Paulo', color: '#00509E' },
  // Google News queries for broader coverage
  { url: 'https://news.google.com/rss/search?q=bolsa+B3+Ibovespa&hl=pt-BR&gl=BR&ceid=BR:pt-419', source: 'Google News', color: '#4285F4' },
  { url: 'https://news.google.com/rss/search?q=dividendos+ações+proventos&hl=pt-BR&gl=BR&ceid=BR:pt-419', source: 'Google News', color: '#4285F4', defaultCategory: 'dividendos' },
  { url: 'https://news.google.com/rss/search?q=COPOM+Selic+juros+inflação&hl=pt-BR&gl=BR&ceid=BR:pt-419', source: 'Google News', color: '#4285F4', defaultCategory: 'macro' },
]

// ─── Types ──────────────────────────────────────────────────

type NewsCategory = 'resultados' | 'dividendos' | 'macro' | 'corporativo' | 'mercado'
type NewsSentiment = 'positive' | 'negative' | 'neutral'

export interface NormalizedNewsItem {
  id: string
  title: string
  summary: string
  source: string
  sourceColor: string
  link: string
  tickers: string[]
  date: string // ISO 8601
  category: NewsCategory
  sentiment: NewsSentiment
  sentimentScore?: number       // -1.0 to +1.0 (from Loughran-McDonald analyzer)
  sentimentConfidence?: number  // 0.0 to 1.0
  fullText?: string | null         // Texto completo do artigo (via content-fetcher)
  fullTextSentiment?: number | null // Sentiment do texto completo (-1.0 to +1.0)
  fullTextTickers?: string[]       // Tickers detectados no texto completo
}

interface NewsSnapshot {
  fetchedAt: string
  count: number
  data: NormalizedNewsItem[]
}

// ─── Known Tickers (top 150 B3 stocks) ──────────────────────
// Used to validate extracted tickers from news text

const KNOWN_TICKERS = new Set([
  'PETR4', 'PETR3', 'VALE3', 'ITUB4', 'ITUB3', 'BBAS3', 'BBDC4', 'BBDC3',
  'WEGE3', 'ABEV3', 'B3SA3', 'RENT3', 'EQTL3', 'SUZB3', 'SBSP3', 'BBSE3',
  'ELET3', 'ELET6', 'TOTS3', 'RADL3', 'RAIL3', 'ENEV3', 'HAPV3', 'RDOR3',
  'PRIO3', 'CSAN3', 'VIVT3', 'NTCO3', 'LREN3', 'JBSS3', 'BRFS3', 'MRFG3',
  'BEEF3', 'MGLU3', 'VIIA3', 'AMER3', 'COGN3', 'YDUQ3', 'CIEL3', 'IRBR3',
  'CYRE3', 'MRVE3', 'EVEN3', 'EZTC3', 'DIRR3', 'MULT3', 'IGTI3', 'ALSO3',
  'CMIG4', 'CMIG3', 'CPFE3', 'TAEE3', 'TAEE4', 'TRPL4', 'ENGI3', 'AURE3',
  'CPLE3', 'CPLE6', 'NEOE3', 'PSSA3', 'SULA3', 'ITSA4', 'ITSA3', 'BPAC3',
  'BPAC11', 'SANB3', 'SANB4', 'SANB11', 'BRSR3', 'BRSR6', 'ABCB4', 'PINE4',
  'KLBN3', 'KLBN4', 'KLBN11', 'EMBR3', 'AZUL4', 'GOLL4', 'CCRO3', 'ECOR3',
  'GOAU4', 'GGBR4', 'CSNA3', 'USIM3', 'USIM5', 'FESA4', 'BRAP4', 'BRAP3',
  'HYPE3', 'FLRY3', 'DXCO3', 'LWSA3', 'CASH3', 'MOVI3', 'VAMO3', 'STBP3',
  'SMFT3', 'ARZZ3', 'SOMA3', 'GRND3', 'PETZ3', 'ASAI3', 'CRFB3', 'PCAR3',
  'SLCE3', 'AGRO3', 'SMTO3', 'RAIZ4', 'UGPA3', 'VBBR3', 'RECV3', 'RRRP3',
  'OIBR3', 'OIBR4', 'TIMS3', 'SAPR3', 'SAPR4', 'SAPR11', 'CSMG3', 'ALUP3',
  'ALUP4', 'ALUP11', 'BRKM3', 'BRKM5', 'UNIP3', 'UNIP6',
])

// ─── Ticker Extraction ──────────────────────────────────────
// Uses the modular ticker-extractor from ../sentiment/
// But also validates against KNOWN_TICKERS for news context

const BR_TICKER_REGEX = /\b[A-Z]{4}\d{1,2}\b/g

function extractTickers(text: string): string[] {
  const matches = text.match(BR_TICKER_REGEX) || []
  return [...new Set(matches.filter(t => KNOWN_TICKERS.has(t)))]
}

// Initialize the sentiment ticker extractor with our known tickers
setValidTickers([...KNOWN_TICKERS])

// ─── Category Classification ────────────────────────────────

const CATEGORY_KEYWORDS: Record<NewsCategory, string[]> = {
  resultados: ['lucro', 'prejuízo', 'resultado', 'trimestre', 'balanço', 'receita', 'ebitda', 'guidance', 'demonstração', 'balanco'],
  dividendos: ['dividendo', 'provento', 'jcp', 'juros sobre capital', 'yield', 'payout', 'distribuição', 'distribuicao', 'bonificação'],
  macro: ['selic', 'copom', 'inflação', 'inflacao', 'ipca', 'igp-m', 'pib', 'câmbio', 'cambio', 'dólar', 'dolar', 'juros', 'fiscal', 'banco central', 'bcb', 'tesouro'],
  corporativo: ['aquisição', 'aquisicao', 'fusão', 'fusao', 'privatização', 'ipo', 'follow-on', 'governança', 'governanca', 'ceo', 'conselho', 'assembleia', 'oferta pública'],
  mercado: ['ibovespa', 'b3', 'bolsa', 'investidor', 'fluxo', 'volume', 'negociação', 'alta', 'queda', 'mercado', 'ações', 'acoes'],
}

function classifyCategory(title: string, description: string, defaultCategory?: NewsCategory): NewsCategory {
  const text = `${title} ${description}`.toLowerCase()
  let bestCategory: NewsCategory = defaultCategory ?? 'mercado'
  let bestScore = 0

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    const score = keywords.filter(kw => text.includes(kw)).length
    if (score > bestScore) {
      bestScore = score
      bestCategory = category as NewsCategory
    }
  }
  return bestCategory
}

// ─── Sentiment Analysis (Loughran-McDonald financial dictionary) ──
// Uses the comprehensive financial dictionary from ../sentiment/
// with 150+ positive, 150+ negative, 50+ uncertainty words.

function analyzeSentiment(title: string, description: string): NewsSentiment {
  const text = `${title} ${description}`
  const result = analyzeFinancialSentiment(text)
  return result.label
}

// ─── RSS Parser ─────────────────────────────────────────────

const parser = new Parser({
  timeout: 8000, // 8s per feed
  headers: {
    'User-Agent': 'InvestIQ-Gateway/2.1 (RSS Reader)',
    'Accept': 'application/rss+xml, application/xml, text/xml, */*',
  },
})

const REQUEST_HEADERS = {
  'User-Agent': 'InvestIQ-Gateway/2.1 (RSS Reader)',
  'Accept': 'application/rss+xml, application/xml, text/xml, */*',
}

/**
 * Fetch RSS XML with correct encoding handling.
 * Some feeds (e.g. Folha) use ISO-8859-1 — we detect this from the
 * XML declaration and decode accordingly before passing to rss-parser.
 */
async function fetchRSSWithEncoding(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: REQUEST_HEADERS,
    signal: AbortSignal.timeout(8000),
  })
  if (!res.ok) throw new Error(`Status code ${res.status}`)

  const buffer = Buffer.from(await res.arrayBuffer())

  // Check XML declaration for encoding (first 200 bytes)
  const head = buffer.subarray(0, 200).toString('ascii')
  const encodingMatch = head.match(/encoding=["']([^"']+)["']/i)
  const declaredEncoding = encodingMatch?.[1]?.toLowerCase() ?? 'utf-8'

  if (declaredEncoding === 'iso-8859-1' || declaredEncoding === 'latin1' || declaredEncoding === 'windows-1252') {
    // Decode as Latin-1 and fix the XML declaration so parser doesn't re-interpret
    const decoded = new TextDecoder('iso-8859-1').decode(buffer)
    return decoded.replace(/encoding=["'][^"']+["']/i, 'encoding="UTF-8"')
  }

  return buffer.toString('utf-8')
}

async function fetchSingleFeed(feed: FeedSource): Promise<NormalizedNewsItem[]> {
  try {
    // Fetch with encoding detection, then parse the XML string
    const xml = await fetchRSSWithEncoding(feed.url)
    const parsed = await parser.parseString(xml)
    const items: NormalizedNewsItem[] = []

    for (const item of parsed.items.slice(0, 15)) { // Max 15 per feed
      const title = item.title?.trim() ?? ''
      const summary = (item.contentSnippet ?? item.content ?? '').trim().slice(0, 300)
      const link = item.link ?? ''
      const pubDate = item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString()

      if (!title) continue

      // For Google News, extract actual source from title (format: "Title - Source")
      let actualSource = feed.source
      let cleanTitle = title
      if (feed.source === 'Google News') {
        const dashIndex = title.lastIndexOf(' - ')
        if (dashIndex > 0) {
          actualSource = title.slice(dashIndex + 3).trim()
          cleanTitle = title.slice(0, dashIndex).trim()
        }
      }

      const fullText = `${cleanTitle} ${summary}`
      const tickers = extractTickers(fullText)
      const category = classifyCategory(cleanTitle, summary, feed.defaultCategory)
      const sentimentResult = analyzeFinancialSentiment(`${cleanTitle} ${summary}`)

      const id = `news_${Buffer.from(link || cleanTitle).toString('base64url').slice(0, 16)}`

      items.push({
        id,
        title: cleanTitle,
        summary: summary.replace(/<[^>]*>/g, '').trim(), // strip HTML tags
        source: actualSource,
        sourceColor: feed.color,
        link,
        tickers,
        date: pubDate,
        category,
        sentiment: sentimentResult.label,
        sentimentScore: sentimentResult.score,
        sentimentConfidence: sentimentResult.confidence,
      })
    }

    console.log(`[news] ${feed.source}: ${items.length} articles from ${feed.url.split('?')[0]}`)
    return items
  } catch (err) {
    console.error(`[news] Failed to fetch ${feed.source} (${feed.url.split('?')[0]}):`, (err as Error).message)
    return []
  }
}

// ─── Aggregation ────────────────────────────────────────────

async function fetchAllNews(): Promise<NormalizedNewsItem[]> {
  const results = await Promise.allSettled(
    RSS_FEEDS.map(feed => fetchSingleFeed(feed))
  )

  const allNews = results
    .filter((r): r is PromiseFulfilledResult<NormalizedNewsItem[]> => r.status === 'fulfilled')
    .flatMap(r => r.value)

  // Deduplicate by similar titles (remove Google News duplicates of direct feeds)
  const seen = new Map<string, NormalizedNewsItem>()
  for (const item of allNews) {
    const key = item.title.toLowerCase().slice(0, 60)
    const existing = seen.get(key)
    // Prefer direct source over Google News
    if (!existing || (existing.source === 'Google News' && item.source !== 'Google News')) {
      seen.set(key, item)
    }
  }

  // Sort by date (newest first)
  const deduplicated = [...seen.values()]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return deduplicated
}

// ─── Cache Management ───────────────────────────────────────

export function warmNewsCache(): boolean {
  const snapshot = readJsonFile<NewsSnapshot>(PERSIST_FILE)
  if (!snapshot?.data?.length) return false

  cache.set(CACHE_KEY, snapshot.data, CACHE_TTL)
  console.log(`[news] Warmed cache from disk: ${snapshot.count} articles (fetched ${snapshot.fetchedAt})`)
  return true
}

export function isNewsStale(): boolean {
  const snapshot = readJsonFile<NewsSnapshot>(PERSIST_FILE)
  if (!snapshot?.fetchedAt) return true
  const age = Date.now() - new Date(snapshot.fetchedAt).getTime()
  return age > CACHE_TTL
}

export async function refreshNews(): Promise<NormalizedNewsItem[]> {
  const news = await fetchAllNews()

  if (news.length > 0) {
    cache.set(CACHE_KEY, news, CACHE_TTL)
    writeJsonFile<NewsSnapshot>(PERSIST_FILE, {
      fetchedAt: new Date().toISOString(),
      count: news.length,
      data: news,
    })
    console.log(`[news] Refreshed: ${news.length} articles from ${RSS_FEEDS.length} feeds`)
  }

  return news
}

async function getAllNews(): Promise<NormalizedNewsItem[]> {
  const cached = cache.get<NormalizedNewsItem[]>(CACHE_KEY)
  if (cached) return cached

  try {
    return await refreshNews()
  } catch (err) {
    console.error('[news] Failed to fetch feeds:', (err as Error).message)
    // Try stale data from disk
    const snapshot = readJsonFile<NewsSnapshot>(PERSIST_FILE)
    return snapshot?.data ?? []
  }
}

// ─── Routes ─────────────────────────────────────────────────

// GET /v1/news — All news articles (optionally filtered by category and/or ticker)
router.get('/', async (req: Request, res: Response) => {
  try {
    const category = req.query['category'] as string | undefined
    const ticker = req.query['ticker'] as string | undefined
    const companyName = req.query['companyName'] as string | undefined
    const limit = Math.min(Number(req.query['limit'] ?? 30), 100)

    let news = await getAllNews()

    // Filtro por ticker (usa news-filter inteligente)
    if (ticker) {
      news = getNewsForTicker(ticker.toUpperCase(), companyName ?? '', news)
    }

    if (category && category !== 'all') {
      news = news.filter(n => n.category === category)
    }

    news = news.slice(0, limit)

    res.json({
      data: news,
      count: news.length,
      cached: cache.has(CACHE_KEY),
      fetchedAt: new Date().toISOString(),
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[news] Error:', message)
    res.status(502).json({ error: 'Feed error', message })
  }
})

// GET /v1/news/sources — Available sources
router.get('/sources', (_req: Request, res: Response) => {
  const sources = [...new Set(RSS_FEEDS.map(f => f.source))].map(source => {
    const feed = RSS_FEEDS.find(f => f.source === source)!
    return { source, color: feed.color }
  })
  res.json({ data: sources })
})

// ─── Content Enrichment (background) ───────────────────────
// Busca texto completo dos top 30 artigos mais relevantes.
// Roda em background job (10 min interval), não bloqueia responses.

export async function enrichNewsWithFullText(): Promise<number> {
  const news = await getAllNews()
  if (news.length === 0) return 0

  const { fetchArticleText } = await import('../providers/content-fetcher.js')

  // Top 30 artigos com maior confidence de sentiment + tickers
  const candidates = news
    .filter(n => n.link && !n.fullText) // Ainda não enriquecido
    .sort((a, b) => {
      const scoreA = (a.sentimentConfidence ?? 0) + (a.tickers.length > 0 ? 0.5 : 0)
      const scoreB = (b.sentimentConfidence ?? 0) + (b.tickers.length > 0 ? 0.5 : 0)
      return scoreB - scoreA
    })
    .slice(0, 30)

  let enriched = 0
  for (const article of candidates) {
    try {
      const text = await fetchArticleText(article.link)
      if (text && text.length > 100) {
        article.fullText = text.slice(0, 3000) // Limitar para não inflar o cache
        // Re-analisar sentiment sobre o texto completo
        const sentResult = analyzeFinancialSentiment(text)
        article.fullTextSentiment = sentResult.score
        // Re-extrair tickers do texto completo
        const fullTextTickers = extractTickers(text)
        article.fullTextTickers = fullTextTickers
        // Merge tickers novos ao array principal
        for (const t of fullTextTickers) {
          if (!article.tickers.includes(t)) article.tickers.push(t)
        }
        enriched++
      }
    } catch {
      // Skip silently
    }
  }

  if (enriched > 0) {
    // Atualizar cache e persistência
    cache.set(CACHE_KEY, news, CACHE_TTL)
    writeJsonFile<NewsSnapshot>(PERSIST_FILE, {
      fetchedAt: new Date().toISOString(),
      count: news.length,
      data: news,
    })
    console.log(`[news] Enriched ${enriched} articles with full text`)
  }

  return enriched
}

export { router as newsRoutes }
