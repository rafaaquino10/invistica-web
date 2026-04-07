// ─── Demo User Repository ────────────────────────────────────

import { DEMO_USER } from '@/lib/auth/demo-user'

export class DemoUserRepo {
  async getProfile() {
    return {
      id: DEMO_USER.id,
      name: DEMO_USER.name,
      email: DEMO_USER.email,
      plan: DEMO_USER.plan,
      investorProfile: null as string | null,
      onboardingCompleted: DEMO_USER.onboardingCompleted,
      themePreference: DEMO_USER.themePreference,
      createdAt: new Date('2024-01-15'),
    }
  }

  async updateProfile() {
    return { success: true }
  }

  async refreshSession() {
    return {
      user: {
        id: DEMO_USER.id,
        email: DEMO_USER.email,
        name: DEMO_USER.name,
        image: DEMO_USER.image,
        plan: DEMO_USER.plan,
        onboardingCompleted: DEMO_USER.onboardingCompleted,
        themePreference: DEMO_USER.themePreference,
      },
      jwtPayload: undefined as undefined,
    }
  }

  async updatePreferences() {
    return { success: true }
  }

  async getNotificationPreferences() {
    return {
      emailNotifications: false,
      hasEmail: true,
    }
  }

  async updateNotificationPreferences() {
    return { success: true }
  }
}
