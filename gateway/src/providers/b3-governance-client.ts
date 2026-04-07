// ─── B3 Governance Client ──────────────────────────────────────
// Busca dados de segmento de listagem e governança corporativa da B3.
// Fonte: API JSON pública da B3 (não precisa scraping HTML).
//
// Cache: gateway/data/b3-governance.json, refresh semanal.

import { readJsonFile, writeJsonFile } from '../persistence/index.js'
import { logger } from '../logger.js'

// ─── Types ──────────────────────────────────────────────────

export interface B3CompanyInfo {
  ticker: string
  companyName: string
  tradingName: string
  listingSegment: string   // "Novo Mercado" | "Nível 1" | "Nível 2" | "Tradicional" | "Básico"
  mainActivity: string
  issuingCompany: string   // código da empresa na B3
}

interface B3GovernanceFile {
  version: number
  fetchedAt: string
  count: number
  companies: Record<string, B3CompanyInfo>
}

interface B3ApiResponse {
  page: { totalRecords: number; pageNumber: number; pageSize: number }
  results: Array<{
    issuingCompany: string
    companyName: string
    tradingName: string
    listingSegment: string
    mainActivity: string
    cnpj: string
    marketIndicator: number
    typeBDR: string
    dateListing: string
    status: string
    segment: string
    segmentEng: string
    type: string
    market: string
  }>
}

// ─── Constants ──────────────────────────────────────────────

const PERSIST_FILE = 'b3-governance.json'
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000 // 7 dias
const B3_API_URL = 'https://sistemaswebb3-listados.b3.com.br/listedCompaniesProxy/CompanyCall/GetInitialCompanies/'

// ─── Ticker Mapping ─────────────────────────────────────────

// A B3 retorna "issuingCompany" como código base (ex: "PETR"), precisamos
// do ticker completo. Usamos o mapa de tickers conhecidos do sistema.
let knownTickerMap: Map<string, string> | null = null

export function setKnownTickers(tickerToBase: Map<string, string>): void {
  knownTickerMap = tickerToBase
}

function findTickerByCompanyCode(code: string): string | null {
  if (!knownTickerMap) return null
  // Match direto: PETR → PETR4 (prefere PN)
  for (const [ticker] of knownTickerMap) {
    if (ticker.startsWith(code) && /\d{1,2}$/.test(ticker)) {
      return ticker
    }
  }
  return null
}

// ─── Persistence ────────────────────────────────────────────

export function loadGovernanceData(): Map<string, B3CompanyInfo> {
  const file = readJsonFile<B3GovernanceFile>(PERSIST_FILE)
  if (!file?.companies) return new Map()
  return new Map(Object.entries(file.companies))
}

function saveGovernanceData(data: Map<string, B3CompanyInfo>): void {
  const obj: Record<string, B3CompanyInfo> = {}
  for (const [ticker, info] of data) {
    obj[ticker] = info
  }
  writeJsonFile<B3GovernanceFile>(PERSIST_FILE, {
    version: 1,
    fetchedAt: new Date().toISOString(),
    count: data.size,
    companies: obj,
  })
}

export function isGovernanceStale(): boolean {
  const file = readJsonFile<B3GovernanceFile>(PERSIST_FILE)
  if (!file?.fetchedAt) return true
  const age = Date.now() - new Date(file.fetchedAt).getTime()
  return age > MAX_AGE_MS
}

// ─── Fetch from B3 API ─────────────────────────────────────

async function fetchB3Page(pageNumber: number): Promise<B3ApiResponse | null> {
  try {
    const res = await fetch(B3_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'InvestIQ-Gateway/3.0',
      },
      body: JSON.stringify({
        language: 'pt-br',
        pageNumber,
        pageSize: 120,
      }),
      signal: AbortSignal.timeout(15000),
    })
    if (!res.ok) return null
    return await res.json() as B3ApiResponse
  } catch (err) {
    logger.warn({ err, pageNumber }, '[b3-governance] Failed to fetch page')
    return null
  }
}

/**
 * Busca todas as empresas listadas na B3 e seus segmentos de listagem.
 * Atualiza o cache em disco.
 */
export async function refreshB3Governance(): Promise<Map<string, B3CompanyInfo>> {
  const allCompanies = new Map<string, B3CompanyInfo>()

  let pageNumber = 1
  let totalRecords = 0
  let fetched = 0

  do {
    const response = await fetchB3Page(pageNumber)
    if (!response?.results?.length) break

    totalRecords = response.page.totalRecords

    for (const company of response.results) {
      // Normalizar segmento de listagem
      let segment = company.listingSegment || 'Tradicional'
      if (segment.includes('NOVO MERCADO') || segment.includes('Novo Mercado')) segment = 'Novo Mercado'
      else if (segment.includes('NÍVEL 2') || segment.includes('Nível 2') || segment.includes('N2')) segment = 'Nível 2'
      else if (segment.includes('NÍVEL 1') || segment.includes('Nível 1') || segment.includes('N1')) segment = 'Nível 1'
      else if (segment.includes('BOVESPA MAIS') || segment.includes('Bovespa Mais')) segment = 'Bovespa Mais'
      else segment = 'Tradicional'

      const code = company.issuingCompany?.trim()
      if (!code) continue

      // Tentar encontrar o ticker pelo código da empresa
      const ticker = findTickerByCompanyCode(code)
      const key = ticker || code

      allCompanies.set(key, {
        ticker: key,
        companyName: company.companyName,
        tradingName: company.tradingName,
        listingSegment: segment,
        mainActivity: company.mainActivity || '',
        issuingCompany: code,
      })

      fetched++
    }

    pageNumber++
    // Rate limit: esperar 500ms entre páginas
    await new Promise(resolve => setTimeout(resolve, 500))
  } while (fetched < totalRecords && pageNumber <= 10) // max 10 páginas

  if (allCompanies.size > 0) {
    saveGovernanceData(allCompanies)
    logger.info(`[b3-governance] Fetched ${allCompanies.size} companies from B3`)
  }

  return allCompanies
}

/**
 * Retorna segmento de listagem para um ticker.
 */
export function getListingSegment(ticker: string): string | null {
  const data = loadGovernanceData()
  // Tentar match direto
  const direct = data.get(ticker)
  if (direct) return direct.listingSegment

  // Tentar match pelo código base (ex: PETR4 → PETR)
  const base = ticker.replace(/\d+$/, '')
  for (const [, info] of data) {
    if (info.issuingCompany === base) return info.listingSegment
  }

  return null
}

/**
 * Pontua segmento de listagem: NM=100, N2=80, N1=60, Tradicional=30
 */
export function scoreListingSegment(segment: string | null): number {
  if (!segment) return 50 // fallback neutro
  switch (segment) {
    case 'Novo Mercado': return 100
    case 'Nível 2': return 80
    case 'Nível 1': return 60
    case 'Bovespa Mais': return 50
    case 'Tradicional':
    default: return 30
  }
}
