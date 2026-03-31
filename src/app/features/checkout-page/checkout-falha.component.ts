import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IqButtonComponent } from '../../shared/components/iq-button/iq-button.component';

@Component({
  selector: 'iq-checkout-falha',
  standalone: true,
  imports: [RouterLink, IqButtonComponent],
  template: `
    <div class="checkout">
      <div class="checkout__card">
        <svg class="checkout__icon checkout__icon--fail" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="48" height="48">
          <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
        </svg>
        <h1 class="checkout__title">Pagamento Não Concluído</h1>
        <p class="checkout__desc">Houve um problema com o pagamento. Nenhuma cobrança foi realizada.</p>
        <iq-button variant="primary" routerLink="/configuracoes">Tentar Novamente</iq-button>
      </div>
    </div>
  `,
  styleUrl: './checkout-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CheckoutFalhaComponent {}
