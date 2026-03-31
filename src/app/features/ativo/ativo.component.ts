import { Component, ChangeDetectionStrategy, inject, signal, OnInit, DestroyRef, computed } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin, switchMap, catchError, of } from 'rxjs';
import { ScoreService } from '../../core/services/score.service';
import { TickerService } from '../../core/services/ticker.service';
import { ValuationService } from '../../core/services/valuation.service';
import { QuoteStreamService } from '../../core/services/quote-stream.service';
import type { ScoreDetail, Thesis } from '../../core/models/score.model';
import type { TickerDetail, Quote } from '../../core/models/ticker.model';
import type { ValuationResult } from '../../core/models/valuation.model';
import { CLUSTER_NAMES, ClusterId } from '../../core/models/cluster.model';
import { IqScoreGaugeComponent } from '../../shared/components/iq-score-gauge/iq-score-gauge.component';
import { IqRatingBadgeComponent } from '../../shared/components/iq-rating-badge/iq-rating-badge.component';
import { IqPillarBarsComponent } from '../../shared/components/iq-pillar-bars/iq-pillar-bars.component';
import { IqPriceChartComponent } from '../../shared/components/iq-price-chart/iq-price-chart.component';
import { IqFairValueBarComponent } from '../../shared/components/iq-fair-value-bar/iq-fair-value-bar.component';
import { IqSkeletonComponent } from '../../shared/components/iq-skeleton/iq-skeleton.component';
import { IqDisclaimerComponent } from '../../shared/components/iq-disclaimer/iq-disclaimer.component';
import { CompactNumberPipe } from '../../shared/pipes/compact-number.pipe';
import { FundamentosComponent } from './tabs/fundamentos/fundamentos.component';
import { ValuationTabComponent } from './tabs/valuation/valuation-tab.component';
import { DividendosTabComponent } from './tabs/dividendos-tab/dividendos-tab.component';
import { NoticiasTabComponent } from './tabs/noticias-tab/noticias-tab.component';
import { DossieTabComponent } from './tabs/dossie-tab/dossie-tab.component';
import { HistoricoTabComponent } from './tabs/historico-tab/historico-tab.component';
import { InstitucionalTabComponent } from './tabs/institucional-tab/institucional-tab.component';

interface TabDef { label: string; id: string; }

@Component({
  selector: 'iq-ativo',
  standalone: true,
  imports: [
    RouterLink,
    IqScoreGaugeComponent, IqRatingBadgeComponent, IqPillarBarsComponent,
    IqPriceChartComponent, IqFairValueBarComponent, IqSkeletonComponent,
    IqDisclaimerComponent, CompactNumberPipe,
    FundamentosComponent, ValuationTabComponent, DividendosTabComponent,
    NoticiasTabComponent, DossieTabComponent, HistoricoTabComponent, InstitucionalTabComponent,
  ],
  templateUrl: './ativo.component.html',
  styleUrl: './ativo.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AtivoComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly scoreService = inject(ScoreService);
  private readonly tickerService = inject(TickerService);
  private readonly valuationService = inject(ValuationService);
  private readonly quoteStream = inject(QuoteStreamService);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = signal(true);
  readonly ticker = signal('');
  readonly scoreDetail = signal<ScoreDetail | null>(null);
  readonly tickerDetail = signal<TickerDetail | null>(null);
  readonly valuation = signal<ValuationResult | null>(null);
  readonly thesis = signal<Thesis | null>(null);
  readonly liveQuote = signal<Quote | null>(null);
  readonly activeTab = signal('fundamentos');

  readonly tabs: TabDef[] = [
    { label: 'Fundamentos', id: 'fundamentos' },
    { label: 'Valuation', id: 'valuation' },
    { label: 'Dividendos', id: 'dividendos' },
    { label: 'Notícias & RI', id: 'noticias' },
    { label: 'Dossiê', id: 'dossie' },
    { label: 'Histórico', id: 'historico' },
    { label: 'Institucional', id: 'institucional' },
  ];

  readonly clusterName = computed(() => {
    const sd = this.scoreDetail();
    if (!sd) return '';
    return CLUSTER_NAMES[sd.cluster as ClusterId] ?? '';
  });

  readonly currentPrice = computed(() => {
    const q = this.liveQuote();
    if (q) return q.close;
    return this.tickerDetail()?.quote?.close ?? 0;
  });

  readonly priceChange = computed(() => {
    const q = this.liveQuote() ?? this.tickerDetail()?.quote;
    if (!q || !q.open) return 0;
    return (q.close - q.open) / q.open;
  });

  readonly quoteData = computed(() => {
    const q = this.liveQuote() ?? this.tickerDetail()?.quote;
    return q ?? null;
  });

  onTabChange(id: string): void {
    this.activeTab.set(id);
  }

  ngOnInit(): void {
    this.route.paramMap.pipe(
      switchMap(params => {
        const t = params.get('ticker')?.toUpperCase() ?? '';
        this.ticker.set(t);
        this.loading.set(true);
        return forkJoin({
          score: this.scoreService.getScore(t).pipe(catchError(() => of(null))),
          detail: this.tickerService.get(t).pipe(catchError(() => of(null))),
          val: this.valuationService.get(t).pipe(catchError(() => of(null))),
          thesis: this.scoreService.getThesis(t).pipe(catchError(() => of(null))),
        });
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(res => {
      this.scoreDetail.set(res.score);
      this.tickerDetail.set(res.detail);
      this.valuation.set(res.val);
      this.thesis.set(res.thesis);
      this.loading.set(false);
    });

    this.route.paramMap.pipe(
      switchMap(params => {
        const t = params.get('ticker')?.toUpperCase() ?? '';
        return this.quoteStream.stream(t, false);
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(q => this.liveQuote.set(q));
  }
}
