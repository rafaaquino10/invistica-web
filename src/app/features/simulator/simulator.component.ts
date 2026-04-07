import { Component, ChangeDetectionStrategy, inject, signal, computed, effect } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { NgxEchartsDirective, provideEchartsCore } from 'ngx-echarts';
import * as echarts from 'echarts/core';
import { LineChart } from 'echarts/charts';
import { GridComponent, TooltipComponent, LegendComponent, DataZoomComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import type { EChartsOption } from 'echarts';
import { ApiService } from '../../core/services/api.service';
import { ThemeService } from '../../core/services/theme.service';
import { KpiStripComponent, KpiItem } from '../../shared/components/kpi-strip/kpi-strip.component';
import { SCENARIO_PRESETS, ScenarioPreset } from './scenario-presets';

echarts.use([LineChart, GridComponent, TooltipComponent, LegendComponent, DataZoomComponent, CanvasRenderer]);

interface BacktestResult {
  cagr?: number; alpha_ibov?: number; sharpe?: number; max_drawdown?: number;
  win_rate?: number; final_capital?: number;
  equity_curve?: { date: string; portfolio: number; ibov?: number; cdi?: number }[];
  drawdowns?: { date: string; drawdown: number }[];
}

@Component({
  selector: 'iq-simulator',
  standalone: true,
  imports: [FormsModule, DecimalPipe, NgxEchartsDirective, KpiStripComponent],
  providers: [provideEchartsCore({ echarts })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="sim-page">
      <h1>Simulador</h1>

      <!-- PRESETS -->
      <div class="presets">
        @for (p of presets; track p.id) {
          <button class="preset-card card" [class.active]="activePreset() === p.id" (click)="selectPreset(p)">
            <i class="ph ph-{{ p.icon }} preset-icon"></i>
            <span class="preset-name">{{ p.name }}</span>
            <span class="preset-desc">{{ p.description }}</span>
            <span class="risk-badge" [class]="'risk-' + p.risk">{{ p.risk === 'low' ? 'Baixo' : p.risk === 'medium' ? 'Médio' : 'Alto' }}</span>
          </button>
        }
      </div>

      <!-- ADVANCED CONFIG -->
      @if (showAdvanced()) {
        <div class="advanced card">
          <span class="overline">CONFIGURAÇÃO AVANÇADA</span>
          <div class="config-grid">
            <div class="field"><label class="label">Início</label><input class="input mono" type="date" [(ngModel)]="startDate" /></div>
            <div class="field"><label class="label">Fim</label><input class="input mono" type="date" [(ngModel)]="endDate" /></div>
            <div class="field"><label class="label">Capital (R$)</label><input class="input mono" type="number" [(ngModel)]="capital" /></div>
            <div class="field"><label class="label">% Long</label><input class="input mono" type="number" [(ngModel)]="longPct" min="5" max="30" /></div>
          </div>
          <button class="btn-volt cta" [disabled]="loading()" (click)="runBacktest()">Executar Simulação</button>
        </div>
      }

      <!-- LOADING -->
      @if (loading()) {
        <div class="loading-state">
          <div class="loading-bar"><div class="loading-fill"></div></div>
          <span class="label">Simulando cenário...</span>
        </div>
      }

      <!-- RESULTS -->
      @if (result()) {
        <iq-kpi-strip [items]="kpiItems()" />

        <div class="results-grid">
          <div class="chart-col">
            @if (equityChartOpts()) {
              <div class="card chart-card">
                <span class="overline">EQUITY CURVE (BASE 100)</span>
                <div class="chart-main" echarts [options]="equityChartOpts()!" [theme]="echartsTheme()" [autoResize]="true"></div>
              </div>
            }
            @if (ddChartOpts()) {
              <div class="card chart-card">
                <span class="overline">DRAWDOWNS</span>
                <div class="chart-dd" echarts [options]="ddChartOpts()!" [theme]="echartsTheme()" [autoResize]="true"></div>
              </div>
            }
          </div>
          <div class="side-col card">
            <span class="overline">RESUMO</span>
            <p class="side-text">Cenário: <strong>{{ activePresetName() }}</strong></p>
            @if (result()!.cagr != null) {
              <p class="side-text">CAGR: <span class="mono" [class.volt-glow]="result()!.cagr! > 0">{{ result()!.cagr! | number:'1.1-1' }}%</span></p>
            }
            @if (result()!.max_drawdown != null) {
              <p class="side-text">Pior drawdown: <span class="mono neg">{{ result()!.max_drawdown! | number:'1.1-1' }}%</span></p>
            }
          </div>
        </div>

        <!-- PROJECTION -->
        <div class="projection glass">
          <span class="overline">PROJEÇÃO FUTURA</span>
          <p class="proj-note">Se o motor mantiver esta performance e você investir mensalmente:</p>
          <div class="proj-inputs">
            <div class="field"><label class="label">Aporte/mês (R$)</label><input class="input mono" type="number" [(ngModel)]="monthlyInvest" min="100" /></div>
            <div class="field"><label class="label">Horizonte (anos)</label><input class="input mono" type="number" [(ngModel)]="horizonYears" min="1" max="30" /></div>
          </div>
          <div class="proj-results">
            @for (m of milestones(); track m.years) {
              <div class="milestone">
                <span class="label">Em {{ m.years }} anos:</span>
                <span class="mono milestone-val">R$ {{ m.value | number:'1.0-0' }}</span>
              </div>
            }
          </div>
          <p class="disclaimer label">Projeção baseada em performance passada. Retornos futuros não são garantidos.</p>
        </div>
      }

      @if (error()) {
        <div class="error-state label">{{ error() }}</div>
      }
    </div>
  `,
  styles: [`
    .sim-page { display: flex; flex-direction: column; gap: 16px; }
    h1 { font-family: var(--font-ui); font-size: 21px; font-weight: 700; color: var(--t1); }
    .presets { display: flex; gap: 10px; flex-wrap: wrap; }
    .preset-card { flex: 1; min-width: 150px; padding: 14px; display: flex; flex-direction: column; align-items: center; gap: 4px; cursor: pointer; text-align: center; transition: all var(--transition-fast); }
    .preset-card:hover { border-color: var(--border-hover); }
    .preset-card.active { border-color: var(--volt); background: var(--volt-dim); }
    .preset-icon { font-size: 22px; color: var(--t3); }
    .preset-card.active .preset-icon { color: var(--volt); }
    .preset-name { font-family: var(--font-ui); font-size: 12px; font-weight: 700; color: var(--t1); }
    .preset-desc { font-size: 9px; color: var(--t3); }
    .risk-badge { font-size: 8px; font-weight: 700; text-transform: uppercase; padding: 1px 6px; border-radius: var(--radius); }
    .risk-low { background: var(--pos-dim); color: var(--pos); }
    .risk-medium { background: var(--warn-dim); color: var(--warn); }
    .risk-high { background: var(--neg-dim); color: var(--neg); }
    .advanced { padding: 16px; display: flex; flex-direction: column; gap: 12px; }
    .config-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; }
    .field { display: flex; flex-direction: column; gap: 4px; }
    .input { height: 32px; padding: 0 8px; background: var(--bg-alt); border: 1px solid var(--border); border-radius: var(--radius); color: var(--t1); font-size: 12px; }
    .input:focus { border-color: var(--border-active); outline: none; }
    .btn-volt { padding: 8px 20px; background: var(--volt); color: #050505; border-radius: var(--radius); font-weight: 700; align-self: flex-start; }
    .btn-volt:disabled { opacity: 0.4; }
    .loading-state { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 30px; }
    .loading-bar { width: 200px; height: 4px; background: var(--elevated); border-radius: 2px; overflow: hidden; }
    .loading-fill { width: 40%; height: 100%; background: var(--volt); border-radius: 2px; animation: loadpulse 1.5s ease-in-out infinite; }
    @keyframes loadpulse { 0%,100% { transform: translateX(-100%); } 50% { transform: translateX(250%); } }
    .results-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 16px; align-items: start; }
    .chart-col { display: flex; flex-direction: column; gap: 12px; }
    .chart-card { padding: 14px; display: flex; flex-direction: column; gap: 8px; }
    .chart-main { width: 100%; height: 300px; }
    .chart-dd { width: 100%; height: 160px; }
    .side-col { padding: 16px; display: flex; flex-direction: column; gap: 8px; }
    .side-text { font-size: 13px; color: var(--t2); }
    .volt-glow { color: var(--volt); text-shadow: var(--volt-glow); font-weight: 700; }
    .projection { padding: 20px; border-radius: var(--radius); display: flex; flex-direction: column; gap: 12px; }
    .proj-note { font-size: 13px; color: var(--t2); }
    .proj-inputs { display: flex; gap: 12px; }
    .proj-results { display: flex; gap: 20px; flex-wrap: wrap; }
    .milestone { display: flex; flex-direction: column; gap: 2px; }
    .milestone-val { font-size: 18px; font-weight: 700; color: var(--volt); text-shadow: var(--volt-glow); }
    .disclaimer { color: var(--t4); font-style: italic; }
    .error-state { text-align: center; padding: 20px; color: var(--neg); }
  `]
})
export class SimulatorComponent {
  private readonly api = inject(ApiService);
  private readonly theme = inject(ThemeService);

  readonly presets = SCENARIO_PRESETS;
  readonly activePreset = signal('');
  readonly showAdvanced = signal(false);
  readonly loading = signal(false);
  readonly error = signal('');
  readonly result = signal<BacktestResult | null>(null);
  readonly equityChartOpts = signal<EChartsOption | null>(null);
  readonly ddChartOpts = signal<EChartsOption | null>(null);
  readonly echartsTheme = signal('dark-volt');

  startDate = '2020-01-01';
  endDate = '2025-01-01';
  capital = 100000;
  longPct = 15;
  monthlyInvest = 5000;
  horizonYears = 10;

  readonly activePresetName = computed(() => this.presets.find(p => p.id === this.activePreset())?.name || 'Personalizado');

  readonly kpiItems = computed<KpiItem[]>(() => {
    const r = this.result();
    if (!r) return [];
    return [
      { label: 'CAGR', value: r.cagr != null ? `${r.cagr.toFixed(1)}%` : '--' },
      { label: 'Alpha IBOV', value: r.alpha_ibov != null ? `${r.alpha_ibov.toFixed(1)}%` : '--', change: r.alpha_ibov },
      { label: 'Sharpe', value: r.sharpe != null ? r.sharpe.toFixed(2) : '--' },
      { label: 'Max DD', value: r.max_drawdown != null ? `${r.max_drawdown.toFixed(1)}%` : '--' },
      { label: 'Win Rate', value: r.win_rate != null ? `${r.win_rate.toFixed(0)}%` : '--' },
      { label: 'Capital Final', value: r.final_capital != null ? `R$ ${r.final_capital.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}` : '--' },
    ];
  });

  readonly milestones = computed(() => {
    const r = this.result();
    if (!r?.cagr) return [];
    const monthlyRate = Math.pow(1 + r.cagr / 100, 1 / 12) - 1;
    const targets = [5, 10, 20];
    return targets.filter(y => y <= this.horizonYears).map(years => {
      let total = 0;
      for (let m = 0; m < years * 12; m++) total = (total + this.monthlyInvest) * (1 + monthlyRate);
      return { years, value: total };
    });
  });

  constructor() {
    effect(() => { this.echartsTheme.set(this.theme.theme() === 'dark' ? 'dark-volt' : 'light-volt'); });
  }

  selectPreset(p: ScenarioPreset): void {
    this.activePreset.set(p.id);
    if (p.id === 'custom') { this.showAdvanced.set(true); return; }
    this.showAdvanced.set(false);
    if (p.params['start_date']) this.startDate = p.params['start_date'];
    if (p.params['end_date']) this.endDate = p.params['end_date'];
    this.runBacktest(p.params);
  }

  runBacktest(overrides?: Record<string, any>): void {
    this.loading.set(true);
    this.error.set('');
    this.result.set(null);
    this.equityChartOpts.set(null);
    this.ddChartOpts.set(null);

    const body = { start_date: this.startDate, end_date: this.endDate, initial_capital: this.capital, long_pct: this.longPct / 100, ...(overrides || {}) };

    this.api.post<BacktestResult>('/backtest', body).subscribe({
      next: d => { this.result.set(d); this.loading.set(false); this.buildCharts(d); },
      error: () => { this.loading.set(false); this.error.set('Falha ao executar simulação. Tente um período diferente.'); },
    });
  }

  private buildCharts(r: BacktestResult): void {
    const isDark = this.theme.theme() === 'dark';
    const volt = isDark ? '#d0f364' : '#5A6B10';

    if (r.equity_curve?.length) {
      this.equityChartOpts.set({
        grid: { top: 10, right: 16, bottom: 40, left: 50 },
        tooltip: { trigger: 'axis' }, legend: { bottom: 0 },
        xAxis: { type: 'category', data: r.equity_curve.map(p => p.date), boundaryGap: false },
        yAxis: { type: 'value' },
        dataZoom: [{ type: 'inside' }],
        series: [
          { name: 'Backtest', type: 'line', data: r.equity_curve.map(p => p.portfolio), showSymbol: false, lineStyle: { color: volt, width: 2 }, areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: isDark ? 'rgba(208,243,100,0.2)' : 'rgba(90,107,16,0.1)' }, { offset: 1, color: 'transparent' }] } as any } },
          { name: 'IBOV', type: 'line', data: r.equity_curve.map(p => p.ibov ?? null), showSymbol: false, lineStyle: { color: isDark ? '#606878' : '#9A9EA8', type: 'dashed', width: 1.5 } },
          { name: 'CDI', type: 'line', data: r.equity_curve.map(p => p.cdi ?? null), showSymbol: false, lineStyle: { color: isDark ? '#383E4A' : '#9A9EA8', width: 1 } },
        ],
      });
    }

    if (r.drawdowns?.length) {
      this.ddChartOpts.set({
        grid: { top: 5, right: 16, bottom: 20, left: 50 },
        tooltip: { trigger: 'axis' },
        xAxis: { type: 'category', data: r.drawdowns.map(d => d.date), show: false },
        yAxis: { type: 'value', axisLabel: { formatter: '{value}%' } },
        series: [{ type: 'line', data: r.drawdowns.map(d => d.drawdown), showSymbol: false, lineStyle: { color: isDark ? '#EF4444' : '#CC2828', width: 1 }, areaStyle: { color: isDark ? 'rgba(239,68,68,0.2)' : 'rgba(204,40,40,0.15)' } }],
      });
    }
  }
}
