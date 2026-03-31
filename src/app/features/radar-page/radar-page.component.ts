import { Component, ChangeDetectionStrategy, inject, signal, OnInit, DestroyRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, of } from 'rxjs';
import { RadarService } from '../../core/services/radar.service';
import { TickerService } from '../../core/services/ticker.service';
import type { FeedItem, UserAlert } from '../../core/models/radar.model';
import { IqButtonComponent } from '../../shared/components/iq-button/iq-button.component';
import { IqModalComponent } from '../../shared/components/iq-modal/iq-modal.component';
import { IqSearchComponent, SearchResult } from '../../shared/components/iq-search/iq-search.component';
import { IqDropdownComponent, DropdownOption } from '../../shared/components/iq-dropdown/iq-dropdown.component';
import { IqSkeletonComponent } from '../../shared/components/iq-skeleton/iq-skeleton.component';
import { IqEmptyStateComponent } from '../../shared/components/iq-empty-state/iq-empty-state.component';
import { IqDisclaimerComponent } from '../../shared/components/iq-disclaimer/iq-disclaimer.component';

type FeedFilter = 'all' | 'news' | 'score_change' | 'dividend';

@Component({
  selector: 'iq-radar-page',
  standalone: true,
  imports: [
    FormsModule, DatePipe,
    IqButtonComponent, IqModalComponent, IqSearchComponent, IqDropdownComponent,
    IqSkeletonComponent, IqEmptyStateComponent, IqDisclaimerComponent,
  ],
  templateUrl: './radar-page.component.html',
  styleUrl: './radar-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RadarPageComponent implements OnInit {
  private readonly radarService = inject(RadarService);
  private readonly tickerService = inject(TickerService);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = signal(true);
  readonly feedItems = signal<FeedItem[]>([]);
  readonly alerts = signal<UserAlert[]>([]);
  readonly activeFilter = signal<FeedFilter>('all');
  readonly alertModalOpen = signal(false);
  readonly saving = signal(false);
  readonly searchResults = signal<SearchResult[]>([]);

  // Alert form
  readonly alertTicker = signal('');
  readonly alertType = signal<string>('price_above');
  readonly alertThreshold = signal(0);

  readonly filterTabs = [
    { id: 'all' as FeedFilter, label: 'Tudo' },
    { id: 'news' as FeedFilter, label: 'Notícias' },
    { id: 'score_change' as FeedFilter, label: 'Score' },
    { id: 'dividend' as FeedFilter, label: 'Dividendos' },
  ];

  readonly alertTypeOptions: DropdownOption[] = [
    { label: 'Preço acima de', value: 'price_above' },
    { label: 'Preço abaixo de', value: 'price_below' },
    { label: 'Mudança de score', value: 'score_change' },
    { label: 'Dividendo', value: 'dividend' },
  ];

  borderColor(type: string): string {
    if (type === 'score_change') return 'var(--obsidian)';
    if (type === 'dividend') return 'var(--info)';
    if (type === 'news') return 'var(--warning)';
    return 'var(--text-tertiary)';
  }

  tagLabel(type: string): string {
    if (type === 'score_change') return 'SCORE';
    if (type === 'dividend') return 'PROVENTO';
    if (type === 'news') return 'NOTÍCIA';
    return type.toUpperCase();
  }

  setFilter(f: FeedFilter): void {
    this.activeFilter.set(f);
    this.loadFeed(f);
  }

  onSearch(q: string): void {
    if (q.length < 2) return;
    this.tickerService.search(q, 5).pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(r => this.searchResults.set(r.tickers.map(t => ({ label: t.ticker, value: t.ticker, subtitle: t.company_name }))));
  }

  onAlertTypeChange(opt: DropdownOption | DropdownOption[]): void {
    const v = Array.isArray(opt) ? opt[0]?.value : opt.value;
    if (v) this.alertType.set(v);
  }

  createAlert(): void {
    const ticker = this.alertTicker();
    const type = this.alertType() as any;
    if (!ticker) return;
    this.saving.set(true);

    const req: any = { asset_id: ticker, type };
    if (type === 'price_above' || type === 'price_below') req.threshold = this.alertThreshold();

    this.radarService.createAlert(req).pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: alert => {
          this.alerts.update(a => [...a, alert]);
          this.alertModalOpen.set(false);
          this.alertTicker.set('');
          this.alertThreshold.set(0);
          this.saving.set(false);
        },
        error: () => this.saving.set(false),
      });
  }

  deleteAlert(id: string): void {
    this.radarService.deleteAlert(id).pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.alerts.update(a => a.filter(x => x.id !== id)));
  }

  private loadFeed(filter: FeedFilter): void {
    this.radarService.getFeed(50, filter).pipe(
      catchError(() => of({ feed: [], count: 0 })),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(r => this.feedItems.set(r.feed ?? []));
  }

  ngOnInit(): void {
    this.loadFeed('all');
    this.radarService.getAlerts().pipe(
      catchError(() => of([])),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(a => {
      this.alerts.set(a as UserAlert[]);
      this.loading.set(false);
    });
  }
}
