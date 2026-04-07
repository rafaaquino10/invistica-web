import { Component, ChangeDetectionStrategy, inject, signal, computed, OnInit, effect } from '@angular/core';
import { NgxEchartsDirective, provideEchartsCore } from 'ngx-echarts';
import * as echarts from 'echarts/core';
import { TreemapChart } from 'echarts/charts';
import { TooltipComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import type { EChartsOption } from 'echarts';
import { forkJoin } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { ThemeService } from '../../core/services/theme.service';
import { MapControlsComponent, MapOptions } from './components/map-controls.component';
import { AssetPreviewPanelComponent, PreviewData } from './components/asset-preview-panel.component';

echarts.use([TreemapChart, TooltipComponent, CanvasRenderer]);

const CLUSTER_MAP: Record<number, string> = {
  1: 'Financeiro', 2: 'Commodities', 3: 'Consumo', 4: 'Utilities',
  5: 'Saúde', 6: 'TMT', 7: 'Bens Capital', 8: 'Real Estate', 9: 'Educação',
};

interface ScreenerAsset {
  ticker: string; company_name: string; cluster_id: number;
  iq_score: number; rating_label: string;
  fair_value_final: number | null; safety_margin: number | null;
  dividend_yield_proj: number | null;
  score_quanti: number | null; score_quali: number | null; score_valuation: number | null;
}

interface TickerQuote { ticker: string; quote?: { close: number; open: number; volume: number }; market_cap?: number; }

@Component({
  selector: 'iq-market-map',
  standalone: true,
  imports: [NgxEchartsDirective, MapControlsComponent, AssetPreviewPanelComponent],
  providers: [provideEchartsCore({ echarts })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="map-page">
      <iq-map-controls [hasPortfolio]="portfolioTickers().size > 0" (optionsChanged)="onOptionsChange($event)" />

      <div class="treemap-container" echarts [options]="chartOptions()" [theme]="echartsTheme()" [autoResize]="true"
           (chartClick)="onChartClick($event)"></div>

      <div class="summary-bar">
        <span class="label">{{ assets().length }} ativos</span>
        @if (topGainer()) { <span class="label">Maior alta: <span class="mono pos">{{ topGainer() }}</span></span> }
        @if (topLoser()) { <span class="label">Maior queda: <span class="mono neg">{{ topLoser() }}</span></span> }
      </div>

      @if (preview()) {
        <iq-asset-preview-panel [data]="preview()" (closed)="preview.set(null)" />
      }
    </div>
  `,
  styles: [`
    .map-page { display: flex; flex-direction: column; gap: 8px; }
    .treemap-container { width: 100%; height: 70vh; min-height: 500px; }
    .summary-bar { display: flex; gap: 16px; padding: 6px 0; color: var(--t3); }
  `]
})
export class MarketMapComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly theme = inject(ThemeService);

  readonly assets = signal<(ScreenerAsset & { close: number; change_pct: number; market_cap: number })[]>([]);
  readonly portfolioTickers = signal(new Set<string>());
  readonly options = signal<MapOptions>({ sizeMode: 'market_cap', colorMode: 'change', groupBy: 'sector', highlightPortfolio: true });
  readonly preview = signal<PreviewData | null>(null);
  readonly chartOptions = signal<EChartsOption>({});
  readonly echartsTheme = signal('dark-volt');

  readonly topGainer = computed(() => {
    const sorted = [...this.assets()].sort((a, b) => b.change_pct - a.change_pct);
    return sorted[0] ? `${sorted[0].ticker} +${sorted[0].change_pct.toFixed(1)}%` : '';
  });
  readonly topLoser = computed(() => {
    const sorted = [...this.assets()].sort((a, b) => a.change_pct - b.change_pct);
    return sorted[0] ? `${sorted[0].ticker} ${sorted[0].change_pct.toFixed(1)}%` : '';
  });

  constructor() {
    effect(() => { this.echartsTheme.set(this.theme.theme() === 'dark' ? 'dark-volt' : 'light-volt'); });
    effect(() => { this.options(); this.assets(); this.buildTreemap(); });
  }

  ngOnInit(): void {
    this.api.get<{ positions: { ticker: string }[] }>('/portfolio').subscribe({
      next: d => this.portfolioTickers.set(new Set((d.positions || []).map(p => p.ticker))),
      error: () => {},
    });
    this.loadData();
  }

  onOptionsChange(opts: MapOptions): void { this.options.set(opts); }

  onChartClick(event: any): void {
    const data = event?.data;
    if (!data?.ticker) return;
    const a = this.assets().find(x => x.ticker === data.ticker);
    if (!a) return;
    this.preview.set({
      ticker: a.ticker, company_name: a.company_name, close: a.close, change_pct: a.change_pct,
      iq_score: a.iq_score, rating_label: a.rating_label,
      score_quanti: a.score_quanti, score_quali: a.score_quali, score_valuation: a.score_valuation,
      safety_margin: a.safety_margin, dividend_yield_proj: a.dividend_yield_proj,
      market_cap: a.market_cap, inPortfolio: this.portfolioTickers().has(a.ticker),
    });
  }

  private loadData(): void {
    forkJoin({
      screener: this.api.get<{ results: ScreenerAsset[] }>('/scores/screener'),
      tickers: this.api.get<{ tickers: TickerQuote[] }>('/tickers', { limit: 300 }),
    }).subscribe({
      next: ({ screener, tickers }) => {
        const quoteMap = new Map<string, TickerQuote>();
        for (const t of (tickers.tickers || [])) quoteMap.set(t.ticker, t);

        const enriched = (screener.results || []).map(a => {
          const tq = quoteMap.get(a.ticker);
          const close = tq?.quote?.close || 0;
          const open = tq?.quote?.open || close;
          return {
            ...a, close,
            change_pct: open > 0 ? ((close - open) / open) * 100 : 0,
            market_cap: tq?.market_cap || close * 1e6,
          };
        }).filter(a => a.close > 0);

        this.assets.set(enriched);
      },
      error: () => {},
    });
  }

  private buildTreemap(): void {
    const all = this.assets();
    if (!all.length) return;
    const opts = this.options();
    const isDark = this.theme.theme() === 'dark';

    const groups = new Map<string, typeof all>();
    for (const a of all) {
      const key = opts.groupBy === 'cluster' ? `Cluster ${a.cluster_id}` : (CLUSTER_MAP[a.cluster_id] || 'Outros');
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(a);
    }

    const data = [...groups.entries()].map(([name, items]) => ({
      name,
      children: items.map(a => ({
        name: a.ticker, value: opts.sizeMode === 'equal' ? 1 : (a.market_cap || 1),
        ticker: a.ticker,
        itemStyle: { color: this.getColor(a, opts.colorMode, isDark), borderColor: this.portfolioTickers().has(a.ticker) && opts.highlightPortfolio ? '#fff' : 'transparent', borderWidth: this.portfolioTickers().has(a.ticker) && opts.highlightPortfolio ? 2 : 0 },
        label: { show: true, formatter: `${a.ticker}\n${a.change_pct >= 0 ? '+' : ''}${a.change_pct.toFixed(1)}%`, fontSize: 10, fontFamily: "'IBM Plex Mono', monospace", color: isDark ? '#F8FAFC' : '#0A0C10' },
      })),
    }));

    this.chartOptions.set({
      tooltip: {
        formatter: (p: any) => {
          const d = p.data;
          if (!d?.ticker) return p.name;
          const a = all.find(x => x.ticker === d.ticker);
          if (!a) return d.ticker;
          return `<b style="font-family:'IBM Plex Mono'">${a.ticker}</b> ${a.company_name}<br/>` +
            `R$ <b style="font-family:'IBM Plex Mono'">${a.close.toFixed(2)}</b> ` +
            `<span style="color:${a.change_pct >= 0 ? (isDark ? '#34D399' : '#16804A') : (isDark ? '#EF4444' : '#CC2828')}">${a.change_pct >= 0 ? '+' : ''}${a.change_pct.toFixed(2)}%</span><br/>` +
            `Score: <b style="font-family:'IBM Plex Mono'">${a.iq_score}</b> ${a.rating_label}`;
        },
      },
      series: [{ type: 'treemap', data, roam: false, width: '100%', height: '100%', breadcrumb: { show: false }, levels: [{ itemStyle: { borderColor: isDark ? '#242630' : '#EEEFE8', borderWidth: 2 } }, { itemStyle: { borderColor: isDark ? '#12141C' : '#F4F5F0', borderWidth: 1 } }] }],
    });
  }

  private getColor(a: any, mode: string, isDark: boolean): string {
    if (mode === 'score') {
      if (a.iq_score >= 82) return isDark ? '#d0f364' : '#5A6B10';
      if (a.iq_score >= 70) return isDark ? '#34D399' : '#16804A';
      if (a.iq_score >= 45) return isDark ? '#F59E0B' : '#B07A08';
      return isDark ? '#EF4444' : '#CC2828';
    }
    if (mode === 'dy') {
      const dy = (a.dividend_yield_proj || 0) * 100;
      if (dy >= 6) return isDark ? '#d0f364' : '#5A6B10';
      if (dy >= 4) return isDark ? '#34D399' : '#16804A';
      if (dy >= 2) return isDark ? 'rgba(52,211,153,0.5)' : 'rgba(22,128,74,0.5)';
      return isDark ? '#383E4A' : '#9A9EA8';
    }
    // change mode
    const c = a.change_pct;
    if (c >= 3) return isDark ? '#059669' : '#16804A';
    if (c >= 1) return isDark ? 'rgba(52,211,153,0.6)' : 'rgba(22,128,74,0.6)';
    if (c >= 0) return isDark ? 'rgba(52,211,153,0.25)' : 'rgba(22,128,74,0.25)';
    if (c >= -1) return isDark ? 'rgba(239,68,68,0.25)' : 'rgba(204,40,40,0.25)';
    if (c >= -3) return isDark ? 'rgba(239,68,68,0.6)' : 'rgba(204,40,40,0.6)';
    return isDark ? '#DC2626' : '#CC2828';
  }
}
