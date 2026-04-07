import { Component, ChangeDetectionStrategy } from '@angular/core';
import { InViewDirective } from '../../../shared/directives/in-view.directive';

@Component({
  selector: 'iq-features-section',
  standalone: true,
  imports: [InViewDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="section" iqInView>
      <span class="overline volt">FUNCIONALIDADES</span>
      <h2>Tudo que você precisa. Nada que você não precisa.</h2>
      <div class="features-grid">
        @for (f of features; track f.title) {
          <div class="feature-row" [class.reverse]="f.reverse">
            <div class="feature-text">
              <div class="feature-icon-wrap"><i class="ph ph-{{ f.icon }}"></i></div>
              <h3>{{ f.title }}</h3>
              <p>{{ f.desc }}</p>
              <ul>@for (b of f.bullets; track b) { <li>{{ b }}</li> }</ul>
            </div>
            <div class="feature-visual glass">
              <div class="visual-mock">
                @for (line of f.mockLines; track $index) {
                  <div class="mock-row">
                    <span class="mock-label">{{ line.label }}</span>
                    <span class="mock-value mono" [style.color]="line.color || '#F8FAFC'">{{ line.value }}</span>
                  </div>
                }
              </div>
            </div>
          </div>
        }
      </div>
    </section>
  `,
  styles: [`
    .section { padding: 100px 48px; background: #0A0C14; text-align: center; }
    .section.in-view .features-grid { opacity: 1; transform: translateY(0); }
    .volt { color: #d0f364; }
    h2 { font-family: var(--font-ui); font-size: 28px; font-weight: 700; color: #F8FAFC; margin: 12px 0 48px; }
    .features-grid { display: flex; flex-direction: column; gap: 48px; max-width: 1000px; margin: 0 auto; opacity: 0; transform: translateY(30px); transition: all 500ms ease-out; }
    .feature-row { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; align-items: center; text-align: left; }
    .feature-row.reverse { direction: rtl; }
    .feature-row.reverse > * { direction: ltr; }
    .feature-text { display: flex; flex-direction: column; gap: 8px; }
    .feature-icon-wrap { width: 40px; height: 40px; border-radius: 4px; background: rgba(208,243,100,0.06); display: flex; align-items: center; justify-content: center; }
    .feature-icon-wrap i { font-size: 20px; color: #d0f364; }
    h3 { font-family: var(--font-ui); font-size: 18px; font-weight: 700; color: #F8FAFC; }
    .feature-text p { font-size: 13px; color: #A0A8B8; line-height: 1.6; }
    ul { list-style: none; display: flex; flex-direction: column; gap: 4px; }
    li { font-size: 12px; color: #606878; padding-left: 12px; position: relative; }
    li::before { content: '·'; position: absolute; left: 0; color: #d0f364; }
    .feature-visual { padding: 20px; border-radius: 4px; min-height: 160px; }
    .visual-mock { display: flex; flex-direction: column; gap: 6px; }
    .mock-row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid rgba(255,255,255,0.03); }
    .mock-label { font-family: var(--font-ui); font-size: 11px; color: #606878; }
    .mock-value { font-size: 12px; font-weight: 600; }
    @media (max-width: 700px) { .feature-row, .feature-row.reverse { grid-template-columns: 1fr; direction: ltr; } }
  `]
})
export class FeaturesSectionComponent {
  readonly features = [
    { icon: 'wallet', title: 'Carteira', desc: 'Gestão completa do portfólio com analytics, alertas e dividendos.', reverse: false, bullets: ['Importação via Open Finance (Pluggy)', 'CRUD de posições com cotação real', 'Aporte inteligente com sugestão do motor'], mockLines: [{ label: 'Patrimônio', value: 'R$ 147.250', color: '#F8FAFC' }, { label: 'Rent. 12M', value: '+18.4%', color: '#34D399' }, { label: 'Alpha IBOV', value: '+6.2%', color: '#d0f364' }, { label: 'Score Médio', value: '76', color: '#34D399' }] },
    { icon: 'crosshair', title: 'Decidir', desc: 'Recomendações prescritivas. O motor diz o que fazer e por quê.', reverse: true, bullets: ['Carteira ótima do motor', 'Sinais de compra/venda com motivo', 'Short candidates com deterioração'], mockLines: [{ label: 'Regime', value: 'RISK OFF', color: '#EF4444' }, { label: 'Confiança', value: '80%', color: '#d0f364' }, { label: 'Sinais ativos', value: '3', color: '#F59E0B' }, { label: 'Short candidates', value: '5', color: '#EF4444' }] },
    { icon: 'currency-dollar', title: 'Dividendos', desc: 'Hub completo de renda passiva com safety scanner e simulador.', reverse: false, bullets: ['Calendário com seus proventos', 'Dividend trap scanner', 'Simulador "Quanto preciso pra meta"'], mockLines: [{ label: 'DY Médio Carteira', value: '7.2%', color: '#34D399' }, { label: 'Safety Score', value: '84/100', color: '#d0f364' }, { label: 'Projeção 12M', value: 'R$ 10.602', color: '#d0f364' }, { label: 'Trap Risk', value: 'Nenhum', color: '#34D399' }] },
  ];
}
