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
import type { PortfolioResult, PortfolioAlert, PerformanceResult, IntradayResult, PortfolioAnalytics } from '../../core/models/portfolio.model';
import { IqDonutChartComponent, DonutSlice } from '../../shared/components/iq-donut-chart/iq-donut-chart.component';
import { CLUSTER_NAMES, ClusterId } from '../../core/models/cluster.model';
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
    IqTickerLogoComponent, IqLineChartComponent, IqDonutChartComponent,
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
  readonly analytics = signal<PortfolioAnalytics | null>(null);
  readonly allocationView = signal<'ativo' | 'setor'>('ativo');

  private readonly SECTOR_COLORS: Record<number, string> = {
    1: '#1565C0', 2: '#E65100', 3: '#7B1FA2', 4: '#00838F',
    5: '#2E7D32', 6: '#AD1457', 7: '#F57F17', 8: '#4527A0', 9: '#00695C',
  };

  readonly allocationByAsset = computed((): DonutSlice[] => {
    const p = this.portfolio();
    if (!p?.positions?.length) return [];
    return p.positions.map(pos => ({
      label: pos.ticker,
      value: pos.market_value || 0,
      color: this.SECTOR_COLORS[pos.cluster_id] || '#888',
    }));
  });

  readonly allocationBySector = computed((): DonutSlice[] => {
    const p = this.portfolio();
    if (!p?.positions?.length) return [];
    const clusters: Record<number, number> = {};
    p.positions.forEach(pos => {
      clusters[pos.cluster_id] = (clusters[pos.cluster_id] || 0) + (pos.market_value || 0);
    });
    return Object.entries(clusters)
      .map(([id, val]) => ({
        label: CLUSTER_NAMES[Number(id) as ClusterId] || `Setor ${id}`,
        value: val,
        color: this.SECTOR_COLORS[Number(id)] || '#888',
      }))
      .sort((a, b) => b.value - a.value);
  });

  readonly activeAllocation = computed(() =>
    this.allocationView() === 'ativo' ? this.allocationByAsset() : this.allocationBySector()
  );

  readonly concentrationWarning = computed(() => {
    const hhi = this.analytics()?.herfindahl_index;
    return hhi != null && hhi > 0.25;
  });

  readonly allocationDetails = computed(() => {
    const p = this.portfolio();
    if (!p?.positions?.length) return [];
    const total = p.total_value || 1;
    return p.positions.map(pos => ({
      ticker: pos.ticker,
      name: pos.company_name,
      pct: ((pos.market_value || 0) / total) * 100,
      value: pos.market_value || 0,
      score: pos.iq_score,
      color: this.SECTOR_COLORS[pos.cluster_id] || '#888',
      sector: CLUSTER_NAMES[pos.cluster_id as ClusterId] || '',
    })).sort((a, b) => b.pct - a.pct);
  });

  toggleAllocationView(): void {
    this.allocationView.update(v => v === 'ativo' ? 'setor' : 'ativo');
  }

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
    const series: LineSeries[] = [];
    const monthNames = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

    // Carteira (if available)
    if (res?.series?.carteira?.length) {
      series.push({ name: 'Carteira', data: res.series.carteira.map(p => p.value), color: 'var(--accent, #C9A84C)', areaFill: true, strokeWidth: 2.5 });
      this.perfLabels.set(res.series.carteira.map(p => {
        const m = parseInt(p.date.substring(5, 7), 10) - 1;
        return `${monthNames[m]} ${p.date.substring(2, 4)}`;
      }));
    }

    // IBOV benchmark (if available)
    if (res?.series?.ibov?.length) {
      series.push({ name: 'IBOV', data: res.series.ibov.map(p => p.value), color: 'var(--text-tertiary, #888)', dashed: true, strokeWidth: 1.5 });
      if (!this.perfLabels().length) {
        this.perfLabels.set(res.series.ibov.map(p => {
          const m = parseInt(p.date.substring(5, 7), 10) - 1;
          return `${monthNames[m]} ${p.date.substring(2, 4)}`;
        }));
      }
    }

    // CDI benchmark (if available)
    if (res?.series?.cdi?.length) {
      series.push({ name: 'CDI', data: res.series.cdi.map(p => p.value), color: 'var(--info, #3B6B96)', dashed: true, strokeWidth: 1.5 });
    }

    // Fallback: if no data at all, show demo benchmarks so chart is never empty
    if (series.length === 0) {
      const now = new Date();
      const labels: string[] = [];
      const ibovDemo: number[] = [];
      const cdiDemo: number[] = [];
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        labels.push(`${monthNames[d.getMonth()]} ${String(d.getFullYear()).substring(2)}`);
        ibovDemo.push(100 + (11 - i) * 0.7 + Math.sin(i) * 2);
        cdiDemo.push(100 + (11 - i) * 1.2);
      }
      series.push(
        { name: 'IBOV', data: ibovDemo, color: 'var(--text-tertiary, #888)', dashed: true, strokeWidth: 1.5 },
        { name: 'CDI', data: cdiDemo, color: 'var(--info, #3B6B96)', dashed: true, strokeWidth: 1.5 },
      );
      this.perfLabels.set(labels);
    }

    this.perfSeries.set(series);
    this.perfMetrics.set(res?.metrics ?? null);
  }

  private buildIntradayChart(res: IntradayResult | null): void {
    const series: LineSeries[] = [];

    if (res?.series?.carteira?.length) {
      series.push({ name: 'Carteira', data: res.series.carteira.map(p => p.value), color: 'var(--accent, #C9A84C)', areaFill: true, strokeWidth: 2 });
      this.intradayLabels.set(res.series.carteira.map(p => p.time));
    }
    if (res?.series?.ibov?.length) {
      series.push({ name: 'IBOV', data: res.series.ibov.map(p => p.value), color: 'var(--text-tertiary, #888)', dashed: true, strokeWidth: 1.5 });
      if (!this.intradayLabels().length) {
        this.intradayLabels.set(res.series.ibov.map(p => p.time));
      }
    }

    // Fallback demo intraday
    if (series.length === 0) {
      const hours = ['10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00'];
      series.push(
        { name: 'IBOV', data: [100, 100.2, 99.8, 100.1, 100.4, 100.3, 100.6, 100.5], color: 'var(--text-tertiary, #888)', dashed: true, strokeWidth: 1.5 },
      );
      this.intradayLabels.set(hours);
    }

    this.intradaySeries.set(series);
    this.intradayMetrics.set(res ? { carteira: res.carteira_change, ibov: res.ibov_change } : null);
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
      analytics: this.portfolioService.getAnalytics().pipe(catchError(() => of(null))),
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
      if (res.analytics) this.analytics.set(res.analytics as PortfolioAnalytics);
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
