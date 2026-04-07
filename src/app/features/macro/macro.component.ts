import { Component, ChangeDetectionStrategy, inject, signal, OnInit, effect } from '@angular/core';
import { DecimalPipe, PercentPipe } from '@angular/common';
import { Router } from '@angular/router';
import { NgxEchartsDirective, provideEchartsCore } from 'ngx-echarts';
import * as echarts from 'echarts/core';
import { LineChart, BarChart } from 'echarts/charts';
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import type { EChartsOption } from 'echarts';
import { ApiService } from '../../core/services/api.service';
import { ThemeService } from '../../core/services/theme.service';
import { RegimeBadgeComponent } from '../../shared/components/regime-badge/regime-badge.component';
import { AssetCellComponent } from '../../shared/components/asset-cell/asset-cell.component';
import { ScoreBadgeComponent } from '../../shared/components/score-badge/score-badge.component';

echarts.use([LineChart, BarChart, GridComponent, TooltipComponent, LegendComponent, CanvasRenderer]);

interface RegimeData { regime: string; label: string; description: string; kill_switch_active: boolean; macro: { selic: number; ipca: number; cambio_usd: number; brent: number }; sector_rotation: Record<string, { signal: string; tilt_points: number }>; }
interface FocusEntry { indicator: string; current: number | null; proj_2025: number | null; proj_2026: number | null; }
interface RotationMatrix { matrix: Record<string, Record<string, number>>; }
interface Scenario { name: string; description: string; impact_score: number; affected_sectors: string[]; benefited_sectors?: string[]; }
interface ICData { snapshots: { date: string; ic: number; hit_rate: number }[]; metrics: { ic_avg: number | null; hit_rate_avg: number | null }; }
interface Quintile { quintile: string; label: string; avg_iq_score: number; count: number; }
interface ScreenerAsset { ticker: string; company_name: string; iq_score: number; }

@Component({
  selector: 'iq-macro',
  standalone: true,
  imports: [DecimalPipe, PercentPipe, NgxEchartsDirective, RegimeBadgeComponent, AssetCellComponent, ScoreBadgeComponent],
  providers: [provideEchartsCore({ echarts })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="macro-page">
      <h1>Macro</h1>

      <!-- REGIME -->
      @if (regime(); as r) {
        <div class="regime-card glass" [style.border-left-color]="regimeColor()">
          <div class="regime-grid">
            <div class="regime-left">
              <iq-regime-badge [label]="r.label" [regime]="r.regime" />
              <p class="regime-desc">{{ regimeInterpretation() }}</p>
              <span class="kill-badge" [class.active]="r.kill_switch_active">
                {{ r.kill_switch_active ? '🔴 Proteção ativa' : '🟢 Monitoramento normal' }}
              </span>
            </div>
            <div class="kpi-grid">
              <div class="kpi"><span class="kpi-label label">SELIC</span><span class="kpi-val mono">{{ r.macro.selic | number:'1.2-2' }}%</span></div>
              <div class="kpi"><span class="kpi-label label">IPCA</span><span class="kpi-val mono">{{ r.macro.ipca | number:'1.1-1' }}%</span></div>
              <div class="kpi"><span class="kpi-label label">Câmbio</span><span class="kpi-val mono">R$ {{ r.macro.cambio_usd | number:'1.2-2' }}</span></div>
              <div class="kpi"><span class="kpi-label label">Brent</span><span class="kpi-val mono">US$ {{ r.macro.brent | number:'1.0-0' }}</span></div>
            </div>
          </div>
        </div>
      }

      <!-- FOCUS -->
      @if (focus().length > 0) {
        <div class="card section">
          <span class="overline">EXPECTATIVAS FOCUS</span>
          <table>
            <thead><tr><th>Indicador</th><th class="num">Atual</th><th class="num">Proj. 2025</th><th class="num">Proj. 2026</th></tr></thead>
            <tbody>
              @for (f of focus(); track f.indicator) {
                <tr><td class="label">{{ f.indicator }}</td><td class="num mono">{{ f.current ?? '--' }}</td><td class="num mono">{{ f.proj_2025 ?? '--' }}</td><td class="num mono">{{ f.proj_2026 ?? '--' }}</td></tr>
              }
            </tbody>
          </table>
        </div>
      }

      <!-- SECTOR ROTATION -->
      @if (rotationRegimes().length > 0) {
        <div class="card section">
          <span class="overline">ROTAÇÃO SETORIAL</span>
          <div class="rotation-table-wrapper">
            <table>
              <thead><tr><th>Setor</th>@for (r of rotationRegimes(); track r) { <th [class.active-col]="r === regime()?.regime">{{ r }}</th> }</tr></thead>
              <tbody>
                @for (sector of rotationSectors(); track sector) {
                  <tr class="sector-row" (click)="toggleSector(sector)">
                    <td class="label sector-name">{{ sector }} @if (expandedSector() === sector) { <i class="ph ph-caret-up"></i> } @else { <i class="ph ph-caret-down"></i> }</td>
                    @for (r of rotationRegimes(); track r) {
                      <td [class.active-col]="r === regime()?.regime"><span class="tilt" [class]="tiltClass(rotationMatrix()[r]?.[sector])">{{ tiltLabel(rotationMatrix()[r]?.[sector]) }}</span></td>
                    }
                  </tr>
                  @if (expandedSector() === sector && sectorAssets().length > 0) {
                    <tr class="expanded-row"><td [attr.colspan]="rotationRegimes().length + 1">
                      <div class="sector-assets">
                        @for (a of sectorAssets(); track a.ticker) {
                          <div class="sector-asset" (click)="goTo(a.ticker); $event.stopPropagation()">
                            <iq-asset-cell [ticker]="a.ticker" [name]="a.company_name" />
                            <iq-score-badge [score]="a.iq_score" />
                          </div>
                        }
                      </div>
                    </td></tr>
                  }
                }
              </tbody>
            </table>
          </div>
        </div>
      }

      <!-- SENSITIVITY -->
      @if (scenarios().length > 0) {
        <div class="scenarios-grid">
          @for (s of scenarios(); track s.name) {
            <div class="scenario-card glass">
              <span class="scenario-name label">{{ s.name }}</span>
              <span class="scenario-desc">{{ s.description }}</span>
              @if (s.benefited_sectors && s.benefited_sectors.length) {
                <div class="impact-list"><span class="impact-label label pos">Beneficiados:</span> <span class="impact-names">{{ s.benefited_sectors.join(', ') }}</span></div>
              }
              @if (s.affected_sectors.length) {
                <div class="impact-list"><span class="impact-label label neg">Prejudicados:</span> <span class="impact-names">{{ s.affected_sectors.join(', ') }}</span></div>
              }
            </div>
          }
        </div>
      }

      <!-- MODEL CONFIDENCE -->
      <div class="confidence-grid">
        <div class="card section">
          <span class="overline">O MOTOR ESTÁ ACERTANDO?</span>
          @if (icChartOpts()) {
            <div class="chart" echarts [options]="icChartOpts()!" [theme]="echartsTheme()" [autoResize]="true"></div>
          } @else {
            <span class="empty label">Aguardando dados (mínimo 30 dias)</span>
          }
        </div>
        <div class="card section">
          <span class="overline">RETORNO POR FAIXA DE SCORE</span>
          @if (decayChartOpts()) {
            <div class="chart" echarts [options]="decayChartOpts()!" [theme]="echartsTheme()" [autoResize]="true"></div>
          } @else {
            <span class="empty label">Dados insuficientes</span>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .macro-page { display: flex; flex-direction: column; gap: 16px; }
    h1 { font-family: var(--font-ui); font-size: 21px; font-weight: 700; color: var(--t1); }
    .regime-card { padding: 20px; border-left: 4px solid; border-radius: var(--radius); }
    .regime-grid { display: grid; grid-template-columns: 3fr 2fr; gap: 20px; }
    .regime-left { display: flex; flex-direction: column; gap: 8px; }
    .regime-desc { font-size: 14px; color: var(--t2); line-height: 1.6; }
    .kill-badge { font-size: 11px; color: var(--t3); }
    .kill-badge.active { color: var(--neg); }
    .kpi-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .kpi { padding: 10px; background: var(--bg-alt); border-radius: var(--radius); display: flex; flex-direction: column; gap: 2px; }
    .kpi-label { color: var(--t4); font-size: 10px; }
    .kpi-val { font-size: 18px; font-weight: 700; color: var(--t1); }
    .section { padding: 16px; display: flex; flex-direction: column; gap: 10px; }
    table { width: 100%; border-spacing: 0; }
    th { font-family: var(--font-ui); font-size: 9px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: var(--t4); text-align: left; padding: 5px 6px; border-bottom: 1px solid var(--border); }
    td { padding: 5px 6px; font-size: 12px; color: var(--t2); border-bottom: 1px solid var(--border); }
    .num { text-align: right; }
    .active-col { background: var(--volt-dim); }
    .sector-row { cursor: pointer; }
    .sector-row:hover { background: var(--card-hover); }
    .sector-name { display: flex; align-items: center; gap: 4px; }
    .sector-name i { font-size: 10px; color: var(--t4); }
    .tilt { font-size: 11px; font-weight: 700; }
    .tilt-fav { color: var(--pos); }
    .tilt-unfav { color: var(--neg); }
    .tilt-neutral { color: var(--t4); }
    .expanded-row td { padding: 8px; }
    .sector-assets { display: flex; flex-wrap: wrap; gap: 8px; }
    .sector-asset { display: flex; align-items: center; gap: 6px; padding: 6px 10px; background: var(--bg-alt); border-radius: var(--radius); cursor: pointer; }
    .sector-asset:hover { background: var(--elevated); }
    .scenarios-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 10px; }
    .scenario-card { padding: 14px; border-radius: var(--radius); display: flex; flex-direction: column; gap: 4px; }
    .scenario-name { font-size: 13px; font-weight: 700; color: var(--t1); }
    .scenario-desc { font-size: 10px; color: var(--t3); }
    .impact-list { font-size: 10px; display: flex; gap: 4px; flex-wrap: wrap; }
    .impact-label { font-weight: 700; }
    .impact-names { color: var(--t2); }
    .confidence-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .chart { width: 100%; height: 220px; }
    .empty { color: var(--t4); text-align: center; padding: 30px; }
    .rotation-table-wrapper { overflow-x: auto; }
  `]
})
export class MacroComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly theme = inject(ThemeService);
  private readonly router = inject(Router);

  readonly regime = signal<RegimeData | null>(null);
  readonly focus = signal<FocusEntry[]>([]);
  readonly rotationMatrix = signal<Record<string, Record<string, number>>>({});
  readonly rotationRegimes = signal<string[]>([]);
  readonly rotationSectors = signal<string[]>([]);
  readonly scenarios = signal<Scenario[]>([]);
  readonly expandedSector = signal<string | null>(null);
  readonly sectorAssets = signal<ScreenerAsset[]>([]);
  readonly icChartOpts = signal<EChartsOption | null>(null);
  readonly decayChartOpts = signal<EChartsOption | null>(null);
  readonly echartsTheme = signal('dark-volt');

  readonly CLUSTER_NAME_TO_ID: Record<string, number> = { 'Financeiro': 1, 'Commodities': 2, 'Recursos Naturais e Commodities': 2, 'Consumo': 3, 'Consumo e Varejo': 3, 'Utilities': 4, 'Utilities e Concessões': 4, 'Saúde': 5, 'TMT': 6, 'Bens de Capital': 7, 'Bens Capital': 7, 'Real Estate': 8, 'Educação': 9 };

  regimeColor = () => {
    const r = this.regime()?.regime?.toUpperCase() || '';
    if (r.includes('RISK_ON') || r.includes('RECOVERY')) return 'var(--pos)';
    if (r.includes('RISK_OFF')) return 'var(--neg)';
    return 'var(--warn)';
  };

  regimeInterpretation = () => {
    const r = this.regime()?.regime?.toUpperCase() || '';
    if (r.includes('RISK_ON')) return 'Mercado favorece risco. Ações de crescimento e small caps tendem a superar.';
    if (r.includes('RISK_OFF')) return 'Investidores buscam segurança. Setores defensivos e dividendos ganham relevância.';
    if (r.includes('STAGFLATION')) return 'Inflação alta com crescimento baixo. Commodities e empresas com pricing power se destacam.';
    if (r.includes('RECOVERY')) return 'Economia retomando. Cíclicos e construtoras podem surpreender.';
    return this.regime()?.description || '';
  };

  constructor() {
    effect(() => { this.echartsTheme.set(this.theme.theme() === 'dark' ? 'dark-volt' : 'light-volt'); });
  }

  ngOnInit(): void {
    this.api.get<RegimeData>('/analytics/regime').subscribe({ next: d => this.regime.set(d) });
    this.api.get<{ expectations: FocusEntry[] }>('/tickers/macro/focus-expectations').subscribe({ next: d => this.focus.set(d.expectations || []), error: () => {} });
    this.api.get<RotationMatrix>('/analytics/sector-rotation').subscribe({
      next: d => {
        this.rotationMatrix.set(d.matrix || {});
        this.rotationRegimes.set(Object.keys(d.matrix || {}));
        const sectors = new Set<string>();
        for (const r of Object.values(d.matrix || {})) for (const s of Object.keys(r)) sectors.add(s);
        this.rotationSectors.set([...sectors]);
      },
      error: () => {},
    });
    this.api.get<{ scenarios: Scenario[] }>('/analytics/sensitivity').subscribe({ next: d => this.scenarios.set(d.scenarios || []), error: () => {} });
    this.api.get<ICData>('/analytics/ic-timeline', { months: 12 }).subscribe({ next: d => this.buildICChart(d), error: () => {} });
    this.api.get<{ quintiles: Quintile[] }>('/analytics/signal-decay').subscribe({ next: d => this.buildDecayChart(d.quintiles || []), error: () => {} });
  }

  toggleSector(sector: string): void {
    if (this.expandedSector() === sector) { this.expandedSector.set(null); this.sectorAssets.set([]); return; }
    this.expandedSector.set(sector);
    const clusterId = this.CLUSTER_NAME_TO_ID[sector];
    if (clusterId) {
      this.api.get<{ results: ScreenerAsset[] }>('/scores/screener', { cluster: clusterId, limit: 5 }).subscribe({
        next: d => this.sectorAssets.set(d.results || []),
        error: () => this.sectorAssets.set([]),
      });
    }
  }

  tiltClass(val: number | undefined): string { if (val == null) return 'tilt-neutral'; return val >= 2 ? 'tilt-fav' : val <= -2 ? 'tilt-unfav' : 'tilt-neutral'; }
  tiltLabel(val: number | undefined): string { if (val == null) return '—'; return val >= 2 ? '▲ Favorecido' : val <= -2 ? '▼ Desfavorecido' : '— Neutro'; }

  goTo(ticker: string): void { this.router.navigate(['/ativo', ticker]); }

  private buildICChart(data: ICData): void {
    if (!data.snapshots?.length) return;
    const isDark = this.theme.theme() === 'dark';
    this.icChartOpts.set({
      grid: { top: 10, right: 16, bottom: 30, left: 40 },
      tooltip: { trigger: 'axis' },
      xAxis: { type: 'category', data: data.snapshots.map(s => s.date) },
      yAxis: { type: 'value', min: 0, max: 100, axisLabel: { formatter: '{value}%' } },
      series: [{
        type: 'line', data: data.snapshots.map(s => s.hit_rate * 100), showSymbol: false,
        lineStyle: { color: isDark ? '#d0f364' : '#5A6B10', width: 2 },
        areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: isDark ? 'rgba(208,243,100,0.2)' : 'rgba(90,107,16,0.1)' }, { offset: 1, color: 'transparent' }] } as any },
        markLine: { data: [{ yAxis: 50, label: { formatter: '50% (acaso)', fontSize: 10 }, lineStyle: { type: 'dashed', color: isDark ? '#606878' : '#9A9EA8' } }], silent: true },
      }],
    });
  }

  private buildDecayChart(quintiles: Quintile[]): void {
    if (!quintiles.length) return;
    const isDark = this.theme.theme() === 'dark';
    const labels = ['82-100', '70-81', '45-69', '30-44', '0-29'];
    const scores = quintiles.map(q => q.avg_iq_score);
    const colors = [isDark ? '#d0f364' : '#5A6B10', isDark ? '#34D399' : '#16804A', isDark ? '#F59E0B' : '#B07A08', isDark ? '#EF4444' : '#CC2828', isDark ? '#EF4444' : '#CC2828'];

    this.decayChartOpts.set({
      grid: { top: 10, right: 16, bottom: 30, left: 40 },
      tooltip: { trigger: 'axis' },
      xAxis: { type: 'category', data: labels },
      yAxis: { type: 'value' },
      series: [{
        type: 'bar', data: scores.map((v, i) => ({ value: v, itemStyle: { color: colors[i] || colors[0] } })),
        barMaxWidth: 40,
      }],
    });
  }
}
