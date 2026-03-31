import { Injectable, inject } from '@angular/core';
import { Observable, timer, switchMap, shareReplay } from 'rxjs';
import { TickerService } from './ticker.service';
import { Quote } from '../models/ticker.model';

const PRO_INTERVAL_MS = 60 * 1000;     // 60s
const FREE_INTERVAL_MS = 900 * 1000;   // 15min

@Injectable({ providedIn: 'root' })
export class QuoteStreamService {
  private readonly tickerService = inject(TickerService);

  stream(ticker: string, isPro = false): Observable<Quote> {
    const interval = isPro ? PRO_INTERVAL_MS : FREE_INTERVAL_MS;

    return timer(0, interval).pipe(
      switchMap(() => this.tickerService.getQuote(ticker)),
      shareReplay({ bufferSize: 1, refCount: true }),
    );
  }
}
