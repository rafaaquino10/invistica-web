import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { ApiService } from '../../../core/services/api.service';

interface SimResult {
  ticker: string; name: string; shares: number; currentPrice: number;
  dividendYield: number; annualDividend: number; monthlyDividend: number;
}
interface SimResponse { totals: { annualDividend: number; monthlyDividend: number; avgYield: number }; results: SimResult[]; }

interface SearchResult { ticker: string; name: string; }

@Component({
  selector: 'iq-dividend-simulator',
  standalone: true,
  imports: [FormsModule, DecimalPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="panel glass sim-panel">
      <span class="overline">SIMULADOR DE DIVIDENDOS</span>

      <div class="tabs">
        <button class="tab" [class.active]="activeTab() === 'simulate'" (click)="activeTab.set('simulate')">Quanto eu receberia</button>
        <button class="tab" [class.active]="activeTab() === 'goal'" (click)="activeTab.set('goal')">Quanto preciso pra meta</button>
      </div>

      @if (activeTab() === 'simulate') {
        <!-- Tab A -->
        <div class="sim-inputs">
          @for (slot of simSlots(); track $index; let i = $index) {
            <div class="slot-row">
              <input class="input" type="text" placeholder="Ticker" [(ngModel)]="slot.ticker" />
              <input class="input mono" type="number" placeholder="R$" [(ngModel)]="slot.amount" min="0" />
              @if (i > 0) { <button class="remove-btn" (click)="removeSlot(i)"><i class="ph ph-x"></i></button> }
            </div>
          }
          @if (simSlots().length < 5) {
            <button class="add-slot-btn label" (click)="addSlot()"><i class="ph ph-plus"></i> Adicionar ativo</button>
          }
          <button class="btn-volt cta" (click)="simulate()">Simular</button>
        </div>

        @if (simResult()) {
          <div class="sim-results">
            <table>
              <thead><tr><th>Ticker</th><th class="num">Investido</th><th class="num">DY</th><th class="num">Anual R$</th><th class="num">Mensal R$</th></tr></thead>
              <tbody>
                @for (r of simResult()!.results; track r.ticker) {
                  <tr>
                    <td class="mono ticker-val">{{ r.ticker }}</td>
                    <td class="num mono">{{ r.currentPrice * r.shares | number:'1.0-0' }}</td>
                    <td class="num mono">{{ r.dividendYield | number:'1.1-1' }}%</td>
                    <td class="num mono">{{ r.annualDividend | number:'1.0-0' }}</td>
                    <td class="num mono">{{ r.monthlyDividend | number:'1.0-0' }}</td>
                  </tr>
                }
              </tbody>
            </table>
            <div class="sim-totals">
              <div class="total-item">
                <span class="label">Renda Anual</span>
                <span class="mono total-val">R$ {{ simResult()!.totals.annualDividend | number:'1.0-0' }}</span>
              </div>
              <div class="total-item">
                <span class="label">Renda Mensal</span>
                <span class="mono total-val volt">R$ {{ simResult()!.totals.monthlyDividend | number:'1.0-0' }}</span>
              </div>
            </div>
          </div>
        }
      } @else {
        <!-- Tab B: Goal Calculator -->
        <div class="goal-form">
          <div class="goal-field">
            <label class="label">Meta mensal (R$)</label>
            <input class="input mono" type="number" [(ngModel)]="goalMonthly" min="100" step="500" />
          </div>
          <div class="goal-field">
            <label class="label">DY médio esperado (%)</label>
            <input class="input mono" type="number" [(ngModel)]="goalDY" min="1" max="30" step="0.5" />
          </div>

          <div class="goal-result card">
            <span class="label">Patrimônio necessário:</span>
            <span class="mono goal-val">R$ {{ requiredPatrimony() | number:'1.0-0' }}</span>
            <span class="label goal-note">com DY médio de {{ goalDY }}%</span>
          </div>

          @if (currentPatrimony() > 0) {
            <div class="goal-progress">
              <span class="label">Você já tem <span class="mono">R$ {{ currentPatrimony() | number:'1.0-0' }}</span>. Faltam <span class="mono neg">R$ {{ gap() | number:'1.0-0' }}</span>.</span>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .sim-panel { padding: 20px; border: 1px solid var(--volt-dim); border-radius: var(--radius); }
    .tabs { display: flex; gap: 2px; border-bottom: 1px solid var(--border); margin-bottom: 12px; }
    .tab { padding: 6px 12px; font-family: var(--font-ui); font-size: 12px; font-weight: 500; color: var(--t3); border-bottom: 2px solid transparent; }
    .tab:hover { color: var(--t1); }
    .tab.active { color: var(--volt); border-bottom-color: var(--volt); font-weight: 700; }
    .sim-inputs { display: flex; flex-direction: column; gap: 8px; }
    .slot-row { display: flex; gap: 8px; align-items: center; }
    .input { height: 32px; padding: 0 8px; background: var(--bg-alt); border: 1px solid var(--border); border-radius: var(--radius); color: var(--t1); font-size: 12px; flex: 1; }
    .input:focus { border-color: var(--border-active); outline: none; }
    .remove-btn { width: 24px; height: 24px; color: var(--t3); font-size: 10px; border-radius: var(--radius); }
    .remove-btn:hover { background: var(--neg-dim); color: var(--neg); }
    .add-slot-btn { color: var(--t3); font-size: 11px; display: flex; align-items: center; gap: 4px; }
    .add-slot-btn:hover { color: var(--t1); }
    .btn-volt { padding: 8px 20px; background: var(--volt); color: #050505; border-radius: var(--radius); font-weight: 700; align-self: flex-start; margin-top: 4px; }
    .sim-results { display: flex; flex-direction: column; gap: 10px; margin-top: 12px; }
    table { width: 100%; border-spacing: 0; }
    th { font-family: var(--font-ui); font-size: 9px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: var(--t4); text-align: left; padding: 4px 6px; border-bottom: 1px solid var(--border); }
    td { padding: 5px 6px; font-size: 12px; color: var(--t2); border-bottom: 1px solid var(--border); }
    .num { text-align: right; }
    .ticker-val { font-weight: 700; color: var(--volt); }
    .sim-totals { display: flex; gap: 24px; padding-top: 8px; border-top: 1px solid var(--border); }
    .total-item { display: flex; flex-direction: column; gap: 2px; }
    .total-val { font-size: 18px; font-weight: 700; color: var(--t1); }
    .volt { color: var(--volt); text-shadow: var(--volt-glow); }
    .goal-form { display: flex; flex-direction: column; gap: 12px; }
    .goal-field { display: flex; flex-direction: column; gap: 4px; }
    .goal-result { padding: 14px; display: flex; flex-direction: column; gap: 4px; align-items: center; }
    .goal-val { font-size: 24px; font-weight: 700; color: var(--volt); text-shadow: var(--volt-glow); }
    .goal-note { color: var(--t3); }
    .goal-progress { font-size: 13px; color: var(--t2); }
  `]
})
export class DividendSimulatorComponent {
  private readonly api = inject(ApiService);
  readonly activeTab = signal<'simulate' | 'goal'>('simulate');
  readonly simSlots = signal<{ ticker: string; amount: number }[]>([{ ticker: '', amount: 10000 }]);
  readonly simResult = signal<SimResponse | null>(null);

  goalMonthly = 3000;
  goalDY = 6;
  readonly currentPatrimony = signal(0);

  requiredPatrimony = () => this.goalDY > 0 ? (this.goalMonthly * 12) / (this.goalDY / 100) : 0;
  gap = () => Math.max(0, this.requiredPatrimony() - this.currentPatrimony());

  addSlot(): void { this.simSlots.update(s => [...s, { ticker: '', amount: 10000 }]); }
  removeSlot(i: number): void { this.simSlots.update(s => s.filter((_, idx) => idx !== i)); }

  simulate(): void {
    const slots = this.simSlots().filter(s => s.ticker && s.amount > 0);
    if (!slots.length) return;
    this.api.post<SimResponse>('/dividends/simulate', {
      tickers: slots.map(s => s.ticker.toUpperCase()),
      amounts: slots.map(s => s.amount),
    }).subscribe({
      next: d => this.simResult.set(d),
      error: () => this.simResult.set(null),
    });
  }
}
