import { Component, ChangeDetectionStrategy, signal, inject, OnInit, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin, catchError, of } from 'rxjs';
import { IqTickerLogoComponent } from '../../shared/components/iq-ticker-logo/iq-ticker-logo.component';
import { TickerService } from '../../core/services/ticker.service';

interface TapeItem {
  ticker: string;
  price: number;
  delta: number;
}

const TICKERS = [
  'PETR4','VALE3','ITUB4','BBDC4','ABEV3','WEGE3','RENT3','BBAS3',
  'MGLU3','SUZB3','HAPV3','RADL3','BPAC11','PRIO3','CSNA3',
];

@Component({
  selector: 'iq-ticker-tape',
  standalone: true,
  imports: [IqTickerLogoComponent],
  templateUrl: './ticker-tape.component.html',
  styleUrl: './ticker-tape.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TickerTapeComponent implements OnInit {
  private readonly tickerService = inject(TickerService);
  private readonly destroyRef = inject(DestroyRef);

  readonly paused = signal(false);
  readonly items = signal<TapeItem[]>([]);

  togglePause(): void {
    this.paused.update(v => !v);
  }

  ngOnInit(): void {
    const calls = TICKERS.map(t =>
      this.tickerService.getQuote(t).pipe(
        catchError(() => of(null))
      )
    );

    forkJoin(calls).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(quotes => {
      const items: TapeItem[] = [];
      quotes.forEach((q, i) => {
        if (q) {
          const delta = q.open > 0 ? ((q.close - q.open) / q.open) * 100 : 0;
          items.push({ ticker: TICKERS[i], price: q.close, delta });
        }
      });
      this.items.set(items);
    });
  }
}
