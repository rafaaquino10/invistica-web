import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { RegimeType, REGIME_LABELS, REGIME_COLORS } from '../../../core/models/regime.model';

@Component({
  selector: 'iq-regime-badge',
  standalone: true,
  template: `
    <span class="regime" [style.color]="color()">
      <span class="regime__dot" [style.backgroundColor]="color()"></span>
      {{ label() }}
    </span>
  `,
  styles: [`
    .regime {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 0.6875rem;
      font-weight: 600;
      white-space: nowrap;
    }
    .regime__dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      flex-shrink: 0;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IqRegimeBadgeComponent {
  readonly regime = input.required<RegimeType>();
  readonly label = computed(() => REGIME_LABELS[this.regime()] ?? this.regime());
  readonly color = computed(() => REGIME_COLORS[this.regime()] ?? 'var(--text-tertiary)');
}
