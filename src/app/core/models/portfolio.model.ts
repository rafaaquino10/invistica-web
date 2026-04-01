// ============================================================
// InvestIQ — Portfolio Models
// ============================================================

export interface Position {
  id: string;
  ticker: string;
  company_name: string;
  cluster_id: number;
  quantity: number;
  avg_price: number;
  current_price: number;
  market_value: number;
  gain_loss: number;
  gain_loss_pct: number;
  weight: number;
  iq_score: number | null;
  rating: string | null;
}

export interface PositionCreate {
  ticker: string;
  quantity: number;
  avg_price: number;
}

export interface PositionUpdate {
  quantity?: number;
  avg_price?: number;
}

export interface PortfolioResult {
  positions: Position[];
  total_value: number;
  total_gain_loss: number;
  total_gain_loss_pct: number;
  portfolio_id: string;
}

export interface SmartContributionItem {
  ticker: string;
  company_name: string;
  suggested_amount: number;
  reason: string;
  iq_score: number | null;
}

export interface SmartContributionResponse {
  aporte_total: number;
  suggestions: SmartContributionItem[];
}

export interface PortfolioAnalytics {
  portfolio_id: string;
  total_value: number;
  diversification_score: number | null;
  cluster_allocation: Record<string, number>;
  risk_metrics: {
    volatility: number | null;
    beta: number | null;
    sharpe: number | null;
    max_drawdown: number | null;
  };
}

export interface PortfolioAlert {
  id: string;
  type: string;
  message: string;
  ticker: string | null;
  severity: string;
  created_at: string;
}
