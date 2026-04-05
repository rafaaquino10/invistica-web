import { Component, ChangeDetectionStrategy, inject, signal, OnInit, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin, catchError, of } from 'rxjs';
import { AnalyticsService } from '../../core/services/analytics.service';
import { ScoreService } from '../../core/services/score.service';
import { PortfolioService } from '../../core/services/portfolio.service';
import type { ModelPerformance } from '../../core/models/score.model';
import type { PortfolioAttribution, PortfolioRisk } from '../../core/models/analytics.model';
import { IqLineChartComponent, LineSeries } from '../../shared/components/iq-line-chart/iq-line-chart.component';
import { IqBarChartComponent, BarDataPoint } from '../../shared/components/iq-bar-chart/iq-bar-chart.component';
import { IqSkeletonComponent } from '../../shared/components/iq-skeleton/iq-skeleton.component';
import { IqEmptyStateComponent } from '../../shared/components/iq-empty-state/iq-empty-state.component';
import { IqDisclaimerComponent } from '../../shared/components/iq-disclaimer/iq-disclaimer.component';

@Component({
  selector: 'iq-analytics',
  standalone: true,
  imports: [IqLineChartComponent, IqBarChartComponent, IqSkeletonComponent, IqEmptyStateComponent, IqDisclaimerComponent],
  templateUrl: './analytics.component.html',
  styleUrl: './analytics.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnalyticsComponent implements OnInit {
  private readonly analyticsService = inject(AnalyticsService);
  private readonly scoreService = inject(ScoreService);
  private readonly portfolioService = inject(PortfolioService);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = signal(true);
  readonly performance = signal<ModelPerformance | null>(null);
  readonly icSeries = signal<LineSeries[]>([]);
  readonly decayBars = signal<BarDataPoint[]>([]);
  readonly attribution = signal<PortfolioAttribution | null>(null);
  readonly portfolioRisk = signal<PortfolioRisk | null>(null);

  pct(v: number | null | undefined): string {
    return v != null ? (v * 100).toFixed(2) + '%' : '—';
  }

  num(v: number | null | undefined): string {
    return v != null ? v.toFixed(4) : '—';
  }

  ngOnInit(): void {
    setTimeout(() => { if (this.loading()) this.loading.set(false); }, 5000);
    forkJoin({
      perf: this.scoreService.getPerformance().pipe(catchError(() => of(null))),
      ic: this.analyticsService.getICTimeline(24).pipe(catchError(() => of(null))),
      decay: this.analyticsService.getSignalDecay().pipe(catchError(() => of(null))),
      portfolio: this.portfolioService.get().pipe(catchError(() => of(null))),
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(({ perf, ic, decay, portfolio }) => {
      this.performance.set(perf);

      if (ic?.entries?.length) {
        this.icSeries.set([
          { name: 'IC Spearman', data: ic.entries.map(e => (e.ic_spearman ?? 0) * 100), color: 'var(--obsidian)' },
          { name: 'Hit Rate', data: ic.entries.map(e => (e.hit_rate ?? 0) * 100), color: 'var(--positive)', dashed: true },
        ]);
      }

      if (decay?.entries?.length) {
        this.decayBars.set(decay.entries.map(e => ({
          label: `${e.lag_days}d`,
          value: (e.ic ?? 0) * 100,
        })));
      }

      if (portfolio?.portfolio_id) {
        forkJoin({
          attr: this.analyticsService.getPortfolioAttribution(portfolio.portfolio_id).pipe(catchError(() => of(null))),
          risk: this.analyticsService.getPortfolioRisk(portfolio.portfolio_id).pipe(catchError(() => of(null))),
        }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(({ attr, risk }) => {
          this.attribution.set(attr);
          this.portfolioRisk.set(risk);
        });
      }

      this.loading.set(false);
    });
  }
}
