import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { FeedResponse, UserAlert, CreateAlertRequest } from '../models/radar.model';

@Injectable({ providedIn: 'root' })
export class RadarService {
  private readonly api = inject(ApiService);

  getFeed(limit = 30, filter: 'all' | 'news' | 'score_change' | 'dividend' = 'all'): Observable<FeedResponse> {
    return this.api.get('/radar/feed', { limit, filter });
  }

  getAlerts(): Observable<UserAlert[]> {
    return this.api.get('/radar/alerts');
  }

  createAlert(request: CreateAlertRequest): Observable<UserAlert> {
    return this.api.post('/radar/alerts', request);
  }

  deleteAlert(alertId: string): Observable<void> {
    return this.api.delete(`/radar/alerts/${alertId}`);
  }
}
