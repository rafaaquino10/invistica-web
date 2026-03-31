import { Component, ChangeDetectionStrategy, inject, signal, OnInit, DestroyRef, computed } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { KeyValuePipe } from '@angular/common';
import { forkJoin, catchError, of } from 'rxjs';
import { AnalyticsService } from '../../core/services/analytics.service';
import { RegimeService } from '../../core/services/regime.service';
import { TickerService } from '../../core/services/ticker.service';
import type { RegimeResult, SectorRotationMatrix } from '../../core/models/regime.model';
import type { FocusExpectation } from '../../core/models/ticker.model';
import { RegimeType, REGIME_LABELS } from '../../core/models/regime.model';
import { IqRegimeBadgeComponent } from '../../shared/components/iq-regime-badge/iq-regime-badge.component';
import { IqHeatmapComponent } from '../../shared/components/iq-heatmap/iq-heatmap.component';
import { IqSkeletonComponent } from '../../shared/components/iq-skeleton/iq-skeleton.component';
import { IqDisclaimerComponent } from '../../shared/components/iq-disclaimer/iq-disclaimer.component';
import { IqEmptyStateComponent } from '../../shared/components/iq-empty-state/iq-empty-state.component';

@Component({
  selector: 'iq-macro-page',
  standalone: true,
  imports: [KeyValuePipe, IqRegimeBadgeComponent, IqHeatmapComponent, IqSkeletonComponent, IqDisclaimerComponent, IqEmptyStateComponent],
  templateUrl: './macro-page.component.html',
  styleUrl: './macro-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MacroPageComponent implements OnInit {
  private readonly analyticsService = inject(AnalyticsService);
  private readonly regimeService = inject(RegimeService);
  private readonly tickerService = inject(TickerService);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = signal(true);
  readonly regime = signal<RegimeResult | null>(null);
  readonly rotation = signal<SectorRotationMatrix | null>(null);
  readonly focus = signal<FocusExpectation[]>([]);

  // Heatmap from sector rotation matrix
  readonly heatmapData = computed(() => {
    const rot = this.rotation();
    if (!rot?.matrix) return [];
    const regimes: RegimeType[] = ['RISK_ON', 'RISK_OFF', 'STAGFLATION', 'RECOVERY'];
    const clusters = Object.keys(rot.clusters);
    return regimes.map(regime => clusters.map(cid => rot.matrix[regime]?.[rot.clusters[cid]] ?? 0));
  });

  readonly heatmapRows = computed(() => {
    return (['RISK_ON', 'RISK_OFF', 'STAGFLATION', 'RECOVERY'] as RegimeType[]).map(r => REGIME_LABELS[r]);
  });

  readonly heatmapCols = computed(() => {
    const rot = this.rotation();
    if (!rot?.clusters) return [];
    return Object.values(rot.clusters).map(n => n.substring(0, 6));
  });

  ngOnInit(): void {
    forkJoin({
      rotation: this.analyticsService.getSectorRotation().pipe(catchError(() => of(null))),
      focus: this.tickerService.getFocusExpectations().pipe(catchError(() => of({ expectations: [] }))),
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(({ rotation, focus }) => {
      this.rotation.set(rotation);
      this.focus.set(focus.expectations ?? []);
      this.loading.set(false);
    });

    this.regimeService.regime$.pipe(
      catchError(() => of(null)),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(r => this.regime.set(r));
  }
}
