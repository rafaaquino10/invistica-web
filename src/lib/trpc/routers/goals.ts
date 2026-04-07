/**
 * Goals tRPC Router
 *
 * Handles financial goals, FIRE calculations, and milestones
 */

import { z } from 'zod'
import { router, protectedProcedure } from '../trpc'

const goalTypeSchema = z.enum(['patrimony', 'passive_income', 'fire', 'custom'])

// ===========================================
// FIRE Calculator Utilities
// ===========================================

interface FIRECalculation {
  fireNumber: number
  yearsToFire: number
  monthlyContributionNeeded: number
  projectedDate: Date
  currentProgress: number
  safeWithdrawalRate: number
}

function calculateFIRE(
  currentAmount: number,
  monthlyExpenses: number,
  monthlyContribution: number,
  annualReturn: number = 0.08,
  safeWithdrawalRate: number = 0.04
): FIRECalculation {
  const fireNumber = (monthlyExpenses * 12) / safeWithdrawalRate
  const currentProgress = (currentAmount / fireNumber) * 100
  const monthlyReturn = Math.pow(1 + annualReturn, 1 / 12) - 1

  let years = 0
  let projected = currentAmount
  while (projected < fireNumber && years < 100) {
    for (let month = 0; month < 12; month++) {
      projected = projected * (1 + monthlyReturn) + monthlyContribution
    }
    years++
  }

  const projectedDate = new Date()
  projectedDate.setFullYear(projectedDate.getFullYear() + years)

  const targetYears = 20
  const periods = targetYears * 12
  const compoundFactor = Math.pow(1 + monthlyReturn, periods)
  const monthlyContributionNeeded = ((fireNumber - currentAmount * compoundFactor) * monthlyReturn) / (compoundFactor - 1)

  return { fireNumber, yearsToFire: years, monthlyContributionNeeded: Math.max(0, monthlyContributionNeeded), projectedDate, currentProgress, safeWithdrawalRate }
}

function runSimulation(initialAmount: number, monthlyContribution: number, targetAmount: number, annualReturn: number, years: number) {
  const monthlyReturn = Math.pow(1 + annualReturn, 1 / 12) - 1
  const yearsArray: number[] = [0]
  const valuesArray: number[] = [initialAmount]
  const contributionsArray: number[] = [0]
  const returnsArray: number[] = [0]

  let currentValue = initialAmount
  let totalContributions = 0, totalReturns = 0
  let targetReached = initialAmount >= targetAmount
  let yearTargetReached: number | null = targetReached ? 0 : null

  for (let year = 1; year <= years; year++) {
    let yearlyContribution = 0, yearlyReturn = 0
    for (let month = 0; month < 12; month++) {
      const monthReturn = currentValue * monthlyReturn
      currentValue += monthReturn + monthlyContribution
      yearlyContribution += monthlyContribution
      yearlyReturn += monthReturn
    }
    totalContributions += yearlyContribution
    totalReturns += yearlyReturn
    yearsArray.push(year)
    valuesArray.push(currentValue)
    contributionsArray.push(totalContributions)
    returnsArray.push(totalReturns)
    if (!targetReached && currentValue >= targetAmount) { targetReached = true; yearTargetReached = year }
  }

  return { years: yearsArray, values: valuesArray, contributions: contributionsArray, returns: returnsArray, targetReached, yearTargetReached }
}

// ===========================================
// Router Definition
// ===========================================

export const goalsRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return ctx.repos.goals.list(ctx.session.user.id)
  }),

  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.repos.goals.get(ctx.session.user.id, input.id)
    }),

  mainGoal: protectedProcedure.query(async ({ ctx }) => {
    return ctx.repos.goals.getMain(ctx.session.user.id)
  }),

  create: protectedProcedure
    .input(z.object({
      type: goalTypeSchema,
      name: z.string().min(1).max(100),
      targetAmount: z.number().positive(),
      targetDate: z.date().optional(),
      monthlyContribution: z.number().min(0).optional(),
      expectedReturn: z.number().min(0).max(1).optional(),
      isMain: z.boolean().default(false),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.repos.goals.create(ctx.session.user.id, input)
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      name: z.string().min(1).max(100).optional(),
      targetAmount: z.number().positive().optional(),
      currentAmount: z.number().min(0).optional(),
      targetDate: z.date().optional().nullable(),
      monthlyContribution: z.number().min(0).optional().nullable(),
      expectedReturn: z.number().min(0).max(1).optional().nullable(),
      isMain: z.boolean().optional(),
      isCompleted: z.boolean().optional(),
      notes: z.string().optional().nullable(),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.repos.goals.update(ctx.session.user.id, input)
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.repos.goals.delete(ctx.session.user.id, input.id)
    }),

  syncCurrentAmount: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.repos.goals.syncCurrentAmount(ctx.session.user.id, input.id)
    }),

  calculateFIRE: protectedProcedure
    .input(z.object({
      currentAmount: z.number().min(0),
      monthlyExpenses: z.number().positive(),
      monthlyContribution: z.number().min(0),
      annualReturn: z.number().min(0).max(1).default(0.08),
      safeWithdrawalRate: z.number().min(0.01).max(0.1).default(0.04),
    }))
    .query(({ input }) => {
      return calculateFIRE(input.currentAmount, input.monthlyExpenses, input.monthlyContribution, input.annualReturn, input.safeWithdrawalRate)
    }),

  createFIREGoal: protectedProcedure
    .input(z.object({
      monthlyExpenses: z.number().positive(),
      monthlyContribution: z.number().min(0),
      annualReturn: z.number().min(0).max(1).default(0.08),
      safeWithdrawalRate: z.number().min(0.01).max(0.1).default(0.04),
    }))
    .mutation(async ({ ctx, input }) => {
      const currentAmount = await ctx.repos.goals.getCurrentPortfolioValue(ctx.session.user.id)
      const fireCalc = calculateFIRE(currentAmount, input.monthlyExpenses, input.monthlyContribution, input.annualReturn, input.safeWithdrawalRate)
      return ctx.repos.goals.createFIREGoal(ctx.session.user.id, input, fireCalc)
    }),

  simulate: protectedProcedure
    .input(z.object({
      initialAmount: z.number().min(0),
      monthlyContribution: z.number().min(0),
      targetAmount: z.number().positive(),
      annualReturn: z.number().min(0).max(1).default(0.08),
      years: z.number().min(1).max(50).default(30),
    }))
    .query(({ input }) => {
      const result = runSimulation(input.initialAmount, input.monthlyContribution, input.targetAmount, input.annualReturn, input.years)
      const scenarios = [
        { name: 'Conservador', annualReturn: 0.05, result: runSimulation(input.initialAmount, input.monthlyContribution, input.targetAmount, 0.05, input.years) },
        { name: 'Moderado', annualReturn: 0.08, result: runSimulation(input.initialAmount, input.monthlyContribution, input.targetAmount, 0.08, input.years) },
        { name: 'Agressivo', annualReturn: 0.12, result: runSimulation(input.initialAmount, input.monthlyContribution, input.targetAmount, 0.12, input.years) },
      ]
      return {
        base: result, scenarios,
        finalValue: result.values[result.values.length - 1],
        totalContributions: result.contributions[result.contributions.length - 1],
        totalReturns: result.returns[result.returns.length - 1],
      }
    }),

  milestones: protectedProcedure
    .input(z.object({ goalId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.repos.goals.getMilestones(ctx.session.user.id, input.goalId)
    }),

  addMilestone: protectedProcedure
    .input(z.object({
      goalId: z.string(),
      title: z.string().min(1).max(100),
      targetAmount: z.number().positive(),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.repos.goals.addMilestone(ctx.session.user.id, input)
    }),

  completeMilestone: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.repos.goals.completeMilestone(ctx.session.user.id, input.id)
    }),

  deleteMilestone: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.repos.goals.deleteMilestone(ctx.session.user.id, input.id)
    }),

  passiveIncomeStatus: protectedProcedure.query(async ({ ctx }) => {
    return ctx.repos.goals.getPassiveIncomeStatus(ctx.session.user.id)
  }),
})
