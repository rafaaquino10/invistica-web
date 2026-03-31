import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import {
  DividendCalendarResponse, DividendRadarResponse, DividendSummary,
  DividendProjectionResponse, SimulateRequest, SimulateResult,
  TrapRisk, DividendSafety,
} from '../models/dividend.model';

@Injectable({ providedIn: 'root' })
export class DividendService {
  private readonly api = inject(ApiService);

  getCalendar(days = 30): Observable<DividendCalendarResponse> {
    return this.api.get('/dividends/calendar', { days });
  }

  getRadar(min_safety = 70): Observable<DividendRadarResponse> {
    return this.api.get('/dividends/radar', { min_safety });
  }

  getSummary(months = 12): Observable<DividendSummary> {
    return this.api.get('/dividends/summary', { months });
  }

  getProjections(months = 12): Observable<DividendProjectionResponse> {
    return this.api.get('/dividends/projections', { months });
  }

  simulate(request: SimulateRequest): Observable<SimulateResult> {
    return this.api.post('/dividends/simulate', request);
  }

  getTrapRisk(ticker: string): Observable<TrapRisk> {
    return this.api.get(`/dividends/${ticker}/trap-risk`);
  }

  getSafety(ticker: string): Observable<DividendSafety> {
    return this.api.get(`/dividends/${ticker}/safety`);
  }
}
