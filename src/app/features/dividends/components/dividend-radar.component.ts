import { Component, ChangeDetectionStrategy, inject, signal, input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { PercentPipe } from '@angular/common';
import { ApiService } from '../../../core/services/api.service';
import { AssetCellComponent } from '../../../shared/components/asset-cell/asset-cell.component';
import { ScoreBadgeComponent } from '../../../shared/components/score-badge/score-badge.component';

interface RadarEntry {
  ticker: string; company_name: string; dividend_safety: number;
  dividend_yield_proj: number; dividend_cagr_5y: number | null; iq_score: number;
}

@Component({
  selector: 'iq-dividend-radar',
  standalone: true,
  imports: [PercentPipe, AssetCellComponent, ScoreBadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="panel card">
      <span class="overline">MELHORES PAGADORAS</span>
      @if (entries().length > 0) {
        <div class="table-wrapper">
          <table>
            <thead><tr><th>Ativo</th><th class="num">Safety</th><th class="num">DY Proj.</th><th>Score</th></tr></thead>
            <tbody>
              @for (e of entries(); track e.ticker) {
                <tr class="row" (click)="goTo(e.ticker)">
                  <td>
                    <iq-asset-cell [ticker]="e.ticker" [name]="e.company_name" />
                    @if (portfolioTickers().has(e.ticker)) { <span class="owns-badge">Já investe</span> }
                  </td>
                  <td class="num mono">{{ e.dividend_safety }}</td>
                  <td class="num mono">{{ e.dividend_yield_proj | percent:'1.1-1' }}</td>
                  <td><iq-score-badge [score]="e.iq_score" /></td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      } @else {
        <span class="empty label">Nenhuma ação com safety ≥ 70</span>
      }
    </div>
  `,
  styles: [`
    .panel { padding: 14px; display: flex; flex-direction: column; gap: 10px; }
    .table-wrapper { max-height: 350px; overflow-y: auto; }
    table { width: 100%; border-spacing: 0; }
    th { font-family: var(--font-ui); font-size: 9px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: var(--t4); text-align: left; padding: 5px 6px; border-bottom: 1px solid var(--border); }
    td { padding: 6px 6px; font-size: 12px; color: var(--t2); border-bottom: 1px solid var(--border); vertical-align: middle; }
    .num { text-align: right; }
    .row { cursor: pointer; transition: background var(--transition-fast); }
    .row:hover { background: var(--card-hover); }
    .owns-badge { font-size: 8px; font-weight: 700; text-transform: uppercase; padding: 1px 4px; border-radius: var(--radius); background: var(--volt-dim); color: var(--volt); margin-left: 4px; }
    .empty { color: var(--t4); text-align: center; padding: 20px; }
  `]
})
export class DividendRadarComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  portfolioTickers = input(new Set<string>());
  readonly entries = signal<RadarEntry[]>([]);

  ngOnInit(): void {
    this.api.get<{ radar: RadarEntry[] }>('/dividends/radar', { min_safety: 70 }).subscribe({
      next: d => this.entries.set((d.radar || []).slice(0, 15)),
      error: () => {},
    });
  }

  goTo(ticker: string): void { this.router.navigate(['/ativo', ticker]); }
}
