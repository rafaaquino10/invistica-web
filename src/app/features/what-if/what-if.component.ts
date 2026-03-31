import { Component, ChangeDetectionStrategy, inject, signal, DestroyRef, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin, catchError, of } from 'rxjs';
import { TickerService } from '../../core/services/ticker.service';
import type { HistoryEntry, TickerDividend } from '../../core/models/ticker.model';
import { IqSearchComponent, SearchResult } from '../../shared/components/iq-search/iq-search.component';
import { IqDropdownComponent, DropdownOption } from '../../shared/components/iq-dropdown/iq-dropdown.component';
import { IqButtonComponent } from '../../shared/components/iq-button/iq-button.component';
import { IqLineChartComponent, LineSeries } from '../../shared/components/iq-line-chart/iq-line-chart.component';
import { IqSkeletonComponent } from '../../shared/components/iq-skeleton/iq-skeleton.component';
import { IqDisclaimerComponent } from '../../shared/components/iq-disclaimer/iq-disclaimer.component';
import { CurrencyBrlPipe } from '../../shared/pipes/currency-brl.pipe';

interface CompResult {
  ticker: string;
  totalReturn: number;
  dividends: number;
  finalValue: number;
  maxDrawdown: number;
}

@Component({
  selector: 'iq-what-if',
  standalone: true,
  imports: [
    FormsModule,
    IqSearchComponent, IqDropdownComponent, IqButtonComponent,
    IqLineChartComponent, IqSkeletonComponent, IqDisclaimerComponent, CurrencyBrlPipe,
  ],
  templateUrl: './what-if.component.html',
  styleUrl: './what-if.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WhatIfComponent {
  private readonly tickerService = inject(TickerService);
  private readonly destroyRef = inject(DestroyRef);

  readonly tickerA = signal('');
  readonly tickerB = signal('');
  readonly investedAmount = signal(10000);
  readonly loading = signal(false);
  readonly compared = signal(false);

  readonly searchResultsA = signal<SearchResult[]>([]);
  readonly searchResultsB = signal<SearchResult[]>([]);
  readonly chartSeries = signal<LineSeries[]>([]);
  readonly resultA = signal<CompResult | null>(null);
  readonly resultB = signal<CompResult | null>(null);

  readonly periodOptions: DropdownOption[] = [
    { label: '3 meses', value: '90' },
    { label: '6 meses', value: '180' },
    { label: '1 ano', value: '365' },
    { label: '2 anos', value: '730' },
  ];
  readonly selectedDays = signal(365);

  onSearchA(q: string): void {
    if (q.length < 2) return;
    this.tickerService.search(q, 5).pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(r => this.searchResultsA.set(r.tickers.map(t => ({ label: t.ticker, value: t.ticker, subtitle: t.company_name }))));
  }

  onSearchB(q: string): void {
    if (q.length < 2) return;
    this.tickerService.search(q, 5).pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(r => this.searchResultsB.set(r.tickers.map(t => ({ label: t.ticker, value: t.ticker, subtitle: t.company_name }))));
  }

  onPeriodChange(opt: DropdownOption | DropdownOption[]): void {
    const v = Array.isArray(opt) ? opt[0]?.value : opt.value;
    if (v) this.selectedDays.set(Number(v));
  }

  compare(): void {
    const a = this.tickerA();
    const b = this.tickerB();
    if (!a || !b) return;
    const days = this.selectedDays();

    this.loading.set(true);
    forkJoin({
      histA: this.tickerService.getHistory(a, days).pipe(catchError(() => of({ ticker: a, days, data: [] }))),
      histB: this.tickerService.getHistory(b, days).pipe(catchError(() => of({ ticker: b, days, data: [] }))),
      divsA: this.tickerService.getDividends(a).pipe(catchError(() => of({ ticker: a, dividends: [] }))),
      divsB: this.tickerService.getDividends(b).pipe(catchError(() => of({ ticker: b, dividends: [] }))),
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(({ histA, histB, divsA, divsB }) => {
      const amount = this.investedAmount();
      const rA = this.calcReturn(histA.data, divsA.dividends, amount);
      const rB = this.calcReturn(histB.data, divsB.dividends, amount);

      this.resultA.set({ ...rA, ticker: a });
      this.resultB.set({ ...rB, ticker: b });

      this.chartSeries.set([
        { name: a, data: rA.curve, color: 'var(--obsidian)' },
        { name: b, data: rB.curve, color: 'var(--info)', dashed: true },
      ]);

      this.compared.set(true);
      this.loading.set(false);
    });
  }

  private calcReturn(history: HistoryEntry[], dividends: TickerDividend[], amount: number) {
    if (!history.length) return { totalReturn: 0, dividends: 0, finalValue: amount, maxDrawdown: 0, curve: [amount] };

    const startPrice = history[0].close;
    const shares = amount / startPrice;
    let totalDivs = 0;

    const startDate = history[0].date;
    dividends.forEach(d => {
      if (d.ex_date >= startDate) totalDivs += d.value_per_share * shares;
    });

    const curve = history.map(h => h.close * shares + totalDivs);
    const finalValue = curve[curve.length - 1];
    const totalReturn = (finalValue - amount) / amount;

    let peak = curve[0];
    let maxDD = 0;
    curve.forEach(v => {
      if (v > peak) peak = v;
      const dd = (peak - v) / peak;
      if (dd > maxDD) maxDD = dd;
    });

    return { totalReturn, dividends: totalDivs, finalValue, maxDrawdown: maxDD, curve };
  }
}
