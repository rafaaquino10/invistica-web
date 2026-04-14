import { router } from '../trpc'
import { assetsRouter } from './assets'
import { screenerRouter } from './screener'
import { portfolioRouter } from './portfolio'
import { dividendsRouter } from './dividends'
import { radarRouter } from './radar'
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
import { backtestRouter } from './backtest'
import { pluggyRouter } from './pluggy'

export const appRouter = router({
  assets: assetsRouter,
  screener: screenerRouter,
  portfolio: portfolioRouter,
  dividends: dividendsRouter,
  radar: radarRouter,
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
  backtest: backtestRouter,
  pluggy: pluggyRouter,
})

export type AppRouter = typeof appRouter
