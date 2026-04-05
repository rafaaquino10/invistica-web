import { IqTickerLogoComponent } from '../../shared/components/iq-ticker-logo/iq-ticker-logo.component';
import { Component, ChangeDetectionStrategy, inject, signal, OnInit, DestroyRef } from '@angular/core';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin, catchError, of, switchMap } from 'rxjs';
import { ScoreService } from '../../core/services/score.service';
import { TickerService } from '../../core/services/ticker.service';
import { CompactNumberPipe } from '../../shared/pipes/compact-number.pipe';
import { IqSkeletonComponent } from '../../shared/components/iq-skeleton/iq-skeleton.component';
import { IqEmptyStateComponent } from '../../shared/components/iq-empty-state/iq-empty-state.component';
import { IqDisclaimerComponent } from '../../shared/components/iq-disclaimer/iq-disclaimer.component';

interface InstitutionalRow {
  ticker: string;
  topFund: string;
  shares: number;
  changePct: number | null;
  shortPct: number | null;
}

@Component({
  selector: 'iq-institutional-page',
  standalone: true,
  imports: [
    IqTickerLogoComponent,IqSkeletonComponent, IqEmptyStateComponent, IqDisclaimerComponent, CompactNumberPipe],
  templateUrl: './institutional.component.html',
  styleUrl: './institutional.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InstitutionalComponent implements OnInit {
  private readonly scoreService = inject(ScoreService);
  private readonly tickerService = inject(TickerService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = signal(true);
  readonly rows = signal<InstitutionalRow[]>([]);
  readonly sortKey = signal<'shares' | 'changePct' | 'shortPct'>('shares');
  readonly sortAsc = signal(false);

  goToAsset(ticker: string): void {
    this.router.navigate(['/ativo', ticker], { queryParams: { tab: 'institucional' } });
  }

  toggleSort(key: 'shares' | 'changePct' | 'shortPct'): void {
    if (this.sortKey() === key) this.sortAsc.update(v => !v);
    else { this.sortKey.set(key); this.sortAsc.set(false); }
    this.sortRows();
  }

  private sortRows(): void {
    const key = this.sortKey();
    const asc = this.sortAsc();
    this.rows.update(r => [...r].sort((a, b) => {
      const av = a[key] ?? 0;
      const bv = b[key] ?? 0;
      return asc ? av - bv : bv - av;
    }));
  }

  ngOnInit(): void {
    setTimeout(() => { if (this.loading()) this.loading.set(false); }, 5000);
    this.scoreService.screener({ limit: 20 }).pipe(
      switchMap(screener => {
        const tickers = (screener.results ?? []).map(r => r.ticker).slice(0, 20);
        if (!tickers.length) { this.loading.set(false); return of([]); }

        const calls = tickers.map(t => forkJoin({
          ticker: of(t),
          holders: this.tickerService.getInstitutionalHolders(t).pipe(catchError(() => of({ ticker: t, holders: [], count: 0 }))),
          short: this.tickerService.getShortInterest(t).pipe(catchError(() => of({ ticker: t, short_interest: [] }))),
        }));

        return forkJoin(calls);
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(results => {
      if (!Array.isArray(results)) { this.loading.set(false); return; }
      const rows: InstitutionalRow[] = results.map(r => {
        const topHolder = r.holders.holders[0];
        const latestShort = r.short.short_interest[0];
        return {
          ticker: r.ticker,
          topFund: topHolder?.name ?? '—',
          shares: topHolder?.shares ?? 0,
          changePct: topHolder?.change_3m ?? null,
          shortPct: latestShort?.short_pct ?? null,
        };
      }).filter(r => r.topFund !== '—' || r.shortPct != null);

      this.rows.set(rows);
      this.sortRows();
      this.loading.set(false);
    });
  }
}
