import {
  Component, ChangeDetectionStrategy, input, ElementRef, viewChild, OnInit,
  OnDestroy, effect, inject, DestroyRef, signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { createChart, IChartApi, ISeriesApi, CandlestickData, HistogramData, LineStyle, ColorType } from 'lightweight-charts';
import { TickerService } from '../../../core/services/ticker.service';

@Component({
  selector: 'iq-price-chart',
  standalone: true,
  template: `
    <div class="price-chart">
      <div class="price-chart__periods">
        @for (p of periods; track p.days) {
          <button class="price-chart__period mono"
                  [class.price-chart__period--active]="days() === p.days"
                  (click)="days.set(p.days)">{{ p.label }}</button>
        }
      </div>
      <div #chartEl class="price-chart__canvas"></div>
    </div>
  `,
  styles: [`
    .price-chart { display: flex; flex-direction: column; gap: 8px; }
    .price-chart__periods { display: flex; gap: 4px; }
    .price-chart__period {
      padding: 2px 8px; font-size: 0.6875rem; border: 1px solid var(--border-default);
      border-radius: var(--radius); background: transparent; color: var(--text-tertiary);
      cursor: pointer; font-weight: 500;
      &:hover { border-color: var(--border-hover); }
    }
    .price-chart__period--active { background: var(--obsidian); color: #fff; border-color: var(--obsidian); }
    .price-chart__canvas { width: 100%; height: 300px; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IqPriceChartComponent implements OnInit, OnDestroy {
  readonly ticker = input.required<string>();
  readonly days = signal(90);
  readonly fairValue = input<number | null>(null);

  readonly chartEl = viewChild.required<ElementRef<HTMLElement>>('chartEl');
  private chart?: IChartApi;
  private candleSeries?: ISeriesApi<'Candlestick'>;
  private volumeSeries?: ISeriesApi<'Histogram'>;

  private readonly tickerService = inject(TickerService);
  private readonly destroyRef = inject(DestroyRef);

  readonly periods = [
    { label: '7D', days: 7 },
    { label: '1M', days: 30 },
    { label: '3M', days: 90 },
    { label: '6M', days: 180 },
    { label: '1A', days: 365 },
    { label: '2A', days: 730 },
  ];

  constructor() {
    effect(() => {
      const t = this.ticker();
      const d = this.days();
      if (t && d) this.loadData(t, d);
    });
  }

  ngOnInit(): void {
    const el = this.chartEl().nativeElement;
    this.chart = createChart(el, {
      width: el.clientWidth,
      height: 300,
      layout: { background: { type: ColorType.Solid, color: 'transparent' }, textColor: '#6B6960', fontFamily: "'IBM Plex Mono', monospace", fontSize: 10 },
      grid: { vertLines: { color: '#E8E6E1' }, horzLines: { color: '#E8E6E1' } },
      crosshair: { mode: 0 },
      rightPriceScale: { borderColor: '#E0DDD6' },
      timeScale: { borderColor: '#E0DDD6' },
    });

    this.candleSeries = this.chart.addCandlestickSeries({
      upColor: '#1A7A45', downColor: '#C23028',
      borderUpColor: '#1A7A45', borderDownColor: '#C23028',
      wickUpColor: '#1A7A45', wickDownColor: '#C23028',
    });

    this.volumeSeries = this.chart.addHistogramSeries({
      priceFormat: { type: 'volume' },
      priceScaleId: 'volume',
    });

    this.chart.priceScale('volume').applyOptions({
      scaleMargins: { top: 0.85, bottom: 0 },
    });

    new ResizeObserver(() => {
      if (this.chart) this.chart.applyOptions({ width: el.clientWidth });
    }).observe(el);
  }

  private loadData(ticker: string, days: number): void {
    this.tickerService.getHistory(ticker, days)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(res => {
        const candles: CandlestickData[] = res.data.map(d => ({
          time: d.date as any,
          open: d.open,
          high: d.high,
          low: d.low,
          close: d.close,
        }));
        const volumes: HistogramData[] = res.data.map(d => ({
          time: d.date as any,
          value: d.volume,
          color: d.close >= d.open ? 'rgba(26,122,69,0.3)' : 'rgba(194,48,40,0.3)',
        }));

        this.candleSeries?.setData(candles);
        this.volumeSeries?.setData(volumes);

        const fv = this.fairValue();
        if (fv != null) {
          const priceLine = { price: fv, color: '#3D3D3A', lineWidth: 1 as const, lineStyle: LineStyle.Dashed, axisLabelVisible: true, title: 'Justo' };
          this.candleSeries?.createPriceLine(priceLine);
        }

        this.chart?.timeScale().fitContent();
      });
  }

  ngOnDestroy(): void {
    this.chart?.remove();
  }
}
