import { Component, ChangeDetectionStrategy, inject, computed, OnInit, signal, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { forkJoin, of, catchError } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { PortfolioService } from '../../core/services/portfolio.service';
import { ScoreService } from '../../core/services/score.service';
import { DividendService } from '../../core/services/dividend.service';
import { RegimeService } from '../../core/services/regime.service';
import type { PortfolioResult } from '../../core/models/portfolio.model';
import type { ScreenerResult } from '../../core/models/score.model';
import type { RegimeResult } from '../../core/models/regime.model';
import { RegimeType } from '../../core/models/regime.model';
import { Rating, RATING_LABELS } from '../../core/models/score.model';
import { CLUSTER_NAMES, ClusterId } from '../../core/models/cluster.model';
import { IqSkeletonComponent } from '../../shared/components/iq-skeleton/iq-skeleton.component';
import { IqDisclaimerComponent } from '../../shared/components/iq-disclaimer/iq-disclaimer.component';
import { IqButtonComponent } from '../../shared/components/iq-button/iq-button.component';
import { IqLineChartComponent, LineSeries } from '../../shared/components/iq-line-chart/iq-line-chart.component';
import { IqBarChartComponent, BarDataPoint } from '../../shared/components/iq-bar-chart/iq-bar-chart.component';
import { IqTickerLogoComponent } from '../../shared/components/iq-ticker-logo/iq-ticker-logo.component';
import { IqRatingBadgeComponent } from '../../shared/components/iq-rating-badge/iq-rating-badge.component';
import { CurrencyBrlPipe } from '../../shared/pipes/currency-brl.pipe';
import { DashboardHeroComponent } from './dashboard-hero/dashboard-hero.component';
import { DashboardIbovComponent } from './dashboard-ibov/dashboard-ibov.component';
import { DashboardMoversComponent, MoverItem, SectorExposure } from './dashboard-movers/dashboard-movers.component';

@Component({
  selector: 'iq-dashboard',
  standalone: true,
  imports: [
    RouterLink, IqSkeletonComponent, IqDisclaimerComponent, IqButtonComponent,
    IqLineChartComponent, IqBarChartComponent, IqTickerLogoComponent, IqRatingBadgeComponent,
    CurrencyBrlPipe,
    DashboardHeroComponent, DashboardIbovComponent, DashboardMoversComponent,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly portfolioService = inject(PortfolioService);
  private readonly scoreService = inject(ScoreService);
  private readonly dividendService = inject(DividendService);
  private readonly regimeService = inject(RegimeService);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = signal(true);
  readonly portfolio = signal<PortfolioResult | null>(null);
  readonly regime = signal<RegimeResult | null>(null);
  readonly topAssets = signal<ScreenerResult[]>([]);
  readonly divTotal = signal(0);
  readonly divYield = signal(0);
  readonly divMonthlyAvg = signal(0);
  readonly dividendBarsData = signal<BarDataPoint[]>([]);

  readonly userName = computed(() => {
    const u = this.auth.currentUser();
    if (!u?.email) return '';
    const name = u.user_metadata?.['full_name'] || u.email.split('@')[0];
    return name.charAt(0).toUpperCase() + name.slice(1);
  });

  readonly hasPortfolio = computed(() => (this.portfolio()?.positions?.length ?? 0) > 0);

  readonly portfolioScore = computed(() => {
    const p = this.portfolio();
    if (!p?.positions?.length) return 0;
    const totalValue = p.positions.reduce((s, pos) => s + (pos.market_value || 0), 0) || 1;
    return Math.round(
      p.positions.reduce((s, pos) => s + (pos.iq_score ?? 0) * (pos.market_value || 0), 0) / totalValue
    );
  });

  readonly portfolioRating = computed((): Rating => {
    const s = this.portfolioScore();
    if (s >= 82) return 'STRONG_BUY';
    if (s >= 70) return 'BUY';
    if (s >= 45) return 'HOLD';
    if (s >= 30) return 'REDUCE';
    return 'AVOID';
  });

  readonly regimeType = computed((): RegimeType | null => this.regime()?.regime ?? null);
  readonly selic = computed(() => this.regime()?.macro?.selic ?? null);
  readonly ipca = computed(() => this.regime()?.macro?.ipca ?? null);

  // Equity curve (mock — seletor de período visual)
  readonly equitySeries = computed((): LineSeries[] => [
    { name: 'Carteira', data: [100, 103, 101, 106, 104, 109, 112, 110, 115, 113, 118, 120], color: 'var(--text-primary)', strokeWidth: 2, areaFill: true },
    { name: 'CDI', data: [100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111], color: 'var(--text-quaternary)', strokeWidth: 1 },
    { name: 'IBOV', data: [100, 102, 99, 104, 101, 105, 108, 106, 110, 107, 112, 114], color: 'var(--text-quaternary)', strokeWidth: 1, dashed: true },
  ]);

  // Movers
  readonly gainers = computed((): MoverItem[] =>
    this.topAssets().slice(0, 5).map(a => ({
      ticker: a.ticker, price: a.fair_value_final ?? 0,
      change: Math.abs((a.safety_margin ?? 0) * 100) || +(Math.random() * 5).toFixed(1),
    }))
  );

  readonly losers = computed((): MoverItem[] =>
    [...this.topAssets()].reverse().slice(0, 5).map(a => ({
      ticker: a.ticker, price: a.fair_value_final ?? 0,
      change: -(Math.abs((a.safety_margin ?? 0) * 100) || +(Math.random() * 5).toFixed(1)),
    }))
  );

  // Sector exposure
  readonly sectorExposure = computed((): SectorExposure[] => {
    const p = this.portfolio();
    if (!p?.positions?.length) return [];
    const total = p.positions.reduce((s, pos) => s + (pos.market_value || 0), 0) || 1;
    const clusters: Record<number, number> = {};
    p.positions.forEach(pos => { clusters[pos.cluster_id] = (clusters[pos.cluster_id] || 0) + (pos.market_value || 0); });
    return Object.entries(clusters)
      .map(([id, val]) => ({ name: CLUSTER_NAMES[Number(id) as ClusterId] || `C${id}`, pct: (val / total) * 100 }))
      .sort((a, b) => b.pct - a.pct);
  });

  // Motor recomenda
  readonly recommended = computed(() => {
    const owned = new Set(this.portfolio()?.positions?.map(p => p.ticker) ?? []);
    return this.topAssets().filter(a => !owned.has(a.ticker) && a.iq_score > 0).slice(0, 5);
  });

  scoreColor(sc: number): string {
    if (sc >= 82) return 'var(--positive)';
    if (sc >= 70) return 'var(--text-primary)';
    if (sc >= 45) return 'var(--warning)';
    return 'var(--negative)';
  }

  ngOnInit(): void {
    forkJoin({
      portfolio: this.portfolioService.get().pipe(catchError(() => of(null))),
      top: this.scoreService.getTop(10).pipe(catchError(() => of({ top: [] }))),
      divSummary: this.dividendService.getSummary(12).pipe(catchError(() => of(null))),
      divProj: this.dividendService.getProjections(12).pipe(catchError(() => of(null))),
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(res => {
      if (res.portfolio && res.portfolio.positions?.length > 0) {
        this.portfolio.set(res.portfolio);
      }
      this.topAssets.set((res.top as any).top ?? []);

      if (res.divSummary) {
        const ds = res.divSummary as any;
        this.divTotal.set(ds.total_received ?? 0);
        this.divYield.set(ds.yield_on_cost ?? 0);
        this.divMonthlyAvg.set(ds.monthly_avg ?? 0);
      }

      // Dividend bars
      const proj = res.divProj as any;
      if (proj?.projections?.length) {
        const currentMonth = new Date().getMonth();
        this.dividendBarsData.set(proj.projections.map((p: any, i: number) => ({
          label: p.month?.substring(5, 7) ?? '',
          value: p.projected_value ?? 0,
          opacity: i >= currentMonth ? 0.4 : 1,
        })));
      } else {
        // Mock data
        this.dividendBarsData.set([
          { label: 'Jan', value: 320 }, { label: 'Fev', value: 180 },
          { label: 'Mar', value: 450 }, { label: 'Abr', value: 280 },
          { label: 'Mai', value: 520 }, { label: 'Jun', value: 340 },
          { label: 'Jul', value: 290, opacity: 0.4 }, { label: 'Ago', value: 460, opacity: 0.4 },
          { label: 'Set', value: 310, opacity: 0.4 }, { label: 'Out', value: 380, opacity: 0.4 },
          { label: 'Nov', value: 420, opacity: 0.4 }, { label: 'Dez', value: 550, opacity: 0.4 },
        ]);
      }

      this.loading.set(false);
    });

    this.regimeService.regime$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(r => this.regime.set(r));
  }
}
