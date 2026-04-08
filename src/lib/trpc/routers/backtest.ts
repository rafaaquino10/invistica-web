// ─── Backtest Router ─────────────────────────────────────────
// Conecta ao POST /backtest do IQ-Cognit Engine (Nuclear v8)

import { z } from 'zod'
import { router, premiumProcedure } from '../trpc'
import { investiq } from '@/lib/investiq-client'

interface BacktestResult {
  summary: {
    cagr: number
    total_return: number
    alpha_vs_ibov: number
    sharpe_ratio: number
    max_drawdown: number
    win_rate: number
    ic_spearman: number
    avg_positions: number
    turnover_annual: number
  }
  equity_curve: Array<{ date: string; portfolio: number; benchmark: number }>
  annual_returns: Array<{
    year: number
    portfolio_return: number
    benchmark_return: number
    alpha: number
    positions: number
  }>
  stress_tests?: Array<{
    scenario: string
    portfolio_drawdown: number
    benchmark_drawdown: number
    recovery_days: number | null
  }>
  walk_forward?: Array<{
    period: string
    in_sample_ic: number
    out_of_sample_ic: number
    passed: boolean
  }>
}

export const backtestRouter = router({
  run: premiumProcedure
    .input(z.object({
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      rebalanceFrequency: z.enum(['monthly', 'quarterly']).default('quarterly'),
      universeSize: z.number().min(10).max(500).default(60),
      longPct: z.number().min(5).max(50).default(20),
      benchmark: z.enum(['IBOV', 'CDI', 'SMLL', 'IDIV']).default('IBOV'),
      includeShort: z.boolean().default(false),
      includeLeverage: z.boolean().default(false),
    }))
    .query(async ({ input }) => {
      try {
        const res = await investiq.post<BacktestResult>('/backtest', {
          body: {
            start_date: input.startDate ?? '2016-01-01',
            end_date: input.endDate,
            rebalance_frequency: input.rebalanceFrequency,
            universe_top_n: input.universeSize,
            long_pct: input.longPct / 100,
            benchmark: input.benchmark,
            include_short: input.includeShort,
            include_leverage: input.includeLeverage,
          },
          timeout: 60000,
        })
        return { available: true as const, ...res }
      } catch (err) {
        return { available: false as const, error: (err as Error).message }
      }
    }),

  // Strategy signals from backend
  signals: premiumProcedure.query(async () => {
    try {
      const res = await investiq.get<{
        signals: Array<{
          ticker: string
          action: 'buy' | 'sell' | 'hold' | 'rotate'
          iq_score: number
          reason: string
          strength: number
        }>
        regime: string
        confidence: number
        updated_at: string
      }>('/strategy/signals')
      return { available: true as const, ...res }
    } catch {
      return { available: false as const, signals: [], regime: null, confidence: 0, updated_at: null }
    }
  }),

  // Risk status
  riskStatus: premiumProcedure.query(async () => {
    try {
      const res = await investiq.get<{
        regime: string
        vol_stress: number
        confidence: number
        recent_drawdown: number
        kill_switch: boolean
        kill_reason: string | null
      }>('/strategy/risk-status')
      return { available: true as const, ...res }
    } catch {
      return { available: false as const, regime: null, vol_stress: 0, confidence: 0, recent_drawdown: 0, kill_switch: false, kill_reason: null }
    }
  }),

  // Sector rotation matrix
  sectorRotation: premiumProcedure.query(async () => {
    try {
      const res = await investiq.get<{
        current_regime: string
        matrix: Record<string, Record<string, { signal: string; tilt_points: number }>>
        clusters: Array<{ id: number; name: string }>
      }>('/analytics/sector-rotation')
      return { available: true as const, ...res }
    } catch {
      return { available: false as const, current_regime: null, matrix: {}, clusters: [] }
    }
  }),
})
