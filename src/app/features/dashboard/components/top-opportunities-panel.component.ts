import { Component, ChangeDetectionStrategy, inject, signal, input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { PercentPipe } from '@angular/common';
import { ApiService } from '../../../core/services/api.service';
import { ScoreBadgeComponent } from '../../../shared/components/score-badge/score-badge.component';

interface TopAsset {
  ticker: string;
  company_name: string;
  iq_score: number;
  rating: string;
  rating_label: string;
  cluster_id: number;
  safety_margin: number | null;
  dividend_yield_proj: number | null;
}

const CLUSTER_MAP: Record<number, string> = {
  1: 'Financeiro', 2: 'Commodities', 3: 'Consumo', 4: 'Utilities',
  5: 'Saúde', 6: 'TMT', 7: 'Bens Capital', 8: 'Real Estate', 9: 'Educação',
};

@Component({
  selector: 'iq-top-opportunities-panel',
  standalone: true,
  imports: [ScoreBadgeComponent, PercentPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="panel card">
      <div class="panel-header">
        <span class="overline">TOP OPORTUNIDADES</span>
      </div>

      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th class="col-rank mono">#</th>
              <th class="col-ticker">Ticker</th>
              <th class="col-name">Empresa</th>
              <th class="col-score">Score</th>
              <th class="col-rating">Rating</th>
              <th class="col-cluster">Cluster</th>
              <th class="col-margin mono">M. Seg.</th>
              @if (showPortfolioCol()) {
                <th class="col-inport">Carteira</th>
              }
            </tr>
          </thead>
          <tbody>
            @for (asset of assets(); track asset.ticker; let i = $index) {
              <tr class="row" (click)="goToAsset(asset.ticker)" [class]="'band-' + getBand(asset.iq_score)">
                <td class="col-rank mono">{{ i + 1 }}</td>
                <td class="col-ticker ticker">{{ asset.ticker }}</td>
                <td class="col-name">{{ asset.company_name }}</td>
                <td class="col-score"><iq-score-badge [score]="asset.iq_score" /></td>
                <td class="col-rating label">{{ asset.rating_label }}</td>
                <td class="col-cluster label">{{ clusterName(asset.cluster_id) }}</td>
                <td class="col-margin mono" [class.pos]="asset.safety_margin != null && asset.safety_margin > 0" [class.neg]="asset.safety_margin != null && asset.safety_margin < 0">
                  {{ asset.safety_margin != null ? (asset.safety_margin | percent:'1.0-0') : '--' }}
                </td>
                @if (showPortfolioCol()) {
                  <td class="col-inport">
                    @if (portfolioTickers().has(asset.ticker)) {
                      <i class="ph-fill ph-check-circle pos"></i>
                    }
                  </td>
                }
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .panel { padding: 16px; display: flex; flex-direction: column; gap: 10px; }
    .panel-header { display: flex; align-items: center; }
    .table-wrapper { overflow-x: auto; }
    table { width: 100%; border-spacing: 0; }
    th {
      font-family: var(--font-ui); font-size: 10px; font-weight: 600;
      text-transform: uppercase; letter-spacing: 0.08em;
      color: var(--t4); text-align: left; padding: 6px 8px;
      border-bottom: 1px solid var(--border); white-space: nowrap;
    }
    td { padding: 8px 8px; font-size: 13px; color: var(--t2); border-bottom: 1px solid var(--border); }
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
    .col-rank { width: 30px; color: var(--t4); font-size: 11px; }
    .col-ticker { white-space: nowrap; }
    .col-name { max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .col-score { width: 60px; }
    .col-rating { width: 90px; white-space: nowrap; }
    .col-cluster { width: 90px; white-space: nowrap; }
    .col-margin { width: 60px; text-align: right; font-size: 12px; font-weight: 600; }
    .col-inport { width: 50px; text-align: center; }
    .col-inport i { font-size: 16px; }
  `]
})
export class TopOpportunitiesPanelComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);

  showPortfolioCol = input(false);
  portfolioTickers = input(new Set<string>());

  readonly assets = signal<TopAsset[]>([]);

  ngOnInit(): void {
    this.api.get<{ top: TopAsset[] }>('/scores/top', { limit: 10 }).subscribe({
      next: (d) => this.assets.set(d.top || []),
      error: () => this.assets.set([]),
    });
  }

  goToAsset(ticker: string): void {
    this.router.navigate(['/ativo', ticker]);
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
}
