import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IqButtonComponent } from '../../shared/components/iq-button/iq-button.component';

@Component({
  selector: 'iq-checkout-pendente',
  standalone: true,
  imports: [RouterLink, IqButtonComponent],
  template: `
    <div class="checkout">
      <div class="checkout__card">
        <svg class="checkout__icon checkout__icon--pending" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="48" height="48">
          <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
        </svg>
        <h1 class="checkout__title">Pagamento em Processamento</h1>
        <p class="checkout__desc">Seu pagamento está sendo processado. Assim que confirmado, seu plano Pro será ativado automaticamente. Isso pode levar alguns minutos.</p>
        <iq-button variant="secondary" routerLink="/dashboard">Voltar ao Dashboard</iq-button>
      </div>
    </div>
  `,
  styleUrl: './checkout-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CheckoutPendenteComponent {}
