// ─── Demo Radar Repository ───────────────────────────────────

import { DEMO_ALERTS } from '@/lib/demo-data'
import { getAssets } from '@/lib/data-source'
import { fetchFocusData } from '@/lib/gateway-client'
import { generateInsights } from '@/lib/insights'

export class DemoRadarRepo {
  async getAlerts(userId: string) {
    const ALL_ASSETS = await getAssets()
    return DEMO_ALERTS.map(alert => ({
      id: alert.id, type: alert.type, ticker: alert.ticker,
      asset: {
        ticker: alert.ticker,
        name: ALL_ASSETS.find(a => a.ticker === alert.ticker)?.name ?? alert.ticker,
        type: 'stock',
      },
      message: alert.message,
      threshold: alert.type.includes('price') ? 38.0 : null,
      currentPrice: ALL_ASSETS.find(a => a.ticker === alert.ticker)?.price ?? 40,
      triggered: !alert.read, createdAt: new Date(), isActive: true,
    }))
  }

  async createAlert(userId: string, data: { assetId: string; type: string; threshold?: number }) {
    return {
      id: `alert-${Date.now()}`, userId, assetId: data.assetId,
      type: data.type, threshold: data.threshold ?? null, isActive: true,
      createdAt: new Date(), asset: { ticker: 'PETR4', name: 'Petrobras PN' },
    }
  }

  async updateAlert(_userId: string, data: any) {
    return { ...data, updatedAt: new Date() }
  }

  async deleteAlert() {
    return { success: true }
  }

  async triggerAlert(_userId: string, id: string) {
    return { id, lastTriggeredAt: new Date() }
  }

  async getInsights(_userId: string, filter: { type: string; unreadOnly: boolean; limit: number }) {
    const ALL_ASSETS = await getAssets()
    const engineInsights = generateInsights(ALL_ASSETS)
    const categoryToType: Record<string, string> = {
      opportunity: 'opportunity', risk: 'risk', info: 'quality', milestone: 'valuation',
    }
    let insights = engineInsights.map((ei) => ({
      id: ei.id, title: ei.title, description: ei.description,
      type: categoryToType[ei.category] || ei.category,
      isRead: false, createdAt: new Date(ei.createdAt),
      asset: ei.ticker ? {
        ticker: ei.ticker,
        name: ALL_ASSETS.find(a => a.ticker === ei.ticker)?.name ?? '',
      } : null,
    }))
    if (filter.type !== 'all') {
      insights = insights.filter(i => i.type === filter.type)
    }
    return insights.slice(0, filter.limit)
  }

  async markInsightRead(_userId: string, id: string) {
    return { id, isRead: true }
  }

  async markAllInsightsRead() {
    return { success: true }
  }

  async getPortfolioHealth() {
    return {
      overallScore: 76,
      diversification: { score: 70, status: 'success' as const, message: 'Boa diversificação setorial' },
      concentration: { score: 65, status: 'warning' as const, message: 'PETR4 representa 28% da carteira' },
      quality: { score: 78, status: 'success' as const, message: 'Carteira com ativos de alta qualidade' },
      risk: { score: 72, status: 'success' as const, message: 'Risco controlado e bem distribuído' },
      recommendations: [
        'Considere reduzir a posição em PETR4',
        'Explore setores como: Tecnologia, Saúde',
        'Considere adicionar FIIs para renda passiva',
      ],
    }
  }

  async getLatestReport(userId: string) {
    const now = new Date()
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - now.getDay())
    return {
      id: 'demo-report', userId, weekStart,
      weekEnd: new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000),
      portfolioValue: 125430, weeklyReturn: 2.35, dividendsReceived: 352,
      alertsTriggered: 2, insightsCount: 3, createdAt: now,
    }
  }

  async getReportHistory(userId: string, limit: number) {
    return Array.from({ length: limit }, (_, i) => {
      const weekStart = new Date()
      weekStart.setDate(weekStart.getDate() - (i + 1) * 7)
      return {
        id: `report-${i}`, userId, weekStart,
        weekEnd: new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000),
        portfolioValue: 125430 - i * 1500,
        weeklyReturn: 1.5 + ((i * 7 + 3) % 20 - 10) / 10,
        dividendsReceived: i % 3 === 0 ? 500 : 0,
        alertsTriggered: (i + 1) % 3,
        insightsCount: (i * 2 + 1) % 5,
        createdAt: weekStart,
      }
    })
  }

  async generateReport() {
    return {
      id: 'demo-report', portfolioValue: 125430, weeklyReturn: 2.35,
      dividendsReceived: 352, alertsTriggered: 2, insightsCount: 3,
    }
  }

  async getFeed(_userId: string, limit: number) {
    const [ALL_ASSETS, focusData] = await Promise.all([
      getAssets(),
      fetchFocusData(),
    ])
    const engineInsights = generateInsights(ALL_ASSETS)
    type FeedItem = {
      id: string; type: string; category: string; title: string;
      message: string; ticker?: string; insightType?: string;
      isRead: boolean; date: Date;
    }
    const feedItems: FeedItem[] = [
      ...DEMO_ALERTS.map((a, i) => ({
        id: a.id, type: 'alert' as const, category: a.type, title: a.ticker,
        message: a.message, ticker: a.ticker, isRead: a.read,
        date: new Date(Date.now() - i * 2 * 60 * 60 * 1000),
      })),
      ...engineInsights.map((ei, i) => ({
        id: ei.id, type: 'insight' as const, category: ei.category,
        insightType: ei.type, title: ei.title, message: ei.description,
        ticker: ei.ticker, isRead: false,
        date: new Date(Date.now() - (i + 3) * 3 * 60 * 60 * 1000),
      })),
    ]
    if (focusData?.insight) {
      feedItems.push({
        id: `focus-${focusData.updatedAt}`, type: 'focus', category: 'info',
        title: 'Relatório Focus BCB', message: focusData.insight,
        isRead: false, date: new Date(focusData.updatedAt),
      })
    }
    return feedItems.sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, limit)
  }
}
