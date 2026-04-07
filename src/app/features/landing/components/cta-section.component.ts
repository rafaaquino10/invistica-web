import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { InViewDirective } from '../../../shared/directives/in-view.directive';

@Component({
  selector: 'iq-cta-section',
  standalone: true,
  imports: [RouterLink, InViewDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="section" iqInView>
      <div class="cta-card glass">
        <h2>Comece a investir com inteligência</h2>
        <p>100% gratuito. Sem cartão de crédito.</p>
        <a class="btn-volt" routerLink="/criar-conta">Começar agora</a>
      </div>
    </section>
  `,
  styles: [`
    .section { padding: 80px 48px; background: #0A0C14; display: flex; justify-content: center; }
    .section.in-view .cta-card { opacity: 1; transform: scale(1); }
    .cta-card {
      padding: 56px; text-align: center; border-radius: 4px; border: 1px solid rgba(208,243,100,0.12);
      max-width: 520px; width: 100%; display: flex; flex-direction: column; align-items: center; gap: 12px;
      opacity: 0; transform: scale(0.95); transition: all 500ms ease-out;
    }
    h2 { font-family: var(--font-ui); font-size: 24px; font-weight: 700; color: #F8FAFC; }
    p { font-size: 14px; color: #A0A8B8; }
    .btn-volt { padding: 14px 40px; background: #d0f364; color: #050505; border-radius: 4px; font-family: var(--font-ui); font-weight: 700; font-size: 15px; margin-top: 8px; }
  `]
})
export class CtaSectionComponent {}
