import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { InViewDirective } from '../../../shared/directives/in-view.directive';

@Component({
  selector: 'iq-faq-section',
  standalone: true,
  imports: [InViewDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="section" iqInView>
      <span class="overline volt">FAQ</span>
      <h2>Perguntas frequentes</h2>
      <div class="faq-list">
        @for (item of items; track item.q; let i = $index) {
          <div class="faq-item" [class.open]="openIdx() === i">
            <button class="faq-q" (click)="openIdx.set(openIdx() === i ? null : i)">
              <span>{{ item.q }}</span>
              <i class="ph ph-{{ openIdx() === i ? 'minus' : 'plus' }}"></i>
            </button>
            @if (openIdx() === i) { <p class="faq-a">{{ item.a }}</p> }
          </div>
        }
      </div>
    </section>
  `,
  styles: [`
    .section { padding: 80px 48px; background: #050505; }
    .section.in-view .faq-list { opacity: 1; }
    .volt { color: #d0f364; text-align: center; display: block; }
    h2 { font-family: var(--font-ui); font-size: 28px; font-weight: 700; color: #F8FAFC; text-align: center; margin: 12px 0 32px; }
    .faq-list { max-width: 680px; margin: 0 auto; display: flex; flex-direction: column; opacity: 0; transition: opacity 500ms ease-out; }
    .faq-item { border-bottom: 1px solid rgba(255,255,255,0.04); }
    .faq-q { display: flex; justify-content: space-between; align-items: center; width: 100%; padding: 16px 0; font-family: var(--font-ui); font-size: 14px; font-weight: 600; color: #F8FAFC; text-align: left; }
    .faq-q i { color: #606878; font-size: 14px; }
    .faq-a { font-size: 13px; color: #A0A8B8; line-height: 1.6; padding: 0 0 16px; }
  `]
})
export class FaqSectionComponent {
  readonly openIdx = signal<number | null>(null);
  readonly items = [
    { q: 'É realmente gratuito?', a: 'Sim, 100%. Todas as funcionalidades são gratuitas, sem paywall, sem planos premium.' },
    { q: 'De onde vêm os dados?', a: 'CVM, B3, BCB, fontes oficiais. Dados financeiros auditados e atualizados diariamente.' },
    { q: 'Como o score é calculado?', a: '3 pilares (Quantitativo, Qualitativo, Valuation) com pesos dinâmicos calibrados por setor. Validado via backtest.' },
    { q: 'É seguro conectar minha corretora?', a: 'Open Finance regulado pelo Banco Central. Suas credenciais nunca passam pelo InvestIQ.' },
    { q: 'Vocês recomendam compra de ações?', a: 'Somos uma plataforma de informação e análise. As decisões de investimento são exclusivamente do investidor, conforme Instrução CVM 598/2018.' },
    { q: 'Tem app pra celular?', a: 'Atualmente web responsiva. App nativo está no roadmap.' },
  ];
}
