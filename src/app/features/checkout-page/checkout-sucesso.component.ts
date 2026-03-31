import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IqButtonComponent } from '../../shared/components/iq-button/iq-button.component';

@Component({
  selector: 'iq-checkout-sucesso',
  standalone: true,
  imports: [RouterLink, IqButtonComponent],
  template: `
    <div class="checkout">
      <div class="checkout__card">
        <svg class="checkout__icon checkout__icon--success" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="48" height="48">
          <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
        </svg>
        <h1 class="checkout__title">Assinatura Ativada!</h1>
        <p class="checkout__desc">Seu plano Pro está ativo. Agora você tem acesso completo a todas as funcionalidades do InvestIQ.</p>
        <iq-button variant="primary" routerLink="/dashboard">Ir para o Dashboard</iq-button>
      </div>
    </div>
  `,
  styleUrl: './checkout-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CheckoutSucessoComponent {}
