// ─── Repository Interfaces ───────────────────────────────────
// Contracts for data access. Demo and Prisma implementations
// follow these interfaces, eliminating isDemoMode branching in routers.

/* eslint-disable @typescript-eslint/no-explicit-any */

// ─── Portfolio ──────────────────────────────────────────────

export interface IPortfolioRepository {
  list(userId: string): Promise<any[]>
  get(userId: string, id: string): Promise<any>
  create(userId: string, data: {
    name: string; description?: string; isDefault: boolean
  }): Promise<any>
  update(userId: string, id: string, data: {
    name?: string; description?: string; isDefault?: boolean
    targetAllocation?: Record<string, number>
  }): Promise<any>
  delete(userId: string, id: string): Promise<any>
  addTransaction(userId: string, data: {
    portfolioId: string; ticker: string; type: 'BUY' | 'SELL'
    date: Date; quantity: number; price: number; fees: number; notes?: string
  }): Promise<any>
  deleteTransaction(userId: string, id: string): Promise<any>
  getPerformance(userId: string, portfolioId: string, period: string, cdiRate: number, ibovRate: number): Promise<any>
  /** For smart-portfolios exitAlerts */
  getPositionTickers(userId: string): Promise<{ ticker: string; quantity: number }[]>
}

// ─── Goals ──────────────────────────────────────────────────

export interface IGoalsRepository {
  list(userId: string): Promise<any[]>
  get(userId: string, id: string): Promise<any>
  getMain(userId: string): Promise<any>
  create(userId: string, data: any): Promise<any>
  update(userId: string, data: any): Promise<any>
  delete(userId: string, id: string): Promise<any>
  syncCurrentAmount(userId: string, id: string): Promise<{ currentAmount: number }>
  getCurrentPortfolioValue(userId: string): Promise<number>
  createFIREGoal(userId: string, data: any, fireCalc: any): Promise<any>
  getMilestones(userId: string, goalId: string): Promise<any[]>
  addMilestone(userId: string, data: {
    goalId: string; title: string; targetAmount: number
  }): Promise<any>
  completeMilestone(userId: string, id: string): Promise<any>
  deleteMilestone(userId: string, id: string): Promise<any>
  getPassiveIncomeStatus(userId: string): Promise<any>
}

// ─── Radar ──────────────────────────────────────────────────

export interface IRadarRepository {
  getAlerts(userId: string): Promise<any[]>
  createAlert(userId: string, data: {
    assetId: string; type: string; threshold?: number
  }): Promise<any>
  updateAlert(userId: string, data: {
    id: string; type?: string; threshold?: number; isActive?: boolean
  }): Promise<any>
  deleteAlert(userId: string, id: string): Promise<any>
  triggerAlert(userId: string, id: string): Promise<any>
  getInsights(userId: string, filter: {
    type: string; unreadOnly: boolean; limit: number
  }): Promise<any[]>
  markInsightRead(userId: string, id: string): Promise<any>
  markAllInsightsRead(userId: string): Promise<any>
  getPortfolioHealth(userId: string): Promise<any>
  getLatestReport(userId: string): Promise<any>
  getReportHistory(userId: string, limit: number): Promise<any[]>
  generateReport(userId: string): Promise<any>
  getFeed(userId: string, limit: number): Promise<any[]>
}

// ─── User ───────────────────────────────────────────────────

export interface IUserRepository {
  getProfile(userId: string, sessionUser: any): Promise<any>
  updateProfile(userId: string, data: { name: string }): Promise<any>
  /** Returns user data + optional JWT payload for refresh */
  refreshSession(userId: string): Promise<{
    user: any
    jwtPayload?: any
  }>
  updatePreferences(userId: string, data: { themePreference: string }): Promise<any>
}

// ─── Dividends ──────────────────────────────────────────────

export interface IDividendsRepository {
  getCalendar(userId: string, data: {
    portfolioId?: string; startDate?: Date; endDate?: Date
  }): Promise<any>
  getSummary(userId: string, data: {
    portfolioId?: string; period: string
  }): Promise<any>
  getProjections(userId: string, data: {
    portfolioId?: string; months: number
  }): Promise<any>
  simulate(tickers: string[], amounts: number[]): Promise<any>
  getHistory(ticker: string, years: number): Promise<any>
}

// ─── Aggregate ──────────────────────────────────────────────

export interface Repositories {
  portfolio: IPortfolioRepository
  goals: IGoalsRepository
  radar: IRadarRepository
  user: IUserRepository
  dividends: IDividendsRepository
}
