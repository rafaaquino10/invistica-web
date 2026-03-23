/**
 * Automated Insights Engine
 *
 * Generates deterministic insights from the current asset dataset.
 * Deduplicates, limits per-ticker count, and sorts by severity.
 */

import { createHash } from 'crypto'
import type { AssetData } from '../data-source'
import type { Insight, InsightContext, SectorStats } from './rules'
import { ALL_RULES } from './rules'

// ─── Statistical Helpers ────────────────────────────────────

function median(arr: number[]): number {
  if (arr.length === 0) return 0
  const sorted = [...arr].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[mid]! : (sorted[mid - 1]! + sorted[mid]!) / 2
}

function average(arr: number[]): number {
  if (arr.length === 0) return 0
  return arr.reduce((a, b) => a + b, 0) / arr.length
}

// ─── Sector Averages ────────────────────────────────────────

export function calculateSectorAverages(assets: AssetData[]): Record<string, SectorStats> {
  const bySetor: Record<string, AssetData[]> = {}
  for (const a of assets) {
    const sector = a.sector || 'Outros'
    if (!bySetor[sector]) bySetor[sector] = []
    bySetor[sector]!.push(a)
  }

  const result: Record<string, SectorStats> = {}
  for (const [sector, stocks] of Object.entries(bySetor)) {
    const scores = stocks
      .map(s => s.aqScore?.scoreTotal)
      .filter((s): s is number => s != null)
    const dys = stocks
      .map(s => s.fundamentals?.dividendYield)
      .filter((s): s is number => s != null && s > 0)
    const divPatrims = stocks
      .map(s => s.fundamentals?.divBrutPatrim)
      .filter((s): s is number => s != null && s > 0)

    result[sector] = {
      count: stocks.length,
      medianScore: median(scores),
      averageScore: average(scores),
      medianDY: median(dys),
      medianDivBrutPatrim: median(divPatrims),
    }
  }
  return result
}

// ─── ID Generation ──────────────────────────────────────────

function generateInsightId(insight: Partial<Insight>): string {
  const key = `${insight.type}:${insight.ticker || insight.sector || 'market'}:${new Date().toISOString().slice(0, 10)}`
  return createHash('md5').update(key).digest('hex').slice(0, 12)
}

// ─── Main Engine ────────────────────────────────────────────

export function generateInsights(assets: AssetData[]): Insight[] {
  const sectorAverages = calculateSectorAverages(assets)
  const context: InsightContext = { assets, sectorAverages }

  const allInsights: Insight[] = []
  const now = new Date().toISOString()
  const expiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

  for (const rule of ALL_RULES) {
    try {
      const partials = rule.detect(context)
      for (const p of partials) {
        allInsights.push({
          ...p,
          id: generateInsightId(p),
          createdAt: now,
          expiresAt: expiry,
          category: p.category || rule.category,
          data: p.data || {},
          actionable: p.actionable ?? false,
        } as Insight)
      }
    } catch {
      // Rule failure doesn't prevent others from running
    }
  }

  // Deduplicate: same ticker + type + day = 1 insight
  const seen = new Set<string>()
  const unique = allInsights.filter(i => {
    const key = `${i.type}:${i.ticker || i.sector || 'market'}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  // Max 3 insights per ticker per day
  const tickerCounts: Record<string, number> = {}
  const limited = unique.filter(i => {
    if (!i.ticker) return true
    tickerCounts[i.ticker] = (tickerCounts[i.ticker] || 0) + 1
    return tickerCounts[i.ticker]! <= 3
  })

  // Sort: high severity first
  const sevOrder: Record<string, number> = { high: 0, medium: 1, low: 2 }
  return limited.sort((a, b) => (sevOrder[a.severity] ?? 1) - (sevOrder[b.severity] ?? 1))
}
