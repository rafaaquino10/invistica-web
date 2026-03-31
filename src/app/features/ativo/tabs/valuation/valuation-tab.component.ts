import { Component, ChangeDetectionStrategy, input, inject, signal, OnInit, DestroyRef } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { switchMap, forkJoin, catchError, of, filter } from 'rxjs';
import { ValuationService } from '../../../../core/services/valuation.service';
import type { ValuationResult, Scenarios, MarginHistory } from '../../../../core/models/valuation.model';
import { IqFairValueBarComponent } from '../../../../shared/components/iq-fair-value-bar/iq-fair-value-bar.component';
import { IqLineChartComponent, LineSeries } from '../../../../shared/components/iq-line-chart/iq-line-chart.component';
import { IqMonteCarloComponent, MonteCarloScenarios } from '../../../../shared/components/iq-monte-carlo/iq-monte-carlo.component';
import { IqSkeletonComponent } from '../../../../shared/components/iq-skeleton/iq-skeleton.component';

@Component({
  selector: 'iq-valuation-tab',
  standalone: true,
  imports: [IqFairValueBarComponent, IqLineChartComponent, IqMonteCarloComponent, IqSkeletonComponent],
  template: `
    @if (loading()) {
      <iq-skeleton variant="rect" width="100%" height="200px" />
    } @else {
      <div class="val">
        <!-- FAIR VALUE BAR -->
        @if (valuation(); as v) {
          <div class="val__fv">
            <h4 class="val__title">Preço Justo vs Atual</h4>
            <iq-fair-value-bar [currentPrice]="v.current_price" [fairValue]="v.fair_value_final"
                               [p25]="v.fair_value_p25" [p75]="v.fair_value_p75" />
          </div>

          <!-- MODEL CARDS -->
          <div class="val__models">
            <div class="val__model">
              <span class="val__model-label">DCF</span>
              <span class="val__model-val mono">{{ v.fair_value_dcf != null ? 'R$ ' + v.fair_value_dcf.toFixed(2) : '—' }}</span>
            </div>
            <div class="val__model">
              <span class="val__model-label">Gordon</span>
              <span class="val__model-val mono">{{ v.fair_value_gordon != null ? 'R$ ' + v.fair_value_gordon.toFixed(2) : '—' }}</span>
            </div>
            <div class="val__model">
              <span class="val__model-label">Múltiplos</span>
              <span class="val__model-val mono">{{ v.fair_value_mult != null ? 'R$ ' + v.fair_value_mult.toFixed(2) : '—' }}</span>
            </div>
            <div class="val__model">
              <span class="val__model-label">Score Valuation</span>
              <span class="val__model-val mono">{{ v.score_valuation }}/100</span>
            </div>
          </div>
        }

        <!-- MARGIN HISTORY -->
        @if (marginSeries().length > 0) {
          <div class="val__section">
            <h4 class="val__title">Margem de Segurança Histórica</h4>
            <iq-line-chart [series]="marginSeries()" />
          </div>
        }

        <!-- SCENARIOS -->
        @if (mcScenarios(); as mc) {
          <div class="val__section">
            <h4 class="val__title">Cenários</h4>
            <iq-monte-carlo [scenarios]="mc" [currentPrice]="valuation()?.current_price ?? 0" />
          </div>
        }
      </div>
    }
  `,
  styles: [`
    .val { display: flex; flex-direction: column; gap: 24px; }
    .val__title { font-size: 0.75rem; font-weight: 600; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 12px; }
    .val__fv { max-width: 500px; }
    .val__models { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1px; background: var(--border-default); border: 1px solid var(--border-default); border-radius: var(--radius); overflow: hidden; }
    .val__model { padding: 12px 16px; background: var(--surface-0); display: flex; flex-direction: column; gap: 4px; }
    .val__model-label { font-size: 0.6875rem; color: var(--text-tertiary); }
    .val__model-val { font-size: 0.875rem; font-weight: 600; color: var(--text-primary); }
    .val__section { max-width: 500px; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ValuationTabComponent implements OnInit {
  readonly ticker = input.required<string>();
  private readonly valuationService = inject(ValuationService);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = signal(true);
  readonly valuation = signal<ValuationResult | null>(null);
  readonly marginSeries = signal<LineSeries[]>([]);
  readonly mcScenarios = signal<MonteCarloScenarios | null>(null);

  ngOnInit(): void {
    const t = this.ticker(); if (!t) return; // direct call
    of(t).pipe(
      
      switchMap(t => forkJoin({
        val: this.valuationService.get(t).pipe(catchError(() => of(null))),
        margin: this.valuationService.getMargin(t).pipe(catchError(() => of(null))),
        scenarios: this.valuationService.getScenarios(t).pipe(catchError(() => of(null))),
      })),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(({ val, margin, scenarios }) => {
      this.valuation.set(val);

      if (margin?.history?.length) {
        this.marginSeries.set([{
          name: 'Margem',
          data: margin.history.map(h => h.safety_margin * 100),
          color: 'var(--obsidian)',
        }]);
      }

      if (scenarios?.scenarios) {
        this.mcScenarios.set({
          bear: scenarios.scenarios.bear.fair_value,
          base: scenarios.scenarios.base.fair_value,
          bull: scenarios.scenarios.bull.fair_value,
        });
      }

      this.loading.set(false);
    });
  }
}
