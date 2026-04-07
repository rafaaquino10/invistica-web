// ─── BCB Focus Report Client ─────────────────────────────────
// Fetches the BCB Focus survey (market expectations).
// Published weekly on Mondays by the Banco Central do Brasil.
// Uses the BCB OLINDA API (no auth required).

import { cache } from '../cache/index.js'
import { readJsonFile, writeJsonFile } from '../persistence/index.js'

const CACHE_KEY = 'focus:data'
const CACHE_TTL = 6 * 60 * 60 * 1000 // 6 hours
const DISK_FILE = 'focus.json'
const FETCH_TIMEOUT = 10000

const OLINDA_BASE = 'https://olinda.bcb.gov.br/olinda/servico/Expectativas/versao/v1/odata'

// ─── Types ──────────────────────────────────────────────────

export interface FocusExpectation {
  indicator: string
  referenceDate: string  // year or date reference
  median: number
  previous: number | null
  date: string           // survey date (YYYY-MM-DD)
  delta: number | null   // week-over-week change
}

export interface FocusData {
  selic: FocusExpectation | null
  ipca: FocusExpectation | null
  pib: FocusExpectation | null
  cambio: FocusExpectation | null
  updatedAt: string
  insight: string | null
}

// ─── API Fetchers ───────────────────────────────────────────

async function fetchOlinda<T>(path: string): Promise<T> {
  const url = `${OLINDA_BASE}/${path}`
  const res = await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT) })
  if (!res.ok) throw new Error(`BCB OLINDA ${res.status}: ${url}`)
  return res.json() as Promise<T>
}

interface OlindaResponse {
  value: Array<Record<string, unknown>>
}

function parseSelicResponse(data: OlindaResponse): FocusExpectation | null {
  const values = data.value
  if (!values || values.length === 0) return null

  const latest = values[0]!
  const previous = values.length > 1 ? values[1] : null

  const median = Number(latest['Mediana'] ?? 0)
  const prevMedian = previous ? Number(previous['Mediana'] ?? 0) : null
  const date = String(latest['Data'] ?? '').split('T')[0] ?? ''
  const reuniao = String(latest['Reuniao'] ?? '')

  return {
    indicator: 'SELIC',
    referenceDate: reuniao || date,
    median,
    previous: prevMedian,
    date,
    delta: prevMedian != null ? Math.round((median - prevMedian) * 100) / 100 : null,
  }
}

function parseAnnualResponse(
  data: OlindaResponse,
  indicator: string,
): FocusExpectation | null {
  const values = data.value
  if (!values || values.length === 0) return null

  const latest = values[0]!
  const previous = values.length > 1 ? values[1] : null

  const median = Number(latest['Mediana'] ?? 0)
  const prevMedian = previous ? Number(previous['Mediana'] ?? 0) : null
  const date = String(latest['Data'] ?? '').split('T')[0] ?? ''
  const refDate = String(latest['DataReferencia'] ?? '')

  return {
    indicator,
    referenceDate: refDate || date,
    median,
    previous: prevMedian,
    date,
    delta: prevMedian != null ? Math.round((median - prevMedian) * 100) / 100 : null,
  }
}

// ─── Insight Generation ─────────────────────────────────────

function generateInsight(focus: Omit<FocusData, 'insight' | 'updatedAt'>): string | null {
  const insights: string[] = []

  if (focus.selic?.delta != null && Math.abs(focus.selic.delta) >= 0.25) {
    const direction = focus.selic.delta > 0 ? 'elevou' : 'reduziu'
    const impact = focus.selic.delta < 0 ? 'positivo para renda variável' : 'pressão sobre renda variável'
    insights.push(
      `Mercado ${direction} projeção da Selic de ${focus.selic.previous?.toFixed(2)}% para ${focus.selic.median.toFixed(2)}% — ${impact}`,
    )
  }

  if (focus.ipca?.delta != null && Math.abs(focus.ipca.delta) >= 0.1) {
    const direction = focus.ipca.delta > 0 ? 'subiu' : 'caiu'
    insights.push(
      `Projeção do IPCA ${direction}: ${focus.ipca.previous?.toFixed(2)}% → ${focus.ipca.median.toFixed(2)}%`,
    )
  }

  if (focus.pib?.delta != null && Math.abs(focus.pib.delta) >= 0.1) {
    const direction = focus.pib.delta > 0 ? 'revisou para cima' : 'revisou para baixo'
    insights.push(
      `Mercado ${direction} projeção do PIB: ${focus.pib.previous?.toFixed(2)}% → ${focus.pib.median.toFixed(2)}%`,
    )
  }

  if (focus.cambio?.delta != null && Math.abs(focus.cambio.delta) >= 0.05) {
    const direction = focus.cambio.delta > 0 ? 'subiu' : 'caiu'
    insights.push(
      `Projeção do câmbio USD/BRL ${direction}: R$${focus.cambio.previous?.toFixed(2)} → R$${focus.cambio.median.toFixed(2)}`,
    )
  }

  return insights.length > 0 ? insights.join('. ') : null
}

// ─── Public API ─────────────────────────────────────────────

export async function fetchFocusExpectations(): Promise<FocusData> {
  // 1. Check cache
  const cached = cache.get<FocusData>(CACHE_KEY)
  if (cached) return cached

  // 2. Fetch from BCB OLINDA
  try {
    const currentYear = new Date().getFullYear()
    const [selicRaw, ipcaRaw, pibRaw, cambioRaw] = await Promise.all([
      fetchOlinda<OlindaResponse>(
        `ExpectativasMercadoSelic?$top=2&$orderby=Data%20desc&$format=json`,
      ),
      fetchOlinda<OlindaResponse>(
        `ExpectativasMercadoInflacao12Meses?$top=2&$orderby=Data%20desc&$format=json&$filter=Indicador%20eq%20'IPCA'`,
      ),
      fetchOlinda<OlindaResponse>(
        `ExpectativasMercadoAnuais?$top=2&$orderby=Data%20desc&$format=json&$filter=Indicador%20eq%20'PIB%20Total'%20and%20DataReferencia%20eq%20'${currentYear}'`,
      ),
      fetchOlinda<OlindaResponse>(
        `ExpectativasMercadoAnuais?$top=2&$orderby=Data%20desc&$format=json&$filter=Indicador%20eq%20'Taxa%20de%20c%C3%A2mbio'%20and%20DataReferencia%20eq%20'${currentYear}'`,
      ),
    ])

    const selic = parseSelicResponse(selicRaw)
    const ipca = parseAnnualResponse(ipcaRaw, 'IPCA')
    const pib = parseAnnualResponse(pibRaw, 'PIB')
    const cambio = parseAnnualResponse(cambioRaw, 'Câmbio')

    const partial = { selic, ipca, pib, cambio }
    const insight = generateInsight(partial)

    const focusData: FocusData = {
      ...partial,
      updatedAt: new Date().toISOString(),
      insight,
    }

    // Cache + persist
    cache.set(CACHE_KEY, focusData, CACHE_TTL)
    writeJsonFile(DISK_FILE, { fetchedAt: new Date().toISOString(), data: focusData })

    return focusData
  } catch (err) {
    // Fallback to disk
    const disk = readJsonFile<{ data: FocusData }>(DISK_FILE)
    if (disk?.data) {
      cache.set(CACHE_KEY, disk.data, CACHE_TTL)
      return disk.data
    }

    // Empty fallback
    return {
      selic: null,
      ipca: null,
      pib: null,
      cambio: null,
      updatedAt: new Date().toISOString(),
      insight: null,
    }
  }
}
