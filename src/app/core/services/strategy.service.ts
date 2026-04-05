import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface StrategyPosition {
  ticker: string;
  weight: string;
  iq_score: number;
  rating: string;
  margin_of_safety: string;
  opportunity_score: number;
  reason: string;
}

export interface StrategyRecommendation {
  date: string;
  regime: string;
  confidence: number;
  vol_stress_ratio: number;
  total_exposure: string;
  cash_weight: string;
  n_opportunities: number;
  long_positions: StrategyPosition[];
  short_candidates: any[];
  decisions: string[];
}

export interface StrategySignal {
  action: string;
  ticker: string;
  reason: string;
}

export interface StrategySignalsResponse {
  date: string;
  regime: string;
  signals: StrategySignal[];
  n_buy: number;
  n_sell: number;
  n_hold: number;
}

export interface VolStress {
  vol_21d: string;
  vol_252d: string;
  ratio: number;
  is_stressed: boolean;
  exposure_multiplier: number;
}

export interface ConfidenceState {
  level: number;
  hit_rate: string;
  total_decisions: number;
  forced_low: boolean;
  recent_dd: string;
}

export interface RiskStatus {
  regime: string;
  selic: string;
  ipca: string;
  vol_stress: VolStress;
  confidence: ConfidenceState;
}

export interface ShortCandidate {
  ticker: string;
  iq_score: number;
  rating: string;
  margin_of_safety: string;
  reason: string;
}

export interface ShortCandidatesResponse {
  regime: string;
  short_recommended: boolean;
  candidates: ShortCandidate[];
  n_candidates: number;
}

@Injectable({ providedIn: 'root' })
export class StrategyService {
  private readonly api = inject(ApiService);

  getRecommendation(): Observable<StrategyRecommendation> {
    return this.api.get('/strategy/portfolio-recommendation');
  }

  getSignals(): Observable<StrategySignalsResponse> {
    return this.api.get('/strategy/signals');
  }

  getRiskStatus(): Observable<RiskStatus> {
    return this.api.get('/strategy/risk-status');
  }

  getShortCandidates(): Observable<ShortCandidatesResponse> {
    return this.api.get('/strategy/short-candidates');
  }
}
