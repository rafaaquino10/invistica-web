import { z } from 'zod'
import { router, publicProcedure, premiumProcedure } from '../trpc'
import { TRPCError } from '@trpc/server'
import { getAssets, getCurrentRegime } from '@/lib/data-source'
import {
  fetchHistory,
  fetchDividends,
  fetchIntelligence,
  fetchSparklines,
} from '@/lib/gateway-client'
import { investiq } from '@/lib/investiq-client'
import { generateResearchNote } from '@/lib/ai/research-note'

export const assetsRouter = router({
  // Get all assets with optional filters — always uses live gateway data
  list: publicProcedure
    .input(
      z.object({
        type: z.enum(['stock', 'fii', 'etf', 'bdr']).optional(),
        sector: z.string().optional(),
        search: z.string().optional(),
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).max(100).default(20),
        sortBy: z.string().optional(),
        sortOrder: z.enum(['asc', 'desc']).default('asc'),
      }).optional()
    )
    .query(async ({ input }) => {
      const { type, sector, search, page = 1, pageSize = 20, sortBy, sortOrder = 'asc' } = input ?? {}

      const ALL_ASSETS = await getAssets()
      let filteredAssets = [...ALL_ASSETS]

      if (type) {
        filteredAssets = filteredAssets.filter(a => a.type === type)
      }
      if (sector) {
        filteredAssets = filteredAssets.filter(a => a.sector === sector)
      }
      if (search) {
        const searchLower = search.toLowerCase()
        filteredAssets = filteredAssets.filter(a =>
          a.ticker.toLowerCase().includes(searchLower) ||
          a.name.toLowerCase().includes(searchLower)
        )
      }

      if (sortBy) {
        filteredAssets.sort((a, b) => {
          const aVal = (a as unknown as Record<string, unknown>)[sortBy]
          const bVal = (b as unknown as Record<string, unknown>)[sortBy]
          if (typeof aVal === 'number' && typeof bVal === 'number') {
            return sortOrder === 'asc' ? aVal - bVal : bVal - aVal
          }
          return sortOrder === 'asc'
            ? String(aVal).localeCompare(String(bVal))
            : String(bVal).localeCompare(String(aVal))
        })
      }

      const start = (page - 1) * pageSize
      const paginatedAssets = filteredAssets.slice(start, start + pageSize)

      return {
        assets: paginatedAssets.map(asset => ({
          id: asset.id,
          ticker: asset.ticker,
          name: asset.name,
          type: asset.type,
          sector: asset.sector,
          logo: asset.logo,
          volume: asset.volume,
          marketCap: asset.marketCap,
          hasFundamentals: asset.hasFundamentals,
          aqScore: asset.aqScore,
          latestQuote: {
            close: asset.price,
            change: asset.change,
            changePercent: asset.changePercent,
          },
        })),
        pagination: {
          page,
          pageSize,
          total: filteredAssets.length,
          totalPages: Math.ceil(filteredAssets.length / pageSize),
        },
      }
    }),

  // Get single asset by ticker — uses getAssets() + gateway history/dividends
  getByTicker: publicProcedure
    .input(z.object({ ticker: z.string() }))
    .query(async ({ input }) => {
      const ALL_ASSETS = await getAssets()
      let asset = ALL_ASSETS.find(a => a.ticker.toUpperCase() === input.ticker.toUpperCase())

      // Fallback: se o cache estiver vazio ou o ativo não foi encontrado,
      // buscar direto do backend via /tickers/{ticker} + /scores/{ticker}
      if (!asset) {
        try {
          const [tickerData, scoreData] = await Promise.allSettled([
            investiq.get<{ ticker: string; company_name: string; cluster_id: number; quote?: { close: number; open: number; volume: number; market_cap: number } }>(`/tickers/${input.ticker}`),
            investiq.get<{ iq_score: number; rating: string; score_quanti: number; score_quali: number; score_valuation: number; fair_value_final: number; safety_margin: number; dividend_yield_proj: number; dividend_safety: number }>(`/scores/${input.ticker}`),
          ])

          if (tickerData.status === 'fulfilled' && tickerData.value) {
            const t = tickerData.value
            const s = scoreData.status === 'fulfilled' ? scoreData.value : null
            const q = t.quote
            const price = q?.close ?? 0
            const CLUSTER_NAMES: Record<number, string> = { 1: 'Financeiro', 2: 'Recursos Naturais e Commodities', 3: 'Consumo e Varejo', 4: 'Utilities e Concessões', 5: 'Saúde', 6: 'TMT', 7: 'Bens de Capital', 8: 'Real Estate', 9: 'Educação' }

            asset = {
              id: t.ticker, ticker: t.ticker, name: t.company_name, type: 'stock',
              sector: CLUSTER_NAMES[t.cluster_id] ?? `Cluster ${t.cluster_id}`,
              price, change: 0, changePercent: q ? ((q.close - q.open) / q.open) * 100 : 0,
              logo: null, volume: q?.volume ?? null, marketCap: q?.market_cap ?? null,
              fiftyTwoWeekHigh: null, fiftyTwoWeekLow: null, hasFundamentals: !!s,
              aqScore: s ? {
                scoreTotal: s.iq_score, scoreBruto: s.iq_score,
                scoreValuation: s.score_valuation ?? 0, scoreQuality: s.score_quali ?? 0,
                scoreGrowth: s.score_quanti ?? 0, scoreDividends: s.dividend_safety ?? 0,
                scoreRisk: s.score_quanti ?? 0, scoreQualitativo: s.score_quali ?? 0, confidence: 0.85,
              } : null,
              lensScores: null, scoreBreakdown: null,
              valuation: s ? { fairValueFinal: s.fair_value_final, fairValueDcf: null, fairValueGordon: null, fairValueMult: null, fairValueP25: null, fairValueP75: null, safetyMargin: s.safety_margin, upsideProb: null, lossProb: null, impliedGrowth: null } : null,
              fundamentals: { peRatio: null, pbRatio: null, psr: null, pEbit: null, evEbit: null, evEbitda: null, roe: null, roic: null, margemEbit: null, margemLiquida: null, liquidezCorrente: null, divBrutPatrim: null, pCapGiro: null, pAtivCircLiq: null, pAtivo: null, patrimLiquido: null, dividendYield: s?.dividend_yield_proj ?? null, netDebtEbitda: null, crescimentoReceita5a: null, liq2meses: null, freeCashflow: null, netDebt: null, ebitda: null, fcfGrowthRate: null, debtCostEstimate: null, totalDebt: null },
            } as any
          }
        } catch {
          // Backend direto também falhou
        }
      }

      if (!asset) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Ativo ${input.ticker} não encontrado`,
        })
      }

      // Backend already provides the correct scoreBreakdown structure — pass through directly
      const scoreBreakdown = asset.scoreBreakdown ?? null

      // Fetch real data from backend + gateway in parallel
      let quotes: Array<{ date: Date; close: number; open: number; high: number; low: number; volume: number }> = []
      let dividends: Array<{ type: string; value: number; paymentDate: Date | null }> = []

      // Backend enrichment: score detail (valuation + thesis + dividends) + risk metrics
      interface BackendScoreEnrich {
        valuation?: { fair_value_final: number | null; fair_value_dcf: number | null; fair_value_gordon: number | null; fair_value_mult: number | null; fair_value_p25: number | null; fair_value_p75: number | null; safety_margin: number | null; upside_prob: number | null; loss_prob: number | null } | null
        dividends?: { dividend_safety: number | null; projected_yield: number | null; dividend_cagr_5y: number | null } | null
        thesis_summary?: string | null
      }
      interface BackendRiskEnrich {
        risk_metrics: { altman_z: number | null; altman_z_label: string | null; merton_pd: number | null; dl_ebitda: number | null; icj: number | null; piotroski_score: number | null; beneish_score: number | null; liquidity_ratio: number | null }
        profitability: { roe: number | null; roic: number | null; wacc: number | null; spread_roic_wacc: number | null; net_margin: number | null; gross_margin: number | null; fcf_yield: number | null }
      }

      const [historyResult, dividendResult, backendScore, backendRisk, intelligenceData] = await Promise.all([
        fetchHistory(asset.ticker, '3mo').catch(() => [] as Awaited<ReturnType<typeof fetchHistory>>),
        fetchDividends(asset.ticker).catch(() => [] as Awaited<ReturnType<typeof fetchDividends>>),
        investiq.get<BackendScoreEnrich>(`/scores/${asset.ticker}`).catch(() => null),
        investiq.get<BackendRiskEnrich>(`/scores/${asset.ticker}/risk-metrics`).catch(() => null),
        fetchIntelligence(asset.ticker),
      ])

      quotes = historyResult.map(h => ({
        date: new Date(h.date * 1000),
        close: h.close,
        open: h.open,
        high: h.high,
        low: h.low,
        volume: h.volume,
      }))

      dividends = dividendResult.map(d => ({
        type: d.label ?? 'DIVIDENDO',
        value: d.rate,
        paymentDate: d.paymentDate ? new Date(d.paymentDate) : null,
      }))

      // Map fundamentals enriched with backend risk/profitability data
      const f = asset.fundamentals
      const prof = backendRisk?.profitability
      const riskM = backendRisk?.risk_metrics
      const mappedFundamental = {
        ...f,
        roe: prof?.roe ?? f.roe,
        roic: prof?.roic ?? f.roic,
        margemLiquida: prof?.net_margin ?? f.margemLiquida,
        margemEbit: prof?.gross_margin ?? f.margemEbit,
        liquidezCorrente: riskM?.liquidity_ratio ?? f.liquidezCorrente,
        netDebtEbitda: riskM?.dl_ebitda ?? f.netDebtEbitda,
        periodType: 'annual' as const,
        referenceDate: new Date(),
        netMargin: prof?.net_margin ?? f.margemLiquida,
        ebitdaMargin: prof?.gross_margin ?? f.margemEbit,
        wacc: prof?.wacc ?? null,
        spreadRoicWacc: prof?.spread_roic_wacc ?? null,
        fcfYield: prof?.fcf_yield ?? null,
        altmanZ: riskM?.altman_z ?? null,
        altmanZLabel: riskM?.altman_z_label ?? null,
        mertonPd: riskM?.merton_pd ?? null,
        piotroskiScore: riskM?.piotroski_score ?? null,
        beneishScore: riskM?.beneish_score ?? null,
        interestCoverage: riskM?.icj ?? null,
      }

      // Sector peers: top 5 same-sector stocks by score (excluding current)
      const sectorPeers = ALL_ASSETS
        .filter(a => a.sector === asset.sector && a.ticker !== asset.ticker && a.aqScore)
        .sort((a, b) => (b.aqScore?.scoreTotal ?? 0) - (a.aqScore?.scoreTotal ?? 0))
        .slice(0, 5)
        .map(a => ({
          ticker: a.ticker,
          name: a.name,
          logo: a.logo,
          scoreTotal: a.aqScore?.scoreTotal ?? null,
          peRatio: a.fundamentals.peRatio,
          roe: a.fundamentals.roe,
          dividendYield: a.fundamentals.dividendYield,
          price: a.price,
          changePercent: a.changePercent,
        }))

      // AI diagnosis — backend provides this data, no local calculation needed
      const aiDiagnosis: { text: string; source: 'ai' | 'template' } | null = null

      return {
        id: asset.id,
        ticker: asset.ticker,
        name: asset.name,
        type: asset.type,
        sector: asset.sector,
        logo: asset.logo,
        volume: asset.volume,
        marketCap: asset.marketCap,
        hasFundamentals: asset.hasFundamentals,
        price: asset.price,
        change: asset.change,
        changePercent: asset.changePercent,
        aqScore: asset.aqScore,
        lensScores: asset.lensScores,
        scoreBreakdown,
        narrative: null, // Narrative generation moved to backend
        aiDiagnosis,
        fundamentals: [mappedFundamental],
        quotes,
        dividends,
        momentum: null, // Backend não expõe momentum direto; dados de risco cobrem isso
        intelligence: intelligenceData,
        companyProfile: null, // Substituído por backendValuation + riskMetrics
        sectorPeers,
        killSwitch: asset.killSwitch ?? null,
        // ─── Onda 1: Dados ricos do backend ────────────────────
        backendValuation: backendScore?.valuation ?? asset.valuation ?? null,
        thesis: backendScore?.thesis_summary ?? null,
        dividendData: backendScore?.dividends ?? null,
        riskMetrics: backendRisk ? {
          risk: backendRisk.risk_metrics,
          profitability: backendRisk.profitability,
        } : null,
      }
    }),

  // Get multiple assets for comparison — always uses live data
  getMultiple: publicProcedure
    .input(z.object({ tickers: z.array(z.string()).max(4) }))
    .query(async ({ input }) => {
      const ALL_ASSETS = await getAssets()
      const tickersUpper = input.tickers.map(t => t.toUpperCase())
      const filtered = ALL_ASSETS.filter(a => tickersUpper.includes(a.ticker.toUpperCase()))

      // Enrich each asset with backend valuation + risk in parallel
      const enriched = await Promise.all(filtered.map(async (asset) => {
        let backendVal = null
        let backendRisk = null
        try {
          const [valRes, riskRes] = await Promise.allSettled([
            investiq.get(`/valuation/${asset.ticker}`),
            investiq.get(`/scores/${asset.ticker}/risk-metrics`),
          ])
          backendVal = valRes.status === 'fulfilled' ? valRes.value : null
          backendRisk = riskRes.status === 'fulfilled' ? riskRes.value : null
        } catch { /* enrichment is optional */ }

        return {
          id: asset.id,
          ticker: asset.ticker,
          name: asset.name,
          type: asset.type,
          sector: asset.sector,
          logo: asset.logo,
          volume: asset.volume,
          marketCap: asset.marketCap,
          hasFundamentals: asset.hasFundamentals,
          aqScore: asset.aqScore,
          valuation: asset.valuation ?? null,
          latestFundamental: {
            ...asset.fundamentals,
            netMargin: asset.fundamentals.margemLiquida,
            ebitdaMargin: asset.fundamentals.margemEbit,
          },
          latestQuote: {
            close: asset.price,
            change: asset.change,
            changePercent: asset.changePercent,
          },
          // Backend enrichment for comparison
          backendValuation: backendVal as any ?? null,
          riskMetrics: backendRisk as any ?? null,
        }
      }))

      return enriched
    }),

  // Get available sectors — always uses live data
  getSectors: publicProcedure.query(async () => {
    const ALL_ASSETS = await getAssets()
    const sectors = [...new Set(ALL_ASSETS.map(a => a.sector))].filter(Boolean).sort()
    return sectors as string[]
  }),

  // Search assets (for autocomplete) — always uses live data
  search: publicProcedure
    .input(z.object({ query: z.string().min(1) }))
    .query(async ({ input }) => {
      const queryLower = input.query.toLowerCase()
      const ALL_ASSETS = await getAssets()
      return ALL_ASSETS
        .filter(a =>
          a.ticker.toLowerCase().includes(queryLower) ||
          a.name.toLowerCase().includes(queryLower)
        )
        .slice(0, 10)
        .map(a => ({
          id: a.id,
          ticker: a.ticker,
          name: a.name,
          type: a.type,
          sector: a.sector,
          logo: a.logo,
          price: a.price ?? null,
          aqScore: a.aqScore?.scoreTotal ?? null,
        }))
    }),

  // Get historical prices for a ticker — always uses gateway
  // Fallback: se range curto retorna <2 pontos (brapi free sem intraday),
  // amplia o range automaticamente para garantir dados renderizáveis.
  getHistory: publicProcedure
    .input(z.object({
      ticker: z.string(),
      range: z.enum(['1d', '5d', '1mo', '3mo', '6mo', '1y']).default('1mo'),
      interval: z.enum(['1d']).default('1d'),
    }))
    .query(async ({ input }) => {
      const ticker = input.ticker.toUpperCase()
      const toResult = (data: Awaited<ReturnType<typeof fetchHistory>>) =>
        data
          .filter(h => h.close > 0)
          .map(h => ({
            date: new Date(h.date * 1000),
            close: h.close,
            open: h.open,
            high: h.high,
            low: h.low,
            volume: h.volume,
          }))

      // Fallback chain: se o range pedido retorna <2 pontos, tenta o próximo
      const FALLBACK: Record<string, string | undefined> = { '1d': '5d', '5d': '1mo' }

      try {
        let range: string = input.range
        let result = toResult(await fetchHistory(ticker, range, '1d'))

        while (result.length < 2 && FALLBACK[range]) {
          range = FALLBACK[range]!
          result = toResult(await fetchHistory(ticker, range, '1d'))
        }

        return result
      } catch {
        return []
      }
    }),

  // ─── Sparklines 30d (batch) ────────────────────────────────
  getSparklines: publicProcedure
    .query(async () => {
      try {
        return await fetchSparklines()
      } catch {
        return {} as Record<string, number[]>
      }
    }),

  // ─── Sensibilidade Macro ────────────────────────────────────
  sensitivity: premiumProcedure
    .input(z.object({ ticker: z.string() }))
    .query(async ({ input }) => {
      // Sensitivity analysis provided by backend
      try {
        const backendSens = await investiq.get<{
          scenarios: Array<{
            name: string; description: string;
            impact_score: number; impact_price: number;
            affected_pillars: string[];
            regime_change: string | null;
          }>
        }>(`/analytics/sensitivity?ticker=${input.ticker.toUpperCase()}`)

        if (backendSens?.scenarios?.length) {
          return backendSens.scenarios.map(s => ({
            label: s.name,
            description: s.description,
            scoreImpact: s.impact_score,
            priceImpact: s.impact_price,
            affectedPillars: s.affected_pillars,
            regimeChange: s.regime_change,
            source: 'backend' as const,
          }))
        }
      } catch { /* backend unavailable */ }

      return []
    }),

  // ─── Evidence Explorer (Backend Invscore) ─────────────────
  evidence: premiumProcedure
    .input(z.object({ ticker: z.string() }))
    .query(async ({ input }) => {
      try {
        return await investiq.get<{
          ticker: string
          evidences: Array<{
            criterion_id: number
            criterion_name: string
            pillar: string
            score: number
            weight: number
            evidence_text: string
            source_type: string
            source_url: string | null
            bull_points: string[] | null
            bear_points: string[] | null
          }>
        }>(`/scores/${input.ticker.toUpperCase()}/evidence`)
      } catch { return null }
    }),

  // ─── Dossier Qualitativo (Backend LLM) ────────────────────
  dossier: premiumProcedure
    .input(z.object({ ticker: z.string() }))
    .query(async ({ input }) => {
      try {
        return await investiq.get<{
          ticker: string
          company_name: string
          dimensions: Array<{
            name: string
            verdict: string
            score: number
            narrative: string
            evidence: string[]
          }>
          overall_verdict: string
          generated_at: string
        }>(`/scores/${input.ticker.toUpperCase()}/dossier`)
      } catch { return null }
    }),

  // ─── Score History (Backend 12 períodos) ──────────────────
  scoreHistory: premiumProcedure
    .input(z.object({ ticker: z.string() }))
    .query(async ({ input }) => {
      try {
        return await investiq.get<{
          ticker: string
          history: Array<{
            date: string
            iq_score: number
            score_quanti: number | null
            score_quali: number | null
            score_valuation: number | null
            rating: string
          }>
        }>(`/scores/${input.ticker.toUpperCase()}/history`)
      } catch { return null }
    }),

  // ─── Research Note Elite (Claude API) ──────────────────────
  researchNote: premiumProcedure
    .input(z.object({ ticker: z.string() }))
    .query(async ({ input }) => {
      const assets = await getAssets()
      const asset = assets.find(a => a.ticker === input.ticker.toUpperCase())
      if (!asset || !asset.aqScore || !asset.scoreBreakdown) {
        throw new TRPCError({ code: 'NOT_FOUND', message: `Ativo ${input.ticker} não encontrado.` })
      }

      const peers = assets
        .filter(a => a.sector === asset.sector && a.ticker !== asset.ticker && a.aqScore)
        .slice(0, 5)

      const regime = getCurrentRegime()

      const researchAsset = {
        ticker: asset.ticker,
        name: asset.name,
        sector: asset.sector,
        price: asset.price,
        scoreTotal: asset.aqScore.scoreTotal,
        classificacao: asset.scoreBreakdown.classificacao,
        pillarScores: {
          valuation: asset.scoreBreakdown.pilares?.valuation?.nota ?? 0,
          quality: asset.scoreBreakdown.pilares?.qualidade?.nota ?? 0,
          risk: asset.scoreBreakdown.pilares?.risco?.nota ?? 0,
          dividends: asset.scoreBreakdown.pilares?.dividendos?.nota ?? 0,
          growth: asset.scoreBreakdown.pilares?.crescimento?.nota ?? 0,
        },
        fundamentals: {
          peRatio: asset.fundamentals.peRatio,
          roe: asset.fundamentals.roe,
          roic: asset.fundamentals.roic,
          dividendYield: asset.fundamentals.dividendYield,
          netDebtEbitda: asset.fundamentals.netDebtEbitda,
          margemLiquida: asset.fundamentals.margemLiquida,
          margemEbit: asset.fundamentals.margemEbit,
          liquidezCorrente: asset.fundamentals.liquidezCorrente,
        },
      }

      const researchPeers = peers.map(p => ({
        ticker: p.ticker,
        name: p.name,
        sector: p.sector,
        price: p.price,
        scoreTotal: p.aqScore!.scoreTotal,
        classificacao: p.scoreBreakdown?.classificacao ?? 'Atenção',
        pillarScores: {
          valuation: p.scoreBreakdown?.pilares?.valuation?.nota ?? 0,
          quality: p.scoreBreakdown?.pilares?.qualidade?.nota ?? 0,
          risk: p.scoreBreakdown?.pilares?.risco?.nota ?? 0,
          dividends: p.scoreBreakdown?.pilares?.dividendos?.nota ?? 0,
          growth: p.scoreBreakdown?.pilares?.crescimento?.nota ?? 0,
        },
        fundamentals: {
          peRatio: p.fundamentals.peRatio,
          roe: p.fundamentals.roe,
          roic: p.fundamentals.roic,
          dividendYield: p.fundamentals.dividendYield,
          netDebtEbitda: p.fundamentals.netDebtEbitda,
          margemLiquida: p.fundamentals.margemLiquida,
          margemEbit: p.fundamentals.margemEbit,
          liquidezCorrente: p.fundamentals.liquidezCorrente,
        },
      }))

      const macro = {
        regime: regime?.regime ?? 'neutral',
        selicReal: regime?.selicReal ?? NaN,
      }

      const note = await generateResearchNote(researchAsset, researchPeers, macro)
      return { note, generated: !!note }
    }),

  // Institutional holders — top fundos que detêm o ativo (CVM)
  getInstitutionalHolders: premiumProcedure
    .input(z.object({ ticker: z.string() }))
    .query(async ({ input }) => {
      try {
        const data = await investiq.get<Array<{
          fund_name: string
          shares_held: number
          market_value: number
          reference_date: string
        }>>(`/tickers/${input.ticker}/institutional`)
        return { holders: data ?? [], available: true }
      } catch {
        return { holders: [], available: false }
      }
    }),

  // Short interest — histórico de aluguel de ações
  getShortInterest: premiumProcedure
    .input(z.object({ ticker: z.string() }))
    .query(async ({ input }) => {
      try {
        const data = await investiq.get<Array<{
          reference_date: string
          shares_lent: number
          lending_rate: number
        }>>(`/tickers/${input.ticker}/short-interest`)
        return { history: data ?? [], available: true }
      } catch {
        return { history: [], available: false }
      }
    }),
})
