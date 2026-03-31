import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { IqButtonComponent } from '../iq-button/iq-button.component';

@Component({
  selector: 'iq-error-state',
  standalone: true,
  imports: [IqButtonComponent],
  template: `
    <div class="error" role="alert">
      <svg class="error__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="40" height="40">
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      <p class="error__title">{{ title() }}</p>
      <p class="error__desc">{{ description() }}</p>
      <iq-button variant="secondary" size="sm" (clicked)="retry.emit()">Tentar novamente</iq-button>
    </div>
  `,
  styles: [`
    .error {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      padding: 48px 16px; text-align: center;
    }
    .error__icon { color: var(--negative); margin-bottom: 16px; }
    .error__title { font-size: 1rem; font-weight: 500; color: var(--text-primary); margin-bottom: 4px; }
    .error__desc { font-size: 0.75rem; color: var(--text-tertiary); max-width: 320px; margin-bottom: 16px; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IqErrorStateComponent {
  readonly title = input('Erro ao carregar dados');
  readonly description = input('Verifique sua conexão e tente novamente.');
  readonly retry = output<void>();
}
