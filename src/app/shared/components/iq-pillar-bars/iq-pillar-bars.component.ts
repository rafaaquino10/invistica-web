import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';

export interface PillarWeights {
  quanti: number;
  quali: number;
  valuation: number;
}

@Component({
  selector: 'iq-pillar-bars',
  standalone: true,
  template: `
    <div class="pillars">
      @for (p of pillars(); track p.label) {
        <div class="pillars__row">
          <span class="pillars__label">{{ p.label }}</span>
          <div class="pillars__track">
            <div class="pillars__fill" [style.width.%]="p.score" [style.background]="p.color"></div>
          </div>
          <span class="pillars__score mono">{{ p.score }}</span>
          <span class="pillars__weight mono">{{ (p.weight * 100).toFixed(0) }}%</span>
        </div>
      }
    </div>
  `,
  styles: [`
    .pillars { display: flex; flex-direction: column; gap: 10px; }
    .pillars__row { display: flex; align-items: center; gap: 8px; }
    .pillars__label { width: 80px; font-size: 0.75rem; color: var(--text-secondary); flex-shrink: 0; }
    .pillars__track { flex: 1; height: 8px; background: var(--surface-3); border-radius: var(--radius); overflow: hidden; }
    .pillars__fill { height: 100%; border-radius: var(--radius); transition: width 0.6s var(--ease); }
    .pillars__score { font-size: 0.75rem; font-weight: 600; color: var(--text-primary); min-width: 24px; text-align: right; }
    .pillars__weight { font-size: 0.6875rem; color: var(--text-tertiary); min-width: 30px; text-align: right; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IqPillarBarsComponent {
  readonly quanti = input(0);
  readonly quali = input(0);
  readonly valuation = input(0);
  readonly weights = input<PillarWeights>({ quanti: 0.33, quali: 0.33, valuation: 0.34 });

  readonly pillars = computed(() => {
    const w = this.weights();
    return [
      { label: 'Quantitativo', score: this.quanti(), weight: w.quanti, color: this.barColor(this.quanti()) },
      { label: 'Qualitativo', score: this.quali(), weight: w.quali, color: this.barColor(this.quali()) },
      { label: 'Valuation', score: this.valuation(), weight: w.valuation, color: this.barColor(this.valuation()) },
    ];
  });

  private barColor(score: number): string {
    if (score > 75) return 'var(--positive)';
    if (score < 40) return 'var(--negative)';
    return 'var(--obsidian)';
  }
}
