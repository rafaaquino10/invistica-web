// ─── Demo Portfolio Repository ───────────────────────────────

import { DEMO_PORTFOLIOS } from '@/lib/demo-data'
import { getAssets } from '@/lib/data-source'
import { TRPCError } from '@trpc/server'

function calculateBenchmarkReturn(annualRate: number, days: number): number {
  return (Math.pow(1 + annualRate, days / 365) - 1) * 100
}

export class DemoPortfolioRepo {
  async list(userId: string) {
    const ALL_ASSETS = await getAssets()
    return DEMO_PORTFOLIOS.map((p) => {
      const totalValue = p.positions.reduce((sum, pos) => {
        const livePrice = ALL_ASSETS.find(a => a.ticker === pos.ticker)?.price ?? pos.currentPrice
        return sum + pos.quantity * livePrice
      }, 0)
      const totalCost = p.positions.reduce((sum, pos) => sum + pos.quantity * pos.avgCost, 0)
      const gainLoss = totalValue - totalCost
      const gainLossPercent = totalCost > 0 ? (gainLoss / totalCost) * 100 : 0
      const avgAqScore = p.positions.length > 0
        ? p.positions.reduce((sum, pos) => {
            const asset = ALL_ASSETS.find(a => a.ticker === pos.ticker)
            return sum + (asset?.aqScore?.scoreTotal ?? 0)
          }, 0) / p.positions.length
        : 0

      // Top 3 posições por valor para preview no card
      const topPositions = p.positions
        .map(pos => {
          const asset = ALL_ASSETS.find(a => a.ticker === pos.ticker)
          const livePrice = asset?.price ?? pos.currentPrice
          return { ticker: pos.ticker, name: asset?.name ?? pos.ticker, value: pos.quantity * livePrice }
        })
        .sort((a, b) => b.value - a.value)
        .slice(0, 3)
        .map(({ ticker, name }) => ({ ticker, name }))

      return {
        id: p.id, name: p.name, description: p.description, isDefault: p.isDefault,
        positionsCount: p.positions.length, transactionsCount: p.positions.length,
        totalValue, totalCost, gainLoss, gainLossPercent, avgAqScore, topPositions,
      }
    })
  }

  async get(userId: string, id: string) {
    const ALL_ASSETS = await getAssets()
    const portfolio = DEMO_PORTFOLIOS.find(p => p.id === id)
    if (!portfolio) throw new TRPCError({ code: 'NOT_FOUND', message: 'Portfolio não encontrado' })

    const positions = portfolio.positions.map((pos, index) => {
      const asset = ALL_ASSETS.find(a => a.ticker === pos.ticker)
      const livePrice = asset?.price ?? pos.currentPrice
      const currentValue = pos.quantity * livePrice
      const totalCost = pos.quantity * pos.avgCost
      const gainLoss = currentValue - totalCost
      const gainLossPercent = totalCost > 0 ? (gainLoss / totalCost) * 100 : 0
      return {
        id: `pos-${index}`, ticker: pos.ticker, name: asset?.name ?? pos.ticker,
        type: asset?.type ?? 'stock', sector: asset?.sector ?? null,
        quantity: pos.quantity, avgCost: pos.avgCost, totalCost, currentPrice: livePrice,
        currentValue, gainLoss, gainLossPercent,
        aqScore: asset?.aqScore?.scoreTotal ?? null,
        dividendYield: asset?.fundamentals.dividendYield ?? null,
      }
    })

    const totalValue = positions.reduce((sum, p) => sum + p.currentValue, 0)
    const totalCost = positions.reduce((sum, p) => sum + p.totalCost, 0)
    const totalGainLoss = totalValue - totalCost
    const totalGainLossPercent = totalCost > 0 ? (totalGainLoss / totalCost) * 100 : 0

    const allocationByType = positions.reduce((acc, p) => {
      const type = p.type
      if (!acc[type]) acc[type] = { value: 0, percent: 0 }
      acc[type].value += p.currentValue
      return acc
    }, {} as Record<string, { value: number; percent: number }>)
    for (const type in allocationByType) {
      allocationByType[type]!.percent = totalValue > 0 ? (allocationByType[type]!.value / totalValue) * 100 : 0
    }

    const allocationBySector = positions.reduce((acc, p) => {
      const sector = p.sector ?? 'Outros'
      if (!acc[sector]) acc[sector] = { value: 0, percent: 0 }
      acc[sector].value += p.currentValue
      return acc
    }, {} as Record<string, { value: number; percent: number }>)
    for (const sector in allocationBySector) {
      allocationBySector[sector]!.percent = totalValue > 0 ? (allocationBySector[sector]!.value / totalValue) * 100 : 0
    }

    const avgAqScore = positions.reduce((sum, p) => {
      if (p.aqScore !== null) return sum + p.aqScore * (p.currentValue / totalValue)
      return sum
    }, 0)

    return {
      id: portfolio.id, name: portfolio.name, description: portfolio.description,
      isDefault: portfolio.isDefault, targetAllocation: null, positions,
      transactions: portfolio.positions.map((pos, i) => ({
        id: `tx-${i}`, ticker: pos.ticker, type: 'BUY',
        date: new Date(Date.now() - i * 30 * 24 * 60 * 60 * 1000),
        quantity: pos.quantity, price: pos.avgCost,
        total: pos.quantity * pos.avgCost, fees: 0, notes: null,
      })),
      summary: {
        totalValue, totalCost, totalGainLoss, totalGainLossPercent,
        positionsCount: positions.length, avgAqScore, allocationByType, allocationBySector,
      },
    }
  }

  async create(userId: string, data: { name: string; description?: string; isDefault: boolean }) {
    return {
      id: `demo-portfolio-${Date.now()}`, name: data.name,
      description: data.description ?? null, isDefault: data.isDefault,
      userId, createdAt: new Date(), updatedAt: new Date(), targetAllocation: null,
    }
  }

  async update(userId: string, id: string, data: any) {
    const portfolio = DEMO_PORTFOLIOS.find(p => p.id === id)
    return {
      id, name: data.name ?? portfolio?.name ?? 'Portfolio',
      description: data.description ?? portfolio?.description ?? null,
      isDefault: data.isDefault ?? portfolio?.isDefault ?? false,
      userId, createdAt: new Date(), updatedAt: new Date(),
      targetAllocation: data.targetAllocation ?? null,
    }
  }

  async delete(_userId: string, id: string) {
    return { id }
  }

  async addTransaction(_userId: string, data: any) {
    return {
      id: `tx-${Date.now()}`, portfolioId: data.portfolioId, assetId: 'demo-asset',
      type: data.type, date: data.date, quantity: data.quantity, price: data.price,
      total: data.quantity * data.price + data.fees, fees: data.fees,
      notes: data.notes ?? null, createdAt: new Date(),
    }
  }

  async deleteTransaction() {
    return { success: true }
  }

  async getPerformance(_userId: string, _portfolioId: string, period: string, cdiRate: number, ibovRate: number) {
    const now = new Date()
    const periodDays = period === '1M' ? 30 : period === '3M' ? 90
      : period === '6M' ? 180 : period === 'YTD'
        ? Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) / 86400000)
        : 365
    const startValue = 100000
    const endValue = 125430
    const percentReturn = ((endValue - startValue) / startValue) * 100
    const cdiReturn = calculateBenchmarkReturn(cdiRate, periodDays)
    const ibovReturn = calculateBenchmarkReturn(ibovRate, periodDays)
    return {
      period, startDate: new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000),
      endDate: now, startValue, endValue, absoluteReturn: endValue - startValue, percentReturn,
      benchmarks: {
        cdi: { percentReturn: cdiReturn, absoluteReturn: startValue * cdiReturn / 100 },
        ibov: { percentReturn: ibovReturn, absoluteReturn: startValue * ibovReturn / 100 },
      },
    }
  }

  async getPositionTickers() {
    return DEMO_PORTFOLIOS.flatMap(p =>
      p.positions.map(pos => ({ ticker: pos.ticker, quantity: pos.quantity })),
    )
  }
}
