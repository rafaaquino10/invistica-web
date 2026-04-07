// ─── Demo Dividends Repository ───────────────────────────────

import { DEMO_PORTFOLIOS } from '@/lib/demo-data'
import { getAssets } from '@/lib/data-source'
import { TRPCError } from '@trpc/server'

async function generateDemoDividends() {
  const ALL_ASSETS = await getAssets()
  const now = new Date()
  const entries: Array<{
    id: string; ticker: string; name: string; type: string;
    valuePerShare: number; exDate: Date; paymentDate: Date;
    quantity: number; totalValue: number;
  }> = []
  const demoPortfolio = DEMO_PORTFOLIOS[0]
  if (!demoPortfolio) return []
  for (const pos of demoPortfolio.positions) {
    const asset = ALL_ASSETS.find(a => a.ticker === pos.ticker)
    if (!asset) continue
    for (let q = 0; q < 4; q++) {
      const paymentDate = new Date(now.getFullYear(), q * 3 + 2, 15)
      const valuePerShare = (asset.fundamentals.dividendYield ?? 5) / 100 * asset.price / 4
      entries.push({
        id: `div-${asset.ticker}-${q}`, ticker: asset.ticker, name: asset.name,
        type: 'DIVIDEND', valuePerShare,
        exDate: new Date(paymentDate.getTime() - 7 * 24 * 60 * 60 * 1000),
        paymentDate, quantity: pos.quantity, totalValue: valuePerShare * pos.quantity,
      })
    }
  }
  return entries.sort((a, b) => (a.paymentDate?.getTime() ?? 0) - (b.paymentDate?.getTime() ?? 0))
}

export class DemoDividendsRepo {
  async getCalendar() {
    const entries = await generateDemoDividends()
    type MonthGroup = { month: string; entries: typeof entries; total: number }
    const byMonth = entries.reduce((acc: Record<string, MonthGroup>, entry) => {
      const date = entry.paymentDate
      if (!date) return acc
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      if (!acc[monthKey]) acc[monthKey] = { month: monthKey, entries: [], total: 0 }
      acc[monthKey]!.entries.push(entry)
      acc[monthKey]!.total += entry.totalValue
      return acc
    }, {})
    return {
      entries,
      byMonth: Object.values(byMonth),
      totalExpected: entries.reduce((sum, e) => sum + e.totalValue, 0),
    }
  }

  async getSummary(_userId: string, data: { portfolioId?: string; period: string }) {
    const ALL_ASSETS = await getAssets()
    const portfolio = DEMO_PORTFOLIOS[0]
    if (!portfolio) {
      return {
        period: data.period,
        startDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
        endDate: new Date(), totalReceived: 0, totalCost: 0, totalValue: 0,
        overallYoC: 0, overallYield: 0, byAsset: [],
      }
    }
    const totalCost = portfolio.positions.reduce((sum, p) => sum + p.quantity * p.avgCost, 0)
    const totalValue = portfolio.positions.reduce((sum, p) => {
      const livePrice = ALL_ASSETS.find(a => a.ticker === p.ticker)?.price ?? p.currentPrice
      return sum + p.quantity * livePrice
    }, 0)
    const totalReceived = totalValue * 0.08
    const byAsset = portfolio.positions.map(pos => {
      const asset = ALL_ASSETS.find(a => a.ticker === pos.ticker)
      const livePrice = asset?.price ?? pos.currentPrice
      const cost = pos.quantity * pos.avgCost
      const value = pos.quantity * livePrice
      const dividendsReceived = value * ((asset?.fundamentals.dividendYield ?? 5) / 100)
      return {
        ticker: pos.ticker, name: asset?.name ?? pos.ticker, quantity: pos.quantity,
        avgCost: pos.avgCost, currentPrice: livePrice, totalCost: cost, totalValue: value,
        dividendsReceived, dividendCount: 4,
        yieldOnCost: (dividendsReceived / cost) * 100,
        currentYield: (dividendsReceived / value) * 100,
      }
    })
    return {
      period: data.period,
      startDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
      endDate: new Date(), totalReceived, totalCost, totalValue,
      overallYoC: (totalReceived / totalCost) * 100,
      overallYield: (totalReceived / totalValue) * 100,
      byAsset: byAsset.sort((a, b) => b.dividendsReceived - a.dividendsReceived),
    }
  }

  async getProjections(_userId: string, data: { portfolioId?: string; months: number }) {
    const ALL_ASSETS = await getAssets()
    const now = new Date()
    const projections = []
    for (let i = 1; i <= data.months; i++) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() + i, 1)
      const monthKey = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`
      const demoPort = DEMO_PORTFOLIOS[0]
      const monthlyAssets = (demoPort?.positions ?? []).map(pos => {
        const asset = ALL_ASSETS.find(a => a.ticker === pos.ticker)
        const livePrice = asset?.price ?? pos.currentPrice
        const monthlyDividend = pos.quantity * livePrice * ((asset?.fundamentals.dividendYield ?? 5) / 100) / 12
        return { ticker: pos.ticker, projected: monthlyDividend }
      })
      projections.push({ month: monthKey, date: monthDate, projected: monthlyAssets.reduce((sum, a) => sum + a.projected, 0), assets: monthlyAssets })
    }
    const totalProjected = projections.reduce((sum, p) => sum + p.projected, 0)
    return { months: data.months, projections, totalProjected, monthlyAverage: totalProjected / data.months }
  }

  async simulate(tickers: string[], amounts: number[]) {
    const ALL_ASSETS = await getAssets()
    const results = tickers.map((ticker, index) => {
      const asset = ALL_ASSETS.find(a => a.ticker.toUpperCase() === ticker.toUpperCase())
      const amount = amounts[index] ?? 0
      if (!asset) {
        return { ticker, found: false, investment: amount, shares: 0, currentPrice: 0, dividendYield: 0, annualDividend: 0, monthlyDividend: 0 }
      }
      const shares = Math.floor(amount / asset.price)
      const actualInvestment = shares * asset.price
      const dividendYield = (asset.fundamentals.dividendYield ?? 5) / 100
      const annualDividend = actualInvestment * dividendYield
      return {
        ticker: asset.ticker, name: asset.name, found: true, investment: amount, actualInvestment,
        shares, currentPrice: asset.price, dividendYield: dividendYield * 100,
        annualDividend, monthlyDividend: annualDividend / 12,
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
    const ALL_ASSETS = await getAssets()
    const asset = ALL_ASSETS.find(a => a.ticker.toUpperCase() === ticker.toUpperCase())
    if (!asset) throw new TRPCError({ code: 'NOT_FOUND', message: 'Ativo não encontrado' })

    const now = new Date()
    type YearData = { year: number; total: number; count: number; dividends: Array<{ type: string; value: number; exDate: Date; paymentDate: Date }> }
    const byYear: Record<number, YearData> = {}
    for (let y = 0; y < years; y++) {
      const year = now.getFullYear() - y
      const yearlyDividend = asset.price * ((asset.fundamentals.dividendYield ?? 5) / 100)
      const quarterlyValue = yearlyDividend / 4
      byYear[year] = {
        year, total: yearlyDividend, count: 4,
        dividends: [0, 1, 2, 3].map(q => ({
          type: 'DIVIDEND', value: quarterlyValue,
          exDate: new Date(year, q * 3 + 2, 8), paymentDate: new Date(year, q * 3 + 2, 15),
        })),
      }
    }
    return {
      ticker: asset.ticker, name: asset.name,
      byYear: Object.values(byYear).sort((a, b) => b.year - a.year),
      totalDividends: years * 4,
      totalValue: Object.values(byYear).reduce((sum, y) => sum + y.total, 0),
    }
  }
}
