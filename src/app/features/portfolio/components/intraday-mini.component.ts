import { Component, ChangeDetectionStrategy, inject, signal, OnInit, effect } from '@angular/core';
import { NgxEchartsDirective, provideEchartsCore } from 'ngx-echarts';
import * as echarts from 'echarts/core';
import { LineChart } from 'echarts/charts';
import { GridComponent, TooltipComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import type { EChartsOption } from 'echarts';
import { ApiService } from '../../../core/services/api.service';
import { ThemeService } from '../../../core/services/theme.service';

echarts.use([LineChart, GridComponent, TooltipComponent, CanvasRenderer]);

@Component({
  selector: 'iq-intraday-mini',
  standalone: true,
  imports: [NgxEchartsDirective],
  providers: [provideEchartsCore({ echarts })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="panel card">
      <span class="overline">INTRADAY</span>
      @if (chartOptions()) {
        <div class="chart" echarts [options]="chartOptions()!" [theme]="echartsTheme()" [autoResize]="true"></div>
      } @else {
        <div class="empty label">Sem dados intraday</div>
      }
    </div>
  `,
  styles: [`
    .panel { padding: 14px; display: flex; flex-direction: column; gap: 8px; }
    .chart { width: 100%; height: 160px; }
    .empty { text-align: center; padding: 20px; color: var(--t4); }
  `]
})
export class IntradayMiniComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly theme = inject(ThemeService);
  readonly chartOptions = signal<EChartsOption | null>(null);
  readonly echartsTheme = signal('dark-volt');

  constructor() {
    effect(() => { this.echartsTheme.set(this.theme.theme() === 'dark' ? 'dark-volt' : 'light-volt'); });
  }

  ngOnInit(): void {
    this.api.get<any>('/portfolio/intraday').subscribe({
      next: d => {
        if (!d.series || !d.series.length) return;
        const isDark = this.theme.theme() === 'dark';
        const volt = isDark ? '#d0f364' : '#5A6B10';
        this.chartOptions.set({
          grid: { top: 8, right: 8, bottom: 20, left: 40 },
          tooltip: { trigger: 'axis' },
          xAxis: { type: 'category', data: d.series.map((p: any) => p.time || p.date), show: false },
          yAxis: { type: 'value', scale: true, splitNumber: 3 },
          series: [{
            type: 'line', data: d.series.map((p: any) => p.portfolio ?? p.value), showSymbol: false,
            lineStyle: { color: volt, width: 1.5 },
          }],
        });
      },
      error: () => {},
    });
  }
}
