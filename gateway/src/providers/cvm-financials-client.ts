// ─── CVM Financials Client ──────────────────────────────────────
// Downloads and parses financial statements from CVM (Comissao de Valores Mobiliarios).
// Official, structured data from dados.cvm.gov.br.
//
// Data flow:
//   1. Download cadastro (cad_cia_aberta.csv) → CNPJ + company name registry
//   2. Download DFP ZIPs (annual filings) → extract CSVs → parse financial rows
//   3. Aggregate by company (CD_CVM) + year → financial statements
//   4. Match ticker → CNPJ via name similarity with known tickers
//   5. Calculate indicators (P/L, P/VP, ROE, etc.) using market data from brapi
//   6. Return FundamentalData-compatible array
//
// Restrições:
//   - NÃO alterar o motor IQ Score (aq-score.ts)
//   - CVM é fonte primária; brapi modules preenche gaps
//   - CSV parsing via split/regex (sem dependências pesadas)
//   - TypeScript strict mode

import AdmZip from 'adm-zip'
import { readJsonFile, writeJsonFile } from '../persistence/index.js'
import { logger } from '../logger.js'
import type { FundamentalData } from '../types.js'

// ─── Types ──────────────────────────────────────────────────────

/** Raw row from a CVM financial CSV (BPA, BPP, DRE, DFC) */
export interface CvmFinancialRow {
  cnpj: string
  companyName: string
  cdCvm: string
  dtRefer: string       // YYYY-MM-DD
  dtFimExerc: string    // YYYY-MM-DD
  ordemExerc: string    // "ÚLTIMO" or "PENÚLTIMO"
  cdConta: string       // e.g., "1", "1.01", "3.05"
  dsConta: string       // e.g., "Ativo Total"
  vlConta: number       // value normalized to thousands of BRL (R$ mil)
  isConsolidated: boolean
}

/** Company registration from CVM cadastro */
export interface CvmCompanyRegistration {
  cnpj: string
  denomCia: string        // Legal name
  denomComercial: string  // Trade name
  cdCvm: string
  sitReg: string          // "ATIVO" or "CANCELADO"
  tpMerc: string          // "BOLSA", "BALCÃO", etc.
  categReg: string        // "A" (completo) ou "B" (simplificado)
  setorAtiv: string       // Setor de atividade CVM
}

/** Extracted key financial figures for one company-year */
export interface CvmStatementData {
  ativoTotal: number | null
  ativoCirculante: number | null
  caixaEquivalentes: number | null
  contasAReceber: number | null       // 1.01.03 ou 1.01.02
  estoques: number | null             // 1.01.04
  passivoCirculante: number | null
  fornecedores: number | null         // 2.01.02
  patrimonioLiquido: number | null
  capitalSocial: number | null        // 2.03.01
  emprestimosCp: number | null
  emprestimosLp: number | null
  receitaLiquida: number | null
  ebit: number | null
  resultadoFinanceiro: number | null  // 3.06 — negativo = despesa financeira líquida
  lucroLiquido: number | null
  depreciation: number | null
  fco: number | null                  // 6.01 — Fluxo de Caixa Operacional real
  capexImobilizado: number | null     // 6.02.01 — negativo no DFC
  capexIntangivel: number | null      // 6.02.02 — negativo no DFC
}

/** Company financial data across years */
export interface CvmCompanyData {
  cnpj: string
  cdCvm: string
  companyName: string
  statements: Record<string, CvmStatementData>  // keyed by year (YYYY)
}

/** Ticker → CNPJ mapping entry (ticker-keyed for direct lookup) */
export interface TickerMappingEntry {
  cnpj: string
  cdCvm: string
  denomSocial: string
  matchMethod: 'exact' | 'contains' | 'fuzzy' | 'ticker-variant' | 'manual'
}

/** Persisted mapping file */
export interface CnpjTickerMapFile {
  version: number
  updatedAt: string
  count: number
  mappings: Record<string, TickerMappingEntry>  // keyed by ticker (e.g., "PETR4")
}

/** Persisted CVM data file */
interface CvmDataFile {
  version: number
  updatedAt: string
  yearsAvailable: number[]
  companyCount: number
  companies: Record<string, CvmCompanyData>  // keyed by cdCvm
}

/** Market data needed for indicator calculations */
export interface MarketQuote {
  ticker: string
  price: number
  marketCap: number
}

// ─── Constants ──────────────────────────────────────────────────

const CVM_BASE_URL = 'https://dados.cvm.gov.br/dados/CIA_ABERTA'
export const CADASTRO_URL = `${CVM_BASE_URL}/CAD/DADOS/cad_cia_aberta.csv`
const DFP_BASE_URL = `${CVM_BASE_URL}/DOC/DFP/DADOS`
const ITR_BASE_URL = `${CVM_BASE_URL}/DOC/ITR/DADOS`

const DOWNLOAD_TIMEOUT = 60_000  // 60s for large ZIP files
const CVM_DATA_FILE = 'cvm-data.json'
const CNPJ_TICKER_MAP_FILE = 'cnpj-ticker-map.json'

// Max staleness before re-download (quarterly data: 120 days)
const MAX_AGE_DAYS = 120

// Key account codes from CVM financial statements
const ACCOUNTS = {
  // BPA (Balance Sheet - Assets)
  ATIVO_TOTAL: '1',
  ATIVO_CIRCULANTE: '1.01',
  CAIXA_EQUIVALENTES: '1.01.01',
  // BPP (Balance Sheet - Liabilities)
  PASSIVO_CIRCULANTE: '2.01',
  EMPRESTIMOS_CP: '2.01.04',
  EMPRESTIMOS_LP: '2.02.01',
  PATRIMONIO_LIQUIDO: '2.03',
  // Banks (IFRS) report PL in deeper codes — last entry in BPP before total
  PATRIMONIO_LIQUIDO_IFRS_2_07: '2.07',  // BBDC4, BBAS3 etc.
  PATRIMONIO_LIQUIDO_IFRS_2_08: '2.08',  // ITUB4 etc.
  // DRE (Income Statement)
  RECEITA_LIQUIDA: '3.01',
  EBIT: '3.05',
  RESULTADO_FINANCEIRO: '3.06',    // Resultado Financeiro (receitas - despesas financeiras)
  LUCRO_LIQUIDO: '3.11',
  LUCRO_LIQUIDO_ALT1: '3.09',      // Banks / financial institutions (IFRS older)
  LUCRO_LIQUIDO_ALT2: '3.11.01',   // Some holding companies
  LUCRO_LIQUIDO_ALT3: '3.07',      // Banks IFRS (Lucro Líquido do Período)
  LUCRO_LIQUIDO_ALT4: '3.99.01.01', // Lucro Básico por Ação (fallback signal)
  LUCRO_LIQUIDO_ALT5: '3.08',      // Some financial institutions
  // BPA — subcontas para working capital
  CONTAS_A_RECEBER: '1.01.03',        // Contas a Receber (padrão CPC)
  CONTAS_A_RECEBER_ALT: '1.01.02',    // Contas a Receber (formato alternativo)
  ESTOQUES: '1.01.04',                // Estoques
  ESTOQUES_ALT: '1.01.03',            // Estoques (algumas empresas usam 1.01.03)
  // BPP — subcontas
  FORNECEDORES: '2.01.02',            // Fornecedores
  CAPITAL_SOCIAL: '2.03.01',          // Capital Social Realizado
  // DFC (Cash Flow)
  DEPRECIACAO: '6.01.01.04',
  FCO: '6.01',                        // Caixa Líquido de Atividades Operacionais
  CAPEX_IMOBILIZADO: '6.02.01',       // Aquisição de Imobilizado (negativo)
  CAPEX_INTANGIVEL: '6.02.02',        // Aquisição de Intangível (negativo)
} as const

// Brazilian corporate tax rate (for ROIC approximation)
const TAX_RATE = 0.34

// ─── CSV Parser ─────────────────────────────────────────────────

/**
 * Parse CVM CSV content (semicolon-separated, ISO-8859-1 already decoded).
 * Returns raw financial rows.
 */
export function parseCvmCsv(content: string, isConsolidated: boolean): CvmFinancialRow[] {
  const lines = content.split('\n')
  if (lines.length < 2) return []

  // First line is header — find column indices
  const header = lines[0]!.split(';').map(h => h.trim().replace(/"/g, ''))
  const colIndex = (name: string) => header.indexOf(name)

  const iCnpj = colIndex('CNPJ_CIA')
  const iDenom = colIndex('DENOM_CIA')
  const iCdCvm = colIndex('CD_CVM')
  const iDtRefer = colIndex('DT_REFER')
  const iDtFim = colIndex('DT_FIM_EXERC')
  const iOrdem = colIndex('ORDEM_EXERC')
  const iCdConta = colIndex('CD_CONTA')
  const iDsConta = colIndex('DS_CONTA')
  const iVlConta = colIndex('VL_CONTA')
  const iEscalaMoeda = colIndex('ESCALA_MOEDA')

  if (iCnpj < 0 || iCdCvm < 0 || iCdConta < 0 || iVlConta < 0) {
    logger.warn({ header: header.slice(0, 10) }, 'CVM CSV missing expected columns')
    return []
  }

  const rows: CvmFinancialRow[] = []

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]!.trim()
    if (!line) continue

    const cols = line.split(';').map(c => c.trim().replace(/"/g, ''))

    // Only use "ÚLTIMO" (most recent period), not "PENÚLTIMO"
    const ordem = cols[iOrdem] ?? ''
    const ordemUpper = ordem.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    if (ordemUpper !== 'ULTIMO') continue

    const vlStr = cols[iVlConta] ?? ''
    let vlConta = parseFloat(vlStr.replace(',', '.'))
    if (isNaN(vlConta)) continue

    // Normalize to thousands (R$ mil). CVM data can be in "Mil" or "Unidade".
    // If "Unidade" (raw BRL), divide by 1000 to normalize.
    if (iEscalaMoeda >= 0) {
      const escala = (cols[iEscalaMoeda] ?? '').toUpperCase().trim()
      if (escala === 'UNIDADE') {
        vlConta = vlConta / 1000
      }
    }

    rows.push({
      cnpj: cols[iCnpj] ?? '',
      companyName: cols[iDenom] ?? '',
      cdCvm: cols[iCdCvm] ?? '',
      dtRefer: cols[iDtRefer] ?? '',
      dtFimExerc: cols[iDtFim] ?? '',
      ordemExerc: ordem,
      cdConta: cols[iCdConta] ?? '',
      dsConta: cols[iDsConta] ?? '',
      vlConta,
      isConsolidated,
    })
  }

  return rows
}

/**
 * Parse the CVM company cadastro CSV.
 * Column names in the real CVM file:
 *   CNPJ_CIA, DENOM_SOCIAL, DENOM_COMERC, CD_CVM, SIT, TP_MERC, ...
 */
export function parseCadastro(content: string): CvmCompanyRegistration[] {
  const lines = content.split('\n')
  if (lines.length < 2) return []

  const header = lines[0]!.split(';').map(h => h.trim().replace(/"/g, ''))
  const colIndex = (name: string) => header.indexOf(name)

  const iCnpj = colIndex('CNPJ_CIA')
  // CVM uses DENOM_SOCIAL / DENOM_COMERC (not DENOM_CIA / DENOM_COMERCIAL)
  let iDenom = colIndex('DENOM_SOCIAL')
  if (iDenom < 0) iDenom = colIndex('DENOM_CIA')
  let iDenomComercial = colIndex('DENOM_COMERC')
  if (iDenomComercial < 0) iDenomComercial = colIndex('DENOM_COMERCIAL')
  const iCdCvm = colIndex('CD_CVM')
  // CVM uses SIT (not SIT_REG)
  let iSitReg = colIndex('SIT')
  if (iSitReg < 0) iSitReg = colIndex('SIT_REG')
  const iTpMerc = colIndex('TP_MERC')
  const iCategReg = colIndex('CATEG_REG')
  const iSetorAtiv = colIndex('SETOR_ATIV')

  if (iCnpj < 0 || iCdCvm < 0) {
    logger.warn({ header: header.slice(0, 15) }, 'CVM cadastro CSV missing expected columns')
    return []
  }

  const companies: CvmCompanyRegistration[] = []

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]!.trim()
    if (!line) continue

    const cols = line.split(';').map(c => c.trim().replace(/"/g, ''))

    companies.push({
      cnpj: cols[iCnpj] ?? '',
      denomCia: cols[iDenom] ?? '',
      denomComercial: cols[iDenomComercial] ?? '',
      cdCvm: cols[iCdCvm] ?? '',
      sitReg: cols[iSitReg] ?? '',
      tpMerc: cols[iTpMerc] ?? '',
      categReg: iCategReg >= 0 ? (cols[iCategReg] ?? '') : '',
      setorAtiv: iSetorAtiv >= 0 ? (cols[iSetorAtiv] ?? '') : '',
    })
  }

  return companies
}

// ─── ZIP Handler ────────────────────────────────────────────────

/**
 * Download a file from URL as Buffer.
 */
async function downloadBuffer(url: string): Promise<Buffer> {
  logger.info({ url }, 'CVM downloading')
  const startMs = Date.now()

  const res = await fetch(url, {
    signal: AbortSignal.timeout(DOWNLOAD_TIMEOUT),
    headers: {
      'User-Agent': 'InvestIQ-Gateway/1.0 (dados abertos CVM)',
    },
  })

  if (!res.ok) {
    throw new Error(`CVM HTTP ${res.status} for ${url}`)
  }

  const arrayBuf = await res.arrayBuffer()
  const buffer = Buffer.from(arrayBuf)
  const elapsed = Date.now() - startMs
  logger.info({ url, sizeKB: Math.round(buffer.length / 1024), elapsed }, 'CVM download complete')

  return buffer
}

/**
 * Download and decode a CSV file (ISO-8859-1 encoding).
 */
export async function downloadCsv(url: string): Promise<string> {
  const buffer = await downloadBuffer(url)
  return new TextDecoder('iso-8859-1').decode(buffer)
}

/**
 * Extract a specific CSV from a ZIP buffer.
 * Returns decoded string content or null if not found.
 */
function extractCsvFromZip(zipBuffer: Buffer, csvNamePattern: string): string | null {
  try {
    const zip = new AdmZip(zipBuffer)
    const entries = zip.getEntries()

    // Find the matching entry
    const entry = entries.find(e => e.entryName.includes(csvNamePattern))
    if (!entry) return null

    const buffer = entry.getData()
    return new TextDecoder('iso-8859-1').decode(buffer)
  } catch (err) {
    logger.error({ err, pattern: csvNamePattern }, 'Failed to extract CSV from ZIP')
    return null
  }
}

// ─── Data Aggregation ───────────────────────────────────────────

/**
 * Aggregate financial rows into company-year statements.
 */
export function aggregateStatements(
  bpaRows: CvmFinancialRow[],
  bppRows: CvmFinancialRow[],
  dreRows: CvmFinancialRow[],
  dfcRows: CvmFinancialRow[],
): Map<string, CvmCompanyData> {
  const companies = new Map<string, CvmCompanyData>()

  // Helper: get or create company entry
  function getCompany(row: CvmFinancialRow): CvmCompanyData {
    let company = companies.get(row.cdCvm)
    if (!company) {
      company = {
        cnpj: row.cnpj,
        cdCvm: row.cdCvm,
        companyName: row.companyName,
        statements: {},
      }
      companies.set(row.cdCvm, company)
    }
    return company
  }

  // Helper: get or create statement for a year
  function getStatement(company: CvmCompanyData, year: string): CvmStatementData {
    let stmt = company.statements[year]
    if (!stmt) {
      stmt = {
        ativoTotal: null,
        ativoCirculante: null,
        caixaEquivalentes: null,
        contasAReceber: null,
        estoques: null,
        passivoCirculante: null,
        fornecedores: null,
        patrimonioLiquido: null,
        capitalSocial: null,
        emprestimosCp: null,
        emprestimosLp: null,
        receitaLiquida: null,
        ebit: null,
        resultadoFinanceiro: null,
        lucroLiquido: null,
        depreciation: null,
        fco: null,
        capexImobilizado: null,
        capexIntangivel: null,
      }
      company.statements[year] = stmt
    }
    return stmt
  }

  // Extract period key from date (YYYY-MM-DD → YYYY-MM)
  // Uses YYYY-MM to distinguish annual (YYYY-12) from quarterly (YYYY-03, YYYY-06, YYYY-09)
  function periodFromDate(dt: string): string {
    return dt.substring(0, 7)  // "2025-12" or "2025-03" etc.
  }

  // Process BPA (Assets)
  for (const row of bpaRows) {
    const company = getCompany(row)
    const stmt = getStatement(company, periodFromDate(row.dtRefer))
    if (row.cdConta === ACCOUNTS.ATIVO_TOTAL) stmt.ativoTotal = row.vlConta
    if (row.cdConta === ACCOUNTS.ATIVO_CIRCULANTE) stmt.ativoCirculante = row.vlConta
    if (row.cdConta === ACCOUNTS.CAIXA_EQUIVALENTES) stmt.caixaEquivalentes = row.vlConta
    // Contas a Receber (códigos variam entre empresas)
    if (row.cdConta === ACCOUNTS.CONTAS_A_RECEBER) stmt.contasAReceber = row.vlConta
    if (!stmt.contasAReceber && row.cdConta === ACCOUNTS.CONTAS_A_RECEBER_ALT) stmt.contasAReceber = row.vlConta
    // Estoques
    if (row.cdConta === ACCOUNTS.ESTOQUES) stmt.estoques = row.vlConta
    if (!stmt.estoques && row.cdConta === ACCOUNTS.ESTOQUES_ALT) stmt.estoques = row.vlConta
  }

  // Process BPP (Liabilities + Equity)
  for (const row of bppRows) {
    const company = getCompany(row)
    const stmt = getStatement(company, periodFromDate(row.dtRefer))
    if (row.cdConta === ACCOUNTS.PASSIVO_CIRCULANTE) stmt.passivoCirculante = row.vlConta
    if (row.cdConta === ACCOUNTS.FORNECEDORES) stmt.fornecedores = row.vlConta
    if (row.cdConta === ACCOUNTS.EMPRESTIMOS_CP) stmt.emprestimosCp = row.vlConta
    if (row.cdConta === ACCOUNTS.EMPRESTIMOS_LP) stmt.emprestimosLp = row.vlConta
    if (row.cdConta === ACCOUNTS.PATRIMONIO_LIQUIDO) stmt.patrimonioLiquido = row.vlConta
    if (row.cdConta === ACCOUNTS.CAPITAL_SOCIAL) stmt.capitalSocial = row.vlConta
    // Banks (IFRS) use deeper codes for PL (2.07 for BBDC4/BBAS3, 2.08 for ITUB4).
    // Only overwrite if the description explicitly says "Patrimônio Líquido".
    const isPLCode = row.cdConta === ACCOUNTS.PATRIMONIO_LIQUIDO_IFRS_2_07 || row.cdConta === ACCOUNTS.PATRIMONIO_LIQUIDO_IFRS_2_08
    if (isPLCode && row.dsConta.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes('patrimonio liquido')) {
      stmt.patrimonioLiquido = row.vlConta
    }
  }

  // Process DRE (Income Statement)
  for (const row of dreRows) {
    const company = getCompany(row)
    const stmt = getStatement(company, periodFromDate(row.dtRefer))
    if (row.cdConta === ACCOUNTS.RECEITA_LIQUIDA) stmt.receitaLiquida = row.vlConta
    if (row.cdConta === ACCOUNTS.EBIT) stmt.ebit = row.vlConta
    if (row.cdConta === ACCOUNTS.RESULTADO_FINANCEIRO) stmt.resultadoFinanceiro = row.vlConta
    // Primary lucroLiquido (3.11) — standard companies
    if (row.cdConta === ACCOUNTS.LUCRO_LIQUIDO) stmt.lucroLiquido = row.vlConta
    // Fallback chain for banks/financial institutions
    if (!stmt.lucroLiquido && row.cdConta === ACCOUNTS.LUCRO_LIQUIDO_ALT1) stmt.lucroLiquido = row.vlConta
    if (!stmt.lucroLiquido && row.cdConta === ACCOUNTS.LUCRO_LIQUIDO_ALT2) stmt.lucroLiquido = row.vlConta
    if (!stmt.lucroLiquido && row.cdConta === ACCOUNTS.LUCRO_LIQUIDO_ALT3) stmt.lucroLiquido = row.vlConta
    if (!stmt.lucroLiquido && row.cdConta === ACCOUNTS.LUCRO_LIQUIDO_ALT5) stmt.lucroLiquido = row.vlConta
  }

  // Second pass: for companies still missing lucroLiquido, use the deepest single-level
  // DRE account (e.g. 3.07, 3.08, 3.09, 3.11) as the bottom line
  for (const company of companies.values()) {
    for (const [year, stmt] of Object.entries(company.statements)) {
      if (stmt.lucroLiquido !== null) continue
      // Find the deepest top-level DRE entry (3.XX where XX is highest)
      let bestCode = ''
      let bestValue: number | null = null
      for (const row of dreRows) {
        if (row.cdCvm !== company.cdCvm) continue
        if (periodFromDate(row.dtRefer) !== year) continue
        // Only consider top-level DRE accounts (3.XX, not 3.XX.XX)
        const parts = row.cdConta.split('.')
        if (parts.length === 2 && parts[0] === '3') {
          if (row.cdConta > bestCode) {
            bestCode = row.cdConta
            bestValue = row.vlConta
          }
        }
      }
      if (bestValue !== null && bestCode >= '3.07') {
        stmt.lucroLiquido = bestValue
      }
    }
  }

  // Process DFC (Cash Flow)
  for (const row of dfcRows) {
    const company = getCompany(row)
    const stmt = getStatement(company, periodFromDate(row.dtRefer))
    if (row.cdConta === ACCOUNTS.DEPRECIACAO) stmt.depreciation = row.vlConta
    if (row.cdConta === ACCOUNTS.FCO) stmt.fco = row.vlConta
    if (row.cdConta === ACCOUNTS.CAPEX_IMOBILIZADO) stmt.capexImobilizado = row.vlConta
    if (row.cdConta === ACCOUNTS.CAPEX_INTANGIVEL) stmt.capexIntangivel = row.vlConta
  }

  return companies
}

// ─── CNPJ → Ticker Mapping ─────────────────────────────────────

// B3 ticker suffixes: ON=3, PN=4, PNA=5, PNB=6, UNIT=11
const TICKER_SUFFIX_PATTERN = /^([A-Z]{4})(\d{1,2}F?)$/

/**
 * Extract the base symbol from a ticker (e.g., "PETR4" → "PETR").
 */
function tickerBase(ticker: string): string {
  const m = TICKER_SUFFIX_PATTERN.exec(ticker)
  return m ? m[1]! : ticker
}

/**
 * Normalize company name for matching.
 * Removes common suffixes, punctuation, and normalizes whitespace.
 */
export function normalizeName(name: string): string {
  return name
    .toUpperCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')  // remove accents
    .replace(/\bS[\s./]*A\.?\b/g, '')      // remove S.A., S/A, SA
    .replace(/\bLTDA\.?\b/g, '')
    .replace(/\bBRASIL\b/g, '')
    .replace(/\bHOLDING\b/g, '')
    .replace(/\bPARTICIPACOES\b/g, '')
    .replace(/\bINDUSTRIA\b/g, '')
    .replace(/\bINDUSTRIAS\b/g, '')
    .replace(/\bCOMERCIO\b/g, '')
    .replace(/\bEMPREENDIMENTOS\b/g, '')
    .replace(/\bFINANCEIRA\b/g, '')
    .replace(/\bINVESTIMENTOS\b/g, '')
    .replace(/\b(DO|DA|DE|DOS|DAS|E|EM|NO|NA|NOS|NAS)\b/g, '')
    .replace(/[-.,;:'/()&"]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Levenshtein distance between two strings.
 */
function levenshtein(a: string, b: string): number {
  const m = a.length
  const n = b.length
  if (m === 0) return n
  if (n === 0) return m

  // Use single-row optimization
  let prev = Array.from({ length: n + 1 }, (_, i) => i)
  let curr = new Array<number>(n + 1)

  for (let i = 1; i <= m; i++) {
    curr[0] = i
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      curr[j] = Math.min(
        prev[j]! + 1,        // deletion
        curr[j - 1]! + 1,    // insertion
        prev[j - 1]! + cost  // substitution
      )
    }
    ;[prev, curr] = [curr, prev]
  }

  return prev[n]!
}

/**
 * Similarity ratio between two strings (0 to 1).
 */
function similarity(a: string, b: string): number {
  const maxLen = Math.max(a.length, b.length)
  if (maxLen === 0) return 1
  return 1 - levenshtein(a, b) / maxLen
}

/** Result of the mapping build process */
export interface MappingBuildResult {
  mapFile: CnpjTickerMapFile
  unmatched: Array<{ ticker: string; name: string }>
  stats: {
    total: number
    matchedByExact: number
    matchedByContains: number
    matchedByFuzzy: number
    matchedByVariant: number
    unmatchedCount: number
  }
}

/**
 * Build ticker → CNPJ mapping by matching company names.
 * Maps ALL ticker variants (ON/PN/UNIT) for matched companies.
 */
// Manual ticker→CVM overrides for companies that can't be auto-matched
// (different legal names, missing from cadastro, etc.)
const MANUAL_TICKER_OVERRIDES: Record<string, TickerMappingEntry> = {
  BPAC11: { cnpj: '30.306.294/0001-45', cdCvm: '022616', denomSocial: 'BANCO BTG PACTUAL S.A.', matchMethod: 'manual' as const },
  BPAC5:  { cnpj: '30.306.294/0001-45', cdCvm: '022616', denomSocial: 'BANCO BTG PACTUAL S.A.', matchMethod: 'manual' as const },
  BPAC3:  { cnpj: '30.306.294/0001-45', cdCvm: '022616', denomSocial: 'BANCO BTG PACTUAL S.A.', matchMethod: 'manual' as const },
}

export function buildCnpjTickerMap(
  cadastro: CvmCompanyRegistration[],
  knownTickers: Map<string, string>,  // ticker → company name (from brapi/quotes)
): MappingBuildResult {
  const mappings: Record<string, TickerMappingEntry> = {}
  let matchedByExact = 0
  let matchedByContains = 0
  let matchedByFuzzy = 0
  let matchedByVariant = 0

  // Group tickers by base symbol (PETR → [PETR3, PETR4])
  const tickerGroups = new Map<string, string[]>()
  for (const [ticker] of knownTickers) {
    const base = tickerBase(ticker)
    const group = tickerGroups.get(base) ?? []
    group.push(ticker)
    tickerGroups.set(base, group)
  }

  // Build normalized name → base symbol lookup from brapi tickers
  // Use the FIRST ticker in each group to represent the company
  const nameToBase = new Map<string, { base: string; name: string }>()
  for (const [ticker, companyName] of knownTickers) {
    const normalized = normalizeName(companyName)
    if (!normalized || normalized.length < 3) continue
    const base = tickerBase(ticker)
    // Keep the entry with most information (longest name)
    const existing = nameToBase.get(normalized)
    if (!existing || companyName.length > existing.name.length) {
      nameToBase.set(normalized, { base, name: companyName })
    }
  }

  // Filter CVM cadastro to active, listed companies
  const activeListed = cadastro.filter(c =>
    c.sitReg === 'ATIVO' &&
    (c.tpMerc.includes('BOLSA') || c.tpMerc.includes('Bolsa'))
  )

  // Track which bases have been matched to avoid duplicates
  const matchedBases = new Set<string>()

  // Helper: register all tickers for a base symbol
  function registerMatch(
    base: string,
    company: CvmCompanyRegistration,
    method: 'exact' | 'contains' | 'fuzzy',
    primaryTicker?: string,
  ) {
    if (matchedBases.has(base)) return
    matchedBases.add(base)

    const tickers = tickerGroups.get(base) ?? (primaryTicker ? [primaryTicker] : [])
    for (const ticker of tickers) {
      const isVariant = ticker !== (primaryTicker ?? tickers[0])
      mappings[ticker] = {
        cnpj: company.cnpj,
        cdCvm: company.cdCvm,
        denomSocial: company.denomCia,
        matchMethod: isVariant ? 'ticker-variant' : method,
      }
      if (isVariant) matchedByVariant++
    }
    // Count only the primary match
    if (method === 'exact') matchedByExact++
    else if (method === 'contains') matchedByContains++
    else if (method === 'fuzzy') matchedByFuzzy++
  }

  // Also build space-collapsed lookup for PASS 1b
  const nameToBaseCollapsed = new Map<string, { base: string; name: string }>()
  for (const [normalizedName, info] of nameToBase) {
    const collapsed = normalizedName.replace(/\s+/g, '')
    nameToBaseCollapsed.set(collapsed, info)
  }

  // PASS 1: Exact normalized name match
  for (const company of activeListed) {
    const names = [company.denomComercial, company.denomCia].filter(Boolean)

    for (const name of names) {
      const normalized = normalizeName(name)
      if (!normalized) continue

      // Try exact match
      const match = nameToBase.get(normalized)
      if (match && !matchedBases.has(match.base)) {
        registerMatch(match.base, company, 'exact')
        break
      }

      // Try space-collapsed exact match (ITAU UNIBANCO vs ITAUUNIBANCO)
      const collapsed = normalized.replace(/\s+/g, '')
      const collapsedMatch = nameToBaseCollapsed.get(collapsed)
      if (collapsedMatch && !matchedBases.has(collapsedMatch.base)) {
        registerMatch(collapsedMatch.base, company, 'exact')
        break
      }
    }
  }

  // PASS 2: Contains match (one name contains the other)
  for (const company of activeListed) {
    if (Object.values(mappings).some(m => m.cnpj === company.cnpj)) continue

    const names = [company.denomComercial, company.denomCia].filter(Boolean)

    for (const name of names) {
      const normalized = normalizeName(name)
      if (!normalized || normalized.length < 4) continue

      const collapsed = normalized.replace(/\s+/g, '')

      let found = false
      for (const [tickerName, info] of nameToBase) {
        if (matchedBases.has(info.base)) continue
        if (tickerName.length < 4) continue

        // Standard contains
        if (normalized.includes(tickerName) || tickerName.includes(normalized)) {
          registerMatch(info.base, company, 'contains')
          found = true
          break
        }

        // Space-collapsed contains
        const tickerCollapsed = tickerName.replace(/\s+/g, '')
        if (collapsed.includes(tickerCollapsed) || tickerCollapsed.includes(collapsed)) {
          registerMatch(info.base, company, 'contains')
          found = true
          break
        }
      }
      if (found) break
    }
  }

  // PASS 3: Fuzzy match (Levenshtein similarity >= 80%)
  for (const company of activeListed) {
    if (Object.values(mappings).some(m => m.cnpj === company.cnpj)) continue

    const names = [company.denomComercial, company.denomCia].filter(Boolean)

    for (const name of names) {
      const normalized = normalizeName(name)
      if (!normalized || normalized.length < 4) continue

      let bestMatch: { base: string; sim: number } | null = null

      for (const [tickerName, info] of nameToBase) {
        if (matchedBases.has(info.base)) continue
        if (tickerName.length < 4) continue

        const sim = similarity(normalized, tickerName)
        if (sim >= 0.8 && (!bestMatch || sim > bestMatch.sim)) {
          bestMatch = { base: info.base, sim }
        }

        // Also try first 2 significant words match
        const nWords = normalized.split(' ').filter(w => w.length > 2)
        const tWords = tickerName.split(' ').filter(w => w.length > 2)
        if (nWords.length >= 2 && tWords.length >= 2) {
          const nPrefix = nWords.slice(0, 2).join(' ')
          const tPrefix = tWords.slice(0, 2).join(' ')
          if (nPrefix === tPrefix && nPrefix.length > 5) {
            const prefixSim = 0.85  // treat prefix match as 85% similar
            if (!bestMatch || prefixSim > bestMatch.sim) {
              bestMatch = { base: info.base, sim: prefixSim }
            }
          }
        }
      }

      if (bestMatch) {
        registerMatch(bestMatch.base, company, 'fuzzy')
        break
      }
    }
  }

  // Build unmatched list
  const matchedTickerSet = new Set(Object.keys(mappings))
  const unmatched: Array<{ ticker: string; name: string }> = []
  for (const [ticker, name] of knownTickers) {
    if (!matchedTickerSet.has(ticker)) {
      unmatched.push({ ticker, name })
    }
  }

  // Merge manual overrides (highest priority — won't be overwritten by auto-match)
  for (const [ticker, entry] of Object.entries(MANUAL_TICKER_OVERRIDES)) {
    if (!mappings[ticker]) {
      mappings[ticker] = entry
    }
  }

  const mapFile: CnpjTickerMapFile = {
    version: 2,
    updatedAt: new Date().toISOString(),
    count: Object.keys(mappings).length,
    mappings,
  }

  const stats = {
    total: knownTickers.size,
    matchedByExact,
    matchedByContains,
    matchedByFuzzy,
    matchedByVariant,
    unmatchedCount: unmatched.length,
  }

  logger.info({
    matched: mapFile.count,
    exact: matchedByExact,
    contains: matchedByContains,
    fuzzy: matchedByFuzzy,
    variants: matchedByVariant,
    unmatched: unmatched.length,
    total: knownTickers.size,
  }, 'Ticker→CNPJ mapping built')

  return { mapFile, unmatched, stats }
}

// ─── Indicator Calculation ──────────────────────────────────────

/**
 * Calculate fundamental indicators from CVM financial data + market data.
 * Returns null if insufficient data.
 */
export function calculateIndicators(
  company: CvmCompanyData,
  ticker: string,
  market: MarketQuote,
): FundamentalData | null {
  // Get the most recent period's statement (YYYY-MM: annual or quarterly)
  const periods = Object.keys(company.statements).sort().reverse()
  if (periods.length === 0) return null

  const latestPeriod = periods[0]!
  const stmt = company.statements[latestPeriod]!

  // Need at minimum revenue or profit to calculate anything useful
  if (!stmt.receitaLiquida && !stmt.lucroLiquido) return null

  const price = market.price
  const marketCap = market.marketCap
  if (!price || !marketCap || marketCap <= 0) return null

  // CVM financial data is in thousands of BRL (R$ mil).
  // brapi marketCap is in full BRL. Scale CVM values to match.
  const S = 1000

  // Shares outstanding (derived)
  const shares = marketCap / price

  // ── Valuation Ratios ──
  const peRatio = stmt.lucroLiquido && stmt.lucroLiquido !== 0
    ? marketCap / (stmt.lucroLiquido * S)
    : null

  const pbRatio = stmt.patrimonioLiquido && stmt.patrimonioLiquido > 0
    ? marketCap / (stmt.patrimonioLiquido * S)
    : null

  const psr = stmt.receitaLiquida && stmt.receitaLiquida > 0
    ? marketCap / (stmt.receitaLiquida * S)
    : null

  const pEbit = stmt.ebit && stmt.ebit !== 0
    ? marketCap / (stmt.ebit * S)
    : null

  // Enterprise Value = Market Cap + Net Debt (scale CVM debt/cash to BRL)
  const grossDebt = (stmt.emprestimosCp ?? 0) + (stmt.emprestimosLp ?? 0)
  const cash = stmt.caixaEquivalentes ?? 0
  const netDebtRaw = grossDebt > 0 ? grossDebt - cash : (stmt.passivoCirculante ?? 0) - cash
  const netDebtBRL = netDebtRaw * S
  const ev = marketCap + netDebtBRL

  const evEbit = stmt.ebit && stmt.ebit !== 0 ? ev / (stmt.ebit * S) : null

  // EBITDA = EBIT + Depreciation (depreciation from DFC is usually negative, so abs)
  const ebitda = stmt.ebit != null && stmt.depreciation != null
    ? stmt.ebit + Math.abs(stmt.depreciation)
    : stmt.ebit  // fallback to EBIT if no depreciation

  const evEbitda = ebitda && ebitda !== 0 ? ev / (ebitda * S) : null

  // ── Profitability ──
  const roe = stmt.lucroLiquido != null && stmt.patrimonioLiquido && stmt.patrimonioLiquido > 0
    ? (stmt.lucroLiquido / stmt.patrimonioLiquido) * 100
    : null

  // ROIC = NOPAT / Invested Capital
  const nopat = stmt.ebit != null ? stmt.ebit * (1 - TAX_RATE) : null
  const investedCapital = stmt.patrimonioLiquido != null ? stmt.patrimonioLiquido + netDebtRaw : null
  const roic = nopat != null && investedCapital && investedCapital > 0
    ? (nopat / investedCapital) * 100
    : null

  const margemEbit = stmt.ebit != null && stmt.receitaLiquida && stmt.receitaLiquida > 0
    ? (stmt.ebit / stmt.receitaLiquida) * 100
    : null

  const margemLiquida = stmt.lucroLiquido != null && stmt.receitaLiquida && stmt.receitaLiquida > 0
    ? (stmt.lucroLiquido / stmt.receitaLiquida) * 100
    : null

  // ── Risk ──
  const liquidezCorrente = stmt.ativoCirculante != null && stmt.passivoCirculante && stmt.passivoCirculante > 0
    ? stmt.ativoCirculante / stmt.passivoCirculante
    : null

  const divBrutPatrim = stmt.patrimonioLiquido && stmt.patrimonioLiquido > 0
    ? grossDebt / stmt.patrimonioLiquido
    : null

  // Net Debt / EBITDA (both in CVM scale, no conversion needed)
  const netDebtEbitda = ebitda && ebitda !== 0 ? netDebtRaw / ebitda : null

  // ── Assets (scale CVM values by S to match marketCap in BRL) ──
  const pAtivo = stmt.ativoTotal && stmt.ativoTotal > 0
    ? marketCap / (stmt.ativoTotal * S)
    : null

  const pCapGiro = stmt.ativoCirculante != null && stmt.passivoCirculante != null
    ? marketCap / ((stmt.ativoCirculante - stmt.passivoCirculante) * S)
    : null

  const pAtivCircLiq = stmt.ativoCirculante != null && stmt.passivoCirculante != null && stmt.ativoTotal != null
    ? marketCap / ((stmt.ativoCirculante - stmt.ativoTotal + stmt.patrimonioLiquido!) * S)
    : null

  // ── Growth (CAGR) — use only annual periods (YYYY-12) for multi-year CAGR ──
  const annualPeriods = periods.filter(p => p.endsWith('-12'))
  const crescimentoReceita5a = calculateCAGR(company.statements, 'receitaLiquida', annualPeriods)
  const crescimentoLucro5a = calculateCAGR(company.statements, 'lucroLiquido', annualPeriods)

  // ── Trend Score (derivada temporal de ROE e margem) — annual only ──
  const trend = calculateTrendScore(company.statements, annualPeriods)

  return {
    ticker,
    cotacao: price,
    peRatio: round2(peRatio),
    pbRatio: round2(pbRatio),
    psr: round2(psr),
    dividendYield: null,  // DY comes from brapi, not CVM
    pAtivo: round2(pAtivo),
    pCapGiro: round2(pCapGiro),
    pEbit: round2(pEbit),
    pAtivCircLiq: round2(pAtivCircLiq),
    evEbit: round2(evEbit),
    evEbitda: round2(evEbitda),
    margemEbit: round2(margemEbit),
    margemLiquida: round2(margemLiquida),
    liquidezCorrente: round2(liquidezCorrente),
    roic: round2(roic),
    roe: round2(roe),
    liq2meses: null,  // Liquidity from volume accumulator, not CVM
    patrimLiquido: stmt.patrimonioLiquido != null ? stmt.patrimonioLiquido * S : null,
    divBrutPatrim: round2(divBrutPatrim),
    crescimentoReceita5a: round2(crescimentoReceita5a),
    netDebtEbitda: round2(netDebtEbitda),
    payout: null,  // Payout comes from brapi modules
    crescLucro5a: round2(crescimentoLucro5a),
    fiftyTwoWeekHigh: null,  // 52-week range comes from brapi
    fiftyTwoWeekLow: null,
    freeCashflow: null,  // FCF comes from brapi modules
    ebitda: ebitda != null ? ebitda * S : null,
    trendScore: trend.trendScore,
    roeMedia5a: trend.roeMedia5a,
    mrgLiquidaMedia5a: trend.mrgLiquidaMedia5a,
    // Qualitative metrics: populated by qualitative-engine, not here
    accrualsRatio: null,
    earningsQuality: null,
    fcfToNetIncome: null,
    fcfFromCvm: null,
    fcfYield: null,
    fcfGrowthRate: null,
    moatScore: null,
    moatClassification: null,
    earningsManipulationFlag: null,
    managementScore: null,
    debtSustainabilityScore: null,
    regulatoryRiskScore: null,
    marginStability: null,
    pricingPower: null,
    reinvestmentRate: null,
    interestCoverage: null,
    shortTermDebtRatio: null,
    debtCostEstimate: null,
    governanceScore: null,
    listingSegment: null,
    listingSegmentScore: null,
    freeFloatScore: null,
    cvmSanctionsScore: null,
    ceoTenureScore: null,
    buybackSignal: null,
    newsSentimentScore: null,
    catalystAlertScore: null,
    riEventVolume: null,
  }
}

function round2(v: number | null): number | null {
  if (v == null || !isFinite(v)) return null
  return Math.round(v * 100) / 100
}

/**
 * Calculate trend score (-2 to +2) based on linear regression slope of annual data.
 * Uses ROE and Margem Líquida over last 4 years.
 * Returns { trendScore, roeMedia5a, mrgLiquidaMedia5a }.
 */
function calculateTrendScore(
  statements: Record<string, CvmStatementData>,
  sortedYearsDesc: string[],
): { trendScore: number | null; roeMedia5a: number | null; mrgLiquidaMedia5a: number | null } {
  const noTrend = { trendScore: null, roeMedia5a: null, mrgLiquidaMedia5a: null }
  if (sortedYearsDesc.length < 3) return noTrend

  // Collect ROE and margin for each year (up to 5 years)
  const roes: number[] = []
  const margins: number[] = []

  for (let i = 0; i < Math.min(5, sortedYearsDesc.length); i++) {
    const year = sortedYearsDesc[i]!
    const stmt = statements[year]
    if (!stmt) continue

    if (stmt.lucroLiquido != null && stmt.patrimonioLiquido != null && stmt.patrimonioLiquido > 0) {
      roes.push((stmt.lucroLiquido / stmt.patrimonioLiquido) * 100)
    }

    if (stmt.lucroLiquido != null && stmt.receitaLiquida != null && stmt.receitaLiquida > 0) {
      margins.push((stmt.lucroLiquido / stmt.receitaLiquida) * 100)
    }
  }

  // Need at least 3 data points
  if (roes.length < 3 && margins.length < 3) return noTrend

  // Simple linear regression slope (x = index from oldest to newest)
  function linearSlope(values: number[]): number {
    const n = values.length
    if (n < 3) return 0
    // Reverse to chronological order (oldest first)
    const v = [...values].reverse()
    const xMean = (n - 1) / 2
    const yMean = v.reduce((s, y) => s + y, 0) / n
    let num = 0, den = 0
    for (let i = 0; i < n; i++) {
      num += (i - xMean) * (v[i]! - yMean)
      den += (i - xMean) * (i - xMean)
    }
    return den > 0 ? num / den : 0
  }

  let trendPts = 0
  let count = 0

  // ROE trend: slope > 2pp/year = improving, < -2pp/year = deteriorating
  if (roes.length >= 3) {
    const roeSlope = linearSlope(roes)
    if (roeSlope > 2) trendPts += 1
    else if (roeSlope > 0.5) trendPts += 0.5
    else if (roeSlope < -2) trendPts -= 1
    else if (roeSlope < -0.5) trendPts -= 0.5
    count++
  }

  // Margin trend: same thresholds
  if (margins.length >= 3) {
    const mrgSlope = linearSlope(margins)
    if (mrgSlope > 2) trendPts += 1
    else if (mrgSlope > 0.5) trendPts += 0.5
    else if (mrgSlope < -2) trendPts -= 1
    else if (mrgSlope < -0.5) trendPts -= 0.5
    count++
  }

  // Normalize to -2 to +2 range
  const rawTrend = count > 0 ? trendPts / count * 2 : 0
  const trendScore = Math.max(-2, Math.min(2, Math.round(rawTrend * 10) / 10))

  // Averages
  const roeMedia5a = roes.length > 0 ? Math.round(roes.reduce((s, v) => s + v, 0) / roes.length * 100) / 100 : null
  const mrgLiquidaMedia5a = margins.length > 0 ? Math.round(margins.reduce((s, v) => s + v, 0) / margins.length * 100) / 100 : null

  return { trendScore: trendScore || null, roeMedia5a, mrgLiquidaMedia5a }
}

/**
 * Calculate CAGR (Compound Annual Growth Rate) for a metric over available years.
 */
export function calculateCAGR(
  statements: Record<string, CvmStatementData>,
  field: keyof CvmStatementData,
  sortedYearsDesc: string[],
): number | null {
  // Need at least 2 years of data
  if (sortedYearsDesc.length < 2) return null

  const newest = statements[sortedYearsDesc[0]!]
  const oldest = statements[sortedYearsDesc[sortedYearsDesc.length - 1]!]
  if (!newest || !oldest) return null

  const newestVal = newest[field] as number | null
  const oldestVal = oldest[field] as number | null

  if (newestVal == null || oldestVal == null || oldestVal <= 0 || newestVal <= 0) return null

  const years = sortedYearsDesc.length - 1
  if (years <= 0) return null

  // CAGR = (newest / oldest) ^ (1/years) - 1
  const cagr = (Math.pow(newestVal / oldestVal, 1 / years) - 1) * 100
  return isFinite(cagr) ? cagr : null
}

// ─── Download & Parse Pipeline ──────────────────────────────────

/**
 * Download and parse one DFP year.
 * Returns financial rows from BPA, BPP, DRE, DFC CSVs.
 */
async function downloadDfpYear(year: number): Promise<{
  bpa: CvmFinancialRow[]
  bpp: CvmFinancialRow[]
  dre: CvmFinancialRow[]
  dfc: CvmFinancialRow[]
}> {
  const zipUrl = `${DFP_BASE_URL}/dfp_cia_aberta_${year}.zip`

  let zipBuffer: Buffer
  try {
    zipBuffer = await downloadBuffer(zipUrl)
  } catch (err) {
    logger.warn({ year, err }, 'Failed to download DFP ZIP')
    return { bpa: [], bpp: [], dre: [], dfc: [] }
  }

  // Extract CSVs — try consolidated first, then individual
  const csvSuffixes = [
    { type: 'bpa', conPattern: `BPA_con_${year}`, indPattern: `BPA_ind_${year}` },
    { type: 'bpp', conPattern: `BPP_con_${year}`, indPattern: `BPP_ind_${year}` },
    { type: 'dre', conPattern: `DRE_con_${year}`, indPattern: `DRE_ind_${year}` },
    { type: 'dfc', conPattern: `DFC_MI_con_${year}`, indPattern: `DFC_MI_ind_${year}` },
  ]

  const result: Record<string, CvmFinancialRow[]> = { bpa: [], bpp: [], dre: [], dfc: [] }

  for (const { type, conPattern, indPattern } of csvSuffixes) {
    // Try consolidated first
    let content = extractCsvFromZip(zipBuffer, conPattern)
    let isConsolidated = true

    if (!content) {
      // Fallback to individual
      content = extractCsvFromZip(zipBuffer, indPattern)
      isConsolidated = false
    }

    if (content) {
      const rows = parseCvmCsv(content, isConsolidated)
      result[type] = rows
      logger.info({ type, year, consolidated: isConsolidated, rows: rows.length }, 'Parsed CVM CSV')
    }
  }

  return {
    bpa: result['bpa']!,
    bpp: result['bpp']!,
    dre: result['dre']!,
    dfc: result['dfc']!,
  }
}

/**
 * Download and parse one ITR (quarterly) year.
 * Same format as DFP, different URL path and CSV name prefix.
 */
async function downloadItrYear(year: number): Promise<{
  bpa: CvmFinancialRow[]
  bpp: CvmFinancialRow[]
  dre: CvmFinancialRow[]
  dfc: CvmFinancialRow[]
}> {
  const zipUrl = `${ITR_BASE_URL}/itr_cia_aberta_${year}.zip`

  let zipBuffer: Buffer
  try {
    zipBuffer = await downloadBuffer(zipUrl)
  } catch (err) {
    logger.warn({ year, err }, 'Failed to download ITR ZIP')
    return { bpa: [], bpp: [], dre: [], dfc: [] }
  }

  // ITR CSVs have same structure as DFP but prefixed with "itr_" in the ZIP
  const csvSuffixes = [
    { type: 'bpa', conPattern: `BPA_con_${year}`, indPattern: `BPA_ind_${year}` },
    { type: 'bpp', conPattern: `BPP_con_${year}`, indPattern: `BPP_ind_${year}` },
    { type: 'dre', conPattern: `DRE_con_${year}`, indPattern: `DRE_ind_${year}` },
    { type: 'dfc', conPattern: `DFC_MI_con_${year}`, indPattern: `DFC_MI_ind_${year}` },
  ]

  const result: Record<string, CvmFinancialRow[]> = { bpa: [], bpp: [], dre: [], dfc: [] }

  for (const { type, conPattern, indPattern } of csvSuffixes) {
    let content = extractCsvFromZip(zipBuffer, conPattern)
    let isConsolidated = true

    if (!content) {
      content = extractCsvFromZip(zipBuffer, indPattern)
      isConsolidated = false
    }

    if (content) {
      const rows = parseCvmCsv(content, isConsolidated)
      result[type] = rows
      logger.info({ type, year, source: 'ITR', consolidated: isConsolidated, rows: rows.length }, 'Parsed ITR CSV')
    }
  }

  return {
    bpa: result['bpa']!,
    bpp: result['bpp']!,
    dre: result['dre']!,
    dfc: result['dfc']!,
  }
}

// ─── Persistence ────────────────────────────────────────────────

/**
 * Load persisted CVM data from disk.
 */
export function loadCvmData(): CvmDataFile | null {
  return readJsonFile<CvmDataFile>(CVM_DATA_FILE)
}

/**
 * Load persisted CNPJ→Ticker mapping from disk.
 */
export function loadCnpjTickerMap(): CnpjTickerMapFile | null {
  return readJsonFile<CnpjTickerMapFile>(CNPJ_TICKER_MAP_FILE)
}

/**
 * Check if CVM data is stale (> MAX_AGE_DAYS days old).
 */
export function isCvmStale(): boolean {
  const data = loadCvmData()
  if (!data) return true
  const age = Date.now() - new Date(data.updatedAt).getTime()
  return age > MAX_AGE_DAYS * 24 * 60 * 60 * 1000
}

// ─── Public API ─────────────────────────────────────────────────

/**
 * Full CVM data refresh pipeline:
 * 1. Download cadastro
 * 2. Download DFP ZIPs (last 5 years)
 * 3. Parse and aggregate financial data
 * 4. Build/update CNPJ→Ticker mapping
 * 5. Persist to disk
 *
 * @param knownTickers Map of ticker → company name (from brapi quotes)
 */
export async function refreshCvmData(
  knownTickers: Map<string, string>,
): Promise<CvmDataFile> {
  logger.info('Starting CVM data refresh...')
  const startMs = Date.now()

  // 1. Download cadastro
  let cadastro: CvmCompanyRegistration[] = []
  try {
    const cadastroContent = await downloadCsv(CADASTRO_URL)
    cadastro = parseCadastro(cadastroContent)
    logger.info({ companies: cadastro.length }, 'CVM cadastro parsed')
  } catch (err) {
    logger.error({ err }, 'Failed to download CVM cadastro')
  }

  // 2. Build/update CNPJ→Ticker mapping
  if (cadastro.length > 0 && knownTickers.size > 0) {
    const result = buildCnpjTickerMap(cadastro, knownTickers)
    writeJsonFile(CNPJ_TICKER_MAP_FILE, result.mapFile)
  }

  // 3. Download DFP (annual) + ITR (quarterly) ZIPs
  const currentYear = new Date().getFullYear()
  const dfpYears = Array.from({ length: 6 }, (_, i) => currentYear - i)
  const itrYears = [currentYear, currentYear - 1] // ITR: últimos 2 anos (6 trimestres)

  let allBpa: CvmFinancialRow[] = []
  let allBpp: CvmFinancialRow[] = []
  let allDre: CvmFinancialRow[] = []
  let allDfc: CvmFinancialRow[] = []

  // 3a. DFPs (anuais — 6 anos)
  for (const year of dfpYears) {
    try {
      const { bpa, bpp, dre, dfc } = await downloadDfpYear(year)
      allBpa = allBpa.concat(bpa)
      allBpp = allBpp.concat(bpp)
      allDre = allDre.concat(dre)
      allDfc = allDfc.concat(dfc)
    } catch (err) {
      logger.warn({ year, err }, 'Failed to process DFP year')
    }
  }

  // 3b. ITRs (trimestrais — últimos 2 anos)
  for (const year of itrYears) {
    try {
      const { bpa, bpp, dre, dfc } = await downloadItrYear(year)
      allBpa = allBpa.concat(bpa)
      allBpp = allBpp.concat(bpp)
      allDre = allDre.concat(dre)
      allDfc = allDfc.concat(dfc)
      logger.info({ year, bpa: bpa.length, dre: dre.length }, 'ITR year processed')
    } catch (err) {
      logger.warn({ year, err }, 'Failed to process ITR year')
    }
  }

  // 4. Aggregate into company data
  const companies = aggregateStatements(allBpa, allBpp, allDre, allDfc)

  // 5. Build persistence structure
  const yearsAvailable = [...new Set(
    [...allBpa, ...allDre].map(r => parseInt(r.dtRefer.substring(0, 4)))
  )].filter(y => !isNaN(y)).sort()

  const cvmData: CvmDataFile = {
    version: 1,
    updatedAt: new Date().toISOString(),
    yearsAvailable,
    companyCount: companies.size,
    companies: Object.fromEntries(companies),
  }

  // 6. Persist to disk
  writeJsonFile(CVM_DATA_FILE, cvmData)

  const elapsed = Date.now() - startMs
  logger.info({
    companies: companies.size,
    years: yearsAvailable,
    elapsed,
  }, 'CVM data refresh complete')

  return cvmData
}

/**
 * Get CVM fundamentals in FundamentalData-compatible format.
 * Merges CVM financial data with market data (prices from brapi cache).
 *
 * @param marketQuotes Array of current stock quotes (ticker, price, marketCap)
 * @returns Array of FundamentalData
 */
export function getCvmFundamentals(
  cvmData: CvmDataFile | null,
  tickerMap: CnpjTickerMapFile | null,
  marketQuotes: MarketQuote[],
): FundamentalData[] {
  if (!cvmData || !tickerMap) return []

  // Build CNPJ → cdCvm lookup
  const cnpjToCdCvm = new Map<string, string>()
  for (const company of Object.values(cvmData.companies)) {
    cnpjToCdCvm.set(company.cnpj, company.cdCvm)
  }

  // Build market data lookup
  const marketByTicker = new Map<string, MarketQuote>()
  for (const q of marketQuotes) {
    marketByTicker.set(q.ticker, q)
  }

  const results: FundamentalData[] = []

  // Ticker-keyed mapping: direct lookup (no reverse needed)
  for (const [ticker, entry] of Object.entries(tickerMap.mappings)) {
    const market = marketByTicker.get(ticker)
    if (!market) continue

    const cdCvm = cnpjToCdCvm.get(entry.cnpj)
    if (!cdCvm) continue

    const company = cvmData.companies[cdCvm]
    if (!company) continue

    const indicators = calculateIndicators(company, ticker, market)
    if (indicators) {
      results.push(indicators)
    }
  }

  logger.info({ calculated: results.length }, 'CVM fundamentals calculated')
  return results
}
