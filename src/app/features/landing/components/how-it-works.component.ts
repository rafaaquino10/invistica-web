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
        @for (s of steps; track s.title; let i = $index) {
          <div class="step">
            <div class="step-num mono">{{ i + 1 }}</div>
            <div class="step-icon"><i class="ph ph-{{ s.icon }}"></i></div>
            <h3>{{ s.title }}</h3>
            <p>{{ s.desc }}</p>
          </div>
          @if (i < steps.length - 1) { <div class="step-line"></div> }
        }
      </div>
    </section>
  `,
  styles: [`
    .section { padding: 80px 48px; text-align: center; background: #050505; }
    .section.in-view .steps { opacity: 1; transform: translateY(0); }
    .volt { color: #d0f364; }
    .steps { display: flex; align-items: flex-start; justify-content: center; max-width: 800px; margin: 40px auto 0; opacity: 0; transform: translateY(30px); transition: all 500ms ease-out; }
    .step { display: flex; flex-direction: column; align-items: center; gap: 10px; flex: 1; padding: 0 16px; }
    .step-num { font-size: 10px; font-weight: 700; color: #d0f364; background: rgba(208,243,100,0.08); width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
    .step-icon { width: 56px; height: 56px; border-radius: 4px; background: rgba(208,243,100,0.06); display: flex; align-items: center; justify-content: center; }
    .step-icon i { font-size: 24px; color: #d0f364; }
    h3 { font-family: var(--font-ui); font-size: 16px; font-weight: 700; color: #F8FAFC; }
    p { font-size: 13px; color: #A0A8B8; line-height: 1.5; max-width: 200px; }
    .step-line { width: 48px; height: 1px; background: repeating-linear-gradient(90deg, #383E4A 0 4px, transparent 4px 8px); flex-shrink: 0; margin-top: 48px; }
    @media (max-width: 600px) { .steps { flex-direction: column; gap: 24px; } .step-line { display: none; } }
  `]
})
export class HowItWorksComponent {
  readonly steps = [
    { icon: 'link', title: 'Conecte', desc: 'Importe sua carteira via Open Finance ou adicione manualmente' },
    { icon: 'magnifying-glass', title: 'Analise', desc: 'O motor processa 298+ ações com inteligência quantamental' },
    { icon: 'target', title: 'Decida', desc: 'Recomendações prescritivas e sinais claros de ação' },
  ];
}
