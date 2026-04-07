import { Component, ChangeDetectionStrategy, inject, input, signal, OnInit } from '@angular/core';
import { DecimalPipe, DatePipe } from '@angular/common';
import { ApiService } from '../../../core/services/api.service';

interface Dividend { ex_date: string; type: string; value_per_share: number; payment_date: string | null; }
interface SafetyData { dividend_safety: number; dividend_yield_proj: number | null; }
interface TrapData { is_trap: boolean; risk_score: number; reasons: string[]; }

@Component({
  selector: 'iq-tab-dividends',
  standalone: true,
  imports: [DecimalPipe, DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="div-tab">
      <div class="badges-row">
        @if (safety(); as s) {
          <div class="badge-card card">
            <span class="overline">SEGURANÇA</span>
            <span class="badge-val mono" [class.pos]="s.dividend_safety >= 70" [class.warn]="s.dividend_safety < 70 && s.dividend_safety >= 45" [class.neg]="s.dividend_safety < 45">
              {{ s.dividend_safety }}/100
            </span>
            @if (s.dividend_yield_proj != null) {
              <span class="label">DY Proj: <span class="mono">{{ (s.dividend_yield_proj * 100).toFixed(1) }}%</span></span>
            }
          </div>
        }
        @if (trap(); as t) {
          <div class="badge-card card">
            <span class="overline">TRAP RISK</span>
            <span class="badge-val mono" [class.neg]="t.is_trap" [class.pos]="!t.is_trap">
              {{ t.is_trap ? 'RISCO' : 'OK' }}
            </span>
            @for (r of t.reasons; track $index) {
              <span class="trap-reason label">{{ r }}</span>
            }
          </div>
        }
      </div>

      @if (dividends().length > 0) {
        <div class="table-wrapper">
          <table>
            <thead><tr><th>Data Ex</th><th>Tipo</th><th class="num">Valor/Ação</th><th>Pagamento</th></tr></thead>
            <tbody>
              @for (d of dividends(); track d.ex_date + d.value_per_share) {
                <tr>
                  <td class="mono">{{ d.ex_date | date:'dd/MM/yy' }}</td>
                  <td class="label">{{ d.type }}</td>
                  <td class="num mono">R$ {{ d.value_per_share | number:'1.4-4' }}</td>
                  <td class="mono">{{ d.payment_date ? (d.payment_date | date:'dd/MM/yy') : '--' }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      } @else {
        <div class="empty label">Sem histórico de dividendos</div>
      }
    </div>
  `,
  styles: [`
    .div-tab { display: flex; flex-direction: column; gap: 16px; }
    .badges-row { display: flex; gap: 12px; }
    .badge-card { padding: 14px; display: flex; flex-direction: column; gap: 4px; flex: 1; }
    .badge-val { font-size: 20px; font-weight: 700; }
    .trap-reason { font-size: 11px; color: var(--t3); }
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
export class TabDividendsComponent implements OnInit {
  private readonly api = inject(ApiService);
  ticker = input.required<string>();
  readonly dividends = signal<Dividend[]>([]);
  readonly safety = signal<SafetyData | null>(null);
  readonly trap = signal<TrapData | null>(null);

  ngOnInit(): void {
    const t = this.ticker();
    this.api.get<{ dividends: Dividend[] }>(`/tickers/${t}/dividends`).subscribe({
      next: d => this.dividends.set(d.dividends || []),
      error: () => {},
    });
    this.api.get<SafetyData>(`/dividends/${t}/safety`).subscribe({ next: d => this.safety.set(d), error: () => {} });
    this.api.get<TrapData>(`/dividends/${t}/trap-risk`).subscribe({ next: d => this.trap.set(d), error: () => {} });
  }
}
