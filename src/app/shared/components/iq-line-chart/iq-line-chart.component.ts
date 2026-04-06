import { Component, ChangeDetectionStrategy, input, computed, signal, ElementRef, viewChild } from '@angular/core';

export interface LineSeries {
  name: string;
  data: number[];
  color: string;
  dashed?: boolean;
  areaFill?: boolean;
  strokeWidth?: number;
}

const W = 700;
const H = 300;
const PAD = { top: 20, right: 24, bottom: 44, left: 60 };

@Component({
  selector: 'iq-line-chart',
  standalone: true,
  template: `
    <div class="lc-wrap" #chartWrap>
      <svg [attr.viewBox]="'0 0 ' + W + ' ' + H" class="lc" preserveAspectRatio="xMidYMid meet"
           (mousemove)="onMouseMove($event)" (mouseleave)="onMouseLeave()">
        <!-- Y Grid + Labels -->
        @for (tick of yTicks(); track tick.value) {
          <line [attr.x1]="PAD.left" [attr.x2]="PAD.left + plotW"
                [attr.y1]="tick.y" [attr.y2]="tick.y" class="lc__grid" />
          <text [attr.x]="PAD.left - 8" [attr.y]="tick.y"
                class="lc__y-label" text-anchor="end" dominant-baseline="middle">{{ tick.label }}</text>
        }

        <!-- X Grid + Labels -->
        @for (tick of xTicks(); track tick.idx) {
          <line [attr.x1]="tick.x" [attr.x2]="tick.x"
                [attr.y1]="PAD.top" [attr.y2]="PAD.top + plotH" class="lc__grid lc__grid--v" />
          <text [attr.x]="tick.x" [attr.y]="PAD.top + plotH + 16"
                class="lc__x-label" text-anchor="middle">{{ tick.label }}</text>
        }

        <!-- Baseline at 100 -->
        @if (showBaseline()) {
          <line [attr.x1]="PAD.left" [attr.x2]="PAD.left + plotW"
                [attr.y1]="baselineY()" [attr.y2]="baselineY()" class="lc__baseline" />
        }

        <!-- Area fills -->
        @for (s of seriesData(); track s.name) {
          @if (s.areaPoints) {
            <polygon [attr.points]="s.areaPoints" [attr.fill]="s.color" opacity="0.08" />
          }
        }

        <!-- Lines -->
        @for (s of seriesData(); track s.name) {
          <polyline [attr.points]="s.points" fill="none"
                    [attr.stroke]="s.color" [attr.stroke-width]="s.strokeWidth"
                    [attr.stroke-dasharray]="s.dashed ? '6,4' : 'none'"
                    stroke-linecap="round" stroke-linejoin="round" />
          @if (s.lastX != null) {
            <circle [attr.cx]="s.lastX" [attr.cy]="s.lastY" [attr.r]="3" [attr.fill]="s.color" />
          }
        }

        <!-- Axes -->
        <line [attr.x1]="PAD.left" [attr.x2]="PAD.left + plotW"
              [attr.y1]="PAD.top + plotH" [attr.y2]="PAD.top + plotH" class="lc__axis" />
        <line [attr.x1]="PAD.left" [attr.x2]="PAD.left"
              [attr.y1]="PAD.top" [attr.y2]="PAD.top + plotH" class="lc__axis" />

        <!-- HOVER: crosshair line + dots -->
        @if (hoverIdx() >= 0) {
          <line [attr.x1]="hoverX()" [attr.x2]="hoverX()"
                [attr.y1]="PAD.top" [attr.y2]="PAD.top + plotH"
                class="lc__crosshair" />
          @for (s of hoverDots(); track s.name) {
            <circle [attr.cx]="hoverX()" [attr.cy]="s.y" [attr.r]="4"
                    [attr.fill]="s.color" stroke="var(--bg, #fff)" stroke-width="2" />
          }
        }

        <!-- Legend -->
        @for (s of seriesData(); track s.name; let i = $index) {
          <line [attr.x1]="PAD.left + i * 110" [attr.y1]="H - 8"
                [attr.x2]="PAD.left + i * 110 + 18" [attr.y2]="H - 8"
                [attr.stroke]="s.color" stroke-width="2.5"
                [attr.stroke-dasharray]="s.dashed ? '4,3' : 'none'" />
          <text [attr.x]="PAD.left + i * 110 + 24" [attr.y]="H - 4"
                class="lc__legend-text">{{ s.name }}</text>
        }
      </svg>

      <!-- TOOLTIP (HTML overlay) -->
      @if (hoverIdx() >= 0) {
        <div class="lc__tooltip" [style.left.px]="tooltipLeft()" [style.top.px]="8">
          <span class="lc__tooltip-label">{{ hoverLabel() }}</span>
          @for (s of hoverDots(); track s.name) {
            <div class="lc__tooltip-row">
              <span class="lc__tooltip-dot" [style.background]="s.color"></span>
              <span class="lc__tooltip-name">{{ s.name }}</span>
              <span class="lc__tooltip-val mono">{{ s.val.toFixed(2) }}</span>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    :host { display: block; width: 100%; }
    .lc-wrap { position: relative; width: 100%; height: 0; padding-bottom: 38%; overflow: hidden; }
    .lc { position: absolute; top: 0; left: 0; width: 100%; height: 100%; }
    .lc__grid { stroke: var(--border, #E0E0E0); stroke-width: 0.5; opacity: 0.6; }
    .lc__grid--v { opacity: 0.3; }
    .lc__axis { stroke: var(--border-strong, var(--border, #CCC)); stroke-width: 1; }
    .lc__baseline { stroke: var(--text-muted, #BBB); stroke-width: 0.8; stroke-dasharray: 4,3; }
    .lc__y-label { font-size: 10px; fill: var(--text-tertiary, #888); font-family: 'JetBrains Mono', 'IBM Plex Mono', monospace; }
    .lc__x-label { font-size: 10px; fill: var(--text-tertiary, #888); font-family: 'JetBrains Mono', 'IBM Plex Mono', monospace; }
    .lc__legend-text { font-size: 11px; fill: var(--text-secondary, #666); }
    .lc__crosshair { stroke: var(--text-tertiary, #888); stroke-width: 1; stroke-dasharray: 3,2; opacity: 0.7; }

    .lc__tooltip {
      position: absolute; pointer-events: none; z-index: 10;
      background: var(--surface, #fff); border: 1px solid var(--border, #ddd);
      border-radius: 4px; padding: 8px 10px; min-width: 140px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.12);
    }
    .lc__tooltip-label { font-size: 10px; font-weight: 600; color: var(--text-tertiary, #888); display: block; margin-bottom: 4px; }
    .lc__tooltip-row { display: flex; align-items: center; gap: 6px; font-size: 12px; padding: 2px 0; }
    .lc__tooltip-dot { width: 8px; height: 8px; border-radius: 2px; flex-shrink: 0; }
    .lc__tooltip-name { color: var(--text-secondary, #666); flex: 1; }
    .lc__tooltip-val { font-weight: 700; color: var(--text-primary, #111); }
    .mono { font-family: 'JetBrains Mono', 'IBM Plex Mono', monospace; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IqLineChartComponent {
  readonly series = input<LineSeries[]>([]);
  readonly labels = input<string[]>([]);
  readonly chartWrap = viewChild<ElementRef>('chartWrap');

  readonly W = W;
  readonly H = H;
  readonly PAD = PAD;
  readonly plotW = W - PAD.left - PAD.right;
  readonly plotH = H - PAD.top - PAD.bottom;

  // Hover state
  readonly hoverIdx = signal(-1);

  private readonly allValues = computed(() => this.series().flatMap(s => s.data));
  private readonly minVal = computed(() => {
    const v = this.allValues();
    if (!v.length) return 0;
    const min = Math.min(...v);
    const max = Math.max(...v);
    const range = max - min || 1;
    return min - range * 0.05;
  });
  private readonly maxVal = computed(() => {
    const v = this.allValues();
    if (!v.length) return 1;
    const min = Math.min(...v);
    const max = Math.max(...v);
    const range = max - min || 1;
    return max + range * 0.05;
  });

  readonly showBaseline = computed(() => {
    return this.minVal() <= 100 && this.maxVal() >= 100;
  });

  readonly baselineY = computed(() => {
    const min = this.minVal();
    const range = this.maxVal() - min || 1;
    return PAD.top + this.plotH - ((100 - min) / range) * this.plotH;
  });

  readonly seriesData = computed(() => {
    const plotW = this.plotW;
    const plotH = this.plotH;
    const min = this.minVal();
    const range = this.maxVal() - min || 1;

    return this.series().map(s => {
      const stepX = s.data.length > 1 ? plotW / (s.data.length - 1) : 0;
      const coords = s.data.map((v, i) => ({
        x: PAD.left + i * stepX,
        y: PAD.top + plotH - ((v - min) / range) * plotH,
      }));
      const points = coords.map(c => `${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' ');
      const baseline = PAD.top + plotH;
      const areaPoints = s.areaFill && coords.length > 1
        ? `${coords[0].x.toFixed(1)},${baseline} ${points} ${coords[coords.length - 1].x.toFixed(1)},${baseline}`
        : null;
      const last = coords[coords.length - 1];
      return {
        name: s.name, points, color: s.color, coords,
        dashed: s.dashed ?? false,
        strokeWidth: s.strokeWidth ?? 2,
        areaPoints,
        lastX: last?.x ?? null, lastY: last?.y ?? null,
      };
    });
  });

  readonly hoverX = computed(() => {
    const idx = this.hoverIdx();
    const first = this.seriesData()[0];
    if (idx < 0 || !first?.coords?.[idx]) return 0;
    return first.coords[idx].x;
  });

  readonly hoverLabel = computed(() => {
    const idx = this.hoverIdx();
    const lbls = this.labels();
    return idx >= 0 && lbls[idx] ? lbls[idx] : '';
  });

  readonly hoverDots = computed(() => {
    const idx = this.hoverIdx();
    if (idx < 0) return [];
    return this.seriesData().map(s => ({
      name: s.name,
      color: s.color,
      y: s.coords[idx]?.y ?? 0,
      val: this.series().find(ss => ss.name === s.name)?.data[idx] ?? 0,
    }));
  });

  readonly tooltipLeft = computed(() => {
    const x = this.hoverX();
    const wrapEl = this.chartWrap()?.nativeElement;
    if (!wrapEl) return 0;
    const wrapW = wrapEl.clientWidth;
    const svgRatio = wrapW / W;
    const pxX = x * svgRatio;
    // Flip tooltip if near right edge
    return pxX > wrapW * 0.7 ? pxX - 160 : pxX + 10;
  });

  readonly yTicks = computed(() => {
    const min = this.minVal();
    const max = this.maxVal();
    const plotH = this.plotH;
    const range = max - min || 1;
    const tickCount = 6;
    return Array.from({ length: tickCount }, (_, i) => {
      const t = i / (tickCount - 1);
      return {
        value: min + range * t,
        y: PAD.top + plotH - plotH * t,
        label: this.fmtNum(min + range * t),
      };
    });
  });

  readonly xTicks = computed(() => {
    const lbls = this.labels();
    const firstSeries = this.series()[0];
    const dataLen = firstSeries?.data?.length ?? 0;
    if (dataLen < 2) return [];

    const plotW = this.plotW;
    const stepX = plotW / (dataLen - 1);
    const maxTicks = Math.min(8, dataLen);
    const interval = Math.max(1, Math.floor(dataLen / maxTicks));

    const ticks: { idx: number; x: number; label: string }[] = [];
    for (let i = 0; i < dataLen; i += interval) {
      ticks.push({ idx: i, x: PAD.left + i * stepX, label: lbls[i] ?? `${i + 1}` });
    }
    const lastIdx = dataLen - 1;
    if (ticks[ticks.length - 1]?.idx !== lastIdx) {
      ticks.push({ idx: lastIdx, x: PAD.left + lastIdx * stepX, label: lbls[lastIdx] ?? `${lastIdx + 1}` });
    }
    return ticks;
  });

  onMouseMove(event: MouseEvent): void {
    const svg = (event.currentTarget as SVGSVGElement);
    const rect = svg.getBoundingClientRect();
    const mouseX = ((event.clientX - rect.left) / rect.width) * W;
    const dataLen = this.series()[0]?.data?.length ?? 0;
    if (dataLen < 2) return;

    const stepX = this.plotW / (dataLen - 1);
    const relX = mouseX - PAD.left;
    const idx = Math.round(relX / stepX);
    if (idx >= 0 && idx < dataLen) {
      this.hoverIdx.set(idx);
    }
  }

  onMouseLeave(): void {
    this.hoverIdx.set(-1);
  }

  private fmtNum(n: number): string {
    if (Math.abs(n) >= 1e6) return (n / 1e6).toFixed(1) + 'M';
    if (Math.abs(n) >= 1e3) return (n / 1e3).toFixed(1) + 'K';
    if (Math.abs(n) >= 100) return n.toFixed(1);
    return n.toFixed(2);
  }
}
