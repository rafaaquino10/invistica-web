import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { DecimalPipe, PercentPipe } from '@angular/common';

export interface PortfolioPosition {
  ticker: string;
  quantity: number;
  avg_price: number;
  current_price?: number;
  current_value?: number;
  weight?: number;
  change_pct?: number;
}

export interface PortfolioData {
  positions: PortfolioPosition[];
  total_value: number;
  total_cost: number;
}

export interface IntradayData {
  portfolio_value?: number;
  change_pct?: number;
}

@Component({
  selector: 'iq-portfolio-panel',
  standalone: true,
  imports: [DecimalPipe, PercentPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="panel card">
      <div class="panel-header">
        <span class="overline">PORTFÓLIO</span>
      </div>

      <div class="patrimonio">
        <span class="patrimonio-value display">
          R$ {{ portfolio().total_value | number:'1.0-0' }}
        </span>
        @if (intraday(); as i) {
          <span class="intraday-change mono"
                [class.pos]="(i.change_pct || 0) >= 0"
                [class.neg]="(i.change_pct || 0) < 0">
            {{ (i.change_pct || 0) >= 0 ? '▲' : '▼' }}
            {{ (i.change_pct || 0) >= 0 ? '+' : '' }}{{ (i.change_pct || 0) | number:'1.2-2' }}%
          </span>
        }
      </div>

      <div class="positions-list">
        @for (pos of topPositions(); track pos.ticker) {
          <div class="pos-row">
            <span class="pos-ticker ticker">{{ pos.ticker }}</span>
            <span class="pos-weight mono">{{ (pos.weight || 0) | percent:'1.0-0' }}</span>
            <span class="pos-change mono"
                  [class.pos]="(pos.change_pct || 0) >= 0"
                  [class.neg]="(pos.change_pct || 0) < 0">
              {{ (pos.change_pct || 0) >= 0 ? '+' : '' }}{{ (pos.change_pct || 0) | number:'1.2-2' }}%
            </span>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .panel { padding: 16px; display: flex; flex-direction: column; gap: 12px; }
    .panel-header { display: flex; align-items: center; }
    .patrimonio { display: flex; flex-direction: column; gap: 4px; }
    .patrimonio-value { font-size: 28px; }
    .intraday-change { font-size: 14px; font-weight: 600; }
    .positions-list { display: flex; flex-direction: column; gap: 4px; }
    .pos-row {
      display: flex; align-items: center; gap: 8px;
      padding: 6px 8px; background: var(--bg-alt); border-radius: var(--radius);
    }
    .pos-ticker { flex: 1; }
    .pos-weight { font-size: 12px; color: var(--t3); min-width: 40px; text-align: right; }
    .pos-change { font-size: 12px; font-weight: 600; min-width: 60px; text-align: right; }
  `]
})
export class PortfolioPanelComponent {
  portfolio = input.required<PortfolioData>();
  intraday = input<IntradayData | null>(null);

  topPositions = () => {
    const p = this.portfolio();
    if (!p?.positions) return [];
    return [...p.positions]
      .sort((a, b) => (b.current_value || 0) - (a.current_value || 0))
      .slice(0, 3);
  };
}
