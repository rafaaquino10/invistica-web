import { Component, ChangeDetectionStrategy, input, inject, signal, OnInit, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin, catchError, of } from 'rxjs';
import { ValuationService } from '../../../../core/services/valuation.service';
import type { ValuationResult, Scenarios, MarginHistory } from '../../../../core/models/valuation.model';
import { IqFairValueBarComponent } from '../../../../shared/components/iq-fair-value-bar/iq-fair-value-bar.component';
import { IqLineChartComponent, LineSeries } from '../../../../shared/components/iq-line-chart/iq-line-chart.component';
import { IqMonteCarloComponent, MonteCarloScenarios } from '../../../../shared/components/iq-monte-carlo/iq-monte-carlo.component';
import { IqSkeletonComponent } from '../../../../shared/components/iq-skeleton/iq-skeleton.component';
import { IqEmptyStateComponent } from '../../../../shared/components/iq-empty-state/iq-empty-state.component';

@Component({
  selector: 'iq-valuation-tab',
  standalone: true,
  imports: [IqFairValueBarComponent, IqLineChartComponent, IqMonteCarloComponent, IqSkeletonComponent, IqEmptyStateComponent],
  template: `
    @if (loading()) {
      <iq-skeleton variant="rect" width="100%" height="200px" />
    } @else if (valuation()) {
      <div class="val">
        <!-- TOP: FAIR VALUE + MODELS -->
        <div class="val__top">
          <div class="val__fv-card">
            <h4 class="val__title">Preço Justo vs Atual</h4>
            <iq-fair-value-bar [currentPrice]="valuation()!.current_price" [fairValue]="valuation()!.fair_value_final"
                               [p25]="valuation()!.fair_value_p25" [p75]="valuation()!.fair_value_p75" />
          </div>
          <div class="val__models">
            <div class="val__model">
              <span class="val__model-label">DCF</span>
              <span class="val__model-val mono">{{ valuation()!.fair_value_dcf != null ? 'R$ ' + valuation()!.fair_value_dcf!.toFixed(2) : '—' }}</span>
            </div>
            <div class="val__model">
              <span class="val__model-label">Gordon</span>
              <span class="val__model-val mono">{{ valuation()!.fair_value_gordon != null ? 'R$ ' + valuation()!.fair_value_gordon!.toFixed(2) : '—' }}</span>
            </div>
            <div class="val__model">
              <span class="val__model-label">Múltiplos</span>
              <span class="val__model-val mono">{{ valuation()!.fair_value_mult != null ? 'R$ ' + valuation()!.fair_value_mult!.toFixed(2) : '—' }}</span>
            </div>
            <div class="val__model">
              <span class="val__model-label">Score Valuation</span>
              <span class="val__model-val mono">{{ valuation()!.score_valuation }}/100</span>
            </div>
          </div>
        </div>

        <!-- CHARTS ROW -->
        <div class="val__charts">
          @if (marginSeries().length > 0) {
            <div class="val__chart-card">
              <h4 class="val__title">Margem de Segurança Histórica</h4>
              <iq-line-chart [series]="marginSeries()" />
            </div>
          }
          @if (mcScenarios()) {
            <div class="val__chart-card">
              <h4 class="val__title">Cenários Bear / Base / Bull</h4>
              <iq-monte-carlo [scenarios]="mcScenarios()!" [currentPrice]="valuation()!.current_price" />
            </div>
          }
        </div>
      </div>
    } @else {
      <iq-empty-state title="Valuation não disponível" description="Aguardando cálculo de fair value pelo motor IQ-Cognit." />
    }
  `,
  styles: [`
    .val { display: flex; flex-direction: column; gap: 28px; }
    .val__title {
      font-size: 0.8125rem; font-weight: 600; color: var(--text-secondary);
      text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 16px;
    }

    .val__top { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; align-items: start; }

    .val__fv-card {
      background: var(--surface-0); border: 1px solid var(--border-default);
      border-radius: var(--radius); padding: 20px 24px;
    }

    .val__models {
      display: grid; grid-template-columns: 1fr 1fr; gap: 1px;
      background: var(--border-default); border: 1px solid var(--border-default);
      border-radius: var(--radius); overflow: hidden;
    }
    .val__model {
      padding: 16px 20px; background: var(--surface-0);
      display: flex; flex-direction: column; gap: 6px;
    }
    .val__model-label { font-size: 0.75rem; color: var(--text-tertiary); font-weight: 500; }
    .val__model-val { font-size: 1.125rem; font-weight: 700; color: var(--text-primary); }

    .val__charts { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }

    .val__chart-card {
      background: var(--surface-0); border: 1px solid var(--border-default);
      border-radius: var(--radius); padding: 20px 24px;
    }
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
    setTimeout(() => { if (this.loading()) this.loading.set(false); }, 5000);
    const t = this.ticker();
    if (!t) return;
    forkJoin({
      val: this.valuationService.get(t).pipe(catchError(() => of(null))),
      margin: this.valuationService.getMargin(t).pipe(catchError(() => of(null))),
      scenarios: this.valuationService.getScenarios(t).pipe(catchError(() => of(null))),
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(({ val, margin, scenarios }) => {
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
