import { Component, ChangeDetectionStrategy, input, computed, inject, signal, effect } from '@angular/core';
import { NgxEchartsDirective, provideEchartsCore } from 'ngx-echarts';
import * as echarts from 'echarts/core';
import { PieChart } from 'echarts/charts';
import { TooltipComponent, LegendComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import type { EChartsOption } from 'echarts';
import { ThemeService } from '../../../core/services/theme.service';

echarts.use([PieChart, TooltipComponent, LegendComponent, CanvasRenderer]);

const CLUSTER_MAP: Record<number, string> = {
  1: 'Financeiro', 2: 'Commodities', 3: 'Consumo', 4: 'Utilities',
  5: 'Saúde', 6: 'TMT', 7: 'Bens Capital', 8: 'Real Estate', 9: 'Educação',
};

@Component({
  selector: 'iq-sector-donut',
  standalone: true,
  imports: [NgxEchartsDirective],
  providers: [provideEchartsCore({ echarts })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="panel card">
      <span class="overline">COMPOSIÇÃO SETORIAL</span>
      @if (chartOptions()) {
        <div class="chart" echarts [options]="chartOptions()!" [theme]="echartsTheme()" [autoResize]="true"></div>
      }
    </div>
  `,
  styles: [`
    .panel { padding: 14px; display: flex; flex-direction: column; gap: 8px; }
    .chart { width: 100%; height: 200px; }
  `]
})
export class SectorDonutComponent {
  private readonly theme = inject(ThemeService);
  sectorData = input.required<{ cluster_id: number; value: number }[]>();
  readonly echartsTheme = signal('dark-volt');

  constructor() {
    effect(() => { this.echartsTheme.set(this.theme.theme() === 'dark' ? 'dark-volt' : 'light-volt'); });
  }

  chartOptions = computed<EChartsOption | null>(() => {
    const data = this.sectorData();
    if (!data.length) return null;
    const map: Record<string, number> = {};
    for (const d of data) {
      const name = CLUSTER_MAP[d.cluster_id] || `Cluster ${d.cluster_id}`;
      map[name] = (map[name] || 0) + d.value;
    }
    const total = Object.values(map).reduce((s, v) => s + v, 0);
    const items = Object.entries(map).map(([name, value]) => ({ name, value: +((value / total) * 100).toFixed(1) })).sort((a, b) => b.value - a.value);

    return {
      tooltip: { trigger: 'item', formatter: '{b}: {c}%' },
      legend: { bottom: 0, type: 'scroll' },
      series: [{
        type: 'pie', radius: ['40%', '70%'], center: ['50%', '45%'],
        data: items, label: { show: false },
        emphasis: { label: { show: true, fontSize: 12, fontFamily: "'IBM Plex Mono', monospace" } },
      }],
    };
  });
}
