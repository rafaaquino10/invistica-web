export type {
  SmartPortfolio,
  PortfolioCriteria,
  ExitCriteria,
  QualifiedStock,
  SmartPortfolioResult,
  AlmostQualified,
  ExitAlert,
  ExitAlertType,
  ExitAlertSeverity,
  UserPosition,
  IncomeSimulation,
} from './types'
export { SMART_PORTFOLIOS } from './portfolios'
export { filterAndRankPortfolio, getAllSmartPortfolios, getClosestToQualifying } from './engine'
export { generateExitAlerts } from './exit-alerts'
export { simulateIncome } from './income-simulator'
