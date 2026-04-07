// ─── Companies Metadata Route ────────────────────────────────
// Serves company name, sector, subsector from companies.json.
// Data sourced from CVM cadastro + brapi summaryProfile (no scraping).

import { Router } from 'express'
import type { Request, Response } from 'express'
import { cache } from '../cache/index.js'
import { config } from '../config.js'
import type { CompanyMetadata } from '../types.js'
import { readJsonFile } from '../persistence/index.js'

const router = Router()

const CACHE_KEY = 'companies:all'

interface CompaniesFile {
  version: number
  scrapedAt: string
  count: number
  companies: Record<string, CompanyMetadata>
}

function loadCompaniesFromDisk(): CompaniesFile | null {
  return readJsonFile<CompaniesFile>('companies.json')
}

function getCompaniesData(): Record<string, CompanyMetadata> | null {
  // Try memory cache first (including stale for SWR)
  const cached = cache.get<Record<string, CompanyMetadata>>(CACHE_KEY)
  if (cached) return cached

  // Try stale cache (SWR pattern — serve stale while background refresh runs)
  const stale = cache.getStale<Record<string, CompanyMetadata>>(CACHE_KEY)
  if (stale) return stale

  // Fall back to disk
  const file = loadCompaniesFromDisk()
  if (file?.companies) {
    cache.set(CACHE_KEY, file.companies, config.cache.companies)
    return file.companies
  }

  return null
}

// GET /v1/companies — all companies
router.get('/', (_req: Request, res: Response) => {
  const companies = getCompaniesData()

  if (!companies) {
    return res.json({
      data: [],
      count: 0,
      scrapedAt: null,
      message: 'No company data available yet.',
    })
  }

  const data = Object.values(companies)

  res.json({
    data,
    count: data.length,
    scrapedAt: loadCompaniesFromDisk()?.scrapedAt ?? null,
  })
})

// GET /v1/companies/:ticker — single company
router.get('/:ticker', (req: Request, res: Response) => {
  const ticker = (req.params['ticker'] as string).toUpperCase()
  const companies = getCompaniesData()
  const company = companies?.[ticker] ?? null

  res.json({ data: company })
})

export { router as companiesRoutes }
