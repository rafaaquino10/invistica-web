import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';

@Component({
  selector: 'iq-fair-value-bar',
  standalone: true,
  template: `
    <div class="fvb">
      <div class="fvb__labels">
        <span class="fvb__lbl">P25</span>
        <span class="fvb__lbl">Justo</span>
        <span class="fvb__lbl">P75</span>
      </div>
      <div class="fvb__track">
        <div class="fvb__range" [style.left.%]="rangeLeft()" [style.width.%]="rangeWidth()"></div>
        <div class="fvb__fair" [style.left.%]="fairPct()">
          <span class="fvb__fair-line"></span>
        </div>
        <div class="fvb__current" [style.left.%]="currentPct()"
             [class.fvb__current--over]="currentPrice() > fairValue()"
             [class.fvb__current--under]="currentPrice() <= fairValue()">
          <span class="fvb__current-dot"></span>
        </div>
      </div>
      <div class="fvb__values">
        <span class="mono">{{ p25()?.toFixed(2) }}</span>
        <span class="mono" style="font-weight:600">{{ fairValue().toFixed(2) }}</span>
        <span class="mono">{{ p75()?.toFixed(2) }}</span>
      </div>
      <div class="fvb__price">
        Atual: <span class="mono" [style.color]="currentPrice() > fairValue() ? 'var(--negative)' : 'var(--positive)'"
                     style="font-weight:600">{{ currentPrice().toFixed(2) }}</span>
      </div>
    </div>
  `,
  styles: [`
    .fvb { width: 100%; }
    .fvb__labels, .fvb__values { display: flex; justify-content: space-between; font-size: 0.6875rem; color: var(--text-tertiary); }
    .fvb__values { margin-top: 4px; font-size: 0.75rem; }
    .fvb__track { position: relative; height: 8px; background: var(--surface-3); border-radius: var(--radius); margin: 6px 0; }
    .fvb__range { position: absolute; height: 100%; background: var(--obsidian-bg); border-radius: var(--radius); }
    .fvb__fair { position: absolute; top: -2px; width: 2px; height: 12px; background: var(--obsidian); transform: translateX(-50%); }
    .fvb__current { position: absolute; top: -4px; transform: translateX(-50%); }
    .fvb__current-dot { display: block; width: 10px; height: 16px; border-radius: var(--radius); }
    .fvb__current--over .fvb__current-dot { background: var(--negative); }
    .fvb__current--under .fvb__current-dot { background: var(--positive); }
    .fvb__price { margin-top: 6px; font-size: 0.75rem; color: var(--text-secondary); text-align: center; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IqFairValueBarComponent {
  readonly currentPrice = input(0);
  readonly fairValue = input(0);
  readonly p25 = input<number | null>(null);
  readonly p75 = input<number | null>(null);

  private readonly scaleMin = computed(() => Math.min(this.p25() ?? this.fairValue() * 0.5, this.currentPrice()) * 0.9);
  private readonly scaleMax = computed(() => Math.max(this.p75() ?? this.fairValue() * 1.5, this.currentPrice()) * 1.1);
  private readonly scaleRange = computed(() => this.scaleMax() - this.scaleMin() || 1);

  private toPct(v: number): number {
    return ((v - this.scaleMin()) / this.scaleRange()) * 100;
  }

  readonly rangeLeft = computed(() => this.toPct(this.p25() ?? this.fairValue() * 0.8));
  readonly rangeWidth = computed(() => this.toPct(this.p75() ?? this.fairValue() * 1.2) - this.rangeLeft());
  readonly fairPct = computed(() => this.toPct(this.fairValue()));
  readonly currentPct = computed(() => this.toPct(this.currentPrice()));
}
