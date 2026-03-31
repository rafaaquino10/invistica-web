// ============================================================
// InvestIQ — Backtest Models
// ============================================================

export type BenchmarkId = 'IBOV' | 'CDI' | 'SMLL' | 'IDIV' | 'IFIX' | 'SPX' | 'USD' | 'GOLD';

export interface BacktestRequest {
  start_date: string;
  end_date: string;
  rebalance_freq?: 'monthly' | 'quarterly';
  universe_size?: number;       // 10-500, default 100
  long_pct?: number;            // 0.05-0.5, default 0.1
  min_iq_score_buy?: number;    // 50-95, default 70
  benchmarks?: BenchmarkId[];   // default ['IBOV','CDI']
  initial_capital?: number;     // >= 1000, default 1_000_000
  transaction_cost_bps?: number; // 0-200, default 50
}

export interface BacktestSeriesEntry {
  date: string;
  value: number;
}

export interface BacktestBenchmark {
  name: string;
  series: BacktestSeriesEntry[];
  total_return: number;
  annualized_return: number | null;
  max_drawdown: number | null;
  sharpe: number | null;
}

export interface BacktestResult {
  strategy: {
    series: BacktestSeriesEntry[];
    total_return: number;
    annualized_return: number | null;
    max_drawdown: number | null;
    sharpe: number | null;
    turnover_avg: number | null;
    total_trades: number | null;
  };
  benchmarks: BacktestBenchmark[];
  rebalance_dates: string[];
  holdings_history: Record<string, string[]> | null;
}
