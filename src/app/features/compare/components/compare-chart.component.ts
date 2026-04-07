import { Component, ChangeDetectionStrategy, inject, input, signal, OnChanges, effect } from '@angular/core';
import { NgxEchartsDirective, provideEchartsCore } from 'ngx-echarts';
import * as echarts from 'echarts/core';
import { LineChart } from 'echarts/charts';
import { GridComponent, TooltipComponent, LegendComponent, DataZoomComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import type { EChartsOption } from 'echarts';
import { forkJoin } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { ThemeService } from '../../../core/services/theme.service';

echarts.use([LineChart, GridComponent, TooltipComponent, LegendComponent, DataZoomComponent, CanvasRenderer]);

interface PricePoint { date: string; close: number; }

const COLORS_DARK = ['#d0f364', '#34D399', '#F59E0B', '#A0A8B8', '#EF4444'];
const COLORS_LIGHT = ['#5A6B10', '#16804A', '#B07A08', '#6A6E78', '#CC2828'];

@Component({
  selector: 'iq-compare-chart',
  standalone: true,
  imports: [NgxEchartsDirective],
  providers: [provideEchartsCore({ echarts })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="chart-panel card">
      <div class="chart-header">
        <span class="overline">EVOLUÇÃO COMPARADA (BASE 100)</span>
        <div class="period-btns">
          @for (p of periods; track p.days) {
            <button class="period-btn cta" [class.active]="activePeriod() === p.days" (click)="changePeriod(p.days)">{{ p.label }}</button>
          }
        </div>
      </div>
      @if (chartOptions()) {
        <div class="chart-container" echarts [options]="chartOptions()!" [theme]="echartsTheme()" [autoResize]="true"></div>
      }
    </div>
  `,
  styles: [`
    .chart-panel { padding: 16px; display: flex; flex-direction: column; gap: 10px; }
    .chart-header { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px; }
    .period-btns { display: flex; gap: 4px; }
    .period-btn { padding: 4px 8px; font-size: 10px; border-radius: var(--radius); color: var(--t3); }
    .period-btn:hover { color: var(--t1); background: var(--elevated); }
    .period-btn.active { color: var(--volt); background: var(--volt-dim); }
    .chart-container { width: 100%; height: 300px; }
  `]
})
export class CompareChartComponent implements OnChanges {
  private readonly api = inject(ApiService);
  private readonly theme = inject(ThemeService);

  tickers = input.required<string[]>();

  readonly periods = [
    { label: '3M', days: 90 },
    { label: '6M', days: 180 },
    { label: '1Y', days: 365 },
    { label: '2Y', days: 730 },
  ];

  readonly activePeriod = signal(365);
  readonly chartOptions = signal<EChartsOption | null>(null);
  readonly echartsTheme = signal('dark-volt');

  constructor() {
    effect(() => { this.echartsTheme.set(this.theme.theme() === 'dark' ? 'dark-volt' : 'light-volt'); });
  }

  ngOnChanges(): void {
    this.loadData();
  }

  changePeriod(days: number): void {
    this.activePeriod.set(days);
    this.loadData();
  }

  private loadData(): void {
    const tickers = this.tickers();
    if (tickers.length < 2) { this.chartOptions.set(null); return; }

    const requests: Record<string, ReturnType<typeof this.api.get<{ data: PricePoint[] }>>> = {};
    for (const t of tickers) {
      requests[t] = this.api.get<{ data: PricePoint[] }>(`/tickers/${t}/history`, { days: this.activePeriod() });
    }

    forkJoin(requests).subscribe({
      next: (results) => {
        const isDark = this.theme.theme() === 'dark';
        const colors = isDark ? COLORS_DARK : COLORS_LIGHT;

        // Find common dates
        const allDates = new Set<string>();
        for (const t of tickers) {
          for (const p of results[t]?.data || []) allDates.add(p.date);
        }
        const dates = [...allDates].sort();

        // Build base 100 series
        const series: any[] = [];
        tickers.forEach((ticker, i) => {
          const data = results[ticker]?.data || [];
          const priceMap = new Map(data.map(p => [p.date, p.close]));
          const firstPrice = data[0]?.close || 1;
          const base100 = dates.map(d => {
            const price = priceMap.get(d);
            return price != null ? +((price / firstPrice) * 100).toFixed(2) : null;
          });

          series.push({
            name: ticker,
            type: 'line',
            data: base100,
            showSymbol: false,
            lineStyle: { color: colors[i % colors.length], width: 2 },
            itemStyle: { color: colors[i % colors.length] },
          });
        });

        this.chartOptions.set({
          grid: { top: 10, right: 16, bottom: 40, left: 50 },
          tooltip: { trigger: 'axis' },
          legend: { bottom: 0, data: tickers },
          xAxis: { type: 'category', data: dates, boundaryGap: false },
          yAxis: { type: 'value', axisLabel: { formatter: '{value}' } },
          dataZoom: [{ type: 'inside' }],
          series,
        });
      },
    });
  }
}
