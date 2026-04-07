import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { ApiService } from '../../../core/services/api.service';
import { AssetCellComponent } from '../../../shared/components/asset-cell/asset-cell.component';
import { ScoreBadgeComponent } from '../../../shared/components/score-badge/score-badge.component';

interface Position {
  ticker: string;
  company_name: string;
  weight: number;
  iq_score: number;
  reason: string;
}

interface RecoData {
  date: string;
  regime: string;
  confidence: number;
  total_exposure: string;
  cash_weight: string;
  n_opportunities: number;
  long_positions: Position[];
  decisions: string[];
}

@Component({
  selector: 'iq-recommended-portfolio',
  standalone: true,
  imports: [DecimalPipe, AssetCellComponent, ScoreBadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="panel glass">
      <div class="panel-header">
        <span class="overline">CARTEIRA ÓTIMA DO MOTOR</span>
        @if (data(); as d) {
          <span class="date-label mono">{{ d.date }}</span>
        }
      </div>

      <p class="subtitle">Se eu fosse montar uma carteira hoje:</p>

      @if (positions().length > 0) {
        <div class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th class="col-rank">#</th>
                <th class="col-asset">Ativo</th>
                <th class="col-weight">Peso</th>
                <th class="col-score">Score</th>
                <th class="col-reason">Motivo</th>
              </tr>
            </thead>
            <tbody>
              @for (pos of positions(); track pos.ticker; let i = $index) {
                <tr class="row" (click)="goTo(pos.ticker)">
                  <td class="col-rank mono">{{ i + 1 }}</td>
                  <td class="col-asset"><iq-asset-cell [ticker]="pos.ticker" [name]="pos.company_name" /></td>
                  <td class="col-weight">
                    <div class="weight-cell">
                      <span class="mono weight-val">{{ (pos.weight * 100) | number:'1.1-1' }}%</span>
                      <div class="weight-bar-track">
                        <div class="weight-bar-fill" [style.width.%]="pos.weight * 100"></div>
                      </div>
                    </div>
                  </td>
                  <td class="col-score"><iq-score-badge [score]="pos.iq_score" /></td>
                  <td class="col-reason">{{ pos.reason }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <div class="footer-stats">
          <span class="stat label">Exposição: <span class="mono">{{ data()?.total_exposure || '--' }}</span></span>
          <span class="stat label">Ativos: <span class="mono">{{ positions().length }}</span></span>
          <span class="stat label">Score médio: <span class="mono">{{ avgScore() }}</span></span>
        </div>
      } @else {
        <div class="empty-reco">
          @for (d of decisions(); track $index) {
            <p class="decision-text">{{ d }}</p>
          }
          @if (decisions().length === 0) {
            <p class="decision-text">Nenhuma recomendação no momento</p>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .panel { padding: 20px; display: flex; flex-direction: column; gap: 12px; border-radius: var(--radius); }
    .panel-header { display: flex; align-items: center; justify-content: space-between; }
    .date-label { font-size: 11px; color: var(--t4); }
    .subtitle { font-family: var(--font-ui); font-size: 13px; color: var(--t2); font-style: italic; }
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
    .col-asset { min-width: 160px; }
    .col-weight { width: 130px; }
    .weight-cell { display: flex; align-items: center; gap: 8px; }
    .weight-val { font-size: 13px; font-weight: 700; min-width: 42px; }
    .weight-bar-track { flex: 1; height: 4px; background: var(--elevated); border-radius: 2px; overflow: hidden; }
    .weight-bar-fill { height: 100%; background: var(--volt); border-radius: 2px; }
    .col-score { width: 60px; }
    .col-reason { font-size: 12px; color: var(--t3); max-width: 200px; }
    .footer-stats {
      display: flex; gap: 20px; padding-top: 8px; border-top: 1px solid var(--border);
    }
    .stat .mono { font-weight: 600; color: var(--t1); }
    .empty-reco { display: flex; flex-direction: column; gap: 6px; padding: 24px; align-items: center; }
    .decision-text { font-size: 14px; color: var(--t2); text-align: center; }
  `]
})
export class RecommendedPortfolioComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);

  readonly data = signal<RecoData | null>(null);
  readonly positions = signal<Position[]>([]);
  readonly decisions = signal<string[]>([]);

  avgScore = () => {
    const p = this.positions();
    if (p.length === 0) return '--';
    const sum = p.reduce((a, b) => a + (b.iq_score || 0), 0);
    return Math.round(sum / p.length);
  };

  ngOnInit(): void {
    this.api.get<RecoData>('/strategy/portfolio-recommendation').subscribe({
      next: d => {
        this.data.set(d);
        this.positions.set(d.long_positions || []);
        this.decisions.set(d.decisions || []);
      },
      error: () => {},
    });
  }

  goTo(ticker: string): void { this.router.navigate(['/ativo', ticker]); }
}
