// ─── Live Signals Client ──────────────────────────────────────
// Agrega todos os sinais vivos processados por ticker.
// Consome dados já ingeridos (news enriched, RI docs, B3 governance).
//
// Background job: 15 min interval. Persiste em gateway/data/live-signals.json.

import { cache } from '../cache/index.js'
import { readJsonFile, writeJsonFile } from '../persistence/index.js'
import { logger } from '../logger.js'
import { analyzeSentiment } from '../sentiment/index.js'
import { loadGovernanceData, scoreListingSegment, getListingSegment } from './b3-governance-client.js'

// ─── Types ──────────────────────────────────────────────────

export interface LiveSignals {
  ticker: string

  // ─── News Intelligence ──────────────────────
  newsSentimentScore: number         // 0-100 (50=neutro)
  newsCount7d: number
  sentimentTrend: 'improving' | 'stable' | 'deteriorating'
  topHeadlines: string[]

  // ─── RI Document Intelligence ───────────────
  hasBuybackProgram: boolean
  hasNewAcquisition: boolean
  ceoChanged: boolean
  lastCeoChangeDate: string | null
  riEventCount30d: number
  riSentimentAvg: number             // 0-100 (50=neutro)

  // ─── Governance (B3 + CVM) ─────────────────
  listingSegment: string | null
  listingSegmentScore: number        // 0-100
  freeFloatPct: number | null
  cvmSanctions: number
  cvmCategoria: string | null

  // ─── Risk Signals ──────────────────────────
  catalystAlerts: string[]
  killSwitchTriggered: boolean
  killSwitchReason: string | null
}

interface LiveSignalsFile {
  version: number
  builtAt: string
  count: number
  signals: Record<string, LiveSignals>
}

// ─── Constants ──────────────────────────────────────────────

const PERSIST_FILE = 'live-signals.json'

// Keywords de risco para catalyst alerts
const RISK_KEYWORDS = [
  'processo', 'multa', 'embargo', 'sanção', 'inquérito',
  'investigação', 'fraude', 'irregularidade', 'condenação',
  'inadimplência', 'recuperação judicial', 'falência',
]

// Keywords positivas para buyback/aquisição
const BUYBACK_KEYWORDS = ['recompra de ações', 'programa de recompra', 'buyback']
const ACQUISITION_KEYWORDS = ['aquisição', 'aquisicao', 'fusão', 'fusao', 'incorporação']
const CEO_KEYWORDS = ['diretor presidente', 'diretor-presidente', 'ceo', 'alteração na administração']

// ─── Helpers ────────────────────────────────────────────────

interface NewsItem {
  title: string
  summary: string
  tickers: string[]
  date: string
  sentimentScore?: number
  sentimentConfidence?: number
  fullText?: string | null
  fullTextSentiment?: number | null
}

interface RiEvent {
  ticker: string | null
  type: string
  title: string
  date: string
  summary?: string | null
  contentSentiment?: number | null
  contentKeywords?: string[]
}

function isWithin(dateStr: string, daysBack: number): boolean {
  const date = new Date(dateStr)
  const cutoff = Date.now() - daysBack * 24 * 60 * 60 * 1000
  return date.getTime() >= cutoff
}

function sentimentToScore(score: number | null | undefined): number {
  // Converte sentiment score (-1 a +1) para 0-100
  if (score == null) return 50
  return Math.round(((score + 1) / 2) * 100)
}

function detectSentimentTrend(articles: Array<{ date: string; score: number }>): 'improving' | 'stable' | 'deteriorating' {
  if (articles.length < 3) return 'stable'

  const sorted = [...articles].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  const half = Math.floor(sorted.length / 2)
  const firstHalf = sorted.slice(0, half)
  const secondHalf = sorted.slice(half)

  const avgFirst = firstHalf.reduce((s, a) => s + a.score, 0) / firstHalf.length
  const avgSecond = secondHalf.reduce((s, a) => s + a.score, 0) / secondHalf.length

  const delta = avgSecond - avgFirst
  if (delta > 0.15) return 'improving'
  if (delta < -0.15) return 'deteriorating'
  return 'stable'
}

function detectKeywords(text: string, keywords: string[]): boolean {
  const lower = text.toLowerCase()
  return keywords.some(kw => lower.includes(kw))
}

function extractRiskKeywords(text: string): string[] {
  const lower = text.toLowerCase()
  return RISK_KEYWORDS.filter(kw => lower.includes(kw))
}

// ─── Build Signals ──────────────────────────────────────────

function buildSignalsForTicker(
  ticker: string,
  newsItems: NewsItem[],
  riEvents: RiEvent[],
  governanceData: Map<string, any>,
  modulesData: Map<string, any>,
): LiveSignals {
  // ─── News Intelligence ──────────────────────
  const tickerNews = newsItems.filter(n => n.tickers?.includes(ticker))
  const news7d = tickerNews.filter(n => isWithin(n.date, 7))

  // Calcular sentiment médio (preferir fullText sentiment quando disponível)
  const sentimentScores = news7d.map(n => {
    const score = n.fullTextSentiment ?? n.sentimentScore ?? 0
    return { date: n.date, score }
  })

  const avgSentiment = sentimentScores.length > 0
    ? sentimentScores.reduce((s, a) => s + a.score, 0) / sentimentScores.length
    : 0

  const newsSentimentScore = sentimentToScore(avgSentiment)
  const sentimentTrend = detectSentimentTrend(sentimentScores)
  const topHeadlines = news7d.slice(0, 3).map(n => n.title)

  // ─── RI Document Intelligence ───────────────
  const tickerRi = riEvents.filter(e => e.ticker === ticker)
  const ri30d = tickerRi.filter(e => isWithin(e.date, 30))
  const ri12m = tickerRi.filter(e => isWithin(e.date, 365))
  const ri6m = tickerRi.filter(e => isWithin(e.date, 180))

  // Detectar buyback, aquisição, CEO change nos textos dos documentos RI
  const allRiText = ri12m.map(e => `${e.title} ${e.summary || ''}`).join(' ')
  const hasBuybackProgram = detectKeywords(allRiText, BUYBACK_KEYWORDS)
  const hasNewAcquisition = detectKeywords(
    ri6m.map(e => `${e.title} ${e.summary || ''}`).join(' '),
    ACQUISITION_KEYWORDS
  )
  const ceoChanged = detectKeywords(allRiText, CEO_KEYWORDS)

  // CEO change date: encontrar o evento mais recente
  let lastCeoChangeDate: string | null = null
  if (ceoChanged) {
    const ceoEvents = ri12m.filter(e =>
      detectKeywords(`${e.title} ${e.summary || ''}`, CEO_KEYWORDS)
    )
    if (ceoEvents.length > 0) {
      lastCeoChangeDate = ceoEvents.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]!.date
    }
  }

  // RI Sentiment médio
  const riWithSentiment = ri30d.filter(e => e.contentSentiment != null)
  const riSentimentAvg = riWithSentiment.length > 0
    ? sentimentToScore(riWithSentiment.reduce((s, e) => s + (e.contentSentiment ?? 0), 0) / riWithSentiment.length)
    : 50

  // ─── Governance ─────────────────────────────
  const listingSegment = getListingSegment(ticker)
  const listingSegmentScore = scoreListingSegment(listingSegment)

  // Free float: módulos brapi
  const mod = modulesData.get(ticker)
  const freeFloatPct: number | null = mod?.floatShares != null && mod?.sharesOutstanding != null && mod.sharesOutstanding > 0
    ? Math.round((mod.floatShares / mod.sharesOutstanding) * 100)
    : null

  // CVM Sanctions: keywords de risco em RI events + news
  const allText = [
    ...ri12m.map(e => `${e.title} ${e.summary || ''}`),
    ...tickerNews.filter(n => isWithin(n.date, 730)).map(n => `${n.title} ${n.summary} ${n.fullText || ''}`),
  ].join(' ')
  const sanctionKeywords = ['sanção', 'sancao', 'inquérito', 'inquerito', 'multa cvm', 'processo administrativo']
  const cvmSanctions = sanctionKeywords.filter(kw => allText.toLowerCase().includes(kw)).length

  // ─── Risk Signals ──────────────────────────
  const recentText = [
    ...ri30d.map(e => `${e.title} ${e.summary || ''}`),
    ...news7d.map(n => `${n.title} ${n.summary} ${n.fullText || ''}`),
  ].join(' ')
  const catalystAlerts = extractRiskKeywords(recentText)

  return {
    ticker,
    newsSentimentScore,
    newsCount7d: news7d.length,
    sentimentTrend,
    topHeadlines,
    hasBuybackProgram,
    hasNewAcquisition,
    ceoChanged,
    lastCeoChangeDate,
    riEventCount30d: ri30d.length,
    riSentimentAvg,
    listingSegment,
    listingSegmentScore,
    freeFloatPct,
    cvmSanctions,
    cvmCategoria: null, // Será preenchido quando CVM cadastro tiver categReg
    catalystAlerts,
    killSwitchTriggered: false, // Kill switch é aplicado no scoring-pipeline
    killSwitchReason: null,
  }
}

// ─── Public API ─────────────────────────────────────────────

let signalsMap: Map<string, LiveSignals> | null = null

/**
 * Reconstrói sinais vivos para todos os tickers com dados disponíveis.
 */
export function refreshLiveSignals(): Map<string, LiveSignals> {
  const newsItems: NewsItem[] = cache.getStale<NewsItem[]>('news:all') ?? []
  const riEvents: RiEvent[] = cache.getStale<RiEvent[]>('ri:events') ?? []
  const governanceData = loadGovernanceData()

  // Carregar módulos brapi para free float
  const modulesData = new Map<string, any>()
  try {
    const modulesFile = readJsonFile<{ modules: Record<string, any> }>('modules.json')
    if (modulesFile?.modules) {
      for (const [ticker, data] of Object.entries(modulesFile.modules)) {
        modulesData.set(ticker, data)
      }
    }
  } catch { /* modules são opcionais */ }

  // Coletar todos os tickers únicos
  const allTickers = new Set<string>()
  for (const n of newsItems) {
    for (const t of (n.tickers ?? [])) allTickers.add(t)
  }
  for (const e of riEvents) {
    if (e.ticker) allTickers.add(e.ticker)
  }
  // Adicionar tickers dos módulos (para cobertura de governança)
  for (const ticker of modulesData.keys()) allTickers.add(ticker)

  const signals = new Map<string, LiveSignals>()
  for (const ticker of allTickers) {
    signals.set(ticker, buildSignalsForTicker(ticker, newsItems, riEvents, governanceData, modulesData))
  }

  signalsMap = signals

  // Persistir
  const obj: Record<string, LiveSignals> = {}
  for (const [ticker, sig] of signals) obj[ticker] = sig
  writeJsonFile<LiveSignalsFile>(PERSIST_FILE, {
    version: 1,
    builtAt: new Date().toISOString(),
    count: signals.size,
    signals: obj,
  })

  logger.info(`[live-signals] Built signals for ${signals.size} tickers`)
  return signals
}

/**
 * Retorna sinais vivos para um ticker.
 */
export function getLiveSignals(ticker: string): LiveSignals | null {
  if (!signalsMap) {
    // Tentar carregar do disco
    const file = readJsonFile<LiveSignalsFile>(PERSIST_FILE)
    if (file?.signals) {
      signalsMap = new Map(Object.entries(file.signals))
    }
  }
  return signalsMap?.get(ticker) ?? null
}

/**
 * Retorna todos os sinais vivos.
 */
export function getAllLiveSignals(): Map<string, LiveSignals> {
  if (!signalsMap) {
    const file = readJsonFile<LiveSignalsFile>(PERSIST_FILE)
    if (file?.signals) {
      signalsMap = new Map(Object.entries(file.signals))
    }
  }
  return signalsMap ?? new Map()
}

/**
 * Warm cache from disk.
 */
export function warmLiveSignalsCache(): boolean {
  const file = readJsonFile<LiveSignalsFile>(PERSIST_FILE)
  if (!file?.signals || Object.keys(file.signals).length === 0) return false
  signalsMap = new Map(Object.entries(file.signals))
  logger.info(`[live-signals] Warmed cache from disk: ${signalsMap.size} tickers`)
  return true
}
