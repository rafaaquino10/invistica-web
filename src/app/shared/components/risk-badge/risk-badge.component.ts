import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';

@Component({
  selector: 'iq-risk-badge',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span class="badge" [class]="level()">{{ levelLabel() }}</span>`,
  styles: [`
    .badge {
      display: inline-flex; padding: 2px 8px; border-radius: var(--radius);
      font-family: var(--font-ui); font-size: 10px; font-weight: 700;
      text-transform: uppercase; letter-spacing: 0.06em;
    }
    .low { background: var(--pos-dim); color: var(--pos); }
    .medium { background: var(--warn-dim); color: var(--warn); }
    .high { background: var(--neg-dim); color: var(--neg); }
  `]
})
export class RiskBadgeComponent {
  level = input.required<'low' | 'medium' | 'high'>();
  levelLabel = computed(() => {
    switch (this.level()) {
      case 'low': return 'Baixo';
      case 'medium': return 'Médio';
      case 'high': return 'Alto';
    }
  });
}
