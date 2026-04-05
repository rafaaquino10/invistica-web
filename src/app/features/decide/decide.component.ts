import { IqTickerLogoComponent } from '../../shared/components/iq-ticker-logo/iq-ticker-logo.component';
import { Component, ChangeDetectionStrategy, inject, signal, DestroyRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { catchError, of } from 'rxjs';
import { PortfolioService } from '../../core/services/portfolio.service';
import { RegimeService } from '../../core/services/regime.service';
import type { SmartContributionResponse, SmartContributionItem } from '../../core/models/portfolio.model';
import type { RegimeResult } from '../../core/models/regime.model';
import { IqButtonComponent } from '../../shared/components/iq-button/iq-button.component';
import { IqDonutChartComponent, DonutSlice } from '../../shared/components/iq-donut-chart/iq-donut-chart.component';
import { IqRegimeBadgeComponent } from '../../shared/components/iq-regime-badge/iq-regime-badge.component';
import { IqSkeletonComponent } from '../../shared/components/iq-skeleton/iq-skeleton.component';
import { IqEmptyStateComponent } from '../../shared/components/iq-empty-state/iq-empty-state.component';
import { IqDisclaimerComponent } from '../../shared/components/iq-disclaimer/iq-disclaimer.component';
import { CurrencyBrlPipe } from '../../shared/pipes/currency-brl.pipe';

const COLORS = ['#3D3D3A', '#1A7A45', '#3B6B96', '#A07628', '#C23028', '#9C998F', '#6B6960', '#B8B5AD'];

@Component({
  selector: 'iq-decide',
  standalone: true,
  imports: [
    IqTickerLogoComponent,
    FormsModule,
    IqButtonComponent, IqDonutChartComponent, IqRegimeBadgeComponent,
    IqSkeletonComponent, IqEmptyStateComponent, IqDisclaimerComponent, CurrencyBrlPipe,
  ],
  templateUrl: './decide.component.html',
  styleUrl: './decide.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DecideComponent {
  private readonly portfolioService = inject(PortfolioService);
  private readonly regimeService = inject(RegimeService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly amount = signal(2000);
  readonly loading = signal(false);
  readonly applying = signal(false);
  readonly result = signal<SmartContributionResponse | null>(null);
  readonly regime = signal<RegimeResult | null>(null);
  readonly donutData = signal<DonutSlice[]>([]);
  readonly noPortfolio = signal(false);

  constructor() {
    this.regimeService.regime$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(r => this.regime.set(r));

    this.portfolioService.get()
      .pipe(catchError(() => of(null)), takeUntilDestroyed(this.destroyRef))
      .subscribe(p => {
        if (!p || !p.positions?.length) this.noPortfolio.set(true);
      });
  }

  analyze(): void {
    if (this.amount() < 100) return;
    this.loading.set(true);
    this.portfolioService.smartContribution(this.amount())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: res => {
          this.result.set(res);
          this.donutData.set(
            res.suggestions.map((s, i) => ({
              label: s.ticker,
              value: s.suggested_amount,
              color: COLORS[i % COLORS.length],
            }))
          );
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  applyAll(): void {
    const suggestions = this.result()?.suggestions;
    if (!suggestions?.length) return;
    this.applying.set(true);

    let completed = 0;
    for (const s of suggestions) {
      const qty = Math.max(1, Math.floor(s.suggested_amount / 30));
      const avg_price = s.suggested_amount / qty;
      this.portfolioService.addPosition({ ticker: s.ticker, quantity: qty, avg_price })
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            completed++;
            if (completed >= suggestions.length) {
              this.applying.set(false);
              this.router.navigate(['/carteira']);
            }
          },
          error: () => {
            completed++;
            if (completed >= suggestions.length) this.applying.set(false);
          },
        });
    }
  }
}
