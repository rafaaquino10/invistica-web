import { Component, ChangeDetectionStrategy, inject, computed, OnInit, signal, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { forkJoin, of, catchError } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { PortfolioService } from '../../core/services/portfolio.service';
import { ScoreService } from '../../core/services/score.service';
import { RadarService } from '../../core/services/radar.service';
import { DividendService } from '../../core/services/dividend.service';
import { RegimeService } from '../../core/services/regime.service';
import type { PortfolioResult } from '../../core/models/portfolio.model';
import type { ScreenerResult } from '../../core/models/score.model';
import type { FeedItem } from '../../core/models/radar.model';
import type { RegimeResult } from '../../core/models/regime.model';
import { RegimeType } from '../../core/models/regime.model';
import { Rating, RATING_LABELS } from '../../core/models/score.model';
import { CLUSTER_NAMES, ClusterId } from '../../core/models/cluster.model';
import { IqSkeletonComponent } from '../../shared/components/iq-skeleton/iq-skeleton.component';
import { IqDisclaimerComponent } from '../../shared/components/iq-disclaimer/iq-disclaimer.component';
import { IqButtonComponent } from '../../shared/components/iq-button/iq-button.component';
import { DashboardHeroComponent } from './dashboard-hero/dashboard-hero.component';
import { DashboardIbovComponent } from './dashboard-ibov/dashboard-ibov.component';
import { DashboardMoversComponent, MoverItem, SectorExposure } from './dashboard-movers/dashboard-movers.component';
import { DashboardInsightsComponent, InsightCard, RecommendedAsset } from './dashboard-insights/dashboard-insights.component';

@Component({
  selector: 'iq-dashboard',
  standalone: true,
  imports: [
    RouterLink, IqSkeletonComponent, IqDisclaimerComponent, IqButtonComponent,
    DashboardHeroComponent, DashboardIbovComponent, DashboardMoversComponent, DashboardInsightsComponent,
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
  readonly portfolio = signal<PortfolioResult | null>(null);
  readonly regime = signal<RegimeResult | null>(null);
  readonly topAssets = signal<ScreenerResult[]>([]);
  readonly feedItems = signal<FeedItem[]>([]);
  readonly divTotal = signal(0);
  readonly divYield = signal(0);

  // User
  readonly userName = computed(() => {
    const u = this.auth.currentUser();
    if (!u?.email) return '';
    const name = u.user_metadata?.['full_name'] || u.email.split('@')[0];
    return name.charAt(0).toUpperCase() + name.slice(1);
  });

  // Hero inputs
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

  // Movers (simulated from top assets — will use real data when available)
  readonly gainers = computed((): MoverItem[] => {
    return this.topAssets().slice(0, 5).map(a => ({
      ticker: a.ticker,
      price: a.fair_value_final ?? 0,
      change: (a.safety_margin ?? 0) * 100,
    }));
  });

  readonly losers = computed((): MoverItem[] => {
    // Reverse sort — lowest scores
    return [...this.topAssets()].reverse().slice(0, 5).map(a => ({
      ticker: a.ticker,
      price: a.fair_value_final ?? 0,
      change: -Math.abs((a.safety_margin ?? 0) * 100),
    }));
  });

  readonly sectorExposure = computed((): SectorExposure[] => {
    const p = this.portfolio();
    if (!p?.positions?.length) return [];
    const total = p.positions.reduce((s, pos) => s + (pos.market_value || 0), 0) || 1;
    const clusters: Record<number, number> = {};
    p.positions.forEach(pos => {
      clusters[pos.cluster_id] = (clusters[pos.cluster_id] || 0) + (pos.market_value || 0);
    });
    return Object.entries(clusters)
      .map(([id, val]) => ({
        name: CLUSTER_NAMES[Number(id) as ClusterId] || `C${id}`,
        pct: (val / total) * 100,
      }))
      .sort((a, b) => b.pct - a.pct);
  });

  // Insights
  readonly insightCards = computed((): InsightCard[] => {
    const feed = this.feedItems();
    const cards: InsightCard[] = [];

    // From feed
    for (const item of feed.slice(0, 6)) {
      let type: InsightCard['type'] = 'news';
      let tag = 'NOTÍCIA';
      if (item.type === 'score_change') {
        type = 'upgrade';
        tag = 'SCORE';
      } else if (item.type === 'dividend') {
        type = 'dividend';
        tag = 'DIVIDENDO';
      }
      cards.push({
        type, tag,
        text: item.title || item.description || '',
        footer: item.ticker ? item.ticker : undefined,
        timestamp: item.created_at ? new Date(item.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : undefined,
      });
    }

    // Opportunities from top assets not in portfolio
    const ownedTickers = new Set(this.portfolio()?.positions?.map(p => p.ticker) ?? []);
    const opportunities = this.topAssets().filter(a => !ownedTickers.has(a.ticker) && a.iq_score >= 70);
    for (const a of opportunities.slice(0, 3)) {
      const marginStr = a.safety_margin != null ? ` com margem de ${(a.safety_margin * 100).toFixed(0)}%` : '';
      cards.push({
        type: 'opportunity',
        tag: 'OPORTUNIDADE',
        text: `${a.ticker} está com score ${a.iq_score} (${RATING_LABELS[a.rating] ?? a.rating})${marginStr}. Você não tem na carteira.`,
      });
    }

    return cards;
  });

  readonly recommended = computed((): RecommendedAsset[] => {
    const ownedTickers = new Set(this.portfolio()?.positions?.map(p => p.ticker) ?? []);
    return this.topAssets()
      .filter(a => !ownedTickers.has(a.ticker) && a.iq_score > 0)
      .slice(0, 5)
      .map(a => ({
        ticker: a.ticker,
        company_name: a.company_name,
        score: a.iq_score,
        margin: a.safety_margin,
      }));
  });

  readonly hasPortfolio = computed(() => (this.portfolio()?.positions?.length ?? 0) > 0);

  ngOnInit(): void {
    forkJoin({
      portfolio: this.portfolioService.get().pipe(catchError(() => of(null))),
      top: this.scoreService.getTop(10).pipe(catchError(() => of({ top: [] }))),
      feed: this.radarService.getFeed(10).pipe(catchError(() => of({ feed: [], count: 0 }))),
      divSummary: this.dividendService.getSummary(12).pipe(catchError(() => of(null))),
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(res => {
      if (res.portfolio && res.portfolio.positions?.length > 0) {
        this.portfolio.set(res.portfolio);
      }
      this.topAssets.set(res.top.top ?? []);

      const feedData = (res.feed as any).feed ?? [];
      this.feedItems.set(feedData);

      if (res.divSummary) {
        this.divTotal.set((res.divSummary as any).total_received ?? 0);
        this.divYield.set((res.divSummary as any).yield_on_cost ?? 0);
      }

      this.loading.set(false);
    });

    this.regimeService.regime$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(r => this.regime.set(r));
  }
}
