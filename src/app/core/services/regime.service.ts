import { Injectable, inject } from '@angular/core';
import { Observable, timer, shareReplay, switchMap } from 'rxjs';
import { AnalyticsService } from './analytics.service';
import { RegimeResult } from '../models/regime.model';

const POLL_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

@Injectable({ providedIn: 'root' })
export class RegimeService {
  private readonly analyticsService = inject(AnalyticsService);

  readonly regime$: Observable<RegimeResult> = timer(0, POLL_INTERVAL_MS).pipe(
    switchMap(() => this.analyticsService.getRegime()),
    shareReplay({ bufferSize: 1, refCount: true }),
  );
}
