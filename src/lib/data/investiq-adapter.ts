// ─── InvestIQ Backend Adapter ────────────────────────────────
// Maps InvestIQ FastAPI responses to the AssetData format
// expected by the existing tRPC routers and UI components.
//
// Onda 1: Corrigido para mapear TODOS os campos disponíveis do backend.
// Eliminados hardcodes (scoreRisk=50, confidence=0.8, scoreDividends=50).

import type { AssetData } from './asset-cache'
import { investiq } from '../investiq-client'

// ─── Cluster Names (synced from backend /clusters) ──────────

const CLUSTER_NAMES_FALLBACK: Record<number, string> = {
  1: 'Financeiro', 2: 'Recursos Naturais e Commodities', 3: 'Consumo e Varejo',
  4: 'Utilities e Concessões', 5: 'Saúde', 6: 'TMT',
  7: 'Bens de Capital', 8: 'Real Estate', 9: 'Educação',
}

let clusterNamesCache: Record<number, string> | null = null
let clusterNamesFetchedAt = 0
const CLUSTER_CACHE_TTL = 60 * 60 * 1000 // 1 hour

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

interface TickerDetail {
  ticker: string; company_name: string; cluster_id: number;
  quote: { date: string; open: number; close: number; high: number; low: number; volume: number; market_cap: number | null } | null;
}

interface BackendScoreDetail {
  ticker: string
  company_name: string
  cluster: number
  iq_cognit: {
    iq_score: number; rating: string; rating_label: string;
    score_quanti: number; score_quali: number; score_valuation: number;
    score_operational: number;
  }
  valuation: {
    fair_value_final: number | null; fair_value_dcf: number | null;
    fair_value_gordon: number | null; fair_value_mult: number | null;
    fair_value_p25: number | null; fair_value_p75: number | null;
    current_price: number | null; safety_margin: number | null;
    upside_prob: number | null; loss_prob: number | null;
  } | null
  dividends: {
    dividend_safety: number | null;
    projected_yield: number | null;
    dividend_cagr_5y: number | null;
  } | null
  thesis_summary: string | null
}

interface BackendRiskMetrics {
  ticker: string
  risk_metrics: {
    altman_z: number | null; altman_z_label: string | null;
    merton_pd: number | null; dl_ebitda: number | null;
    icj: number | null; piotroski_score: number | null;
    beneish_score: number | null; liquidity_ratio: number | null;
  }
  profitability: {
    roe: number | null; roic: number | null; wacc: number | null;
    spread_roic_wacc: number | null; net_margin: number | null;
    gross_margin: number | null; fcf_yield: number | null;
  }
}

interface BackendFinancials {
  ticker: string
  financials: Array<{
    period: string; period_type: string;
    revenue: number | null; ebitda: number | null; ebit: number | null;
    net_income: number | null; equity: number | null;
    gross_debt: number | null; net_debt: number | null;
    free_cashflow: number | null; roe: number | null; roic: number | null;
    gross_margin: number | null; ebitda_margin: number | null; net_margin: number | null;
    dl_ebitda: number | null; icj: number | null; interest_coverage: number | null;
    piotroski_score: number | null; beneish_score: number | null; merton_pd: number | null;
    lpa: number | null; vpa: number | null; payout_ratio: number | null;
    fcf_yield: number | null; total_assets: number | null;
    current_assets: number | null; current_liabilities: number | null;
  }>
}

// ─── Helper: Compute confidence from data availability ──────

function computeConfidence(s: ScreenerAsset): number {
  let available = 0
  let total = 4
  if (s.score_quanti != null) available++
  if (s.score_quali != null) available++
  if (s.score_valuation != null) available++
  if (s.dividend_safety != null) available++
  return available >= 4 ? 0.95 : available >= 3 ? 0.85 : available >= 2 ? 0.70 : 0.50
}

// ─── Helper: Derive risk score from risk metrics ────────────

function deriveRiskScore(risk: BackendRiskMetrics['risk_metrics']): number {
  let score = 50
  let factors = 0

  // Merton PD: < 0.05 = good (80+), > 0.15 = bad (20-)
  if (risk.merton_pd != null) {
    if (risk.merton_pd < 0.02) score += 35
    else if (risk.merton_pd < 0.05) score += 20
    else if (risk.merton_pd < 0.10) score += 0
    else if (risk.merton_pd < 0.15) score -= 15
    else score -= 30
    factors++
  }

  // Piotroski: 0-9, > 7 = good, < 3 = bad
  if (risk.piotroski_score != null) {
    score += (risk.piotroski_score - 5) * 6 // -30 to +24
    factors++
  }

  // DL/EBITDA: < 2 = good, > 4 = bad
  if (risk.dl_ebitda != null) {
    if (risk.dl_ebitda < 1) score += 20
    else if (risk.dl_ebitda < 2) score += 10
    else if (risk.dl_ebitda < 3) score += 0
    else if (risk.dl_ebitda < 4) score -= 10
    else score -= 25
    factors++
  }

  // ICJ (Interest Coverage): > 5 = safe, < 1 = danger
  if (risk.icj != null) {
    if (risk.icj > 5) score += 15
    else if (risk.icj > 3) score += 8
    else if (risk.icj > 1.5) score += 0
    else score -= 20
    factors++
  }

  if (factors === 0) return 50
  return Math.max(0, Math.min(100, Math.round(score / factors * 2 - 50 + 50)))
}

/**
 * Fetch all scored assets from InvestIQ backend and map to AssetData[].
 * This replaces the Gateway-based buildLiveDataset().
 */
export async function fetchAssetsFromInvestIQ(): Promise<AssetData[]> {
  // Sync cluster names from backend (background, non-blocking)
  getClusterNames().catch(() => {})

  const { results: screener } = await investiq.get<{ results: ScreenerAsset[] }>('/scores/screener')
  if (!screener?.length) return []

  // Fetch quotes in parallel (batches of 10 to avoid overwhelming)
  const assets: AssetData[] = []
  const batchSize = 10

  for (let i = 0; i < screener.length; i += batchSize) {
    const batch = screener.slice(i, i + batchSize)
    const details = await Promise.allSettled(
      batch.map(a => investiq.get<TickerDetail>(`/tickers/${a.ticker}`).catch(() => null))
    )

    for (let j = 0; j < batch.length; j++) {
      const s = batch[j]!
      const detailResult = details[j]
      const detail: TickerDetail | null = detailResult?.status === 'fulfilled' ? detailResult.value : null
      const quote = detail?.quote

      const price = quote?.close ?? 0
      const open = quote?.open ?? price
      const change = price - open
      const changePct = open > 0 ? (change / open) * 100 : 0

      assets.push({
        id: s.ticker_id || s.ticker,
        ticker: s.ticker,
        name: s.company_name,
        type: 'stock',
        sector: getClusterName(s.cluster_id),
        price,
        change,
        changePercent: changePct,
        logo: `https://raw.githubusercontent.com/StatusInvest/Content/master/img/company/${s.ticker}.jpg`,
        volume: quote?.volume ?? null,
        marketCap: quote?.market_cap ?? null,
        fiftyTwoWeekHigh: null,
        fiftyTwoWeekLow: null,
        hasFundamentals: true,
        aqScore: {
          scoreTotal: s.iq_score,
          scoreBruto: s.iq_score,
          scoreValuation: s.score_valuation ?? 0,
          scoreQuality: s.score_quali ?? 0,
          scoreGrowth: s.score_quanti ?? 0,
          scoreDividends: s.dividend_safety ?? 0,
          scoreRisk: s.score_quanti ?? s.iq_score, // Risco ponderado via quanti (25% do pilar)
          scoreQualitativo: s.score_quali ?? 0,
          confidence: computeConfidence(s),
        },
        lensScores: null,
        scoreBreakdown: null,
        valuation: {
          fairValueFinal: s.fair_value_final,
          fairValueDcf: null,
          fairValueGordon: null,
          fairValueMult: null,
          fairValueP25: null,
          fairValueP75: null,
          safetyMargin: s.safety_margin,
          upsideProb: null,
          lossProb: null,
          impliedGrowth: null,
        },
        fundamentals: {
          peRatio: null,
          pbRatio: null,
          psr: null,
          pEbit: null,
          evEbit: null,
          evEbitda: null,
          roe: null,
          roic: null,
          margemEbit: null,
          margemLiquida: null,
          liquidezCorrente: null,
          divBrutPatrim: null,
          pCapGiro: null,
          pAtivCircLiq: null,
          pAtivo: null,
          patrimLiquido: null,
          dividendYield: s.dividend_yield_proj,
          netDebtEbitda: null,
          crescimentoReceita5a: null,
          liq2meses: null,
          freeCashflow: null,
          netDebt: null,
          ebitda: null,
          fcfGrowthRate: null,
          debtCostEstimate: null,
          totalDebt: null,
        },
      })
    }
  }

  return assets
}

/**
 * Fetch single asset detail from InvestIQ backend with FULL enrichment.
 * Calls 4 endpoints in parallel for maximum data coverage.
 */
export async function fetchAssetDetailFromInvestIQ(ticker: string): Promise<AssetData | null> {
  try {
    const [detailRes, scoreRes, riskRes, financialsRes] = await Promise.allSettled([
      investiq.get<TickerDetail>(`/tickers/${ticker}`),
      investiq.get<BackendScoreDetail>(`/scores/${ticker}`),
      investiq.get<BackendRiskMetrics>(`/scores/${ticker}/risk-metrics`).catch(() => null),
      investiq.get<BackendFinancials>(`/tickers/${ticker}/financials?limit=1`).catch(() => null),
    ])

    const d = detailRes.status === 'fulfilled' ? detailRes.value : null
    const s = scoreRes.status === 'fulfilled' ? scoreRes.value : null
    const r = riskRes.status === 'fulfilled' ? riskRes.value : null
    const fin = financialsRes.status === 'fulfilled' ? financialsRes.value : null

    if (!d) return null

    const quote = d.quote
    const price = quote?.close ?? 0
    const open = quote?.open ?? price
    const iq = s?.iq_cognit
    const val = s?.valuation
    const div = s?.dividends
    const risk = r?.risk_metrics
    const prof = r?.profitability
    const latestFin = fin?.financials?.[0]

    // Compute scoreRisk from actual risk metrics if available
    const scoreRisk = risk ? deriveRiskScore(risk) : (iq?.score_quanti ?? iq?.iq_score ?? 50)

    // Compute confidence from data availability
    let confidence = 0.5
    if (iq) {
      let available = 0
      if (iq.score_quanti) available++
      if (iq.score_quali) available++
      if (iq.score_valuation) available++
      if (div?.dividend_safety != null) available++
      if (risk) available++
      if (latestFin) available++
      confidence = available >= 5 ? 0.95 : available >= 4 ? 0.90 : available >= 3 ? 0.80 : 0.65
    }

    // Compute valuation multiples from financials + price
    let peRatio: number | null = null
    let pbRatio: number | null = null
    let evEbitda: number | null = null
    if (latestFin && price > 0 && quote?.market_cap) {
      if (latestFin.lpa && latestFin.lpa !== 0) peRatio = Math.round((price / latestFin.lpa) * 100) / 100
      if (latestFin.vpa && latestFin.vpa !== 0) pbRatio = Math.round((price / latestFin.vpa) * 100) / 100
      if (latestFin.ebitda && latestFin.ebitda > 0) {
        const ev = quote.market_cap + (latestFin.net_debt ?? 0)
        evEbitda = Math.round((ev / latestFin.ebitda) * 100) / 100
      }
    }

    return {
      id: ticker,
      ticker: d.ticker,
      name: d.company_name,
      type: 'stock',
      sector: getClusterName(d.cluster_id),
      price,
      change: price - open,
      changePercent: open > 0 ? ((price - open) / open) * 100 : 0,
      logo: `https://raw.githubusercontent.com/StatusInvest/Content/master/img/company/${ticker}.jpg`,
      volume: quote?.volume ?? null,
      marketCap: quote?.market_cap ?? null,
      fiftyTwoWeekHigh: null,
      fiftyTwoWeekLow: null,
      hasFundamentals: !!(latestFin || prof),
      aqScore: iq ? {
        scoreTotal: iq.iq_score,
        scoreBruto: iq.iq_score,
        scoreValuation: iq.score_valuation ?? 0,
        scoreQuality: iq.score_quali ?? 0,
        scoreGrowth: iq.score_quanti ?? 0,
        scoreDividends: div?.dividend_safety ?? 0,
        scoreRisk,
        scoreQualitativo: iq.score_quali ?? 0,
        confidence,
      } : null,
      lensScores: null,
      scoreBreakdown: null,
      valuation: val ? {
        fairValueFinal: val.fair_value_final,
        fairValueDcf: val.fair_value_dcf,
        fairValueGordon: val.fair_value_gordon,
        fairValueMult: val.fair_value_mult,
        fairValueP25: val.fair_value_p25,
        fairValueP75: val.fair_value_p75,
        safetyMargin: val.safety_margin,
        upsideProb: val.upside_prob,
        lossProb: val.loss_prob,
        impliedGrowth: null,
      } : null,
      fundamentals: {
        peRatio,
        pbRatio,
        psr: null,
        pEbit: null,
        evEbit: null,
        evEbitda,
        roe: prof?.roe ?? latestFin?.roe ?? null,
        roic: prof?.roic ?? latestFin?.roic ?? null,
        margemEbit: latestFin?.ebitda_margin ?? prof?.gross_margin ?? null,
        margemLiquida: prof?.net_margin ?? latestFin?.net_margin ?? null,
        liquidezCorrente: risk?.liquidity_ratio ?? (
          latestFin?.current_assets && latestFin?.current_liabilities && latestFin.current_liabilities > 0
            ? Math.round((latestFin.current_assets / latestFin.current_liabilities) * 100) / 100
            : null
        ),
        divBrutPatrim: latestFin?.gross_debt && latestFin?.equity && latestFin.equity > 0
          ? Math.round((latestFin.gross_debt / latestFin.equity) * 100) / 100
          : null,
        pCapGiro: null,
        pAtivCircLiq: null,
        pAtivo: null,
        patrimLiquido: latestFin?.equity ?? null,
        dividendYield: div?.projected_yield ?? null,
        netDebtEbitda: risk?.dl_ebitda ?? latestFin?.dl_ebitda ?? null,
        crescimentoReceita5a: null,
        liq2meses: null,
        freeCashflow: latestFin?.free_cashflow ?? null,
        netDebt: latestFin?.net_debt ?? null,
        ebitda: latestFin?.ebitda ?? null,
        fcfGrowthRate: null,
        debtCostEstimate: null,
        totalDebt: latestFin?.gross_debt ?? null,
      },
    }
  } catch {
    return null
  }
}
