// ─── Demo Goals Repository ───────────────────────────────────

import { DEMO_GOALS, DEMO_PORTFOLIOS } from '@/lib/demo-data'
import { getAssets } from '@/lib/data-source'

export class DemoGoalsRepo {
  async list() {
    return [
      {
        id: 'goal-main', type: 'patrimony', name: DEMO_GOALS.main.name,
        targetAmount: DEMO_GOALS.main.targetAmount, currentAmount: DEMO_GOALS.main.currentAmount,
        monthlyContribution: DEMO_GOALS.main.monthlyContribution,
        expectedReturn: DEMO_GOALS.main.expectedReturn, progress: DEMO_GOALS.main.progress,
        isMain: true,
        milestones: [
          { id: 'm1', title: 'R$ 50 mil', targetAmount: 50000, isCompleted: true },
          { id: 'm2', title: 'R$ 100 mil', targetAmount: 100000, isCompleted: true },
          { id: 'm3', title: 'R$ 250 mil', targetAmount: 250000, isCompleted: false },
        ],
      },
      {
        id: 'goal-passive', type: 'passive_income',
        name: `R$ ${DEMO_GOALS.passiveIncome.targetMonthly}/mês em dividendos`,
        targetAmount: DEMO_GOALS.passiveIncome.targetMonthly,
        currentAmount: DEMO_GOALS.passiveIncome.currentMonthly,
        monthlyContribution: null, expectedReturn: null,
        progress: DEMO_GOALS.passiveIncome.progress, isMain: false, milestones: [],
      },
      {
        id: 'goal-fire', type: 'fire', name: `FIRE até ${DEMO_GOALS.fire.targetYear}`,
        targetAmount: DEMO_GOALS.fire.targetAmount, currentAmount: DEMO_GOALS.main.currentAmount,
        monthlyContribution: DEMO_GOALS.main.monthlyContribution,
        expectedReturn: DEMO_GOALS.main.expectedReturn, progress: DEMO_GOALS.fire.progress,
        isMain: false, milestones: [],
      },
    ]
  }

  async get(_userId: string, id: string) {
    return {
      id, type: 'patrimony', name: DEMO_GOALS.main.name,
      targetAmount: DEMO_GOALS.main.targetAmount, currentAmount: DEMO_GOALS.main.currentAmount,
      monthlyContribution: DEMO_GOALS.main.monthlyContribution,
      expectedReturn: DEMO_GOALS.main.expectedReturn, progress: DEMO_GOALS.main.progress,
      isMain: true, milestones: [],
    }
  }

  async getMain() {
    return {
      id: 'goal-main', type: 'patrimony', name: DEMO_GOALS.main.name,
      targetAmount: DEMO_GOALS.main.targetAmount, currentAmount: DEMO_GOALS.main.currentAmount,
      monthlyContribution: DEMO_GOALS.main.monthlyContribution,
      expectedReturn: DEMO_GOALS.main.expectedReturn, progress: DEMO_GOALS.main.progress,
      yearsToTarget: DEMO_GOALS.main.yearsRemaining,
      projectedDate: new Date(new Date().getFullYear() + DEMO_GOALS.main.yearsRemaining, 0, 1),
      isMain: true,
      milestones: [
        { id: 'm1', title: 'R$ 50 mil', targetAmount: 50000, isCompleted: true, completedAt: new Date('2023-06-15') },
        { id: 'm2', title: 'R$ 100 mil', targetAmount: 100000, isCompleted: true, completedAt: new Date('2024-03-20') },
        { id: 'm3', title: 'R$ 250 mil', targetAmount: 250000, isCompleted: false, completedAt: null },
        { id: 'm4', title: 'R$ 500 mil', targetAmount: 500000, isCompleted: false, completedAt: null },
        { id: 'm5', title: 'R$ 1 milhão', targetAmount: 1000000, isCompleted: false, completedAt: null },
      ],
    }
  }

  async create(userId: string, data: any) {
    return {
      id: `goal-${Date.now()}`, ...data, userId,
      currentAmount: DEMO_GOALS.main.currentAmount,
      createdAt: new Date(), updatedAt: new Date(),
    }
  }

  async update(_userId: string, data: any) {
    return { ...data, updatedAt: new Date() }
  }

  async delete() {
    return { success: true }
  }

  async syncCurrentAmount() {
    return { currentAmount: DEMO_GOALS.main.currentAmount }
  }

  async getCurrentPortfolioValue() {
    return DEMO_GOALS.main.currentAmount
  }

  async createFIREGoal(_userId: string, data: any, fireCalc: any) {
    const currentAmount = DEMO_GOALS.main.currentAmount
    return {
      goal: {
        id: `fire-${Date.now()}`, type: 'fire', name: 'Independência Financeira (FIRE)',
        targetAmount: fireCalc.fireNumber, currentAmount,
        targetDate: fireCalc.projectedDate,
        monthlyContribution: data.monthlyContribution,
        expectedReturn: data.annualReturn,
      },
      fireCalculation: fireCalc,
    }
  }

  async getMilestones() {
    return [
      { id: 'm1', title: 'R$ 50 mil', targetAmount: 50000, isCompleted: true, completedAt: new Date('2023-06-15') },
      { id: 'm2', title: 'R$ 100 mil', targetAmount: 100000, isCompleted: true, completedAt: new Date('2024-03-20') },
      { id: 'm3', title: 'R$ 250 mil', targetAmount: 250000, isCompleted: false, completedAt: null },
      { id: 'm4', title: 'R$ 500 mil', targetAmount: 500000, isCompleted: false, completedAt: null },
      { id: 'm5', title: 'R$ 1 milhão', targetAmount: 1000000, isCompleted: false, completedAt: null },
    ]
  }

  async addMilestone(_userId: string, data: { goalId: string; title: string; targetAmount: number }) {
    return {
      id: `milestone-${Date.now()}`, goalId: data.goalId, title: data.title,
      targetAmount: data.targetAmount,
      isCompleted: DEMO_GOALS.main.currentAmount >= data.targetAmount,
      completedAt: DEMO_GOALS.main.currentAmount >= data.targetAmount ? new Date() : null,
    }
  }

  async completeMilestone(_userId: string, id: string) {
    return { id, isCompleted: true, completedAt: new Date() }
  }

  async deleteMilestone() {
    return { success: true }
  }

  async getPassiveIncomeStatus() {
    const ALL_ASSETS = await getAssets()
    const portfolioValue = (DEMO_PORTFOLIOS[0]?.positions ?? []).reduce((sum, p) => {
      const livePrice = ALL_ASSETS.find(a => a.ticker === p.ticker)?.price ?? p.currentPrice
      return sum + p.quantity * livePrice
    }, 0)
    return {
      currentMonthlyIncome: DEMO_GOALS.passiveIncome.currentMonthly,
      targetMonthlyIncome: DEMO_GOALS.passiveIncome.targetMonthly,
      progress: DEMO_GOALS.passiveIncome.progress, averageYield: 0.08, portfolioValue,
      goal: {
        id: 'goal-passive', type: 'passive_income',
        name: `R$ ${DEMO_GOALS.passiveIncome.targetMonthly}/mês em dividendos`,
        targetAmount: DEMO_GOALS.passiveIncome.targetMonthly,
        currentAmount: DEMO_GOALS.passiveIncome.currentMonthly,
      },
    }
  }
}
