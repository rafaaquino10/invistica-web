import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';

export interface MonteCarloScenarios {
  bear: number;
  base: number;
  bull: number;
}

@Component({
  selector: 'iq-monte-carlo',
  standalone: true,
  template: `
    <div class="mc">
      <!-- SCALE BAR -->
      <div class="mc__bar">
        <div class="mc__zone mc__zone--bear" [style.width.%]="bearPct()"></div>
        <div class="mc__zone mc__zone--base" [style.width.%]="basePct()"></div>
        <div class="mc__zone mc__zone--bull" [style.width.%]="bullPct()"></div>
        <!-- Current price marker -->
        <div class="mc__marker" [style.left.%]="currentPct()">
          <div class="mc__marker-line"></div>
          <span class="mc__marker-label mono">Atual R$ {{ currentPrice().toFixed(2) }}</span>
        </div>
      </div>

      <!-- LABELS -->
      <div class="mc__labels">
        <div class="mc__label mc__label--bear">
          <span class="mc__label-name">Bear</span>
          <span class="mc__label-val mono">R$ {{ scenarios().bear.toFixed(2) }}</span>
        </div>
        <div class="mc__label mc__label--base">
          <span class="mc__label-name">Base</span>
          <span class="mc__label-val mono">R$ {{ scenarios().base.toFixed(2) }}</span>
        </div>
        <div class="mc__label mc__label--bull">
          <span class="mc__label-name">Bull</span>
          <span class="mc__label-val mono">R$ {{ scenarios().bull.toFixed(2) }}</span>
        </div>
      </div>

      <!-- UPSIDE/DOWNSIDE -->
      <div class="mc__metrics">
        <div class="mc__metric">
          <span class="mc__metric-label">Downside (bear)</span>
          <span class="mc__metric-val mono negative">{{ downsidePct() }}</span>
        </div>
        <div class="mc__metric">
          <span class="mc__metric-label">Upside (base)</span>
          <span class="mc__metric-val mono" [class.positive]="baseUpside() >= 0" [class.negative]="baseUpside() < 0">{{ basePctLabel() }}</span>
        </div>
        <div class="mc__metric">
          <span class="mc__metric-label">Upside (bull)</span>
          <span class="mc__metric-val mono positive">{{ upsidePct() }}</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .mc { display: flex; flex-direction: column; gap: 16px; }

    .mc__bar {
      position: relative; display: flex; height: 32px; border-radius: var(--radius); overflow: visible;
      border: 1px solid var(--border-default);
    }
    .mc__zone { height: 100%; }
    .mc__zone--bear { background: var(--negative-bg); }
    .mc__zone--base { background: var(--obsidian-bg); }
    .mc__zone--bull { background: var(--positive-bg); }

    .mc__marker {
      position: absolute; top: -8px; bottom: -8px; transform: translateX(-50%);
      display: flex; flex-direction: column; align-items: center;
    }
    .mc__marker-line {
      width: 2px; flex: 1; background: var(--obsidian); border-radius: 1px;
    }
    .mc__marker-label {
      font-size: 11px; font-weight: 600; color: var(--obsidian);
      white-space: nowrap; margin-top: 4px;
    }

    .mc__labels {
      display: flex; justify-content: space-between;
    }
    .mc__label { display: flex; flex-direction: column; gap: 2px; }
    .mc__label--bear { align-items: flex-start; }
    .mc__label--base { align-items: center; }
    .mc__label--bull { align-items: flex-end; }
    .mc__label-name { font-size: 11px; color: var(--text-tertiary); font-weight: 500; }
    .mc__label-val { font-size: 14px; font-weight: 700; color: var(--text-primary); }
    .mc__label--bear .mc__label-val { color: var(--negative); }
    .mc__label--bull .mc__label-val { color: var(--positive); }

    .mc__metrics {
      display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1px;
      background: var(--border-default); border: 1px solid var(--border-default);
      border-radius: var(--radius); overflow: hidden;
    }
    .mc__metric {
      display: flex; flex-direction: column; gap: 2px; padding: 10px 14px;
      background: var(--surface-0); text-align: center;
    }
    .mc__metric-label { font-size: 11px; color: var(--text-tertiary); }
    .mc__metric-val { font-size: 15px; font-weight: 700; }

    .positive { color: var(--positive); }
    .negative { color: var(--negative); }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IqMonteCarloComponent {
  readonly scenarios = input.required<MonteCarloScenarios>();
  readonly currentPrice = input(0);

  private readonly min = computed(() => Math.min(this.scenarios().bear, this.currentPrice()) * 0.9);
  private readonly max = computed(() => Math.max(this.scenarios().bull, this.currentPrice()) * 1.1);
  private readonly range = computed(() => this.max() - this.min() || 1);

  private toPct(v: number): number {
    return ((v - this.min()) / this.range()) * 100;
  }

  readonly bearPct = computed(() => this.toPct(this.scenarios().bear));
  readonly basePct = computed(() => this.toPct(this.scenarios().base) - this.bearPct());
  readonly bullPct = computed(() => 100 - this.toPct(this.scenarios().base));
  readonly currentPct = computed(() => this.toPct(this.currentPrice()));

  readonly baseUpside = computed(() => {
    const cp = this.currentPrice();
    return cp > 0 ? (this.scenarios().base - cp) / cp : 0;
  });

  readonly downsidePct = computed(() => {
    const cp = this.currentPrice();
    const d = cp > 0 ? ((this.scenarios().bear - cp) / cp) * 100 : 0;
    return d.toFixed(1) + '%';
  });

  readonly basePctLabel = computed(() => {
    const v = this.baseUpside() * 100;
    return (v >= 0 ? '+' : '') + v.toFixed(1) + '%';
  });

  readonly upsidePct = computed(() => {
    const cp = this.currentPrice();
    const u = cp > 0 ? ((this.scenarios().bull - cp) / cp) * 100 : 0;
    return '+' + u.toFixed(1) + '%';
  });
}
