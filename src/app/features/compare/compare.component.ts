import { Component, ChangeDetectionStrategy, inject, signal, computed, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { ScoreService } from '../../core/services/score.service';
import type { CompareItem } from '../../core/models/score.model';
import { Rating } from '../../core/models/score.model';
import { CLUSTER_NAMES, ClusterId } from '../../core/models/cluster.model';
import { SlicePipe } from '@angular/common';
import { IqSearchComponent, SearchResult } from '../../shared/components/iq-search/iq-search.component';
import { IqRatingBadgeComponent } from '../../shared/components/iq-rating-badge/iq-rating-badge.component';
import { IqTickerLogoComponent } from '../../shared/components/iq-ticker-logo/iq-ticker-logo.component';
import { IqBarChartComponent, BarDataPoint } from '../../shared/components/iq-bar-chart/iq-bar-chart.component';
import { IqSkeletonComponent } from '../../shared/components/iq-skeleton/iq-skeleton.component';
import { IqDisclaimerComponent } from '../../shared/components/iq-disclaimer/iq-disclaimer.component';
import { TickerService } from '../../core/services/ticker.service';

interface MetricRow {
  label: string;
  key: string;
  format: 'number' | 'pct' | 'compact';
  higherIsBetter: boolean;
  unit?: string;
}

@Component({
  selector: 'iq-compare',
  standalone: true,
  imports: [
    SlicePipe, IqSearchComponent, IqRatingBadgeComponent, IqTickerLogoComponent,
    IqBarChartComponent, IqSkeletonComponent, IqDisclaimerComponent,
  ],
  templateUrl: './compare.component.html',
  styleUrl: './compare.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CompareComponent {
  private readonly scoreService = inject(ScoreService);
  private readonly tickerService = inject(TickerService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);

  readonly selectedTickers = signal<string[]>([]);
  readonly items = signal<CompareItem[]>([]);
  readonly loading = signal(false);
  readonly searchResults = signal<SearchResult[]>([]);

  readonly metrics: MetricRow[] = [
    { label: 'IQ-Score', key: 'iq_score', format: 'number', higherIsBetter: true },
    { label: 'Cotação', key: 'close', format: 'number', higherIsBetter: false, unit: 'R$' },
    { label: 'Market Cap', key: 'market_cap', format: 'compact', higherIsBetter: false },
    { label: 'Fair Value', key: 'fair_value_final', format: 'number', higherIsBetter: false, unit: 'R$' },
    { label: 'Margem Seg.', key: 'safety_margin', format: 'pct', higherIsBetter: true },
    { label: 'ROE', key: 'roe', format: 'pct', higherIsBetter: true },
    { label: 'DL/EBITDA', key: 'dl_ebitda', format: 'number', higherIsBetter: false },
    { label: 'Margem Líquida', key: 'net_margin', format: 'pct', higherIsBetter: true },
    { label: 'DY Projetado', key: 'dividend_yield_proj', format: 'pct', higherIsBetter: true },
    { label: 'Piotroski', key: 'piotroski', format: 'number', higherIsBetter: true },
  ];

  // Chart data for visual comparison
  readonly scoreChartData = computed((): BarDataPoint[] =>
    this.items().map(i => ({ label: i.ticker, value: i.iq_score ?? 0 }))
  );

  readonly marginChartData = computed((): BarDataPoint[] =>
    this.items().filter(i => i.safety_margin != null).map(i => ({ label: i.ticker, value: (i.safety_margin ?? 0) * 100 }))
  );

  readonly dyChartData = computed((): BarDataPoint[] =>
    this.items().filter(i => i.dividend_yield_proj != null).map(i => ({ label: i.ticker, value: (i.dividend_yield_proj ?? 0) * 100 }))
  );

  clusterName(id: number): string {
    return CLUSTER_NAMES[id as ClusterId] ?? '';
  }

  scoreColor(sc: number): string {
    if (sc >= 82) return 'var(--positive)';
    if (sc >= 70) return 'var(--obsidian)';
    if (sc >= 45) return 'var(--warning)';
    return 'var(--negative)';
  }

  onSearch(q: string): void {
    if (q.length < 2) { this.searchResults.set([]); return; }
    this.tickerService.search(q, 8)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(res => {
        this.searchResults.set(res.tickers.map(t => ({
          label: t.ticker, value: t.ticker, subtitle: t.company_name,
        })));
      });
  }

  addTicker(r: SearchResult): void {
    const current = this.selectedTickers();
    if (current.length >= 5 || current.includes(r.value)) return;
    this.selectedTickers.update(t => [...t, r.value]);
    this.searchResults.set([]);
    if (current.length >= 1) setTimeout(() => this.compare(), 100);
  }

  removeTicker(ticker: string): void {
    this.selectedTickers.update(t => t.filter(x => x !== ticker));
    this.items.update(i => i.filter(x => x.ticker !== ticker));
    if (this.selectedTickers().length >= 2) setTimeout(() => this.compare(), 100);
  }

  compare(): void {
    const tickers = this.selectedTickers();
    if (tickers.length < 2) return;
    this.loading.set(true);
    this.scoreService.compare(tickers)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(res => {
        this.items.set(res.tickers ?? []);
        this.loading.set(false);
      });
  }

  getVal(item: CompareItem, key: string): any {
    return (item as any)[key];
  }

  formatVal(val: any, m: MetricRow): string {
    if (val == null) return '—';
    if (m.format === 'pct') return (val * 100).toFixed(2) + '%';
    if (m.format === 'compact') {
      if (val >= 1e12) return (val / 1e12).toFixed(1) + 'T';
      if (val >= 1e9) return (val / 1e9).toFixed(1) + 'B';
      if (val >= 1e6) return (val / 1e6).toFixed(1) + 'M';
      return val.toFixed(0);
    }
    const prefix = m.unit ? m.unit + ' ' : '';
    return prefix + (typeof val === 'number' ? val.toFixed(2) : String(val));
  }

  isBest(metric: MetricRow, item: CompareItem): boolean {
    const vals = this.items().map(i => this.getVal(i, metric.key)).filter(v => v != null);
    if (!vals.length) return false;
    const val = this.getVal(item, metric.key);
    if (val == null) return false;
    return val === (metric.higherIsBetter ? Math.max(...vals) : Math.min(...vals));
  }

  goToAsset(ticker: string): void {
    this.router.navigate(['/ativo', ticker]);
  }
}
