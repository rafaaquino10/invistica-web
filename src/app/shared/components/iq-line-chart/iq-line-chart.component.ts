import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';

export interface LineSeries {
  name: string;
  data: number[];
  color: string;
  dashed?: boolean;
}

const W = 320;
const H = 180;
const PAD = { top: 10, right: 10, bottom: 14, left: 44 };

@Component({
  selector: 'iq-line-chart',
  standalone: true,
  template: `
    <svg [attr.viewBox]="'0 0 ' + width + ' ' + height" class="linechart" preserveAspectRatio="xMidYMid meet">
      <!-- grid -->
      @for (tick of yTicks(); track tick.value) {
        <line [attr.x1]="padLeft" [attr.x2]="width - padRight" [attr.y1]="tick.y" [attr.y2]="tick.y" class="linechart__grid" />
        <text [attr.x]="padLeft - 4" [attr.y]="tick.y" class="linechart__label" text-anchor="end" dominant-baseline="middle">{{ tick.label }}</text>
      }
      <!-- series -->
      @for (s of seriesData(); track s.name) {
        <polyline [attr.points]="s.points" fill="none"
                  [attr.stroke]="s.color" stroke-width="1.5"
                  [attr.stroke-dasharray]="s.dashed ? '4,3' : 'none'"
                  stroke-linecap="round" stroke-linejoin="round" />
      }
      <!-- legend -->
      @for (s of seriesData(); track s.name; let i = $index) {
        <line [attr.x1]="padLeft + i * 80" [attr.y1]="height - 2" [attr.x2]="padLeft + i * 80 + 12" [attr.y2]="height - 2"
              [attr.stroke]="s.color" stroke-width="2" [attr.stroke-dasharray]="s.dashed ? '3,2' : 'none'" />
        <text [attr.x]="padLeft + i * 80 + 16" [attr.y]="height" class="linechart__legend">{{ s.name }}</text>
      }
    </svg>
  `,
  styles: [`
    .linechart { width: 100%; }
    .linechart__grid { stroke: var(--surface-3); stroke-width: 0.5; }
    .linechart__label { font-size: 9px; fill: var(--text-tertiary); font-family: 'IBM Plex Mono', monospace; }
    .linechart__legend { font-size: 8px; fill: var(--text-secondary); font-family: 'Satoshi', sans-serif; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IqLineChartComponent {
  readonly series = input<LineSeries[]>([]);
  readonly width = W;
  readonly height = H;
  readonly padLeft = PAD.left;
  readonly padRight = PAD.right;

  private readonly allValues = computed(() => {
    return this.series().flatMap(s => s.data);
  });

  private readonly minVal = computed(() => Math.min(...this.allValues()) || 0);
  private readonly maxVal = computed(() => Math.max(...this.allValues()) || 1);

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
      label: (min + range * t).toFixed(0),
    }));
  });
}
