import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';

@Component({
  selector: 'iq-signal-badge',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="badge" [class]="badgeClass()">{{ action() }}</span>
  `,
  styles: [`
    .badge {
      display: inline-flex;
      align-items: center;
      padding: 2px 8px;
      border-radius: var(--radius);
      font-family: var(--font-ui);
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }
    .buy { background: var(--pos-dim); color: var(--pos); }
    .sell { background: var(--neg-dim); color: var(--neg); }
    .hold { background: var(--warn-dim); color: var(--warn); }
    .cash { background: var(--warn-dim); color: var(--warn); }
    .rotate { background: var(--volt-dim); color: var(--volt); }
  `]
})
export class SignalBadgeComponent {
  action = input.required<string>();

  badgeClass = computed(() => {
    const a = this.action().toUpperCase();
    if (a.includes('COMPRAR') || a.includes('BUY') || a.includes('AUMENTAR')) return 'buy';
    if (a.includes('VENDER') || a.includes('SELL')) return 'sell';
    if (a.includes('ROTACIONAR') || a.includes('ROTATE')) return 'rotate';
    if (a.includes('CASH')) return 'cash';
    return 'hold';
  });
}
