import { Component, ChangeDetectionStrategy, input, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { inject } from '@angular/core';
import { PercentPipe, DecimalPipe } from '@angular/common';
import { AssetCellComponent } from '../../../shared/components/asset-cell/asset-cell.component';
import { ScoreBadgeComponent } from '../../../shared/components/score-badge/score-badge.component';

export interface ScreenerAsset {
  ticker: string;
  company_name: string;
  cluster_id: number;
  iq_score: number;
  rating: string;
  rating_label: string;
  fair_value_final: number | null;
  safety_margin: number | null;
  dividend_yield_proj: number | null;
}

type SortKey = 'ticker' | 'iq_score' | 'fair_value_final' | 'safety_margin' | 'dividend_yield_proj' | 'current_price';
type SortDir = 'asc' | 'desc';

const CLUSTER_MAP: Record<number, string> = {
  1: 'Financeiro', 2: 'Commodities', 3: 'Consumo', 4: 'Utilities',
  5: 'Saúde', 6: 'TMT', 7: 'Bens Capital', 8: 'Real Estate', 9: 'Educação',
};

@Component({
  selector: 'iq-asset-table',
  standalone: true,
  imports: [AssetCellComponent, ScoreBadgeComponent, PercentPipe, DecimalPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="table-wrapper">
      <table>
        <thead>
          <tr>
            <th class="col-asset" (click)="toggleSort('ticker')">
              Ativo <span class="sort-icon">{{ sortIcon('ticker') }}</span>
            </th>
            <th class="col-cluster">Cluster</th>
            <th class="col-score" (click)="toggleSort('iq_score')">
              Score <span class="sort-icon">{{ sortIcon('iq_score') }}</span>
            </th>
            <th class="col-rating">Rating</th>
            <th class="col-num" (click)="toggleSort('fair_value_final')">
              Preço Justo <span class="sort-icon">{{ sortIcon('fair_value_final') }}</span>
            </th>
            <th class="col-num" (click)="toggleSort('current_price')">
              Preço Atual <span class="sort-icon">{{ sortIcon('current_price') }}</span>
            </th>
            <th class="col-num" (click)="toggleSort('safety_margin')">
              Margem Seg. <span class="sort-icon">{{ sortIcon('safety_margin') }}</span>
            </th>
            <th class="col-num" (click)="toggleSort('dividend_yield_proj')">
              DY Proj. <span class="sort-icon">{{ sortIcon('dividend_yield_proj') }}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          @for (asset of sorted(); track asset.ticker) {
            <tr class="row" [class]="'band-' + getBand(asset.iq_score)" (click)="goTo(asset.ticker)">
              <td class="col-asset">
                <iq-asset-cell [ticker]="asset.ticker" [name]="asset.company_name" />
              </td>
              <td class="col-cluster label">{{ clusterName(asset.cluster_id) }}</td>
              <td class="col-score"><iq-score-badge [score]="asset.iq_score" /></td>
              <td class="col-rating">
                <span class="rating-badge" [class]="'rate-' + getBand(asset.iq_score)">{{ asset.rating_label }}</span>
              </td>
              <td class="col-num mono">
                {{ asset.fair_value_final != null ? 'R$ ' + (asset.fair_value_final | number:'1.2-2') : '--' }}
              </td>
              <td class="col-num mono">
                {{ currentPrice(asset) != null ? 'R$ ' + (currentPrice(asset)! | number:'1.2-2') : '--' }}
              </td>
              <td class="col-num mono"
                  [class.pos]="asset.safety_margin != null && asset.safety_margin > 0"
                  [class.neg]="asset.safety_margin != null && asset.safety_margin < 0">
                {{ asset.safety_margin != null ? (asset.safety_margin | percent:'1.1-1') : '--' }}
              </td>
              <td class="col-num mono">
                {{ asset.dividend_yield_proj != null ? (asset.dividend_yield_proj | percent:'1.1-1') : '--' }}
              </td>
            </tr>
          }
        </tbody>
      </table>
    </div>
  `,
  styles: [`
    .table-wrapper { overflow-x: auto; }
    table { width: 100%; border-spacing: 0; }
    th {
      font-family: var(--font-ui); font-size: 10px; font-weight: 600;
      text-transform: uppercase; letter-spacing: 0.08em;
      color: var(--t4); text-align: left; padding: 8px 10px;
      border-bottom: 1px solid var(--border); white-space: nowrap;
      cursor: pointer; user-select: none;
      transition: color var(--transition-fast);
    }
    th:hover { color: var(--t2); }
    .sort-icon { font-size: 9px; }
    td {
      padding: 8px 10px; font-size: 13px; color: var(--t2);
      border-bottom: 1px solid var(--border); vertical-align: middle;
    }
    .row {
      cursor: pointer; transition: background var(--transition-fast);
      border-left: 2px solid transparent;
    }
    .row:hover { background: var(--card-hover); }
    .row:hover.band-strong-buy { border-left-color: var(--volt); }
    .row:hover.band-buy { border-left-color: var(--pos); }
    .row:hover.band-hold { border-left-color: var(--warn); }
    .row:hover.band-reduce { border-left-color: var(--neg); }
    .row:hover.band-avoid { border-left-color: var(--neg); }
    .col-asset { min-width: 180px; }
    .col-cluster { white-space: nowrap; font-size: 12px; }
    .col-score { width: 70px; }
    .col-rating { width: 100px; }
    .col-num { width: 100px; text-align: right; font-size: 12px; font-weight: 600; }
    .rating-badge {
      display: inline-block; padding: 2px 8px; border-radius: var(--radius);
      font-family: var(--font-ui); font-size: 10px; font-weight: 700;
      text-transform: uppercase; letter-spacing: 0.04em;
    }
    .rate-strong-buy { background: var(--volt-dim); color: var(--volt); }
    .rate-buy { background: var(--pos-dim); color: var(--pos); }
    .rate-hold { background: var(--warn-dim); color: var(--warn); }
    .rate-reduce { background: var(--neg-dim); color: var(--neg); }
    .rate-avoid { background: var(--neg-dim); color: var(--neg); opacity: 0.7; }
  `]
})
export class AssetTableComponent {
  private readonly router = inject(Router);

  assets = input.required<ScreenerAsset[]>();

  private readonly sortKey = signal<SortKey | null>(null);
  private readonly sortDir = signal<SortDir>('desc');

  readonly sorted = computed(() => {
    const list = [...this.assets()];
    const key = this.sortKey();
    if (!key) return list;
    const dir = this.sortDir() === 'asc' ? 1 : -1;

    return list.sort((a, b) => {
      let va: any, vb: any;
      if (key === 'current_price') {
        va = this.currentPrice(a);
        vb = this.currentPrice(b);
      } else {
        va = (a as any)[key];
        vb = (b as any)[key];
      }
      if (va == null && vb == null) return 0;
      if (va == null) return 1;
      if (vb == null) return -1;
      if (typeof va === 'string') return va.localeCompare(vb) * dir;
      return (va - vb) * dir;
    });
  });

  toggleSort(key: SortKey): void {
    if (this.sortKey() === key) {
      this.sortDir.update(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortKey.set(key);
      this.sortDir.set('desc');
    }
  }

  sortIcon(key: SortKey): string {
    if (this.sortKey() !== key) return '';
    return this.sortDir() === 'asc' ? '▲' : '▼';
  }

  currentPrice(asset: ScreenerAsset): number | null {
    if (asset.fair_value_final == null || asset.safety_margin == null) return null;
    if (asset.safety_margin === -1) return null;
    return asset.fair_value_final / (1 + asset.safety_margin);
  }

  clusterName(id: number): string {
    return CLUSTER_MAP[id] || `Cluster ${id}`;
  }

  getBand(score: number): string {
    if (score >= 82) return 'strong-buy';
    if (score >= 70) return 'buy';
    if (score >= 45) return 'hold';
    if (score >= 30) return 'reduce';
    return 'avoid';
  }

  goTo(ticker: string): void {
    this.router.navigate(['/ativo', ticker]);
  }
}
