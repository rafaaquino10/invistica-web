// ============================================================
// InvestIQ — News Models
// ============================================================

export interface NewsItem {
  id: string;
  ticker: string;
  title: string;
  summary: string | null;
  source: string;
  url: string;
  published_at: string;
  sentiment: string | null;
}

export interface NewsResponse {
  ticker: string;
  news: NewsItem[];
}

export interface IREvent {
  id: string;
  ticker: string;
  title: string;
  type: string;
  date: string;
  url: string | null;
  summary: string | null;
}

export interface IRResponse {
  ticker: string;
  events: IREvent[];
}
