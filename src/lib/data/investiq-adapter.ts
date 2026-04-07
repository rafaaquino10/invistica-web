// ─── InvestIQ Backend Adapter ────────────────────────────────
// Maps InvestIQ FastAPI responses to the AssetData format
// expected by the existing tRPC routers and UI components.

import type { AssetData } from './asset-cache'
import { investiq } from '../investiq-client'

const CLUSTER_NAMES: Record<number, string> = {
  1: 'Financeiro', 2: 'Recursos Naturais e Commodities', 3: 'Consumo e Varejo',
  4: 'Utilities e Concessões', 5: 'Saúde', 6: 'TMT',
  7: 'Bens de Capital', 8: 'Real Estate', 9: 'Educação',
}

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

interface RiskMetrics {
  profitability: { roe: number | null; roic: number | null; net_margin: number | null; gross_margin: number | null };
  risk_metrics: { dl_ebitda: number | null; piotroski_score: number | null; liquidity_ratio: number | null };
}

/**
 * Fetch all scored assets from InvestIQ backend and map to AssetData[].
 * This replaces the Gateway-based buildLiveDataset().
 */
export async function fetchAssetsFromInvestIQ(): Promise<AssetData[]> {
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
        sector: CLUSTER_NAMES[s.cluster_id] || `Cluster ${s.cluster_id}`,
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
          scoreRisk: 50,
          scoreQualitativo: s.score_quali ?? 0,
          confidence: 0.8,
        },
        lensScores: null,
        scoreBreakdown: null,
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
 * Fetch single asset detail from InvestIQ backend.
 */
export async function fetchAssetDetailFromInvestIQ(ticker: string): Promise<AssetData | null> {
  try {
    const [detail, score, riskMetrics] = await Promise.allSettled([
      investiq.get<TickerDetail>(`/tickers/${ticker}`),
      investiq.get<{ iq_cognit: { iq_score: number; score_quanti: number; score_quali: number; score_valuation: number } }>(`/scores/${ticker}`),
      investiq.get<RiskMetrics>(`/scores/${ticker}/risk-metrics`).catch(() => null),
    ])

    const d = detail.status === 'fulfilled' ? detail.value : null
    const s = score.status === 'fulfilled' ? score.value : null
    const r = riskMetrics.status === 'fulfilled' ? riskMetrics.value : null

    if (!d) return null

    const quote = d.quote
    const price = quote?.close ?? 0
    const open = quote?.open ?? price

    return {
      id: ticker,
      ticker: d.ticker,
      name: d.company_name,
      type: 'stock',
      sector: CLUSTER_NAMES[d.cluster_id] || `Cluster ${d.cluster_id}`,
      price,
      change: price - open,
      changePercent: open > 0 ? ((price - open) / open) * 100 : 0,
      logo: `https://raw.githubusercontent.com/StatusInvest/Content/master/img/company/${ticker}.jpg`,
      volume: quote?.volume ?? null,
      marketCap: quote?.market_cap ?? null,
      fiftyTwoWeekHigh: null,
      fiftyTwoWeekLow: null,
      hasFundamentals: true,
      aqScore: s?.iq_cognit ? {
        scoreTotal: s.iq_cognit.iq_score,
        scoreBruto: s.iq_cognit.iq_score,
        scoreValuation: s.iq_cognit.score_valuation ?? 0,
        scoreQuality: s.iq_cognit.score_quali ?? 0,
        scoreGrowth: s.iq_cognit.score_quanti ?? 0,
        scoreDividends: 50,
        scoreRisk: 50,
        scoreQualitativo: s.iq_cognit.score_quali ?? 0,
        confidence: 0.8,
      } : null,
      lensScores: null,
      scoreBreakdown: null,
      fundamentals: {
        peRatio: null, pbRatio: null, psr: null, pEbit: null,
        evEbit: null, evEbitda: null,
        roe: r?.profitability?.roe ?? null,
        roic: r?.profitability?.roic ?? null,
        margemEbit: null,
        margemLiquida: r?.profitability?.net_margin ?? null,
        liquidezCorrente: r?.risk_metrics?.liquidity_ratio ?? null,
        divBrutPatrim: null, pCapGiro: null, pAtivCircLiq: null,
        pAtivo: null, patrimLiquido: null,
        dividendYield: null,
        netDebtEbitda: r?.risk_metrics?.dl_ebitda ?? null,
        crescimentoReceita5a: null, liq2meses: null,
        freeCashflow: null, netDebt: null, ebitda: null,
        fcfGrowthRate: null, debtCostEstimate: null, totalDebt: null,
      },
    }
  } catch {
    return null
  }
}
