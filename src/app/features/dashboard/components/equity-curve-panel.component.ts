import { Component, ChangeDetectionStrategy, inject, signal, OnInit, OnDestroy, effect } from '@angular/core';
import { NgxEchartsDirective, provideEchartsCore } from 'ngx-echarts';
import * as echarts from 'echarts/core';
import { LineChart } from 'echarts/charts';
import { GridComponent, TooltipComponent, LegendComponent, DataZoomComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import type { EChartsOption } from 'echarts';
import { ApiService } from '../../../core/services/api.service';
import { ThemeService } from '../../../core/services/theme.service';
import { DARK_VOLT_THEME, LIGHT_VOLT_THEME } from '../../../core/echarts-themes';

echarts.use([LineChart, GridComponent, TooltipComponent, LegendComponent, DataZoomComponent, CanvasRenderer]);
echarts.registerTheme('dark-volt', DARK_VOLT_THEME);
echarts.registerTheme('light-volt', LIGHT_VOLT_THEME);

interface PerfPoint {
  date: string;
  portfolio?: number;
  ibov?: number;
  cdi?: number;
}

@Component({
  selector: 'iq-equity-curve-panel',
  standalone: true,
  imports: [NgxEchartsDirective],
  providers: [provideEchartsCore({ echarts })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="panel card">
      <div class="panel-header">
        <span class="overline">EQUITY CURVE</span>
        <div class="period-btns">
          @for (p of periods; track p.value) {
            <button class="period-btn cta"
                    [class.active]="activePeriod() === p.value"
                    (click)="changePeriod(p.value)">
              {{ p.label }}
            </button>
          }
        </div>
      </div>

      <div class="chart-container"
           echarts
           [options]="chartOptions()"
           [theme]="echartsTheme()"
           [autoResize]="true">
      </div>
    </div>
  `,
  styles: [`
    .panel { padding: 16px; display: flex; flex-direction: column; gap: 10px; }
    .panel-header { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px; }
    .period-btns { display: flex; gap: 4px; }
    .period-btn {
      padding: 4px 8px; font-size: 10px; border-radius: var(--radius);
      color: var(--t3); background: transparent; transition: all var(--transition-fast);
    }
    .period-btn:hover { color: var(--t1); background: var(--elevated); }
    .period-btn.active { color: var(--volt); background: var(--volt-dim); }
    .chart-container { width: 100%; height: 240px; }
  `]
})
export class EquityCurvePanelComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly theme = inject(ThemeService);

  readonly periods = [
    { label: '1M', value: 1 },
    { label: '3M', value: 3 },
    { label: '6M', value: 6 },
    { label: '12M', value: 12 },
  ];

  readonly activePeriod = signal(12);
  readonly chartOptions = signal<EChartsOption>({});

  readonly echartsTheme = signal('dark-volt');

  constructor() {
    effect(() => {
      this.echartsTheme.set(this.theme.theme() === 'dark' ? 'dark-volt' : 'light-volt');
    });
  }

  ngOnInit(): void {
    this.loadData();
  }

  changePeriod(months: number): void {
    this.activePeriod.set(months);
    this.loadData();
  }

  private loadData(): void {
    this.api.get<{ series?: PerfPoint[] }>('/portfolio/performance', { months: this.activePeriod() }).subscribe({
      next: (d) => this.buildChart(d.series || []),
      error: () => this.buildChart([]),
    });
  }

  private buildChart(data: PerfPoint[]): void {
    const dates = data.map(p => p.date);
    const portfolio = data.map(p => p.portfolio ?? null);
    const ibov = data.map(p => p.ibov ?? null);
    const cdi = data.map(p => p.cdi ?? null);

    const isDark = this.theme.theme() === 'dark';
    const voltColor = isDark ? '#d0f364' : '#5A6B10';

    this.chartOptions.set({
      grid: { top: 10, right: 16, bottom: 40, left: 50 },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'cross' },
      },
      legend: {
        bottom: 0,
        data: ['Carteira', 'IBOV', 'CDI'],
      },
      xAxis: {
        type: 'category',
        data: dates,
        boundaryGap: false,
      },
      yAxis: {
        type: 'value',
        axisLabel: { formatter: '{value}' },
      },
      dataZoom: [{ type: 'inside', start: 0, end: 100 }],
      series: [
        {
          name: 'Carteira',
          type: 'line',
          data: portfolio,
          lineStyle: { color: voltColor, width: 2 },
          itemStyle: { color: voltColor },
          areaStyle: {
            color: {
              type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: isDark ? 'rgba(208,243,100,0.25)' : 'rgba(90,107,16,0.15)' },
                { offset: 1, color: 'transparent' },
              ],
            } as any,
          },
          showSymbol: false,
          smooth: false,
        },
        {
          name: 'IBOV',
          type: 'line',
          data: ibov,
          lineStyle: { color: isDark ? '#606878' : '#9A9EA8', type: 'dashed', width: 1.5 },
          itemStyle: { color: isDark ? '#606878' : '#9A9EA8' },
          showSymbol: false,
        },
        {
          name: 'CDI',
          type: 'line',
          data: cdi,
          lineStyle: { color: isDark ? '#383E4A' : '#9A9EA8', width: 1 },
          itemStyle: { color: isDark ? '#383E4A' : '#9A9EA8' },
          showSymbol: false,
        },
      ],
    });
  }
}
