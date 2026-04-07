import { Router } from 'express'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { logger } from '../logger.js'

export interface CompanyProfile {
  description: string
  founded: number
  headquarters: string
  employees: number
  segment: string
  riUrl: string
}

// ─── Load profiles once on startup ────────────────────────

let profiles: Record<string, CompanyProfile> = {}

try {
  const raw = readFileSync(join(__dirname, '../../data/company-profiles.json'), 'utf-8')
  profiles = JSON.parse(raw) as Record<string, CompanyProfile>
  logger.info(`[company-profiles] Loaded ${Object.keys(profiles).length} company profiles`)
} catch (err) {
  logger.warn({ err }, '[company-profiles] Failed to load profiles, continuing without')
}

// ─── Routes ──────────────────────────────────────────────

export const companyProfilesRoutes = Router()

// GET /v1/companies/:ticker/profile
companyProfilesRoutes.get('/:ticker/profile', (req, res) => {
  const ticker = req.params['ticker']?.toUpperCase()
  if (!ticker) {
    return res.status(400).json({ error: 'ticker is required' })
  }

  const profile = profiles[ticker] ?? null
  res.json({ data: profile })
})
