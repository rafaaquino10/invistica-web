import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';

export interface LineSeries {
  name: string;
  data: number[];
  color: string;
  dashed?: boolean;
}

const W = 600;
const H = 280;
const PAD = { top: 16, right: 16, bottom: 28, left: 56 };

@Component({
  selector: 'iq-line-chart',
  standalone: true,
  template: `
    <svg [attr.viewBox]="'0 0 ' + width + ' ' + height" class="linechart" preserveAspectRatio="xMidYMid meet">
      @for (tick of yTicks(); track tick.value) {
        <line [attr.x1]="padLeft" [attr.x2]="width - padRight" [attr.y1]="tick.y" [attr.y2]="tick.y" class="linechart__grid" />
        <text [attr.x]="padLeft - 8" [attr.y]="tick.y" class="linechart__label" text-anchor="end" dominant-baseline="middle">{{ tick.label }}</text>
      }
      @for (s of seriesData(); track s.name) {
        <polyline [attr.points]="s.points" fill="none"
                  [attr.stroke]="s.color" stroke-width="2"
                  [attr.stroke-dasharray]="s.dashed ? '6,4' : 'none'"
                  stroke-linecap="round" stroke-linejoin="round" />
      }
      <!-- legend -->
      @for (s of seriesData(); track s.name; let i = $index) {
        <line [attr.x1]="padLeft + i * 100" [attr.y1]="height - 6" [attr.x2]="padLeft + i * 100 + 16" [attr.y2]="height - 6"
              [attr.stroke]="s.color" stroke-width="2" [attr.stroke-dasharray]="s.dashed ? '4,3' : 'none'" />
        <text [attr.x]="padLeft + i * 100 + 20" [attr.y]="height - 3" class="linechart__legend">{{ s.name }}</text>
      }
    </svg>
  `,
  styles: [`
    .linechart { width: 100%; height: auto; display: block; }
    .linechart__grid { stroke: var(--surface-3); stroke-width: 0.5; }
    .linechart__label { font-size: 11px; fill: var(--text-tertiary); font-family: 'IBM Plex Mono', monospace; }
    .linechart__legend { font-size: 10px; fill: var(--text-secondary); font-family: 'Satoshi', sans-serif; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IqLineChartComponent {
  readonly series = input<LineSeries[]>([]);
  readonly width = W;
  readonly height = H;
  readonly padLeft = PAD.left;
  readonly padRight = PAD.right;

  private readonly allValues = computed(() => this.series().flatMap(s => s.data));
  private readonly minVal = computed(() => { const v = this.allValues(); return v.length ? Math.min(...v) : 0; });
  private readonly maxVal = computed(() => { const v = this.allValues(); return v.length ? Math.max(...v) : 1; });

  readonly seriesData = computed(() => {
    const plotW = W - PAD.left - PAD.right;
    const plotH = H - PAD.top - PAD.bottom;
    const min = this.minVal();
    const range = this.maxVal() - min || 1;

    return this.series().map(s => {
      const stepX = s.data.length > 1 ? plotW / (s.data.length - 1) : 0;
      const points = s.data.map((v, i) => {
        const x = PAD.left + i * stepX;
        const y = PAD.top + plotH - ((v - min) / range) * plotH;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      }).join(' ');
      return { name: s.name, points, color: s.color, dashed: s.dashed ?? false };
    });
  });

  readonly yTicks = computed(() => {
    const min = this.minVal();
    const max = this.maxVal();
    const plotH = H - PAD.top - PAD.bottom;
    const range = max - min || 1;
    return [0, 0.25, 0.5, 0.75, 1].map(t => ({
      value: min + range * t,
      y: PAD.top + plotH - plotH * t,
      label: this.fmtNum(min + range * t),
    }));
  });

  private fmtNum(n: number): string {
    if (Math.abs(n) >= 1e6) return (n / 1e6).toFixed(1) + 'M';
    if (Math.abs(n) >= 1e3) return (n / 1e3).toFixed(1) + 'K';
    if (Math.abs(n) >= 100) return n.toFixed(0);
    return n.toFixed(2);
  }
}
