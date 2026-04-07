import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { DecimalPipe } from '@angular/common';

export interface DividendSummary {
  total_12m: number;
  avg_yield: number;
  last_payment: string;
}

@Component({
  selector: 'iq-portfolio-dividends',
  standalone: true,
  imports: [DecimalPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="panel glass">
      <span class="overline">DIVIDENDOS DA CARTEIRA (12M)</span>
      <div class="kpis">
        <div class="kpi">
          <span class="kpi-label label">Total Recebido</span>
          <span class="kpi-value mono volt-glow">R$ {{ summary().total_12m | number:'1.2-2' }}</span>
        </div>
        <div class="kpi">
          <span class="kpi-label label">DY Médio</span>
          <span class="kpi-value mono">{{ (summary().avg_yield * 100) | number:'1.1-1' }}%</span>
        </div>
        <div class="kpi">
          <span class="kpi-label label">Último Provento</span>
          <span class="kpi-value mono">{{ summary().last_payment || '--' }}</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .panel { padding: 16px; display: flex; flex-direction: column; gap: 12px; border-radius: var(--radius); }
    .kpis { display: flex; gap: 24px; }
    .kpi { display: flex; flex-direction: column; gap: 2px; }
    .kpi-label { color: var(--t4); }
    .kpi-value { font-size: 18px; font-weight: 700; color: var(--t1); }
    .volt-glow { color: var(--volt); text-shadow: var(--volt-glow); }
  `]
})
export class PortfolioDividendsComponent {
  summary = input.required<DividendSummary>();
}
