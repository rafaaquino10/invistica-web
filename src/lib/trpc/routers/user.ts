import { z } from 'zod'
import { router, protectedProcedure } from '../trpc'
import { signJWT } from '@/lib/auth/jwt'
import { setAuthCookie } from '@/lib/auth/cookies'

export const userRouter = router({
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    return ctx.repos.user.getProfile(ctx.session.user.id, ctx.session.user)
  }),

  updateProfile: protectedProcedure
    .input(z.object({ name: z.string().min(1).max(100) }))
    .mutation(async ({ ctx, input }) => {
      return ctx.repos.user.updateProfile(ctx.session.user.id, input)
    }),

  refreshSession: protectedProcedure.mutation(async ({ ctx }) => {
    const result = await ctx.repos.user.refreshSession(ctx.session.user.id)

    // Sign fresh JWT if payload provided (Prisma path)
    if (result.jwtPayload) {
      const token = await signJWT(result.jwtPayload)
      await setAuthCookie(token)
    }

    return { user: result.user }
  }),

  updatePreferences: protectedProcedure
    .input(z.object({ themePreference: z.enum(['light', 'dark', 'system']) }))
    .mutation(async ({ ctx, input }) => {
      return ctx.repos.user.updatePreferences(ctx.session.user.id, input)
    }),

  getNotificationPreferences: protectedProcedure
    .query(async ({ ctx }) => {
      return ctx.repos.user.getNotificationPreferences(ctx.session.user.id)
    }),

  updateNotificationPreferences: protectedProcedure
    .input(z.object({ emailNotifications: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.repos.user.updateNotificationPreferences(ctx.session.user.id, input)
    }),
})
