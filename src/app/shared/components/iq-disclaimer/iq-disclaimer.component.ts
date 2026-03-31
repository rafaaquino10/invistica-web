import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'iq-disclaimer',
  standalone: true,
  template: `
    <p class="disclaimer">
      Informações para fins educacionais. Não constitui recomendação de investimento.
      Rentabilidade passada não garante resultados futuros.
    </p>
  `,
  styles: [`
    .disclaimer {
      font-size: 0.6875rem;
      color: var(--text-quaternary);
      line-height: 1.4;
      text-align: center;
      padding: var(--space-3) 0;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IqDisclaimerComponent {}
