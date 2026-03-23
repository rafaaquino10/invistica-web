// ─── Data Fetcher ────────────────────────────────────────────
// Handles all gateway fetch operations with caching and guards.

import {
  fetchAllQuotes,
  fetchAllFundamentals,
  fetchAllCompanies,
  fetchMacroMomentum,
  fetchNews,
  fetchBetas,
  type GatewayQuote,
  type GatewayFundamental,
  type GatewayCompany,
  type GatewayNewsItem,
  type GatewayBeta,
} from '../gateway-client'
import { fetchCAGEDData, type CAGEDSectorData } from '@/lib/scoring/alternative-signals'
import { CACHE_TTL } from './asset-cache'

// ─── Types ──────────────────────────────────────────────────

export interface RawDataBundle {
  quotes: GatewayQuote[]
  fundamentals: GatewayFundamental[]
  companies: Map<string, GatewayCompany>
  macroMomentumScore: number | null
  newsArticles: GatewayNewsItem[]
  betaMap: Map<string, GatewayBeta>
  cagedData: CAGEDSectorData[]
}

// ─── Companies Cache ────────────────────────────────────────

let companiesMap: Map<string, GatewayCompany> | null = null
let companiesFetchedAt = 0
const COMPANIES_TTL = 10 * 60 * 1000 // 10 min

async function getCompaniesMap(): Promise<Map<string, GatewayCompany>> {
  if (companiesMap && Date.now() < companiesFetchedAt + COMPANIES_TTL) {
    return companiesMap
  }
  try {
    const companies = await fetchAllCompanies()
    companiesMap = new Map(companies.map(c => [c.ticker, c]))
    companiesFetchedAt = Date.now()
    console.log(`[data-fetcher] Loaded ${companiesMap.size} companies from gateway`)
  } catch {
    if (!companiesMap) companiesMap = new Map()
  }
  return companiesMap
}

// ─── News Cache ─────────────────────────────────────────────

let newsCache: GatewayNewsItem[] | null = null
let newsCacheExpiry = 0

async function getNewsArticles(): Promise<GatewayNewsItem[]> {
  if (newsCache && Date.now() < newsCacheExpiry) return newsCache

  try {
    const articles = await fetchNews(undefined, 100)
    newsCache = articles
    newsCacheExpiry = Date.now() + CACHE_TTL
    return articles
  } catch {
    return newsCache ?? []
  }
}

// ─── CAGED Cache ───────────────────────────────────────────

let cagedCache: CAGEDSectorData[] | null = null
let cagedCacheExpiry = 0
const CAGED_TTL = 30 * 60 * 1000 // 30 min (dados mensais, não muda frequentemente)

async function getCagedData(): Promise<CAGEDSectorData[]> {
  if (cagedCache && Date.now() < cagedCacheExpiry) return cagedCache

  try {
    const data = await fetchCAGEDData()
    cagedCache = data
    cagedCacheExpiry = Date.now() + CAGED_TTL
    return data
  } catch {
    return cagedCache ?? []
  }
}

// ─── Fetch All ──────────────────────────────────────────────

const MIN_QUOTES = 50
const MIN_FUNDAMENTALS = 50

/**
 * Fetch all data from gateway in parallel.
 * Throws if quotes/fundamentals below minimum threshold.
 */
export async function fetchAllFromGateway(): Promise<RawDataBundle> {
  const [quotes, fundamentals, companies, macroMomentum, newsArticles, betas, cagedData] = await Promise.all([
    fetchAllQuotes(),
    fetchAllFundamentals(),
    getCompaniesMap(),
    fetchMacroMomentum().catch(() => null),
    getNewsArticles().catch(() => [] as GatewayNewsItem[]),
    fetchBetas().catch(() => [] as GatewayBeta[]),
    getCagedData().catch(() => [] as CAGEDSectorData[]),
  ])

  const betaMap = new Map<string, GatewayBeta>(betas.map(b => [b.ticker, b]))

  // Guard: reject empty/partial responses
  if (quotes.length < MIN_QUOTES) {
    throw new Error(`Gateway returned only ${quotes.length} quotes (minimum: ${MIN_QUOTES})`)
  }
  if (fundamentals.length < MIN_FUNDAMENTALS) {
    throw new Error(`Gateway returned only ${fundamentals.length} fundamentals (minimum: ${MIN_FUNDAMENTALS})`)
  }

  // Convert macro momentum signal [-1, +1] → score [0, 100]
  const macroMomentumScore = macroMomentum
    ? Math.round(((macroMomentum.signal + 1) / 2) * 100)
    : null

  return { quotes, fundamentals, companies, macroMomentumScore, newsArticles, betaMap, cagedData }
}
