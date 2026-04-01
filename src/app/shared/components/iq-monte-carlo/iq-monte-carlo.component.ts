import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';

export interface MonteCarloScenarios {
  bear: number;
  base: number;
  bull: number;
}

const W = 600;
const H = 260;
const PAD = { top: 20, right: 20, bottom: 30, left: 50 };

@Component({
  selector: 'iq-monte-carlo',
  standalone: true,
  template: `
    <svg [attr.viewBox]="'0 0 ' + width + ' ' + height" class="mc" preserveAspectRatio="xMidYMid meet">
      <!-- distribution curve (simplified bell) -->
      <path [attr.d]="curvePath()" fill="var(--obsidian-bg)" stroke="var(--obsidian)" stroke-width="1.5" />
      <!-- bear zone -->
      <rect [attr.x]="bearX()" [attr.y]="padTop" [attr.width]="baseX() - bearX()" [attr.height]="plotH()" fill="var(--negative-bg)" opacity="0.5" />
      <!-- bull zone -->
      <rect [attr.x]="baseX()" [attr.y]="padTop" [attr.width]="bullX() - baseX()" [attr.height]="plotH()" fill="var(--positive-bg)" opacity="0.5" />
      <!-- current price line -->
      <line [attr.x1]="currentX()" [attr.y1]="padTop" [attr.x2]="currentX()" [attr.y2]="padTop + plotH()" stroke="var(--obsidian)" stroke-width="2" stroke-dasharray="4,2" />
      <text [attr.x]="currentX()" [attr.y]="padTop - 6" class="mc__label" text-anchor="middle" font-weight="600">Atual</text>
      <!-- markers -->
      @for (m of markers(); track m.label) {
        <line [attr.x1]="m.x" [attr.y1]="padTop + plotH()" [attr.x2]="m.x" [attr.y2]="padTop + plotH() + 6" [attr.stroke]="m.color" stroke-width="1.5" />
        <text [attr.x]="m.x" [attr.y]="padTop + plotH() + 16" class="mc__label" text-anchor="middle" [attr.fill]="m.color">{{ m.label }}</text>
        <text [attr.x]="m.x" [attr.y]="padTop + plotH() + 26" class="mc__value" text-anchor="middle">{{ m.valueStr }}</text>
      }
    </svg>
  `,
  styles: [`
    .mc { width: 100%; }
    .mc__label { font-size: 11px; fill: var(--text-secondary); font-family: 'Satoshi', sans-serif; }
    .mc__value { font-size: 12px; fill: var(--text-primary); font-family: 'IBM Plex Mono', monospace; font-weight: 600; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IqMonteCarloComponent {
  readonly scenarios = input.required<MonteCarloScenarios>();
  readonly currentPrice = input(0);

  readonly width = W;
  readonly height = H;
  readonly padTop = PAD.top;

  readonly plotH = computed(() => H - PAD.top - PAD.bottom);

  private readonly scaleMin = computed(() => Math.min(this.scenarios().bear, this.currentPrice()) * 0.85);
  private readonly scaleMax = computed(() => Math.max(this.scenarios().bull, this.currentPrice()) * 1.15);
  private readonly range = computed(() => this.scaleMax() - this.scaleMin() || 1);

  private toX(v: number): number {
    return PAD.left + ((v - this.scaleMin()) / this.range()) * (W - PAD.left - PAD.right);
  }

  readonly bearX = computed(() => this.toX(this.scenarios().bear));
  readonly baseX = computed(() => this.toX(this.scenarios().base));
  readonly bullX = computed(() => this.toX(this.scenarios().bull));
  readonly currentX = computed(() => this.toX(this.currentPrice()));

  readonly markers = computed(() => {
    const s = this.scenarios();
    return [
      { label: 'Bear', x: this.bearX(), color: 'var(--negative)', valueStr: s.bear.toFixed(2) },
      { label: 'Base', x: this.baseX(), color: 'var(--obsidian)', valueStr: s.base.toFixed(2) },
      { label: 'Bull', x: this.bullX(), color: 'var(--positive)', valueStr: s.bull.toFixed(2) },
    ];
  });

  curvePath(): string {
    const ph = this.plotH();
    const bx = this.bearX();
    const mx = this.baseX();
    const ux = this.bullX();
    const top = PAD.top;
    const bottom = top + ph;
    return `M${bx},${bottom} Q${(bx + mx) / 2},${top} ${mx},${top + 10} Q${(mx + ux) / 2},${top} ${ux},${bottom} Z`;
  }
}
