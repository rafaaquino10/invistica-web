/**
 * Adapters — transform IQ-Cognit Engine API responses into
 * frontend component shapes.
 *
 * IQ-Cognit has 3 main pillars + 1 operational score:
 *   - score_quanti    (0-100): Quantitative (profitability, solvency, cashflow, forensics, momentum)
 *   - score_quali     (0-100): Qualitative (governance, track_record, political, culture, moat)
 *   - score_valuation (0-100): Valuation (DCF, Gordon, Multiples, Monte Carlo)
 *   - score_operational (0-100): Operational excellence
 *   - iq_score        (0-100): Weighted composite of the above
 */

import type { IQScore, ScreenerResult, Position, Valuation, Evidence } from './endpoints'

// ════════════════════════════════════════════════════════════
// IQ-Cognit Score (shared across all pages)
// ════════════════════════════════════════════════════════════

export interface IQCognitScore {
  scoreTotal: number
  scoreQuanti: number
  scoreQuali: number
  scoreValuation: number
  scoreOperational: number
}

/** Pillar metadata for rendering labels, colors, descriptions */
export const IQ_PILLARS = [
  { key: 'scoreQuanti' as const, label: 'Quantitativo', short: 'Quanti', description: 'Rentabilidade, solvência, fluxo de caixa, forensics, momentum' },
  { key: 'scoreQuali' as const, label: 'Qualitativo', short: 'Quali', description: 'Governança, track record, risco político, cultura, moat' },
  { key: 'scoreValuation' as const, label: 'Valuation', short: 'Valuation', description: 'DCF, Gordon, Múltiplos, Monte Carlo' },
  { key: 'scoreOperational' as const, label: 'Operacional', short: 'Oper.', description: 'Excelência operacional do setor' },
] as const

// ════════════════════════════════════════════════════════════
// Asset Detail (for /ativo/[ticker] page)
// ════════════════════════════════════════════════════════════

export interface AdaptedAsset {
  id: string
  ticker: string
  name: string
  type: string
  sector: string
  logo?: string
  price?: number
  changePercent?: number
  marketCap: number
  fundamentals: AdaptedFundamental[]
  iqScore?: IQCognitScore
  scoreBreakdown?: {
    classificacao: string
    pilares: Record<string, { subNotas: SubNota[] }>
    metadata: { confiabilidade: number }
  }
  narrative?: {
    badge: { label: string; color: string; emoji: string }
    oneLiner: string
    researchNote: string
    highlights: { strengths: string[]; weaknesses: string[]; context: string }
  }
  companyProfile?: { description?: string; website?: string; employees?: number }
  sectorPeers?: Array<{ ticker: string; name: string; score?: number }>
  dividends?: Array<{ type: string; value: number; paymentDate: string | null; exDate: string }>
  dividendYield?: number
}

interface SubNota {
  indicador: string
  valor: number | null
  nota: number
  pesoInterno: number
  direcao: 'menor_melhor' | 'maior_melhor'
  referencia?: { nota10: number; nota5: number; nota0: number }
}

export interface AdaptedFundamental {
  periodType: 'annual' | 'quarterly'
  peRatio?: number
  pbRatio?: number
  psr?: number
  pEbit?: number
  evEbit?: number
  evEbitda?: number
  roe?: number
  roic?: number
  margemEbit?: number
  margemLiquida?: number
  liquidezCorrente?: number
  divBrutPatrim?: number
  pCapGiro?: number
  pAtivCircLiq?: number
  pAtivo?: number
  patrimLiquido?: number
  dividendYield?: number
  netDebtEbitda?: number
  crescimentoReceita5a?: number
  liq2meses?: number
}

/** Adapt IQScore API response to AdaptedAsset format */
export function adaptScoreToAsset(
  score: IQScore,
  tickerData?: { quote?: { close: number; volume: number; market_cap: number | null } },
  financials?: Array<Record<string, unknown>>,
  peers?: Array<{ ticker: string; company_name: string }>,
): AdaptedAsset {
  const iq = score.iq_cognit
  const val = score.valuation

  // Map rating to badge
  const ratingBadges: Record<string, { label: string; color: string; emoji: string }> = {
    STRONG_BUY: { label: 'Compra Forte', color: 'green', emoji: '' },
    BUY: { label: 'Acumular', color: 'blue', emoji: '' },
    HOLD: { label: 'Neutro', color: 'yellow', emoji: '' },
    REDUCE: { label: 'Reduzir', color: 'orange', emoji: '' },
    AVOID: { label: 'Evitar', color: 'red', emoji: '' },
  }

  // Build evidence-based drivers
  const strengths: string[] = []
  const weaknesses: string[] = []
  for (const ev of score.evidences ?? []) {
    strengths.push(...ev.bull_points)
    weaknesses.push(...ev.bear_points)
  }

  // Build scoreBreakdown pilares from evidences
  const pilares: Record<string, { subNotas: SubNota[] }> = {}
  for (const ev of score.evidences ?? []) {
    const pillarName = ev.source_type === 'quanti' ? 'quantitativo' :
                       ev.source_type === 'quali' ? 'qualitativo' :
                       ev.criterion_name.toLowerCase().includes('valuation') ? 'valuation' :
                       ev.criterion_name.toLowerCase().includes('qualit') ? 'qualitativo' :
                       ev.criterion_name.toLowerCase().includes('govern') ? 'qualitativo' :
                       ev.criterion_name.toLowerCase().includes('opera') ? 'operacional' :
                       'quantitativo'
    if (!pilares[pillarName]) pilares[pillarName] = { subNotas: [] }
    pilares[pillarName].subNotas.push({
      indicador: ev.criterion_name,
      valor: ev.score,
      nota: ev.score,
      pesoInterno: ev.weight,
      direcao: 'maior_melhor',
    })
  }

  // Adapt financials
  const adaptedFundamentals: AdaptedFundamental[] = (financials ?? []).map((f: Record<string, unknown>) => ({
    periodType: 'annual' as const,
    roe: f['roe'] as number | undefined,
    margemLiquida: f['net_margin'] as number | undefined,
    netDebtEbitda: f['dl_ebitda'] as number | undefined,
    patrimLiquido: f['equity'] as number | undefined,
  }))

  return {
    id: score.ticker,
    ticker: score.ticker,
    name: score.company_name,
    type: 'stock',
    sector: `Cluster ${score.cluster}`,
    price: val.current_price,
    marketCap: tickerData?.quote?.market_cap ?? 0,
    fundamentals: adaptedFundamentals,
    iqScore: {
      scoreTotal: iq.iq_score,
      scoreQuanti: iq.score_quanti,
      scoreQuali: iq.score_quali,
      scoreValuation: iq.score_valuation,
      scoreOperational: iq.score_operational,
    },
    scoreBreakdown: {
      classificacao: iq.rating,
      pilares,
      metadata: { confiabilidade: 0.85 },
    },
    narrative: {
      badge: ratingBadges[iq.rating] ?? ratingBadges['HOLD']!,
      oneLiner: score.thesis_summary ?? '',
      researchNote: score.thesis_summary ?? '',
      highlights: {
        strengths: strengths.slice(0, 5),
        weaknesses: weaknesses.slice(0, 5),
        context: `IQ-Score ${iq.iq_score}/100 — ${iq.rating_label}`,
      },
    },
    sectorPeers: (peers ?? []).map(p => ({ ticker: p.ticker, name: p.company_name })),
    dividends: [],
    dividendYield: score.dividends.projected_yield ?? undefined,
  }
}

// ════════════════════════════════════════════════════════════
// Screener (for /explorer page)
// ════════════════════════════════════════════════════════════

export interface AdaptedScreenerRow {
  id: string
  ticker: string
  name: string
  type: string
  sector: string | null
  logo?: string | null
  iqScore?: IQCognitScore | null
  fundamental?: {
    dividendYield?: number
    peRatio?: number
    pbRatio?: number
    roe?: number
    roic?: number
    netMargin?: number
    evEbitda?: number
    margemLiquida?: number
    netDebtEbitda?: number
    liquidezCorrente?: number
    crescimentoReceita5a?: number
  } | null
  latestQuote?: {
    close: number | string
    changePercent: number | string | null
  } | null
}

export function adaptScreenerResults(results: ScreenerResult[], clusterNames?: Record<number, string>): AdaptedScreenerRow[] {
  return results.map(r => ({
    id: r.ticker_id,
    ticker: r.ticker,
    name: r.company_name,
    type: 'stock',
    sector: clusterNames?.[r.cluster_id] ?? `Cluster ${r.cluster_id}`,
    iqScore: {
      scoreTotal: r.iq_score,
      scoreQuanti: r.score_quanti,
      scoreQuali: r.score_quali,
      scoreValuation: r.score_valuation,
      scoreOperational: 0, // Not available in screener results
    },
    fundamental: {
      dividendYield: r.dividend_yield_proj ?? undefined,
    },
    latestQuote: null,
  }))
}

// ════════════════════════════════════════════════════════════
// Portfolio (for /portfolio page)
// ════════════════════════════════════════════════════════════

export interface AdaptedPortfolio {
  id: string
  name: string
  description?: string
  isDefault: boolean
  totalValue: number
  totalCost: number
  gainLoss: number
  gainLossPercent: number
  avgIqScore: number
  positionsCount: number
  positions: AdaptedPosition[]
  topPositions?: Array<{ ticker: string; name: string }>
}

export interface AdaptedPosition {
  id: string
  ticker: string
  name: string
  logo?: string
  quantity: number
  avgPrice: number
  currentPrice: number
  totalValue: number
  totalCost: number
  gainLoss: number
  gainLossPercent: number
  iqScore: number | null
  rating: string | null
  weight: number
}

export function adaptPortfolio(positions: Position[]): AdaptedPortfolio {
  const adapted: AdaptedPosition[] = positions.map(p => {
    const totalValue = p.current_price * p.qty
    const totalCost = p.avg_price * p.qty
    const gainLoss = totalValue - totalCost
    const gainLossPercent = totalCost > 0 ? (gainLoss / totalCost) * 100 : 0
    return {
      id: p.id,
      ticker: p.ticker,
      name: p.company_name,
      quantity: p.qty,
      avgPrice: p.avg_price,
      currentPrice: p.current_price,
      totalValue,
      totalCost,
      gainLoss,
      gainLossPercent,
      iqScore: p.iq_score,
      rating: p.rating,
      weight: 0, // calculated below
    }
  })

  const totalValue = adapted.reduce((s, p) => s + p.totalValue, 0)
  const totalCost = adapted.reduce((s, p) => s + p.totalCost, 0)

  // Calculate weights
  for (const p of adapted) {
    p.weight = totalValue > 0 ? (p.totalValue / totalValue) * 100 : 0
  }

  const avgScore = adapted.length > 0
    ? adapted.reduce((s, p) => s + (p.iqScore ?? 0), 0) / adapted.length
    : 0

  return {
    id: 'default',
    name: 'Minha Carteira',
    isDefault: true,
    totalValue,
    totalCost,
    gainLoss: totalValue - totalCost,
    gainLossPercent: totalCost > 0 ? ((totalValue - totalCost) / totalCost) * 100 : 0,
    avgIqScore: avgScore,
    positionsCount: adapted.length,
    positions: adapted,
    topPositions: adapted.slice(0, 3).map(p => ({ ticker: p.ticker, name: p.name })),
  }
}

// ════════════════════════════════════════════════════════════
// Valuation (for DCFCard)
// ════════════════════════════════════════════════════════════

export interface AdaptedDCF {
  available: boolean
  upside: number
  currentPrice: number
  intrinsicValue: number
  buyPrice: number
  terminalValue?: number
  wacc?: number
  confidence: number
  safetyMargin: number
  upsideProb: number
  lossProb: number
  fairValueDCF: number | null
  fairValueGordon: number | null
  fairValueMult: number | null
  p25: number | null
  p75: number | null
}

export function adaptValuation(val: Valuation): AdaptedDCF {
  const intrinsic = val.fair_value_final ?? val.current_price
  const upside = val.current_price > 0 ? ((intrinsic - val.current_price) / val.current_price) * 100 : 0
  const buyPrice = intrinsic * 0.8 // 20% margin of safety

  return {
    available: val.fair_value_final != null,
    upside,
    currentPrice: val.current_price,
    intrinsicValue: intrinsic,
    buyPrice,
    confidence: val.score_valuation != null ? val.score_valuation / 100 : 0.5,
    safetyMargin: val.safety_margin ?? 0,
    upsideProb: val.upside_prob ?? 0,
    lossProb: val.loss_prob ?? 0,
    fairValueDCF: val.fair_value_dcf ?? null,
    fairValueGordon: val.fair_value_gordon ?? null,
    fairValueMult: val.fair_value_mult ?? null,
    p25: val.fair_value_p25 ?? null,
    p75: val.fair_value_p75 ?? null,
  }
}

// ════════════════════════════════════════════════════════════
// Evidence → Drivers (for DriversList)
// ════════════════════════════════════════════════════════════

export interface Driver {
  text: string
  pillar: string
  value?: string
  nota: number
}

export function adaptEvidenceToDrivers(evidences: Evidence[]): { positive: Driver[]; negative: Driver[] } {
  const positive: Driver[] = []
  const negative: Driver[] = []

  for (const ev of evidences) {
    for (const bp of ev.bull_points) {
      positive.push({
        text: bp,
        pillar: ev.criterion_name,
        value: `${ev.score}/100`,
        nota: ev.score,
      })
    }
    for (const bp of ev.bear_points) {
      negative.push({
        text: bp,
        pillar: ev.criterion_name,
        value: `${ev.score}/100`,
        nota: ev.score,
      })
    }
  }

  return {
    positive: positive.slice(0, 8),
    negative: negative.slice(0, 8),
  }
}
