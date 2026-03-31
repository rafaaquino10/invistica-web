import { Component, ChangeDetectionStrategy, inject, signal, OnInit, DestroyRef, computed } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin, catchError, of } from 'rxjs';
import { ScoreService } from '../../core/services/score.service';
import { RegimeService } from '../../core/services/regime.service';
import { RadarService } from '../../core/services/radar.service';
import type { ScreenerResult } from '../../core/models/score.model';
import type { RegimeResult } from '../../core/models/regime.model';
import { Rating, RATING_LABELS } from '../../core/models/score.model';
import { CLUSTER_NAMES, ClusterId } from '../../core/models/cluster.model';
import { IqDonutChartComponent, DonutSlice } from '../../shared/components/iq-donut-chart/iq-donut-chart.component';
import { IqHeatmapComponent } from '../../shared/components/iq-heatmap/iq-heatmap.component';
import { IqRegimeBadgeComponent } from '../../shared/components/iq-regime-badge/iq-regime-badge.component';
import { IqRatingBadgeComponent } from '../../shared/components/iq-rating-badge/iq-rating-badge.component';
import { IqSkeletonComponent } from '../../shared/components/iq-skeleton/iq-skeleton.component';
import { IqDisclaimerComponent } from '../../shared/components/iq-disclaimer/iq-disclaimer.component';

@Component({
  selector: 'iq-thermometer',
  standalone: true,
  imports: [
    IqDonutChartComponent, IqHeatmapComponent, IqRegimeBadgeComponent,
    IqRatingBadgeComponent, IqSkeletonComponent, IqDisclaimerComponent,
  ],
  templateUrl: './thermometer.component.html',
  styleUrl: './thermometer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ThermometerComponent implements OnInit {
  private readonly scoreService = inject(ScoreService);
  private readonly regimeService = inject(RegimeService);
  private readonly radarService = inject(RadarService);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = signal(true);
  readonly results = signal<ScreenerResult[]>([]);
  readonly regime = signal<RegimeResult | null>(null);

  readonly donutData = computed((): DonutSlice[] => {
    const counts: Record<string, number> = { STRONG_BUY: 0, BUY: 0, HOLD: 0, REDUCE: 0, AVOID: 0 };
    this.results().forEach(r => { counts[r.rating] = (counts[r.rating] || 0) + 1; });
    const colors: Record<string, string> = {
      STRONG_BUY: '#1A7A45', BUY: '#3D3D3A', HOLD: '#A07628', REDUCE: '#C2882B', AVOID: '#C23028',
    };
    return Object.entries(counts)
      .filter(([, v]) => v > 0)
      .map(([k, v]) => ({
        label: RATING_LABELS[k as Rating],
        value: v,
        color: colors[k] || '#9C998F',
      }));
  });

  readonly heatmapData = computed(() => {
    const clusters = [1, 2, 3, 4, 5, 6, 7, 8, 9] as ClusterId[];
    const ratings: Rating[] = ['STRONG_BUY', 'BUY', 'HOLD', 'REDUCE', 'AVOID'];
    const res = this.results();

    return ratings.map(rating =>
      clusters.map(cid => res.filter(r => r.cluster_id === cid && r.rating === rating).length)
    );
  });

  readonly heatmapRows = ['Compra Forte', 'Acumular', 'Manter', 'Reduzir', 'Evitar'];
  readonly heatmapCols = computed(() => ([1, 2, 3, 4, 5, 6, 7, 8, 9] as ClusterId[]).map(id => CLUSTER_NAMES[id].substring(0, 5)));

  readonly topHighest = computed(() =>
    [...this.results()].sort((a, b) => b.iq_score - a.iq_score).slice(0, 5)
  );

  readonly topLowest = computed(() =>
    [...this.results()].sort((a, b) => a.iq_score - b.iq_score).slice(0, 5)
  );

  ngOnInit(): void {
    forkJoin({
      screener: this.scoreService.screener({ limit: 200 }).pipe(catchError(() => of({ count: 0, results: [] }))),
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(({ screener }) => {
      this.results.set(screener.results ?? []);
      this.loading.set(false);
    });

    this.regimeService.regime$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(r => this.regime.set(r));
  }
}
