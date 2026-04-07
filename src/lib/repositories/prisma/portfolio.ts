// ─── Prisma Portfolio Repository ─────────────────────────────

import type { PrismaClient } from '@prisma/client'
import { TRPCError } from '@trpc/server'
import { serializePrismaObject } from '@/lib/utils/prisma-helpers'

// FIFO calculation for cost basis
function calculateFIFO(transactions: Array<{ type: string; quantity: number; price: number; date: Date }>) {
  const buyQueue: Array<{ quantity: number; price: number; date: Date }> = []
  let totalCost = 0, totalQuantity = 0

  const sorted = [...transactions].sort((a, b) => a.date.getTime() - b.date.getTime())
  for (const tx of sorted) {
    if (tx.type === 'BUY') {
      buyQueue.push({ quantity: tx.quantity, price: tx.price, date: tx.date })
      totalCost += tx.quantity * tx.price
      totalQuantity += tx.quantity
    } else if (tx.type === 'SELL') {
      let remainingToSell = tx.quantity
      let costBasis = 0
      while (remainingToSell > 0 && buyQueue.length > 0) {
        const oldest = buyQueue[0]!
        if (oldest.quantity <= remainingToSell) {
          costBasis += oldest.quantity * oldest.price
          remainingToSell -= oldest.quantity
          buyQueue.shift()
        } else {
          costBasis += remainingToSell * oldest.price
          oldest.quantity -= remainingToSell
          remainingToSell = 0
        }
      }
      totalQuantity -= tx.quantity
      totalCost -= costBasis
    }
  }
  return { avgCost: totalQuantity > 0 ? totalCost / totalQuantity : 0, totalCost, totalQuantity }
}

function calculateBenchmarkReturn(annualRate: number, days: number): number {
  return (Math.pow(1 + annualRate, days / 365) - 1) * 100
}

export class PrismaPortfolioRepo {
  constructor(private prisma: PrismaClient) {}

  async list(userId: string) {
    const portfolios = await this.prisma.portfolio.findMany({
      where: { userId },
      include: {
        positions: {
          include: {
            asset: {
              include: {
                quotes: { take: 1, orderBy: { date: 'desc' } },
                aqScores: { where: { version: 'v1' }, take: 1, orderBy: { calculatedAt: 'desc' } },
              },
            },
          },
        },
        _count: { select: { transactions: true } },
      },
      orderBy: { createdAt: 'asc' },
    })

    return portfolios.map((p) => {
      const totalValue = p.positions.reduce((sum, pos) => {
        const price = pos.asset.quotes[0]?.close ?? 0
        return sum + Number(pos.quantity) * Number(price)
      }, 0)
      const totalCost = p.positions.reduce((sum, pos) => sum + Number(pos.totalCost), 0)
      const gainLoss = totalValue - totalCost
      const gainLossPercent = totalCost > 0 ? (gainLoss / totalCost) * 100 : 0
      const avgAqScore = p.positions.length > 0
        ? p.positions.reduce((sum, pos) => sum + Number(pos.asset.aqScores[0]?.scoreTotal ?? 0), 0) / p.positions.length
        : 0
      // Top 3 posições por valor para preview no card
      const topPositions = p.positions
        .map(pos => {
          const price = Number(pos.asset.quotes[0]?.close ?? 0)
          return { ticker: pos.asset.ticker, name: pos.asset.name, value: Number(pos.quantity) * price }
        })
        .sort((a, b) => b.value - a.value)
        .slice(0, 3)
        .map(({ ticker, name }) => ({ ticker, name }))

      return {
        id: p.id, name: p.name, description: p.description, isDefault: p.isDefault,
        positionsCount: p.positions.length, transactionsCount: p._count.transactions,
        totalValue, totalCost, gainLoss, gainLossPercent, avgAqScore, topPositions,
      }
    })
  }

  async get(userId: string, id: string) {
    const portfolio = await this.prisma.portfolio.findFirst({
      where: { id, userId },
      include: {
        positions: {
          include: {
            asset: {
              include: {
                quotes: { take: 1, orderBy: { date: 'desc' } },
                aqScores: { where: { version: 'v1' }, take: 1, orderBy: { calculatedAt: 'desc' } },
                fundamentals: { where: { periodType: 'annual' }, take: 1, orderBy: { referenceDate: 'desc' } },
              },
            },
          },
        },
        transactions: { include: { asset: true }, orderBy: { date: 'desc' } },
      },
    })
    if (!portfolio) throw new TRPCError({ code: 'NOT_FOUND', message: 'Portfolio não encontrado' })

    const positions = portfolio.positions.map((pos) => {
      const currentPrice = pos.asset.quotes[0]?.close ? Number(pos.asset.quotes[0].close) : 0
      const quantity = Number(pos.quantity)
      const avgCost = Number(pos.avgCost)
      const totalCost = Number(pos.totalCost)
      const currentValue = quantity * currentPrice
      const gainLoss = currentValue - totalCost
      const gainLossPercent = totalCost > 0 ? (gainLoss / totalCost) * 100 : 0
      return {
        id: pos.id, ticker: pos.asset.ticker, name: pos.asset.name,
        type: pos.asset.type, sector: pos.asset.sector,
        quantity, avgCost, totalCost, currentPrice, currentValue, gainLoss, gainLossPercent,
        aqScore: pos.asset.aqScores[0] ? Number(pos.asset.aqScores[0].scoreTotal) : null,
        dividendYield: pos.asset.fundamentals[0]?.dividendYield ? Number(pos.asset.fundamentals[0].dividendYield) : null,
      }
    })

    const totalValue = positions.reduce((sum, p) => sum + p.currentValue, 0)
    const totalCost = positions.reduce((sum, p) => sum + p.totalCost, 0)
    const totalGainLoss = totalValue - totalCost
    const totalGainLossPercent = totalCost > 0 ? (totalGainLoss / totalCost) * 100 : 0

    const allocationByType = positions.reduce((acc, p) => {
      if (!acc[p.type]) acc[p.type] = { value: 0, percent: 0 }
      acc[p.type]!.value += p.currentValue
      return acc
    }, {} as Record<string, { value: number; percent: number }>)
    for (const type in allocationByType) {
      allocationByType[type]!.percent = totalValue > 0 ? (allocationByType[type]!.value / totalValue) * 100 : 0
    }

    const allocationBySector = positions.reduce((acc, p) => {
      const sector = p.sector ?? 'Outros'
      if (!acc[sector]) acc[sector] = { value: 0, percent: 0 }
      acc[sector]!.value += p.currentValue
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
      isDefault: portfolio.isDefault, targetAllocation: portfolio.targetAllocation,
      positions,
      transactions: portfolio.transactions.map((tx) => ({
        id: tx.id, ticker: tx.asset.ticker, type: tx.type, date: tx.date,
        quantity: Number(tx.quantity), price: Number(tx.price),
        total: Number(tx.total), fees: Number(tx.fees), notes: tx.notes,
      })),
      summary: {
        totalValue, totalCost, totalGainLoss, totalGainLossPercent,
        positionsCount: positions.length, avgAqScore, allocationByType, allocationBySector,
      },
    }
  }

  async create(userId: string, data: { name: string; description?: string; isDefault: boolean }) {
    if (data.isDefault) {
      await this.prisma.portfolio.updateMany({ where: { userId }, data: { isDefault: false } })
    }
    const created = await this.prisma.portfolio.create({
      data: { userId, name: data.name, description: data.description, isDefault: data.isDefault },
    })
    return serializePrismaObject(created)
  }

  async update(userId: string, id: string, data: any) {
    const portfolio = await this.prisma.portfolio.findFirst({ where: { id, userId } })
    if (!portfolio) throw new TRPCError({ code: 'NOT_FOUND', message: 'Portfolio não encontrado' })
    if (data.isDefault) {
      await this.prisma.portfolio.updateMany({ where: { userId, id: { not: id } }, data: { isDefault: false } })
    }
    const updated = await this.prisma.portfolio.update({
      where: { id },
      data: { name: data.name, description: data.description, isDefault: data.isDefault, targetAllocation: data.targetAllocation },
    })
    return serializePrismaObject(updated)
  }

  async delete(userId: string, id: string) {
    const portfolio = await this.prisma.portfolio.findFirst({ where: { id, userId } })
    if (!portfolio) throw new TRPCError({ code: 'NOT_FOUND', message: 'Portfolio não encontrado' })
    const deleted = await this.prisma.portfolio.delete({ where: { id } })
    return serializePrismaObject(deleted)
  }

  async addTransaction(userId: string, data: any) {
    const portfolio = await this.prisma.portfolio.findFirst({ where: { id: data.portfolioId, userId } })
    if (!portfolio) throw new TRPCError({ code: 'NOT_FOUND', message: 'Portfolio não encontrado' })
    const normalizedTicker = data.ticker.trim().toUpperCase()
    let asset = await this.prisma.asset.findUnique({ where: { ticker: normalizedTicker } })
    if (!asset) {
      // Auto-create asset stub so users can add any valid ticker
      try {
        asset = await this.prisma.asset.create({
          data: { ticker: normalizedTicker, name: normalizedTicker, type: 'stock', sector: null },
        })
      } catch {
        // Unique constraint race — try to find again
        asset = await this.prisma.asset.findUnique({ where: { ticker: normalizedTicker } })
      }
      if (!asset) {
        throw new TRPCError({ code: 'NOT_FOUND', message: `Ativo ${normalizedTicker} não encontrado. Verifique o ticker e tente novamente.` })
      }
    }

    const total = data.quantity * data.price + data.fees
    const transaction = await this.prisma.transaction.create({
      data: {
        portfolioId: data.portfolioId, assetId: asset.id, type: data.type,
        date: data.date, quantity: data.quantity, price: data.price, total, fees: data.fees, notes: data.notes,
      },
    })

    const allTx = await this.prisma.transaction.findMany({
      where: { portfolioId: data.portfolioId, assetId: asset.id }, orderBy: { date: 'asc' },
    })
    const fifo = calculateFIFO(allTx.map((tx) => ({
      type: tx.type, quantity: Number(tx.quantity), price: Number(tx.price), date: tx.date,
    })))
    await this.prisma.position.upsert({
      where: { portfolioId_assetId: { portfolioId: data.portfolioId, assetId: asset.id } },
      create: { portfolioId: data.portfolioId, assetId: asset.id, quantity: fifo.totalQuantity, avgCost: fifo.avgCost, totalCost: fifo.totalCost },
      update: { quantity: fifo.totalQuantity, avgCost: fifo.avgCost, totalCost: fifo.totalCost },
    })
    return serializePrismaObject(transaction)
  }

  async deleteTransaction(userId: string, id: string) {
    const transaction = await this.prisma.transaction.findFirst({
      where: { id }, include: { portfolio: true },
    })
    if (!transaction || transaction.portfolio.userId !== userId) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Transação não encontrada' })
    }
    await this.prisma.transaction.delete({ where: { id } })
    const remaining = await this.prisma.transaction.findMany({
      where: { portfolioId: transaction.portfolioId, assetId: transaction.assetId }, orderBy: { date: 'asc' },
    })
    if (remaining.length === 0) {
      await this.prisma.position.delete({
        where: { portfolioId_assetId: { portfolioId: transaction.portfolioId, assetId: transaction.assetId } },
      })
    } else {
      const fifo = calculateFIFO(remaining.map((tx) => ({
        type: tx.type, quantity: Number(tx.quantity), price: Number(tx.price), date: tx.date,
      })))
      await this.prisma.position.update({
        where: { portfolioId_assetId: { portfolioId: transaction.portfolioId, assetId: transaction.assetId } },
        data: { quantity: fifo.totalQuantity, avgCost: fifo.avgCost, totalCost: fifo.totalCost },
      })
    }
    return { success: true }
  }

  async getPerformance(userId: string, portfolioId: string, period: string, cdiRate: number, ibovRate: number) {
    const portfolio = await this.prisma.portfolio.findFirst({
      where: { id: portfolioId, userId },
      include: {
        transactions: { include: { asset: { include: { quotes: true } } }, orderBy: { date: 'asc' } },
      },
    })
    if (!portfolio) throw new TRPCError({ code: 'NOT_FOUND', message: 'Portfolio não encontrado' })

    const now = new Date()
    let startDate: Date
    switch (period) {
      case '1M': startDate = new Date(now.getTime() - 30 * 86400000); break
      case '3M': startDate = new Date(now.getTime() - 90 * 86400000); break
      case '6M': startDate = new Date(now.getTime() - 180 * 86400000); break
      case '1Y': startDate = new Date(now.getTime() - 365 * 86400000); break
      case 'YTD': startDate = new Date(now.getFullYear(), 0, 1); break
      default: startDate = portfolio.transactions[0]?.date ?? now
    }

    const positions = await this.prisma.position.findMany({
      where: { portfolioId },
      include: { asset: { include: { quotes: { orderBy: { date: 'desc' }, take: 1 } } } },
    })

    const endValue = positions.reduce((sum, pos) => {
      const price = pos.asset.quotes[0] ? Number(pos.asset.quotes[0].close) : Number(pos.avgCost)
      return sum + Number(pos.quantity) * price
    }, 0)

    const txBeforeStart = portfolio.transactions.filter((t) => t.date <= startDate)
    const startValue = txBeforeStart.reduce((sum, t) => {
      const type = t.type.toUpperCase()
      if (type === 'BUY') return sum + Number(t.total)
      if (type === 'SELL') return sum - Number(t.total)
      return sum
    }, 0)

    const basis = startValue || Number(positions.reduce((s, p) => s + Number(p.totalCost), 0))
    const absoluteReturn = endValue - basis
    const percentReturn = basis > 0 ? (absoluteReturn / basis) * 100 : 0
    const periodDays = Math.floor((now.getTime() - startDate.getTime()) / 86400000)
    const cdiReturn = calculateBenchmarkReturn(cdiRate, periodDays)
    const ibovReturn = calculateBenchmarkReturn(ibovRate, periodDays)

    return {
      period, startDate, endDate: now, startValue: startValue || basis,
      endValue, absoluteReturn, percentReturn,
      benchmarks: {
        cdi: { percentReturn: cdiReturn, absoluteReturn: basis * cdiReturn / 100 },
        ibov: { percentReturn: ibovReturn, absoluteReturn: basis * ibovReturn / 100 },
      },
    }
  }

  async getPositionTickers(userId: string) {
    const dbPositions = await this.prisma.position.findMany({
      where: { portfolio: { userId } },
      select: { quantity: true, asset: { select: { ticker: true } } },
    })
    return dbPositions.map(p => ({ ticker: p.asset.ticker, quantity: Number(p.quantity) }))
  }
}
