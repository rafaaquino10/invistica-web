// ─── Prisma Radar Repository ─────────────────────────────────

import type { PrismaClient } from '@prisma/client'
import { serializePrismaObject } from '@/lib/utils/prisma-helpers'

function getAlertMessage(type: string, ticker: string, threshold: number | null): string {
  switch (type) {
    case 'price_above': return `${ticker} ultrapassou R$ ${threshold?.toFixed(2) || '-'}`
    case 'price_below': return `${ticker} caiu abaixo de R$ ${threshold?.toFixed(2) || '-'}`
    case 'score_change': return `Invscore de ${ticker} foi atualizado`
    case 'dividend': return `${ticker} anunciou novo provento`
    default: return `Alerta disparado para ${ticker}`
  }
}

export class PrismaRadarRepo {
  constructor(private prisma: PrismaClient) {}

  async getAlerts(userId: string) {
    const alerts = await this.prisma.alert.findMany({
      where: { userId },
      include: { asset: { select: { ticker: true, name: true, type: true } } },
      orderBy: { createdAt: 'desc' },
    })
    return Promise.all(alerts.map(async (alert) => {
      const latestQuote = await this.prisma.quote.findFirst({
        where: { assetId: alert.assetId }, orderBy: { date: 'desc' }, select: { close: true },
      })
      const currentPrice = latestQuote ? Number(latestQuote.close) : 0
      const threshold = alert.threshold ? Number(alert.threshold) : null
      let triggered = false
      if (threshold !== null && currentPrice > 0) {
        if (alert.type === 'price_above') triggered = currentPrice >= threshold
        else if (alert.type === 'price_below') triggered = currentPrice <= threshold
      }
      return { ...alert, threshold, currentPrice, triggered }
    }))
  }

  async createAlert(userId: string, data: { assetId: string; type: string; threshold?: number }) {
    const alert = await this.prisma.alert.create({
      data: { userId, assetId: data.assetId, type: data.type, threshold: data.threshold, isActive: true },
      include: { asset: { select: { ticker: true, name: true } } },
    })
    return serializePrismaObject(alert)
  }

  async updateAlert(userId: string, data: any) {
    const { id, ...rest } = data
    const alert = await this.prisma.alert.update({ where: { id, userId }, data: rest })
    return serializePrismaObject(alert)
  }

  async deleteAlert(userId: string, id: string) {
    await this.prisma.alert.delete({ where: { id, userId } })
    return { success: true }
  }

  async triggerAlert(userId: string, id: string) {
    const alert = await this.prisma.alert.update({
      where: { id, userId }, data: { lastTriggeredAt: new Date() },
    })
    return serializePrismaObject(alert)
  }

  async getInsights(userId: string, filter: { type: string; unreadOnly: boolean; limit: number }) {
    const where: any = { userId }
    if (filter.type !== 'all') where.type = filter.type
    if (filter.unreadOnly) where.isRead = false
    where.OR = [{ expiresAt: null }, { expiresAt: { gt: new Date() } }]
    return this.prisma.insight.findMany({
      where,
      include: { asset: { select: { ticker: true, name: true } } },
      orderBy: { createdAt: 'desc' },
      take: filter.limit,
    })
  }

  async markInsightRead(userId: string, id: string) {
    return this.prisma.insight.update({ where: { id, userId }, data: { isRead: true } })
  }

  async markAllInsightsRead(userId: string) {
    await this.prisma.insight.updateMany({ where: { userId, isRead: false }, data: { isRead: true } })
    return { success: true }
  }

  async getPortfolioHealth(userId: string) {
    const portfolios = await this.prisma.portfolio.findMany({
      where: { userId },
      include: {
        positions: {
          where: { quantity: { gt: 0 } },
          include: { asset: { include: { aqScores: { where: { version: 'v1' }, take: 1 } } } },
        },
      },
    })
    const allPositions = portfolios.flatMap((p) => p.positions)
    if (allPositions.length === 0) {
      return {
        overallScore: 0,
        diversification: { score: 0, status: 'warning' as const, message: 'Nenhuma posição encontrada' },
        concentration: { score: 0, status: 'neutral' as const, message: 'Sem dados' },
        quality: { score: 0, status: 'neutral' as const, message: 'Sem dados' },
        risk: { score: 0, status: 'neutral' as const, message: 'Sem dados' },
        recommendations: [],
      }
    }

    const totalValue = allPositions.reduce((sum, p) => sum + Number(p.quantity) * Number(p.avgCost), 0)

    // Sector diversification
    const sectorAllocation: Record<string, number> = {}
    allPositions.forEach((p) => {
      const sector = p.asset.sector || 'Outros'
      const value = Number(p.quantity) * Number(p.avgCost)
      sectorAllocation[sector] = (sectorAllocation[sector] || 0) + value / totalValue
    })
    const sectorCount = Object.keys(sectorAllocation).length
    const maxSectorConcentration = Math.max(...Object.values(sectorAllocation))

    let diversificationScore = 0
    let diversificationStatus: 'success' | 'warning' | 'danger' | 'neutral' = 'neutral'
    let diversificationMessage = ''
    if (sectorCount >= 5 && maxSectorConcentration <= 0.3) { diversificationScore = 90; diversificationStatus = 'success'; diversificationMessage = 'Excelente distribuição entre setores' }
    else if (sectorCount >= 3 && maxSectorConcentration <= 0.4) { diversificationScore = 70; diversificationStatus = 'success'; diversificationMessage = 'Boa diversificação setorial' }
    else if (sectorCount >= 2 && maxSectorConcentration <= 0.5) { diversificationScore = 50; diversificationStatus = 'warning'; diversificationMessage = 'Considere diversificar mais entre setores' }
    else { diversificationScore = 30; diversificationStatus = 'danger'; diversificationMessage = 'Alta concentração setorial - risco elevado' }

    // Position concentration
    const positionWeights = allPositions.map((p) => ({ ticker: p.asset.ticker, weight: (Number(p.quantity) * Number(p.avgCost)) / totalValue }))
    const sortedByWeight = [...positionWeights].sort((a, b) => b.weight - a.weight)
    const topPosition = sortedByWeight[0] ?? { ticker: 'N/A', weight: 0 }
    let concentrationScore = 0
    let concentrationStatus: 'success' | 'warning' | 'danger' | 'neutral' = 'neutral'
    let concentrationMessage = ''
    if (topPosition.weight <= 0.15) { concentrationScore = 90; concentrationStatus = 'success'; concentrationMessage = 'Nenhuma posição com peso excessivo' }
    else if (topPosition.weight <= 0.25) { concentrationScore = 70; concentrationStatus = 'success'; concentrationMessage = 'Boa distribuição entre posições' }
    else if (topPosition.weight <= 0.35) { concentrationScore = 50; concentrationStatus = 'warning'; concentrationMessage = `${topPosition.ticker} representa ${(topPosition.weight * 100).toFixed(0)}% da carteira` }
    else { concentrationScore = 30; concentrationStatus = 'danger'; concentrationMessage = `Alta concentração em ${topPosition.ticker} (${(topPosition.weight * 100).toFixed(0)}%)` }

    // Quality
    const aqScores = allPositions.map((p) => p.asset.aqScores[0]?.scoreTotal).filter((s): s is NonNullable<typeof s> => s != null).map((s) => Number(s))
    const avgAqScore = aqScores.length > 0 ? aqScores.reduce((a, b) => a + b, 0) / aqScores.length : 0
    let qualityStatus: 'success' | 'warning' | 'danger' | 'neutral' = 'neutral'
    let qualityMessage = ''
    if (avgAqScore >= 75) { qualityStatus = 'success'; qualityMessage = 'Carteira com ativos de alta qualidade' }
    else if (avgAqScore >= 60) { qualityStatus = 'success'; qualityMessage = 'Boa qualidade média dos ativos' }
    else if (avgAqScore >= 45) { qualityStatus = 'warning'; qualityMessage = 'Considere revisar alguns ativos' }
    else { qualityStatus = 'danger'; qualityMessage = 'Qualidade média abaixo do ideal' }

    // Risk
    const lowScoreAssets = allPositions.filter((p) => { const score = p.asset.aqScores[0]?.scoreTotal; return score && Number(score) < 50 })
    let riskScore = 70
    let riskStatus: 'success' | 'warning' | 'danger' | 'neutral' = 'neutral'
    let riskMessage = ''
    if (lowScoreAssets.length === 0 && maxSectorConcentration <= 0.3) { riskScore = 85; riskStatus = 'success'; riskMessage = 'Risco controlado e bem distribuído' }
    else if (lowScoreAssets.length <= 2 && maxSectorConcentration <= 0.4) { riskScore = 65; riskStatus = 'warning'; riskMessage = 'Alguns pontos de atenção no risco' }
    else { riskScore = 40; riskStatus = 'danger'; riskMessage = 'Carteira com risco elevado' }

    // Recommendations
    const recommendations: string[] = []
    if (concentrationStatus === 'danger' || concentrationStatus === 'warning') recommendations.push(`Considere reduzir a posição em ${topPosition.ticker}`)
    if (diversificationStatus === 'danger' || diversificationStatus === 'warning') {
      const missing = ['Utilities', 'Consumo', 'Tecnologia'].filter((t) => !sectorAllocation[t])
      if (missing.length > 0) recommendations.push(`Explore setores como: ${missing.join(', ')}`)
    }
    if (lowScoreAssets.length > 0) recommendations.push(`Reavalie: ${lowScoreAssets.map((p) => p.asset.ticker).join(', ')} (Invscore baixo)`)
    const fiiPercentage = allPositions.filter((p) => p.asset.type === 'fii').reduce((sum, p) => sum + (Number(p.quantity) * Number(p.avgCost)) / totalValue, 0)
    if (fiiPercentage < 0.1 && allPositions.length >= 3) recommendations.push('Considere adicionar FIIs para renda passiva')

    const overallScore = Math.round(diversificationScore * 0.3 + concentrationScore * 0.25 + avgAqScore * 0.3 + riskScore * 0.15)
    return {
      overallScore,
      diversification: { score: diversificationScore, status: diversificationStatus, message: diversificationMessage },
      concentration: { score: concentrationScore, status: concentrationStatus, message: concentrationMessage },
      quality: { score: Math.round(avgAqScore), status: qualityStatus, message: qualityMessage },
      risk: { score: riskScore, status: riskStatus, message: riskMessage },
      recommendations,
    }
  }

  async getLatestReport(userId: string) {
    const report = await this.prisma.weeklyReport.findFirst({ where: { userId }, orderBy: { weekStart: 'desc' } })
    if (!report) return null
    return { ...report, portfolioValue: Number(report.portfolioValue), weeklyReturn: Number(report.weeklyReturn), dividendsReceived: Number(report.dividendsReceived) }
  }

  async getReportHistory(userId: string, limit: number) {
    const reports = await this.prisma.weeklyReport.findMany({ where: { userId }, orderBy: { weekStart: 'desc' }, take: limit })
    return reports.map((r) => ({ ...r, portfolioValue: Number(r.portfolioValue), weeklyReturn: Number(r.weeklyReturn), dividendsReceived: Number(r.dividendsReceived) }))
  }

  async generateReport(userId: string) {
    const now = new Date()
    const weekStart = new Date(now); weekStart.setDate(now.getDate() - now.getDay()); weekStart.setHours(0, 0, 0, 0)
    const weekEnd = new Date(weekStart); weekEnd.setDate(weekStart.getDate() + 6); weekEnd.setHours(23, 59, 59, 999)

    const portfolios = await this.prisma.portfolio.findMany({
      where: { userId },
      include: { positions: { where: { quantity: { gt: 0 } }, include: { asset: { include: { quotes: { orderBy: { date: 'desc' }, take: 1 } } } } } },
    })
    const allPositions = portfolios.flatMap((p) => p.positions)
    let portfolioValue = 0, totalCostBasis = 0
    for (const pos of allPositions) {
      const currentPrice = pos.asset.quotes[0] ? Number(pos.asset.quotes[0].close) : Number(pos.avgCost)
      portfolioValue += Number(pos.quantity) * currentPrice
      totalCostBasis += Number(pos.totalCost)
    }
    const weeklyReturn = totalCostBasis > 0 ? (portfolioValue - totalCostBasis) / totalCostBasis : 0
    const alertsTriggered = await this.prisma.alert.count({ where: { userId, lastTriggeredAt: { gte: weekStart, lte: weekEnd } } })
    const insightsCount = await this.prisma.insight.count({ where: { userId, createdAt: { gte: weekStart, lte: weekEnd } } })

    const report = await this.prisma.weeklyReport.upsert({
      where: { userId_weekStart: { userId, weekStart } },
      create: { userId, weekStart, weekEnd, portfolioValue, weeklyReturn, dividendsReceived: 0, alertsTriggered, insightsCount },
      update: { portfolioValue, weeklyReturn, dividendsReceived: 0, alertsTriggered, insightsCount },
    })
    return serializePrismaObject(report)
  }

  async getFeed(userId: string, limit: number) {
    const recentAlerts = await this.prisma.alert.findMany({
      where: { userId, lastTriggeredAt: { not: null } },
      include: { asset: { select: { ticker: true, name: true } } },
      orderBy: { lastTriggeredAt: 'desc' }, take: 10,
    })
    const recentInsights = await this.prisma.insight.findMany({
      where: { userId, OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] },
      include: { asset: { select: { ticker: true, name: true } } },
      orderBy: { createdAt: 'desc' }, take: 10,
    })
    const feedItems = [
      ...recentAlerts.map((a) => ({
        id: a.id, type: 'alert' as const, category: a.type,
        title: a.asset.ticker,
        message: getAlertMessage(a.type, a.asset.ticker, a.threshold ? Number(a.threshold) : null),
        ticker: a.asset.ticker, isRead: !!a.lastTriggeredAt, date: a.lastTriggeredAt!,
      })),
      ...recentInsights.map((i) => ({
        id: i.id, type: 'insight' as const, category: i.type,
        insightType: i.type, title: i.title, message: i.description,
        ticker: i.asset?.ticker, isRead: i.isRead, date: i.createdAt,
      })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, limit)
    return feedItems
  }
}
