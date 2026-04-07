import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { ApiService } from '../../../core/services/api.service';
import { InViewDirective } from '../../../shared/directives/in-view.directive';
import { PillarBarComponent } from '../../../shared/components/pillar-bar/pillar-bar.component';

interface TopAsset { ticker: string; company_name: string; iq_score: number; }
interface Breakdown {
  iq_score: number; score_quanti: number;
  sub_scores: { valuation: { score: number | null }; quality: { score: number | null }; risk: { score: number | null }; dividends: { score: number | null }; growth: { score: number | null }; momentum: { score: number | null } };
}
interface Thesis { bull_case: string[]; bear_case: string[]; }

@Component({
  selector: 'iq-motor-demo',
  standalone: true,
  imports: [InViewDirective, PillarBarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section id="motor" class="section" iqInView>
      <span class="overline volt">IQ-COGNIT™</span>
      <h2>Motor proprietário com calibração setorial.</h2>
      <p class="sub">Score de 0 a 100 baseado em pilares com pesos dinâmicos por setor.</p>

      @if (ticker()) {
        <div class="demo-grid">
          <!-- Col 1: Score breakdown -->
          <div class="demo-card glass">
            <div class="demo-header">
              <img class="demo-logo" [src]="'https://raw.githubusercontent.com/StatusInvest/Content/master/img/company/' + ticker() + '.jpg'" [alt]="ticker()" (error)="$any($event.target).style.display='none'" />
              <div class="demo-ident">
                <span class="demo-ticker mono">{{ ticker() }}</span>
                <span class="demo-name">{{ companyName() }}</span>
              </div>
              <span class="demo-score mono" [style.color]="score() >= 82 ? '#d0f364' : score() >= 70 ? '#34D399' : '#F59E0B'">{{ score() }}</span>
            </div>
            @if (breakdown()) {
              <div class="pillars-list">
                <iq-pillar-bar name="Valuation" [score]="breakdown()!.sub_scores.valuation.score" />
                <iq-pillar-bar name="Qualidade" [score]="breakdown()!.sub_scores.quality.score" />
                <iq-pillar-bar name="Risco" [score]="breakdown()!.sub_scores.risk.score" />
                <iq-pillar-bar name="Dividendos" [score]="breakdown()!.sub_scores.dividends.score" />
                <iq-pillar-bar name="Crescimento" [score]="breakdown()!.sub_scores.growth.score" />
                <iq-pillar-bar name="Momentum" [score]="breakdown()!.sub_scores.momentum.score" />
              </div>
            }
            <span class="demo-footnote">Indicadores avaliados. Pesos calibrados por setor.</span>
          </div>

          <!-- Col 2: Pillars -->
          <div class="pillars-col">
            <div class="pillar-card glass">
              <i class="ph ph-chart-bar p-icon"></i>
              <h3>Quantitativo</h3>
              <p>Valuation, crescimento, rentabilidade, Piotroski</p>
              <span class="p-weight">Peso dinâmico: 25-45%</span>
            </div>
            <div class="pillar-card glass">
              <i class="ph ph-brain p-icon"></i>
              <h3>Qualitativo</h3>
              <p>Governança, track record, moat, risco regulatório</p>
              <span class="p-weight">Peso dinâmico: 15-40%</span>
            </div>
            <div class="pillar-card glass">
              <i class="ph ph-scales p-icon"></i>
              <h3>Valuation</h3>
              <p>DCF, Gordon, Múltiplos, Monte Carlo</p>
              <span class="p-weight">Peso dinâmico: 30-60%</span>
            </div>
          </div>

          <!-- Col 3: Drivers -->
          <div class="drivers-card glass">
            <h3>O que está impulsionando o score.</h3>
            @if (thesis()) {
              @for (p of thesis()!.bull_case.slice(0,4); track $index) {
                <div class="driver pos"><i class="ph-fill ph-check-circle"></i><span>{{ p }}</span></div>
              }
              @for (p of thesis()!.bear_case.slice(0,3); track $index) {
                <div class="driver neg"><i class="ph-fill ph-x-circle"></i><span>{{ p }}</span></div>
              }
            }
            <span class="demo-footnote">Entenda os motivos por trás de cada score.</span>
          </div>
        </div>
      }

      <p class="stats">9 clusters · 4 regimes macro · 298+ ações analisadas diariamente</p>
    </section>
  `,
  styles: [`
    .section { padding: 100px 48px; background: #050505; text-align: center; }
    .section.in-view .demo-grid { opacity: 1; transform: translateY(0); }
    .volt { color: #d0f364; }
    h2 { font-family: var(--font-ui); font-size: 32px; font-weight: 700; color: #F8FAFC; margin: 12px 0; }
    .sub { font-size: 16px; color: #A0A8B8; max-width: 560px; margin: 0 auto 40px; }
    .demo-grid {
      display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; max-width: 1100px; margin: 0 auto;
      text-align: left; opacity: 0; transform: translateY(30px); transition: all 600ms ease-out;
    }
    .demo-card, .drivers-card { padding: 20px; border-radius: 4px; display: flex; flex-direction: column; gap: 12px; }
    .demo-header { display: flex; align-items: center; gap: 10px; }
    .demo-logo { width: 32px; height: 32px; border-radius: 4px; object-fit: cover; }
    .demo-ident { flex: 1; display: flex; flex-direction: column; }
    .demo-ticker { font-size: 14px; font-weight: 700; color: #F8FAFC; }
    .demo-name { font-family: var(--font-ui); font-size: 10px; color: #606878; }
    .demo-score { font-size: 32px; font-weight: 700; text-shadow: 0 0 16px rgba(208,243,100,0.25); }
    .pillars-list { display: flex; flex-direction: column; gap: 10px; }
    .demo-footnote { font-family: var(--font-ui); font-size: 10px; color: #383E4A; }
    .pillars-col { display: flex; flex-direction: column; gap: 12px; }
    .pillar-card { padding: 16px; border-radius: 4px; display: flex; flex-direction: column; gap: 6px; }
    .p-icon { font-size: 20px; color: #d0f364; }
    h3 { font-family: var(--font-ui); font-size: 14px; font-weight: 700; color: #F8FAFC; }
    .pillar-card p { font-size: 12px; color: #A0A8B8; line-height: 1.4; }
    .p-weight { font-family: var(--font-ui); font-size: 10px; color: #606878; }
    .drivers-card h3 { font-size: 14px; margin-bottom: 4px; }
    .driver { display: flex; align-items: flex-start; gap: 8px; font-size: 12px; color: #A0A8B8; line-height: 1.4; }
    .driver i { font-size: 14px; flex-shrink: 0; margin-top: 1px; }
    .driver.pos i { color: #34D399; }
    .driver.neg i { color: #EF4444; }
    .stats { font-family: var(--font-ui); font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #606878; margin-top: 40px; }
    @media (max-width: 900px) { .demo-grid { grid-template-columns: 1fr; } }
  `]
})
export class MotorDemoComponent implements OnInit {
  private readonly api = inject(ApiService);
  readonly ticker = signal('');
  readonly companyName = signal('');
  readonly score = signal(0);
  readonly breakdown = signal<Breakdown | null>(null);
  readonly thesis = signal<Thesis | null>(null);

  ngOnInit(): void {
    this.api.get<{ top: TopAsset[] }>('/scores/top', { limit: 1 }).subscribe({
      next: d => {
        const asset = d.top?.[0];
        if (!asset) return;
        this.ticker.set(asset.ticker);
        this.companyName.set(asset.company_name);
        this.score.set(asset.iq_score);
        this.api.get<Breakdown>(`/scores/${asset.ticker}/breakdown`).subscribe({ next: b => this.breakdown.set(b) });
        this.api.get<Thesis>(`/scores/${asset.ticker}/thesis`).subscribe({ next: t => this.thesis.set(t) });
      },
    });
  }
}
