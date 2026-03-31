import { Component, ChangeDetectionStrategy, signal, inject, OnInit, DestroyRef } from '@angular/core';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { switchMap, catchError, of, forkJoin } from 'rxjs';
import { IqTickerLogoComponent } from '../../shared/components/iq-ticker-logo/iq-ticker-logo.component';
import { TickerService } from '../../core/services/ticker.service';
import type { Quote } from '../../core/models/ticker.model';

interface TapeItem {
  ticker: string;
  price: number;
  delta: number;
}

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
    // Buscar todos os tickers, pegar os top 15 por volume
    this.tickerService.list({ limit: 100 }).pipe(
      switchMap(res => {
        const tickers = (res.tickers ?? []).map(t => t.ticker);
        // Buscar quotes de todos para ordenar por volume
        const calls = tickers.map(t =>
          this.tickerService.getQuote(t).pipe(catchError(() => of(null)))
        );
        return forkJoin(calls);
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(quotes => {
      const valid = (quotes as (Quote | null)[])
        .filter((q): q is Quote => q !== null && q.volume > 0)
        .sort((a, b) => b.volume - a.volume)
        .slice(0, 15)
        .map(q => ({
          ticker: q.ticker,
          price: q.close,
          delta: q.open > 0 ? ((q.close - q.open) / q.open) * 100 : 0,
        }));
      this.items.set(valid);
    });
  }
}
