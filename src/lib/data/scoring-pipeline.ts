// ─── Scoring Pipeline ────────────────────────────────────────
// Applies aQ Score, lens scores, macro factor, and kill switch to a merged asset.

import { calcularAqScore, mapearSetor, type DadosFundamentalistas, type AqScoreResult, type RegimeWeights, type CagedTrend } from '../scoring/aq-score'
import { calculateLensScores } from '../scoring/lens-calculator'
import type { MultiLensScores } from '../scoring/lenses'
import { checkKillSwitch } from '@/lib/intelligence/kill-switch'
import { calculateSentimentAdjustment } from '@/lib/scoring/sentiment-adjustment'
import type { GatewayFundamental, GatewayNewsItem, GatewayBeta } from '../gateway-client'
import type { CAGEDSectorData } from '../scoring/alternative-signals'
import type { AssetData } from './asset-cache'
import type { MergedAsset } from './data-merger'
import { estimateFCF, calculateDCF } from '../valuation/dcf'

// ─── Types ──────────────────────────────────────────────────

export interface ScoringContext {
  newsArticles: GatewayNewsItem[]
  macroMomentumScore: number | null
  regimeWeights?: RegimeWeights
  betaMap?: Map<string, GatewayBeta>
  cagedData?: CAGEDSectorData[]
}

// ─── FCF Coverage Calculation ─────────────────────────────────

/**
 * Calcula FCF Coverage ratio: FCF / Dividendos pagos estimados.
 * Se FCF e dados de dividendos disponíveis, estima cobertura.
 * Coverage > 1.5 = sustentável, < 1.0 = risco de corte de dividendo.
 */
function calcularFcfCoverage(fund: GatewayFundamental): number | null {
  const fcf = fund.freeCashflow
  const ebitda = fund.ebitda
  const payout = fund.payout
  const margemLiquida = fund.margemLiquida

  // Sem FCF, impossível calcular
  if (fcf == null || fcf === 0) return null

  // Método 1: Se temos payout e EBITDA, estimamos dividendos pagos
  // Lucro líquido ≈ EBITDA × margem líquida (se ambos disponíveis)
  if (payout != null && payout > 0 && ebitda != null && ebitda > 0 && margemLiquida != null && margemLiquida > 0) {
    const lucroEstimado = ebitda * (margemLiquida / 100)
    const dividendosPagos = lucroEstimado * (payout / 100)
    if (dividendosPagos > 0) {
      return Math.round((fcf / dividendosPagos) * 100) / 100
    }
  }

  // Método 2: FCF positivo com payout baixo → assumir cobertura saudável
  if (fcf > 0 && (payout == null || payout <= 5)) {
    return null // Sem dividendos relevantes, coverage não se aplica
  }

  return null
}

// ─── Score a Single Asset ───────────────────────────────────

/**
 * Apply full scoring pipeline to a merged asset.
 * Returns a complete AssetData with aqScore, lensScores, scoreBreakdown, killSwitch.
 */
export function scoreAsset(
  merged: MergedAsset,
  fund: GatewayFundamental,
  ctx: ScoringContext,
): AssetData {
  const dados: DadosFundamentalistas = {
    ticker: merged.ticker,
    cotacao: merged.price,
    P_L: fund.peRatio,
    P_VP: fund.pbRatio,
    PSR: fund.psr,
    P_EBIT: fund.pEbit,
    EV_EBIT: fund.evEbit,
    EV_EBITDA: fund.evEbitda,
    ROIC: fund.roic,
    ROE: fund.roe,
    MRG_EBIT: fund.margemEbit,
    MRG_LIQUIDA: fund.margemLiquida,
    LIQ_CORRENTE: fund.liquidezCorrente,
    DIV_BRUT_PATRIM: fund.divBrutPatrim,
    P_CAP_GIRO: fund.pCapGiro,
    P_ATIV_CIRC_LIQ: fund.pAtivCircLiq,
    P_ATIVO: fund.pAtivo,
    PATRIM_LIQUIDO: fund.patrimLiquido,
    DIV_YIELD: fund.dividendYield,
    DIV_EBITDA: fund.netDebtEbitda,
    PAYOUT: fund.payout,
    CRESC_REC_5A: fund.crescimentoReceita5a,
    CRESC_LUCRO_5A: fund.crescLucro5a,
    LIQ_2MESES: fund.liq2meses,
    MARKET_CAP: merged.marketCap,
    SETOR: merged.sector,
    BETA: ctx.betaMap?.get(merged.ticker)?.beta ?? null,
    // FCF Coverage: FCF / Dividendos pagos estimados
    // Estimativa: dividendos pagos ≈ lucroLíquido × (payout/100)
    // FCF Coverage = FCF / dividendos pagos
    FCF_COVERAGE: calcularFcfCoverage(fund),
    ROE_MEDIA_5A: fund.roeMedia5a ?? null,
    MRG_LIQUIDA_MEDIA_5A: fund.mrgLiquidaMedia5a ?? null,
    // Qualitative metrics from gateway
    MOAT_SCORE: fund.moatScore ?? null,
    EARNINGS_QUALITY: fund.earningsQuality ?? null,
    MANAGEMENT_SCORE: fund.managementScore ?? null,
    DEBT_SUSTAINABILITY: fund.debtSustainabilityScore ?? null,
    REGULATORY_RISK: fund.regulatoryRiskScore ?? null,
    // Live signal fields
    GOVERNANCE_SCORE: fund.governanceScore ?? null,
    NEWS_SENTIMENT: fund.newsSentimentScore ?? null,
    CEO_TENURE: fund.ceoTenureScore ?? null,
    BUYBACK_SIGNAL: fund.buybackSignal ?? null,
    LISTING_SEGMENT: fund.listingSegmentScore ?? null,
    FREE_FLOAT: fund.freeFloatScore ?? null,
    CVM_SANCTIONS: fund.cvmSanctionsScore ?? null,
    CATALYST_ALERT: fund.catalystAlertScore ?? null,
    RI_EVENT_VOLUME: fund.riEventVolume ?? null,
    // DCF Upside: desconto/prêmio ao valor justo
    DCF_UPSIDE: (() => {
      try {
        const assetProxy = {
          marketCap: merged.marketCap,
          price: merged.price,
          fundamentals: {
            peRatio: fund.peRatio, margemLiquida: fund.margemLiquida,
            margemEbit: fund.margemEbit, freeCashflow: fund.fcfFromCvm ?? fund.freeCashflow ?? null,
          },
        }
        const { fcf, source } = estimateFCF(assetProxy)
        if (fcf <= 0 || merged.price <= 0 || !merged.marketCap) return null
        // Só incluir se FCF é de fonte confiável (CVM ou brapi)
        if (source === 'estimado') return null
        const beta = ctx.betaMap?.get(merged.ticker)?.beta ?? 1.0
        // FCF growth para DCF: usar real se positivo, senão receita, senão 3% (floor para going concern).
        // Crescimento negativo não entra no DCF — múltiplos já capturam isso.
        const rawGrowth = fund.fcfGrowthRate ?? fund.crescimentoReceita5a ?? 3
        const growthRate = Math.max(0, rawGrowth)
        const result = calculateDCF({
          ticker: merged.ticker, sector: merged.sector,
          freeCashFlow: fcf, fcfGrowthRate: Math.min(growthRate, 20),
          selicRate: 13, riskPremium: 5.5, beta,
          sharesOutstanding: merged.marketCap / merged.price,
          netDebt: fund.netDebtEbitda != null && fund.ebitda != null && fund.ebitda !== 0
            ? fund.netDebtEbitda * fund.ebitda : undefined,
          totalDebt: fund.divBrutPatrim != null && fund.patrimLiquido != null && fund.patrimLiquido > 0
            ? fund.divBrutPatrim * fund.patrimLiquido : undefined,
          marketCap: merged.marketCap ?? undefined,
          debtCost: fund.debtCostEstimate ?? undefined,
          fcfSource: source,
        })
        const upside = ((result.intrinsicValue - merged.price) / merged.price) * 100
        // Sanidade: rejeitar upside absurdo (>200% ou <-80%)
        if (upside > 200 || upside < -80) return null
        return Math.round(upside * 10) / 10
      } catch { return null }
    })(),
  }

  // Resolve CAGED trend for this asset's sector
  const mappedSetor = mapearSetor(merged.sector, merged.ticker)
  let cagedTrend: CagedTrend | null = null
  if (ctx.cagedData?.length) {
    const sectorMatch = ctx.cagedData.find(c => c.b3Sector === merged.sector)
    if (sectorMatch) cagedTrend = sectorMatch.trend
  }

  // Calculate sentiment adjustment from ticker-specific news
  const tickerNews = ctx.newsArticles.filter(n =>
    n.tickers?.includes(merged.ticker)
  )
  const sentimentAdj = calculateSentimentAdjustment({
    ticker: merged.ticker,
    articles: tickerNews.map(n => ({
      sentimentScore: n.sentimentScore ?? 0,
      sentimentConfidence: n.sentimentConfidence ?? 0,
      date: n.date,
    })),
  })
  const sentimentFactor = sentimentAdj.factor !== 1.0
    ? { factor: sentimentAdj.factor, reason: sentimentAdj.reason }
    : undefined

  // Score calculation (macro factor removed — Kalshi US data was irrelevant for BR)
  const scoreResult = calcularAqScore(dados, undefined, ctx.regimeWeights, cagedTrend, sentimentFactor, fund.trendScore)
  const finalResult: AqScoreResult = scoreResult

  let aqScore: AssetData['aqScore'] = {
    scoreTotal: finalResult.score,
    scoreBruto: finalResult.ajustes.scoreBruto,
    scoreValuation: finalResult.pilares.valuation.nota,
    scoreQuality: finalResult.pilares.qualidade.nota,
    scoreGrowth: finalResult.pilares.crescimento.nota,
    scoreDividends: finalResult.pilares.dividendos.nota,
    scoreRisk: finalResult.pilares.risco.nota,
    scoreQualitativo: finalResult.pilares.qualitativo.nota,
    confidence: finalResult.metadata.confiabilidade,
  }

  let lensScores: MultiLensScores | null = calculateLensScores(finalResult, ctx.macroMomentumScore)
  const scoreBreakdown: AqScoreResult = finalResult

  // Kill switch: check if critical news should zero out scores
  let killSwitch: AssetData['killSwitch'] = undefined
  if (ctx.newsArticles.length > 0) {
    const ks = checkKillSwitch(merged.ticker, merged.name, ctx.newsArticles)
    if (ks.triggered) {
      killSwitch = { triggered: true, reason: ks.reason }
      aqScore = {
        scoreTotal: 0, scoreBruto: 0,
        scoreValuation: 0, scoreQuality: 0, scoreGrowth: 0,
        scoreDividends: 0, scoreRisk: 0, scoreQualitativo: 0,
        confidence: aqScore.confidence,
      }
      lensScores = {
        general: 0, value: 0, dividends: 0,
        growth: 0, defensive: 0, momentum: null,
      }
      console.warn(`[kill-switch] ${merged.ticker}: ${ks.reason}`)
    }
  }

  return { ...merged, aqScore, lensScores, scoreBreakdown, killSwitch }
}

/**
 * Build an AssetData without scores (no fundamentals available).
 */
export function assetWithoutScore(merged: MergedAsset): AssetData {
  return { ...merged, aqScore: null, lensScores: null, scoreBreakdown: null }
}
