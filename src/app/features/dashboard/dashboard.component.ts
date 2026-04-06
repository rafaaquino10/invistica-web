import { IqTickerLogoComponent } from '../../shared/components/iq-ticker-logo/iq-ticker-logo.component';
import {
  Component, ChangeDetectionStrategy, inject, computed, OnInit, signal, DestroyRef,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { forkJoin, of, catchError } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { PortfolioService } from '../../core/services/portfolio.service';
import { ScoreService } from '../../core/services/score.service';
import { DividendService } from '../../core/services/dividend.service';
import { RegimeService } from '../../core/services/regime.service';
import { StrategyService, RiskStatus } from '../../core/services/strategy.service';
import type { PortfolioResult, PortfolioAlert, PerformanceResult, IntradayResult } from '../../core/models/portfolio.model';
import { IqLineChartComponent, LineSeries } from '../../shared/components/iq-line-chart/iq-line-chart.component';
import type { ScreenerResult } from '../../core/models/score.model';
import type { RegimeResult } from '../../core/models/regime.model';
import { Rating, RATING_LABELS } from '../../core/models/score.model';
import { DashboardHeroComponent } from './dashboard-hero/dashboard-hero.component';
import { IqRatingBadgeComponent } from '../../shared/components/iq-rating-badge/iq-rating-badge.component';
import { IqSkeletonComponent } from '../../shared/components/iq-skeleton/iq-skeleton.component';
import { IqDisclaimerComponent } from '../../shared/components/iq-disclaimer/iq-disclaimer.component';
import { IqButtonComponent } from '../../shared/components/iq-button/iq-button.component';
import { IqEmptyStateComponent } from '../../shared/components/iq-empty-state/iq-empty-state.component';
import { CurrencyBrlPipe } from '../../shared/pipes/currency-brl.pipe';

@Component({
  selector: 'iq-dashboard',
  standalone: true,
  imports: [
    IqTickerLogoComponent, IqLineChartComponent,
    RouterLink, DashboardHeroComponent, IqRatingBadgeComponent,
    IqSkeletonComponent, IqDisclaimerComponent, IqButtonComponent,
    IqEmptyStateComponent, CurrencyBrlPipe,
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
  private readonly strategyService = inject(StrategyService);
  private readonly destroyRef = inject(DestroyRef);

  readonly Math = Math;
  readonly loading = signal(true);
  readonly ready = signal(false);
  readonly portfolio = signal<PortfolioResult | null>(null);
  readonly regime = signal<RegimeResult | null>(null);
  readonly risk = signal<RiskStatus | null>(null);
  readonly topAssets = signal<ScreenerResult[]>([]);
  readonly alerts = signal<PortfolioAlert[]>([]);
  readonly divTotal = signal(0);
  readonly divYield = signal(0);

  // ── Charts ──
  readonly perfSeries = signal<LineSeries[]>([]);
  readonly perfLabels = signal<string[]>([]);
  readonly perfMetrics = signal<any>(null);
  readonly intradaySeries = signal<LineSeries[]>([]);
  readonly intradayLabels = signal<string[]>([]);
  readonly intradayMetrics = signal<{ carteira: number; ibov: number } | null>(null);
  readonly perfPeriod = signal('12M');

  changePerfPeriod(period: string): void {
    this.perfPeriod.set(period);
    const months = period === '1M' ? 1 : period === '3M' ? 3 : period === '6M' ? 6 : period === 'MAX' ? 60 : 12;
    this.portfolioService.getPerformance(months).pipe(
      catchError(() => of(null)),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(res => this.buildPerfChart(res));
  }

  private buildPerfChart(res: PerformanceResult | null): void {
    if (!res?.series?.carteira?.length) { this.perfSeries.set([]); return; }
    const series: LineSeries[] = [
      { name: 'Carteira', data: res.series.carteira.map(p => p.value), color: 'var(--accent, #C9A84C)', areaFill: true, strokeWidth: 2.5 },
    ];
    if (res.series.ibov?.length) {
      series.push({ name: 'IBOV', data: res.series.ibov.map(p => p.value), color: 'var(--text-tertiary, #888)', dashed: true });
    }
    if (res.series.cdi?.length) {
      series.push({ name: 'CDI', data: res.series.cdi.map(p => p.value), color: 'var(--info, #3B6B96)', dashed: true });
    }
    // Labels: dates formatted as "Jan 25", "Fev 25", etc.
    const months = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
    this.perfLabels.set(res.series.carteira.map(p => {
      const d = p.date;
      const m = parseInt(d.substring(5, 7), 10) - 1;
      const y = d.substring(2, 4);
      return `${months[m]} ${y}`;
    }));
    this.perfSeries.set(series);
    this.perfMetrics.set(res.metrics);
  }

  private buildIntradayChart(res: IntradayResult | null): void {
    if (!res?.series?.carteira?.length) { this.intradaySeries.set([]); return; }
    const series: LineSeries[] = [
      { name: 'Carteira', data: res.series.carteira.map(p => p.value), color: 'var(--accent, #C9A84C)', areaFill: true, strokeWidth: 2 },
    ];
    if (res.series.ibov?.length) {
      series.push({ name: 'IBOV', data: res.series.ibov.map(p => p.value), color: 'var(--text-tertiary, #888)', dashed: true });
    }
    this.intradayLabels.set(res.series.carteira.map(p => p.time));
    this.intradaySeries.set(series);
    this.intradayMetrics.set({ carteira: res.carteira_change, ibov: res.ibov_change });
  }

  // ── Hero inputs ──
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
    const totalValue = p.positions.reduce((s: number, pos: any) => s + (pos.market_value || 0), 0) || 1;
    return Math.round(
      p.positions.reduce((s: number, pos: any) => s + (pos.iq_score ?? 0) * (pos.market_value || 0), 0) / totalValue
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

  readonly totalValue = computed(() => this.portfolio()?.total_value ?? 0);
  readonly plTotal = computed(() => this.portfolio()?.total_gain_loss ?? 0);
  readonly plTotalPct = computed(() => this.portfolio()?.total_gain_loss_pct ?? 0);

  // Regime
  readonly regimeLabel = computed(() => {
    const r = this.regime()?.regime;
    if (r === 'RISK_ON') return 'Mercado otimista';
    if (r === 'RISK_OFF') return 'Mercado defensivo';
    if (r === 'STAGFLATION') return 'Estagflacao';
    if (r === 'RECOVERY') return 'Recuperacao';
    return '';
  });

  readonly regimeDotColor = computed(() => {
    const r = this.regime()?.regime;
    if (r === 'RISK_ON') return 'var(--positive)';
    if (r === 'RISK_OFF') return 'var(--negative)';
    if (r === 'STAGFLATION') return 'var(--warning)';
    return 'var(--info)';
  });

  // Risk
  readonly volLabel = computed(() => {
    const v = this.risk()?.vol_stress;
    if (!v) return '';
    if (v.is_stressed) return 'ESTRESSADO';
    if (v.ratio > 1.2) return 'ELEVADA';
    return 'NORMAL';
  });

  readonly volColor = computed(() => {
    const v = this.risk()?.vol_stress;
    if (!v) return 'var(--text-tertiary)';
    if (v.is_stressed) return 'var(--negative)';
    if (v.ratio > 1.2) return 'var(--warning)';
    return 'var(--positive)';
  });

  readonly confidencePct = computed(() => {
    const c = this.risk()?.confidence?.level;
    return c != null ? Math.round(c * 100) : 0;
  });

  // Opportunities not in portfolio
  readonly opportunities = computed(() => {
    const owned = new Set(this.portfolio()?.positions?.map((p: any) => p.ticker) ?? []);
    return this.topAssets().filter(a => !owned.has(a.ticker) && a.iq_score > 0).slice(0, 6);
  });

  readonly alertCount = computed(() => this.alerts().length);

  // Helpers
  scoreColor(sc: number): string {
    if (sc >= 82) return 'var(--positive)';
    if (sc >= 70) return 'var(--obsidian)';
    if (sc >= 45) return 'var(--warning)';
    return 'var(--negative)';
  }

  fmtPct(v: number | null | undefined): string {
    return v != null ? (v * 100).toFixed(1) + '%' : '--';
  }

  fmtBrl(v: number): string {
    return v.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  }

  // ── Lifecycle ──
  ngOnInit(): void {
    setTimeout(() => { if (this.loading()) this.loading.set(false); }, 8000);

    forkJoin({
      portfolio: this.portfolioService.get().pipe(catchError(() => of(null))),
      top: this.scoreService.getTop(10).pipe(catchError(() => of({ top: [] }))),
      divSummary: this.dividendService.getSummary(12).pipe(catchError(() => of(null))),
      alerts: this.portfolioService.getAlerts().pipe(catchError(() => of([]))),
      risk: this.strategyService.getRiskStatus().pipe(catchError(() => of(null))),
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(res => {
      if (res.portfolio && res.portfolio.positions?.length > 0) {
        this.portfolio.set(res.portfolio);
      }
      this.topAssets.set((res.top as any).top ?? []);

      if (res.divSummary) {
        const ds = res.divSummary as any;
        this.divTotal.set(ds.total_received ?? 0);
        this.divYield.set(ds.yield_on_cost ?? 0);
      }

      if (Array.isArray(res.alerts)) {
        this.alerts.set(res.alerts as PortfolioAlert[]);
      }

      this.risk.set(res.risk as RiskStatus | null);
      this.loading.set(false);
      setTimeout(() => this.ready.set(true), 50);
    });

    this.regimeService.regime$.pipe(
      catchError(() => of(null)),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(r => this.regime.set(r));

    // Load performance charts
    this.portfolioService.getPerformance(12).pipe(
      catchError(() => of(null)),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(res => this.buildPerfChart(res as PerformanceResult | null));

    this.portfolioService.getIntraday().pipe(
      catchError(() => of(null)),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(res => this.buildIntradayChart(res as IntradayResult | null));
  }
}
