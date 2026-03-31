import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import {
  ModelPerformance, TopResponse, ScreenerResponse, CompareResponse,
  CatalystsResponse, ScoreDetail, ScoreBreakdown, RiskMetrics,
  Dossier, ScoreHistory, Evidence, Thesis,
} from '../models/score.model';

export interface ScreenerParams {
  cluster_id?: number;
  min_score?: number;
  rating?: string;
  min_yield?: number;
  min_margin?: number;
  limit?: number; // max 200
}

@Injectable({ providedIn: 'root' })
export class ScoreService {
  private readonly api = inject(ApiService);

  getPerformance(): Observable<ModelPerformance> {
    return this.api.get('/scores/performance');
  }

  getTop(limit = 20): Observable<TopResponse> {
    return this.api.get('/scores/top', { limit });
  }

  screener(params?: ScreenerParams): Observable<ScreenerResponse> {
    return this.api.get('/scores/screener', params as Record<string, string | number>);
  }

  compare(tickers: string[]): Observable<CompareResponse> {
    return this.api.get('/scores/compare', { tickers: tickers.join(',') });
  }

  getCatalysts(days = 30): Observable<CatalystsResponse> {
    return this.api.get('/scores/catalysts', { days });
  }

  getScore(ticker: string, portfolio_id?: string): Observable<ScoreDetail> {
    const params: Record<string, string> = {};
    if (portfolio_id) params['portfolio_id'] = portfolio_id;
    return this.api.get(`/scores/${ticker}`, params);
  }

  getBreakdown(ticker: string): Observable<ScoreBreakdown> {
    return this.api.get(`/scores/${ticker}/breakdown`);
  }

  getRiskMetrics(ticker: string): Observable<RiskMetrics> {
    return this.api.get(`/scores/${ticker}/risk-metrics`);
  }

  getDossier(ticker: string): Observable<Dossier> {
    return this.api.get(`/scores/${ticker}/dossier`);
  }

  getHistory(ticker: string, limit = 12): Observable<ScoreHistory> {
    return this.api.get(`/scores/${ticker}/history`, { limit });
  }

  getEvidence(ticker: string): Observable<{ ticker: string; evidences: Evidence[] }> {
    return this.api.get(`/scores/${ticker}/evidence`);
  }

  getThesis(ticker: string): Observable<Thesis> {
    return this.api.get(`/scores/${ticker}/thesis`);
  }
}
