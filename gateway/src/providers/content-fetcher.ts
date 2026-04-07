// ─── Content Fetcher ─────────────────────────────────────────────
// Busca e extrai texto de URLs (artigos HTML e PDFs CVM).
// Usado para enriquecer notícias e documentos RI com texto completo.
//
// Dependências: cheerio (HTML parse), pdf-parse (PDF text extraction)

import * as cheerio from 'cheerio'
import { logger } from '../logger.js'

// ─── Types ──────────────────────────────────────────────────

export interface FetchedContent {
  url: string
  text: string
  fetchedAt: string
  contentType: 'html' | 'pdf' | 'text'
  charCount: number
}

// ─── LRU Cache ──────────────────────────────────────────────

const contentCache = new Map<string, FetchedContent>()
const MAX_CACHE_SIZE = 500
const CACHE_TTL_MS = 6 * 60 * 60 * 1000 // 6h

function getCached(url: string): FetchedContent | null {
  const entry = contentCache.get(url)
  if (!entry) return null
  const age = Date.now() - new Date(entry.fetchedAt).getTime()
  if (age > CACHE_TTL_MS) {
    contentCache.delete(url)
    return null
  }
  return entry
}

function setCache(url: string, content: FetchedContent): void {
  // LRU eviction
  if (contentCache.size >= MAX_CACHE_SIZE) {
    const firstKey = contentCache.keys().next().value
    if (firstKey) contentCache.delete(firstKey)
  }
  contentCache.set(url, content)
}

// ─── Rate Limiting ──────────────────────────────────────────

const domainLastFetch = new Map<string, number>()
const DOMAIN_DELAY_MS = 500

async function waitForDomain(url: string): Promise<void> {
  try {
    const domain = new URL(url).hostname
    const lastFetch = domainLastFetch.get(domain) ?? 0
    const elapsed = Date.now() - lastFetch
    if (elapsed < DOMAIN_DELAY_MS) {
      await new Promise(resolve => setTimeout(resolve, DOMAIN_DELAY_MS - elapsed))
    }
    domainLastFetch.set(domain, Date.now())
  } catch { /* invalid URL, skip */ }
}

// ─── HTML Extraction ────────────────────────────────────────

function extractTextFromHtml(html: string): string {
  const $ = cheerio.load(html)

  // Remover elementos não-conteúdo
  $('script, style, nav, header, footer, aside, .sidebar, .ad, .ads, .advertisement, .social-share, .comments, .related-posts, [role="navigation"], [role="banner"]').remove()

  // Tentar extrair do conteúdo principal
  const selectors = ['article', 'main', '.post-content', '.article-content', '.entry-content', '.content-text', '.materia-texto', '.article-body', '#article-body']
  for (const sel of selectors) {
    const el = $(sel)
    if (el.length > 0) {
      const text = el.text().replace(/\s+/g, ' ').trim()
      if (text.length > 100) return text.slice(0, 5000)
    }
  }

  // Fallback: body inteiro
  const bodyText = $('body').text().replace(/\s+/g, ' ').trim()
  return bodyText.slice(0, 5000)
}

// ─── PDF Extraction ─────────────────────────────────────────

async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  try {
    // Dynamic import para evitar problemas de ESM
    const pdfParseModule: any = await import('pdf-parse')
    const pdfParse = pdfParseModule.default ?? pdfParseModule
    const data = await pdfParse(buffer, { max: 3 }) // Max 3 páginas
    return data.text.replace(/\s+/g, ' ').trim().slice(0, 5000)
  } catch (err) {
    logger.warn({ err }, '[content-fetcher] PDF parse failed')
    return ''
  }
}

// ─── Public API ─────────────────────────────────────────────

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

/**
 * Busca e extrai texto de uma URL de artigo de notícias.
 * Suporta HTML e PDF. Cache LRU com TTL de 6h.
 */
export async function fetchArticleText(url: string): Promise<string | null> {
  if (!url) return null

  // Check cache
  const cached = getCached(url)
  if (cached) return cached.text

  try {
    await waitForDomain(url)

    const res = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT },
      signal: AbortSignal.timeout(8000),
      redirect: 'follow',
    })

    if (!res.ok) return null

    const contentType = res.headers.get('content-type') ?? ''
    let text = ''
    let type: FetchedContent['contentType'] = 'text'

    if (contentType.includes('application/pdf')) {
      const buffer = Buffer.from(await res.arrayBuffer())
      text = await extractTextFromPdf(buffer)
      type = 'pdf'
    } else if (contentType.includes('text/html') || contentType.includes('text/xml')) {
      const html = await res.text()
      text = extractTextFromHtml(html)
      type = 'html'
    } else {
      text = (await res.text()).slice(0, 5000)
    }

    if (text.length < 50) return null // Conteúdo muito curto, provavelmente lixo

    const content: FetchedContent = {
      url,
      text,
      fetchedAt: new Date().toISOString(),
      contentType: type,
      charCount: text.length,
    }
    setCache(url, content)
    return text
  } catch (err) {
    logger.debug({ err, url }, '[content-fetcher] Fetch failed')
    return null
  }
}

/**
 * Busca e extrai texto de documentos CVM (PDFs em português Latin-1).
 * Tratamento especial para encoding e limita a 3 páginas.
 */
export async function fetchCvmDocument(documentUrl: string): Promise<string | null> {
  if (!documentUrl) return null

  // Check cache
  const cached = getCached(documentUrl)
  if (cached) return cached.text

  try {
    await waitForDomain(documentUrl)

    const res = await fetch(documentUrl, {
      headers: { 'User-Agent': USER_AGENT },
      signal: AbortSignal.timeout(15000), // CVM é lento
      redirect: 'follow',
    })

    if (!res.ok) return null

    const buffer = Buffer.from(await res.arrayBuffer())
    const contentType = res.headers.get('content-type') ?? ''

    let text = ''
    let type: FetchedContent['contentType'] = 'text'

    if (contentType.includes('application/pdf') || documentUrl.endsWith('.pdf')) {
      text = await extractTextFromPdf(buffer)
      type = 'pdf'
    } else {
      // HTML/texto — tentar decodificar Latin-1 (comum em CVM)
      const head = buffer.subarray(0, 200).toString('ascii')
      const isLatin = head.includes('iso-8859-1') || head.includes('latin1') || head.includes('windows-1252')
      const decoded = isLatin ? new TextDecoder('iso-8859-1').decode(buffer) : buffer.toString('utf-8')
      text = extractTextFromHtml(decoded)
      type = 'html'
    }

    if (text.length < 30) return null

    const content: FetchedContent = {
      url: documentUrl,
      text,
      fetchedAt: new Date().toISOString(),
      contentType: type,
      charCount: text.length,
    }
    setCache(documentUrl, content)
    return text
  } catch (err) {
    logger.debug({ err, url: documentUrl }, '[content-fetcher] CVM document fetch failed')
    return null
  }
}
