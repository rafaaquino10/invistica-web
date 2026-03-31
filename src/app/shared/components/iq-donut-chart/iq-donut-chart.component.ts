import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';

export interface DonutSlice {
  label: string;
  value: number;
  color: string;
}

const SIZE = 160;
const R = 56;
const STROKE = 20;

@Component({
  selector: 'iq-donut-chart',
  standalone: true,
  template: `
    <div class="donut-wrap">
      <svg [attr.viewBox]="'0 0 ' + size + ' ' + size" class="donut">
        @for (arc of arcs(); track arc.label) {
          <circle [attr.cx]="center" [attr.cy]="center" [attr.r]="radius"
                  fill="none" [attr.stroke]="arc.color" [attr.stroke-width]="strokeW"
                  [attr.stroke-dasharray]="arc.dashArray" [attr.stroke-dashoffset]="arc.dashOffset"
                  [attr.transform]="'rotate(-90,' + center + ',' + center + ')'" />
        }
      </svg>
      <div class="donut__legend">
        @for (arc of arcs(); track arc.label) {
          <div class="donut__item">
            <span class="donut__dot" [style.backgroundColor]="arc.color"></span>
            <span class="donut__label">{{ arc.label }}</span>
            <span class="donut__pct mono">{{ arc.pct }}%</span>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .donut-wrap { display: flex; align-items: center; gap: 16px; }
    .donut { width: 100px; height: 100px; flex-shrink: 0; }
    .donut__legend { display: flex; flex-direction: column; gap: 4px; }
    .donut__item { display: flex; align-items: center; gap: 6px; font-size: 0.75rem; }
    .donut__dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
    .donut__label { color: var(--text-secondary); }
    .donut__pct { font-weight: 600; color: var(--text-primary); }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IqDonutChartComponent {
  readonly data = input<DonutSlice[]>([]);
  readonly size = SIZE;
  readonly center = SIZE / 2;
  readonly radius = R;
  readonly strokeW = STROKE;

  readonly arcs = computed(() => {
    const d = this.data();
    const total = d.reduce((s, i) => s + i.value, 0) || 1;
    const circ = 2 * Math.PI * R;
    let offset = 0;
    return d.map(item => {
      const pct = (item.value / total) * 100;
      const len = (item.value / total) * circ;
      const arc = {
        label: item.label,
        color: item.color,
        pct: pct.toFixed(1),
        dashArray: `${len} ${circ - len}`,
        dashOffset: `${-offset}`,
      };
      offset += len;
      return arc;
    });
  });
}
