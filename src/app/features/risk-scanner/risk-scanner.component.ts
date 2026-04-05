import { Component, ChangeDetectionStrategy, inject, signal, OnInit, DestroyRef, computed } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin, catchError, of, switchMap } from 'rxjs';
import { PortfolioService } from '../../core/services/portfolio.service';
import { ScoreService } from '../../core/services/score.service';
import { RegimeService } from '../../core/services/regime.service';
import type { Position } from '../../core/models/portfolio.model';
import type { RiskMetrics } from '../../core/models/score.model';
import type { RegimeResult } from '../../core/models/regime.model';
import { CLUSTER_NAMES, ClusterId } from '../../core/models/cluster.model';
import { IqSkeletonComponent } from '../../shared/components/iq-skeleton/iq-skeleton.component';
import { IqEmptyStateComponent } from '../../shared/components/iq-empty-state/iq-empty-state.component';
import { IqDisclaimerComponent } from '../../shared/components/iq-disclaimer/iq-disclaimer.component';

interface RiskItem {
  severity: 'critical' | 'warning' | 'ok';
  title: string;
  description: string;
  tickers: string[];
  action: string;
}

@Component({
  selector: 'iq-risk-scanner',
  standalone: true,
  imports: [IqSkeletonComponent, IqEmptyStateComponent, IqDisclaimerComponent],
  templateUrl: './risk-scanner.component.html',
  styleUrl: './risk-scanner.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RiskScannerComponent implements OnInit {
  private readonly portfolioService = inject(PortfolioService);
  private readonly scoreService = inject(ScoreService);
  private readonly regimeService = inject(RegimeService);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = signal(true);
  readonly noPortfolio = signal(false);
  readonly risks = signal<RiskItem[]>([]);

  readonly healthScore = computed(() => {
    const r = this.risks();
    if (r.some(x => x.severity === 'critical')) return 'critical';
    if (r.filter(x => x.severity === 'warning').length > 2) return 'warning';
    return 'ok';
  });

  readonly healthLabel = computed(() => {
    const h = this.healthScore();
    if (h === 'critical') return 'Atenção Crítica';
    if (h === 'warning') return 'Atenção';
    return 'Saudável';
  });

  ngOnInit(): void {
    setTimeout(() => { if (this.loading()) this.loading.set(false); }, 5000);
    forkJoin({
      portfolio: this.portfolioService.get().pipe(catchError(() => of(null))),
      regime: this.regimeService.regime$.pipe(catchError(() => of(null))),
    }).pipe(
      switchMap(({ portfolio, regime }) => {
        if (!portfolio?.positions?.length) {
          this.noPortfolio.set(true);
          this.loading.set(false);
          return of(null);
        }
        const riskCalls = portfolio.positions.map(pos =>
          this.scoreService.getRiskMetrics(pos.ticker).pipe(catchError(() => of(null)))
        );
        return forkJoin(riskCalls).pipe(
          switchMap(riskResults => {
            this.analyzeRisks(portfolio.positions, riskResults, regime);
            this.loading.set(false);
            return of(null);
          })
        );
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe();
  }

  private analyzeRisks(positions: Position[], riskMetrics: (RiskMetrics | null)[], regime: RegimeResult | null): void {
    const items: RiskItem[] = [];
    const totalValue = positions.reduce((s, p) => s + p.market_value, 0) || 1;
    const hhi = positions.reduce((s, p) => s + Math.pow(p.market_value / totalValue, 2), 0);

    if (hhi > 0.25) {
      items.push({ severity: 'critical', title: 'Concentração Extrema', description: `HHI de ${(hhi * 100).toFixed(0)}%.`, tickers: positions.filter(p => p.weight > 0.3).map(p => p.ticker), action: 'Diversificar posições.' });
    } else if (hhi > 0.15) {
      items.push({ severity: 'warning', title: 'Concentração Elevada', description: `HHI de ${(hhi * 100).toFixed(0)}%.`, tickers: positions.filter(p => p.weight > 0.2).map(p => p.ticker), action: 'Considerar diversificação.' });
    }

    positions.forEach((pos, i) => {
      const rm = riskMetrics[i];
      if (!rm) return;
      if (rm.risk_metrics.merton_pd != null && rm.risk_metrics.merton_pd > 0.05) {
        items.push({ severity: 'critical', title: 'Risco de Default', description: `Merton PD ${(rm.risk_metrics.merton_pd * 100).toFixed(1)}% — ${pos.ticker}.`, tickers: [pos.ticker], action: 'Revisar posição.' });
      }
      if (rm.risk_metrics.beneish_score != null && rm.risk_metrics.beneish_score > -1.78) {
        items.push({ severity: 'warning', title: 'Beneish M-Score Flag', description: `M-Score ${rm.risk_metrics.beneish_score?.toFixed(2)} — ${pos.ticker}.`, tickers: [pos.ticker], action: 'Investigar demonstrações.' });
      }
      const maxDl: Record<number, number> = { 1: 99, 2: 2.5, 3: 2.5, 4: 4, 5: 3, 6: 3.5, 7: 2, 8: 3, 9: 2 };
      const limit = maxDl[pos.cluster_id] ?? 3;
      if (rm.risk_metrics.dl_ebitda != null && rm.risk_metrics.dl_ebitda > limit) {
        items.push({ severity: 'warning', title: 'Alavancagem Alta', description: `DL/EBITDA ${rm.risk_metrics.dl_ebitda.toFixed(1)}x vs ${limit}x — ${pos.ticker}.`, tickers: [pos.ticker], action: 'Monitorar dívida.' });
      }
      if (rm.risk_metrics.altman_z != null && rm.risk_metrics.altman_z < 1.8) {
        items.push({ severity: rm.risk_metrics.altman_z < 1.1 ? 'critical' : 'warning', title: `Altman Z: ${rm.risk_metrics.altman_z_label}`, description: `Z-Score ${rm.risk_metrics.altman_z.toFixed(2)} — ${pos.ticker}.`, tickers: [pos.ticker], action: 'Revisar saúde financeira.' });
      }
    });

    if (regime?.sector_rotation) {
      Object.entries(regime.sector_rotation).forEach(([, tilt]) => {
        if (tilt.tilt_points <= -3) {
          const exposed = positions.filter(p => p.cluster_id === tilt.cluster_id);
          if (exposed.length > 0) {
            items.push({ severity: 'warning', title: 'Setor Desfavorecido', description: `Regime atual desfavorece com ${tilt.tilt_points}pp.`, tickers: exposed.map(p => p.ticker), action: 'Considerar reduzir exposição.' });
          }
        }
      });
    }

    if (regime?.kill_switch_active) {
      items.push({ severity: 'critical', title: 'Kill Switch Ativo', description: 'Condições adversas extremas detectadas.', tickers: [], action: 'Posição defensiva recomendada.' });
    }

    items.sort((a, b) => ({ critical: 0, warning: 1, ok: 2 }[a.severity] - { critical: 0, warning: 1, ok: 2 }[b.severity]));
    this.risks.set(items);
  }
}
