import { router } from '../trpc'
import { assetsRouter } from './assets'
import { screenerRouter } from './screener'
import { portfolioRouter } from './portfolio'
import { dividendsRouter } from './dividends'
import { radarRouter } from './radar'
import { goalsRouter } from './goals'
import { userRouter } from './user'
import { economyRouter } from './economy'
import { scoreHistoryRouter } from './score-history'
import { insightsRouter } from './insights'
import { smartPortfoliosRouter } from './smart-portfolios'
import { analyticsRouter } from './analytics'
import { scoreSnapshotsRouter } from './score-snapshots'
import { valuationRouter } from './valuation'
import { communityRouter } from './community'
import { newsRouter } from './news'

export const appRouter = router({
  assets: assetsRouter,
  screener: screenerRouter,
  portfolio: portfolioRouter,
  dividends: dividendsRouter,
  radar: radarRouter,
  goals: goalsRouter,
  user: userRouter,
  economy: economyRouter,
  scoreHistory: scoreHistoryRouter,
  insights: insightsRouter,
  smartPortfolios: smartPortfoliosRouter,
  analytics: analyticsRouter,
  scoreSnapshots: scoreSnapshotsRouter,
  valuation: valuationRouter,
  community: communityRouter,
  news: newsRouter,
})

export type AppRouter = typeof appRouter
