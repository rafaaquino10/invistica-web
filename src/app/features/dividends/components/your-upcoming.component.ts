import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { AssetCellComponent } from '../../../shared/components/asset-cell/asset-cell.component';

export interface CalendarEntry {
  ticker: string; company_name: string; ex_date: string; value_per_share: number; type: string;
}

@Component({
  selector: 'iq-your-upcoming',
  standalone: true,
  imports: [DatePipe, DecimalPipe, AssetCellComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="panel glass upcoming-panel">
      <div class="panel-top">
        <span class="overline">SEUS PRÓXIMOS PROVENTOS</span>
        <span class="total mono">R$ {{ totalEstimated() | number:'1.2-2' }}</span>
      </div>
      @if (filtered().length > 0) {
        <table>
          <thead><tr><th>Data-com</th><th>Ativo</th><th>Tipo</th><th class="num">Valor/ação</th><th class="num">Est. Total</th></tr></thead>
          <tbody>
            @for (e of filtered(); track e.ticker + e.ex_date) {
              <tr>
                <td class="mono">{{ e.ex_date | date:'dd/MM' }}</td>
                <td><iq-asset-cell [ticker]="e.ticker" [name]="e.company_name" /></td>
                <td><span class="type-badge" [class]="'type-' + e.type.toLowerCase()">{{ e.type }}</span></td>
                <td class="num mono">R$ {{ e.value_per_share | number:'1.4-4' }}</td>
                <td class="num mono volt">R$ {{ e.estimated | number:'1.2-2' }}</td>
              </tr>
            }
          </tbody>
        </table>
      } @else {
        <p class="empty label">Sem proventos agendados nos próximos 60 dias</p>
      }
    </div>
  `,
  styles: [`
    .upcoming-panel { padding: 16px; border-left: 3px solid var(--volt); border-radius: var(--radius); }
    .panel-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
    .total { font-size: 20px; font-weight: 700; color: var(--volt); text-shadow: var(--volt-glow); }
    table { width: 100%; border-spacing: 0; }
    th { font-family: var(--font-ui); font-size: 9px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: var(--t4); text-align: left; padding: 5px 6px; border-bottom: 1px solid var(--border); }
    td { padding: 6px 6px; font-size: 12px; color: var(--t2); border-bottom: 1px solid var(--border); vertical-align: middle; }
    .num { text-align: right; }
    .volt { color: var(--volt); font-weight: 700; }
    .type-badge { padding: 1px 6px; border-radius: var(--radius); font-size: 9px; font-weight: 700; text-transform: uppercase; }
    .type-dividend, .type-dividendo { background: var(--pos-dim); color: var(--pos); }
    .type-jscp, .type-jcp { background: var(--warn-dim); color: var(--warn); }
    .empty { text-align: center; padding: 20px; color: var(--t3); }
  `]
})
export class YourUpcomingComponent {
  calendar = input.required<CalendarEntry[]>();
  portfolioTickers = input.required<Map<string, number>>();

  filtered = computed(() => {
    const map = this.portfolioTickers();
    return this.calendar()
      .filter(e => map.has(e.ticker))
      .map(e => ({ ...e, estimated: e.value_per_share * (map.get(e.ticker) || 0) }));
  });

  totalEstimated = computed(() => this.filtered().reduce((s, e) => s + (e as any).estimated, 0));
}
