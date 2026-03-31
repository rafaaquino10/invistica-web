// ============================================================
// InvestIQ — Radar Models
// ============================================================

export interface FeedItem {
  id: string;
  type: string;
  title: string;
  description: string | null;
  ticker: string | null;
  created_at: string;
  metadata: Record<string, unknown> | null;
}

export interface FeedResponse {
  feed: FeedItem[];
  count: number;
}

export interface UserAlert {
  id: string;
  asset_id: string;
  type: string;
  threshold: number | null;
  active: boolean;
  created_at: string;
  triggered_at: string | null;
}

export interface CreateAlertRequest {
  asset_id: string;
  type: 'price_above' | 'price_below' | 'score_change' | 'dividend';
  threshold?: number;
}
