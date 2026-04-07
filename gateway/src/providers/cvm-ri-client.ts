// ─── CVM RI (Relações com Investidores) Client ────────────────
// Busca fatos relevantes, comunicados e avisos direto da CVM.
// Fonte: CSV público IPE em dados.cvm.gov.br
//
// Persiste em disco (ri-events.json), cache 1h.

import { readJsonFile, writeJsonFile } from '../persistence/index.js'
import { loadCnpjTickerMap } from './cvm-financials-client.js'
import { logger } from '../logger.js'
import { createHash } from 'crypto'

// ─── Types ──────────────────────────────────────────────────

export interface CvmRiEvent {
  id: string
  companyName: string
  cnpj: string
  ticker: string | null
  type: 'fato_relevante' | 'comunicado_mercado' | 'aviso_acionistas' | 'assembleia' | 'resultado_trimestral'
  title: string
  date: string          // ISO 8601
  documentUrl: string | null
  summary: string | null            // Texto extraído do PDF/HTML do documento
  contentSentiment: number | null   // Sentiment do documento (-1 a +1)
  contentKeywords: string[]         // Keywords detectados (recompra, processo, etc.)
}

interface RiEventsFile {
  version: number
  fetchedAt: string
  count: number
  events: CvmRiEvent[]
}

// ─── Constants ──────────────────────────────────────────────

const PERSIST_FILE = 'ri-events.json'
const CACHE_TTL_MS = 60 * 60 * 1000 // 1 hora
const MAX_AGE_DAYS = 30

// Tipos de documento que nos interessam
const TP_DOC_MAP: Record<string, CvmRiEvent['type']> = {
  'Fato Relevante': 'fato_relevante',
  'Comunicado ao Mercado': 'comunicado_mercado',
  'Aviso aos Acionistas': 'aviso_acionistas',
  'Ata da Assembléia Geral Ordinária': 'assembleia',
  'Ata da Assembléia Geral Extraordinária': 'assembleia',
  'Ata da AGO/AGE': 'assembleia',
  'ITR - Informações Trimestrais': 'resultado_trimestral',
  'DFP - Demonstrações Financeiras Padronizadas': 'resultado_trimestral',
}

const ALLOWED_TYPES = new Set(Object.keys(TP_DOC_MAP))

// ─── In-memory cache ────────────────────────────────────────

let cachedEvents: CvmRiEvent[] | null = null
let cacheTimestamp = 0

// ─── Helpers ────────────────────────────────────────────────

function makeId(cnpj: string, date: string, type: string): string {
  const hash = createHash('md5').update(`${cnpj}|${date}|${type}`).digest('hex').slice(0, 12)
  return `cvm-ri-${hash}`
}

function parseCsvLine(line: string): string[] {
  // Separador ;, campos podem estar entre aspas
  const fields: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const ch = line[i]!
    if (ch === '"') {
      inQuotes = !inQuotes
    } else if (ch === ';' && !inQuotes) {
      fields.push(current.trim())
      current = ''
    } else {
      current += ch
    }
  }
  fields.push(current.trim())
  return fields
}

function buildCnpjToTickerMap(): Map<string, string> {
  const mapFile = loadCnpjTickerMap()
  const reverse = new Map<string, string>()
  if (!mapFile?.mappings) return reverse

  for (const [ticker, entry] of Object.entries(mapFile.mappings)) {
    // Normalizar CNPJ (remover pontuação)
    const cleanCnpj = entry.cnpj.replace(/[.\-/]/g, '')
    if (!reverse.has(cleanCnpj)) {
      reverse.set(cleanCnpj, ticker)
    }
  }
  return reverse
}

// ─── CSV Fetch & Parse ──────────────────────────────────────

async function fetchAndParseCsv(): Promise<CvmRiEvent[]> {
  const year = new Date().getFullYear()
  const url = `https://dados.cvm.gov.br/dados/CIA_ABERTA/DOC/IPE/DADOS/ipe_cia_aberta_${year}.csv`

  logger.info(`[cvm-ri] Fetching CSV: ${url}`)

  const res = await fetch(url, {
    signal: AbortSignal.timeout(30000),
    headers: { 'Accept': 'text/csv' },
  })

  if (!res.ok) {
    throw new Error(`CVM RI CSV fetch failed: ${res.status} ${res.statusText}`)
  }

  // CVM CSV usa latin1 (ISO-8859-1)
  const buffer = await res.arrayBuffer()
  const text = new TextDecoder('latin1').decode(buffer)

  const lines = text.split('\n')
  if (lines.length < 2) {
    logger.warn('[cvm-ri] CSV vazio ou com apenas cabeçalho')
    return []
  }

  // Parse header para encontrar índices das colunas
  const header = parseCsvLine(lines[0]!)
  const colIndex: Record<string, number> = {}
  for (let i = 0; i < header.length; i++) {
    colIndex[header[i]!] = i
  }

  const requiredCols = ['CNPJ_CIA', 'DENOM_CIA', 'DT_REFER', 'DT_ENTREGA', 'TP_DOC', 'LINK_DOC']
  for (const col of requiredCols) {
    if (colIndex[col] === undefined) {
      // Tentar com nomes alternativos
      logger.warn(`[cvm-ri] Coluna ${col} não encontrada no CSV. Colunas: ${header.join(', ')}`)
    }
  }

  const cnpjIdx = colIndex['CNPJ_CIA'] ?? -1
  const denomIdx = colIndex['DENOM_CIA'] ?? colIndex['DENOM_SOCIAL'] ?? -1
  const dtReferIdx = colIndex['DT_REFER'] ?? -1
  const dtEntregaIdx = colIndex['DT_ENTREGA'] ?? -1
  const tpDocIdx = colIndex['TP_DOC'] ?? colIndex['CATEG_DOC'] ?? -1
  const linkDocIdx = colIndex['LINK_DOC'] ?? -1

  if (cnpjIdx < 0 || tpDocIdx < 0) {
    logger.error('[cvm-ri] Colunas essenciais não encontradas no CSV')
    return []
  }

  // Build CNPJ → ticker
  const cnpjToTicker = buildCnpjToTickerMap()

  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - MAX_AGE_DAYS)
  const cutoffStr = cutoff.toISOString().split('T')[0]!

  const events: CvmRiEvent[] = []
  const seen = new Set<string>()

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]!.trim()
    if (!line) continue

    const fields = parseCsvLine(line)
    const tpDoc = fields[tpDocIdx] ?? ''

    // Filtrar tipo
    if (!ALLOWED_TYPES.has(tpDoc)) continue

    const cnpjRaw = fields[cnpjIdx] ?? ''
    const cnpjClean = cnpjRaw.replace(/[.\-/]/g, '')
    const denomCia = fields[denomIdx] ?? ''

    // Usar DT_ENTREGA (mais confiável para "quando apareceu") ou DT_REFER
    const dtEntrega = fields[dtEntregaIdx] ?? ''
    const dtRefer = fields[dtReferIdx] ?? ''
    const dateStr = dtEntrega || dtRefer

    if (!dateStr) continue

    // Filtrar últimos 30 dias
    // Datas CVM vêm em formato YYYY-MM-DD
    const normalizedDate = dateStr.length === 10 ? dateStr : dateStr.slice(0, 10)
    if (normalizedDate < cutoffStr) continue

    const linkDoc = fields[linkDocIdx] ?? null

    const type = TP_DOC_MAP[tpDoc]
    if (!type) continue

    const id = makeId(cnpjClean, normalizedDate, tpDoc)
    if (seen.has(id)) continue
    seen.add(id)

    const ticker = cnpjToTicker.get(cnpjClean) ?? null

    events.push({
      id,
      companyName: denomCia,
      cnpj: cnpjRaw,
      ticker,
      type,
      title: `${tpDoc} — ${denomCia}`,
      date: new Date(normalizedDate).toISOString(),
      documentUrl: linkDoc || null,
      summary: null,
      contentSentiment: null,
      contentKeywords: [],
    })
  }

  // Ordenar por data decrescente
  events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  // Log stats por tipo
  const typeCounts: Record<string, number> = {}
  for (const e of events) {
    typeCounts[e.type] = (typeCounts[e.type] ?? 0) + 1
  }
  const statsStr = Object.entries(typeCounts).map(([t, c]) => `${t}: ${c}`).join(', ')
  logger.info(`[cvm-ri] Parsed ${events.length} events (${statsStr}), ${cnpjToTicker.size} tickers mapped`)

  return events
}

// ─── Persistence ────────────────────────────────────────────

function saveEvents(events: CvmRiEvent[]): void {
  writeJsonFile<RiEventsFile>(PERSIST_FILE, {
    version: 1,
    fetchedAt: new Date().toISOString(),
    count: events.length,
    events,
  })
}

function loadEvents(): CvmRiEvent[] | null {
  const file = readJsonFile<RiEventsFile>(PERSIST_FILE)
  if (!file?.events) return null
  return file.events
}

// ─── Public API ─────────────────────────────────────────────

/**
 * Warm cache from disk on startup.
 * Returns true if data was loaded from disk.
 */
export function warmRiCache(): boolean {
  const events = loadEvents()
  if (events && events.length > 0) {
    cachedEvents = events
    logger.info(`[cvm-ri] Warmed from disk: ${events.length} events`)
    return true
  }
  return false
}

/**
 * Check if RI cache is stale (> 1h old or empty).
 */
export function isRiStale(): boolean {
  if (!cachedEvents || cachedEvents.length === 0) return true
  return Date.now() - cacheTimestamp > CACHE_TTL_MS
}

/**
 * Fetch RI events from CVM. Uses in-memory cache with 1h TTL.
 * Falls back to disk cache on error.
 */
export async function fetchCvmRiEvents(): Promise<CvmRiEvent[]> {
  // Return cache if fresh
  if (cachedEvents && !isRiStale()) {
    return cachedEvents
  }

  try {
    const events = await fetchAndParseCsv()
    cachedEvents = events
    cacheTimestamp = Date.now()
    saveEvents(events)
    return events
  } catch (err) {
    logger.error({ err }, '[cvm-ri] Fetch failed, using cached data')
    // Fallback to cached or disk
    if (cachedEvents) return cachedEvents
    const disk = loadEvents()
    if (disk) {
      cachedEvents = disk
      return disk
    }
    return []
  }
}

/**
 * Get cached events (synchronous, for route handlers).
 * Returns null if no data available.
 */
export function getCachedRiEvents(): CvmRiEvent[] | null {
  return cachedEvents
}

// ─── Document Enrichment ──────────────────────────────────────

const CONTENT_KEYWORDS_MAP: Record<string, string> = {
  'recompra de ações': 'recompra',
  'programa de recompra': 'recompra',
  'aquisição': 'aquisição',
  'aquisicao': 'aquisição',
  'fusão': 'fusão',
  'incorporação': 'incorporação',
  'dividendo': 'dividendos',
  'proventos': 'dividendos',
  'juros sobre capital': 'dividendos',
  'venda de ativos': 'venda',
  'alienação': 'venda',
  'reestruturação': 'reestruturação',
  'processo': 'processo',
  'multa': 'multa',
  'sanção': 'sanção',
  'investigação': 'investigação',
  'recuperação judicial': 'recuperação judicial',
  'diretor presidente': 'mudança gestão',
  'diretor-presidente': 'mudança gestão',
}

function extractContentKeywords(text: string): string[] {
  const lower = text.toLowerCase()
  const found = new Set<string>()
  for (const [pattern, label] of Object.entries(CONTENT_KEYWORDS_MAP)) {
    if (lower.includes(pattern)) found.add(label)
  }
  return [...found]
}

/**
 * Enriquece eventos RI com conteúdo extraído dos documentos.
 * Roda em background, max 50 documentos por ciclo.
 * Foca em Fatos Relevantes e Comunicados ao Mercado dos últimos 30 dias.
 */
export async function enrichRiDocuments(): Promise<number> {
  if (!cachedEvents || cachedEvents.length === 0) return 0

  // Dynamic import do content-fetcher
  const { fetchCvmDocument } = await import('./content-fetcher.js')
  const { analyzeSentiment } = await import('../sentiment/index.js')

  const enrichableTypes: CvmRiEvent['type'][] = ['fato_relevante', 'comunicado_mercado']
  const candidates = cachedEvents.filter(e =>
    enrichableTypes.includes(e.type) &&
    e.documentUrl &&
    !e.summary // Ainda não enriquecido
  ).slice(0, 50) // Max 50 por ciclo

  let enriched = 0
  for (const event of candidates) {
    if (!event.documentUrl) continue
    try {
      const text = await fetchCvmDocument(event.documentUrl)
      if (text && text.length > 30) {
        event.summary = text.slice(0, 2000)
        const sentiment = analyzeSentiment(text)
        event.contentSentiment = sentiment.score
        event.contentKeywords = extractContentKeywords(text)
        enriched++
      }
    } catch {
      // Skip silently
    }
  }

  if (enriched > 0) {
    saveEvents(cachedEvents)
    logger.info(`[cvm-ri] Enriched ${enriched} documents with content`)
  }

  return enriched
}
