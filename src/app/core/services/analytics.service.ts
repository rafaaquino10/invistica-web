import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { RegimeResult, SectorRotationMatrix } from '../models/regime.model';
import { ICTimeline, SignalDecay, Sensitivity, PortfolioAttribution, PortfolioRisk } from '../models/analytics.model';

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private readonly api = inject(ApiService);

  getRegime(): Observable<RegimeResult> {
    return this.api.get('/analytics/regime');
  }

  getSectorRotation(): Observable<SectorRotationMatrix> {
    return this.api.get('/analytics/sector-rotation');
  }

  getICTimeline(months = 12): Observable<ICTimeline> {
    return this.api.get('/analytics/ic-timeline', { months });
  }

  getSignalDecay(): Observable<SignalDecay> {
    return this.api.get('/analytics/signal-decay');
  }

  getSensitivity(): Observable<Sensitivity> {
    return this.api.get('/analytics/sensitivity');
  }

  getPortfolioAttribution(portfolioId: string): Observable<PortfolioAttribution> {
    return this.api.get(`/analytics/portfolio/${portfolioId}/attribution`);
  }

  getPortfolioRisk(portfolioId: string): Observable<PortfolioRisk> {
    return this.api.get(`/analytics/portfolio/${portfolioId}/risk`);
  }
}
