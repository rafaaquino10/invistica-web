import { Component, ChangeDetectionStrategy } from '@angular/core';
import { InViewDirective } from '../../../shared/directives/in-view.directive';

@Component({
  selector: 'iq-features-grid',
  standalone: true,
  imports: [InViewDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="section" iqInView>
      <span class="overline volt">FUNCIONALIDADES</span>
      <h2>Tudo que você precisa. Nada que você não precisa.</h2>
      <div class="grid">
        @for (f of features; track f.title) {
          <div class="feature-card glass">
            <i class="ph ph-{{ f.icon }} f-icon"></i>
            <h3>{{ f.title }}</h3>
            <p>{{ f.desc }}</p>
          </div>
        }
      </div>
    </section>
  `,
  styles: [`
    .section { padding: 100px 32px; text-align: center; background: #0A0C14; }
    .section.in-view .grid { opacity: 1; transform: translateY(0); }
    .volt { color: #d0f364; }
    h2 { font-family: var(--font-ui); font-size: 32px; font-weight: 700; color: #F8FAFC; margin: 12px 0 40px; }
    .grid {
      display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; max-width: 900px; margin: 0 auto;
      opacity: 0; transform: translateY(30px); transition: all 500ms ease-out;
    }
    .feature-card { padding: 24px 20px; border-radius: 4px; text-align: left; display: flex; flex-direction: column; gap: 8px; }
    .f-icon { font-size: 24px; color: #d0f364; }
    h3 { font-family: var(--font-ui); font-size: 15px; font-weight: 700; color: #F8FAFC; }
    p { font-size: 12px; color: #A0A8B8; line-height: 1.5; }
    @media (max-width: 700px) { .grid { grid-template-columns: 1fr; } }
  `]
})
export class FeaturesGridComponent {
  readonly features = [
    { icon: 'magnifying-glass', title: 'Explorar', desc: 'Screener com filtros inteligentes e ranking por score IQ.' },
    { icon: 'crosshair', title: 'Decidir', desc: 'Recomendações prescritivas. O motor diz o que fazer e por quê.' },
    { icon: 'briefcase', title: 'Carteiras IQ', desc: '5 teses de investimento com seleção regime-aware.' },
    { icon: 'wallet', title: 'Carteira', desc: 'Gestão completa do portfólio com analytics e alertas.' },
    { icon: 'currency-dollar', title: 'Dividendos', desc: 'Safety scanner, simulador de renda passiva, trap detection.' },
    { icon: 'chart-line-up', title: 'Simulador', desc: 'Backtest com cenários pré-configurados e projeção futura.' },
  ];
}
