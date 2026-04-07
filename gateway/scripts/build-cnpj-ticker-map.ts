#!/usr/bin/env npx tsx
// ─── Build CNPJ → Ticker Mapping Script ──────────────────────
// Standalone script to build the CNPJ-ticker mapping.
// Run: cd gateway && npx tsx scripts/build-cnpj-ticker-map.ts
//
// Strategy:
//   1. Download CVM cadastro (active listed companies)
//   2. Get ticker list + company names from local data (companies.json)
//      or brapi API as fallback
//   3. Match by name (exact → contains → fuzzy/Levenshtein)
//   4. Expand ON/PN/UNIT variants
//   5. Save mapping + unmatched report

import { writeFileSync, readFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

// Resolve paths relative to gateway root
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const GATEWAY_ROOT = resolve(__dirname, '..')
const DATA_DIR = resolve(GATEWAY_ROOT, 'data')

// ─── Import from CVM client ─────────────────────────────────

import {
  downloadCsv,
  parseCadastro,
  buildCnpjTickerMap,
  CADASTRO_URL,
  type CvmCompanyRegistration,
} from '../src/providers/cvm-financials-client.js'

// ─── Ticker name resolution ─────────────────────────────────

/**
 * Load ticker → company name mapping from best available local source.
 * Priority: companies.json > brapi API > minimal seed list
 */
function loadTickerNames(): Map<string, string> {
  const tickers = new Map<string, string>()

  // 1. Try companies.json (best source — has full names)
  const companiesPath = resolve(DATA_DIR, 'companies.json')
  if (existsSync(companiesPath)) {
    try {
      const raw = JSON.parse(readFileSync(companiesPath, 'utf-8'))
      const companies = raw?.companies ?? raw
      if (typeof companies === 'object' && companies !== null) {
        for (const [ticker, info] of Object.entries(companies)) {
          const name = (info as { name?: string }).name
          if (name && name !== ticker) {
            // Strip ON/PN/UNT suffix from company name for better matching
            const cleanName = name
              .replace(/\s+(ON|PN|PNA|PNB|UNT|UNIT)\s*$/i, '')
              .replace(/\s+(ON|PN)\s+N[12]\s*$/i, '')
              .trim()
            tickers.set(ticker, cleanName)
          }
        }
      }
      if (tickers.size > 0) {
        console.log(`  Loaded ${tickers.size} tickers from companies.json`)
        return tickers
      }
    } catch { /* ignore */ }
  }

  // 2. Try brapi API
  console.log('  companies.json not available, trying brapi API...')
  return tickers  // Will be populated by async function if needed
}

async function fetchBrapiTickers(): Promise<Map<string, string>> {
  const tickers = new Map<string, string>()
  const BRAPI_TOKEN = process.env['BRAPI_TOKEN'] ?? ''

  try {
    let page = 1
    let hasMore = true

    while (hasMore) {
      const params = new URLSearchParams({
        page: String(page),
        limit: '100',
        type: 'stock',
      })
      if (BRAPI_TOKEN) params.set('token', BRAPI_TOKEN)

      const url = `https://brapi.dev/api/quote/list?${params.toString()}`
      console.log(`  Fetching brapi page ${page}...`)

      const res = await fetch(url, {
        signal: AbortSignal.timeout(15_000),
        headers: { 'User-Agent': 'InvestIQ-BuildScript/1.0' },
      })

      if (!res.ok) {
        console.warn(`  brapi HTTP ${res.status} — stopping pagination`)
        break
      }

      const data = await res.json() as {
        stocks: Array<{ stock: string; name: string }>
        hasNextPage: boolean
      }
      if (data.stocks?.length) {
        for (const s of data.stocks) {
          // brapi name is often just the ticker — still add it
          tickers.set(s.stock, s.name || s.stock)
        }
      }

      hasMore = data.hasNextPage
      page++
      if (hasMore) await new Promise(r => setTimeout(r, 300))
    }

    console.log(`  brapi: ${tickers.size} tickers fetched`)
  } catch (err) {
    console.warn(`  brapi fetch failed: ${(err as Error).message}`)
  }

  return tickers
}

// ─── Main ────────────────────────────────────────────────────

async function main() {
  console.log('╔══════════════════════════════════════════════════╗')
  console.log('║  Build CNPJ → Ticker Mapping                    ║')
  console.log('╚══════════════════════════════════════════════════╝')
  console.log()

  // 1. Download CVM cadastro
  console.log('Step 1: Downloading CVM cadastro...')
  let cadastro: CvmCompanyRegistration[] = []
  try {
    const content = await downloadCsv(CADASTRO_URL)
    cadastro = parseCadastro(content)
    console.log(`  Parsed ${cadastro.length} companies from CVM`)
    const active = cadastro.filter(c => c.sitReg === 'ATIVO')
    const bolsa = active.filter(c => c.tpMerc.includes('BOLSA') || c.tpMerc.includes('Bolsa'))
    console.log(`  Active: ${active.length}, Listed (BOLSA): ${bolsa.length}`)
  } catch (err) {
    console.error(`  FAILED: ${(err as Error).message}`)
    process.exit(1)
  }
  console.log()

  // 2. Get ticker names
  console.log('Step 2: Loading ticker names...')
  let knownTickers = loadTickerNames()
  if (knownTickers.size === 0) {
    knownTickers = await fetchBrapiTickers()
  }

  // If brapi names are just tickers (no real names), we still need them
  // for the ticker list, but matching will rely on CVM names vs ticker base
  if (knownTickers.size === 0) {
    console.error('  No ticker data available!')
    process.exit(1)
  }
  console.log(`  Total tickers: ${knownTickers.size}`)
  console.log()

  // 3. Build mapping
  console.log('Step 3: Building CNPJ → Ticker mapping...')
  const result = buildCnpjTickerMap(cadastro, knownTickers)
  console.log()

  // 4. Print stats
  console.log('═══ Results ═══════════════════════════════════════')
  console.log(`  Total tickers:       ${result.stats.total}`)
  console.log(`  Mapped (total):      ${result.mapFile.count}`)
  console.log(`  ├─ Exact match:      ${result.stats.matchedByExact}`)
  console.log(`  ├─ Contains match:   ${result.stats.matchedByContains}`)
  console.log(`  ├─ Fuzzy match:      ${result.stats.matchedByFuzzy}`)
  console.log(`  └─ Ticker variants:  ${result.stats.matchedByVariant}`)
  console.log(`  Unmatched:           ${result.stats.unmatchedCount}`)
  console.log(`  Coverage:            ${(result.mapFile.count / result.stats.total * 100).toFixed(1)}%`)
  console.log()

  // 5. Validate blue chips
  console.log('═══ Blue Chip Validation ═══════════════════════════')
  const blueChips = ['PETR4', 'PETR3', 'VALE3', 'ITUB4', 'ITUB3', 'BBAS3', 'WEGE3', 'ABEV3', 'BBDC4', 'RENT3', 'EQTL3', 'SUZB3']
  let allBlueChipsOk = true
  for (const ticker of blueChips) {
    const entry = result.mapFile.mappings[ticker]
    if (entry) {
      console.log(`  ✓ ${ticker} → ${entry.cnpj} (${entry.denomSocial}) [${entry.matchMethod}]`)
    } else {
      console.log(`  ✗ ${ticker} — NOT MAPPED`)
      allBlueChipsOk = false
    }
  }

  // Check ON/PN pairs share CNPJ
  console.log()
  console.log('═══ ON/PN Pair Validation ═══════════════════════════')
  const pairs = [['PETR3', 'PETR4'], ['ITUB3', 'ITUB4'], ['BBDC3', 'BBDC4']]
  for (const [on, pn] of pairs) {
    const onEntry = result.mapFile.mappings[on!]
    const pnEntry = result.mapFile.mappings[pn!]
    if (onEntry && pnEntry && onEntry.cnpj === pnEntry.cnpj) {
      console.log(`  ✓ ${on}/${pn} → same CNPJ (${onEntry.cnpj})`)
    } else {
      console.log(`  ✗ ${on}/${pn} — MISMATCH or missing`)
    }
  }
  console.log()

  // 6. Save mapping
  const mapPath = resolve(DATA_DIR, 'cnpj-ticker-map.json')
  writeFileSync(mapPath, JSON.stringify(result.mapFile, null, 2), 'utf-8')
  console.log(`Saved mapping to: ${mapPath}`)

  // 7. Save unmatched
  const unmatchedPath = resolve(DATA_DIR, 'cnpj-ticker-unmatched.json')
  writeFileSync(unmatchedPath, JSON.stringify({
    updatedAt: new Date().toISOString(),
    count: result.unmatched.length,
    tickers: result.unmatched.sort((a, b) => a.ticker.localeCompare(b.ticker)),
  }, null, 2), 'utf-8')
  console.log(`Saved unmatched to: ${unmatchedPath}`)
  console.log()

  // 8. Summary
  if (result.mapFile.count >= 300 && allBlueChipsOk) {
    console.log('✓ MAPPING LOOKS GOOD')
  } else if (result.mapFile.count >= 200) {
    console.log('⚠ MAPPING PARTIALLY COMPLETE — review unmatched list')
  } else {
    console.log('✗ MAPPING INCOMPLETE — check data sources')
  }

  // Show first few unmatched
  if (result.unmatched.length > 0 && result.unmatched.length <= 50) {
    console.log()
    console.log('Unmatched tickers:')
    for (const u of result.unmatched) {
      console.log(`  ${u.ticker}: ${u.name}`)
    }
  } else if (result.unmatched.length > 50) {
    console.log()
    console.log(`First 20 unmatched tickers (of ${result.unmatched.length}):`)
    for (const u of result.unmatched.slice(0, 20)) {
      console.log(`  ${u.ticker}: ${u.name}`)
    }
  }
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
