import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { ScoreBadgeComponent } from '../../../shared/components/score-badge/score-badge.component';

interface Candidate {
  ticker: string;
  iq_score: number;
  rating: string;
  margin_of_safety: string;
  reason: string;
}

interface ShortData {
  candidates: Candidate[];
  n_candidates: number;
}

@Component({
  selector: 'iq-short-candidates',
  standalone: true,
  imports: [ScoreBadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (candidates().length > 0) {
      <div class="panel card">
        <div class="panel-header">
          <span class="overline">ATIVOS COM SINAL DE DETERIORAÇÃO</span>
          <span class="count-badge mono label">{{ candidates().length }}</span>
        </div>

        <div class="table-wrapper">
          <table>
            <thead><tr><th>Ticker</th><th>Score</th><th class="num">M. Seg.</th><th>Motivo</th></tr></thead>
            <tbody>
              @for (c of candidates(); track c.ticker) {
                <tr class="row" (click)="goTo(c.ticker)">
                  <td class="ticker mono">{{ c.ticker }}</td>
                  <td><iq-score-badge [score]="c.iq_score" /></td>
                  <td class="num mono neg">{{ c.margin_of_safety }}</td>
                  <td class="reason">{{ c.reason }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    }
  `,
  styles: [`
    .panel { padding: 16px; display: flex; flex-direction: column; gap: 10px; }
    .panel-header { display: flex; align-items: center; justify-content: space-between; }
    .count-badge { font-size: 10px; background: var(--neg-dim); color: var(--neg); padding: 1px 6px; border-radius: var(--radius); }
    .table-wrapper { overflow-x: auto; }
    table { width: 100%; border-spacing: 0; }
    th {
      font-family: var(--font-ui); font-size: 10px; font-weight: 600; text-transform: uppercase;
      letter-spacing: 0.06em; color: var(--t4); text-align: left; padding: 6px 8px;
      border-bottom: 1px solid var(--border);
    }
    td { padding: 6px 8px; font-size: 12px; color: var(--t2); border-bottom: 1px solid var(--border); }
    .row { cursor: pointer; transition: background var(--transition-fast); }
    .row:hover { background: var(--card-hover); }
    .ticker { font-weight: 700; }
    .num { text-align: right; }
    .reason { font-size: 11px; color: var(--t3); max-width: 200px; }
  `]
})
export class ShortCandidatesComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  readonly candidates = signal<Candidate[]>([]);

  ngOnInit(): void {
    this.api.get<ShortData>('/strategy/short-candidates').subscribe({
      next: d => this.candidates.set(d.candidates || []),
      error: () => {},
    });
  }

  goTo(ticker: string): void { this.router.navigate(['/ativo', ticker]); }
}
