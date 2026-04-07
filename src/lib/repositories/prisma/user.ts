// ─── Prisma User Repository ──────────────────────────────────

import type { PrismaClient } from '@prisma/client'
import type { JWTPayload } from '@/lib/auth/types'

export class PrismaUserRepo {
  constructor(private prisma: PrismaClient) {}

  async getProfile(userId: string, sessionUser: any) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, name: true, email: true, plan: true,
        investorProfile: true, onboardingCompleted: true,
        themePreference: true, createdAt: true,
      },
    })

    if (!user) {
      return {
        id: userId, name: sessionUser?.name ?? null,
        email: sessionUser?.email ?? null,
        plan: sessionUser?.plan ?? 'free',
        investorProfile: null as string | null,
        onboardingCompleted: false, themePreference: 'system', createdAt: new Date(),
      }
    }
    return user
  }

  async updateProfile(userId: string, data: { name: string }) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { name: data.name },
    })
    return { success: true }
  }

  async refreshSession(userId: string) {
    const dbUser = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, email: true, name: true, image: true,
        plan: true, onboardingCompleted: true, themePreference: true,
      },
    })

    if (!dbUser || !dbUser.email) {
      return { user: null }
    }

    // Return user data + JWT payload for the router to sign
    const jwtPayload: JWTPayload = {
      userId: dbUser.id, email: dbUser.email,
      name: dbUser.name, image: dbUser.image,
      plan: (dbUser.plan as 'free' | 'pro' | 'elite') ?? 'free',
      onboardingCompleted: dbUser.onboardingCompleted,
      themePreference: dbUser.themePreference,
    }

    return {
      user: {
        id: dbUser.id, email: dbUser.email, name: dbUser.name,
        image: dbUser.image, plan: dbUser.plan,
        onboardingCompleted: dbUser.onboardingCompleted,
        themePreference: dbUser.themePreference,
      },
      jwtPayload,
    }
  }

  async updatePreferences(userId: string, data: { themePreference: string }) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { themePreference: data.themePreference },
    })
    return { success: true }
  }

  async getNotificationPreferences(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true } as any,
    })
    // emailNotifications campo adicionado via migration pendente
    const userAny = user as any
    return {
      emailNotifications: userAny?.emailNotifications ?? false,
      hasEmail: !!userAny?.email,
    }
  }

  async updateNotificationPreferences(userId: string, data: { emailNotifications: boolean }) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { emailNotifications: data.emailNotifications } as any,
    })
    return { success: true }
  }
}
