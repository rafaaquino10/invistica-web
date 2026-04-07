import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';

@Component({
  selector: 'iq-pillar-bar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="pillar">
      <div class="pillar-header">
        <span class="pillar-name label">{{ name() }}</span>
        <span class="pillar-score mono">{{ score() != null ? score() : '--' }}</span>
      </div>
      <div class="pillar-track">
        <div class="pillar-fill" [style.width.%]="fillWidth()" [style.background]="fillColor()"></div>
      </div>
      @if (weight() != null) {
        <span class="pillar-weight overline">peso {{ (weight()! * 100).toFixed(0) }}%</span>
      }
    </div>
  `,
  styles: [`
    .pillar { display: flex; flex-direction: column; gap: 4px; }
    .pillar-header { display: flex; align-items: center; justify-content: space-between; }
    .pillar-name { color: var(--t2); font-size: 12px; }
    .pillar-score { font-size: 14px; font-weight: 700; color: var(--t1); }
    .pillar-track {
      height: 4px; background: var(--elevated); border-radius: 2px; overflow: hidden;
    }
    .pillar-fill {
      height: 100%; border-radius: 2px;
      transition: width 400ms ease-out;
    }
    .pillar-weight { color: var(--t4); font-size: 9px; align-self: flex-end; }
  `]
})
export class PillarBarComponent {
  name = input.required<string>();
  score = input.required<number | null>();
  weight = input<number | null>(null);

  fillWidth = computed(() => Math.min(this.score() ?? 0, 100));

  fillColor = computed(() => {
    const s = this.score();
    if (s == null) return 'var(--t4)';
    if (s >= 82) return 'var(--volt)';
    if (s >= 70) return 'var(--pos)';
    if (s >= 45) return 'var(--warn)';
    return 'var(--neg)';
  });
}
