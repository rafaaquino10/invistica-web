import { Component, ChangeDetectionStrategy, input, inject, signal, OnInit, DestroyRef } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { switchMap, forkJoin, catchError, of, filter } from 'rxjs';
import { TickerService } from '../../../../core/services/ticker.service';
import { ScoreService } from '../../../../core/services/score.service';
import type { Financial } from '../../../../core/models/ticker.model';
import type { RiskMetrics } from '../../../../core/models/score.model';
import { IqSkeletonComponent } from '../../../../shared/components/iq-skeleton/iq-skeleton.component';

interface Indicator { label: string; value: string; }

@Component({
  selector: 'iq-fundamentos',
  standalone: true,
  imports: [IqSkeletonComponent],
  template: `
    @if (loading()) {
      <iq-skeleton variant="rect" width="100%" height="200px" />
    } @else {
      <div class="fund">
        @for (group of groups(); track group.title) {
          <div class="fund__group">
            <h4 class="fund__group-title">{{ group.title }}</h4>
            <div class="fund__grid">
              @for (ind of group.items; track ind.label) {
                <div class="fund__item">
                  <span class="fund__label">{{ ind.label }}</span>
                  <span class="fund__value mono">{{ ind.value }}</span>
                </div>
              }
            </div>
          </div>
        }
      </div>
    }
  `,
  styles: [`
    .fund { display: flex; flex-direction: column; gap: 24px; }
    .fund__group-title { font-size: 0.75rem; font-weight: 600; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 12px; }
    .fund__grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1px; background: var(--border-default); border: 1px solid var(--border-default); border-radius: var(--radius); overflow: hidden; }
    .fund__item { display: flex; flex-direction: column; gap: 2px; padding: 10px 14px; background: var(--surface-0); }
    .fund__label { font-size: 0.6875rem; color: var(--text-tertiary); }
    .fund__value { font-size: 0.875rem; font-weight: 600; color: var(--text-primary); }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FundamentosComponent implements OnInit {
  readonly ticker = input.required<string>();
  private readonly tickerService = inject(TickerService);
  private readonly scoreService = inject(ScoreService);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = signal(true);
  readonly groups = signal<{ title: string; items: Indicator[] }[]>([]);

  ngOnInit(): void {
    const t = this.ticker();
    if (!t) return;
    forkJoin({
      fin: this.tickerService.getFinancials(t, 1).pipe(catchError(() => of({ ticker: t, financials: [] }))),
      risk: this.scoreService.getRiskMetrics(t).pipe(catchError(() => of(null))),
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(({ fin, risk }) => {
      const f = fin.financials[0];
      const r = risk;
      this.groups.set([
        {
          title: 'Lucratividade',
          items: [
            { label: 'ROE', value: this.pct(f?.roe) },
            { label: 'ROIC', value: this.pct(f?.roic ?? r?.profitability?.roic) },
            { label: 'Margem Bruta', value: this.pct(f?.gross_margin ?? r?.profitability?.gross_margin) },
            { label: 'Margem Líquida', value: this.pct(f?.net_margin ?? r?.profitability?.net_margin) },
            { label: 'Margem EBITDA', value: this.pct(f?.ebitda_margin) },
            { label: 'FCF Yield', value: this.pct(f?.fcf_yield ?? r?.profitability?.fcf_yield) },
          ],
        },
        {
          title: 'Solidez',
          items: [
            { label: 'DL/EBITDA', value: this.num(f?.dl_ebitda ?? r?.risk_metrics?.dl_ebitda) },
            { label: 'Piotroski', value: this.int(f?.piotroski_score ?? r?.risk_metrics?.piotroski_score) },
            { label: 'ICJ', value: this.num(f?.icj ?? r?.risk_metrics?.icj) },
            { label: 'Liquidez', value: this.num(r?.risk_metrics?.liquidity_ratio) },
          ],
        },
        {
          title: 'Risco Avançado',
          items: [
            { label: 'Altman Z', value: r?.risk_metrics?.altman_z != null ? `${r.risk_metrics.altman_z.toFixed(2)} (${r.risk_metrics.altman_z_label})` : '—' },
            { label: 'Merton PD', value: this.pct(r?.risk_metrics?.merton_pd) },
            { label: 'Beneish', value: this.num(f?.beneish_score ?? r?.risk_metrics?.beneish_score) },
            { label: 'WACC', value: this.pct(f?.wacc ?? r?.profitability?.wacc) },
          ],
        },
      ]);
      this.loading.set(false);
    });
  }

  private pct(v: number | null | undefined): string {
    return v != null ? (v * 100).toFixed(2) + '%' : '—';
  }

  private num(v: number | null | undefined): string {
    return v != null ? v.toFixed(2) : '—';
  }

  private int(v: number | null | undefined): string {
    return v != null ? v.toString() : '—';
  }
}
