import { Component, ChangeDetectionStrategy, inject, signal, DestroyRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BacktestService } from '../../core/services/backtest.service';
import type { BacktestRequest, BacktestResult, BenchmarkId } from '../../core/models/backtest.model';
import { IqSliderComponent } from '../../shared/components/iq-slider/iq-slider.component';
import { IqDropdownComponent, DropdownOption } from '../../shared/components/iq-dropdown/iq-dropdown.component';
import { IqButtonComponent } from '../../shared/components/iq-button/iq-button.component';
import { IqLineChartComponent, LineSeries } from '../../shared/components/iq-line-chart/iq-line-chart.component';
import { IqSkeletonComponent } from '../../shared/components/iq-skeleton/iq-skeleton.component';
import { IqDisclaimerComponent } from '../../shared/components/iq-disclaimer/iq-disclaimer.component';
import { CurrencyBrlPipe } from '../../shared/pipes/currency-brl.pipe';

const BENCH_COLORS: Record<string, string> = {
  IBOV: '#3D3D3A', CDI: '#3B6B96', SMLL: '#A07628', IDIV: '#1A7A45',
  IFIX: '#9C998F', SPX: '#C23028', USD: '#6B6960', GOLD: '#B8B5AD',
};

@Component({
  selector: 'iq-backtest',
  standalone: true,
  imports: [
    FormsModule, IqSliderComponent, IqDropdownComponent, IqButtonComponent,
    IqLineChartComponent, IqSkeletonComponent, IqDisclaimerComponent, CurrencyBrlPipe,
  ],
  templateUrl: './backtest.component.html',
  styleUrl: './backtest.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BacktestComponent {
  private readonly backtestService = inject(BacktestService);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = signal(false);
  readonly result = signal<BacktestResult | null>(null);
  readonly chartSeries = signal<LineSeries[]>([]);

  // Params
  readonly startDate = signal('2024-01-01');
  readonly endDate = signal('2026-03-01');
  readonly rebalanceFreq = signal('monthly');
  readonly universeSize = signal(100);
  readonly longPct = signal(10);
  readonly minIqScore = signal(70);
  readonly initialCapital = signal(1000000);
  readonly transactionCostBps = signal(50);
  readonly selectedBenchmarks = signal<string[]>(['IBOV', 'CDI']);

  readonly freqOptions: DropdownOption[] = [
    { label: 'Mensal', value: 'monthly' },
    { label: 'Trimestral', value: 'quarterly' },
  ];

  readonly benchmarkOptions: DropdownOption[] = [
    { label: 'IBOV', value: 'IBOV' }, { label: 'CDI', value: 'CDI' },
    { label: 'SMLL', value: 'SMLL' }, { label: 'IDIV', value: 'IDIV' },
    { label: 'IFIX', value: 'IFIX' }, { label: 'SPX', value: 'SPX' },
    { label: 'USD', value: 'USD' }, { label: 'GOLD', value: 'GOLD' },
  ];

  onFreqChange(opt: DropdownOption | DropdownOption[]): void {
    const v = Array.isArray(opt) ? opt[0]?.value : opt.value;
    if (v) this.rebalanceFreq.set(v);
  }

  onBenchmarkChange(opt: DropdownOption | DropdownOption[]): void {
    if (Array.isArray(opt)) this.selectedBenchmarks.set(opt.map(o => o.value));
  }

  run(): void {
    this.loading.set(true);
    const req: BacktestRequest = {
      start_date: this.startDate(),
      end_date: this.endDate(),
      rebalance_freq: this.rebalanceFreq() as 'monthly' | 'quarterly',
      universe_size: this.universeSize(),
      long_pct: this.longPct() / 100,
      min_iq_score_buy: this.minIqScore(),
      initial_capital: this.initialCapital(),
      transaction_cost_bps: this.transactionCostBps(),
      benchmarks: this.selectedBenchmarks() as BenchmarkId[],
    };

    this.backtestService.run(req)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: res => {
          this.result.set(res);
          const series: LineSeries[] = [
            { name: 'IQ Strategy', data: res.strategy.series.map(s => s.value), color: 'var(--obsidian)' },
          ];
          res.benchmarks.forEach(b => {
            series.push({
              name: b.name,
              data: b.series.map(s => s.value),
              color: BENCH_COLORS[b.name] ?? 'var(--text-tertiary)',
              dashed: true,
            });
          });
          this.chartSeries.set(series);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  pct(v: number | null): string {
    return v != null ? (v * 100).toFixed(2) + '%' : '—';
  }

  num(v: number | null): string {
    return v != null ? v.toFixed(2) : '—';
  }
}
