import { Component, ChangeDetectionStrategy } from '@angular/core';
import { InViewDirective } from '../../../shared/directives/in-view.directive';

@Component({
  selector: 'iq-vision-section',
  standalone: true,
  imports: [InViewDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section id="visao" class="section" iqInView>
      <span class="overline volt">VISÃO</span>
      <div class="timeline">
        <div class="tl-item active"><div class="tl-dot"></div><span class="tl-stage">HOJE</span><span class="tl-label">Plataforma</span></div>
        <div class="tl-line"></div>
        <div class="tl-item"><div class="tl-dot"></div><span class="tl-stage">AMANHÃ</span><span class="tl-label">Clube</span></div>
        <div class="tl-line"></div>
        <div class="tl-item"><div class="tl-dot"></div><span class="tl-stage">FUTURO</span><span class="tl-label">Fundo</span></div>
      </div>
      <p class="quote">A marca que você conhece hoje será o fundo de amanhã.</p>
    </section>
  `,
  styles: [`
    .section { padding: 100px 48px; text-align: center; background: #0A0C14; }
    .section.in-view .timeline { opacity: 1; transform: translateY(0); }
    .volt { color: #d0f364; }
    .timeline { display: flex; align-items: center; justify-content: center; margin: 40px 0; opacity: 0; transform: translateY(20px); transition: all 500ms ease-out; }
    .tl-item { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 0 28px; }
    .tl-dot { width: 12px; height: 12px; border-radius: 50%; background: #383E4A; }
    .tl-item.active .tl-dot { background: #d0f364; box-shadow: 0 0 12px rgba(208,243,100,0.4); }
    .tl-stage { font-family: var(--font-ui); font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #606878; }
    .tl-item.active .tl-stage { color: #d0f364; }
    .tl-label { font-family: var(--font-ui); font-size: 18px; font-weight: 700; color: #F8FAFC; }
    .tl-item:not(.active) .tl-label { color: #606878; }
    .tl-line { width: 80px; height: 1px; background: #383E4A; margin-top: -20px; }
    .quote { font-family: var(--font-ui); font-size: 16px; color: #A0A8B8; font-style: italic; max-width: 460px; margin: 0 auto; }
  `]
})
export class VisionSectionComponent {}
