import { z } from 'zod'
import { router, publicProcedure, premiumProcedure } from '../trpc'
import { getAssets, getPreviousAssets } from '@/lib/data-source'
import { getScoreMovers as getHistoryMovers, getSnapshotCount } from '@/lib/score-history'
import { fetchMarketPulse } from '@/lib/gateway-client'
import { generateRecommendations, type RecommendationMode } from '@/lib/recommendations/engine'
import { investiq } from '@/lib/investiq-client'
import { safeFetch } from '@/lib/safe-fetch'

const screenerFiltersSchema = z.object({
  // Asset type (100% ações — FIIs/ETFs/BDRs removidos)
  types: z.array(z.enum(['stock'])).optional(),
  sectors: z.array(z.string()).optional(),

  // IQ Score filters
  minScore: z.number().min(0).max(100).optional(),
  maxScore: z.number().min(0).max(100).optional(),
  minValuationScore: z.number().min(0).max(100).optional(),
  minQualityScore: z.number().min(0).max(100).optional(),
  minGrowthScore: z.number().min(0).max(100).optional(),
  minDividendsScore: z.number().min(0).max(100).optional(),
  minRiskScore: z.number().min(0).max(100).optional(),

  // Fundamental filters
  minDividendYield: z.number().optional(),
  maxDividendYield: z.number().optional(),
  minPeRatio: z.number().optional(),
  maxPeRatio: z.number().optional(),
  minPbRatio: z.number().optional(),
  maxPbRatio: z.number().optional(),
  minRoe: z.number().optional(),
  maxRoe: z.number().optional(),
  minRoic: z.number().optional(),
  minNetMargin: z.number().optional(),
  maxNetDebtEbitda: z.number().optional(),

  // Pagination & sorting
  page: z.number().min(1).default(1),
  pageSize: z.number().min(1).max(500).default(50),
  sortBy: z.enum([
    'ticker',
    'name',
    'sector',
    'changePercent',
    'volume',
    'marketCap',
    'scoreTotal',
    'scoreValuation',
    'scoreQuality',
    'scoreGrowth',
    'scoreDividends',
    'scoreRisk',
    'lensValue',
    'lensDividends',
    'lensGrowth',
    'lensDefensive',
    'lensMomentum',
    'dividendYield',
    'peRatio',
    'pbRatio',
    'roe',
    'roic',
    'netMargin',
    'evEbitda',
    'margemLiquida',
    'liquidezCorrente',
    'crescimentoReceita5a',
    'netDebtEbitda',
  ]).default('scoreTotal'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

export const screenerRouter = router({
  // Main screener query — always uses live gateway data via getAssets()
  query: publicProcedure
    .input(screenerFiltersSchema)
    .query(async ({ input }) => {
      const {
        types,
        sectors,
        minScore,
        maxScore,
        minDividendYield,
        maxDividendYield,
        minPeRatio,
        maxPeRatio,
        minRoe,
        maxRoe,
        maxNetDebtEbitda,
        minRoic,
        minNetMargin,
        minPbRatio,
        maxPbRatio,
        page,
        pageSize,
        sortBy,
        sortOrder,
      } = input

      const ALL_ASSETS = await getAssets()
      // Foco 100% em ações brasileiras — filtra FIIs, ETFs e BDRs
      let filtered = ALL_ASSETS.filter(a => {
        const t = a.type as string
        return t !== 'fii' && t !== 'etf' && t !== 'bdr'
      })
      if (sectors?.length) {
        filtered = filtered.filter(a => sectors.includes(a.sector))
      }
      if (minScore !== undefined) {
        filtered = filtered.filter(a => (a.aqScore?.scoreTotal ?? 0) >= minScore)
      }
      if (maxScore !== undefined) {
        filtered = filtered.filter(a => (a.aqScore?.scoreTotal ?? 0) <= maxScore)
      }
      if (minDividendYield !== undefined) {
        filtered = filtered.filter(a => a.fundamentals.dividendYield !== null && a.fundamentals.dividendYield >= minDividendYield)
      }
      if (maxDividendYield !== undefined) {
        filtered = filtered.filter(a => a.fundamentals.dividendYield !== null && a.fundamentals.dividendYield <= maxDividendYield)
      }
      if (minPeRatio !== undefined) {
        filtered = filtered.filter(a => a.fundamentals.peRatio !== null && a.fundamentals.peRatio >= minPeRatio)
      }
      if (maxPeRatio !== undefined) {
        filtered = filtered.filter(a => a.fundamentals.peRatio !== null && a.fundamentals.peRatio > 0 && a.fundamentals.peRatio <= maxPeRatio)
      }
      if (minRoe !== undefined) {
        filtered = filtered.filter(a => a.fundamentals.roe !== null && a.fundamentals.roe >= minRoe)
      }
      if (maxRoe !== undefined) {
        filtered = filtered.filter(a => a.fundamentals.roe !== null && a.fundamentals.roe <= maxRoe)
      }
      if (maxNetDebtEbitda !== undefined) {
        filtered = filtered.filter(a => a.fundamentals.netDebtEbitda === null || a.fundamentals.netDebtEbitda <= maxNetDebtEbitda)
      }
      if (minRoic !== undefined) {
        filtered = filtered.filter(a => a.fundamentals.roic !== null && a.fundamentals.roic >= minRoic)
      }
      if (minNetMargin !== undefined) {
        filtered = filtered.filter(a => a.fundamentals.margemLiquida !== null && a.fundamentals.margemLiquida >= minNetMargin)
      }
      if (minPbRatio !== undefined) {
        filtered = filtered.filter(a => a.fundamentals.pbRatio !== null && a.fundamentals.pbRatio >= minPbRatio)
      }
      if (maxPbRatio !== undefined) {
        filtered = filtered.filter(a => a.fundamentals.pbRatio !== null && a.fundamentals.pbRatio > 0 && a.fundamentals.pbRatio <= maxPbRatio)
      }

      // Sort
      filtered.sort((a, b) => {
        let aVal: number | string = 0
        let bVal: number | string = 0
        switch (sortBy) {
          case 'ticker': aVal = a.ticker; bVal = b.ticker; break
          case 'name': aVal = a.name; bVal = b.name; break
          case 'sector': aVal = a.sector; bVal = b.sector; break
          case 'changePercent': aVal = a.changePercent; bVal = b.changePercent; break
          case 'volume': aVal = a.volume ?? 0; bVal = b.volume ?? 0; break
          case 'marketCap': aVal = a.marketCap ?? 0; bVal = b.marketCap ?? 0; break
          case 'scoreTotal': aVal = a.aqScore?.scoreTotal ?? 0; bVal = b.aqScore?.scoreTotal ?? 0; break
          case 'scoreValuation': aVal = a.aqScore?.scoreValuation ?? 0; bVal = b.aqScore?.scoreValuation ?? 0; break
          case 'scoreQuality': aVal = a.aqScore?.scoreQuality ?? 0; bVal = b.aqScore?.scoreQuality ?? 0; break
          case 'scoreGrowth': aVal = a.aqScore?.scoreGrowth ?? 0; bVal = b.aqScore?.scoreGrowth ?? 0; break
          case 'scoreDividends': aVal = a.aqScore?.scoreDividends ?? 0; bVal = b.aqScore?.scoreDividends ?? 0; break
          case 'scoreRisk': aVal = a.aqScore?.scoreRisk ?? 0; bVal = b.aqScore?.scoreRisk ?? 0; break
          case 'lensValue': aVal = a.lensScores?.value ?? 0; bVal = b.lensScores?.value ?? 0; break
          case 'lensDividends': aVal = a.lensScores?.dividends ?? 0; bVal = b.lensScores?.dividends ?? 0; break
          case 'lensGrowth': aVal = a.lensScores?.growth ?? 0; bVal = b.lensScores?.growth ?? 0; break
          case 'lensDefensive': aVal = a.lensScores?.defensive ?? 0; bVal = b.lensScores?.defensive ?? 0; break
          case 'lensMomentum': aVal = a.lensScores?.momentum ?? 0; bVal = b.lensScores?.momentum ?? 0; break
          case 'dividendYield': aVal = a.fundamentals.dividendYield ?? 0; bVal = b.fundamentals.dividendYield ?? 0; break
          case 'peRatio': aVal = a.fundamentals.peRatio ?? 9999; bVal = b.fundamentals.peRatio ?? 9999; break
          case 'pbRatio': aVal = a.fundamentals.pbRatio ?? 9999; bVal = b.fundamentals.pbRatio ?? 9999; break
          case 'roe': aVal = a.fundamentals.roe ?? 0; bVal = b.fundamentals.roe ?? 0; break
          case 'roic': aVal = a.fundamentals.roic ?? 0; bVal = b.fundamentals.roic ?? 0; break
          case 'netMargin':
          case 'margemLiquida': aVal = a.fundamentals.margemLiquida ?? 0; bVal = b.fundamentals.margemLiquida ?? 0; break
          case 'evEbitda': aVal = a.fundamentals.evEbitda ?? 9999; bVal = b.fundamentals.evEbitda ?? 9999; break
          case 'netDebtEbitda': aVal = a.fundamentals.netDebtEbitda ?? 9999; bVal = b.fundamentals.netDebtEbitda ?? 9999; break
          case 'liquidezCorrente': aVal = a.fundamentals.liquidezCorrente ?? 0; bVal = b.fundamentals.liquidezCorrente ?? 0; break
          case 'crescimentoReceita5a': aVal = a.fundamentals.crescimentoReceita5a ?? -999; bVal = b.fundamentals.crescimentoReceita5a ?? -999; break
        }
        if (typeof aVal === 'string' && typeof bVal === 'string') {
          return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
        }
        return sortOrder === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number)
      })

      const total = filtered.length
      const paginated = filtered.slice((page - 1) * pageSize, page * pageSize)

      // Enrich current page with live quotes from backend (parallel, max 50)
      interface TickerQuote { quote?: { date: string; open: number; close: number; high: number; low: number; volume: number; market_cap: number | null } }
      const quoteResults = await Promise.allSettled(
        paginated.map(a =>
          safeFetch(() => investiq.get<TickerQuote>(`/tickers/${a.ticker}`, { timeout: 5000 }), null, `quote:${a.ticker}`)
        )
      )

      return {
        assets: paginated.map((asset, i) => {
          const quoteData = quoteResults[i]?.status === 'fulfilled' ? quoteResults[i].value : null
          const q = (quoteData as TickerQuote | null)?.quote
          const price = q?.close ?? asset.price ?? 0
          const open = q?.open ?? price
          const change = price - open
          const changePct = open > 0 ? (change / open) * 100 : 0

          return {
            id: asset.id,
            ticker: asset.ticker,
            name: asset.name,
            type: asset.type,
            sector: asset.sector,
            logo: asset.logo,
            volume: q?.volume ?? asset.volume,
            marketCap: q?.market_cap ?? asset.marketCap,
            hasFundamentals: asset.hasFundamentals,
            aqScore: asset.aqScore,
            lensScores: asset.lensScores,
            fundamental: asset.fundamentals,
            latestQuote: { close: price, change, changePercent: changePct },
          }
        }),
        pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
      }
    }),

  // Get rankings — always uses live gateway data
  rankings: publicProcedure
    .input(
      z.object({
        type: z.enum(['stock', 'all']).default('all'),
        metric: z.enum([
          'scoreTotal',
          'scoreValuation',
          'scoreQuality',
          'scoreGrowth',
          'scoreDividends',
          'scoreRisk',
          'dividendYield',
        ]).default('scoreTotal'),
        limit: z.number().min(5).max(50).default(10),
      })
    )
    .query(async ({ input }) => {
      const { type, metric, limit } = input

      const ALL_ASSETS = await getAssets()
      // Foco 100% em ações brasileiras
      const stocks = ALL_ASSETS.filter(a => {
        const t = a.type as string
        return t !== 'fii' && t !== 'etf' && t !== 'bdr'
      })
      let filtered = type === 'all' ? stocks : stocks.filter(a => a.type === type)

      // Sort by metric
      filtered.sort((a, b) => {
        let aVal = 0
        let bVal = 0
        switch (metric) {
          case 'scoreTotal': aVal = a.aqScore?.scoreTotal ?? 0; bVal = b.aqScore?.scoreTotal ?? 0; break
          case 'scoreValuation': aVal = a.aqScore?.scoreValuation ?? 0; bVal = b.aqScore?.scoreValuation ?? 0; break
          case 'scoreQuality': aVal = a.aqScore?.scoreQuality ?? 0; bVal = b.aqScore?.scoreQuality ?? 0; break
          case 'scoreGrowth': aVal = a.aqScore?.scoreGrowth ?? 0; bVal = b.aqScore?.scoreGrowth ?? 0; break
          case 'scoreDividends': aVal = a.aqScore?.scoreDividends ?? 0; bVal = b.aqScore?.scoreDividends ?? 0; break
          case 'scoreRisk': aVal = a.aqScore?.scoreRisk ?? 0; bVal = b.aqScore?.scoreRisk ?? 0; break
          case 'dividendYield': aVal = a.fundamentals.dividendYield ?? 0; bVal = b.fundamentals.dividendYield ?? 0; break
        }
        return bVal - aVal
      })

      return filtered.slice(0, limit).map((asset, index) => ({
        rank: index + 1,
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
        lensScores: asset.lensScores,
        fundamental: asset.fundamentals,
        latestQuote: { close: asset.price, change: asset.change, changePercent: asset.changePercent },
      }))
    }),

  // Export screener results as CSV (Pro: 100 assets, Elite: 500)
  export: premiumProcedure
    .input(screenerFiltersSchema)
    .query(async ({ ctx, input }) => {
      const {
        types, sectors, minScore, maxScore,
        minDividendYield, maxDividendYield, minPeRatio, maxPeRatio,
        minRoe, maxRoe, maxNetDebtEbitda,
        sortBy, sortOrder,
      } = input

      const maxExport = (ctx as any).userPlan === 'elite' ? 500 : 100

      const ALL_ASSETS = await getAssets()
      // Foco 100% em ações brasileiras
      let filtered = ALL_ASSETS.filter(a => {
        const t = a.type as string
        return t !== 'fii' && t !== 'etf' && t !== 'bdr'
      })
      if (sectors?.length) filtered = filtered.filter(a => sectors.includes(a.sector))
      if (minScore !== undefined) filtered = filtered.filter(a => (a.aqScore?.scoreTotal ?? 0) >= minScore)
      if (maxScore !== undefined) filtered = filtered.filter(a => (a.aqScore?.scoreTotal ?? 0) <= maxScore)
      if (minDividendYield !== undefined) filtered = filtered.filter(a => a.fundamentals.dividendYield !== null && a.fundamentals.dividendYield >= minDividendYield)
      if (maxDividendYield !== undefined) filtered = filtered.filter(a => a.fundamentals.dividendYield !== null && a.fundamentals.dividendYield <= maxDividendYield)
      if (minPeRatio !== undefined) filtered = filtered.filter(a => a.fundamentals.peRatio !== null && a.fundamentals.peRatio >= minPeRatio)
      if (maxPeRatio !== undefined) filtered = filtered.filter(a => a.fundamentals.peRatio !== null && a.fundamentals.peRatio > 0 && a.fundamentals.peRatio <= maxPeRatio)
      if (minRoe !== undefined) filtered = filtered.filter(a => a.fundamentals.roe !== null && a.fundamentals.roe >= minRoe)
      if (maxRoe !== undefined) filtered = filtered.filter(a => a.fundamentals.roe !== null && a.fundamentals.roe <= maxRoe)
      if (maxNetDebtEbitda !== undefined) filtered = filtered.filter(a => a.fundamentals.netDebtEbitda === null || a.fundamentals.netDebtEbitda <= maxNetDebtEbitda)

      // Sort
      filtered.sort((a, b) => {
        let aVal: number | string = 0
        let bVal: number | string = 0
        switch (sortBy) {
          case 'ticker': aVal = a.ticker; bVal = b.ticker; break
          case 'name': aVal = a.name; bVal = b.name; break
          case 'scoreTotal': aVal = a.aqScore?.scoreTotal ?? 0; bVal = b.aqScore?.scoreTotal ?? 0; break
          case 'dividendYield': aVal = a.fundamentals.dividendYield ?? 0; bVal = b.fundamentals.dividendYield ?? 0; break
          case 'peRatio': aVal = a.fundamentals.peRatio ?? 9999; bVal = b.fundamentals.peRatio ?? 9999; break
          case 'roe': aVal = a.fundamentals.roe ?? 0; bVal = b.fundamentals.roe ?? 0; break
          default: aVal = a.aqScore?.scoreTotal ?? 0; bVal = b.aqScore?.scoreTotal ?? 0; break
        }
        if (typeof aVal === 'string' && typeof bVal === 'string') {
          return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
        }
        return sortOrder === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number)
      })

      const exported = filtered.slice(0, maxExport)

      const fmt = (v: number | null) => v != null ? String(v).replace('.', ',') : ''
      const header = 'Ticker;Nome;Setor;Tipo;Preco;IQ Score;P/L;P/VP;ROE;ROIC;Margem Liquida;DY;Div Liq/EBITDA;EV/EBITDA;Liq Corrente;Cresc Receita 5a'
      const rows = exported.map(a =>
        [
          a.ticker, `"${a.name}"`, `"${a.sector}"`, a.type,
          fmt(a.price), fmt(a.aqScore?.scoreTotal ?? null),
          fmt(a.fundamentals.peRatio), fmt(a.fundamentals.pbRatio),
          fmt(a.fundamentals.roe), fmt(a.fundamentals.roic),
          fmt(a.fundamentals.margemLiquida), fmt(a.fundamentals.dividendYield),
          fmt(a.fundamentals.netDebtEbitda), fmt(a.fundamentals.evEbitda),
          fmt(a.fundamentals.liquidezCorrente), fmt(a.fundamentals.crescimentoReceita5a),
        ].join(';')
      )

      return {
        csv: [header, ...rows].join('\n'),
        count: exported.length,
        maxExport,
      }
    }),

  // ─── Sector Heatmap ────────────────────────────────────
  // Groups assets by sector with avg daily change, avg score, count
  sectorHeatmap: publicProcedure.query(async () => {
    const sectorMap: Record<string, { changes: number[]; scores: number[]; tickers: string[] }> = {}

    const ALL_ASSETS = await getAssets()
    for (const a of ALL_ASSETS) {
      if (!sectorMap[a.sector]) sectorMap[a.sector] = { changes: [], scores: [], tickers: [] }
      const sectorEntry = sectorMap[a.sector]!
      sectorEntry.changes.push(a.changePercent)
      sectorEntry.scores.push(a.aqScore?.scoreTotal ?? 0)
      sectorEntry.tickers.push(a.ticker)
    }

    return Object.entries(sectorMap)
      .map(([sector, data]) => ({
        sector,
        count: data.tickers.length,
        avgChange: data.changes.length > 0 ? data.changes.reduce((a, b) => a + b, 0) / data.changes.length : 0,
        avgScore: data.scores.length > 0 ? data.scores.reduce((a, b) => a + b, 0) / data.scores.length : 0,
        topGainer: data.tickers[data.changes.indexOf(Math.max(...data.changes))] ?? data.tickers[0],
        topGainerChange: data.changes.length > 0 ? Math.max(...data.changes) : 0,
      }))
      .sort((a, b) => b.count - a.count)
  }),

  // ─── Score Movers ──────────────────────────────────────
  // Stocks with biggest real score changes.
  // Uses persisted score history snapshots when available (multi-day comparison).
  // Falls back to in-memory previous dataset (single refresh cycle) if no history.
  scoreMovers: publicProcedure
    .input(z.object({
      limit: z.number().min(1).max(20).default(10),
      days: z.number().min(1).max(90).default(7),
    }))
    .query(async ({ input }) => {
      const ALL_ASSETS = await getAssets()

      // Try history-based movers first (persisted snapshots)
      const snapshotCount = getSnapshotCount()
      if (snapshotCount >= 2) {
        const historyData = getHistoryMovers(input.days)
        if (historyData.gainers.length > 0 || historyData.losers.length > 0) {
          // Enrich with name/sector/price from current assets
          const assetMap = new Map(ALL_ASSETS.map(a => [a.ticker, a]))
          const allMovers = [...historyData.gainers, ...historyData.losers]
            .map(m => {
              const asset = assetMap.get(m.ticker)
              return {
                ticker: m.ticker,
                name: asset?.name ?? m.ticker,
                sector: asset?.sector ?? 'Outros',
                currentScore: m.current,
                previousScore: Math.round(m.previous * 10) / 10,
                delta: m.delta,
                price: asset?.price ?? 0,
                changePercent: asset?.changePercent ?? 0,
              }
            })
            .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
            .slice(0, input.limit)

          return {
            movers: allMovers,
            hasHistory: true,
            source: 'snapshots' as const,
            compareDate: historyData.compareDate,
            latestDate: historyData.latestDate,
          }
        }
      }

      // Fallback: in-memory previous dataset (single SWR cycle)
      const prevAssets = getPreviousAssets()
      if (!prevAssets || prevAssets.length === 0) {
        return {
          movers: [],
          hasHistory: false,
          source: 'none' as const,
          compareDate: null,
          latestDate: null,
        }
      }

      const prevScoreMap = new Map<string, number>()
      for (const a of prevAssets) {
        if (a.aqScore?.scoreTotal != null) {
          prevScoreMap.set(a.ticker, a.aqScore.scoreTotal)
        }
      }

      const movers = ALL_ASSETS
        .filter(a => (a.aqScore?.scoreTotal ?? 0) > 5 && prevScoreMap.has(a.ticker))
        .map(a => {
          const currentScore = a.aqScore?.scoreTotal ?? 0
          const previousScore = prevScoreMap.get(a.ticker) ?? currentScore
          const delta = Math.round((currentScore - previousScore) * 10) / 10
          return {
            ticker: a.ticker,
            name: a.name,
            sector: a.sector,
            currentScore,
            previousScore: Math.round(previousScore * 10) / 10,
            delta,
            price: a.price,
            changePercent: a.changePercent,
          }
        })
        .filter(m => m.delta !== 0)
        .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
        .slice(0, input.limit)

      return {
        movers,
        hasHistory: true,
        source: 'memory' as const,
        compareDate: null,
        latestDate: null,
      }
    }),

  // ─── Opportunities ─────────────────────────────────────
  // High IQ Score stocks NOT in user's portfolio
  opportunities: publicProcedure
    .input(z.object({
      limit: z.number().min(1).max(20).default(8),
      excludeTickers: z.array(z.string()).optional(),
    }))
    .query(async ({ input }) => {
      const { limit, excludeTickers = [] } = input
      const excludeSet = new Set(excludeTickers.map(t => t.toUpperCase()))

      const ALL_ASSETS = await getAssets()
      return ALL_ASSETS
        .filter(a => !excludeSet.has(a.ticker) && (a.aqScore?.scoreTotal ?? 0) >= 50)
        .sort((a, b) => (b.aqScore?.scoreTotal ?? 0) - (a.aqScore?.scoreTotal ?? 0))
        .slice(0, limit)
        .map(a => ({
          ticker: a.ticker,
          name: a.name,
          sector: a.sector,
          scoreTotal: a.aqScore?.scoreTotal ?? 0,
          scoreValuation: a.aqScore?.scoreValuation ?? 0,
          scoreQuality: a.aqScore?.scoreQuality ?? 0,
          dividendYield: a.fundamentals.dividendYield,
          roe: a.fundamentals.roe,
          price: a.price,
          changePercent: a.changePercent,
        }))
    }),

  // ─── Treemap Data ────────────────────────────────────────
  // Groups all assets by sector with market cap, score, and change data
  // for the interactive market treemap visualization
  treemapData: publicProcedure.query(async () => {
    const ALL_ASSETS = await getAssets()

    // Group by sector
    const sectorMap: Record<string, typeof ALL_ASSETS> = {}
    for (const a of ALL_ASSETS) {
      const sector = a.sector || 'Outros'
      if (!sectorMap[sector]) sectorMap[sector] = []
      sectorMap[sector]!.push(a)
    }

    let totalMarketCap = 0
    let totalStocks = 0
    let totalScoreSum = 0
    let totalScoreCount = 0
    let sectorsUp = 0
    let sectorsDown = 0

    const sectors = Object.entries(sectorMap).map(([name, stocks]) => {
      const sectorMarketCap = stocks.reduce((sum, s) => sum + (s.marketCap || 0), 0)
      const scoredStocks = stocks.filter(s => s.aqScore?.scoreTotal != null)
      const avgScore = scoredStocks.length > 0
        ? scoredStocks.reduce((sum, s) => sum + s.aqScore!.scoreTotal, 0) / scoredStocks.length
        : null
      const avgChange = stocks.reduce((sum, s) => sum + (s.changePercent || 0), 0) / stocks.length

      totalMarketCap += sectorMarketCap
      totalStocks += stocks.length
      if (avgScore != null) { totalScoreSum += avgScore * scoredStocks.length; totalScoreCount += scoredStocks.length }
      if (avgChange > 0) sectorsUp++; else if (avgChange < 0) sectorsDown++

      return {
        name,
        totalMarketCap: sectorMarketCap,
        averageScore: avgScore != null ? Math.round(avgScore * 10) / 10 : null,
        averageChange: Math.round(avgChange * 100) / 100,
        stockCount: stocks.length,
        stocks: stocks
          .filter(s => s.marketCap && s.marketCap > 0)
          .sort((a, b) => (b.marketCap || 0) - (a.marketCap || 0))
          .map(s => ({
            ticker: s.ticker,
            name: s.name,
            marketCap: s.marketCap || 0,
            changePercent: s.changePercent || 0,
            aqScore: s.aqScore?.scoreTotal ?? null,
            price: s.price,
            logo: s.logo ?? null,
          })),
      }
    }).sort((a, b) => b.totalMarketCap - a.totalMarketCap)

    return {
      sectors,
      totals: {
        marketCap: totalMarketCap,
        stockCount: totalStocks,
        averageScore: totalScoreCount > 0 ? Math.round((totalScoreSum / totalScoreCount) * 10) / 10 : null,
        sectorsUp,
        sectorsDown,
      },
    }
  }),

  // Market pulse — momentum macro signal + sector signals
  marketPulse: publicProcedure.query(async () => {
    return fetchMarketPulse()
  }),

  // Motor Recomenda — recomendações personalizadas
  recommendations: publicProcedure
    .input(z.object({
      mode: z.enum(['geral', 'valor', 'dividendos', 'crescimento', 'defensivo', 'momento']).default('geral'),
      excludeTickers: z.array(z.string()).optional(),
      limit: z.number().min(1).max(10).default(3),
    }))
    .query(async ({ input }) => {
      const assets = await getAssets()
      return generateRecommendations(
        assets,
        input.mode as RecommendationMode,
        input.excludeTickers ?? [],
        input.limit,
      )
    }),
})
