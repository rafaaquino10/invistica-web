// ─── Prisma Dividends Repository ─────────────────────────────

import type { PrismaClient } from '@prisma/client'
import { TRPCError } from '@trpc/server'

export class PrismaDividendsRepo {
  constructor(private prisma: PrismaClient) {}

  async getCalendar(userId: string, data: { portfolioId?: string; startDate?: Date; endDate?: Date }) {
    const start = data.startDate ?? new Date(new Date().getFullYear(), 0, 1)
    const end = data.endDate ?? new Date(new Date().getFullYear(), 11, 31)

    const positions = await this.prisma.position.findMany({
      where: {
        portfolio: { userId, ...(data.portfolioId && { id: data.portfolioId }) },
        quantity: { gt: 0 },
      },
      include: {
        asset: {
          include: {
            dividends: {
              where: { OR: [{ exDate: { gte: start, lte: end } }, { paymentDate: { gte: start, lte: end } }] },
              orderBy: { paymentDate: 'asc' },
            },
          },
        },
      },
    })

    const calendarEntries = positions.flatMap((position) =>
      position.asset.dividends.map((div) => ({
        id: div.id, ticker: position.asset.ticker, name: position.asset.name,
        type: div.type, valuePerShare: Number(div.valuePerShare),
        exDate: div.exDate, paymentDate: div.paymentDate,
        quantity: Number(position.quantity),
        totalValue: Number(div.valuePerShare) * Number(position.quantity),
      }))
    )

    calendarEntries.sort((a, b) => {
      const dateA = a.paymentDate ?? a.exDate
      const dateB = b.paymentDate ?? b.exDate
      if (!dateA || !dateB) return 0
      return dateA.getTime() - dateB.getTime()
    })

    const byMonth = calendarEntries.reduce((acc, entry) => {
      const date = entry.paymentDate ?? entry.exDate
      if (!date) return acc
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      if (!acc[monthKey]) acc[monthKey] = { month: monthKey, entries: [] as typeof calendarEntries, total: 0 }
      acc[monthKey].entries.push(entry)
      acc[monthKey].total += entry.totalValue
      return acc
    }, {} as Record<string, { month: string; entries: typeof calendarEntries; total: number }>)

    return {
      entries: calendarEntries,
      byMonth: Object.values(byMonth),
      totalExpected: calendarEntries.reduce((sum, e) => sum + e.totalValue, 0),
    }
  }

  async getSummary(userId: string, data: { portfolioId?: string; period: string }) {
    const now = new Date()
    let startDate: Date
    switch (data.period) {
      case '1M': startDate = new Date(now.getTime() - 30 * 86400000); break
      case '3M': startDate = new Date(now.getTime() - 90 * 86400000); break
      case '6M': startDate = new Date(now.getTime() - 180 * 86400000); break
      case '1Y': startDate = new Date(now.getTime() - 365 * 86400000); break
      case 'YTD': startDate = new Date(now.getFullYear(), 0, 1); break
      default: startDate = new Date(2000, 0, 1)
    }

    const positions = await this.prisma.position.findMany({
      where: {
        portfolio: { userId, ...(data.portfolioId && { id: data.portfolioId }) },
      },
      include: {
        asset: {
          include: {
            dividends: { where: { paymentDate: { gte: startDate, lte: now } } },
            quotes: { take: 1, orderBy: { date: 'desc' } },
          },
        },
      },
    })

    let totalReceived = 0, totalCost = 0, totalValue = 0
    const byAsset = positions.map((position) => {
      const quantity = Number(position.quantity)
      const avgCost = Number(position.avgCost)
      const cost = Number(position.totalCost)
      const currentPrice = position.asset.quotes[0] ? Number(position.asset.quotes[0].close) : avgCost
      const value = quantity * currentPrice
      const dividendsReceived = position.asset.dividends.reduce((sum, div) => sum + Number(div.valuePerShare) * quantity, 0)
      totalReceived += dividendsReceived; totalCost += cost; totalValue += value
      return {
        ticker: position.asset.ticker, name: position.asset.name,
        quantity, avgCost, currentPrice, totalCost: cost, totalValue: value,
        dividendsReceived, dividendCount: position.asset.dividends.length,
        yieldOnCost: cost > 0 ? (dividendsReceived / cost) * 100 : 0,
        currentYield: value > 0 ? (dividendsReceived / value) * 100 : 0,
      }
    })

    return {
      period: data.period, startDate, endDate: now, totalReceived, totalCost, totalValue,
      overallYoC: totalCost > 0 ? (totalReceived / totalCost) * 100 : 0,
      overallYield: totalValue > 0 ? (totalReceived / totalValue) * 100 : 0,
      byAsset: byAsset.sort((a, b) => b.dividendsReceived - a.dividendsReceived),
    }
  }

  async getProjections(userId: string, data: { portfolioId?: string; months: number }) {
    const positions = await this.prisma.position.findMany({
      where: {
        portfolio: { userId, ...(data.portfolioId && { id: data.portfolioId }) },
        quantity: { gt: 0 },
      },
      include: {
        asset: {
          include: {
            dividends: { orderBy: { paymentDate: 'desc' }, take: 24 },
            fundamentals: { where: { periodType: 'annual' }, take: 1, orderBy: { referenceDate: 'desc' } },
          },
        },
      },
    })

    const now = new Date()
    const projections = []
    for (let i = 1; i <= data.months; i++) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() + i, 1)
      const monthKey = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`
      let monthlyTotal = 0
      const monthlyAssets: { ticker: string; projected: number }[] = []
      positions.forEach((position) => {
        const quantity = Number(position.quantity)
        const lastYearDivs = position.asset.dividends.filter((d) => {
          const date = d.paymentDate
          if (!date) return false
          return date >= new Date(now.getTime() - 365 * 86400000)
        })
        const monthlyAvg = lastYearDivs.reduce((sum, d) => sum + Number(d.valuePerShare), 0) / 12
        if (monthlyAvg > 0) {
          const projected = monthlyAvg * quantity
          monthlyTotal += projected
          monthlyAssets.push({ ticker: position.asset.ticker, projected })
        }
      })
      projections.push({ month: monthKey, date: monthDate, projected: monthlyTotal, assets: monthlyAssets })
    }
    const totalProjected = projections.reduce((sum, p) => sum + p.projected, 0)
    return { months: data.months, projections, totalProjected, monthlyAverage: totalProjected / data.months }
  }

  async simulate(tickers: string[], amounts: number[]) {
    const assets = await this.prisma.asset.findMany({
      where: { ticker: { in: tickers.map((t) => t.toUpperCase()) } },
      include: {
        quotes: { take: 1, orderBy: { date: 'desc' } },
        fundamentals: { where: { periodType: 'annual' }, take: 1, orderBy: { referenceDate: 'desc' } },
      },
    })

    const results = tickers.map((ticker, index) => {
      const asset = assets.find((a) => a.ticker === ticker.toUpperCase())
      const amount = amounts[index] ?? 0
      if (!asset) {
        return { ticker, found: false, investment: amount, shares: 0, currentPrice: 0, dividendYield: 0, annualDividend: 0, monthlyDividend: 0 }
      }
      const currentPrice = asset.quotes[0] ? Number(asset.quotes[0].close) : 0
      const dividendYield = asset.fundamentals[0]?.dividendYield ? Number(asset.fundamentals[0].dividendYield) : 0
      const shares = currentPrice > 0 ? Math.floor(amount / currentPrice) : 0
      const actualInvestment = shares * currentPrice
      const annualDividend = actualInvestment * dividendYield
      return {
        ticker: asset.ticker, name: asset.name, found: true, investment: amount, actualInvestment,
        shares, currentPrice, dividendYield: dividendYield * 100, annualDividend, monthlyDividend: annualDividend / 12,
      }
    })

    const totals = {
      investment: results.reduce((sum, r) => sum + (r.investment ?? 0), 0),
      actualInvestment: results.reduce((sum, r) => sum + ((r as any).actualInvestment ?? 0), 0),
      shares: results.reduce((sum, r) => sum + r.shares, 0),
      annualDividend: results.reduce((sum, r) => sum + r.annualDividend, 0),
      monthlyDividend: results.reduce((sum, r) => sum + r.monthlyDividend, 0),
      avgYield: 0,
    }
    totals.avgYield = totals.actualInvestment > 0 ? (totals.annualDividend / totals.actualInvestment) * 100 : 0
    return { results, totals }
  }

  async getHistory(ticker: string, years: number) {
    const startDate = new Date()
    startDate.setFullYear(startDate.getFullYear() - years)
    const asset = await this.prisma.asset.findUnique({
      where: { ticker: ticker.toUpperCase() },
      include: { dividends: { where: { paymentDate: { gte: startDate } }, orderBy: { paymentDate: 'desc' } } },
    })
    if (!asset) throw new TRPCError({ code: 'NOT_FOUND', message: 'Ativo não encontrado' })

    const byYear = asset.dividends.reduce((acc, div) => {
      const year = div.paymentDate?.getFullYear()
      if (!year) return acc
      if (!acc[year]) acc[year] = { year, total: 0, count: 0, dividends: [] as any[] }
      acc[year].total += Number(div.valuePerShare)
      acc[year].count++
      acc[year].dividends.push({ type: div.type, value: Number(div.valuePerShare), exDate: div.exDate, paymentDate: div.paymentDate })
      return acc
    }, {} as Record<number, any>)

    return {
      ticker: asset.ticker, name: asset.name,
      byYear: Object.values(byYear).sort((a: any, b: any) => b.year - a.year),
      totalDividends: asset.dividends.length,
      totalValue: asset.dividends.reduce((sum, d) => sum + Number(d.valuePerShare), 0),
    }
  }
}
