import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';

@Component({
  selector: 'iq-kpi-card',
  standalone: true,
  template: `
    <div class="kpi">
      <span class="kpi__label">{{ label() }}</span>
      <span class="kpi__value mono">{{ prefix() }}{{ formattedValue() }}</span>
      @if (delta() !== undefined && delta() !== null) {
        <span class="kpi__delta mono" [class.kpi__delta--pos]="delta()! >= 0" [class.kpi__delta--neg]="delta()! < 0">
          <svg viewBox="0 0 12 12" width="10" height="10" fill="currentColor">
            @if (delta()! >= 0) {
              <polygon points="6,2 10,8 2,8"/>
            } @else {
              <polygon points="6,10 10,4 2,4"/>
            }
          </svg>
          {{ delta()! >= 0 ? '+' : '' }}{{ deltaFormatted() }}
          @if (deltaLabel()) {
            <span class="kpi__delta-label">{{ deltaLabel() }}</span>
          }
        </span>
      }
    </div>
  `,
  styles: [`
    .kpi { display: flex; flex-direction: column; gap: 4px; }
    .kpi__label {
      font-family: 'IBM Plex Mono', monospace;
      font-size: 11px; font-weight: 500;
      color: var(--text-tertiary);
      text-transform: uppercase;
      letter-spacing: 0.10em;
    }
    .kpi__value { font-size: 1.625rem; font-weight: 700; color: var(--text-primary); line-height: 1.2; }
    .kpi__delta { display: inline-flex; align-items: center; gap: 4px; font-size: 0.8125rem; font-weight: 600; }
    .kpi__delta--pos { color: var(--positive); }
    .kpi__delta--neg { color: var(--negative); }
    .kpi__delta-label { font-weight: 400; color: var(--text-tertiary); }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IqKpiCardComponent {
  readonly label = input('');
  readonly value = input<number | string>(0);
  readonly delta = input<number | null | undefined>(undefined);
  readonly deltaLabel = input('');
  readonly prefix = input('');

  readonly formattedValue = computed(() => {
    const v = this.value();
    return typeof v === 'number' ? v.toLocaleString('pt-BR') : v;
  });

  readonly deltaFormatted = computed(() => {
    const d = this.delta();
    if (d == null) return '';
    return (d * 100).toFixed(2) + '%';
  });
}
