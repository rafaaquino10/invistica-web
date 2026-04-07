import { Component, ChangeDetectionStrategy, inject, input, signal, OnInit, effect } from '@angular/core';
import { Router } from '@angular/router';
import { DecimalPipe, DatePipe } from '@angular/common';
import { NgxEchartsDirective, provideEchartsCore } from 'ngx-echarts';
import * as echarts from 'echarts/core';
import { LineChart } from 'echarts/charts';
import { GridComponent, TooltipComponent, DataZoomComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import type { EChartsOption } from 'echarts';
import { ApiService } from '../../../core/services/api.service';
import { ThemeService } from '../../../core/services/theme.service';

echarts.use([LineChart, GridComponent, TooltipComponent, DataZoomComponent, CanvasRenderer]);

interface ThesisData {
  thesis_text: string;
  bull_case: string[];
  bear_case: string[];
  main_risks: string[];
}
interface DossierData { dimensoes: { nome: string; texto: string }[]; veredito_geral: string; }
interface Peer { ticker: string; company_name: string; }
interface Holder { fund_name: string; quantity: number; }
interface ScoreHistory { reference_date: string; iq_score: number; }
interface PricePoint { date: string; close: number; }

@Component({
  selector: 'iq-side-panel',
  standalone: true,
  imports: [DecimalPipe, NgxEchartsDirective],
  providers: [provideEchartsCore({ echarts })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="side">
      <!-- THESIS -->
      <div class="panel card">
        <span class="overline">TESE DE INVESTIMENTO</span>
        @if (thesis(); as t) {
          <p class="thesis-text">{{ t.thesis_text }}</p>
          @if (t.bull_case.length) {
            <div class="case-section">
              <span class="case-label label pos">Bull Case</span>
              @for (p of t.bull_case; track $index) {
                <span class="case-item"><i class="ph ph-caret-up pos"></i> {{ p }}</span>
              }
            </div>
          }
          @if (t.bear_case.length) {
            <div class="case-section">
              <span class="case-label label neg">Bear Case</span>
              @for (p of t.bear_case; track $index) {
                <span class="case-item"><i class="ph ph-caret-down neg"></i> {{ p }}</span>
              }
            </div>
          }
          @if (t.main_risks.length) {
            <div class="case-section">
              <span class="case-label label warn">Riscos</span>
              @for (r of t.main_risks; track $index) {
                <span class="case-item"><i class="ph ph-warning warn"></i> {{ r }}</span>
              }
            </div>
          }
        } @else {
          <span class="empty-text label">Indisponível</span>
        }
      </div>

      <!-- PEERS -->
      <div class="panel card">
        <span class="overline">PEERS</span>
        @if (peers().length > 0) {
          @for (p of peers().slice(0, 8); track p.ticker) {
            <button class="peer-row" (click)="goToPeer(p.ticker)">
              <span class="ticker mono">{{ p.ticker }}</span>
              <span class="peer-name label">{{ p.company_name }}</span>
            </button>
          }
        } @else {
          <span class="empty-text label">Sem peers</span>
        }
      </div>

      <!-- INSTITUTIONAL -->
      <div class="panel card">
        <span class="overline">INSTITUCIONAL</span>
        @if (holders().length > 0) {
          @for (h of holders().slice(0, 6); track h.fund_name) {
            <div class="holder-row">
              <span class="holder-name label">{{ h.fund_name }}</span>
              <span class="holder-qty mono">{{ h.quantity | number:'1.0-0' }}</span>
            </div>
          }
        } @else {
          <span class="empty-text label">Sem dados</span>
        }
      </div>

      <!-- SCORE HISTORY -->
      <div class="panel card">
        <span class="overline">HISTÓRICO SCORE</span>
        @if (scoreChartOpts(); as opts) {
          <div class="mini-chart" echarts [options]="opts" [theme]="echartsTheme()" [autoResize]="true"></div>
        }
      </div>

      <!-- PRICE CHART -->
      <div class="panel card">
        <div class="chart-header">
          <span class="overline">PREÇO</span>
          <div class="period-btns">
            @for (p of pricePeriods; track p.days) {
              <button class="period-btn cta" [class.active]="activePricePeriod() === p.days" (click)="loadPrice(p.days)">{{ p.label }}</button>
            }
          </div>
        </div>
        @if (priceChartOpts(); as opts) {
          <div class="mini-chart" echarts [options]="opts" [theme]="echartsTheme()" [autoResize]="true"></div>
        }
      </div>
    </div>
  `,
  styles: [`
    .side { display: flex; flex-direction: column; gap: 12px; }
    .panel { padding: 14px; display: flex; flex-direction: column; gap: 8px; }
    .thesis-text { font-size: 12px; color: var(--t2); line-height: 1.6; }
    .case-section { display: flex; flex-direction: column; gap: 2px; }
    .case-label { font-size: 10px; font-weight: 700; text-transform: uppercase; }
    .case-item { font-size: 11px; color: var(--t2); display: flex; align-items: center; gap: 4px; }
    .case-item i { font-size: 10px; }
    .peer-row {
      display: flex; align-items: center; gap: 8px; padding: 5px 0;
      border-bottom: 1px solid var(--border); cursor: pointer; width: 100%;
      transition: color var(--transition-fast);
    }
    .peer-row:last-child { border-bottom: none; }
    .peer-row:hover { color: var(--volt); }
    .peer-row .ticker { font-size: 12px; font-weight: 700; min-width: 55px; }
    .peer-name { font-size: 10px; color: var(--t3); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .holder-row { display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px solid var(--border); }
    .holder-row:last-child { border-bottom: none; }
    .holder-name { font-size: 11px; color: var(--t2); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1; }
    .holder-qty { font-size: 11px; color: var(--t3); flex-shrink: 0; }
    .mini-chart { width: 100%; height: 140px; }
    .chart-header { display: flex; align-items: center; justify-content: space-between; }
    .period-btns { display: flex; gap: 2px; }
    .period-btn { padding: 2px 6px; font-size: 9px; border-radius: var(--radius); color: var(--t3); }
    .period-btn:hover { color: var(--t1); background: var(--elevated); }
    .period-btn.active { color: var(--volt); background: var(--volt-dim); }
    .empty-text { color: var(--t4); font-size: 12px; }
  `]
})
export class SidePanelComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly theme = inject(ThemeService);
  private readonly router = inject(Router);

  ticker = input.required<string>();
  readonly thesis = signal<ThesisData | null>(null);
  readonly peers = signal<Peer[]>([]);
  readonly holders = signal<Holder[]>([]);
  readonly scoreChartOpts = signal<EChartsOption | null>(null);
  readonly priceChartOpts = signal<EChartsOption | null>(null);
  readonly activePricePeriod = signal(90);
  readonly echartsTheme = signal('dark-volt');

  readonly pricePeriods = [
    { label: '30d', days: 30 },
    { label: '90d', days: 90 },
    { label: '1Y', days: 365 },
    { label: '2Y', days: 730 },
  ];

  constructor() {
    effect(() => { this.echartsTheme.set(this.theme.theme() === 'dark' ? 'dark-volt' : 'light-volt'); });
  }

  ngOnInit(): void {
    const t = this.ticker();
    this.api.get<ThesisData>(`/scores/${t}/thesis`).subscribe({ next: d => this.thesis.set(d), error: () => {} });
    this.api.get<{ peers: Peer[] }>(`/tickers/${t}/peers`).subscribe({ next: d => this.peers.set(d.peers || []), error: () => {} });
    this.api.get<{ holders: Holder[] }>(`/tickers/${t}/institutional-holders`).subscribe({ next: d => this.holders.set(d.holders || []), error: () => {} });
    this.loadScoreHistory();
    this.loadPrice(90);
  }

  goToPeer(ticker: string): void { this.router.navigate(['/ativo', ticker]); }

  loadPrice(days: number): void {
    this.activePricePeriod.set(days);
    this.api.get<{ data: PricePoint[] }>(`/tickers/${this.ticker()}/history`, { days }).subscribe({
      next: d => {
        const pts = d.data || [];
        const isDark = this.theme.theme() === 'dark';
        const voltColor = isDark ? '#d0f364' : '#5A6B10';
        this.priceChartOpts.set({
          grid: { top: 8, right: 8, bottom: 20, left: 40 },
          tooltip: { trigger: 'axis' },
          xAxis: { type: 'category', data: pts.map(p => p.date), show: false },
          yAxis: { type: 'value', scale: true, splitNumber: 3 },
          dataZoom: [{ type: 'inside' }],
          series: [{
            type: 'line', data: pts.map(p => p.close), showSymbol: false,
            lineStyle: { color: voltColor, width: 1.5 },
            areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: isDark ? 'rgba(208,243,100,0.15)' : 'rgba(90,107,16,0.1)' }, { offset: 1, color: 'transparent' }] } as any },
          }],
        });
      },
      error: () => {},
    });
  }

  private loadScoreHistory(): void {
    this.api.get<{ history: ScoreHistory[] }>(`/scores/${this.ticker()}/history`, { limit: 30 }).subscribe({
      next: d => {
        const pts = (d.history || []).reverse();
        const isDark = this.theme.theme() === 'dark';
        this.scoreChartOpts.set({
          grid: { top: 8, right: 8, bottom: 20, left: 30 },
          tooltip: { trigger: 'axis' },
          xAxis: { type: 'category', data: pts.map(p => p.reference_date), show: false },
          yAxis: { type: 'value', min: 0, max: 100, splitNumber: 2 },
          series: [{
            type: 'line', data: pts.map(p => p.iq_score), showSymbol: false,
            lineStyle: { color: isDark ? '#d0f364' : '#5A6B10', width: 1.5 },
          }],
        });
      },
      error: () => {},
    });
  }
}
