import { IqTickerLogoComponent } from '../../shared/components/iq-ticker-logo/iq-ticker-logo.component';
import { Component, ChangeDetectionStrategy, inject, signal, DestroyRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, of, switchMap } from 'rxjs';
import { DividendService } from '../../core/services/dividend.service';
import type { SimulateResult } from '../../core/models/dividend.model';
import { IqButtonComponent } from '../../shared/components/iq-button/iq-button.component';
import { IqLineChartComponent, LineSeries } from '../../shared/components/iq-line-chart/iq-line-chart.component';
import { IqSkeletonComponent } from '../../shared/components/iq-skeleton/iq-skeleton.component';
import { IqDisclaimerComponent } from '../../shared/components/iq-disclaimer/iq-disclaimer.component';
import { CurrencyBrlPipe } from '../../shared/pipes/currency-brl.pipe';

interface SuggestedAsset {
  ticker: string;
  company_name: string;
  dividend_yield: number;
  dividend_safety: number;
  allocation: number;
}

@Component({
  selector: 'iq-income-planner',
  standalone: true,
  imports: [
    IqTickerLogoComponent,
    FormsModule,
    IqButtonComponent, IqLineChartComponent, IqSkeletonComponent,
    IqDisclaimerComponent, CurrencyBrlPipe,
  ],
  templateUrl: './income-planner.component.html',
  styleUrl: './income-planner.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IncomePlannerComponent {
  private readonly dividendService = inject(DividendService);
  private readonly destroyRef = inject(DestroyRef);

  readonly goalMonthly = signal(3000);
  readonly monthlyContribution = signal(2000);
  readonly loading = signal(false);
  readonly planned = signal(false);

  readonly suggestedAssets = signal<SuggestedAsset[]>([]);
  readonly simResult = signal<SimulateResult | null>(null);
  readonly projectionSeries = signal<LineSeries[]>([]);
  readonly yearsToGoal = signal(0);
  readonly totalNeeded = signal(0);

  plan(): void {
    this.loading.set(true);
    this.dividendService.getRadar(60)
      .pipe(
        switchMap(radar => {
          const ranked = [...(radar.results ?? [])].sort((a, b) => {
            const sa = a.dividend_yield * 0.4 + (a.dividend_safety / 100) * 0.4 + (a.projected_yield ?? a.dividend_yield) * 0.2;
            const sb = b.dividend_yield * 0.4 + (b.dividend_safety / 100) * 0.4 + (b.projected_yield ?? b.dividend_yield) * 0.2;
            return sb - sa;
          });

          const top = ranked.slice(0, 8);
          if (top.length === 0) {
            this.loading.set(false);
            return of(null);
          }

          const avgYield = top.reduce((s, t) => s + t.dividend_yield, 0) / top.length;
          const needed = avgYield > 0 ? (this.goalMonthly() * 12) / avgYield : 0;
          this.totalNeeded.set(needed);

          const mc = this.monthlyContribution();
          const years = mc > 0 ? Math.ceil(needed / (mc * 12)) : 0;
          this.yearsToGoal.set(years);

          const equalAlloc = needed / top.length;
          this.suggestedAssets.set(top.map(t => ({
            ticker: t.ticker,
            company_name: t.company_name,
            dividend_yield: t.dividend_yield,
            dividend_safety: t.dividend_safety,
            allocation: equalAlloc,
          })));

          const months = Math.min(years * 12, 120);
          const patrimony: number[] = [];
          const income: number[] = [];
          let accum = 0;
          for (let m = 0; m <= months; m++) {
            accum += mc;
            patrimony.push(accum);
            income.push((accum * avgYield) / 12);
          }
          this.projectionSeries.set([
            { name: 'Patrimônio (R$ mil)', data: patrimony.map(v => v / 1000), color: 'var(--obsidian)' },
            { name: 'Renda mensal', data: income, color: 'var(--positive)', dashed: true },
          ]);

          const tickers = top.map(t => t.ticker);
          const amounts = top.map(() => equalAlloc);
          return this.dividendService.simulate({ tickers, amounts }).pipe(catchError(() => of(null)));
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(simRes => {
        if (simRes) this.simResult.set(simRes);
        this.planned.set(true);
        this.loading.set(false);
      });
  }
}
