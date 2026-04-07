import { Component, ChangeDetectionStrategy, input, signal, computed } from '@angular/core';
// formatting handled in formatValue()
import { AssetCellComponent } from '../../../shared/components/asset-cell/asset-cell.component';
import { ScoreBadgeComponent } from '../../../shared/components/score-badge/score-badge.component';

export interface CompareAsset {
  ticker: string;
  company_name: string;
  iq_score: number;
  rating_label: string;
  close: number | null;
  fair_value_final: number | null;
  safety_margin: number | null;
  roe: number | null;
  net_margin: number | null;
  ebitda_margin: number | null;
  dl_ebitda: number | null;
  piotroski: number | null;
  dividend_yield_proj: number | null;
  dividend_safety: number | null;
  score_quanti: number | null;
  score_quali: number | null;
  score_valuation: number | null;
}

interface MetricRow {
  label: string;
  key: string;
  format: 'score' | 'currency' | 'percent' | 'number' | 'text' | 'piotroski';
  higherBetter: boolean;
  group: string;
}

const METRICS: MetricRow[] = [
  { label: 'Score IQ', key: 'iq_score', format: 'score', higherBetter: true, group: 'Score' },
  { label: 'Rating', key: 'rating_label', format: 'text', higherBetter: true, group: 'Score' },
  { label: 'Quanti', key: 'score_quanti', format: 'score', higherBetter: true, group: 'Score' },
  { label: 'Quali', key: 'score_quali', format: 'score', higherBetter: true, group: 'Score' },
  { label: 'Valuation', key: 'score_valuation', format: 'score', higherBetter: true, group: 'Score' },
  { label: 'Preço Atual', key: 'close', format: 'currency', higherBetter: false, group: 'Valuation' },
  { label: 'Preço Justo', key: 'fair_value_final', format: 'currency', higherBetter: false, group: 'Valuation' },
  { label: 'Margem Seg.', key: 'safety_margin', format: 'percent', higherBetter: true, group: 'Valuation' },
  { label: 'ROE', key: 'roe', format: 'percent', higherBetter: true, group: 'Rentabilidade' },
  { label: 'Margem Líquida', key: 'net_margin', format: 'percent', higherBetter: true, group: 'Rentabilidade' },
  { label: 'Margem EBITDA', key: 'ebitda_margin', format: 'percent', higherBetter: true, group: 'Rentabilidade' },
  { label: 'DL/EBITDA', key: 'dl_ebitda', format: 'number', higherBetter: false, group: 'Endividamento' },
  { label: 'Piotroski', key: 'piotroski', format: 'piotroski', higherBetter: true, group: 'Endividamento' },
  { label: 'DY Projetado', key: 'dividend_yield_proj', format: 'percent', higherBetter: true, group: 'Dividendos' },
  { label: 'Segurança Div.', key: 'dividend_safety', format: 'score', higherBetter: true, group: 'Dividendos' },
];

@Component({
  selector: 'iq-compare-table',
  standalone: true,
  imports: [AssetCellComponent, ScoreBadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="table-wrapper">
      <table>
        <thead>
          <tr>
            <th class="col-metric">Métrica</th>
            @for (a of assets(); track a.ticker) {
              <th class="col-asset">
                <iq-asset-cell [ticker]="a.ticker" [name]="a.company_name" />
                <iq-score-badge [score]="a.iq_score" />
              </th>
            }
          </tr>
        </thead>
        <tbody>
          @for (group of groups; track group) {
            <tr class="group-row"><td [attr.colspan]="assets().length + 1" class="group-label overline">{{ group }}</td></tr>
            @for (m of metricsByGroup(group); track m.key) {
              <tr>
                <td class="col-metric label">{{ m.label }}</td>
                @for (a of assets(); track a.ticker) {
                  <td class="col-val mono"
                      [class.best]="isBest(m, a)"
                      [class.worst]="isWorst(m, a)">
                    {{ formatValue(a, m) }}
                  </td>
                }
              </tr>
            }
          }
        </tbody>
      </table>
    </div>
  `,
  styles: [`
    .table-wrapper { overflow-x: auto; }
    table { width: 100%; border-spacing: 0; }
    th {
      text-align: center; padding: 10px 12px; border-bottom: 1px solid var(--border);
      vertical-align: bottom;
    }
    th.col-metric { text-align: left; width: 130px; }
    th.col-asset {
      display: table-cell; min-width: 140px;
    }
    th.col-asset iq-asset-cell { display: flex; justify-content: center; margin-bottom: 6px; }
    th.col-asset iq-score-badge { display: flex; justify-content: center; }
    td { padding: 6px 12px; border-bottom: 1px solid var(--border); font-size: 13px; text-align: center; }
    td.col-metric { text-align: left; color: var(--t3); font-size: 12px; }
    td.col-val { color: var(--t2); font-weight: 500; }
    .best { color: var(--volt) !important; font-weight: 700 !important; }
    .worst { color: var(--neg); opacity: 0.7; }
    .group-row td { padding: 0; }
    .group-label {
      padding: 12px 12px 4px !important; text-align: left !important;
      color: var(--t4); border-bottom: 1px solid var(--border);
    }
  `]
})
export class CompareTableComponent {
  assets = input.required<CompareAsset[]>();

  readonly groups = ['Score', 'Valuation', 'Rentabilidade', 'Endividamento', 'Dividendos'];

  metricsByGroup(group: string): MetricRow[] {
    return METRICS.filter(m => m.group === group);
  }

  formatValue(asset: CompareAsset, metric: MetricRow): string {
    const val = (asset as any)[metric.key];
    if (val == null) return '--';
    switch (metric.format) {
      case 'score': return String(val);
      case 'currency': return `R$ ${val.toFixed(2)}`;
      case 'percent': return `${(val * 100).toFixed(1)}%`;
      case 'number': return `${val.toFixed(1)}x`;
      case 'piotroski': return `${val}/9`;
      case 'text': return String(val);
      default: return String(val);
    }
  }

  isBest(metric: MetricRow, asset: CompareAsset): boolean {
    if (metric.format === 'text') return false;
    const vals = this.assets().map(a => (a as any)[metric.key]).filter((v: any) => v != null);
    if (vals.length < 2) return false;
    const val = (asset as any)[metric.key];
    if (val == null) return false;
    const best = metric.higherBetter ? Math.max(...vals) : Math.min(...vals);
    return val === best;
  }

  isWorst(metric: MetricRow, asset: CompareAsset): boolean {
    if (metric.format === 'text') return false;
    const vals = this.assets().map(a => (a as any)[metric.key]).filter((v: any) => v != null);
    if (vals.length < 2) return false;
    const val = (asset as any)[metric.key];
    if (val == null) return false;
    const worst = metric.higherBetter ? Math.min(...vals) : Math.max(...vals);
    return val === worst;
  }
}
