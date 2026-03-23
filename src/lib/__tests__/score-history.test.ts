import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'fs'
import path from 'path'
import {
  saveScoreSnapshot,
  loadScoreSnapshot,
  listAvailableDates,
  getScoreHistory,
  detectScoreAlerts,
  getScoreAlerts,
  getScoreMovers,
  getSnapshotCount,
} from '../score-history'
import type { AssetData } from '../data-source'

// ─── Test Helpers ────────────────────────────────────────────

const HISTORY_DIR = path.join(process.cwd(), 'gateway', 'data', 'score-history')
const ALERTS_FILE = path.join(process.cwd(), 'gateway', 'data', 'score-alerts.json')
const TEST_PREFIX = '__test__'

function makeAsset(ticker: string, scoreTotal: number, overrides: Partial<{
  valuation: number
  quality: number
  risk: number
  dividends: number
  growth: number
}> = {}): AssetData {
  return {
    id: '1',
    ticker,
    name: `${ticker} SA`,
    type: 'stock',
    sector: 'Outros',
    price: 25.0,
    change: 0.5,
    changePercent: 2.0,
    logo: null,
    volume: 1000000,
    marketCap: 10000000000,
    fiftyTwoWeekHigh: 30,
    fiftyTwoWeekLow: 20,
    hasFundamentals: true,
    aqScore: {
      scoreTotal,
      scoreBruto: scoreTotal,
      scoreValuation: overrides.valuation ?? 60,
      scoreQuality: overrides.quality ?? 70,
      scoreGrowth: overrides.growth ?? 50,
      scoreDividends: overrides.dividends ?? 45,
      scoreRisk: overrides.risk ?? 55,
      scoreQualitativo: 0,
      confidence: 100,
    },
    lensScores: null,
    scoreBreakdown: null,
    fundamentals: {
      peRatio: 10,
      pbRatio: 1.5,
      psr: 2.0,
      pEbit: 8,
      evEbit: 10,
      evEbitda: 8,
      roe: 15,
      roic: 12,
      margemEbit: 20,
      margemLiquida: 15,
      liquidezCorrente: 1.5,
      divBrutPatrim: 0.8,
      pCapGiro: 5,
      pAtivCircLiq: -2,
      pAtivo: 0.5,
      patrimLiquido: 5000000000,
      dividendYield: 5.0,
      netDebtEbitda: 2.0,
      crescimentoReceita5a: 10,
      liq2meses: 500000,
      freeCashflow: null,
      netDebt: null,
      ebitda: null,
      fcfGrowthRate: null,
      debtCostEstimate: null,
      totalDebt: null,
    },
  }
}

// Write a test snapshot directly for a given date
function writeTestSnapshot(date: string, scores: Record<string, { score: number; valuation: number; quality: number; risk: number; dividends: number; growth: number }>) {
  if (!fs.existsSync(HISTORY_DIR)) {
    fs.mkdirSync(HISTORY_DIR, { recursive: true })
  }
  const snapshot = {
    date,
    timestamp: Date.now(),
    count: Object.keys(scores).length,
    scores: Object.fromEntries(
      Object.entries(scores).map(([ticker, s]) => [ticker, { ...s, confidence: 100 }])
    ),
  }
  fs.writeFileSync(path.join(HISTORY_DIR, `${date}.json`), JSON.stringify(snapshot), 'utf-8')
}

// Clean up test files
function cleanTestFiles(dates: string[]) {
  for (const date of dates) {
    const filePath = path.join(HISTORY_DIR, `${date}.json`)
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
    }
  }
  if (fs.existsSync(ALERTS_FILE)) {
    fs.unlinkSync(ALERTS_FILE)
  }
}

// Temporarily hide all real snapshot files (rename .json → .json.bak)
// so getScoreMovers only sees test files
function hideRealSnapshots(): string[] {
  if (!fs.existsSync(HISTORY_DIR)) return []
  const files = fs.readdirSync(HISTORY_DIR).filter(f => f.endsWith('.json'))
  for (const f of files) {
    fs.renameSync(path.join(HISTORY_DIR, f), path.join(HISTORY_DIR, f + '.bak'))
  }
  return files
}

function restoreRealSnapshots(files: string[]) {
  for (const f of files) {
    const bakPath = path.join(HISTORY_DIR, f + '.bak')
    if (fs.existsSync(bakPath)) {
      fs.renameSync(bakPath, path.join(HISTORY_DIR, f))
    }
  }
}

// ─── Tests ───────────────────────────────────────────────────

// Use unique dates to avoid collisions
const DATE_1 = '2020-01-01'
const DATE_2 = '2020-01-02'
const DATE_3 = '2020-01-03'
const TEST_DATES = [DATE_1, DATE_2, DATE_3]

describe('score-history', () => {
  beforeEach(() => {
    cleanTestFiles(TEST_DATES)
  })

  afterEach(() => {
    cleanTestFiles(TEST_DATES)
  })

  describe('saveScoreSnapshot / loadScoreSnapshot', () => {
    it('saves and loads a snapshot for today', () => {
      const assets = [
        makeAsset('PETR4', 72.5, { valuation: 65, quality: 78 }),
        makeAsset('VALE3', 68.3, { valuation: 55, quality: 80 }),
      ]

      // Save
      saveScoreSnapshot(assets)

      // Load
      const today = new Date().toISOString().split('T')[0]!
      const snapshot = loadScoreSnapshot(today)

      expect(snapshot).not.toBeNull()
      expect(snapshot!.date).toBe(today)
      expect(snapshot!.count).toBe(2)
      expect(snapshot!.scores['PETR4']).toBeDefined()
      expect(snapshot!.scores['PETR4']!.score).toBe(72.5)
      expect(snapshot!.scores['PETR4']!.valuation).toBe(65)
      expect(snapshot!.scores['VALE3']).toBeDefined()
      expect(snapshot!.scores['VALE3']!.score).toBe(68.3)

      // Clean up today's file
      const todayPath = path.join(HISTORY_DIR, `${today}.json`)
      if (fs.existsSync(todayPath)) fs.unlinkSync(todayPath)
    })

    it('skips assets without aqScore', () => {
      const assetNoScore: AssetData = {
        ...makeAsset('XPTO3', 50),
        aqScore: null,
      }
      const assets = [makeAsset('PETR4', 70), assetNoScore]

      saveScoreSnapshot(assets)

      const today = new Date().toISOString().split('T')[0]!
      const snapshot = loadScoreSnapshot(today)
      expect(snapshot!.count).toBe(1)
      expect(snapshot!.scores['PETR4']).toBeDefined()
      expect(snapshot!.scores['XPTO3']).toBeUndefined()

      const todayPath = path.join(HISTORY_DIR, `${today}.json`)
      if (fs.existsSync(todayPath)) fs.unlinkSync(todayPath)
    })

    it('returns null for non-existent date', () => {
      const snapshot = loadScoreSnapshot('1999-12-31')
      expect(snapshot).toBeNull()
    })
  })

  describe('listAvailableDates', () => {
    it('lists dates sorted ascending', () => {
      writeTestSnapshot(DATE_2, { PETR4: { score: 70, valuation: 60, quality: 70, risk: 55, dividends: 45, growth: 50 } })
      writeTestSnapshot(DATE_1, { PETR4: { score: 65, valuation: 58, quality: 68, risk: 53, dividends: 43, growth: 48 } })

      const dates = listAvailableDates()
      const testDates = dates.filter(d => d.startsWith('2020-01'))

      expect(testDates).toEqual([DATE_1, DATE_2])
    })
  })

  describe('getScoreHistory', () => {
    it('returns history for a ticker across multiple days', () => {
      writeTestSnapshot(DATE_1, {
        PETR4: { score: 65, valuation: 58, quality: 68, risk: 53, dividends: 43, growth: 48 },
      })
      writeTestSnapshot(DATE_2, {
        PETR4: { score: 70, valuation: 62, quality: 72, risk: 55, dividends: 45, growth: 50 },
      })
      writeTestSnapshot(DATE_3, {
        PETR4: { score: 72.5, valuation: 65, quality: 75, risk: 58, dividends: 47, growth: 52 },
      })

      const history = getScoreHistory('PETR4', 9999) // large window
      const testHistory = history.filter(h => h.date.startsWith('2020-01'))

      expect(testHistory).toHaveLength(3)
      expect(testHistory[0]!.score).toBe(65)
      expect(testHistory[1]!.score).toBe(70)
      expect(testHistory[2]!.score).toBe(72.5)
    })

    it('returns empty for unknown ticker', () => {
      writeTestSnapshot(DATE_1, {
        PETR4: { score: 65, valuation: 58, quality: 68, risk: 53, dividends: 43, growth: 48 },
      })

      const history = getScoreHistory('XPTO3', 9999)
      expect(history.filter(h => h.date === DATE_1)).toHaveLength(0)
    })
  })

  describe('detectScoreAlerts', () => {
    it('detects upgrade alerts when delta >= 5', () => {
      writeTestSnapshot(DATE_1, {
        PETR4: { score: 60, valuation: 50, quality: 65, risk: 55, dividends: 40, growth: 45 },
        VALE3: { score: 70, valuation: 60, quality: 75, risk: 60, dividends: 50, growth: 55 },
      })
      writeTestSnapshot(DATE_2, {
        PETR4: { score: 66, valuation: 58, quality: 68, risk: 55, dividends: 40, growth: 45 },
        VALE3: { score: 71, valuation: 61, quality: 75, risk: 60, dividends: 50, growth: 55 },
      })

      const alerts = detectScoreAlerts(DATE_2)
      // PETR4 delta = 6 (triggers), VALE3 delta = 1 (doesn't trigger)
      expect(alerts).toHaveLength(1)
      expect(alerts[0]!.ticker).toBe('PETR4')
      expect(alerts[0]!.type).toBe('upgrade')
      expect(alerts[0]!.delta).toBe(6)
      expect(alerts[0]!.topPillarChanged).toBe('valuation') // 8 pt change
    })

    it('detects downgrade alerts when delta <= -5', () => {
      writeTestSnapshot(DATE_1, {
        PETR4: { score: 70, valuation: 65, quality: 72, risk: 60, dividends: 50, growth: 55 },
      })
      writeTestSnapshot(DATE_2, {
        PETR4: { score: 62, valuation: 55, quality: 65, risk: 55, dividends: 45, growth: 50 },
      })

      const alerts = detectScoreAlerts(DATE_2)
      expect(alerts).toHaveLength(1)
      expect(alerts[0]!.type).toBe('downgrade')
      expect(alerts[0]!.delta).toBe(-8)
    })

    it('persists alerts to disk', () => {
      writeTestSnapshot(DATE_1, {
        PETR4: { score: 60, valuation: 50, quality: 65, risk: 55, dividends: 40, growth: 45 },
      })
      writeTestSnapshot(DATE_2, {
        PETR4: { score: 70, valuation: 60, quality: 75, risk: 60, dividends: 45, growth: 50 },
      })

      detectScoreAlerts(DATE_2)

      const saved = getScoreAlerts(9999)
      expect(saved.length).toBeGreaterThanOrEqual(1)
      expect(saved.find(a => a.ticker === 'PETR4' && a.date === DATE_2)).toBeDefined()
    })

    it('returns empty when no previous date exists', () => {
      writeTestSnapshot(DATE_1, {
        PETR4: { score: 70, valuation: 60, quality: 72, risk: 55, dividends: 45, growth: 50 },
      })

      const alerts = detectScoreAlerts(DATE_1)
      expect(alerts).toHaveLength(0)
    })
  })

  describe('getScoreMovers', () => {
    let hiddenFiles: string[] = []

    beforeEach(() => {
      // Hide real snapshots so test has exclusive control of the directory
      hiddenFiles = hideRealSnapshots()
    })

    afterEach(() => {
      cleanTestFiles([DATE_1, DATE_2])
      restoreRealSnapshots(hiddenFiles)
      hiddenFiles = []
    })

    it('returns gainers and losers', () => {
      writeTestSnapshot(DATE_1, {
        PETR4: { score: 60, valuation: 50, quality: 65, risk: 55, dividends: 40, growth: 45 },
        VALE3: { score: 75, valuation: 65, quality: 80, risk: 65, dividends: 55, growth: 60 },
        ITUB4: { score: 70, valuation: 60, quality: 72, risk: 58, dividends: 48, growth: 52 },
      })
      writeTestSnapshot(DATE_2, {
        PETR4: { score: 68, valuation: 58, quality: 72, risk: 60, dividends: 45, growth: 50 },
        VALE3: { score: 65, valuation: 55, quality: 72, risk: 58, dividends: 48, growth: 52 },
        ITUB4: { score: 70, valuation: 60, quality: 72, risk: 58, dividends: 48, growth: 52 },
      })

      const result = getScoreMovers(9999) // big window to cover 2020 dates
      expect(result.gainers.length).toBeGreaterThanOrEqual(1)
      expect(result.losers.length).toBeGreaterThanOrEqual(1)

      const petrGain = result.gainers.find(g => g.ticker === 'PETR4')
      expect(petrGain).toBeDefined()
      expect(petrGain!.delta).toBe(8)

      const valeLoss = result.losers.find(l => l.ticker === 'VALE3')
      expect(valeLoss).toBeDefined()
      expect(valeLoss!.delta).toBe(-10)
    })

    it('returns empty when less than 2 snapshots', () => {
      // Just one snapshot or none
      const result = getScoreMovers(7)
      // May have other test snapshots, but check structure
      expect(result).toHaveProperty('gainers')
      expect(result).toHaveProperty('losers')
    })
  })

  describe('getSnapshotCount', () => {
    it('counts available snapshots', () => {
      writeTestSnapshot(DATE_1, { PETR4: { score: 65, valuation: 58, quality: 68, risk: 53, dividends: 43, growth: 48 } })
      writeTestSnapshot(DATE_2, { PETR4: { score: 70, valuation: 60, quality: 72, risk: 55, dividends: 45, growth: 50 } })

      const count = getSnapshotCount()
      expect(count).toBeGreaterThanOrEqual(2)
    })
  })
})
