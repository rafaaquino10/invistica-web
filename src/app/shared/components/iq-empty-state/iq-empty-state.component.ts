import { Component, ChangeDetectionStrategy, input } from '@angular/core';

@Component({
  selector: 'iq-empty-state',
  standalone: true,
  template: `
    <div class="empty">
      <svg class="empty__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" width="48" height="48">
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      <p class="empty__title">{{ title() }}</p>
      <p class="empty__desc">{{ description() }}</p>
    </div>
  `,
  styles: [`
    .empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: var(--space-12) var(--space-4);
      text-align: center;
    }
    .empty__icon { color: var(--text-quaternary); margin-bottom: var(--space-4); }
    .empty__title { font-size: 1rem; font-weight: 500; color: var(--text-secondary); margin-bottom: var(--space-2); }
    .empty__desc { font-size: 0.75rem; color: var(--text-tertiary); max-width: 320px; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IqEmptyStateComponent {
  readonly title = input('Nenhum dado encontrado');
  readonly description = input('');
}
