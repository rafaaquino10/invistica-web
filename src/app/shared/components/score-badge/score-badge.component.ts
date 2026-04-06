import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';

@Component({
  selector: 'iq-score-badge',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="badge mono" [class]="badgeClass()">{{ score() }}</span>
  `,
  styles: [`
    .badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 36px;
      padding: 2px 8px;
      border-radius: var(--radius);
      font-size: 13px;
      font-weight: 700;
    }
    .strong-buy { background: var(--volt-dim); color: var(--volt); text-shadow: var(--volt-glow); }
    .buy { background: var(--pos-dim); color: var(--pos); }
    .hold { background: var(--warn-dim); color: var(--warn); }
    .reduce { background: var(--neg-dim); color: var(--neg); }
    .avoid { background: var(--neg-dim); color: var(--neg); opacity: 0.7; }
  `]
})
export class ScoreBadgeComponent {
  score = input.required<number | null>();

  badgeClass = computed(() => {
    const s = this.score();
    if (s == null) return 'hold';
    if (s >= 82) return 'strong-buy';
    if (s >= 70) return 'buy';
    if (s >= 45) return 'hold';
    if (s >= 30) return 'reduce';
    return 'avoid';
  });
}
