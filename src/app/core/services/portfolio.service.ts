import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import {
  PortfolioResult, PositionCreate, PositionUpdate,
  SmartContributionResponse, PortfolioAlert, PortfolioAnalytics,
} from '../models/portfolio.model';

@Injectable({ providedIn: 'root' })
export class PortfolioService {
  private readonly api = inject(ApiService);

  get(): Observable<PortfolioResult> {
    return this.api.get('/portfolio');
  }

  addPosition(position: PositionCreate): Observable<PortfolioResult> {
    return this.api.post('/portfolio/positions', position);
  }

  updatePosition(positionId: string, update: PositionUpdate): Observable<PortfolioResult> {
    return this.api.put(`/portfolio/positions/${positionId}`, update);
  }

  deletePosition(positionId: string): Observable<PortfolioResult> {
    return this.api.delete(`/portfolio/positions/${positionId}`);
  }

  smartContribution(aporte_total = 1000): Observable<SmartContributionResponse> {
    return this.api.get('/portfolio/smart-contribution', { aporte_total });
  }

  getAlerts(): Observable<PortfolioAlert[]> {
    return this.api.get('/portfolio/alerts');
  }

  getAnalytics(): Observable<PortfolioAnalytics> {
    return this.api.get('/portfolio/analytics');
  }
}
