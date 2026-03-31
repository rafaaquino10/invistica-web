import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';

export interface BarDataPoint {
  label: string;
  value: number;
  opacity?: number;
}

const W = 320;
const H = 180;
const PAD = { top: 10, right: 10, bottom: 24, left: 44 };

@Component({
  selector: 'iq-bar-chart',
  standalone: true,
  template: `
    <svg [attr.viewBox]="'0 0 ' + width + ' ' + height" class="barchart" preserveAspectRatio="xMidYMid meet">
      <!-- grid lines -->
      @for (tick of yTicks(); track tick.value) {
        <line [attr.x1]="padLeft" [attr.x2]="width - padRight" [attr.y1]="tick.y" [attr.y2]="tick.y" class="barchart__grid" />
        <text [attr.x]="padLeft - 4" [attr.y]="tick.y" class="barchart__y-label" text-anchor="end" dominant-baseline="middle">{{ tick.label }}</text>
      }
      <!-- bars -->
      @for (bar of bars(); track bar.label) {
        <rect [attr.x]="bar.x" [attr.y]="bar.y" [attr.width]="bar.w" [attr.height]="bar.h"
              [attr.fill]="color()" [attr.opacity]="bar.opacity" rx="1" />
        <text [attr.x]="bar.x + bar.w / 2" [attr.y]="height - padBottom + 14"
              class="barchart__x-label" text-anchor="middle">{{ bar.label }}</text>
      }
    </svg>
  `,
  styles: [`
    .barchart { width: 100%; }
    .barchart__grid { stroke: var(--surface-3); stroke-width: 0.5; }
    .barchart__y-label { font-size: 9px; fill: var(--text-tertiary); font-family: 'IBM Plex Mono', monospace; }
    .barchart__x-label { font-size: 8px; fill: var(--text-tertiary); font-family: 'IBM Plex Mono', monospace; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IqBarChartComponent {
  readonly data = input<BarDataPoint[]>([]);
  readonly color = input('var(--obsidian)');

  readonly width = W;
  readonly height = H;
  readonly padLeft = PAD.left;
  readonly padRight = PAD.right;
  readonly padBottom = PAD.bottom;

  readonly bars = computed(() => {
    const d = this.data();
    if (!d.length) return [];
    const plotW = W - PAD.left - PAD.right;
    const plotH = H - PAD.top - PAD.bottom;
    const max = Math.max(...d.map(p => Math.abs(p.value)), 1);
    const barW = Math.max(4, (plotW / d.length) * 0.7);
    const gap = (plotW - barW * d.length) / (d.length + 1);

    return d.map((p, i) => {
      const h = (Math.abs(p.value) / max) * plotH;
      return {
        label: p.label,
        x: PAD.left + gap + i * (barW + gap),
        y: PAD.top + plotH - h,
        w: barW,
        h,
        opacity: p.opacity ?? 1,
      };
    });
  });

  readonly yTicks = computed(() => {
    const d = this.data();
    const max = Math.max(...d.map(p => Math.abs(p.value)), 1);
    const plotH = H - PAD.top - PAD.bottom;
    const ticks = [0, 0.25, 0.5, 0.75, 1];
    return ticks.map(t => ({
      value: max * t,
      y: PAD.top + plotH - plotH * t,
      label: this.compactNum(max * t),
    }));
  });

  private compactNum(n: number): string {
    if (n >= 1e9) return (n / 1e9).toFixed(1) + 'B';
    if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
    if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
    return n.toFixed(0);
  }
}
