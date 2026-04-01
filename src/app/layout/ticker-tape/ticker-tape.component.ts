import { Component, ChangeDetectionStrategy, signal, inject, OnInit, DestroyRef } from '@angular/core';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, of, forkJoin } from 'rxjs';
import { IqTickerLogoComponent } from '../../shared/components/iq-ticker-logo/iq-ticker-logo.component';
import { TickerService } from '../../core/services/ticker.service';

interface TapeItem {
  ticker: string;
  price: number;
  delta: number;
}

// Top tickers por liquidez — atualizados pelo screener quando disponível
const TOP_TICKERS = [
  'PETR4','VALE3','ITUB4','BBDC4','BBAS3','WEGE3','ABEV3','PRIO3',
  'RENT3','SUZB3','MGLU3','HAPV3','RADL3','BPAC11','CSNA3',
];

@Component({
  selector: 'iq-ticker-tape',
  standalone: true,
  imports: [IqTickerLogoComponent, RouterLink],
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
    // Só 15 requests — não 100
    const calls = TOP_TICKERS.map(t =>
      this.tickerService.getQuote(t).pipe(catchError(() => of(null)))
    );

    forkJoin(calls).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(quotes => {
      const items: TapeItem[] = [];
      quotes.forEach((q, i) => {
        if (q) {
          items.push({
            ticker: TOP_TICKERS[i],
            price: q.close,
            delta: q.open > 0 ? ((q.close - q.open) / q.open) * 100 : 0,
          });
        }
      });
      // Ordenar por volume descendente
      items.sort((a, b) => b.price - a.price);
      this.items.set(items);
    });
  }
}
