import { Component, ChangeDetectionStrategy, inject, input, signal, OnInit } from '@angular/core';
import { DecimalPipe, PercentPipe } from '@angular/common';
import { ApiService } from '../../../core/services/api.service';

interface ValuationData {
  current_price: number;
  fair_value_final: number | null;
  fair_value_dcf: number | null;
  fair_value_gordon: number | null;
  fair_value_mult: number | null;
  safety_margin: number | null;
}

interface ScenarioData {
  scenarios: {
    bear: { fair_value: number | null; description: string };
    base: { fair_value: number | null; description: string };
    bull: { fair_value: number | null; description: string };
  };
}

@Component({
  selector: 'iq-tab-valuation',
  standalone: true,
  imports: [DecimalPipe, PercentPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="val-tab">
      @if (valuation(); as v) {
        <div class="methods-grid">
          @for (m of methods(); track m.label) {
            <div class="method-card card">
              <span class="overline">{{ m.label }}</span>
              <span class="method-price mono">{{ m.value != null ? 'R$ ' + (m.value | number:'1.2-2') : '--' }}</span>
              @if (m.value != null && v.current_price) {
                <span class="method-upside mono"
                      [class.pos]="m.value > v.current_price"
                      [class.neg]="m.value <= v.current_price">
                  {{ ((m.value - v.current_price) / v.current_price) | percent:'1.0-0' }}
                </span>
              }
            </div>
          }
        </div>

        <div class="consensus card">
          <span class="overline">PREÇO JUSTO CONSENSO</span>
          <span class="consensus-price mono">{{ v.fair_value_final != null ? 'R$ ' + (v.fair_value_final | number:'1.2-2') : '--' }}</span>
          <span class="consensus-margin mono"
                [class.pos]="v.safety_margin != null && v.safety_margin > 0"
                [class.neg]="v.safety_margin != null && v.safety_margin < 0">
            Margem: {{ v.safety_margin != null ? (v.safety_margin | percent:'1.1-1') : '--' }}
          </span>
        </div>
      }

      @if (scenarios(); as s) {
        <div class="scenarios">
          <span class="overline">CENÁRIOS MONTE CARLO</span>
          <div class="scenario-grid">
            <div class="scenario-card card">
              <span class="label neg">Bear</span>
              <span class="scenario-val mono">{{ s.scenarios.bear.fair_value != null ? 'R$ ' + (s.scenarios.bear.fair_value | number:'1.2-2') : '--' }}</span>
              <span class="scenario-desc">{{ s.scenarios.bear.description }}</span>
            </div>
            <div class="scenario-card card">
              <span class="label warn">Base</span>
              <span class="scenario-val mono">{{ s.scenarios.base.fair_value != null ? 'R$ ' + (s.scenarios.base.fair_value | number:'1.2-2') : '--' }}</span>
              <span class="scenario-desc">{{ s.scenarios.base.description }}</span>
            </div>
            <div class="scenario-card card">
              <span class="label pos">Bull</span>
              <span class="scenario-val mono">{{ s.scenarios.bull.fair_value != null ? 'R$ ' + (s.scenarios.bull.fair_value | number:'1.2-2') : '--' }}</span>
              <span class="scenario-desc">{{ s.scenarios.bull.description }}</span>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .val-tab { display: flex; flex-direction: column; gap: 20px; }
    .methods-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 10px; }
    .method-card { padding: 14px; display: flex; flex-direction: column; gap: 6px; }
    .method-price { font-size: 18px; font-weight: 700; color: var(--t1); }
    .method-upside { font-size: 12px; font-weight: 600; }
    .consensus { padding: 16px; display: flex; flex-direction: column; gap: 6px; align-items: center; }
    .consensus-price { font-size: 24px; font-weight: 700; color: var(--t1); }
    .consensus-margin { font-size: 14px; font-weight: 600; }
    .scenarios { display: flex; flex-direction: column; gap: 10px; }
    .scenario-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; }
    .scenario-card { padding: 12px; display: flex; flex-direction: column; gap: 4px; }
    .scenario-val { font-size: 16px; font-weight: 700; color: var(--t1); }
    .scenario-desc { font-size: 10px; color: var(--t3); }
  `]
})
export class TabValuationComponent implements OnInit {
  private readonly api = inject(ApiService);
  ticker = input.required<string>();

  readonly valuation = signal<ValuationData | null>(null);
  readonly scenarios = signal<ScenarioData | null>(null);

  readonly methods = () => {
    const v = this.valuation();
    if (!v) return [];
    return [
      { label: 'DCF', value: v.fair_value_dcf },
      { label: 'GORDON', value: v.fair_value_gordon },
      { label: 'MÚLTIPLOS', value: v.fair_value_mult },
      { label: 'CONSENSO', value: v.fair_value_final },
    ];
  };

  ngOnInit(): void {
    const t = this.ticker();
    this.api.get<ValuationData>(`/valuation/${t}`).subscribe({ next: d => this.valuation.set(d) });
    this.api.get<ScenarioData>(`/valuation/${t}/scenarios`).subscribe({ next: d => this.scenarios.set(d), error: () => {} });
  }
}
