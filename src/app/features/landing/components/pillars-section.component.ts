import { Component, ChangeDetectionStrategy } from '@angular/core';
import { InViewDirective } from '../../../shared/directives/in-view.directive';

@Component({
  selector: 'iq-pillars-section',
  standalone: true,
  imports: [InViewDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section id="motor" class="section" iqInView>
      <span class="overline volt">IQ-COGNIT™</span>
      <h2>Motor proprietário com calibração setorial.</h2>
      <p class="sub">Score de 0 a 100 baseado em 3 pilares com pesos dinâmicos por setor.</p>

      <div class="pillars-grid">
        <div class="pillar-card glass">
          <i class="ph ph-chart-bar pillar-icon"></i>
          <h3>Quantitativo</h3>
          <p>Valuation, crescimento, rentabilidade, endividamento, Piotroski</p>
          <span class="weight label">Peso dinâmico: 25-45%</span>
        </div>
        <div class="pillar-card glass">
          <i class="ph ph-brain pillar-icon"></i>
          <h3>Qualitativo</h3>
          <p>Governança, track record, moat, gestão, risco regulatório</p>
          <span class="weight label">Peso dinâmico: 15-40%</span>
        </div>
        <div class="pillar-card glass">
          <i class="ph ph-scales pillar-icon"></i>
          <h3>Valuation</h3>
          <p>DCF, Gordon, Múltiplos, Monte Carlo</p>
          <span class="weight label">Peso dinâmico: 30-60%</span>
        </div>
      </div>

      <p class="stats overline">9 clusters · 4 regimes macro · 298+ ações analisadas diariamente</p>
    </section>
  `,
  styles: [`
    .section { padding: 100px 32px; text-align: center; background: #050505; }
    .section.in-view .pillars-grid { opacity: 1; transform: translateY(0); }
    .volt { color: #d0f364; }
    h2 { font-family: var(--font-ui); font-size: 32px; font-weight: 700; color: #F8FAFC; margin: 12px 0; }
    .sub { font-size: 16px; color: #A0A8B8; max-width: 600px; margin: 0 auto 40px; }
    .pillars-grid {
      display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; max-width: 900px; margin: 0 auto;
      opacity: 0; transform: translateY(30px); transition: all 500ms ease-out;
    }
    .pillar-card { padding: 28px 20px; border-radius: 4px; text-align: left; display: flex; flex-direction: column; gap: 8px; }
    .pillar-icon { font-size: 28px; color: #d0f364; }
    h3 { font-family: var(--font-ui); font-size: 16px; font-weight: 700; color: #F8FAFC; }
    .pillar-card p { font-size: 13px; color: #A0A8B8; line-height: 1.5; }
    .weight { color: #606878; }
    .stats { color: #606878; margin-top: 32px; }
    @media (max-width: 700px) { .pillars-grid { grid-template-columns: 1fr; } }
  `]
})
export class PillarsSectionComponent {}
