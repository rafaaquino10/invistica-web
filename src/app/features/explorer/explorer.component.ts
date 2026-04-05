import { Component, ChangeDetectionStrategy, inject, signal, OnInit, DestroyRef, computed } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ScoreService, ScreenerParams } from '../../core/services/score.service';
import { TickerService } from '../../core/services/ticker.service';
import type { ScreenerResult } from '../../core/models/score.model';
import { Rating } from '../../core/models/score.model';
import { CLUSTER_NAMES, ClusterId } from '../../core/models/cluster.model';
import { IqTickerLogoComponent } from '../../shared/components/iq-ticker-logo/iq-ticker-logo.component';
import { IqDropdownComponent, DropdownOption } from '../../shared/components/iq-dropdown/iq-dropdown.component';
import { IqSliderComponent } from '../../shared/components/iq-slider/iq-slider.component';
import { IqButtonComponent } from '../../shared/components/iq-button/iq-button.component';
import { IqRatingBadgeComponent } from '../../shared/components/iq-rating-badge/iq-rating-badge.component';
import { IqSkeletonComponent } from '../../shared/components/iq-skeleton/iq-skeleton.component';
import { IqDisclaimerComponent } from '../../shared/components/iq-disclaimer/iq-disclaimer.component';

type SortKey = 'ticker' | 'company_name' | 'cluster_name' | 'price' | 'change_pct' | 'iq_score' | 'score_quanti' | 'score_quali' |
  'score_valuation' | 'fair_value_final' | 'safety_margin' | 'dividend_yield_proj' | 'dividend_safety';

interface ExplorerRow extends ScreenerResult {
  cluster_name: string;
  price: number | null;
  change_pct: number | null;
  spark_points: string;
}

@Component({
  selector: 'iq-explorer',
  standalone: true,
  imports: [
    RouterLink, IqTickerLogoComponent, IqDropdownComponent, IqSliderComponent, IqButtonComponent,
    IqRatingBadgeComponent, IqSkeletonComponent, IqDisclaimerComponent,
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
  readonly results = signal<ExplorerRow[]>([]);
  readonly clusterOptions = signal<DropdownOption[]>([]);

  readonly selectedCluster = signal<number | undefined>(undefined);
  readonly selectedRating = signal<string | undefined>(undefined);
  readonly minScore = signal(0);
  readonly minYield = signal(0);

  readonly sortKey = signal<SortKey>('iq_score');
  readonly sortAsc = signal(false);

  readonly quickChips: { label: string; filter: Partial<{ cluster: number; rating: string; minScore: number; minYield: number }> }[] = [
    { label: 'Score > 70', filter: { minScore: 70 } },
    { label: 'Compra Forte', filter: { rating: 'STRONG_BUY' } },
    { label: 'DY > 6%', filter: { minYield: 6 } },
    { label: 'Financeiro', filter: { cluster: 1 } },
    { label: 'Commodities', filter: { cluster: 2 } },
    { label: 'Consumo', filter: { cluster: 3 } },
    { label: 'TMT', filter: { cluster: 9 } },
    { label: 'Utilities', filter: { cluster: 4 } },
  ];

  isChipActive(chip: typeof this.quickChips[0]): boolean {
    const f = chip.filter;
    if (f.cluster && this.selectedCluster() === f.cluster) return true;
    if (f.rating && this.selectedRating() === f.rating) return true;
    if (f.minScore && this.minScore() >= f.minScore) return true;
    if (f.minYield && this.minYield() >= f.minYield) return true;
    return false;
  }

  toggleChip(chip: typeof this.quickChips[0]): void {
    const f = chip.filter;
    if (f.cluster) {
      this.selectedCluster.set(this.selectedCluster() === f.cluster ? undefined : f.cluster);
    }
    if (f.rating) {
      this.selectedRating.set(this.selectedRating() === f.rating ? undefined : f.rating);
    }
    if (f.minScore) {
      this.minScore.set(this.minScore() >= f.minScore ? 0 : f.minScore);
    }
    if (f.minYield) {
      this.minYield.set(this.minYield() >= f.minYield ? 0 : f.minYield);
    }
    this.applyFilters();
  }

  readonly ratingOptions: DropdownOption[] = [
    { label: 'Todos', value: '' },
    { label: 'Compra Forte', value: 'STRONG_BUY' },
    { label: 'Acumular', value: 'BUY' },
    { label: 'Manter', value: 'HOLD' },
    { label: 'Reduzir', value: 'REDUCE' },
    { label: 'Evitar', value: 'AVOID' },
  ];

  readonly columns: { key: SortKey; label: string; sortable: boolean }[] = [
    { key: 'ticker', label: 'Ticker', sortable: true },
    { key: 'company_name', label: 'Empresa', sortable: true },
    { key: 'cluster_name', label: 'Setor', sortable: true },
    { key: 'iq_score', label: 'IQ-Score', sortable: true },
    { key: 'score_quali', label: 'Quali', sortable: true },
    { key: 'score_quanti', label: 'Quanti', sortable: true },
    { key: 'score_valuation', label: 'Valuation', sortable: true },
    { key: 'fair_value_final', label: 'Fair Value', sortable: true },
    { key: 'safety_margin', label: 'Margem', sortable: true },
    { key: 'dividend_yield_proj', label: 'DY Proj', sortable: true },
    { key: 'dividend_safety', label: 'Safety', sortable: true },
  ];

  readonly sorted = computed(() => {
    const data = [...this.results()];
    const key = this.sortKey();
    const asc = this.sortAsc();
    data.sort((a, b) => {
      const av = (a as any)[key];
      const bv = (b as any)[key];
      // Nulls/zeros last
      const aNull = av == null || av === 0;
      const bNull = bv == null || bv === 0;
      if (aNull && bNull) return 0;
      if (aNull) return 1;
      if (bNull) return -1;
      if (typeof av === 'string') return asc ? av.localeCompare(bv) : bv.localeCompare(av);
      return asc ? av - bv : bv - av;
    });
    return data;
  });

  readonly scoredCount = computed(() => this.results().filter(r => r.iq_score > 0).length);

  scoreColor(sc: number): string {
    if (sc >= 82) return 'var(--positive)';
    if (sc >= 70) return 'var(--obsidian)';
    if (sc >= 45) return 'var(--warning)';
    return 'var(--negative)';
  }

  sortIcon(key: SortKey): string {
    if (this.sortKey() !== key) return '';
    return this.sortAsc() ? ' ▲' : ' ▼';
  }

  toggleSort(key: SortKey): void {
    if (this.sortKey() === key) this.sortAsc.update(v => !v);
    else { this.sortKey.set(key); this.sortAsc.set(false); }
  }

  goToAsset(ticker: string): void {
    this.router.navigate(['/ativo', ticker]);
  }

  fmt(v: number | null | undefined): string { return v ? String(v) : '—'; }
  fmtPct(v: number | null): string { return v != null ? (v * 100).toFixed(1) + '%' : '—'; }
  fmtBrl(v: number | null): string { return v != null ? 'R$ ' + v.toFixed(2) : '—'; }

  applyFilters(): void {
    this.loading.set(true);
    const params: ScreenerParams = { limit: 200 };
    if (this.selectedCluster()) params.cluster_id = this.selectedCluster();
    if (this.selectedRating()) params.rating = this.selectedRating();
    if (this.minScore() > 0) params.min_score = this.minScore();
    if (this.minYield() > 0) params.min_yield = this.minYield() / 100;

    this.scoreService.screener(params).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(res => {
      const scored = res.results ?? [];
      if (scored.length >= 5) {
        this.results.set(this.enrich(scored));
        this.loading.set(false);
        this.loadQuotes(scored.map(r => r.ticker));
      } else {
        this.tickerService.list({ limit: 200 }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(tr => {
          const fallback: ScreenerResult[] = (tr.tickers ?? []).map(t => ({
            ticker_id: t.id, iq_score: 0, rating: 'DADOS_INSUFICIENTES' as Rating,
            score_quanti: 0, score_quali: 0, score_valuation: 0,
            fair_value_final: null, safety_margin: null, dividend_yield_proj: null,
            dividend_safety: null, reference_date: '', ticker: t.ticker,
            company_name: t.company_name, cluster_id: t.cluster_id, rating_label: '',
          }));
          const set = new Set(scored.map(r => r.ticker));
          const merged = [...scored, ...fallback.filter(f => !set.has(f.ticker))];
          this.results.set(this.enrich(merged));
          this.loading.set(false);
          this.loadQuotes(merged.map(r => r.ticker));
        });
      }
    });
  }

  private enrich(rows: ScreenerResult[]): ExplorerRow[] {
    return rows.map(r => ({
      ...r,
      cluster_name: CLUSTER_NAMES[r.cluster_id as ClusterId] ?? `C${r.cluster_id}`,
      price: null,
      change_pct: null,
      spark_points: '',
    }));
  }

  private loadQuotes(tickers: string[]): void {
    const batch = tickers.slice(0, 30);
    batch.forEach(ticker => {
      this.tickerService.getQuote(ticker).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(q => {
        if (!q?.close) return;
        const changePct = q.open > 0 ? ((q.close - q.open) / q.open) * 100 : 0;
        // Generate 2-point sparkline from open->close as immediate fallback
        const fallbackSpark = this.buildSparkFromQuote(q.open, q.close, q.low, q.high);
        this.results.update(rows => rows.map(r => {
          if (r.ticker !== ticker) return r;
          return { ...r, price: q.close, change_pct: changePct, spark_points: r.spark_points || fallbackSpark };
        }));
      });

      // Also try 5-day history for richer sparkline (overwrites fallback if available)
      this.tickerService.getHistory(ticker, 7).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(h => {
        const data = h?.data ?? [];
        if (data.length < 2) return;
        const closes = data.map(d => d.close);
        const pts = this.buildSparkPoints(closes);
        if (pts) {
          this.results.update(rows => rows.map(r => r.ticker === ticker ? { ...r, spark_points: pts } : r));
        }
      });
    });
  }

  private buildSparkPoints(closes: number[]): string {
    if (closes.length < 2) return '';
    const min = Math.min(...closes);
    const max = Math.max(...closes);
    const range = max - min || 1;
    return closes.map((c, i) => {
      const x = (i / (closes.length - 1)) * 48;
      const y = 16 - ((c - min) / range) * 14;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
  }

  private buildSparkFromQuote(open: number, close: number, low: number, high: number): string {
    if (!open || !close) return '';
    // 5-point mini curve: open -> low/high -> mid -> high/low -> close
    const vals = open < close
      ? [open, Math.max(low, open * 0.99), (open + close) / 2, Math.min(high, close * 1.01), close]
      : [open, Math.min(high, open * 1.01), (open + close) / 2, Math.max(low, close * 0.99), close];
    return this.buildSparkPoints(vals);
  }

  onClusterChange(opt: DropdownOption | DropdownOption[]): void {
    this.selectedCluster.set(Array.isArray(opt) ? (opt[0]?.value ? Number(opt[0].value) : undefined) : (opt.value ? Number(opt.value) : undefined));
  }

  onRatingChange(opt: DropdownOption | DropdownOption[]): void {
    this.selectedRating.set(Array.isArray(opt) ? opt[0]?.value || undefined : opt.value || undefined);
  }

  ngOnInit(): void {
    setTimeout(() => { if (this.loading()) this.loading.set(false); }, 5000);
    this.tickerService.listClusters().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(res => {
      this.clusterOptions.set([{ label: 'Todos', value: '' }, ...res.clusters.map(c => ({ label: c.name, value: String(c.cluster_id) }))]);
    });
    this.applyFilters();
  }
}
