import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { Rating, RATING_LABELS, RATING_COLORS } from '../../../core/models/score.model';

@Component({
  selector: 'iq-rating-badge',
  standalone: true,
  template: `
    <span class="badge"
          [style.color]="colors().text"
          [style.backgroundColor]="colors().bg"
          [style.borderColor]="colors().border">
      {{ label() }}
    </span>
  `,
  styles: [`
    .badge {
      display: inline-flex;
      align-items: center;
      padding: 3px 10px;
      font-size: 0.75rem;
      font-weight: 600;
      border: 1px solid;
      border-radius: var(--radius);
      line-height: 1.4;
      white-space: nowrap;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IqRatingBadgeComponent {
  readonly rating = input.required<Rating>();
  readonly label = computed(() => RATING_LABELS[this.rating()] ?? this.rating());
  readonly colors = computed(() => RATING_COLORS[this.rating()] ?? RATING_COLORS['HOLD']);
}
