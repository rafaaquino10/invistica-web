import { Component, ChangeDetectionStrategy, inject, input, signal, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { ApiService } from '../../../core/services/api.service';
import { WatchlistService } from '../../../core/services/watchlist.service';
import { FeedFilterType } from './feed-filter.component';

export interface FeedItem {
  id: string; type: string; title: string; message: string;
  severity: string; date: string; tickers: string[];
  sentiment?: string; source?: string;
  old_score?: number; new_score?: number; old_rating?: string; new_rating?: string;
}

@Component({
  selector: 'iq-feed-timeline',
  standalone: true,
  imports: [DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="timeline">
      @for (item of filteredItems(); track item.id) {
        <div class="feed-card glass"
             [class.in-portfolio]="isInPortfolio(item)"
             [class.in-watchlist]="isInWatchlist(item)"
             [class.upgrade]="isUpgrade(item)"
             [class.downgrade]="isDowngrade(item)">
          <div class="card-top">
            <span class="type-badge" [class]="'type-' + item.type">{{ typeLabel(item.type) }}</span>
            <span class="card-time mono">{{ item.date | date:'dd/MM HH:mm' }}</span>
          </div>
          <div class="card-body">
            @if (item.tickers.length > 0) {
              <span class="card-ticker mono" (click)="goTo(item.tickers[0])">{{ item.tickers[0] }}</span>
            }
            <span class="card-title">{{ item.title }}</span>
          </div>
          @if (item.message) {
            <p class="card-msg">{{ item.message }}</p>
          }
          @if (isInPortfolio(item)) { <span class="context-badge portfolio-badge">Na carteira</span> }
          @if (isInWatchlist(item)) { <span class="context-badge watchlist-badge">Watchlist</span> }
        </div>
      } @empty {
        <div class="empty-feed label">{{ error() ? 'Falha ao carregar feed' : 'Nenhum evento' }}</div>
      }

      @if (hasMore()) {
        <button class="load-more-btn" (click)="loadMore()">Carregar mais</button>
      }
    </div>
  `,
  styles: [`
    .timeline { display: flex; flex-direction: column; gap: 8px; }
    .feed-card { padding: 12px; border-radius: var(--radius); border-left: 2px solid transparent; transition: background var(--transition-fast); }
    .feed-card:hover { background: var(--card-hover); }
    .feed-card.in-portfolio { border-left-color: var(--volt); }
    .feed-card.in-watchlist { border-left-color: var(--warn); }
    .feed-card.upgrade { background: var(--pos-dim); }
    .feed-card.downgrade { background: var(--neg-dim); }
    .card-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
    .type-badge { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; padding: 1px 6px; border-radius: var(--radius); }
    .type-news, .type-noticia { background: var(--elevated); color: var(--t2); }
    .type-score, .type-score_change { background: var(--volt-dim); color: var(--volt); }
    .type-dividend, .type-dividendo { background: var(--pos-dim); color: var(--pos); }
    .card-time { font-size: 10px; color: var(--t4); }
    .card-body { display: flex; align-items: center; gap: 8px; }
    .card-ticker { font-size: 12px; font-weight: 700; color: var(--volt); cursor: pointer; }
    .card-ticker:hover { text-decoration: underline; }
    .card-title { font-size: 13px; color: var(--t1); }
    .card-msg { font-size: 11px; color: var(--t3); margin-top: 4px; line-height: 1.4; }
    .context-badge { font-size: 8px; font-weight: 700; text-transform: uppercase; padding: 1px 4px; border-radius: var(--radius); margin-top: 4px; display: inline-block; }
    .portfolio-badge { background: var(--volt-dim); color: var(--volt); }
    .watchlist-badge { background: var(--warn-dim); color: var(--warn); }
    .empty-feed { text-align: center; padding: 40px; color: var(--t3); }
    .load-more-btn { padding: 8px; font-size: 12px; color: var(--t3); border: 1px solid var(--border); border-radius: var(--radius); }
    .load-more-btn:hover { border-color: var(--border-hover); color: var(--t1); }
  `]
})
export class FeedTimelineComponent implements OnInit, OnDestroy {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly watchlist = inject(WatchlistService);

  filter = input<FeedFilterType>('all');
  myOnly = input(false);
  portfolioTickers = input(new Set<string>());

  readonly items = signal<FeedItem[]>([]);
  readonly error = signal(false);
  readonly hasMore = signal(true);
  private offset = 0;
  private intervalId: ReturnType<typeof setInterval> | null = null;

  filteredItems = () => {
    let items = this.items();
    const f = this.filter();
    if (f !== 'all') items = items.filter(i => i.type === f || i.type.includes(f));
    if (this.myOnly()) {
      const pt = this.portfolioTickers();
      items = items.filter(i => i.tickers.some(t => pt.has(t)));
    }
    return items;
  };

  ngOnInit(): void {
    this.loadFeed(false);
    this.intervalId = setInterval(() => this.loadFeed(true), 60_000);
  }

  ngOnDestroy(): void {
    if (this.intervalId) clearInterval(this.intervalId);
  }

  loadMore(): void {
    this.offset += 50;
    this.api.get<{ feed: FeedItem[] }>('/radar/feed', { limit: 50, offset: this.offset }).subscribe({
      next: d => {
        const newItems = d.feed || [];
        if (newItems.length < 50) this.hasMore.set(false);
        this.items.update(list => [...list, ...newItems]);
      },
    });
  }

  isInPortfolio(item: FeedItem): boolean { return item.tickers.some(t => this.portfolioTickers().has(t)); }
  isInWatchlist(item: FeedItem): boolean { return item.tickers.some(t => this.watchlist.has(t)); }
  isUpgrade(item: FeedItem): boolean { return item.type === 'score_change' && (item.new_score ?? 0) > (item.old_score ?? 0); }
  isDowngrade(item: FeedItem): boolean { return item.type === 'score_change' && (item.new_score ?? 0) < (item.old_score ?? 0); }

  typeLabel(type: string): string {
    if (type.includes('news') || type === 'noticia') return 'Notícia';
    if (type.includes('score')) return 'Score';
    if (type.includes('dividend') || type === 'dividendo') return 'Dividendo';
    return type;
  }

  goTo(ticker: string): void { this.router.navigate(['/ativo', ticker]); }

  private loadFeed(isRefresh: boolean): void {
    this.api.get<{ feed: FeedItem[] }>('/radar/feed', { limit: 50 }).subscribe({
      next: d => {
        const newFeed = d.feed || [];
        if (isRefresh) {
          const existingIds = new Set(this.items().map(i => i.id));
          const fresh = newFeed.filter(i => !existingIds.has(i.id));
          if (fresh.length > 0) this.items.update(list => [...fresh, ...list]);
        } else {
          this.items.set(newFeed);
          if (newFeed.length < 50) this.hasMore.set(false);
        }
      },
      error: () => this.error.set(true),
    });
  }
}
