import { Component, ChangeDetectionStrategy, input, inject } from '@angular/core';
import { Router } from '@angular/router';
import { DatePipe, DecimalPipe } from '@angular/common';
import { AssetCellComponent } from '../../../shared/components/asset-cell/asset-cell.component';
import { CalendarEntry } from './your-upcoming.component';

@Component({
  selector: 'iq-market-calendar',
  standalone: true,
  imports: [DatePipe, DecimalPipe, AssetCellComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="panel card">
      <span class="overline">CALENDÁRIO DO MERCADO</span>
      @if (calendar().length > 0) {
        <div class="table-wrapper">
          <table>
            <thead><tr><th>Data-com</th><th>Ativo</th><th>Tipo</th><th class="num">Valor/ação</th></tr></thead>
            <tbody>
              @for (e of calendar(); track e.ticker + e.ex_date) {
                <tr class="row" [class.in-portfolio]="portfolioTickers().has(e.ticker)" (click)="goTo(e.ticker)">
                  <td class="mono">{{ e.ex_date | date:'dd/MM/yy' }}</td>
                  <td>
                    <iq-asset-cell [ticker]="e.ticker" [name]="e.company_name" />
                    @if (portfolioTickers().has(e.ticker)) { <span class="in-badge">Na carteira</span> }
                  </td>
                  <td><span class="type-badge" [class]="'type-' + e.type.toLowerCase()">{{ e.type }}</span></td>
                  <td class="num mono">R$ {{ e.value_per_share | number:'1.4-4' }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      } @else {
        <span class="empty label">Nenhum provento agendado</span>
      }
    </div>
  `,
  styles: [`
    .panel { padding: 16px; display: flex; flex-direction: column; gap: 10px; }
    .table-wrapper { max-height: 400px; overflow-y: auto; }
    table { width: 100%; border-spacing: 0; }
    th { font-family: var(--font-ui); font-size: 9px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: var(--t4); text-align: left; padding: 5px 6px; border-bottom: 1px solid var(--border); }
    td { padding: 6px 6px; font-size: 12px; color: var(--t2); border-bottom: 1px solid var(--border); vertical-align: middle; }
    .num { text-align: right; }
    .row { cursor: pointer; transition: background var(--transition-fast); border-left: 2px solid transparent; }
    .row:hover { background: var(--card-hover); }
    .row.in-portfolio { border-left-color: var(--volt); }
    .in-badge { font-size: 8px; font-weight: 700; text-transform: uppercase; padding: 1px 4px; border-radius: var(--radius); background: var(--volt-dim); color: var(--volt); margin-left: 4px; }
    .type-badge { padding: 1px 6px; border-radius: var(--radius); font-size: 9px; font-weight: 700; text-transform: uppercase; }
    .type-dividend, .type-dividendo { background: var(--pos-dim); color: var(--pos); }
    .type-jscp, .type-jcp { background: var(--warn-dim); color: var(--warn); }
    .empty { color: var(--t4); text-align: center; padding: 20px; }
  `]
})
export class MarketCalendarComponent {
  private readonly router = inject(Router);
  calendar = input.required<CalendarEntry[]>();
  portfolioTickers = input(new Set<string>());
  goTo(ticker: string): void { this.router.navigate(['/ativo', ticker]); }
}
