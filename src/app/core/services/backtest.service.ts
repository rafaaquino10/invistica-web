import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { BacktestRequest, BacktestResult } from '../models/backtest.model';

@Injectable({ providedIn: 'root' })
export class BacktestService {
  private readonly api = inject(ApiService);

  run(request: BacktestRequest): Observable<BacktestResult> {
    return this.api.post('/backtest', request);
  }
}
