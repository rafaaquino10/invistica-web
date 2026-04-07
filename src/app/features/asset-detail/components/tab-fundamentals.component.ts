import { Component, ChangeDetectionStrategy, inject, input, signal, OnInit } from '@angular/core';
import { DecimalPipe, PercentPipe, DatePipe } from '@angular/common';
import { ApiService } from '../../../core/services/api.service';

interface Financial {
  period: string;
  revenue: number | null;
  net_income: number | null;
  roe: number | null;
  roic: number | null;
  gross_margin: number | null;
  net_margin: number | null;
  ebitda_margin: number | null;
  dl_ebitda: number | null;
  piotroski_score: number | null;
}

@Component({
  selector: 'iq-tab-fundamentals',
  standalone: true,
  imports: [DecimalPipe, PercentPipe, DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="fund-tab">
      @if (financials().length > 0) {
        <div class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Período</th>
                <th class="num">Receita</th>
                <th class="num">Lucro</th>
                <th class="num">ROE</th>
                <th class="num">ROIC</th>
                <th class="num">M. Bruta</th>
                <th class="num">M. Líq.</th>
                <th class="num">DL/EBITDA</th>
                <th class="num">Piotroski</th>
              </tr>
            </thead>
            <tbody>
              @for (f of financials(); track f.period) {
                <tr>
                  <td class="mono">{{ f.period | date:'MM/yy' }}</td>
                  <td class="num mono">{{ f.revenue != null ? formatBR(f.revenue) : '--' }}</td>
                  <td class="num mono" [class.pos]="f.net_income != null && f.net_income > 0" [class.neg]="f.net_income != null && f.net_income < 0">
                    {{ f.net_income != null ? formatBR(f.net_income) : '--' }}
                  </td>
                  <td class="num mono">{{ f.roe != null ? (f.roe | percent:'1.1-1') : '--' }}</td>
                  <td class="num mono">{{ f.roic != null ? (f.roic | percent:'1.1-1') : '--' }}</td>
                  <td class="num mono">{{ f.gross_margin != null ? (f.gross_margin | percent:'1.1-1') : '--' }}</td>
                  <td class="num mono">{{ f.net_margin != null ? (f.net_margin | percent:'1.1-1') : '--' }}</td>
                  <td class="num mono">{{ f.dl_ebitda != null ? (f.dl_ebitda | number:'1.1-1') + 'x' : '--' }}</td>
                  <td class="num mono">{{ f.piotroski_score ?? '--' }}/9</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      } @else {
        <div class="empty label">Dados financeiros indisponíveis</div>
      }
    </div>
  `,
  styles: [`
    .fund-tab { display: flex; flex-direction: column; gap: 16px; }
    .table-wrapper { overflow-x: auto; }
    table { width: 100%; border-spacing: 0; }
    th {
      font-family: var(--font-ui); font-size: 10px; font-weight: 600; text-transform: uppercase;
      letter-spacing: 0.06em; color: var(--t4); text-align: left; padding: 6px 8px;
      border-bottom: 1px solid var(--border); white-space: nowrap;
    }
    td { padding: 7px 8px; font-size: 12px; color: var(--t2); border-bottom: 1px solid var(--border); }
    .num { text-align: right; }
    .empty { text-align: center; padding: 40px; color: var(--t3); }
  `]
})
export class TabFundamentalsComponent implements OnInit {
  private readonly api = inject(ApiService);
  ticker = input.required<string>();
  readonly financials = signal<Financial[]>([]);

  ngOnInit(): void {
    this.api.get<{ financials: Financial[] }>(`/tickers/${this.ticker()}/financials`, { limit: 8 }).subscribe({
      next: d => this.financials.set(d.financials || []),
      error: () => this.financials.set([]),
    });
  }

  formatBR(val: number): string {
    if (Math.abs(val) >= 1e9) return (val / 1e9).toFixed(1) + 'B';
    if (Math.abs(val) >= 1e6) return (val / 1e6).toFixed(0) + 'M';
    return val.toLocaleString('pt-BR');
  }
}
