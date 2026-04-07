import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';

@Component({
  selector: 'iq-confidence-meter',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="meter">
      <span class="meter-label label">Confiança</span>
      <div class="meter-track">
        <div class="meter-fill" [style.width.%]="pct()" [style.background]="color()"></div>
      </div>
      <span class="meter-val mono">{{ pct() }}%</span>
    </div>
  `,
  styles: [`
    .meter { display: flex; align-items: center; gap: 8px; }
    .meter-label { color: var(--t3); white-space: nowrap; }
    .meter-track { width: 64px; height: 4px; background: var(--elevated); border-radius: 2px; overflow: hidden; }
    .meter-fill { height: 100%; border-radius: 2px; transition: width 400ms ease-out; }
    .meter-val { font-size: 12px; font-weight: 700; min-width: 32px; }
  `]
})
export class ConfidenceMeterComponent {
  level = input.required<number>();

  pct = computed(() => Math.round(this.level() * 100));
  color = computed(() => {
    const p = this.pct();
    if (p >= 70) return 'var(--volt)';
    if (p >= 40) return 'var(--warn)';
    return 'var(--neg)';
  });
}
