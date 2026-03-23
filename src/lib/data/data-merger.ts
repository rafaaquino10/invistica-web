// ─── Data Merger ─────────────────────────────────────────────
// Merges quote + fundamental + company into a pre-scored asset.
// Handles sector translation (EN → PT-BR) and percentage normalization.

import type { GatewayQuote, GatewayFundamental, GatewayCompany } from '../gateway-client'
import { normalizePercentage } from '@/lib/utils/normalize-percentage'
import type { AssetData } from './asset-cache'

// ─── Sector Translation (brapi EN → PT-BR) ─────────────────

const BRAPI_SECTOR_PT: Record<string, string> = {
  'Finance': 'Financeiro',
  'Technology Services': 'Tecnologia',
  'Electronic Technology': 'Tecnologia',
  'Utilities': 'Energia Elétrica',
  'Energy Minerals': 'Petróleo e Gás',
  'Non-Energy Minerals': 'Mineração',
  'Process Industries': 'Bens Industriais',
  'Producer Manufacturing': 'Bens Industriais',
  'Health Technology': 'Saúde',
  'Health Services': 'Saúde',
  'Consumer Durables': 'Varejo',
  'Consumer Non-Durables': 'Alimentos e Bebidas',
  'Consumer Services': 'Varejo',
  'Retail Trade': 'Varejo',
  'Distribution Services': 'Atacado',
  'Commercial Services': 'Outros',
  'Industrial Services': 'Bens Industriais',
  'Transportation': 'Transporte',
  'Communications': 'Telecomunicações',
  'Miscellaneous': 'Outros',
}

function translateBrapiSector(englishSector: string): string {
  return BRAPI_SECTOR_PT[englishSector] ?? 'Outros'
}

// ─── Types ──────────────────────────────────────────────────

/** Pre-scored asset (all fields except aqScore, lensScores, scoreBreakdown, killSwitch) */
export type MergedAsset = Omit<AssetData, 'aqScore' | 'lensScores' | 'scoreBreakdown' | 'killSwitch'>

// ─── Merge Logic ────────────────────────────────────────────

/**
 * Merge a single quote with its fundamental data and company metadata.
 * Returns a pre-scored MergedAsset ready for the scoring pipeline.
 */
export function mergeAssetData(
  q: GatewayQuote,
  fund: GatewayFundamental | undefined,
  company: GatewayCompany | undefined,
  idx: number,
): MergedAsset {
  const sector = company?.setor ?? (q.sector ? translateBrapiSector(q.sector) : 'Outros')

  // brapi sometimes returns the ticker as `name` — skip it
  const brapiName = q.name && q.name !== q.stock ? q.name : null
  const name = brapiName || company?.name || q.stock

  // Absolute change from percentage
  const changePercent = q.change
  const absoluteChange =
    q.close > 0
      ? Number((q.close * changePercent / (100 + changePercent)).toFixed(2))
      : 0

  return {
    id: String(idx),
    ticker: q.stock,
    name,
    type: 'stock' as const,
    sector,
    price: q.close,
    change: absoluteChange,
    changePercent,
    logo: q.logo || null,
    volume: q.volume || null,
    marketCap: q.market_cap || null,
    fiftyTwoWeekHigh: fund?.fiftyTwoWeekHigh ?? null,
    fiftyTwoWeekLow: fund?.fiftyTwoWeekLow ?? null,
    hasFundamentals: !!fund,
    fundamentals: {
      peRatio: fund?.peRatio ?? null,
      pbRatio: fund?.pbRatio ?? null,
      psr: fund?.psr ?? null,
      pEbit: fund?.pEbit ?? null,
      evEbit: fund?.evEbit ?? null,
      evEbitda: fund?.evEbitda ?? null,
      roe: normalizePercentage(fund?.roe, 'gateway'),
      roic: normalizePercentage(fund?.roic, 'gateway'),
      margemEbit: normalizePercentage(fund?.margemEbit, 'gateway'),
      margemLiquida: normalizePercentage(fund?.margemLiquida, 'gateway'),
      liquidezCorrente: fund?.liquidezCorrente ?? null,
      divBrutPatrim: fund?.divBrutPatrim ?? null,
      pCapGiro: fund?.pCapGiro ?? null,
      pAtivCircLiq: fund?.pAtivCircLiq ?? null,
      pAtivo: fund?.pAtivo ?? null,
      patrimLiquido: fund?.patrimLiquido ?? null,
      dividendYield: normalizePercentage(fund?.dividendYield, 'gateway'),
      netDebtEbitda: fund?.netDebtEbitda ?? null,
      crescimentoReceita5a: normalizePercentage(fund?.crescimentoReceita5a, 'gateway'),
      liq2meses: fund?.liq2meses ?? null,
      freeCashflow: fund?.fcfFromCvm ?? fund?.freeCashflow ?? null,
      netDebt: fund?.netDebtEbitda != null && fund?.ebitda != null && fund.ebitda !== 0
        ? fund.netDebtEbitda * fund.ebitda
        : null,
      ebitda: fund?.ebitda ?? null,
      fcfGrowthRate: fund?.fcfGrowthRate ?? null,
      debtCostEstimate: fund?.debtCostEstimate ?? null,
      totalDebt: fund?.divBrutPatrim != null && fund?.patrimLiquido != null && fund.patrimLiquido > 0
        ? fund.divBrutPatrim * fund.patrimLiquido
        : null,
    },
  }
}
