import { Component, ChangeDetectionStrategy } from '@angular/core';
import { LogoComponent } from '../../../shared/components/logo/logo.component';

@Component({
  selector: 'iq-landing-footer',
  standalone: true,
  imports: [LogoComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <footer class="footer">
      <div class="inner">
        <div class="brand"><iq-logo size="sm" /></div>
        <p class="disclaimer">O IQ-Score e todas as análises do IQ-Cognit são métricas quantamentais geradas por modelo computacional. Não constituem recomendação de investimento, consultoria financeira ou análise de valores mobiliários nos termos da Instrução CVM 598/2018. As decisões de compra, venda e alocação de ativos são de responsabilidade exclusiva do investidor. Rentabilidade passada não é garantia de rentabilidade futura.</p>
        <span class="copy">© 2026 InvestIQ. Todos os direitos reservados.</span>
      </div>
    </footer>
  `,
  styles: [`
    .footer { padding: 48px 48px 24px; background: #050505; border-top: 1px solid rgba(255,255,255,0.04); }
    .inner { max-width: 800px; margin: 0 auto; text-align: center; display: flex; flex-direction: column; gap: 16px; }
    .brand { display: flex; align-items: center; justify-content: center; gap: 8px; }
    .logo { font-size: 16px; font-weight: 700; color: #d0f364; }
    .name { font-family: var(--font-ui); font-size: 12px; font-weight: 700; color: #F8FAFC; letter-spacing: 0.08em; }
    .disclaimer { font-size: 10px; color: #606878; line-height: 1.6; }
    .copy { font-family: var(--font-ui); font-size: 10px; color: #383E4A; }
  `]
})
export class LandingFooterComponent {}
