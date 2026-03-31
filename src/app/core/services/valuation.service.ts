import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { ValuationResult, MarginHistory, Scenarios } from '../models/valuation.model';

@Injectable({ providedIn: 'root' })
export class ValuationService {
  private readonly api = inject(ApiService);

  get(ticker: string): Observable<ValuationResult> {
    return this.api.get(`/valuation/${ticker}`);
  }

  getMargin(ticker: string): Observable<MarginHistory> {
    return this.api.get(`/valuation/${ticker}/margin`);
  }

  getScenarios(ticker: string): Observable<Scenarios> {
    return this.api.get(`/valuation/${ticker}/scenarios`);
  }
}
