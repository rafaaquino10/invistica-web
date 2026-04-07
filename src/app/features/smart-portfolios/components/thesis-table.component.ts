import { Component, ChangeDetectionStrategy, input, inject } from '@angular/core';
import { Router } from '@angular/router';
import { PercentPipe, DecimalPipe } from '@angular/common';
import { AssetCellComponent } from '../../../shared/components/asset-cell/asset-cell.component';
import { ScoreBadgeComponent } from '../../../shared/components/score-badge/score-badge.component';
import { ThesisConfig } from '../thesis-config';

export interface ScreenerAsset {
  ticker: string;
  company_name: string;
  iq_score: number;
  rating_label: string;
  fair_value_final: number | null;
  safety_margin: number | null;
  dividend_yield_proj: number | null;
  dividend_safety: number | null;
  score_quanti: number | null;
  cluster_id: number;
}

@Component({
  selector: 'iq-thesis-table',
  standalone: true,
  imports: [AssetCellComponent, ScoreBadgeComponent, PercentPipe, DecimalPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (assets().length > 0) {
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th class="col-rank">#</th>
              <th class="col-asset">Ativo</th>
              <th class="col-score">Score</th>
              <th class="col-text">Rating</th>
              <th class="col-num">Preço Justo</th>
              <th class="col-num">Margem</th>
              <th class="col-num">DY</th>
              <th class="col-num">{{ thesis().highlightLabel }}</th>
            </tr>
          </thead>
          <tbody>
            @for (a of assets(); track a.ticker; let i = $index) {
              <tr class="row" (click)="goTo(a.ticker)">
                <td class="col-rank mono">{{ i + 1 }}</td>
                <td class="col-asset"><iq-asset-cell [ticker]="a.ticker" [name]="a.company_name" /></td>
                <td class="col-score"><iq-score-badge [score]="a.iq_score" /></td>
                <td class="col-text label">{{ a.rating_label }}</td>
                <td class="col-num mono">{{ a.fair_value_final != null ? 'R$ ' + (a.fair_value_final | number:'1.2-2') : '--' }}</td>
                <td class="col-num mono"
                    [class.pos]="a.safety_margin != null && a.safety_margin > 0"
                    [class.neg]="a.safety_margin != null && a.safety_margin < 0">
                  {{ a.safety_margin != null ? (a.safety_margin | percent:'1.1-1') : '--' }}
                </td>
                <td class="col-num mono">{{ a.dividend_yield_proj != null ? (a.dividend_yield_proj | percent:'1.1-1') : '--' }}</td>
                <td class="col-num mono highlight">{{ formatHighlight(a) }}</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
      <div class="footer">
        <span class="label">Score médio: <span class="mono">{{ avgScore() }}</span></span>
        <span class="label">DY médio: <span class="mono">{{ avgDY() }}</span></span>
        <span class="label">Ativos: <span class="mono">{{ assets().length }}</span></span>
      </div>
    } @else {
      <div class="empty label">Nenhum ativo atende aos critérios desta tese</div>
    }
  `,
  styles: [`
    .table-wrapper { overflow-x: auto; }
    table { width: 100%; border-spacing: 0; }
    th {
      font-family: var(--font-ui); font-size: 10px; font-weight: 600; text-transform: uppercase;
      letter-spacing: 0.06em; color: var(--t4); text-align: left; padding: 6px 8px;
      border-bottom: 1px solid var(--border); white-space: nowrap;
    }
    td { padding: 8px 8px; font-size: 13px; color: var(--t2); border-bottom: 1px solid var(--border); vertical-align: middle; }
    .row { cursor: pointer; transition: background var(--transition-fast); }
    .row:hover { background: var(--card-hover); }
    .col-rank { width: 30px; color: var(--t4); font-size: 11px; }
    .col-asset { min-width: 170px; }
    .col-score { width: 60px; }
    .col-text { width: 90px; white-space: nowrap; }
    .col-num { width: 90px; text-align: right; font-size: 12px; font-weight: 600; }
    .highlight { color: var(--volt) !important; font-weight: 700 !important; }
    .footer { display: flex; gap: 20px; padding: 8px 0; border-top: 1px solid var(--border); }
    .footer .mono { font-weight: 600; color: var(--t1); }
    .empty { text-align: center; padding: 40px; color: var(--t3); }
  `]
})
export class ThesisTableComponent {
  private readonly router = inject(Router);
  assets = input.required<ScreenerAsset[]>();
  thesis = input.required<ThesisConfig>();

  avgScore = () => {
    const a = this.assets();
    if (!a.length) return '--';
    return Math.round(a.reduce((s, x) => s + x.iq_score, 0) / a.length);
  };

  avgDY = () => {
    const a = this.assets().filter(x => x.dividend_yield_proj != null);
    if (!a.length) return '--';
    return ((a.reduce((s, x) => s + (x.dividend_yield_proj || 0), 0) / a.length) * 100).toFixed(1) + '%';
  };

  formatHighlight(asset: ScreenerAsset): string {
    const key = this.thesis().highlightKey;
    const val = (asset as any)[key];
    if (val == null) return '--';
    switch (this.thesis().highlightFormat) {
      case 'percent': return (val * 100).toFixed(1) + '%';
      case 'score': return String(val);
      case 'number': return val.toFixed(1) + 'x';
    }
  }

  goTo(ticker: string): void { this.router.navigate(['/ativo', ticker]); }
}
