import { Component, ChangeDetectionStrategy, inject, signal, OnInit, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { forkJoin, catchError, of } from 'rxjs';
import { DividendService } from '../../core/services/dividend.service';
import type {
  DividendCalendarEntry, DividendRadarEntry, DividendSummary,
  DividendProjectionResponse, SimulateResult,
} from '../../core/models/dividend.model';
import { IqBarChartComponent, BarDataPoint } from '../../shared/components/iq-bar-chart/iq-bar-chart.component';
import { IqButtonComponent } from '../../shared/components/iq-button/iq-button.component';
import { IqSkeletonComponent } from '../../shared/components/iq-skeleton/iq-skeleton.component';
import { IqEmptyStateComponent } from '../../shared/components/iq-empty-state/iq-empty-state.component';
import { IqDisclaimerComponent } from '../../shared/components/iq-disclaimer/iq-disclaimer.component';
import { CurrencyBrlPipe } from '../../shared/pipes/currency-brl.pipe';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'iq-dividends-page',
  standalone: true,
  imports: [
    FormsModule, DatePipe,
    IqBarChartComponent, IqButtonComponent, IqSkeletonComponent,
    IqEmptyStateComponent, IqDisclaimerComponent, CurrencyBrlPipe,
  ],
  templateUrl: './dividends.component.html',
  styleUrl: './dividends.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DividendsComponent implements OnInit {
  private readonly dividendService = inject(DividendService);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = signal(true);
  readonly activeTab = signal<'calendario' | 'radar' | 'resumo' | 'simulador'>('calendario');

  readonly calendar = signal<DividendCalendarEntry[]>([]);
  readonly radar = signal<DividendRadarEntry[]>([]);
  readonly summary = signal<DividendSummary | null>(null);
  readonly projections = signal<DividendProjectionResponse | null>(null);

  // Simulator
  readonly simTickers = signal('');
  readonly simAmounts = signal('');
  readonly simResult = signal<SimulateResult | null>(null);
  readonly simulating = signal(false);

  readonly summaryBars = signal<BarDataPoint[]>([]);

  onTabChange(tab: 'calendario' | 'radar' | 'resumo' | 'simulador'): void {
    this.activeTab.set(tab);
  }

  simulate(): void {
    const tickers = this.simTickers().split(',').map(t => t.trim().toUpperCase()).filter(Boolean);
    const amounts = this.simAmounts().split(',').map(a => parseFloat(a.trim())).filter(a => !isNaN(a));
    if (tickers.length === 0 || tickers.length !== amounts.length) return;

    this.simulating.set(true);
    this.dividendService.simulate({ tickers, amounts })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: res => { this.simResult.set(res); this.simulating.set(false); },
        error: () => this.simulating.set(false),
      });
  }

  ngOnInit(): void {
    forkJoin({
      cal: this.dividendService.getCalendar(30).pipe(catchError(() => of({ days: 30, entries: [] }))),
      radar: this.dividendService.getRadar(70).pipe(catchError(() => of({ min_safety: 70, results: [] }))),
      summary: this.dividendService.getSummary(12).pipe(catchError(() => of(null))),
      proj: this.dividendService.getProjections(12).pipe(catchError(() => of(null))),
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(res => {
      this.calendar.set(res.cal.entries ?? []);
      this.radar.set(res.radar.results ?? []);
      this.summary.set(res.summary);
      this.projections.set(res.proj);

      if (res.summary?.by_ticker) {
        this.summaryBars.set(res.summary.by_ticker.map(t => ({
          label: t.ticker,
          value: t.total,
        })));
      }
      this.loading.set(false);
    });
  }
}
