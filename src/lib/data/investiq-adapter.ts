// ─── Invística Backend Adapter ────────────────────────────────
// Maps Invscore FastAPI responses to the AssetData format.
// Uses /tickers as SINGLE source (now returns quotes + scores inline).

import type { AssetData } from './asset-cache'
import { investiq } from '../investiq-client'
import { safeFetch } from '../safe-fetch'
import { LOGO_BASE_URL } from '../constants'

// ─── Cluster Names ──────────────────────────────────────────

const CLUSTER_NAMES: Record<number, string> = {
  1: 'Financeiro', 2: 'Recursos Naturais e Commodities', 3: 'Consumo e Varejo',
  4: 'Utilities e Concessões', 5: 'Saúde', 6: 'TMT',
  7: 'Bens de Capital', 8: 'Real Estate', 9: 'Educação',
}

// ─── Backend Response (enriched /tickers) ───────────────────

interface EnrichedTicker {
  id: string
  ticker: string
  company_name: string
  cluster_id: number
  is_active: boolean
  // Quote enrichment (from quotes table)
  close?: number | null
  open?: number | null
  volume?: number | null
  market_cap?: number | null
  // Invscore enrichment (from iq_scores table)
  iq_score?: number | null
  rating?: string | null
  rating_label?: string | null
  score_quanti?: number | null
  score_quali?: number | null
  score_valuation?: number | null
  fair_value_final?: number | null
  safety_margin?: number | null
  dividend_yield_proj?: number | null
  dividend_safety?: number | null
}

/**
 * Fetch ALL assets from backend /tickers (now enriched with quotes + scores).
 * Single source of truth — NO N+1 queries needed.
 */
export async function fetchAssetsFromInvestIQ(): Promise<AssetData[]> {
  // Paginate through /tickers (enriched endpoint)
  const allTickers: EnrichedTicker[] = []
  let offset = 0
  const pageSize = 200

  while (true) {
    const page = await safeFetch(
      () => investiq.get<{ tickers: EnrichedTicker[]; count: number }>('/tickers', {
        params: { limit: pageSize, offset },
        timeout: 20000,
      }),
      { tickers: [], count: 0 },
      `tickers:offset=${offset}`
    )
    allTickers.push(...(page.tickers ?? []))
    if ((page.tickers?.length ?? 0) < pageSize) break
    offset += pageSize
  }

  if (!allTickers.length) {
    console.warn('[adapter] Zero tickers from backend')
    return []
  }

  console.log(`[adapter] ${allTickers.length} tickers loaded (${allTickers.filter(t => t.iq_score).length} scored)`)

  return allTickers.map(t => {
    const price = t.close ?? 0
    const open = t.open ?? price
    const change = price - open
    const changePct = open > 0 ? (change / open) * 100 : 0
    const hasScore = t.iq_score != null

    return {
      id: t.id,
      ticker: t.ticker,
      name: t.company_name,
      type: 'stock' as const,
      sector: CLUSTER_NAMES[t.cluster_id] ?? `Cluster ${t.cluster_id}`,
      price,
      change,
      changePercent: changePct,
      logo: `${LOGO_BASE_URL}/${t.ticker}.jpg`,
      volume: t.volume ?? null,
      marketCap: t.market_cap ?? null,
      fiftyTwoWeekHigh: null,
      fiftyTwoWeekLow: null,
      hasFundamentals: hasScore,
      aqScore: hasScore ? {
        scoreTotal: t.iq_score!,
        scoreBruto: t.iq_score!,
        scoreValuation: t.score_valuation ?? 0,
        scoreQuality: t.score_quali ?? 0,
        scoreGrowth: t.score_quanti ?? 0,
        scoreDividends: t.dividend_safety ?? 0,
        scoreRisk: t.score_quanti ?? t.iq_score!,
        scoreQualitativo: t.score_quali ?? 0,
        confidence: hasScore ? 0.85 : 0,
      } : null,
      lensScores: null,
      scoreBreakdown: null,
      // Store rating for Explorer columns
      rating: t.rating ?? null,
      ratingLabel: t.rating_label ?? null,
      valuation: hasScore ? {
        fairValueFinal: t.fair_value_final ?? null,
        fairValueDcf: null, fairValueGordon: null, fairValueMult: null,
        fairValueP25: null, fairValueP75: null,
        safetyMargin: t.safety_margin ?? null,
        upsideProb: null, lossProb: null, impliedGrowth: null,
      } : null,
      fundamentals: {
        peRatio: null, pbRatio: null, psr: null, pEbit: null,
        evEbit: null, evEbitda: null, roe: null, roic: null,
        margemEbit: null, margemLiquida: null, liquidezCorrente: null,
        divBrutPatrim: null, pCapGiro: null, pAtivCircLiq: null,
        pAtivo: null, patrimLiquido: null,
        dividendYield: t.dividend_yield_proj ?? null,
        netDebtEbitda: null, crescimentoReceita5a: null, liq2meses: null,
        freeCashflow: null, netDebt: null, ebitda: null,
        fcfGrowthRate: null, debtCostEstimate: null, totalDebt: null,
      },
    } as AssetData & { rating: string | null; ratingLabel: string | null }
  }) as AssetData[]
}

export async function fetchAssetDetailFromInvestIQ(ticker: string): Promise<AssetData | null> {
  return null
}
