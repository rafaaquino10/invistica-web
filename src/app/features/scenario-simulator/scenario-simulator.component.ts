import { IqTickerLogoComponent } from '../../shared/components/iq-ticker-logo/iq-ticker-logo.component';
import { Component, ChangeDetectionStrategy, inject, signal, OnInit, DestroyRef, computed } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, debounceTime, switchMap, catchError, of, forkJoin } from 'rxjs';
import { AnalyticsService } from '../../core/services/analytics.service';
import { RegimeService } from '../../core/services/regime.service';
import { PortfolioService } from '../../core/services/portfolio.service';
import type { RegimeResult } from '../../core/models/regime.model';
import type { Position } from '../../core/models/portfolio.model';
import { REGIME_LABELS, RegimeType } from '../../core/models/regime.model';
import { IqSliderComponent } from '../../shared/components/iq-slider/iq-slider.component';
import { IqRegimeBadgeComponent } from '../../shared/components/iq-regime-badge/iq-regime-badge.component';
import { IqSkeletonComponent } from '../../shared/components/iq-skeleton/iq-skeleton.component';
import { IqDisclaimerComponent } from '../../shared/components/iq-disclaimer/iq-disclaimer.component';
import { IqEmptyStateComponent } from '../../shared/components/iq-empty-state/iq-empty-state.component';
import { CLUSTER_NAMES, ClusterId } from '../../core/models/cluster.model';

interface ImpactRow {
  ticker: string;
  cluster: string;
  impact: number;
}

@Component({
  selector: 'iq-scenario-simulator',
  standalone: true,
  imports: [
    IqTickerLogoComponent,IqSliderComponent, IqRegimeBadgeComponent, IqSkeletonComponent, IqDisclaimerComponent, IqEmptyStateComponent],
  templateUrl: './scenario-simulator.component.html',
  styleUrl: './scenario-simulator.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScenarioSimulatorComponent implements OnInit {
  private readonly analyticsService = inject(AnalyticsService);
  private readonly regimeService = inject(RegimeService);
  private readonly portfolioService = inject(PortfolioService);
  private readonly destroyRef = inject(DestroyRef);

  readonly Math = Math;
  readonly loading = signal(true);
  readonly positions = signal<Position[]>([]);
  readonly regime = signal<RegimeResult | null>(null);

  readonly selic = signal(14.25);
  readonly ipca = signal(4.5);
  readonly cambio = signal(5.24);
  readonly brent = signal(112);

  readonly impacts = signal<ImpactRow[]>([]);
  readonly estimatedRegime = signal<RegimeType>('RISK_OFF');

  private readonly change$ = new Subject<void>();

  readonly sectorImpacts = computed(() => {
    const map: Record<string, number[]> = {};
    this.impacts().forEach(i => {
      if (!map[i.cluster]) map[i.cluster] = [];
      map[i.cluster].push(i.impact);
    });
    return Object.entries(map)
      .map(([cluster, vals]) => ({
        cluster,
        avgImpact: vals.reduce((s, v) => s + v, 0) / vals.length,
      }))
      .sort((a, b) => b.avgImpact - a.avgImpact);
  });

  regimeLabel(r: RegimeType): string {
    return REGIME_LABELS[r] ?? r;
  }

  onSliderChange(): void {
    this.change$.next();
  }

  ngOnInit(): void {
    setTimeout(() => { if (this.loading()) this.loading.set(false); }, 5000);
    forkJoin({
      regime: this.regimeService.regime$.pipe(catchError(() => of(null))),
      portfolio: this.portfolioService.get().pipe(catchError(() => of(null))),
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(({ regime, portfolio }) => {
      if (regime) {
        this.regime.set(regime);
        this.selic.set(regime.macro.selic);
        this.ipca.set(regime.macro.ipca);
        this.cambio.set(regime.macro.cambio_usd);
        this.brent.set(regime.macro.brent);
        this.estimatedRegime.set(regime.regime);
      }
      if (portfolio?.positions) this.positions.set(portfolio.positions);
      this.loading.set(false);
      this.simulateImpact();
    });

    this.change$.pipe(
      debounceTime(500),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => this.simulateImpact());
  }

  private simulateImpact(): void {
    const selic = this.selic();
    const baseSelic = this.regime()?.macro.selic ?? 14.25;
    const delta = selic - baseSelic;

    // Estimate regime
    if (selic > 13 && this.ipca() > 6) this.estimatedRegime.set('STAGFLATION');
    else if (selic > 12) this.estimatedRegime.set('RISK_OFF');
    else if (selic < 10 && this.ipca() < 4) this.estimatedRegime.set('RISK_ON');
    else this.estimatedRegime.set('RECOVERY');

    // Simplified impact per position
    const rows: ImpactRow[] = this.positions().map(pos => {
      let impact = 0;
      const cluster = CLUSTER_NAMES[pos.cluster_id as ClusterId] ?? `C${pos.cluster_id}`;

      // Utilities benefitted by high selic
      if (pos.cluster_id === 4) impact = delta * 1.5;
      // Financeiro
      else if (pos.cluster_id === 1) impact = delta * 0.8;
      // Consumo hurt by high selic
      else if (pos.cluster_id === 3) impact = delta * -2.0;
      // Real estate hurt
      else if (pos.cluster_id === 6) impact = delta * -1.8;
      // Commodities linked to brent/cambio
      else if (pos.cluster_id === 2) {
        const brentDelta = this.brent() - (this.regime()?.macro.brent ?? 100);
        impact = brentDelta * 0.05 + (this.cambio() - (this.regime()?.macro.cambio_usd ?? 5)) * 2;
      }
      else impact = delta * -0.5;

      return { ticker: pos.ticker, cluster, impact: Math.round(impact * 10) / 10 };
    });

    this.impacts.set(rows.sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact)));
  }
}
