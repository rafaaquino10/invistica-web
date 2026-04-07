import { router, publicProcedure } from '../trpc'
import { fetchBenchmarks, fetchMacroIndicators } from '@/lib/gateway-client'
import { getDataSource, getCacheStatus, getCurrentRegime } from '@/lib/data-source'
import { detectRegime, REGIME_DISPLAY } from '@/lib/scoring/regime-detector'
import { fetchCAGEDData } from '@/lib/scoring/alternative-signals'

export const economyRouter = router({
  // Get current data source ('live' | 'demo') with cache diagnostics
  dataSource: publicProcedure.query(() => {
    return {
      source: getDataSource(),
      cache: getCacheStatus(),
    }
  }),
  // Get all economy indicators from BCB SGS (SELIC, IPCA, CDI, USD/BRL, EUR/BRL) + IBOV
  indicators: publicProcedure.query(async () => {
    const [macro, benchmarks] = await Promise.all([
      fetchMacroIndicators(),
      fetchBenchmarks(),
    ])

    return {
      selic: macro ? {
        rate: macro.selic.valor,
        date: macro.selic.data,
      } : {
        rate: benchmarks.selic.rate,
        date: benchmarks.selic.date,
      },
      ipca: macro ? {
        value: macro.ipca.valor,
        date: macro.ipca.data,
        acum12m: macro.ipca12m.valor,
      } : null,
      usdBrl: macro ? {
        bid: macro.dolar.valor,
        ask: macro.dolar.valor,
        change: 0,
        date: macro.dolar.data,
      } : null,
      eurBrl: macro ? {
        bid: macro.euro.valor,
        ask: macro.euro.valor,
        change: 0,
        date: macro.euro.data,
      } : null,
      cdi: macro ? {
        rate: macro.cdi.valor,
        date: macro.cdi.data,
      } : null,
      ibov: {
        points: benchmarks.ibov.points,
        change: benchmarks.ibov.change,
      },
    }
  }),

  // Regime macro atual — usa SELIC Real (SELIC - IPCA 12m) quando disponível
  currentRegime: publicProcedure.query(async () => {
    // Usa regime em cache do scoring pipeline quando disponível
    const cached = getCurrentRegime()
    if (cached) {
      const [benchmarks, macro] = await Promise.all([
        fetchBenchmarks().catch(() => null),
        fetchMacroIndicators().catch(() => null),
      ])
      const display = REGIME_DISPLAY[cached.regime]
      return {
        regime: cached.regime,
        description: cached.description,
        pillarWeights: cached.pillarWeights,
        selic: benchmarks?.selic.rate ?? null,
        ipca: macro?.ipca12m?.valor ?? null,
        selicReal: isNaN(cached.selicReal) ? null : cached.selicReal,
        display,
      }
    }

    // Fallback: busca SELIC + IPCA e computa
    const [benchmarks, macro] = await Promise.all([
      fetchBenchmarks(),
      fetchMacroIndicators().catch(() => null),
    ])
    const selic = benchmarks.selic.rate
    const ipca12m = macro?.ipca12m?.valor ?? 0
    const regime = detectRegime(selic, ipca12m)
    const display = REGIME_DISPLAY[regime.regime]
    return {
      regime: regime.regime,
      description: regime.description,
      pillarWeights: regime.pillarWeights,
      selic,
      ipca: ipca12m || null,
      selicReal: isNaN(regime.selicReal) ? null : regime.selicReal,
      display,
    }
  }),

  // Pulso Setorial CAGED — dados alternativos de emprego
  cagedPulse: publicProcedure.query(async () => {
    const data = await fetchCAGEDData()
    return data.sort((a, b) => b.netBalance - a.netBalance)
  }),
})
