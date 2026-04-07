import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';

@Component({
  selector: 'iq-vol-stress-badge',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span class="badge" [class]="level()">{{ labelText() }}</span>`,
  styles: [`
    .badge {
      display: inline-flex; padding: 2px 8px; border-radius: var(--radius);
      font-family: var(--font-ui); font-size: 10px; font-weight: 700;
      text-transform: uppercase; letter-spacing: 0.06em;
    }
    .normal { background: var(--pos-dim); color: var(--pos); }
    .elevated { background: var(--warn-dim); color: var(--warn); }
    .critical { background: var(--neg-dim); color: var(--neg); }
  `]
})
export class VolStressBadgeComponent {
  stressed = input(false);
  ratio = input(1);

  level = computed(() => {
    if (this.ratio() >= 2) return 'critical';
    if (this.stressed() || this.ratio() >= 1.5) return 'elevated';
    return 'normal';
  });

  labelText = computed(() => {
    const l = this.level();
    if (l === 'critical') return 'Crítico';
    if (l === 'elevated') return 'Elevado';
    return 'Normal';
  });
}
