import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { NgxEchartsDirective, provideEchartsCore } from 'ngx-echarts';
import * as echarts from 'echarts/core';
import { BarChart } from 'echarts/charts';
import { GridComponent, TooltipComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import type { EChartsOption } from 'echarts';
import { ApiService } from '../../../core/services/api.service';
import { InViewDirective } from '../../../shared/directives/in-view.directive';
import { CountUpDirective } from '../../../shared/directives/count-up.directive';

echarts.use([BarChart, GridComponent, TooltipComponent, CanvasRenderer]);

@Component({
  selector: 'iq-results-section',
  standalone: true,
  imports: [NgxEchartsDirective, InViewDirective, CountUpDirective],
  providers: [provideEchartsCore({ echarts })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section id="resultados" class="section" iqInView>
      <span class="overline volt">RESULTADOS</span>
      <h2>Dados reais. Zero marketing.</h2>
      <div class="nums">
        <div class="num-block"><span class="num mono" [iqCountUp]="298" countSuffix="+">0</span><span class="num-label">Ações analisadas</span></div>
        <div class="num-block"><span class="num mono" [iqCountUp]="9">0</span><span class="num-label">Clusters setoriais</span></div>
        <div class="num-block"><span class="num mono" [iqCountUp]="4">0</span><span class="num-label">Regimes macro</span></div>
        <div class="num-block"><span class="num mono" [iqCountUp]="6">0</span><span class="num-label">Pilares de análise</span></div>
      </div>
      @if (chartOpts()) {
        <div class="chart-wrap"><div class="chart" echarts [options]="chartOpts()!" theme="dark-volt" [autoResize]="true"></div></div>
      }
    </section>
  `,
  styles: [`
    .section { padding: 100px 48px; text-align: center; background: #050505; }
    .section.in-view .nums, .section.in-view .chart-wrap { opacity: 1; transform: translateY(0); }
    .volt { color: #d0f364; }
    h2 { font-family: var(--font-ui); font-size: 28px; font-weight: 700; color: #F8FAFC; margin: 12px 0 40px; }
    .nums { display: flex; justify-content: center; gap: 48px; margin-bottom: 40px; opacity: 0; transform: translateY(20px); transition: all 500ms ease-out; }
    .num-block { display: flex; flex-direction: column; gap: 4px; }
    .num { font-size: 36px; font-weight: 700; color: #d0f364; text-shadow: 0 0 16px rgba(208,243,100,0.25); }
    .num-label { font-family: var(--font-ui); font-size: 11px; color: #606878; }
    .chart-wrap { max-width: 560px; margin: 0 auto; opacity: 0; transform: translateY(20px); transition: all 500ms ease-out 200ms; }
    .chart { width: 100%; height: 240px; }
    @media (max-width: 600px) { .nums { flex-wrap: wrap; gap: 24px; } .num { font-size: 28px; } }
  `]
})
export class ResultsSectionComponent implements OnInit {
  private readonly api = inject(ApiService);
  readonly chartOpts = signal<EChartsOption | null>(null);

  ngOnInit(): void {
    this.api.get<{ quintiles: { label: string; avg_iq_score: number }[] }>('/analytics/signal-decay').subscribe({
      next: d => {
        const q = d.quintiles || [];
        if (!q.length) return;
        const labels = ['82-100', '70-81', '45-69', '30-44', '0-29'];
        const colors = ['#d0f364', '#34D399', '#F59E0B', '#EF4444', '#EF4444'];
        this.chartOpts.set({
          grid: { top: 10, right: 16, bottom: 30, left: 40 },
          tooltip: { trigger: 'axis' },
          xAxis: { type: 'category', data: labels },
          yAxis: { type: 'value' },
          series: [{ type: 'bar', data: q.map((v, i) => ({ value: v.avg_iq_score, itemStyle: { color: colors[i] } })), barMaxWidth: 48 }],
        });
      },
    });
  }
}
