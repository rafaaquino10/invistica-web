/**
 * IQ Score™ Calculation Service
 *
 * This service handles the calculation and storage of IQ Scores for assets.
 * It can be called from data pipelines or API endpoints.
 */

import { PrismaClient } from '@prisma/client'
import { calculateIQScore, type FundamentalData } from './iq-score'

const SCORE_VERSION = 'v1'

interface CalculateScoreOptions {
  forceRecalculate?: boolean
  saveToDB?: boolean
}

/**
 * Calculate and optionally save IQ Score for a single asset
 */
export async function calculateAssetScore(
  prisma: PrismaClient,
  ticker: string,
  options: CalculateScoreOptions = {}
) {
  const { forceRecalculate = false, saveToDB = true } = options

  // Get asset with fundamentals
  const asset = await prisma.asset.findUnique({
    where: { ticker: ticker.toUpperCase() },
    include: {
      fundamentals: {
        where: { periodType: 'annual' },
        orderBy: { referenceDate: 'desc' },
        take: 2, // Current and previous year for growth calculation
      },
      aqScores: {
        where: { version: SCORE_VERSION },
        orderBy: { calculatedAt: 'desc' },
        take: 1,
      },
      quotes: {
        orderBy: { date: 'desc' },
        take: 252, // 1 year of trading days for volatility
      },
    },
  })

  if (!asset) {
    throw new Error(`Asset ${ticker} not found`)
  }

  // Check if we already have a recent score
  const existingScore = asset.aqScores[0]
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)

  if (!forceRecalculate && existingScore && existingScore.calculatedAt > oneHourAgo) {
    return {
      ticker: asset.ticker,
      scoreTotal: Number(existingScore.scoreTotal),
      scoreValuation: Number(existingScore.scoreValuation),
      scoreQuality: Number(existingScore.scoreQuality),
      scoreGrowth: Number(existingScore.scoreGrowth),
      scoreDividends: Number(existingScore.scoreDividends),
      scoreRisk: Number(existingScore.scoreRisk),
      cached: true,
    }
  }

  // Get current and previous fundamentals
  const currentFund = asset.fundamentals[0]
  const previousFund = asset.fundamentals[1]

  if (!currentFund) {
    return {
      ticker: asset.ticker,
      error: 'No fundamental data available',
      scoreTotal: null,
    }
  }

  // Calculate growth metrics
  let revenueGrowth: number | null = null
  let earningsGrowth: number | null = null

  if (previousFund) {
    if (currentFund.revenue && previousFund.revenue && Number(previousFund.revenue) !== 0) {
      revenueGrowth = (Number(currentFund.revenue) - Number(previousFund.revenue)) / Math.abs(Number(previousFund.revenue))
    }
    if (currentFund.netIncome && previousFund.netIncome && Number(previousFund.netIncome) !== 0) {
      earningsGrowth = (Number(currentFund.netIncome) - Number(previousFund.netIncome)) / Math.abs(Number(previousFund.netIncome))
    }
  }

  // Calculate volatility from price history
  let volatility252d: number | null = null
  if (asset.quotes.length >= 20) {
    const returns: number[] = []
    for (let i = 1; i < asset.quotes.length; i++) {
      const currentQuote = asset.quotes[i - 1]
      const previousQuote = asset.quotes[i]
      if (!currentQuote || !previousQuote) continue
      const currentPrice = Number(currentQuote.close)
      const previousPrice = Number(previousQuote.close)
      if (previousPrice > 0) {
        returns.push(Math.log(currentPrice / previousPrice))
      }
    }

    if (returns.length > 0) {
      const mean = returns.reduce((a, b) => a + b, 0) / returns.length
      const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length
      volatility252d = Math.sqrt(variance) * Math.sqrt(252) // Annualized volatility
    }
  }

  // Prepare fundamental data for scoring
  const fundamentalData: FundamentalData = {
    peRatio: currentFund.peRatio ? Number(currentFund.peRatio) : null,
    pbRatio: currentFund.pbRatio ? Number(currentFund.pbRatio) : null,
    evEbitda: currentFund.evEbitda ? Number(currentFund.evEbitda) : null,
    roe: currentFund.roe ? Number(currentFund.roe) : null,
    roic: currentFund.roic ? Number(currentFund.roic) : null,
    netMargin: currentFund.netMargin ? Number(currentFund.netMargin) : null,
    ebitdaMargin: currentFund.ebitdaMargin ? Number(currentFund.ebitdaMargin) : null,
    revenueGrowth,
    earningsGrowth,
    dividendYield: currentFund.dividendYield ? Number(currentFund.dividendYield) : null,
    payoutRatio: currentFund.payoutRatio ? Number(currentFund.payoutRatio) : null,
    netDebtEbitda: currentFund.netDebtEbitda ? Number(currentFund.netDebtEbitda) : null,
    volatility252d,
  }

  // Calculate score
  const scoreResult = calculateIQScore(fundamentalData)

  // Save to database if requested
  if (saveToDB) {
    await prisma.aqScore.upsert({
      where: {
        assetId_version: {
          assetId: asset.id,
          version: SCORE_VERSION,
        },
      },
      create: {
        assetId: asset.id,
        version: SCORE_VERSION,
        scoreTotal: scoreResult.scoreTotal,
        scoreValuation: scoreResult.scoreValuation,
        scoreQuality: scoreResult.scoreQuality,
        scoreGrowth: scoreResult.scoreGrowth,
        scoreDividends: scoreResult.scoreDividends,
        scoreRisk: scoreResult.scoreRisk,
        metadata: scoreResult.breakdown as any,
        calculatedAt: new Date(),
      },
      update: {
        scoreTotal: scoreResult.scoreTotal,
        scoreValuation: scoreResult.scoreValuation,
        scoreQuality: scoreResult.scoreQuality,
        scoreGrowth: scoreResult.scoreGrowth,
        scoreDividends: scoreResult.scoreDividends,
        scoreRisk: scoreResult.scoreRisk,
        metadata: scoreResult.breakdown as any,
        calculatedAt: new Date(),
      },
    })
  }

  return {
    ticker: asset.ticker,
    ...scoreResult,
    cached: false,
  }
}

/**
 * Calculate scores for all active assets
 */
export async function calculateAllScores(
  prisma: PrismaClient,
  options: CalculateScoreOptions & { batchSize?: number } = {}
) {
  const { batchSize = 50 } = options

  const assets = await prisma.asset.findMany({
    where: { isActive: true },
    select: { ticker: true },
  })

  const results: Array<{ ticker: string; scoreTotal: number | null; error?: string }> = []

  // Process in batches
  for (let i = 0; i < assets.length; i += batchSize) {
    const batch = assets.slice(i, i + batchSize)

    const batchResults = await Promise.all(
      batch.map(async (asset) => {
        try {
          return await calculateAssetScore(prisma, asset.ticker, options)
        } catch (error) {
          return {
            ticker: asset.ticker,
            scoreTotal: null,
            error: error instanceof Error ? error.message : 'Unknown error',
          }
        }
      })
    )

    results.push(...batchResults)
  }

  return {
    total: assets.length,
    calculated: results.filter((r) => r.scoreTotal !== null).length,
    errors: results.filter((r) => r.error).length,
    results,
  }
}

/**
 * Get top-scored assets by category
 */
export async function getTopScoredAssets(
  prisma: PrismaClient,
  options: {
    type?: 'stock' | 'fii' | 'etf' | 'bdr'
    pillar?: 'scoreTotal' | 'scoreValuation' | 'scoreQuality' | 'scoreGrowth' | 'scoreDividends' | 'scoreRisk'
    limit?: number
  } = {}
) {
  const { type, pillar = 'scoreTotal', limit = 10 } = options

  const scores = await prisma.aqScore.findMany({
    where: {
      version: SCORE_VERSION,
      asset: {
        isActive: true,
        ...(type && { type }),
      },
    },
    include: {
      asset: {
        select: {
          ticker: true,
          name: true,
          type: true,
          sector: true,
        },
      },
    },
    orderBy: {
      [pillar]: 'desc',
    },
    take: limit,
  })

  return scores.map((score, index) => ({
    rank: index + 1,
    ticker: score.asset.ticker,
    name: score.asset.name,
    type: score.asset.type,
    sector: score.asset.sector,
    score: Number(score[pillar]),
    scoreTotal: Number(score.scoreTotal),
  }))
}
