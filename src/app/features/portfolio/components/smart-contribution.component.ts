import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { ApiService } from '../../../core/services/api.service';

interface Suggestion { ticker: string; amount: number; pct: number; reason: string; }

@Component({
  selector: 'iq-smart-contribution',
  standalone: true,
  imports: [FormsModule, DecimalPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="panel card">
      <span class="overline">APORTE INTELIGENTE</span>
      <div class="input-row">
        <label class="label">Valor (R$)</label>
        <input class="input mono" type="number" [(ngModel)]="amount" (ngModelChange)="onAmountChange($event)" min="100" step="100" />
      </div>

      @if (suggestions().length > 0) {
        <table>
          <thead><tr><th>Ticker</th><th class="num">R$</th><th class="num">%</th><th>Motivo</th></tr></thead>
          <tbody>
            @for (s of suggestions(); track s.ticker) {
              <tr>
                <td class="ticker mono">{{ s.ticker }}</td>
                <td class="num mono">{{ s.amount | number:'1.0-0' }}</td>
                <td class="num mono">{{ s.pct | number:'1.0-0' }}%</td>
                <td class="reason">{{ s.reason }}</td>
              </tr>
            }
          </tbody>
        </table>
      } @else {
        <span class="empty label">{{ loading() ? 'Calculando...' : 'Sem sugestões' }}</span>
      }
    </div>
  `,
  styles: [`
    .panel { padding: 14px; display: flex; flex-direction: column; gap: 10px; }
    .input-row { display: flex; align-items: center; gap: 8px; }
    .input { width: 120px; height: 32px; padding: 0 8px; background: var(--bg-alt); border: 1px solid var(--border); border-radius: var(--radius); color: var(--t1); font-size: 13px; }
    .input:focus { border-color: var(--border-active); outline: none; }
    table { width: 100%; border-spacing: 0; }
    th { font-family: var(--font-ui); font-size: 9px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: var(--t4); text-align: left; padding: 4px 6px; border-bottom: 1px solid var(--border); }
    td { padding: 5px 6px; font-size: 12px; color: var(--t2); border-bottom: 1px solid var(--border); }
    .ticker { font-weight: 700; color: var(--volt); }
    .num { text-align: right; }
    .reason { font-size: 10px; color: var(--t3); max-width: 120px; }
    .empty { color: var(--t4); }
  `]
})
export class SmartContributionComponent implements OnInit {
  private readonly api = inject(ApiService);
  amount = 1000;
  readonly suggestions = signal<Suggestion[]>([]);
  readonly loading = signal(false);
  private timeout: ReturnType<typeof setTimeout> | null = null;

  ngOnInit(): void { this.load(); }

  onAmountChange(val: number): void {
    if (this.timeout) clearTimeout(this.timeout);
    this.timeout = setTimeout(() => { this.amount = val; this.load(); }, 500);
  }

  private load(): void {
    this.loading.set(true);
    this.api.get<{ suggestions: Suggestion[] }>('/portfolio/smart-contribution', { aporte_total: this.amount }).subscribe({
      next: d => { this.suggestions.set(d.suggestions || []); this.loading.set(false); },
      error: () => { this.suggestions.set([]); this.loading.set(false); },
    });
  }
}
