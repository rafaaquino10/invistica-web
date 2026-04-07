import { Component, ChangeDetectionStrategy, input, computed, inject, effect, signal } from '@angular/core';
import { NgxEchartsDirective, provideEchartsCore } from 'ngx-echarts';
import * as echarts from 'echarts/core';
import { BarChart } from 'echarts/charts';
import { GridComponent, TooltipComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import type { EChartsOption } from 'echarts';
import { ThemeService } from '../../../core/services/theme.service';

echarts.use([BarChart, GridComponent, TooltipComponent, CanvasRenderer]);

const CLUSTER_MAP: Record<number, string> = {
  1: 'Financeiro', 2: 'Commodities', 3: 'Consumo', 4: 'Utilities',
  5: 'Saúde', 6: 'TMT', 7: 'Bens Capital', 8: 'Real Estate', 9: 'Educação',
};

@Component({
  selector: 'iq-sector-exposure',
  standalone: true,
  imports: [NgxEchartsDirective],
  providers: [provideEchartsCore({ echarts })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="panel card">
      <span class="overline">EXPOSIÇÃO SETORIAL</span>
      @if (chartOptions()) {
        <div class="chart" echarts [options]="chartOptions()!" [theme]="echartsTheme()" [autoResize]="true"></div>
      } @else {
        <div class="empty label">Sem dados</div>
      }
    </div>
  `,
  styles: [`
    .panel { padding: 16px; display: flex; flex-direction: column; gap: 10px; }
    .chart { width: 100%; height: 220px; }
    .empty { text-align: center; padding: 20px; color: var(--t4); }
  `]
})
export class SectorExposureComponent {
  private readonly theme = inject(ThemeService);
  clusterIds = input.required<number[]>();
  readonly echartsTheme = signal('dark-volt');

  constructor() {
    effect(() => { this.echartsTheme.set(this.theme.theme() === 'dark' ? 'dark-volt' : 'light-volt'); });
  }

  chartOptions = computed<EChartsOption | null>(() => {
    const ids = this.clusterIds();
    if (!ids.length) return null;

    const counts: Record<string, number> = {};
    for (const id of ids) {
      const name = CLUSTER_MAP[id] || `Cluster ${id}`;
      counts[name] = (counts[name] || 0) + 1;
    }
    const total = ids.length;
    const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const isDark = this.theme.theme() === 'dark';

    return {
      grid: { top: 8, right: 16, bottom: 8, left: 100 },
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      xAxis: { type: 'value', max: 100, axisLabel: { formatter: '{value}%' } },
      yAxis: { type: 'category', data: entries.map(e => e[0]), inverse: true },
      series: [{
        type: 'bar',
        data: entries.map(e => +((e[1] / total) * 100).toFixed(1)),
        itemStyle: { color: isDark ? '#d0f364' : '#5A6B10', borderRadius: [0, 2, 2, 0] },
        barMaxWidth: 18,
        label: { show: true, position: 'right', formatter: '{c}%', fontSize: 10, fontFamily: "'IBM Plex Mono', monospace" },
      }],
    };
  });
}
