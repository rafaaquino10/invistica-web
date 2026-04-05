import { Component, ChangeDetectionStrategy, input, inject, signal, OnInit, DestroyRef } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { switchMap, forkJoin, catchError, of, filter } from 'rxjs';
import { TickerService } from '../../../../core/services/ticker.service';
import { DividendService } from '../../../../core/services/dividend.service';
import type { TickerDividend } from '../../../../core/models/ticker.model';
import type { DividendSafety, TrapRisk } from '../../../../core/models/dividend.model';
import { IqBarChartComponent, BarDataPoint } from '../../../../shared/components/iq-bar-chart/iq-bar-chart.component';
import { IqScoreGaugeComponent } from '../../../../shared/components/iq-score-gauge/iq-score-gauge.component';
import { IqSkeletonComponent } from '../../../../shared/components/iq-skeleton/iq-skeleton.component';

@Component({
  selector: 'iq-dividendos-tab',
  standalone: true,
  imports: [IqBarChartComponent, IqScoreGaugeComponent, IqSkeletonComponent],
  template: `
    @if (loading()) {
      <iq-skeleton variant="rect" width="100%" height="200px" />
    } @else {
      <div class="divs">
        @if (barData().length > 0) {
          <div class="divs__chart">
            <h4 class="divs__title">Histórico de Proventos</h4>
            <iq-bar-chart [data]="barData()" color="var(--positive)" />
          </div>
        }
        <div class="divs__metrics">
          @if (safety(); as s) {
            <div class="divs__card">
              <h4 class="divs__title">Dividend Safety</h4>
              <iq-score-gauge [score]="s.safety_score" rating="HOLD" size="sm" />
              <div class="divs__meta">
                <span class="divs__label">Payout</span>
                <span class="mono">{{ s.payout_ratio != null ? (s.payout_ratio * 100).toFixed(0) + '%' : '—' }}</span>
              </div>
              <div class="divs__meta">
                <span class="divs__label">Cobertura</span>
                <span class="mono">{{ s.coverage_ratio != null ? s.coverage_ratio.toFixed(2) + 'x' : '—' }}</span>
              </div>
              <div class="divs__meta">
                <span class="divs__label">Consistência</span>
                <span class="mono">{{ s.consistency_years != null ? s.consistency_years + ' anos' : '—' }}</span>
              </div>
            </div>
          }
          @if (trap(); as t) {
            <div class="divs__card">
              <h4 class="divs__title">Trap Risk</h4>
              <span class="divs__verdict mono" [class.positive]="t.trap_score < 40" [class.negative]="t.trap_score >= 60">
                {{ t.verdict }}
              </span>
              <span class="divs__trap-score mono">Score: {{ t.trap_score }}</span>
              @for (sig of t.signals; track sig.name) {
                <div class="divs__signal" [class.divs__signal--triggered]="sig.triggered">
                  <span class="divs__signal-dot"></span>
                  <span>{{ sig.description }}</span>
                </div>
              }
            </div>
          }
        </div>
      </div>
    }
  `,
  styles: [`
    .divs { display: flex; flex-direction: column; gap: 24px; }
    .divs__title { font-size: 0.75rem; font-weight: 600; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 12px; }
    .divs__metrics { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .divs__card { background: var(--surface-0); border: 1px solid var(--border-default); border-radius: var(--radius); padding: 16px; display: flex; flex-direction: column; gap: 8px; }
    .divs__meta { display: flex; justify-content: space-between; font-size: 0.75rem; color: var(--text-secondary); }
    .divs__label { color: var(--text-tertiary); }
    .divs__verdict { font-size: 0.875rem; font-weight: 700; }
    .divs__trap-score { font-size: 0.6875rem; color: var(--text-tertiary); }
    .positive { color: var(--positive); }
    .negative { color: var(--negative); }
    .divs__signal { display: flex; align-items: center; gap: 6px; font-size: 0.6875rem; color: var(--text-secondary); }
    .divs__signal-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--positive); flex-shrink: 0; }
    .divs__signal--triggered .divs__signal-dot { background: var(--negative); }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DividendosTabComponent implements OnInit {
  readonly ticker = input.required<string>();
  private readonly tickerService = inject(TickerService);
  private readonly dividendService = inject(DividendService);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = signal(true);
  readonly barData = signal<BarDataPoint[]>([]);
  readonly safety = signal<DividendSafety | null>(null);
  readonly trap = signal<TrapRisk | null>(null);

  ngOnInit(): void {
    setTimeout(() => { if (this.loading()) this.loading.set(false); }, 5000);
    const t = this.ticker(); if (!t) return; // direct call
    of(t).pipe(

      switchMap(t => forkJoin({
        divs: this.tickerService.getDividends(t).pipe(catchError(() => of({ ticker: t, dividends: [] }))),
        safety: this.dividendService.getSafety(t).pipe(catchError(() => of(null))),
        trap: this.dividendService.getTrapRisk(t).pipe(catchError(() => of(null))),
      })),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(({ divs, safety, trap }) => {
      const byYear: Record<string, number> = {};
      divs.dividends.forEach((d: TickerDividend) => {
        const year = d.ex_date.substring(0, 4);
        byYear[year] = (byYear[year] || 0) + d.value_per_share;
      });
      this.barData.set(
        Object.entries(byYear).slice(-8).map(([label, value]) => ({ label, value }))
      );
      this.safety.set(safety);
      this.trap.set(trap);
      this.loading.set(false);
    });
  }
}
