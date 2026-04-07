import { z } from 'zod'
import { router, publicProcedure, protectedProcedure } from '../trpc'
import { TRPCError } from '@trpc/server'

export const dividendsRouter = router({
  calendar: protectedProcedure
    .input(z.object({
      portfolioId: z.string().optional(),
      startDate: z.date().optional(),
      endDate: z.date().optional(),
    }))
    .query(async ({ ctx, input }) => {
      return ctx.repos.dividends.getCalendar(ctx.session.user.id, input)
    }),

  summary: protectedProcedure
    .input(z.object({
      portfolioId: z.string().optional(),
      period: z.enum(['1M', '3M', '6M', '1Y', 'YTD', 'ALL']).default('1Y'),
    }))
    .query(async ({ ctx, input }) => {
      return ctx.repos.dividends.getSummary(ctx.session.user.id, input)
    }),

  projections: protectedProcedure
    .input(z.object({
      portfolioId: z.string().optional(),
      months: z.number().min(1).max(24).default(12),
    }))
    .query(async ({ ctx, input }) => {
      return ctx.repos.dividends.getProjections(ctx.session.user.id, input)
    }),

  simulate: publicProcedure
    .input(z.object({
      tickers: z.array(z.string()).max(10),
      amounts: z.array(z.number().positive()),
    }))
    .query(async ({ ctx, input }) => {
      if (input.tickers.length !== input.amounts.length) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Tickers and amounts must have same length' })
      }
      return ctx.repos.dividends.simulate(input.tickers, input.amounts)
    }),

  history: publicProcedure
    .input(z.object({
      ticker: z.string(),
      years: z.number().min(1).max(10).default(5),
    }))
    .query(async ({ ctx, input }) => {
      return ctx.repos.dividends.getHistory(input.ticker, input.years)
    }),
})
