import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';

@Component({
  selector: 'iq-regime-badge',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="badge" [style.background]="bgColor()" [style.color]="color()">
      {{ label() }}
    </span>
  `,
  styles: [`
    .badge {
      display: inline-flex;
      align-items: center;
      padding: 3px 10px;
      border-radius: var(--radius);
      font-family: var(--font-ui);
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }
  `]
})
export class RegimeBadgeComponent {
  label = input.required<string>();
  regime = input.required<string>();

  color = computed(() => {
    const r = this.regime().toUpperCase();
    if (r.includes('RISK_ON') || r.includes('RECUPERA')) return 'var(--pos)';
    if (r.includes('RISK_OFF')) return 'var(--neg)';
    return 'var(--warn)';
  });

  bgColor = computed(() => {
    const r = this.regime().toUpperCase();
    if (r.includes('RISK_ON') || r.includes('RECUPERA')) return 'var(--pos-dim)';
    if (r.includes('RISK_OFF')) return 'var(--neg-dim)';
    return 'var(--warn-dim)';
  });
}
