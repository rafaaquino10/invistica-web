import { Component, ChangeDetectionStrategy } from '@angular/core';
import { InViewDirective } from '../../../shared/directives/in-view.directive';

@Component({
  selector: 'iq-how-it-works',
  standalone: true,
  imports: [InViewDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section id="como" class="section" iqInView>
      <span class="overline volt">COMO FUNCIONA</span>
      <div class="steps">
        <div class="step">
          <div class="step-icon"><i class="ph ph-link"></i></div>
          <h3>Conecte</h3>
          <p>Importe sua carteira via Open Finance ou adicione manualmente</p>
        </div>
        <div class="step-line"></div>
        <div class="step">
          <div class="step-icon"><i class="ph ph-magnifying-glass"></i></div>
          <h3>Analise</h3>
          <p>O motor processa 298+ ações com inteligência quantamental</p>
        </div>
        <div class="step-line"></div>
        <div class="step">
          <div class="step-icon"><i class="ph ph-target"></i></div>
          <h3>Decida</h3>
          <p>Recomendações prescritivas e sinais claros de ação</p>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .section { padding: 80px 32px; text-align: center; background: #0A0C14; }
    .section.in-view .steps { opacity: 1; transform: translateY(0); }
    .volt { color: #d0f364; }
    .steps {
      display: flex; align-items: center; justify-content: center; gap: 0; max-width: 800px; margin: 40px auto 0;
      opacity: 0; transform: translateY(30px); transition: all 500ms ease-out;
    }
    .step { display: flex; flex-direction: column; align-items: center; gap: 10px; flex: 1; }
    .step-icon { width: 56px; height: 56px; border-radius: 4px; background: rgba(208,243,100,0.08); display: flex; align-items: center; justify-content: center; }
    .step-icon i { font-size: 24px; color: #d0f364; }
    h3 { font-family: var(--font-ui); font-size: 16px; font-weight: 700; color: #F8FAFC; }
    p { font-size: 13px; color: #A0A8B8; line-height: 1.5; max-width: 200px; }
    .step-line { width: 60px; height: 1px; background: repeating-linear-gradient(90deg, #383E4A 0 4px, transparent 4px 8px); flex-shrink: 0; margin-top: -30px; }
    @media (max-width: 600px) { .steps { flex-direction: column; } .step-line { width: 1px; height: 30px; background: repeating-linear-gradient(180deg, #383E4A 0 4px, transparent 4px 8px); margin: 0; } }
  `]
})
export class HowItWorksComponent {}
