import { Component, ChangeDetectionStrategy, inject, signal, OnInit, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { forkJoin, catchError, of } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { PortfolioService } from '../../core/services/portfolio.service';
import { TickerService } from '../../core/services/ticker.service';
import type { PortfolioResult, Position, PortfolioAlert } from '../../core/models/portfolio.model';
import { IqButtonComponent } from '../../shared/components/iq-button/iq-button.component';
import { IqModalComponent } from '../../shared/components/iq-modal/iq-modal.component';
import { IqRatingBadgeComponent } from '../../shared/components/iq-rating-badge/iq-rating-badge.component';
import { IqDonutChartComponent, DonutSlice } from '../../shared/components/iq-donut-chart/iq-donut-chart.component';
import { IqSearchComponent, SearchResult } from '../../shared/components/iq-search/iq-search.component';
import { IqSkeletonComponent } from '../../shared/components/iq-skeleton/iq-skeleton.component';
import { IqEmptyStateComponent } from '../../shared/components/iq-empty-state/iq-empty-state.component';
import { IqDisclaimerComponent } from '../../shared/components/iq-disclaimer/iq-disclaimer.component';
import { CurrencyBrlPipe } from '../../shared/pipes/currency-brl.pipe';
import { IqTickerLogoComponent } from '../../shared/components/iq-ticker-logo/iq-ticker-logo.component';
import { Rating } from '../../core/models/score.model';
import { CLUSTER_NAMES, ClusterId } from '../../core/models/cluster.model';

@Component({
  selector: 'iq-portfolio',
  standalone: true,
  imports: [
    FormsModule,
    IqButtonComponent, IqModalComponent, IqRatingBadgeComponent,
    IqDonutChartComponent, IqSearchComponent, IqSkeletonComponent,
    IqEmptyStateComponent, IqDisclaimerComponent, IqTickerLogoComponent, CurrencyBrlPipe,
  ],
  templateUrl: './portfolio.component.html',
  styleUrl: './portfolio.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PortfolioComponent implements OnInit {
  private readonly portfolioService = inject(PortfolioService);
  private readonly tickerService = inject(TickerService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = signal(true);
  readonly portfolio = signal<PortfolioResult | null>(null);
  readonly alerts = signal<PortfolioAlert[]>([]);
  readonly addModalOpen = signal(false);
  readonly editModalOpen = signal(false);
  readonly saving = signal(false);
  readonly searchResults = signal<SearchResult[]>([]);

  // Add form
  readonly newTicker = signal('');
  readonly newQty = signal(0);
  readonly newAvgPrice = signal(0);

  // Edit form
  readonly editPositionId = signal('');
  readonly editTicker = signal('');
  readonly editQty = signal(0);
  readonly editAvgPrice = signal(0);

  readonly sectorDonut = signal<DonutSlice[]>([]);

  private readonly COLORS = ['#3D3D3A', '#1A7A45', '#3B6B96', '#A07628', '#C23028', '#9C998F', '#6B6960', '#B8B5AD', '#DDD9D2'];

  onSearch(q: string): void {
    if (q.length < 2) { this.searchResults.set([]); return; }
    this.tickerService.search(q, 8)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(res => {
        this.searchResults.set(res.tickers.map(t => ({ label: t.ticker, value: t.ticker, subtitle: t.company_name })));
      });
  }

  onTickerSelect(r: SearchResult): void {
    this.newTicker.set(r.value);
  }

  addPosition(): void {
    const ticker = this.newTicker();
    const qty = this.newQty();
    const avg_price = this.newAvgPrice();
    if (!ticker || qty <= 0 || avg_price <= 0) return;

    this.saving.set(true);
    this.portfolioService.addPosition({ ticker, qty, avg_price })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: res => {
          this.portfolio.set(res);
          this.buildDonut(res);
          this.addModalOpen.set(false);
          this.newTicker.set('');
          this.newQty.set(0);
          this.newAvgPrice.set(0);
          this.saving.set(false);
        },
        error: () => this.saving.set(false),
      });
  }

  openEdit(pos: Position): void {
    this.editPositionId.set(pos.id);
    this.editTicker.set(pos.ticker);
    this.editQty.set(pos.qty);
    this.editAvgPrice.set(pos.avg_price);
    this.editModalOpen.set(true);
  }

  saveEdit(): void {
    this.saving.set(true);
    this.portfolioService.updatePosition(this.editPositionId(), { qty: this.editQty(), avg_price: this.editAvgPrice() })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: res => {
          this.portfolio.set(res);
          this.buildDonut(res);
          this.editModalOpen.set(false);
          this.saving.set(false);
        },
        error: () => this.saving.set(false),
      });
  }

  deletePosition(id: string): void {
    this.portfolioService.deletePosition(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(res => {
        this.portfolio.set(res);
        this.buildDonut(res);
      });
  }

  goToAsset(ticker: string): void {
    this.router.navigate(['/ativo', ticker]);
  }

  private buildDonut(p: PortfolioResult): void {
    const clusters: Record<number, number> = {};
    p.positions.forEach(pos => {
      clusters[pos.cluster_id] = (clusters[pos.cluster_id] || 0) + pos.market_value;
    });
    this.sectorDonut.set(
      Object.entries(clusters).map(([id, val], i) => ({
        label: CLUSTER_NAMES[Number(id) as ClusterId] || `C${id}`,
        value: val,
        color: this.COLORS[i % this.COLORS.length],
      }))
    );
  }

  ngOnInit(): void {
    forkJoin({
      portfolio: this.portfolioService.get().pipe(catchError(() => of(null))),
      alerts: this.portfolioService.getAlerts().pipe(catchError(() => of([]))),
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(({ portfolio, alerts }) => {
      if (portfolio) {
        this.portfolio.set(portfolio);
        this.buildDonut(portfolio);
      }
      this.alerts.set(alerts as PortfolioAlert[]);
      this.loading.set(false);
    });
  }
}
