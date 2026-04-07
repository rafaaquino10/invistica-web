// ─── Repository Factory ──────────────────────────────────────
// Creates the appropriate repository implementations based on mode.

import type { PrismaClient } from '@prisma/client'

import { DemoPortfolioRepo } from './demo/portfolio'
import { DemoGoalsRepo } from './demo/goals'
import { DemoRadarRepo } from './demo/radar'
import { DemoUserRepo } from './demo/user'
import { DemoDividendsRepo } from './demo/dividends'

import { PrismaPortfolioRepo } from './prisma/portfolio'
import { PrismaGoalsRepo } from './prisma/goals'
import { PrismaRadarRepo } from './prisma/radar'
import { PrismaUserRepo } from './prisma/user'
import { PrismaDividendsRepo } from './prisma/dividends'

export function createRepositories(isDemoMode: boolean, prisma: PrismaClient) {
  if (isDemoMode) {
    return {
      portfolio: new DemoPortfolioRepo(),
      goals: new DemoGoalsRepo(),
      radar: new DemoRadarRepo(),
      user: new DemoUserRepo(),
      dividends: new DemoDividendsRepo(),
    }
  }

  return {
    portfolio: new PrismaPortfolioRepo(prisma),
    goals: new PrismaGoalsRepo(prisma),
    radar: new PrismaRadarRepo(prisma),
    user: new PrismaUserRepo(prisma),
    dividends: new PrismaDividendsRepo(prisma),
  }
}

