import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';

interface RadarAlert { id: string; ticker: string; type: string; threshold?: number; status: string; }
interface SearchResult { ticker: string; name: string; }

@Component({
  selector: 'iq-alerts-manager',
  standalone: true,
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="section">
      <div class="section-header">
        <span class="overline">MEUS ALERTAS</span>
        <button class="add-btn" (click)="showForm.set(!showForm())">
          <i class="ph ph-{{ showForm() ? 'minus' : 'plus' }}"></i>
        </button>
      </div>

      @if (showForm()) {
        <div class="form">
          <input class="input" type="text" placeholder="Ticker..." [(ngModel)]="newTicker" />
          <select class="input" [(ngModel)]="newType">
            <option value="price_above">Preço acima</option>
            <option value="price_below">Preço abaixo</option>
            <option value="score_change">Mudança de score</option>
            <option value="dividend">Dividendo</option>
          </select>
          @if (newType === 'price_above' || newType === 'price_below') {
            <input class="input mono" type="number" placeholder="R$" [(ngModel)]="newThreshold" />
          }
          <button class="btn-volt" (click)="create()">Criar</button>
        </div>
      }

      @for (a of alerts(); track a.id) {
        <div class="alert-item">
          <span class="alert-ticker mono">{{ a.ticker }}</span>
          <span class="alert-cond label">{{ formatCondition(a) }}</span>
          <span class="status-badge" [class]="a.status === 'triggered' ? 'status-fired' : 'status-active'">
            {{ a.status === 'triggered' ? 'Disparado' : 'Ativo' }}
          </span>
          <button class="del-btn" (click)="remove(a.id)"><i class="ph ph-x"></i></button>
        </div>
      } @empty {
        <span class="empty label">Nenhum alerta configurado</span>
      }
    </div>
  `,
  styles: [`
    .section { display: flex; flex-direction: column; gap: 6px; }
    .section-header { display: flex; justify-content: space-between; align-items: center; }
    .add-btn { width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; color: var(--t3); font-size: 12px; border-radius: var(--radius); }
    .add-btn:hover { background: var(--elevated); color: var(--t1); }
    .form { display: flex; flex-direction: column; gap: 6px; padding: 8px; background: var(--bg-alt); border-radius: var(--radius); }
    .input { height: 30px; padding: 0 8px; background: var(--card); border: 1px solid var(--border); border-radius: var(--radius); color: var(--t1); font-size: 11px; }
    .input:focus { border-color: var(--border-active); outline: none; }
    select.input { font-family: var(--font-ui); }
    select.input option { background: var(--card); }
    .btn-volt { padding: 4px 12px; background: var(--volt); color: #050505; border-radius: var(--radius); font-size: 10px; font-weight: 700; align-self: flex-start; }
    .alert-item { display: flex; align-items: center; gap: 6px; padding: 6px 0; border-bottom: 1px solid var(--border); }
    .alert-item:last-child { border-bottom: none; }
    .alert-ticker { font-size: 11px; font-weight: 700; min-width: 45px; }
    .alert-cond { flex: 1; font-size: 10px; color: var(--t3); }
    .status-badge { font-size: 8px; font-weight: 700; text-transform: uppercase; padding: 1px 4px; border-radius: var(--radius); }
    .status-active { background: var(--volt-dim); color: var(--volt); }
    .status-fired { background: var(--pos-dim); color: var(--pos); }
    .del-btn { width: 18px; height: 18px; display: flex; align-items: center; justify-content: center; color: var(--t4); font-size: 9px; border-radius: var(--radius); }
    .del-btn:hover { background: var(--neg-dim); color: var(--neg); }
    .empty { color: var(--t4); font-size: 11px; padding: 8px 0; }
  `]
})
export class AlertsManagerComponent implements OnInit {
  private readonly api = inject(ApiService);
  readonly alerts = signal<RadarAlert[]>([]);
  readonly showForm = signal(false);
  newTicker = '';
  newType = 'price_above';
  newThreshold = 0;

  ngOnInit(): void {
    this.api.get<{ alerts: RadarAlert[] }>('/radar/alerts').subscribe({
      next: d => this.alerts.set(d.alerts || []),
      error: () => {},
    });
  }

  formatCondition(a: RadarAlert): string {
    if (a.type === 'price_above') return `preço acima R$ ${a.threshold}`;
    if (a.type === 'price_below') return `preço abaixo R$ ${a.threshold}`;
    if (a.type === 'score_change') return 'mudança de score';
    return 'dividendo anunciado';
  }

  create(): void {
    if (!this.newTicker) return;
    const body: any = { ticker: this.newTicker.toUpperCase(), type: this.newType };
    if (this.newThreshold) body.threshold = this.newThreshold;
    this.api.post<RadarAlert>('/radar/alerts', body).subscribe({
      next: (a) => { this.alerts.update(list => [a, ...list]); this.showForm.set(false); this.newTicker = ''; },
      error: () => {},
    });
  }

  remove(id: string): void {
    this.api.delete(`/radar/alerts/${id}`).subscribe({
      next: () => this.alerts.update(list => list.filter(a => a.id !== id)),
      error: () => {},
    });
  }
}
