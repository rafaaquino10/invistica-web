// ─── Prisma Goals Repository ─────────────────────────────────

import type { PrismaClient } from '@prisma/client'
import { TRPCError } from '@trpc/server'
import { serializePrismaObject } from '@/lib/utils/prisma-helpers'

// Milestone generation utilities
function generateMilestoneAmounts(targetAmount: number): number[] {
  const milestones: number[] = []
  const standard = [10000, 25000, 50000, 100000, 250000, 500000, 750000, 1000000, 1500000, 2000000, 3000000, 5000000, 10000000]
  for (const m of standard) { if (m <= targetAmount) milestones.push(m) }
  if (!milestones.includes(targetAmount)) milestones.push(targetAmount)
  return milestones
}

function formatMilestoneTitle(amount: number): string {
  if (amount >= 1000000) {
    const millions = amount / 1000000
    return `R$ ${millions % 1 === 0 ? millions.toFixed(0) : millions.toFixed(1)} milhão${millions !== 1 ? 'ões' : ''}`
  } else if (amount >= 1000) return `R$ ${(amount / 1000).toFixed(0)} mil`
  return `R$ ${amount.toFixed(0)}`
}

// Simulation utility
function runSimulation(initialAmount: number, monthlyContribution: number, targetAmount: number, annualReturn: number, years: number) {
  const monthlyReturn = Math.pow(1 + annualReturn, 1 / 12) - 1
  let currentValue = initialAmount
  let targetReached = initialAmount >= targetAmount
  let yearTargetReached: number | null = targetReached ? 0 : null
  for (let year = 1; year <= years; year++) {
    for (let month = 0; month < 12; month++) {
      currentValue = currentValue * (1 + monthlyReturn) + monthlyContribution
    }
    if (!targetReached && currentValue >= targetAmount) { targetReached = true; yearTargetReached = year }
  }
  return { yearTargetReached }
}

export class PrismaGoalsRepo {
  constructor(private prisma: PrismaClient) {}

  async list(userId: string) {
    const goals = await this.prisma.goal.findMany({
      where: { userId },
      include: { milestones: { orderBy: { targetAmount: 'asc' } } },
      orderBy: [{ isMain: 'desc' }, { priority: 'asc' }, { createdAt: 'asc' }],
    })
    return goals.map((goal) => ({
      ...goal, targetAmount: Number(goal.targetAmount), currentAmount: Number(goal.currentAmount),
      monthlyContribution: goal.monthlyContribution ? Number(goal.monthlyContribution) : null,
      expectedReturn: goal.expectedReturn ? Number(goal.expectedReturn) : null,
      progress: (Number(goal.currentAmount) / Number(goal.targetAmount)) * 100,
      milestones: goal.milestones.map((m) => ({ ...m, targetAmount: Number(m.targetAmount) })),
    }))
  }

  async get(userId: string, id: string) {
    const goal = await this.prisma.goal.findFirst({
      where: { id, userId },
      include: { milestones: { orderBy: { targetAmount: 'asc' } } },
    })
    if (!goal) throw new TRPCError({ code: 'NOT_FOUND', message: 'Meta não encontrada' })
    return {
      ...goal, targetAmount: Number(goal.targetAmount), currentAmount: Number(goal.currentAmount),
      monthlyContribution: goal.monthlyContribution ? Number(goal.monthlyContribution) : null,
      expectedReturn: goal.expectedReturn ? Number(goal.expectedReturn) : null,
      progress: (Number(goal.currentAmount) / Number(goal.targetAmount)) * 100,
      milestones: goal.milestones.map((m) => ({ ...m, targetAmount: Number(m.targetAmount) })),
    }
  }

  async getMain(userId: string) {
    const goal = await this.prisma.goal.findFirst({
      where: { userId, isMain: true },
      include: { milestones: { orderBy: { targetAmount: 'asc' } } },
    })
    if (!goal) return null

    const currentAmount = Number(goal.currentAmount)
    const targetAmount = Number(goal.targetAmount)
    const monthlyContribution = goal.monthlyContribution ? Number(goal.monthlyContribution) : 0
    const expectedReturn = goal.expectedReturn ? Number(goal.expectedReturn) : 0.08
    const simulation = runSimulation(currentAmount, monthlyContribution, targetAmount, expectedReturn, 30)

    return {
      ...goal, targetAmount, currentAmount, monthlyContribution, expectedReturn,
      progress: (currentAmount / targetAmount) * 100,
      yearsToTarget: simulation.yearTargetReached,
      projectedDate: simulation.yearTargetReached
        ? new Date(new Date().getFullYear() + simulation.yearTargetReached, 0, 1)
        : null,
      milestones: goal.milestones.map((m) => ({ ...m, targetAmount: Number(m.targetAmount) })),
    }
  }

  async create(userId: string, data: any) {
    if (data.isMain) {
      await this.prisma.goal.updateMany({ where: { userId, isMain: true }, data: { isMain: false } })
    }
    const currentAmount = await this.getCurrentPortfolioValue(userId)
    const goal = await this.prisma.goal.create({
      data: {
        userId, type: data.type, name: data.name, targetAmount: data.targetAmount,
        currentAmount, targetDate: data.targetDate, monthlyContribution: data.monthlyContribution,
        expectedReturn: data.expectedReturn, isMain: data.isMain, notes: data.notes,
      },
    })
    if (data.type === 'patrimony' && data.targetAmount >= 100000) {
      const milestoneAmounts = generateMilestoneAmounts(data.targetAmount)
      await this.prisma.milestone.createMany({
        data: milestoneAmounts.map((amount) => ({
          goalId: goal.id, title: formatMilestoneTitle(amount), targetAmount: amount,
          isCompleted: amount <= currentAmount, completedAt: amount <= currentAmount ? new Date() : null,
        })),
      })
    }
    return serializePrismaObject(goal)
  }

  async update(userId: string, data: any) {
    const { id, ...rest } = data
    if (rest.isMain) {
      await this.prisma.goal.updateMany({ where: { userId, isMain: true, id: { not: id } }, data: { isMain: false } })
    }
    const updateData: any = { ...rest }
    if (rest.isCompleted) updateData.completedAt = new Date()
    const goal = await this.prisma.goal.update({ where: { id, userId }, data: updateData })
    return serializePrismaObject(goal)
  }

  async delete(userId: string, id: string) {
    await this.prisma.goal.delete({ where: { id, userId } })
    return { success: true }
  }

  async syncCurrentAmount(userId: string, id: string) {
    const currentAmount = await this.getCurrentPortfolioValue(userId)
    const goal = await this.prisma.goal.update({
      where: { id, userId }, data: { currentAmount }, include: { milestones: true },
    })
    for (const milestone of goal.milestones) {
      if (!milestone.isCompleted && currentAmount >= Number(milestone.targetAmount)) {
        await this.prisma.milestone.update({
          where: { id: milestone.id }, data: { isCompleted: true, completedAt: new Date() },
        })
      }
    }
    return { currentAmount }
  }

  async getCurrentPortfolioValue(userId: string) {
    const portfolios = await this.prisma.portfolio.findMany({
      where: { userId }, include: { positions: { where: { quantity: { gt: 0 } } } },
    })
    return portfolios.flatMap((p) => p.positions).reduce((sum, p) => sum + Number(p.quantity) * Number(p.avgCost), 0)
  }

  async createFIREGoal(userId: string, data: any, fireCalc: any) {
    const currentAmount = await this.getCurrentPortfolioValue(userId)
    const goal = await this.prisma.goal.create({
      data: {
        userId, type: 'fire', name: 'Independência Financeira (FIRE)',
        targetAmount: fireCalc.fireNumber, currentAmount,
        targetDate: fireCalc.projectedDate, monthlyContribution: data.monthlyContribution,
        expectedReturn: data.annualReturn,
        notes: `Despesas mensais: R$ ${data.monthlyExpenses.toFixed(2)} | Taxa de retirada segura: ${(data.safeWithdrawalRate * 100).toFixed(1)}%`,
      },
    })
    const milestoneAmounts = generateMilestoneAmounts(fireCalc.fireNumber)
    await this.prisma.milestone.createMany({
      data: milestoneAmounts.map((amount) => ({
        goalId: goal.id, title: formatMilestoneTitle(amount), targetAmount: amount,
        isCompleted: amount <= currentAmount, completedAt: amount <= currentAmount ? new Date() : null,
      })),
    })
    return { goal, fireCalculation: fireCalc }
  }

  async getMilestones(userId: string, goalId: string) {
    const goal = await this.prisma.goal.findFirst({
      where: { id: goalId, userId },
      include: { milestones: { orderBy: { targetAmount: 'asc' } } },
    })
    if (!goal) throw new TRPCError({ code: 'NOT_FOUND', message: 'Meta não encontrada' })
    return goal.milestones.map((m) => ({ ...m, targetAmount: Number(m.targetAmount) }))
  }

  async addMilestone(userId: string, data: { goalId: string; title: string; targetAmount: number }) {
    const goal = await this.prisma.goal.findFirst({ where: { id: data.goalId, userId } })
    if (!goal) throw new TRPCError({ code: 'NOT_FOUND', message: 'Meta não encontrada' })
    const milestone = await this.prisma.milestone.create({
      data: {
        goalId: data.goalId, title: data.title, targetAmount: data.targetAmount,
        isCompleted: Number(goal.currentAmount) >= data.targetAmount,
        completedAt: Number(goal.currentAmount) >= data.targetAmount ? new Date() : null,
      },
    })
    return serializePrismaObject(milestone)
  }

  async completeMilestone(userId: string, id: string) {
    const milestone = await this.prisma.milestone.findFirst({
      where: { id }, include: { goal: { select: { userId: true } } },
    })
    if (!milestone || milestone.goal.userId !== userId) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Marco não encontrado' })
    }
    return this.prisma.milestone.update({ where: { id }, data: { isCompleted: true, completedAt: new Date() } })
  }

  async deleteMilestone(userId: string, id: string) {
    const milestone = await this.prisma.milestone.findFirst({
      where: { id }, include: { goal: { select: { userId: true } } },
    })
    if (!milestone || milestone.goal.userId !== userId) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Marco não encontrado' })
    }
    await this.prisma.milestone.delete({ where: { id } })
    return { success: true }
  }

  async getPassiveIncomeStatus(userId: string) {
    const incomeGoal = await this.prisma.goal.findFirst({ where: { userId, type: 'passive_income' } })
    const portfolios = await this.prisma.portfolio.findMany({
      where: { userId },
      include: {
        positions: {
          where: { quantity: { gt: 0 } },
          include: {
            asset: {
              include: {
                dividends: {
                  where: { paymentDate: { gte: new Date(new Date().setFullYear(new Date().getFullYear() - 1)) } },
                },
              },
            },
          },
        },
      },
    })
    let totalAnnualDividends = 0
    let portfolioValue = 0
    portfolios.forEach((portfolio) => {
      portfolio.positions.forEach((position) => {
        const value = Number(position.quantity) * Number(position.avgCost)
        portfolioValue += value
        totalAnnualDividends += position.asset.dividends.reduce(
          (sum, d) => sum + Number(d.valuePerShare) * Number(position.quantity), 0,
        )
      })
    })
    const currentMonthlyIncome = totalAnnualDividends / 12
    const averageYield = portfolioValue > 0 ? totalAnnualDividends / portfolioValue : 0
    return {
      currentMonthlyIncome,
      targetMonthlyIncome: incomeGoal ? Number(incomeGoal.targetAmount) : 0,
      progress: incomeGoal ? (currentMonthlyIncome / Number(incomeGoal.targetAmount)) * 100 : 0,
      averageYield, portfolioValue,
      goal: incomeGoal ? { ...incomeGoal, targetAmount: Number(incomeGoal.targetAmount), currentAmount: Number(incomeGoal.currentAmount) } : null,
    }
  }
}
