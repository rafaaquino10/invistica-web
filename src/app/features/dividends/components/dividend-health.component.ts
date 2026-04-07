import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { DecimalPipe, PercentPipe } from '@angular/common';
import { AssetCellComponent } from '../../../shared/components/asset-cell/asset-cell.component';

export interface SafetyEntry {
  ticker: string; company_name: string; dividend_yield_proj: number | null;
  dividend_safety: number; dividend_cagr_5y: number | null;
}

@Component({
  selector: 'iq-dividend-health',
  standalone: true,
  imports: [DecimalPipe, PercentPipe, AssetCellComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="panel card">
      <span class="overline">SAFETY SCORE DAS SUAS POSIÇÕES</span>
      @if (entries().length > 0) {
        <table>
          <thead><tr><th>Ativo</th><th class="num">DY Proj.</th><th class="num">Safety</th><th>Status</th></tr></thead>
          <tbody>
            @for (e of sorted(); track e.ticker) {
              <tr [class.warn-row]="e.dividend_safety < 50">
                <td><iq-asset-cell [ticker]="e.ticker" [name]="e.company_name" /></td>
                <td class="num mono">{{ e.dividend_yield_proj != null ? (e.dividend_yield_proj | percent:'1.1-1') : '--' }}</td>
                <td class="num">
                  <div class="gauge-row">
                    <div class="gauge-track"><div class="gauge-fill" [style.width.%]="e.dividend_safety" [style.background]="gaugeColor(e.dividend_safety)"></div></div>
                    <span class="mono gauge-val">{{ e.dividend_safety }}</span>
                  </div>
                </td>
                <td><span class="status-badge" [class]="statusClass(e.dividend_safety)">{{ statusLabel(e.dividend_safety) }}</span></td>
              </tr>
            }
          </tbody>
        </table>
      } @else {
        <span class="empty label">Sem dados</span>
      }
    </div>
  `,
  styles: [`
    .panel { padding: 14px; display: flex; flex-direction: column; gap: 10px; }
    table { width: 100%; border-spacing: 0; }
    th { font-family: var(--font-ui); font-size: 9px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: var(--t4); text-align: left; padding: 5px 6px; border-bottom: 1px solid var(--border); }
    td { padding: 6px 6px; font-size: 12px; color: var(--t2); border-bottom: 1px solid var(--border); vertical-align: middle; }
    .num { text-align: right; }
    .warn-row { background: var(--warn-dim); }
    .gauge-row { display: flex; align-items: center; gap: 6px; justify-content: flex-end; }
    .gauge-track { width: 50px; height: 4px; background: var(--elevated); border-radius: 2px; overflow: hidden; }
    .gauge-fill { height: 100%; border-radius: 2px; }
    .gauge-val { font-size: 12px; font-weight: 700; min-width: 24px; }
    .status-badge { padding: 1px 6px; border-radius: var(--radius); font-size: 9px; font-weight: 700; text-transform: uppercase; }
    .status-safe { background: var(--pos-dim); color: var(--pos); }
    .status-warn { background: var(--warn-dim); color: var(--warn); }
    .status-risk { background: var(--neg-dim); color: var(--neg); }
    .empty { color: var(--t4); }
  `]
})
export class DividendHealthComponent {
  entries = input.required<SafetyEntry[]>();

  sorted = computed(() => [...this.entries()].sort((a, b) => b.dividend_safety - a.dividend_safety));

  gaugeColor(score: number): string {
    if (score >= 80) return 'var(--volt)';
    if (score >= 60) return 'var(--pos)';
    if (score >= 40) return 'var(--warn)';
    return 'var(--neg)';
  }

  statusClass(score: number): string {
    if (score >= 60) return 'status-safe';
    if (score >= 40) return 'status-warn';
    return 'status-risk';
  }

  statusLabel(score: number): string {
    if (score >= 60) return 'Seguro';
    if (score >= 40) return 'Atenção';
    return 'Risco';
  }
}
