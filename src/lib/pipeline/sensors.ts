// ─── Pipeline Camada 1: Sensoriamento ───────────────────────
// Ingestão de dados brutos de todas as fontes.
// NÃO faz cálculos nem interpreta — apenas coleta e normaliza.

import {
  fetchBenchmarks as _fetchBenchmarks,
  fetchMacroIndicators as _fetchMacroIndicators,
} from '../gateway-client'

export { fetchAllFromGateway, type RawDataBundle } from '../data/data-fetcher'
export { mergeAssetData, type MergedAsset } from '../data/data-merger'
export {
  fetchBenchmarks,
  fetchMacroIndicators,
  type GatewayQuote,
  type GatewayFundamental,
  type GatewayCompany,
  type GatewayNewsItem,
  type GatewayBeta,
} from '../gateway-client'

// ─── Macro Data Aggregation ─────────────────────────────────

export interface MacroData {
  selic: number
  ipca12m: number
  selicReal: number
  ibovPoints: number | null
  ibovChange: number | null
}

/**
 * Busca dados macroeconômicos agregados de todas as fontes.
 * Combina BCB (SELIC), IPCA, e IBOV em uma única estrutura.
 */
export async function fetchMacroData(): Promise<MacroData> {
  const [benchmarks, macro] = await Promise.all([
    _fetchBenchmarks().catch(() => ({ selic: { rate: 13 }, ibov: { points: null, change: null } })),
    _fetchMacroIndicators().catch(() => null),
  ])

  const selic = (benchmarks as any).selic?.rate ?? 13
  const ipca12m = macro?.ipca12m?.valor ?? 0
  const selicReal = ipca12m > 0 ? selic - ipca12m : NaN
  const ibovPoints = (benchmarks as any).ibov?.points ?? null
  const ibovChange = (benchmarks as any).ibov?.change ?? null

  return { selic, ipca12m, selicReal, ibovPoints, ibovChange }
}
