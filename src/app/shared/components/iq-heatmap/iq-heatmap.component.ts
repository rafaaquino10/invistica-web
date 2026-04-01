import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';

const CELL = 32;
const PAD_LEFT = 80;
const PAD_TOP = 20;

@Component({
  selector: 'iq-heatmap',
  standalone: true,
  template: `
    <svg [attr.viewBox]="'0 0 ' + svgW() + ' ' + svgH()" class="heatmap" preserveAspectRatio="xMidYMid meet">
      <!-- col labels -->
      @for (col of colLabels(); track col; let j = $index) {
        <text [attr.x]="padLeft + j * cell + cell / 2" [attr.y]="12" class="heatmap__label" text-anchor="middle">{{ col }}</text>
      }
      <!-- rows -->
      @for (row of rowLabels(); track row; let i = $index) {
        <text [attr.x]="padLeft - 4" [attr.y]="padTop + i * cell + cell / 2 + 3" class="heatmap__label" text-anchor="end">{{ row }}</text>
        @for (col of colLabels(); track col; let j = $index) {
          <rect [attr.x]="padLeft + j * cell" [attr.y]="padTop + i * cell"
                [attr.width]="cell - 1" [attr.height]="cell - 1"
                [attr.fill]="cellColor(data()[i][j])" rx="1" />
          <text [attr.x]="padLeft + j * cell + cell / 2" [attr.y]="padTop + i * cell + cell / 2 + 3"
                class="heatmap__value" text-anchor="middle">{{ data()[i][j] }}</text>
        }
      }
    </svg>
  `,
  styles: [`
    .heatmap { width: 100%; }
    .heatmap__label { font-size: 11px; fill: var(--text-tertiary); font-family: 'IBM Plex Mono', monospace; }
    .heatmap__value { font-size: 11px; fill: var(--text-primary); font-family: 'IBM Plex Mono', monospace; font-weight: 500; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IqHeatmapComponent {
  readonly data = input<number[][]>([]);
  readonly rowLabels = input<string[]>([]);
  readonly colLabels = input<string[]>([]);

  readonly cell = CELL;
  readonly padLeft = PAD_LEFT;
  readonly padTop = PAD_TOP;

  readonly svgW = computed(() => PAD_LEFT + this.colLabels().length * CELL);
  readonly svgH = computed(() => PAD_TOP + this.rowLabels().length * CELL);

  cellColor(val: number): string {
    if (val > 0) return `rgba(26,122,69,${Math.min(Math.abs(val) / 10, 1) * 0.4})`;
    if (val < 0) return `rgba(194,48,40,${Math.min(Math.abs(val) / 10, 1) * 0.4})`;
    return 'var(--surface-2)';
  }
}
