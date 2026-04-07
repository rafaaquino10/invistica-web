/**
 * Data Ingestion Pipeline
 *
 * Orchestrates data fetching from various sources and stores it in the database.
 * Can be run as a scheduled job or triggered manually.
 */

import { PrismaClient } from '@prisma/client'
import { fetchQuote, fetchQuotes, fetchDividends, fetchHistoricalData } from './brapi-client'
import { fetchCompanyInfo, fetchFundamentals, fetchFundamentalsHistory } from './cvm-client'
import { calculateAssetScore } from '../scoring/scoring-service'
import { logger } from '../utils/logger'

const prisma = new PrismaClient()

interface IngestionResult {
  ticker: string
  success: boolean
  quotesUpdated: number
  fundamentalsUpdated: number
  dividendsUpdated: number
  scoreCalculated: boolean
  error?: string
}

interface PipelineResult {
  startedAt: Date
  completedAt: Date
  totalAssets: number
  successCount: number
  errorCount: number
  results: IngestionResult[]
}

/**
 * Ingest data for a single asset
 */
export async function ingestAsset(ticker: string): Promise<IngestionResult> {
  const result: IngestionResult = {
    ticker,
    success: false,
    quotesUpdated: 0,
    fundamentalsUpdated: 0,
    dividendsUpdated: 0,
    scoreCalculated: false,
  }

  try {
    // Get or create asset
    let asset = await prisma.asset.findUnique({
      where: { ticker: ticker.toUpperCase() },
    })

    if (!asset) {
      // Fetch company info to create asset
      const companyInfo = await fetchCompanyInfo(ticker)

      if (!companyInfo) {
        throw new Error('Could not fetch company info')
      }

      asset = await prisma.asset.create({
        data: {
          ticker: ticker.toUpperCase(),
          name: companyInfo.nomeComercial || companyInfo.razaoSocial,
          type: determineAssetType(ticker),
          sector: companyInfo.setor,
          isin: null,
          isActive: true,
        },
      })
    }

    // Fetch and store current quote
    const quote = await fetchQuote(ticker)
    if (quote) {
      await prisma.quote.upsert({
        where: {
          assetId_date: {
            assetId: asset.id,
            date: new Date(),
          },
        },
        create: {
          assetId: asset.id,
          date: new Date(),
          open: quote.regularMarketOpen,
          high: quote.regularMarketDayHigh,
          low: quote.regularMarketDayLow,
          close: quote.regularMarketPrice,
          volume: quote.regularMarketVolume,
          changePercent: quote.regularMarketChangePercent,
        },
        update: {
          open: quote.regularMarketOpen,
          high: quote.regularMarketDayHigh,
          low: quote.regularMarketDayLow,
          close: quote.regularMarketPrice,
          volume: quote.regularMarketVolume,
          changePercent: quote.regularMarketChangePercent,
        },
      })
      result.quotesUpdated++
    }

    // Fetch and store historical quotes
    const historicalData = await fetchHistoricalData(ticker, { range: '1y' })
    for (const data of historicalData) {
      const date = new Date(data.date * 1000) // Convert timestamp to Date

      await prisma.quote.upsert({
        where: {
          assetId_date: {
            assetId: asset.id,
            date,
          },
        },
        create: {
          assetId: asset.id,
          date,
          open: data.open,
          high: data.high,
          low: data.low,
          close: data.close,
          volume: data.volume,
          adjustedClose: data.adjustedClose,
        },
        update: {
          open: data.open,
          high: data.high,
          low: data.low,
          close: data.close,
          volume: data.volume,
          adjustedClose: data.adjustedClose,
        },
      })
      result.quotesUpdated++
    }

    // Fetch and store fundamentals
    const fundamentals = await fetchFundamentals(ticker)
    if (fundamentals) {
      await prisma.fundamental.upsert({
        where: {
          assetId_referenceDate_periodType: {
            assetId: asset.id,
            referenceDate: new Date(fundamentals.referenceDate),
            periodType: fundamentals.periodType,
          },
        },
        create: {
          assetId: asset.id,
          referenceDate: new Date(fundamentals.referenceDate),
          periodType: fundamentals.periodType,
          peRatio: fundamentals.peRatio,
          pbRatio: fundamentals.pbRatio,
          evEbitda: fundamentals.evEbitda,
          roe: fundamentals.roe,
          roic: fundamentals.roic,
          roa: fundamentals.roa,
          netMargin: fundamentals.netMargin,
          ebitdaMargin: fundamentals.ebitdaMargin,
          grossMargin: fundamentals.grossMargin,
          eps: fundamentals.eps,
          bvps: fundamentals.bvps,
          dividendYield: fundamentals.dividendYield,
          payoutRatio: fundamentals.payoutRatio,
          currentRatio: fundamentals.currentRatio,
          quickRatio: fundamentals.quickRatio,
          netDebtEbitda: fundamentals.netDebtEbitda,
          debtToEquity: fundamentals.debtToEquity,
          revenue: fundamentals.revenue,
          ebitda: fundamentals.ebitda,
          netIncome: fundamentals.netIncome,
          totalAssets: fundamentals.totalAssets,
          totalEquity: fundamentals.totalEquity,
        },
        update: {
          peRatio: fundamentals.peRatio,
          pbRatio: fundamentals.pbRatio,
          evEbitda: fundamentals.evEbitda,
          roe: fundamentals.roe,
          roic: fundamentals.roic,
          roa: fundamentals.roa,
          netMargin: fundamentals.netMargin,
          ebitdaMargin: fundamentals.ebitdaMargin,
          grossMargin: fundamentals.grossMargin,
          eps: fundamentals.eps,
          bvps: fundamentals.bvps,
          dividendYield: fundamentals.dividendYield,
          payoutRatio: fundamentals.payoutRatio,
          currentRatio: fundamentals.currentRatio,
          quickRatio: fundamentals.quickRatio,
          netDebtEbitda: fundamentals.netDebtEbitda,
          debtToEquity: fundamentals.debtToEquity,
          revenue: fundamentals.revenue,
          ebitda: fundamentals.ebitda,
          netIncome: fundamentals.netIncome,
          totalAssets: fundamentals.totalAssets,
          totalEquity: fundamentals.totalEquity,
        },
      })
      result.fundamentalsUpdated++
    }

    // Fetch and store dividends
    const dividends = await fetchDividends(ticker, { range: '2y' })
    for (const div of dividends) {
      const exDate = new Date(div.exDate)
      const type = div.type

      await prisma.dividend.upsert({
        where: {
          assetId_exDate_type: { assetId: asset.id, exDate, type },
        },
        create: {
          assetId: asset.id,
          type,
          valuePerShare: div.value,
          exDate,
          paymentDate: new Date(div.paymentDate),
        },
        update: {
          valuePerShare: div.value,
          paymentDate: new Date(div.paymentDate),
        },
      })
      result.dividendsUpdated++
    }

    // Calculate IQ Score
    try {
      await calculateAssetScore(prisma, ticker, { forceRecalculate: true, saveToDB: true })
      result.scoreCalculated = true
    } catch (scoreError) {
      console.error(`Failed to calculate score for ${ticker}:`, scoreError)
    }

    result.success = true
  } catch (error) {
    result.error = error instanceof Error ? error.message : 'Unknown error'
    console.error(`Error ingesting ${ticker}:`, error)
  }

  return result
}

/**
 * Run full data ingestion pipeline for all active assets
 */
export async function runPipeline(options?: {
  tickers?: string[]
  batchSize?: number
  delayMs?: number
}): Promise<PipelineResult> {
  const { tickers, batchSize = 10, delayMs = 1000 } = options ?? {}

  const startedAt = new Date()
  const results: IngestionResult[] = []

  // Get assets to process
  let assetsToProcess: { ticker: string }[]

  if (tickers?.length) {
    assetsToProcess = tickers.map((t) => ({ ticker: t }))
  } else {
    assetsToProcess = await prisma.asset.findMany({
      where: { isActive: true },
      select: { ticker: true },
    })
  }

  logger.info(`Starting pipeline for ${assetsToProcess.length} assets...`)

  // Process in batches with delay
  for (let i = 0; i < assetsToProcess.length; i += batchSize) {
    const batch = assetsToProcess.slice(i, i + batchSize)

    logger.info(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(assetsToProcess.length / batchSize)}...`)

    const batchResults = await Promise.all(
      batch.map((asset) => ingestAsset(asset.ticker))
    )

    results.push(...batchResults)

    // Delay between batches to avoid rate limiting
    if (i + batchSize < assetsToProcess.length) {
      await new Promise((resolve) => setTimeout(resolve, delayMs))
    }
  }

  const completedAt = new Date()

  return {
    startedAt,
    completedAt,
    totalAssets: assetsToProcess.length,
    successCount: results.filter((r) => r.success).length,
    errorCount: results.filter((r) => !r.success).length,
    results,
  }
}

/**
 * Determine asset type from ticker
 */
function determineAssetType(ticker: string): 'stock' | 'fii' | 'etf' | 'bdr' {
  const upperTicker = ticker.toUpperCase()

  // FIIs end with 11
  if (upperTicker.endsWith('11')) {
    return 'fii'
  }

  // BDRs end with 34 or 35
  if (upperTicker.endsWith('34') || upperTicker.endsWith('35')) {
    return 'bdr'
  }

  // ETFs have specific patterns (BOVA11, IVVB11, etc. but those are already 11)
  // Most ETFs are 11 suffix, handled above
  // Some ETFs like HASH11, QETH11 etc.

  // Default to stock
  return 'stock'
}

/**
 * Schedule pipeline to run at specific intervals
 * This would typically be called from a cron job
 */
export async function scheduledPipeline(type: 'quotes' | 'fundamentals' | 'full') {
  logger.info(`Running scheduled ${type} pipeline at ${new Date().toISOString()}`)

  switch (type) {
    case 'quotes':
      // Update quotes only (faster, can run more frequently)
      const assets = await prisma.asset.findMany({
        where: { isActive: true },
        select: { ticker: true },
      })

      const quotes = await fetchQuotes(assets.map((a) => a.ticker))

      for (const [ticker, quote] of quotes) {
        const asset = await prisma.asset.findUnique({
          where: { ticker },
        })

        if (asset) {
          await prisma.quote.upsert({
            where: {
              assetId_date: {
                assetId: asset.id,
                date: new Date(),
              },
            },
            create: {
              assetId: asset.id,
              date: new Date(),
              open: quote.regularMarketOpen,
              high: quote.regularMarketDayHigh,
              low: quote.regularMarketDayLow,
              close: quote.regularMarketPrice,
              volume: quote.regularMarketVolume,
              changePercent: quote.regularMarketChangePercent,
            },
            update: {
              close: quote.regularMarketPrice,
              high: quote.regularMarketDayHigh,
              low: quote.regularMarketDayLow,
              volume: quote.regularMarketVolume,
              changePercent: quote.regularMarketChangePercent,
            },
          })
        }
      }
      break

    case 'fundamentals':
      // Update fundamentals only (slower, run less frequently)
      await runPipeline({ batchSize: 5, delayMs: 2000 })
      break

    case 'full':
      // Full pipeline
      await runPipeline()
      break
  }

  logger.info(`Completed ${type} pipeline at ${new Date().toISOString()}`)
}
