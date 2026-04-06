import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';

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
    <svg [attr.viewBox]="'0 0 ' + W + ' ' + H" class="lc" preserveAspectRatio="xMidYMid meet">
      <!-- Background -->
      <rect [attr.x]="PAD.left" [attr.y]="PAD.top"
            [attr.width]="plotW" [attr.height]="plotH"
            fill="var(--surface, #fff)" opacity="0.3" />

      <!-- Y Grid + Labels -->
      @for (tick of yTicks(); track tick.value) {
        <line [attr.x1]="PAD.left" [attr.x2]="PAD.left + plotW"
              [attr.y1]="tick.y" [attr.y2]="tick.y"
              class="lc__grid" />
        <text [attr.x]="PAD.left - 8" [attr.y]="tick.y"
              class="lc__y-label" text-anchor="end" dominant-baseline="middle">{{ tick.label }}</text>
      }

      <!-- X Grid + Labels -->
      @for (tick of xTicks(); track tick.idx) {
        <line [attr.x1]="tick.x" [attr.x2]="tick.x"
              [attr.y1]="PAD.top" [attr.y2]="PAD.top + plotH"
              class="lc__grid lc__grid--v" />
        <text [attr.x]="tick.x" [attr.y]="PAD.top + plotH + 16"
              class="lc__x-label" text-anchor="middle">{{ tick.label }}</text>
      }

      <!-- Baseline at 100 (if range includes it) -->
      @if (showBaseline()) {
        <line [attr.x1]="PAD.left" [attr.x2]="PAD.left + plotW"
              [attr.y1]="baselineY()" [attr.y2]="baselineY()"
              class="lc__baseline" />
        <text [attr.x]="PAD.left + plotW + 4" [attr.y]="baselineY()"
              class="lc__baseline-label" dominant-baseline="middle">100</text>
      }

      <!-- Series: area fills first (behind lines) -->
      @for (s of seriesData(); track s.name) {
        @if (s.areaPoints) {
          <polygon [attr.points]="s.areaPoints" [attr.fill]="s.color" opacity="0.08" />
        }
      }

      <!-- Series: lines on top -->
      @for (s of seriesData(); track s.name) {
        <polyline [attr.points]="s.points" fill="none"
                  [attr.stroke]="s.color" [attr.stroke-width]="s.strokeWidth"
                  [attr.stroke-dasharray]="s.dashed ? '6,4' : 'none'"
                  stroke-linecap="round" stroke-linejoin="round" />
        <!-- End dot -->
        @if (s.lastX != null) {
          <circle [attr.cx]="s.lastX" [attr.cy]="s.lastY" [attr.r]="3" [attr.fill]="s.color" />
        }
      }

      <!-- X axis line -->
      <line [attr.x1]="PAD.left" [attr.x2]="PAD.left + plotW"
            [attr.y1]="PAD.top + plotH" [attr.y2]="PAD.top + plotH"
            class="lc__axis" />
      <!-- Y axis line -->
      <line [attr.x1]="PAD.left" [attr.x2]="PAD.left"
            [attr.y1]="PAD.top" [attr.y2]="PAD.top + plotH"
            class="lc__axis" />

      <!-- Legend -->
      <g class="lc__legend">
        @for (s of seriesData(); track s.name; let i = $index) {
          <line [attr.x1]="PAD.left + i * 110" [attr.y1]="H - 8"
                [attr.x2]="PAD.left + i * 110 + 18" [attr.y2]="H - 8"
                [attr.stroke]="s.color" stroke-width="2.5"
                [attr.stroke-dasharray]="s.dashed ? '4,3' : 'none'" />
          <text [attr.x]="PAD.left + i * 110 + 24" [attr.y]="H - 4"
                class="lc__legend-text">{{ s.name }}</text>
        }
      </g>
    </svg>
  `,
  styles: [`
    .lc { width: 100%; display: block; }
    .lc__grid { stroke: var(--border, #E0E0E0); stroke-width: 0.5; opacity: 0.6; }
    .lc__grid--v { opacity: 0.3; }
    .lc__axis { stroke: var(--border-strong, var(--border, #CCC)); stroke-width: 1; }
    .lc__baseline { stroke: var(--text-muted, #BBB); stroke-width: 0.8; stroke-dasharray: 4,3; }
    .lc__baseline-label { font-size: 9px; fill: var(--text-muted, #BBB); font-family: 'JetBrains Mono', 'IBM Plex Mono', monospace; }
    .lc__y-label {
      font-size: 10px; fill: var(--text-tertiary, #888);
      font-family: 'JetBrains Mono', 'IBM Plex Mono', monospace;
    }
    .lc__x-label {
      font-size: 10px; fill: var(--text-tertiary, #888);
      font-family: 'JetBrains Mono', 'IBM Plex Mono', monospace;
    }
    .lc__legend-text {
      font-size: 11px; fill: var(--text-secondary, #666);
      font-family: 'Inter', 'Satoshi', sans-serif;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IqLineChartComponent {
  readonly series = input<LineSeries[]>([]);
  readonly labels = input<string[]>([]); // X-axis labels (optional)

  readonly W = W;
  readonly H = H;
  readonly PAD = PAD;
  readonly plotW = W - PAD.left - PAD.right;
  readonly plotH = H - PAD.top - PAD.bottom;

  private readonly allValues = computed(() => this.series().flatMap(s => s.data));
  private readonly minVal = computed(() => {
    const v = this.allValues();
    if (!v.length) return 0;
    const min = Math.min(...v);
    const max = Math.max(...v);
    const range = max - min || 1;
    return min - range * 0.05; // 5% padding below
  });
  private readonly maxVal = computed(() => {
    const v = this.allValues();
    if (!v.length) return 1;
    const min = Math.min(...v);
    const max = Math.max(...v);
    const range = max - min || 1;
    return max + range * 0.05; // 5% padding above
  });

  readonly showBaseline = computed(() => {
    const min = this.minVal();
    const max = this.maxVal();
    return min <= 100 && max >= 100;
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
        name: s.name, points, color: s.color,
        dashed: s.dashed ?? false,
        strokeWidth: s.strokeWidth ?? 2,
        areaPoints,
        lastX: last?.x ?? null,
        lastY: last?.y ?? null,
      };
    });
  });

  readonly yTicks = computed(() => {
    const min = this.minVal();
    const max = this.maxVal();
    const plotH = this.plotH;
    const range = max - min || 1;
    const tickCount = 6;
    return Array.from({ length: tickCount }, (_, i) => {
      const t = i / (tickCount - 1);
      const value = min + range * t;
      return {
        value,
        y: PAD.top + plotH - plotH * t,
        label: this.fmtNum(value),
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

    // Show ~6-8 ticks max, evenly distributed
    const maxTicks = Math.min(8, dataLen);
    const interval = Math.max(1, Math.floor(dataLen / maxTicks));

    const ticks: { idx: number; x: number; label: string }[] = [];
    for (let i = 0; i < dataLen; i += interval) {
      ticks.push({
        idx: i,
        x: PAD.left + i * stepX,
        label: lbls[i] ?? `${i + 1}`,
      });
    }
    // Always include the last point
    const lastIdx = dataLen - 1;
    if (ticks[ticks.length - 1]?.idx !== lastIdx) {
      ticks.push({
        idx: lastIdx,
        x: PAD.left + lastIdx * stepX,
        label: lbls[lastIdx] ?? `${lastIdx + 1}`,
      });
    }
    return ticks;
  });

  private fmtNum(n: number): string {
    if (Math.abs(n) >= 1e6) return (n / 1e6).toFixed(1) + 'M';
    if (Math.abs(n) >= 1e3) return (n / 1e3).toFixed(1) + 'K';
    if (Math.abs(n) >= 100) return n.toFixed(1);
    return n.toFixed(2);
  }
}
