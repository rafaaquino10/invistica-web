import { Component, ChangeDetectionStrategy, inject, signal, computed, OnInit } from '@angular/core';
import { ApiService } from '../../core/services/api.service';
import { AlertsBannerComponent } from './components/alerts-banner.component';
import { FeedFilterComponent, FeedFilterType } from './components/feed-filter.component';
import { AlertsManagerComponent } from './components/alerts-manager.component';
import { WatchlistPanelComponent } from './components/watchlist-panel.component';
import { FeedTimelineComponent, FeedItem } from './components/feed-timeline.component';
import { ScoreMoversComponent } from './components/score-movers.component';
import { DaySummaryComponent } from './components/day-summary.component';

interface PortfolioData { positions: { ticker: string }[]; }

@Component({
  selector: 'iq-radar',
  standalone: true,
  imports: [
    AlertsBannerComponent, FeedFilterComponent, AlertsManagerComponent,
    WatchlistPanelComponent, FeedTimelineComponent, ScoreMoversComponent,
    DaySummaryComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="radar-page">
      <h1>Radar</h1>

      <iq-alerts-banner />

      <div class="main-grid">
        <!-- Left: Controls -->
        <div class="col-left">
          <iq-feed-filter [counts]="feedCounts()" (filterChanged)="activeFilter.set($event)" (myOnlyChanged)="myOnly.set($event)" />
          <iq-alerts-manager />
          <iq-watchlist-panel />
        </div>

        <!-- Center: Feed -->
        <iq-feed-timeline
          class="col-center"
          [filter]="activeFilter()"
          [myOnly]="myOnly()"
          [portfolioTickers]="portfolioTickerSet()" />

        <!-- Right: Intelligence -->
        <div class="col-right">
          @if (hasPortfolio()) {
            <iq-score-movers title="MOVERS: SUAS POSIÇÕES" [items]="portfolioMovers()" emptyText="Suas posições estão estáveis" />
          }
          <iq-score-movers title="MOVERS: MERCADO" [items]="marketMovers()" emptyText="Sem mudanças hoje" />
          <iq-day-summary [feed]="allFeedItems()" />
        </div>
      </div>
    </div>
  `,
  styles: [`
    .radar-page { display: flex; flex-direction: column; gap: 16px; }
    h1 { font-family: var(--font-ui); font-size: 21px; font-weight: 700; color: var(--t1); }
    .main-grid { display: grid; grid-template-columns: 200px 1fr 240px; gap: 16px; align-items: start; }
    .col-left { display: flex; flex-direction: column; gap: 16px; }
    .col-right { display: flex; flex-direction: column; gap: 12px; }
  `]
})
export class RadarComponent implements OnInit {
  private readonly api = inject(ApiService);

  readonly activeFilter = signal<FeedFilterType>('all');
  readonly myOnly = signal(false);
  readonly portfolioTickers = signal<string[]>([]);
  readonly allFeedItems = signal<FeedItem[]>([]);

  readonly portfolioTickerSet = computed(() => new Set(this.portfolioTickers()));
  readonly hasPortfolio = computed(() => this.portfolioTickers().length > 0);

  readonly feedCounts = computed(() => {
    const items = this.allFeedItems();
    return {
      all: items.length,
      news: items.filter(i => i.type.includes('news') || i.type === 'noticia').length,
      score: items.filter(i => i.type.includes('score')).length,
      dividend: items.filter(i => i.type.includes('dividend') || i.type === 'dividendo').length,
    };
  });

  readonly scoreChangeItems = computed(() =>
    this.allFeedItems().filter(i => i.type.includes('score'))
  );

  readonly portfolioMovers = computed(() => {
    const pt = this.portfolioTickerSet();
    return this.scoreChangeItems().filter(i => i.tickers.some(t => pt.has(t))).slice(0, 10);
  });

  readonly marketMovers = computed(() => this.scoreChangeItems().slice(0, 10));

  ngOnInit(): void {
    this.api.get<PortfolioData>('/portfolio').subscribe({
      next: d => this.portfolioTickers.set((d.positions || []).map(p => p.ticker)),
      error: () => {},
    });

    this.api.get<{ feed: FeedItem[] }>('/radar/feed', { limit: 50 }).subscribe({
      next: d => this.allFeedItems.set(d.feed || []),
      error: () => {},
    });
  }
}
