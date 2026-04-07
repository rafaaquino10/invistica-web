// ─── BCB SGS API Provider ─────────────────────────────────────
// Fetches real economic indicators from Banco Central do Brasil.
// API: https://api.bcb.gov.br/dados/serie/bcdata.sgs.{codigo}/dados/ultimos/{n}?formato=json
// No auth required, no significant rate limits.

import { Router } from 'express'
import { cache } from '../cache/index.js'
import { readJsonFile, writeJsonFile } from '../persistence/index.js'
import { logger } from '../logger.js'

const router = Router()

// ─── Series Configuration ─────────────────────────────────
const BCB_SERIES = {
  432:   { name: 'SELIC Meta', unit: '% a.a.' },
  433:   { name: 'IPCA Mensal', unit: '% a.m.' },
  13522: { name: 'IPCA 12 meses', unit: '% 12m' },
  12:    { name: 'CDI', unit: '% a.a.' },
  1:     { name: 'Dólar PTAX venda', unit: 'R$/US$' },
  21619: { name: 'Euro PTAX venda', unit: 'R$/EUR' },
  189:   { name: 'IGP-M Mensal', unit: '% a.m.' },
} as const

type SeriesCode = keyof typeof BCB_SERIES

interface BcbDataPoint {
  data: string  // dd/MM/yyyy
  valor: number
}

export interface BcbIndicators {
  selic:   { valor: number; data: string }
  ipca:    { valor: number; data: string }
  ipca12m: { valor: number; data: string }
  cdi:     { valor: number; data: string }
  dolar:   { valor: number; data: string }
  euro:    { valor: number; data: string }
}

const CACHE_KEY = 'bcb:indicators'
const CACHE_TTL = 60 * 60 * 1000  // 1 hour
const DISK_FILE = 'bcb-indicators.json'
const FETCH_TIMEOUT = 10000

// ─── BCB API Fetcher ──────────────────────────────────────

async function fetchBcbSeries(codigo: number, ultimos: number = 1): Promise<BcbDataPoint[]> {
  const url = `https://api.bcb.gov.br/dados/serie/bcdata.sgs.${codigo}/dados/ultimos/${ultimos}?formato=json`
  const res = await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT) })
  if (!res.ok) throw new Error(`BCB SGS ${codigo}: HTTP ${res.status}`)
  const data = await res.json() as Array<{ data: string; valor: string }>
  return data.map(d => ({
    data: d.data,
    valor: parseFloat(d.valor),
  }))
}

function getLatestValue(points: BcbDataPoint[]): { valor: number; data: string } | null {
  if (!points.length) return null
  const last = points[points.length - 1]!
  return { valor: last.valor, data: last.data }
}

// ─── Fetch All Indicators ─────────────────────────────────

export async function fetchBcbIndicators(): Promise<BcbIndicators | null> {
  try {
    const [selic, ipca, ipca12m, cdi, dolar, euro] = await Promise.all([
      fetchBcbSeries(432).then(getLatestValue),
      fetchBcbSeries(433).then(getLatestValue),
      fetchBcbSeries(13522).then(getLatestValue),
      fetchBcbSeries(12).then(getLatestValue),
      fetchBcbSeries(1).then(getLatestValue),
      fetchBcbSeries(21619).then(getLatestValue),
    ])

    if (!selic || !ipca || !cdi || !dolar) {
      logger.warn('[bcb] Some BCB series returned empty')
      return null
    }

    const indicators: BcbIndicators = {
      selic:   selic,
      ipca:    ipca,
      ipca12m: ipca12m ?? { valor: 0, data: '' },
      cdi:     cdi,
      dolar:   dolar,
      euro:    euro ?? { valor: 0, data: '' },
    }

    // Cache + persist
    cache.set(CACHE_KEY, indicators, CACHE_TTL)
    writeJsonFile(DISK_FILE, { fetchedAt: new Date().toISOString(), indicators })
    logger.info({
      selic: indicators.selic.valor,
      ipca: indicators.ipca.valor,
      cdi: indicators.cdi.valor,
      dolar: indicators.dolar.valor,
    }, '[bcb] Indicators fetched from BCB SGS')

    return indicators
  } catch (err) {
    logger.error({ err }, '[bcb] Failed to fetch BCB indicators')
    return null
  }
}

// ─── Get with Cache + Fallback ─────────────────────────────

export async function getBcbIndicators(): Promise<BcbIndicators | null> {
  // 1. Memory cache
  const cached = cache.get<BcbIndicators>(CACHE_KEY)
  if (cached) return cached

  // 2. Try live fetch
  const live = await fetchBcbIndicators()
  if (live) return live

  // 3. Fallback: disk
  const disk = readJsonFile<{ indicators: BcbIndicators }>(DISK_FILE)
  if (disk?.indicators) {
    cache.set(CACHE_KEY, disk.indicators, CACHE_TTL)
    logger.warn('[bcb] Using disk fallback for BCB indicators')
    return disk.indicators
  }

  return null
}

// ─── Routes ────────────────────────────────────────────────

// GET /providers/bcb/indicators — All macro indicators
router.get('/indicators', async (_req, res) => {
  try {
    const indicators = await getBcbIndicators()
    if (!indicators) {
      return res.status(502).json({ error: 'BCB SGS unavailable' })
    }
    res.json({ data: indicators, fetchedAt: new Date().toISOString() })
  } catch (err) {
    logger.error({ err }, '[bcb] Route error')
    res.status(500).json({ error: 'Internal error' })
  }
})

// GET /providers/bcb/series/:code — Single series (last N values)
router.get('/series/:code', async (req, res) => {
  const code = parseInt(req.params['code'] ?? '', 10)
  const series = BCB_SERIES[code as SeriesCode]
  if (!series) {
    return res.status(404).json({
      error: 'Series not found',
      available: Object.entries(BCB_SERIES).map(([k, v]) => `${k}: ${v.name}`),
    })
  }

  const ultimos = Math.min(parseInt(req.query['ultimos'] as string) || 1, 365)

  try {
    const data = await fetchBcbSeries(code, ultimos)
    res.json({
      serie: { codigo: code, nome: series.name, unidade: series.unit },
      dados: data,
      ultimaAtualizacao: new Date().toISOString(),
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    res.status(502).json({ error: 'BCB API error', message })
  }
})

export { router as bcbRoutes }
