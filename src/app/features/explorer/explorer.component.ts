import { Component, ChangeDetectionStrategy, inject, signal, OnInit, DestroyRef, computed } from '@angular/core';
import { Router } from '@angular/router';
import { SlicePipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ScoreService, ScreenerParams } from '../../core/services/score.service';
import { TickerService } from '../../core/services/ticker.service';
import type { ScreenerResult } from '../../core/models/score.model';
import type { ClusterInfo } from '../../core/models/cluster.model';
import { RATING_COLORS, Rating } from '../../core/models/score.model';
import { IqDropdownComponent, DropdownOption } from '../../shared/components/iq-dropdown/iq-dropdown.component';
import { IqSliderComponent } from '../../shared/components/iq-slider/iq-slider.component';
import { IqButtonComponent } from '../../shared/components/iq-button/iq-button.component';
import { IqRatingBadgeComponent } from '../../shared/components/iq-rating-badge/iq-rating-badge.component';
import { IqSkeletonComponent } from '../../shared/components/iq-skeleton/iq-skeleton.component';
import { IqDisclaimerComponent } from '../../shared/components/iq-disclaimer/iq-disclaimer.component';
import { IqSparklineComponent } from '../../shared/components/iq-sparkline/iq-sparkline.component';
import { CurrencyBrlPipe } from '../../shared/pipes/currency-brl.pipe';

type SortKey = 'ticker' | 'iq_score' | 'score_quanti' | 'score_valuation' | 'safety_margin' | 'dividend_yield_proj';

@Component({
  selector: 'iq-explorer',
  standalone: true,
  imports: [
    IqDropdownComponent, IqSliderComponent, IqButtonComponent,
    IqRatingBadgeComponent, IqSkeletonComponent, IqDisclaimerComponent,
    IqSparklineComponent, SlicePipe, CurrencyBrlPipe,
  ],
  templateUrl: './explorer.component.html',
  styleUrl: './explorer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExplorerComponent implements OnInit {
  private readonly scoreService = inject(ScoreService);
  private readonly tickerService = inject(TickerService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = signal(true);
  readonly results = signal<ScreenerResult[]>([]);
  readonly clusterOptions = signal<DropdownOption[]>([]);

  // Filters
  readonly selectedCluster = signal<number | undefined>(undefined);
  readonly selectedRating = signal<string | undefined>(undefined);
  readonly minScore = signal(0);
  readonly minYield = signal(0);
  readonly minMargin = signal(0);

  // Sort
  readonly sortKey = signal<SortKey>('iq_score');
  readonly sortAsc = signal(false);

  readonly ratingOptions: DropdownOption[] = [
    { label: 'Todos', value: '' },
    { label: 'Compra Forte', value: 'STRONG_BUY' },
    { label: 'Acumular', value: 'BUY' },
    { label: 'Manter', value: 'HOLD' },
    { label: 'Reduzir', value: 'REDUCE' },
    { label: 'Evitar', value: 'AVOID' },
  ];

  readonly sorted = computed(() => {
    const data = [...this.results()];
    const key = this.sortKey();
    const asc = this.sortAsc();
    data.sort((a, b) => {
      const av = (a as any)[key] ?? 0;
      const bv = (b as any)[key] ?? 0;
      if (typeof av === 'string') return asc ? av.localeCompare(bv) : bv.localeCompare(av);
      return asc ? av - bv : bv - av;
    });
    return data;
  });

  ratingColor(rating: Rating): string {
    return RATING_COLORS[rating]?.text ?? 'var(--text-primary)';
  }

  toggleSort(key: SortKey): void {
    if (this.sortKey() === key) {
      this.sortAsc.update(v => !v);
    } else {
      this.sortKey.set(key);
      this.sortAsc.set(false);
    }
  }

  goToAsset(ticker: string): void {
    this.router.navigate(['/ativo', ticker]);
  }

  applyFilters(): void {
    this.loading.set(true);
    const params: ScreenerParams = { limit: 200 };
    const cluster = this.selectedCluster();
    if (cluster) params.cluster_id = cluster;
    const rating = this.selectedRating();
    if (rating) params.rating = rating;
    if (this.minScore() > 0) params.min_score = this.minScore();
    if (this.minYield() > 0) params.min_yield = this.minYield() / 100;
    if (this.minMargin() > 0) params.min_margin = this.minMargin() / 100;

    this.scoreService.screener(params)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(res => {
        this.results.set(res.results ?? []);
        this.loading.set(false);
      });
  }

  onClusterChange(opt: DropdownOption | DropdownOption[]): void {
    const v = Array.isArray(opt) ? opt[0]?.value : opt.value;
    this.selectedCluster.set(v ? Number(v) : undefined);
  }

  onRatingChange(opt: DropdownOption | DropdownOption[]): void {
    const v = Array.isArray(opt) ? opt[0]?.value : opt.value;
    this.selectedRating.set(v || undefined);
  }

  ngOnInit(): void {
    this.tickerService.listClusters()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(res => {
        this.clusterOptions.set([
          { label: 'Todos', value: '' },
          ...res.clusters.map(c => ({ label: c.name, value: String(c.cluster_id) })),
        ]);
      });
    this.applyFilters();
  }
}
