/**
 * Cálculo de forward returns para feedback loop.
 *
 * Compara scores gravados em ScoreSnapshot com retornos reais
 * calculados a partir de cotações históricas do gateway.
 *
 * Regras:
 * - Forward returns só calculados DEPOIS de N dias passarem
 * - Se preço futuro não disponível → retornar null (nunca inventar)
 * - Spearman correlation implementada sem dependências externas
 */

import { fetchHistory } from '@/lib/gateway-client'
import { prisma, isDemoMode } from '@/lib/prisma'

// ─── Tipos ──────────────────────────────────────────────────────────

export interface ForwardReturnResult {
  ticker: string
  snapshotDate: Date
  scoreAtSnapshot: number
  classificacaoAtSnapshot: string
  price: {
    atSnapshot: number | null
    after30d: number | null
    after60d: number | null
    after90d: number | null
    after180d: number | null
  }
  returns: {
    r30d: number | null
    r60d: number | null
    r90d: number | null
    r180d: number | null
  }
  ibovReturns: {
    r30d: number | null
    r60d: number | null
    r90d: number | null
    r180d: number | null
  }
  alpha: {
    a30d: number | null
    a60d: number | null
    a90d: number | null
    a180d: number | null
  }
}

export interface FeedbackMetrics {
  period: string
  snapshotsAnalyzed: number
  forwardDays: number
  hitRate: {
    excepcional: number | null
    saudavel: number | null
    atencao: number | null
    critico: number | null
    overall: number | null
  }
  ic: {
    value: number | null
    pValue: number | null
    isSignificant: boolean
  }
  avgReturn: {
    excepcional: number | null
    saudavel: number | null
    atencao: number | null
    critico: number | null
  }
  quintileSpread: {
    q1AvgReturn: number | null
    q5AvgReturn: number | null
    spreadPositive: boolean
  }
}

// ─── Cache de preços históricos (evita N requests) ──────────────────

const priceCache = new Map<string, { prices: Array<{ date: number; close: number }>; fetchedAt: number }>()
const PRICE_CACHE_TTL = 60 * 60 * 1000 // 1 hora

async function getHistoricalPrices(
  ticker: string,
): Promise<Array<{ date: number; close: number }>> {
  const cached = priceCache.get(ticker)
  if (cached && Date.now() - cached.fetchedAt < PRICE_CACHE_TTL) {
    return cached.prices
  }

  try {
    const history = await fetchHistory(ticker, '1y', '1d')
    const prices = history.map(h => ({ date: h.date, close: h.adjustedClose || h.close }))
    priceCache.set(ticker, { prices, fetchedAt: Date.now() })
    return prices
  } catch {
    return []
  }
}

/**
 * Retorna o preço de fechamento mais próximo de uma data alvo (±5 dias úteis).
 */
function getPriceAtDate(
  prices: Array<{ date: number; close: number }>,
  targetMs: number,
  toleranceDays = 5,
): number | null {
  const toleranceMs = toleranceDays * 24 * 60 * 60 * 1000
  let best: { date: number; close: number } | null = null
  let bestDiff = Infinity

  for (const p of prices) {
    const pMs = p.date * 1000 // gateway retorna epoch em segundos
    const diff = Math.abs(pMs - targetMs)
    if (diff <= toleranceMs && diff < bestDiff) {
      best = p
      bestDiff = diff
    }
  }

  return best?.close ?? null
}

/**
 * Calcula retorno percentual entre dois preços.
 */
function calcReturn(pStart: number | null, pEnd: number | null): number | null {
  if (!pStart || !pEnd || pStart <= 0) return null
  return (pEnd - pStart) / pStart
}

// ─── IBOV como benchmark ─────────────────────────────────────────────

let ibovPricesCache: Array<{ date: number; close: number }> | null = null
let ibovCacheAt = 0

async function getIbovPrices(): Promise<Array<{ date: number; close: number }>> {
  if (ibovPricesCache && Date.now() - ibovCacheAt < PRICE_CACHE_TTL) {
    return ibovPricesCache
  }
  try {
    const history = await fetchHistory('^BVSP', '1y', '1d')
    ibovPricesCache = history.map(h => ({ date: h.date, close: h.adjustedClose || h.close }))
    ibovCacheAt = Date.now()
    return ibovPricesCache
  } catch {
    return []
  }
}

// ─── Funções Principais ──────────────────────────────────────────────

/**
 * Calcula forward returns para todos os snapshots de uma data específica.
 */
export async function calcForwardReturns(
  snapshotDate: Date,
  forwardDays = 90,
): Promise<ForwardReturnResult[]> {
  if (isDemoMode) return []

  const snapshots = await prisma.scoreSnapshot.findMany({
    where: { snapshotDate },
    orderBy: { scoreTotal: 'desc' },
    take: 200,
  })

  if (snapshots.length === 0) return []

  // Verificar se já passou tempo suficiente
  const now = Date.now()
  const snapshotMs = snapshotDate.getTime()
  if (now - snapshotMs < forwardDays * 24 * 60 * 60 * 1000) {
    return [] // Ainda não deu tempo suficiente
  }

  const ibovPrices = await getIbovPrices()
  const results: ForwardReturnResult[] = []

  for (const snap of snapshots) {
    const prices = await getHistoricalPrices(snap.ticker)
    if (prices.length === 0) continue

    const snapMs = snapshotDate.getTime()
    const priceAtSnap = snap.price ? Number(snap.price) : getPriceAtDate(prices, snapMs)

    const after30  = getPriceAtDate(prices, snapMs + 30  * 86400_000)
    const after60  = getPriceAtDate(prices, snapMs + 60  * 86400_000)
    const after90  = getPriceAtDate(prices, snapMs + 90  * 86400_000)
    const after180 = getPriceAtDate(prices, snapMs + 180 * 86400_000)

    const ibovAt30  = getPriceAtDate(ibovPrices, snapMs)
    const ibovAt30f = getPriceAtDate(ibovPrices, snapMs + 30  * 86400_000)
    const ibovAt60f = getPriceAtDate(ibovPrices, snapMs + 60  * 86400_000)
    const ibovAt90f = getPriceAtDate(ibovPrices, snapMs + 90  * 86400_000)
    const ibovAt180f= getPriceAtDate(ibovPrices, snapMs + 180 * 86400_000)

    const r30  = calcReturn(priceAtSnap, after30)
    const r60  = calcReturn(priceAtSnap, after60)
    const r90  = calcReturn(priceAtSnap, after90)
    const r180 = calcReturn(priceAtSnap, after180)

    const ibovR30  = calcReturn(ibovAt30, ibovAt30f)
    const ibovR60  = calcReturn(ibovAt30, ibovAt60f)
    const ibovR90  = calcReturn(ibovAt30, ibovAt90f)
    const ibovR180 = calcReturn(ibovAt30, ibovAt180f)

    results.push({
      ticker: snap.ticker,
      snapshotDate,
      scoreAtSnapshot: Number(snap.scoreTotal),
      classificacaoAtSnapshot: snap.classificacao,
      price: {
        atSnapshot: priceAtSnap,
        after30d: after30,
        after60d: after60,
        after90d: after90,
        after180d: after180,
      },
      returns: { r30d: r30, r60d: r60, r90d: r90, r180d: r180 },
      ibovReturns: { r30d: ibovR30, r60d: ibovR60, r90d: ibovR90, r180d: ibovR180 },
      alpha: {
        a30d:  r30  != null && ibovR30  != null ? r30  - ibovR30  : null,
        a60d:  r60  != null && ibovR60  != null ? r60  - ibovR60  : null,
        a90d:  r90  != null && ibovR90  != null ? r90  - ibovR90  : null,
        a180d: r180 != null && ibovR180 != null ? r180 - ibovR180 : null,
      },
    })
  }

  return results
}

// ─── Spearman Rank Correlation ───────────────────────────────────────

/**
 * Spearman rank correlation entre scores e retornos.
 * IC > 0.05 indica signal preditivo significativo.
 * Implementação manual sem dependências externas.
 */
export function spearmanCorrelation(
  x: number[],
  y: number[],
): { rho: number; pValue: number } {
  const n = Math.min(x.length, y.length)
  if (n < 4) return { rho: 0, pValue: 1 }

  // Calcular ranks (com empates: rank médio)
  function rankArray(arr: number[]): number[] {
    const sorted = [...arr].map((v, i) => ({ v, i })).sort((a, b) => a.v - b.v)
    const ranks = new Array<number>(arr.length)
    let i = 0
    while (i < sorted.length) {
      let j = i
      while (j < sorted.length && sorted[j]!.v === sorted[i]!.v) j++
      const avgRank = (i + j - 1) / 2 + 1
      for (let k = i; k < j; k++) ranks[sorted[k]!.i] = avgRank
      i = j
    }
    return ranks
  }

  const xSlice = x.slice(0, n)
  const ySlice = y.slice(0, n)
  const rx = rankArray(xSlice)
  const ry = rankArray(ySlice)

  // Correlação de Pearson nos ranks
  const meanRx = rx.reduce((a, b) => a + b, 0) / n
  const meanRy = ry.reduce((a, b) => a + b, 0) / n

  let cov = 0, varX = 0, varY = 0
  for (let i = 0; i < n; i++) {
    const dx = rx[i]! - meanRx
    const dy = ry[i]! - meanRy
    cov  += dx * dy
    varX += dx * dx
    varY += dy * dy
  }

  if (varX === 0 || varY === 0) return { rho: 0, pValue: 1 }

  const rho = cov / Math.sqrt(varX * varY)

  // p-value via t-distribution aproximada
  const t = rho * Math.sqrt((n - 2) / (1 - rho * rho + 1e-10))
  // Aproximação para p-value bilateral com df = n-2
  // Usando fórmula de Cornish-Fisher para grandes amostras
  const pValue = n >= 20
    ? 2 * (1 - normalCDF(Math.abs(t)))
    : Math.min(1, 2 * Math.exp(-0.717 * Math.abs(t) - 0.416 * t * t))

  return { rho: Math.round(rho * 10000) / 10000, pValue: Math.round(pValue * 10000) / 10000 }
}

function normalCDF(z: number): number {
  // Approximation of the normal CDF (Abramowitz and Stegun)
  const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741
  const a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911
  const sign = z < 0 ? -1 : 1
  const x = Math.abs(z) / Math.sqrt(2)
  const t = 1 / (1 + p * x)
  const y = 1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x)
  return 0.5 * (1 + sign * y)
}

// ─── Métricas Agregadas ───────────────────────────────────────────────

/**
 * Calcula métricas agregadas do feedback loop para um período.
 */
export async function calcFeedbackMetrics(
  startDate: Date,
  endDate: Date,
  forwardDays = 90,
): Promise<FeedbackMetrics> {
  if (isDemoMode) {
    return _emptyMetrics(startDate, endDate, forwardDays)
  }

  // Buscar todas as datas de snapshot no período
  const distinctDates = await prisma.scoreSnapshot.groupBy({
    by: ['snapshotDate'],
    where: {
      snapshotDate: { gte: startDate, lte: endDate },
    },
  })

  if (distinctDates.length === 0) {
    return _emptyMetrics(startDate, endDate, forwardDays)
  }

  // Coletar forward returns de todas as datas
  const allResults: ForwardReturnResult[] = []
  for (const { snapshotDate } of distinctDates) {
    const results = await calcForwardReturns(snapshotDate, forwardDays)
    allResults.push(...results)
  }

  if (allResults.length === 0) {
    return _emptyMetrics(startDate, endDate, forwardDays)
  }

  // Escolher horizonte de retorno baseado em forwardDays
  function getReturn(r: ForwardReturnResult): number | null {
    if (forwardDays <= 30) return r.returns.r30d
    if (forwardDays <= 60) return r.returns.r60d
    if (forwardDays <= 90) return r.returns.r90d
    return r.returns.r180d
  }
  function getAlpha(r: ForwardReturnResult): number | null {
    if (forwardDays <= 30) return r.alpha.a30d
    if (forwardDays <= 60) return r.alpha.a60d
    if (forwardDays <= 90) return r.alpha.a90d
    return r.alpha.a180d
  }

  // Hit rate: % que bateu IBOV (alpha > 0)
  function hitRateForClass(cls: string): number | null {
    const grupo = allResults.filter(r => r.classificacaoAtSnapshot === cls)
    const comAlpha = grupo.filter(r => getAlpha(r) !== null)
    if (comAlpha.length === 0) return null
    const wins = comAlpha.filter(r => (getAlpha(r) ?? 0) > 0).length
    return wins / comAlpha.length
  }

  const comAlpha = allResults.filter(r => getAlpha(r) !== null)
  const overallHitRate = comAlpha.length > 0
    ? comAlpha.filter(r => (getAlpha(r) ?? 0) > 0).length / comAlpha.length
    : null

  // IC: Spearman entre score e retorno
  const pairesValidos = allResults.filter(r => getReturn(r) !== null)
  const scores  = pairesValidos.map(r => r.scoreAtSnapshot)
  const returns = pairesValidos.map(r => getReturn(r) as number)

  let icValue: number | null = null
  let icPValue: number | null = null
  if (scores.length >= 4) {
    const { rho, pValue } = spearmanCorrelation(scores, returns)
    icValue = rho
    icPValue = pValue
  }

  // Retorno médio por classificação
  function avgReturnForClass(cls: string): number | null {
    const grupo = allResults.filter(r => r.classificacaoAtSnapshot === cls)
    const validos = grupo.map(r => getReturn(r)).filter((v): v is number => v !== null)
    return validos.length > 0 ? validos.reduce((a, b) => a + b, 0) / validos.length : null
  }

  // Quintile spread: Q1 (top 20%) vs Q5 (bottom 20%)
  const comRetorno = allResults
    .filter(r => getReturn(r) !== null)
    .sort((a, b) => b.scoreAtSnapshot - a.scoreAtSnapshot)

  const q1Size = Math.max(1, Math.floor(comRetorno.length * 0.2))
  const q5Size = Math.max(1, Math.floor(comRetorno.length * 0.2))
  const q1 = comRetorno.slice(0, q1Size)
  const q5 = comRetorno.slice(-q5Size)

  const q1Avg = q1.length > 0
    ? q1.reduce((sum, r) => sum + (getReturn(r) ?? 0), 0) / q1.length
    : null
  const q5Avg = q5.length > 0
    ? q5.reduce((sum, r) => sum + (getReturn(r) ?? 0), 0) / q5.length
    : null

  const period = `${startDate.toISOString().split('T')[0]} a ${endDate.toISOString().split('T')[0]}`

  return {
    period,
    snapshotsAnalyzed: allResults.length,
    forwardDays,
    hitRate: {
      excepcional: hitRateForClass('Excepcional'),
      saudavel:    hitRateForClass('Saudável'),
      atencao:     hitRateForClass('Atenção'),
      critico:     hitRateForClass('Crítico'),
      overall:     overallHitRate,
    },
    ic: {
      value:         icValue,
      pValue:        icPValue,
      isSignificant: icValue != null && icPValue != null && Math.abs(icValue) > 0.05 && icPValue < 0.05,
    },
    avgReturn: {
      excepcional: avgReturnForClass('Excepcional'),
      saudavel:    avgReturnForClass('Saudável'),
      atencao:     avgReturnForClass('Atenção'),
      critico:     avgReturnForClass('Crítico'),
    },
    quintileSpread: {
      q1AvgReturn:     q1Avg,
      q5AvgReturn:     q5Avg,
      spreadPositive:  q1Avg !== null && q5Avg !== null && q1Avg > q5Avg,
    },
  }
}

function _emptyMetrics(startDate: Date, endDate: Date, forwardDays: number): FeedbackMetrics {
  const period = `${startDate.toISOString().split('T')[0]} a ${endDate.toISOString().split('T')[0]}`
  return {
    period,
    snapshotsAnalyzed: 0,
    forwardDays,
    hitRate:       { excepcional: null, saudavel: null, atencao: null, critico: null, overall: null },
    ic:            { value: null, pValue: null, isSignificant: false },
    avgReturn:     { excepcional: null, saudavel: null, atencao: null, critico: null },
    quintileSpread: { q1AvgReturn: null, q5AvgReturn: null, spreadPositive: false },
  }
}
