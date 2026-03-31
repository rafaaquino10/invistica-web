import { Component, ChangeDetectionStrategy, inject, computed, OnInit, signal, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { DatePipe, SlicePipe } from '@angular/common';
import { forkJoin, of, catchError } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { PortfolioService } from '../../core/services/portfolio.service';
import { ScoreService } from '../../core/services/score.service';
import { RadarService } from '../../core/services/radar.service';
import { DividendService } from '../../core/services/dividend.service';
import { RegimeService } from '../../core/services/regime.service';
import type { PortfolioResult } from '../../core/models/portfolio.model';
import type { ScreenerResult, Catalyst } from '../../core/models/score.model';
import type { FeedItem } from '../../core/models/radar.model';
import type { RegimeResult } from '../../core/models/regime.model';
import type { DividendSummary, DividendProjectionResponse } from '../../core/models/dividend.model';
import { IqScoreGaugeComponent } from '../../shared/components/iq-score-gauge/iq-score-gauge.component';
import { IqKpiCardComponent } from '../../shared/components/iq-kpi-card/iq-kpi-card.component';
import { IqRatingBadgeComponent } from '../../shared/components/iq-rating-badge/iq-rating-badge.component';
import { IqRegimeBadgeComponent } from '../../shared/components/iq-regime-badge/iq-regime-badge.component';
import { IqLineChartComponent, LineSeries } from '../../shared/components/iq-line-chart/iq-line-chart.component';
import { IqBarChartComponent, BarDataPoint } from '../../shared/components/iq-bar-chart/iq-bar-chart.component';
import { IqSkeletonComponent } from '../../shared/components/iq-skeleton/iq-skeleton.component';
import { IqEmptyStateComponent } from '../../shared/components/iq-empty-state/iq-empty-state.component';
import { IqDisclaimerComponent } from '../../shared/components/iq-disclaimer/iq-disclaimer.component';
import { IqButtonComponent } from '../../shared/components/iq-button/iq-button.component';
import { CurrencyBrlPipe } from '../../shared/pipes/currency-brl.pipe';
import { RatingLabelPipe } from '../../shared/pipes/rating-label.pipe';
import { Rating, RATING_COLORS } from '../../core/models/score.model';
import { REGIME_LABELS } from '../../core/models/regime.model';
import { IqTickerLogoComponent } from '../../shared/components/iq-ticker-logo/iq-ticker-logo.component';

@Component({
  selector: 'iq-dashboard',
  standalone: true,
  imports: [
    RouterLink, IqTickerLogoComponent,
    IqScoreGaugeComponent, IqKpiCardComponent, IqRatingBadgeComponent,
    IqRegimeBadgeComponent, IqLineChartComponent, IqBarChartComponent,
    IqSkeletonComponent, IqEmptyStateComponent, IqDisclaimerComponent,
    IqButtonComponent, DatePipe, SlicePipe,
    CurrencyBrlPipe, RatingLabelPipe,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly portfolioService = inject(PortfolioService);
  private readonly scoreService = inject(ScoreService);
  private readonly radarService = inject(RadarService);
  private readonly dividendService = inject(DividendService);
  private readonly regimeService = inject(RegimeService);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = signal(true);
  readonly hasPortfolio = signal(false);

  // Data signals
  readonly portfolio = signal<PortfolioResult | null>(null);
  readonly regime = signal<RegimeResult | null>(null);
  readonly topAssets = signal<ScreenerResult[]>([]);
  readonly feedItems = signal<FeedItem[]>([]);
  readonly catalysts = signal<Catalyst[]>([]);
  readonly dividendSummary = signal<DividendSummary | null>(null);
  readonly dividendProjections = signal<DividendProjectionResponse | null>(null);

  // Greeting
  readonly greeting = computed(() => {
    const h = new Date().getHours();
    if (h < 12) return 'Bom dia';
    if (h < 18) return 'Boa tarde';
    return 'Boa noite';
  });

  readonly userName = computed(() => {
    const u = this.auth.currentUser();
    if (!u?.email) return '';
    const name = u.user_metadata?.['full_name'] || u.email.split('@')[0];
    return name.charAt(0).toUpperCase() + name.slice(1);
  });

  readonly todayDate = computed(() => {
    const d = new Date();
    const weekday = d.toLocaleDateString('pt-BR', { weekday: 'long' });
    const date = d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
    return `${weekday.toUpperCase()}, ${date.toUpperCase()}`;
  });

  readonly portfolioScore = computed(() => {
    const p = this.portfolio();
    if (!p?.positions.length) return 0;
    const totalValue = p.positions.reduce((s, pos) => s + pos.market_value, 0) || 1;
    return Math.round(
      p.positions.reduce((s, pos) => s + (pos.iq_score ?? 0) * pos.market_value, 0) / totalValue
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

  // Charts
  readonly equitySeries = computed((): LineSeries[] => {
    // Simulated equity curves from portfolio data — will use real backtest data later
    return [
      { name: 'Carteira', data: [100, 103, 101, 106, 104, 109, 112, 110, 115], color: 'var(--obsidian)' },
      { name: 'CDI', data: [100, 101, 102, 103, 104, 105, 106, 107, 108], color: 'var(--info)', dashed: true },
      { name: 'IBOV', data: [100, 102, 99, 104, 101, 105, 108, 106, 110], color: 'var(--text-tertiary)', dashed: true },
    ];
  });

  readonly dividendBars = computed((): BarDataPoint[] => {
    const proj = this.dividendProjections();
    if (!proj?.projections.length) {
      return [
        { label: 'Jan', value: 320 }, { label: 'Fev', value: 180 },
        { label: 'Mar', value: 450 }, { label: 'Abr', value: 280 },
        { label: 'Mai', value: 520 }, { label: 'Jun', value: 340 },
        { label: 'Jul', value: 290, opacity: 0.4 }, { label: 'Ago', value: 460, opacity: 0.4 },
        { label: 'Set', value: 310, opacity: 0.4 }, { label: 'Out', value: 380, opacity: 0.4 },
        { label: 'Nov', value: 420, opacity: 0.4 }, { label: 'Dez', value: 550, opacity: 0.4 },
      ];
    }
    const currentMonth = new Date().getMonth();
    return proj.projections.map((p, i) => ({
      label: p.month.substring(5, 7),
      value: p.projected_value,
      opacity: i >= currentMonth ? 0.4 : 1,
    }));
  });

  // Sector exposure placeholder
  readonly sectorBars = computed((): BarDataPoint[] => {
    const p = this.portfolio();
    if (!p?.positions.length) return [];
    const clusters: Record<number, number> = {};
    const total = p.positions.reduce((s, pos) => s + pos.market_value, 0) || 1;
    p.positions.forEach(pos => {
      clusters[pos.cluster_id] = (clusters[pos.cluster_id] || 0) + pos.market_value;
    });
    const names: Record<number, string> = {
      1: 'Financeiro', 2: 'Commodities', 3: 'Consumo', 4: 'Utilities',
      5: 'Saúde', 6: 'Real Estate', 7: 'Bens Capital', 8: 'Educação', 9: 'TMT',
    };
    return Object.entries(clusters)
      .map(([id, val]) => ({
        label: names[Number(id)] || `C${id}`,
        value: Math.round((val / total) * 100),
      }))
      .sort((a, b) => b.value - a.value);
  });

  readonly regimeLabel = computed(() => {
    const r = this.regime();
    if (!r) return '';
    return REGIME_LABELS[r.regime] ?? r.label;
  });

  getInsightBorderColor(type: string): string {
    if (type === 'score_change') return 'var(--obsidian)';
    if (type === 'dividend') return 'var(--info)';
    if (type === 'news') return 'var(--warning)';
    return 'var(--obsidian)';
  }

  getInsightTag(type: string): string {
    if (type === 'score_change') return 'Score';
    if (type === 'dividend') return 'Provento';
    if (type === 'news') return 'Notícia';
    return type;
  }

  ratingColors(rating: Rating) {
    return RATING_COLORS[rating] ?? RATING_COLORS['HOLD'];
  }

  ngOnInit(): void {
    forkJoin({
      portfolio: this.portfolioService.get().pipe(catchError(() => of(null))),
      top: this.scoreService.getTop(5).pipe(catchError(() => of({ top: [] }))),
      feed: this.radarService.getFeed(8).pipe(catchError(() => of({ items: [], count: 0 }))),
      catalysts: this.scoreService.getCatalysts(7).pipe(catchError(() => of({ catalysts: [], period_days: 7 }))),
      divSummary: this.dividendService.getSummary(12).pipe(catchError(() => of(null))),
      divProj: this.dividendService.getProjections(12).pipe(catchError(() => of(null))),
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(res => {
      if (res.portfolio && res.portfolio.positions?.length > 0) {
        this.portfolio.set(res.portfolio);
        this.hasPortfolio.set(true);
      }
      this.topAssets.set(res.top.top ?? []);
      this.feedItems.set(res.feed.items ?? []);
      this.catalysts.set(res.catalysts.catalysts ?? []);
      if (res.divSummary) this.dividendSummary.set(res.divSummary);
      if (res.divProj) this.dividendProjections.set(res.divProj);
      this.loading.set(false);
    });

    this.regimeService.regime$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(r => this.regime.set(r));
  }
}
