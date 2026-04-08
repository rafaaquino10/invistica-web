// ─── InvestIQ Backend Adapter ────────────────────────────────
// Maps IQ-Cognit FastAPI responses to the AssetData format.
// Uses /tickers as base (ALL assets) + /scores/screener for IQ-Scores.

import type { AssetData } from './asset-cache'
import { investiq } from '../investiq-client'
import { safeFetch } from '../safe-fetch'

// ─── Cluster Names (synced from backend /clusters) ──────────

const CLUSTER_NAMES_FALLBACK: Record<number, string> = {
  1: 'Financeiro', 2: 'Recursos Naturais e Commodities', 3: 'Consumo e Varejo',
  4: 'Utilities e Concessões', 5: 'Saúde', 6: 'TMT',
  7: 'Bens de Capital', 8: 'Real Estate', 9: 'Educação',
}

let clusterNamesCache: Record<number, string> | null = null
let clusterNamesFetchedAt = 0
const CLUSTER_CACHE_TTL = 60 * 60 * 1000

async function getClusterNames(): Promise<Record<number, string>> {
  if (clusterNamesCache && Date.now() < clusterNamesFetchedAt + CLUSTER_CACHE_TTL) {
    return clusterNamesCache
  }
  try {
    const res = await investiq.get<{ clusters: Array<{ id: number; name: string }> }>('/clusters')
    if (res.clusters?.length > 0) {
      clusterNamesCache = Object.fromEntries(res.clusters.map(c => [c.id, c.name]))
      clusterNamesFetchedAt = Date.now()
      return clusterNamesCache
    }
  } catch { /* fallback */ }
  return CLUSTER_NAMES_FALLBACK
}

function getClusterName(id: number): string {
  return clusterNamesCache?.[id] ?? CLUSTER_NAMES_FALLBACK[id] ?? `Cluster ${id}`
}

// ─── Backend Response Interfaces ───────────────────────────────

interface ScreenerAsset {
  ticker_id: string; ticker: string; company_name: string; cluster_id: number;
  iq_score: number; rating: string; rating_label: string;
  score_quanti: number | null; score_quali: number | null; score_valuation: number | null;
  fair_value_final: number | null; safety_margin: number | null;
  dividend_yield_proj: number | null; dividend_safety: number | null;
}

interface BackendTicker {
  id: string; ticker: string; company_name: string; cluster_id: number; is_active: boolean;
}

// ─── Helper: Compute confidence from data availability ──────

function computeConfidence(hasQuanti: boolean, hasQuali: boolean, hasValuation: boolean, hasDividends: boolean): number {
  let available = 0
  if (hasQuanti) available++
  if (hasQuali) available++
  if (hasValuation) available++
  if (hasDividends) available++
  return available >= 4 ? 0.95 : available >= 3 ? 0.85 : available >= 2 ? 0.70 : 0.50
}

/**
 * Fetch ALL assets from backend and map to AssetData[].
 *
 * Strategy:
 * 1. Fetch ALL tickers from /tickers (paginated, ~384 assets)
 * 2. Fetch scored assets from /scores/screener (only scored ones)
 * 3. Merge: every ticker gets an entry, scored ones get IQ-Score
 *
 * Quotes are NOT fetched here (too many). They're enriched per-page
 * in the screener tRPC router.
 */
export async function fetchAssetsFromInvestIQ(): Promise<AssetData[]> {
  // Sync cluster names (non-blocking)
  getClusterNames().catch(() => {})

  // 1. Fetch ALL tickers (paginated)
  const allTickers: BackendTicker[] = []
  let offset = 0
  const pageSize = 200
  while (true) {
    const page = await safeFetch(
      () => investiq.get<{ tickers: BackendTicker[]; count: number }>('/tickers', {
        params: { limit: pageSize, offset },
        timeout: 15000,
      }),
      { tickers: [], count: 0 },
      `tickers:offset=${offset}`
    )
    allTickers.push(...(page.tickers ?? []))
    if ((page.tickers?.length ?? 0) < pageSize) break
    offset += pageSize
  }

  if (!allTickers.length) {
    console.warn('[adapter] Zero tickers from backend /tickers')
    return []
  }

  // 2. Fetch scored assets from screener (paginated)
  const scoredMap = new Map<string, ScreenerAsset>()
  offset = 0
  while (true) {
    const page = await safeFetch(
      () => investiq.get<{ results: ScreenerAsset[] }>('/scores/screener', {
        params: { limit: pageSize, offset },
        timeout: 15000,
      }),
      { results: [] },
      `screener:offset=${offset}`
    )
    for (const s of page.results ?? []) {
      scoredMap.set(s.ticker, s)
    }
    if ((page.results?.length ?? 0) < pageSize) break
    offset += pageSize
  }

  console.log(`[adapter] ${allTickers.length} tickers, ${scoredMap.size} scored`)

  // 3. Merge: all tickers + scores where available
  const assets: AssetData[] = allTickers.map(t => {
    const s = scoredMap.get(t.ticker)

    return {
      id: t.id,
      ticker: t.ticker,
      name: t.company_name,
      type: 'stock' as const,
      sector: getClusterName(t.cluster_id),
      price: 0, // Enriched per-page in screener tRPC router
      change: 0,
      changePercent: 0,
      logo: `https://raw.githubusercontent.com/StatusInvest/Content/master/img/company/${t.ticker}.jpg`,
      volume: null,
      marketCap: null,
      fiftyTwoWeekHigh: null,
      fiftyTwoWeekLow: null,
      hasFundamentals: !!s,
      aqScore: s ? {
        scoreTotal: s.iq_score,
        scoreBruto: s.iq_score,
        scoreValuation: s.score_valuation ?? 0,
        scoreQuality: s.score_quali ?? 0,
        scoreGrowth: s.score_quanti ?? 0,
        scoreDividends: s.dividend_safety ?? 0,
        scoreRisk: s.score_quanti ?? s.iq_score,
        scoreQualitativo: s.score_quali ?? 0,
        confidence: computeConfidence(
          s.score_quanti != null,
          s.score_quali != null,
          s.score_valuation != null,
          s.dividend_safety != null
        ),
      } : null,
      lensScores: null,
      scoreBreakdown: null,
      valuation: s ? {
        fairValueFinal: s.fair_value_final,
        fairValueDcf: null, fairValueGordon: null, fairValueMult: null,
        fairValueP25: null, fairValueP75: null,
        safetyMargin: s.safety_margin,
        upsideProb: null, lossProb: null, impliedGrowth: null,
      } : null,
      fundamentals: {
        peRatio: null, pbRatio: null, psr: null, pEbit: null,
        evEbit: null, evEbitda: null, roe: null, roic: null,
        margemEbit: null, margemLiquida: null, liquidezCorrente: null,
        divBrutPatrim: null, pCapGiro: null, pAtivCircLiq: null,
        pAtivo: null, patrimLiquido: null,
        dividendYield: s?.dividend_yield_proj ?? null,
        netDebtEbitda: null, crescimentoReceita5a: null, liq2meses: null,
        freeCashflow: null, netDebt: null, ebitda: null,
        fcfGrowthRate: null, debtCostEstimate: null, totalDebt: null,
      },
    }
  })

  return assets
}

/**
 * Fetch single asset detail from IQ-Cognit backend with FULL enrichment.
 */
export async function fetchAssetDetailFromInvestIQ(ticker: string): Promise<AssetData | null> {
  // Simplified — individual detail fetched via tRPC assets.getByTicker
  return null
}
