import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'iq-landing-footer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <footer class="footer">
      <div class="footer-inner">
        <div class="footer-brand">
          <span class="logo mono">IQ</span>
          <span class="brand">INVESTIQ</span>
        </div>
        <p class="disclaimer">
          O IQ-Score e todas as análises do IQ-Cognit são métricas quantamentais geradas por modelo computacional.
          Não constituem recomendação de investimento, consultoria financeira ou análise de valores mobiliários
          nos termos da Instrução CVM 598/2018. As decisões de compra, venda e alocação de ativos são de
          responsabilidade exclusiva do investidor. Rentabilidade passada não é garantia de rentabilidade futura.
        </p>
        <span class="copyright label">© 2026 InvestIQ. Todos os direitos reservados.</span>
      </div>
    </footer>
  `,
  styles: [`
    .footer { padding: 48px 32px 24px; background: #0A0C14; border-top: 1px solid rgba(255,255,255,0.04); }
    .footer-inner { max-width: 800px; margin: 0 auto; text-align: center; display: flex; flex-direction: column; gap: 16px; }
    .footer-brand { display: flex; align-items: center; justify-content: center; gap: 8px; }
    .logo { font-size: 16px; font-weight: 700; color: #d0f364; }
    .brand { font-family: var(--font-ui); font-size: 12px; font-weight: 700; color: #F8FAFC; letter-spacing: 0.08em; }
    .disclaimer { font-size: 10px; color: #606878; line-height: 1.6; }
    .copyright { color: #383E4A; }
  `]
})
export class LandingFooterComponent {}
