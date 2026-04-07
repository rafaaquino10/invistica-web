import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PercentPipe } from '@angular/common';
import { ApiService } from '../../../core/services/api.service';
import { InViewDirective } from '../../../shared/directives/in-view.directive';
import { AssetCellComponent } from '../../../shared/components/asset-cell/asset-cell.component';
import { ScoreBadgeComponent } from '../../../shared/components/score-badge/score-badge.component';

interface ScreenerAsset {
  ticker: string; company_name: string; iq_score: number; rating_label: string;
  cluster_id: number; safety_margin: number | null; dividend_yield_proj: number | null;
}

const CLUSTER: Record<number, string> = { 1:'Financeiro', 2:'Commodities', 3:'Consumo', 4:'Utilities', 5:'Saúde', 6:'TMT', 7:'Bens Capital', 8:'Real Estate', 9:'Educação' };

@Component({
  selector: 'iq-explorer-live',
  standalone: true,
  imports: [RouterLink, PercentPipe, InViewDirective, AssetCellComponent, ScoreBadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="section" iqInView>
      <h2>Ranking ao vivo. Filtragem inteligente.</h2>
      <p class="sub">Ordene por score, filtre por setor. Dados 100% reais da CVM e B3.</p>

      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Ativo</th><th>Score</th><th>Rating</th><th>Cluster</th><th class="num">Margem Seg.</th><th class="num">DY Proj.</th>
            </tr>
          </thead>
          <tbody>
            @for (a of assets(); track a.ticker) {
              <tr class="row">
                <td><iq-asset-cell [ticker]="a.ticker" [name]="a.company_name" /></td>
                <td><iq-score-badge [score]="a.iq_score" /></td>
                <td class="label">{{ a.rating_label }}</td>
                <td class="label">{{ cluster(a.cluster_id) }}</td>
                <td class="num mono" [class.pos]="a.safety_margin != null && a.safety_margin > 0" [class.neg]="a.safety_margin != null && a.safety_margin < 0">{{ a.safety_margin != null ? (a.safety_margin | percent:'1.0-0') : '--' }}</td>
                <td class="num mono">{{ a.dividend_yield_proj != null ? (a.dividend_yield_proj | percent:'1.1-1') : '--' }}</td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      <a class="explore-link" routerLink="/criar-conta">Explorar todos os ativos →</a>
    </section>
  `,
  styles: [`
    .section { padding: 80px 48px; background: #0A0C14; text-align: center; }
    .section.in-view .table-wrap { opacity: 1; transform: translateY(0); }
    h2 { font-family: var(--font-ui); font-size: 28px; font-weight: 700; color: #F8FAFC; margin-bottom: 8px; }
    .sub { font-size: 15px; color: #A0A8B8; margin-bottom: 32px; }
    .table-wrap {
      max-width: 900px; margin: 0 auto; overflow-x: auto; text-align: left;
      opacity: 0; transform: translateY(20px); transition: all 500ms ease-out;
    }
    table { width: 100%; border-spacing: 0; }
    th { font-family: var(--font-ui); font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: #606878; text-align: left; padding: 8px 10px; border-bottom: 1px solid rgba(255,255,255,0.04); }
    td { padding: 10px 10px; font-size: 13px; color: #A0A8B8; border-bottom: 1px solid rgba(255,255,255,0.04); vertical-align: middle; }
    .num { text-align: right; font-weight: 600; }
    .pos { color: #34D399; }
    .neg { color: #EF4444; }
    .row { transition: background 150ms; }
    .row:hover { background: rgba(255,255,255,0.02); }
    .explore-link { display: inline-block; margin-top: 24px; font-family: var(--font-ui); font-size: 14px; font-weight: 600; color: #d0f364; transition: opacity 150ms; }
    .explore-link:hover { opacity: 0.8; }
  `]
})
export class ExplorerLiveComponent implements OnInit {
  private readonly api = inject(ApiService);
  readonly assets = signal<ScreenerAsset[]>([]);

  ngOnInit(): void {
    this.api.get<{ results: ScreenerAsset[] }>('/scores/screener').subscribe({
      next: d => this.assets.set((d.results || []).slice(0, 8)),
    });
  }

  cluster(id: number): string { return CLUSTER[id] || ''; }
}
