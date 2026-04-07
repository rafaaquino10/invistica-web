// ─── Sparklines Route ─────────────────────────────────────────
// Batch endpoint: retorna arrays de close prices (30d) para todos os ativos.
// Scrapeado periodicamente no background, cache em memória + disco.

import { Router } from 'express'
import type { Request, Response } from 'express'
import { cache } from '../cache/index.js'
import { fetchHistory, type BrapiHistoricalPrice } from '../providers/brapi-client.js'
import { readJsonFile, writeJsonFile } from '../persistence/index.js'
import { logger } from '../logger.js'

const router = Router()

const CACHE_KEY = 'sparklines:all'
const CACHE_TTL = 2 * 60 * 60 * 1000 // 2h
const DISK_FILE = 'sparklines.json'

export type SparklineMap = Record<string, number[]>

interface DiskData {
  data: SparklineMap
  updatedAt: string
}

// GET /v1/sparklines — todas as sparklines 30d
router.get('/', (_req: Request, res: Response) => {
  const cached = cache.getStale<SparklineMap>(CACHE_KEY)

  if (cached && Object.keys(cached).length > 0) {
    return res.json({
      data: cached,
      count: Object.keys(cached).length,
      source: cache.isStale(CACHE_KEY) ? 'stale-cache' : 'cache',
      fetchedAt: new Date().toISOString(),
    })
  }

  // Tenta disco
  const disk = readJsonFile<DiskData>(DISK_FILE)
  if (disk?.data && Object.keys(disk.data).length > 0) {
    cache.set(CACHE_KEY, disk.data, CACHE_TTL)
    return res.json({
      data: disk.data,
      count: Object.keys(disk.data).length,
      source: 'disk',
      fetchedAt: disk.updatedAt,
    })
  }

  res.json({
    data: {},
    count: 0,
    source: 'empty',
    fetchedAt: new Date().toISOString(),
  })
})

/**
 * Scrape sparkline data para todos os tickers.
 * Busca histórico de 1 mês com intervalo diário, extrai apenas close prices.
 * Rate-limited: processa em batches de 5 com delay entre batches.
 */
export async function scrapeSparklines(tickers: string[]): Promise<SparklineMap> {
  const result: SparklineMap = {}
  const existing = cache.getStale<SparklineMap>(CACHE_KEY) ?? {}

  // Processar em batches de 5 para não ultrapassar rate limit
  const BATCH_SIZE = 5
  const BATCH_DELAY_MS = 1500

  let processed = 0
  let errors = 0

  for (let i = 0; i < tickers.length; i += BATCH_SIZE) {
    const batch = tickers.slice(i, i + BATCH_SIZE)

    const promises = batch.map(async (ticker) => {
      try {
        const history = await fetchHistory(ticker, '1mo', '1d')
        if (history.length >= 5) {
          // Extrair apenas close prices, ordenados por data
          const closes = history
            .sort((a: BrapiHistoricalPrice, b: BrapiHistoricalPrice) => a.date - b.date)
            .map((h: BrapiHistoricalPrice) => h.close)
          result[ticker] = closes
        }
        processed++
      } catch {
        // Manter dados anteriores se disponíveis
        if (existing[ticker]) {
          result[ticker] = existing[ticker]
        }
        errors++
      }
    })

    await Promise.all(promises)

    // Delay entre batches (exceto o último)
    if (i + BATCH_SIZE < tickers.length) {
      await new Promise(resolve => setTimeout(resolve, BATCH_DELAY_MS))
    }
  }

  // Merge: manter sparklines de tickers não processados
  const merged = { ...existing, ...result }

  // Salvar no cache e disco
  cache.set(CACHE_KEY, merged, CACHE_TTL)
  writeJsonFile(DISK_FILE, { data: merged, updatedAt: new Date().toISOString() })

  logger.info(`[sparklines] Scraped ${processed} tickers (${errors} errors), total: ${Object.keys(merged).length}`)

  return merged
}

/**
 * Warm cache from disk on startup.
 */
export function warmSparklinesCache(): boolean {
  const disk = readJsonFile<DiskData>(DISK_FILE)
  if (disk?.data && Object.keys(disk.data).length > 0) {
    cache.set(CACHE_KEY, disk.data, CACHE_TTL)
    return true
  }
  return false
}

/**
 * Check if sparklines data is stale (> 2h old).
 */
export function isSparklinesStale(): boolean {
  return !cache.get<SparklineMap>(CACHE_KEY)
}

export { router as sparklinesRoutes }
