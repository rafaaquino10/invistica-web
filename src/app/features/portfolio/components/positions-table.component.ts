import { Component, ChangeDetectionStrategy, input, output, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { DecimalPipe, PercentPipe } from '@angular/common';
import { AssetCellComponent } from '../../../shared/components/asset-cell/asset-cell.component';
import { ScoreBadgeComponent } from '../../../shared/components/score-badge/score-badge.component';

export interface EnrichedPosition {
  id: string;
  ticker: string;
  company_name: string;
  quantity: number;
  avg_price: number;
  current_price: number;
  current_value: number;
  weight: number;
  change_pct: number;
  result_brl: number;
  result_pct: number;
  iq_score: number | null;
  cluster_id: number;
  has_alert: boolean;
}

type SortKey = 'ticker' | 'iq_score' | 'current_value' | 'change_pct' | 'result_pct' | 'weight';

@Component({
  selector: 'iq-positions-table',
  standalone: true,
  imports: [DecimalPipe, PercentPipe, AssetCellComponent, ScoreBadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="panel card">
      <div class="table-header">
        <span class="overline">POSIÇÕES</span>
        <div class="table-actions">
          <button class="btn-volt cta" (click)="addPosition.emit()">Adicionar Posição</button>
          <button class="btn-outline cta" (click)="connectBroker.emit()">Conectar Corretora</button>
        </div>
      </div>

      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th (click)="toggleSort('ticker')">Ativo</th>
              <th (click)="toggleSort('iq_score')">Score</th>
              <th class="num">Qtd</th>
              <th class="num">PM</th>
              <th class="num">Atual</th>
              <th class="num" (click)="toggleSort('change_pct')">Dia %</th>
              <th class="num">Result. R$</th>
              <th class="num" (click)="toggleSort('result_pct')">Result. %</th>
              <th class="num" (click)="toggleSort('weight')">Peso</th>
              <th class="col-status">⚡</th>
              <th class="col-menu"></th>
            </tr>
          </thead>
          <tbody>
            @for (p of sorted(); track p.id) {
              <tr class="row" [class]="'band-' + getBand(p.iq_score)" (click)="goTo(p.ticker)">
                <td><iq-asset-cell [ticker]="p.ticker" [name]="p.company_name" /></td>
                <td>@if (p.iq_score != null) { <iq-score-badge [score]="p.iq_score" /> } @else { <span class="mono">--</span> }</td>
                <td class="num mono">{{ p.quantity | number:'1.0-0' }}</td>
                <td class="num mono">{{ p.avg_price | number:'1.2-2' }}</td>
                <td class="num mono">{{ p.current_price | number:'1.2-2' }}</td>
                <td class="num mono" [class.pos]="p.change_pct >= 0" [class.neg]="p.change_pct < 0">
                  {{ p.change_pct >= 0 ? '+' : '' }}{{ p.change_pct | number:'1.2-2' }}%
                </td>
                <td class="num mono" [class.pos]="p.result_brl >= 0" [class.neg]="p.result_brl < 0">
                  {{ p.result_brl >= 0 ? '+' : '' }}{{ p.result_brl | number:'1.0-0' }}
                </td>
                <td class="num mono" [class.pos]="p.result_pct >= 0" [class.neg]="p.result_pct < 0">
                  {{ p.result_pct >= 0 ? '+' : '' }}{{ p.result_pct | number:'1.1-1' }}%
                </td>
                <td class="num mono">{{ (p.weight * 100) | number:'1.1-1' }}%</td>
                <td class="col-status">
                  @if (p.has_alert) { <i class="ph ph-warning warn"></i> }
                </td>
                <td class="col-menu" (click)="$event.stopPropagation()">
                  <button class="menu-btn" (click)="openMenu(p)">
                    <i class="ph ph-dots-three-vertical"></i>
                  </button>
                  @if (menuOpen() === p.id) {
                    <div class="dropdown">
                      <button (click)="editPosition.emit(p); menuOpen.set(null)">Editar</button>
                      <button (click)="deletePosition.emit(p); menuOpen.set(null)">Remover</button>
                    </div>
                  }
                </td>
              </tr>
            }
          </tbody>
          <tfoot>
            <tr class="footer-row">
              <td colspan="6" class="label">Total</td>
              <td class="num mono" [class.pos]="totalResult() >= 0" [class.neg]="totalResult() < 0">
                {{ totalResult() >= 0 ? '+' : '' }}{{ totalResult() | number:'1.0-0' }}
              </td>
              <td class="num mono" [class.pos]="totalResultPct() >= 0" [class.neg]="totalResultPct() < 0">
                {{ totalResultPct() >= 0 ? '+' : '' }}{{ totalResultPct() | number:'1.1-1' }}%
              </td>
              <td colspan="3"></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .panel { padding: 16px; display: flex; flex-direction: column; gap: 10px; }
    .table-header { display: flex; align-items: center; justify-content: space-between; }
    .table-actions { display: flex; gap: 6px; }
    .btn-volt { padding: 6px 14px; background: var(--volt); color: #050505; border-radius: var(--radius); font-weight: 700; }
    .btn-outline { padding: 6px 14px; border: 1px solid var(--border); color: var(--t3); border-radius: var(--radius); }
    .table-wrapper { overflow-x: auto; }
    table { width: 100%; border-spacing: 0; }
    th {
      font-family: var(--font-ui); font-size: 9px; font-weight: 600; text-transform: uppercase;
      letter-spacing: 0.06em; color: var(--t4); text-align: left; padding: 5px 6px;
      border-bottom: 1px solid var(--border); cursor: pointer; white-space: nowrap;
    }
    td { padding: 6px 6px; font-size: 12px; color: var(--t2); border-bottom: 1px solid var(--border); vertical-align: middle; }
    .num { text-align: right; }
    .row { cursor: pointer; transition: background var(--transition-fast); border-left: 2px solid transparent; }
    .row:hover { background: var(--card-hover); }
    .row:hover.band-strong-buy { border-left-color: var(--volt); }
    .row:hover.band-buy { border-left-color: var(--pos); }
    .row:hover.band-hold { border-left-color: var(--warn); }
    .col-status { width: 30px; text-align: center; }
    .col-status i { font-size: 14px; }
    .col-menu { width: 30px; position: relative; }
    .menu-btn { width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; color: var(--t3); border-radius: var(--radius); }
    .menu-btn:hover { background: var(--elevated); color: var(--t1); }
    .dropdown {
      position: absolute; top: 100%; right: 0; background: var(--card); border: 1px solid var(--border);
      border-radius: var(--radius); z-index: 10; min-width: 130px; padding: 4px;
    }
    .dropdown button {
      display: block; width: 100%; padding: 6px 10px; text-align: left; font-size: 12px; color: var(--t2);
      border-radius: var(--radius); transition: background var(--transition-fast);
    }
    .dropdown button:hover { background: var(--elevated); color: var(--t1); }
    .footer-row td { font-weight: 700; border-top: 1px solid var(--border); }
  `]
})
export class PositionsTableComponent {
  private readonly router = inject(Router);
  positions = input.required<EnrichedPosition[]>();
  addPosition = output<void>();
  connectBroker = output<void>();
  editPosition = output<EnrichedPosition>();
  deletePosition = output<EnrichedPosition>();

  readonly menuOpen = signal<string | null>(null);
  private sortKey = signal<SortKey | null>(null);
  private sortDir = signal<'asc' | 'desc'>('desc');

  readonly sorted = computed(() => {
    const list = [...this.positions()];
    const key = this.sortKey();
    if (!key) return list;
    const dir = this.sortDir() === 'asc' ? 1 : -1;
    return list.sort((a, b) => {
      const va = (a as any)[key] ?? -Infinity;
      const vb = (b as any)[key] ?? -Infinity;
      return (typeof va === 'string' ? va.localeCompare(vb) : va - vb) * dir;
    });
  });

  readonly totalResult = computed(() => this.positions().reduce((s, p) => s + p.result_brl, 0));
  readonly totalResultPct = computed(() => {
    const cost = this.positions().reduce((s, p) => s + p.avg_price * p.quantity, 0);
    return cost > 0 ? (this.totalResult() / cost) * 100 : 0;
  });

  toggleSort(key: SortKey): void {
    if (this.sortKey() === key) this.sortDir.update(d => d === 'asc' ? 'desc' : 'asc');
    else { this.sortKey.set(key); this.sortDir.set('desc'); }
  }

  getBand(score: number | null): string {
    if (score == null) return 'hold';
    if (score >= 82) return 'strong-buy';
    if (score >= 70) return 'buy';
    if (score >= 45) return 'hold';
    if (score >= 30) return 'reduce';
    return 'avoid';
  }

  openMenu(p: EnrichedPosition): void { this.menuOpen.set(this.menuOpen() === p.id ? null : p.id); }
  goTo(ticker: string): void { this.router.navigate(['/ativo', ticker]); }
}
