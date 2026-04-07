import { Component, ChangeDetectionStrategy } from '@angular/core';
import { ContextStripComponent } from './components/context-strip.component';
import { RecommendedPortfolioComponent } from './components/recommended-portfolio.component';
import { ActionSignalsComponent } from './components/action-signals.component';
import { ShortCandidatesComponent } from './components/short-candidates.component';
import { CatalystsPanelComponent } from './components/catalysts-panel.component';

@Component({
  selector: 'iq-decide',
  standalone: true,
  imports: [
    ContextStripComponent,
    RecommendedPortfolioComponent,
    ActionSignalsComponent,
    ShortCandidatesComponent,
    CatalystsPanelComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="decide-page">
      <h1>Decidir</h1>

      <!-- CAMADA 1: Contexto -->
      <iq-context-strip />

      <!-- CAMADA 2: Recomendação principal -->
      <div class="main-grid">
        <iq-recommended-portfolio class="col-reco" />
        <iq-action-signals class="col-signals" />
      </div>

      <!-- CAMADA 3: Inteligência complementar -->
      <div class="support-grid">
        <iq-short-candidates />
        <iq-catalysts-panel />
      </div>
    </div>
  `,
  styles: [`
    .decide-page { display: flex; flex-direction: column; gap: 16px; }
    h1 { font-family: var(--font-ui); font-size: 21px; font-weight: 700; color: var(--t1); }
    .main-grid { display: grid; grid-template-columns: 3fr 2fr; gap: 16px; align-items: start; }
    .support-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  `]
})
export class DecideComponent {}
