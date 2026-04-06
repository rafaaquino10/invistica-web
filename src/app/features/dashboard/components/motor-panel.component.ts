import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { ApiService } from '../../../core/services/api.service';

interface PerformanceData {
  ic_spearman_1m: number | null;
  hit_rate_buy_6m: number | null;
  alpha_medio_buy: number | null;
  sharpe_ratio: number | null;
  max_drawdown: number | null;
  status: string;
}

@Component({
  selector: 'iq-motor-panel',
  standalone: true,
  imports: [DecimalPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="panel card">
      <div class="panel-header">
        <span class="overline">MOTOR IQ-COGNIT</span>
      </div>

      <div class="kpi-grid">
        <div class="kpi-cell">
          <span class="kpi-label label">CAGR</span>
          <span class="kpi-value mono" [class.volt-glow]="cagr() != null && cagr()! > 0">
            {{ cagr() != null ? (cagr()! | number:'1.1-1') + '%' : '--' }}
          </span>
        </div>
        <div class="kpi-cell">
          <span class="kpi-label label">Alpha IBOV</span>
          <span class="kpi-value mono" [class.volt-glow]="alpha() != null && alpha()! > 0">
            {{ alpha() != null ? (alpha()! | number:'1.1-1') + '%' : '--' }}
          </span>
        </div>
        <div class="kpi-cell">
          <span class="kpi-label label">Sharpe</span>
          <span class="kpi-value mono">
            {{ sharpe() != null ? (sharpe()! | number:'1.2-2') : '--' }}
          </span>
        </div>
        <div class="kpi-cell">
          <span class="kpi-label label">Max Drawdown</span>
          <span class="kpi-value mono neg">
            {{ drawdown() != null ? (drawdown()! | number:'1.1-1') + '%' : '--' }}
          </span>
        </div>
      </div>

      <div class="status-line">
        <i class="ph-fill ph-circle status-dot"></i>
        <span class="label">{{ statusText() }}</span>
      </div>
    </div>
  `,
  styles: [`
    .panel { padding: 16px; display: flex; flex-direction: column; gap: 12px; }
    .panel-header { display: flex; align-items: center; }
    .kpi-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
    .kpi-cell {
      display: flex; flex-direction: column; gap: 4px;
      padding: 10px; background: var(--bg-alt); border-radius: var(--radius);
    }
    .kpi-label { color: var(--t4); font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; }
    .kpi-value { font-size: 20px; font-weight: 700; color: var(--t1); }
    .volt-glow { color: var(--volt); text-shadow: var(--volt-glow); }
    .status-line {
      display: flex; align-items: center; gap: 6px;
      padding-top: 4px; border-top: 1px solid var(--border);
    }
    .status-dot { font-size: 6px; color: var(--pos); }
    .status-line .label { font-size: 11px; color: var(--t3); }
  `]
})
export class MotorPanelComponent implements OnInit {
  private readonly api = inject(ApiService);

  readonly cagr = signal<number | null>(null);
  readonly alpha = signal<number | null>(null);
  readonly sharpe = signal<number | null>(null);
  readonly drawdown = signal<number | null>(null);
  readonly statusText = signal('Carregando...');

  ngOnInit(): void {
    this.api.get<PerformanceData>('/scores/performance').subscribe({
      next: (d) => {
        this.cagr.set(d.alpha_medio_buy);
        this.alpha.set(d.alpha_medio_buy);
        this.sharpe.set(d.sharpe_ratio);
        this.drawdown.set(d.max_drawdown);
        this.statusText.set(d.status || 'Modelo ativo');
      },
      error: () => this.statusText.set('Erro ao carregar'),
    });
  }
}
