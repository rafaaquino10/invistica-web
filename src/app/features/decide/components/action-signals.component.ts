import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { AssetCellComponent } from '../../../shared/components/asset-cell/asset-cell.component';

interface Signal {
  action: string;
  reason: string;
  ticker?: string;
  company_name?: string;
  from_ticker?: string;
  to_ticker?: string;
}

interface SignalsResponse {
  date: string;
  signals: Signal[];
}

const ACTION_ORDER: Record<string, number> = { VENDER: 0, SELL: 0, COMPRAR: 1, BUY: 1, AUMENTAR: 2, ROTACIONAR: 3, ROTATE: 3, CASH: 4, HOLD: 5 };

@Component({
  selector: 'iq-action-signals',
  standalone: true,
  imports: [AssetCellComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="panel card">
      <div class="panel-header">
        <span class="overline">O QUE FAZER AGORA</span>
      </div>

      <div class="signals-list">
        @for (s of signals(); track $index) {
          <div class="signal-card" (click)="s.ticker ? goTo(s.ticker) : null" [class.clickable]="!!s.ticker">
            @if (s.ticker) {
              <iq-asset-cell [ticker]="s.ticker" [name]="s.company_name || ''" />
            }
            <div class="signal-action-badge" [class]="actionClass(s.action)">
              {{ s.action }}
            </div>
            <p class="signal-reason">{{ s.reason }}</p>
            @if (s.from_ticker && s.to_ticker) {
              <div class="rotate-detail">
                <span class="mono">{{ s.from_ticker }}</span>
                <i class="ph ph-arrow-right"></i>
                <span class="mono">{{ s.to_ticker }}</span>
              </div>
            }
          </div>
        } @empty {
          <div class="empty-signals">
            <span class="label">Nenhum sinal ativo</span>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .panel { padding: 16px; display: flex; flex-direction: column; gap: 10px; }
    .panel-header { display: flex; align-items: center; }
    .signals-list { display: flex; flex-direction: column; gap: 8px; }
    .signal-card {
      display: flex; flex-direction: column; gap: 6px;
      padding: 12px; background: var(--bg-alt); border-radius: var(--radius);
      border: 1px solid var(--border); transition: border-color var(--transition-fast);
    }
    .signal-card.clickable { cursor: pointer; }
    .signal-card.clickable:hover { border-color: var(--border-hover); }
    .signal-action-badge {
      display: inline-flex; align-self: flex-start; padding: 4px 12px; border-radius: var(--radius);
      font-family: var(--font-ui); font-size: 11px; font-weight: 700;
      text-transform: uppercase; letter-spacing: 0.08em;
    }
    .action-buy { background: var(--pos-dim); color: var(--pos); }
    .action-sell { background: var(--neg-dim); color: var(--neg); }
    .action-increase { background: var(--volt-dim); color: var(--volt); }
    .action-rotate { background: var(--warn-dim); color: var(--warn); }
    .action-cash { background: var(--warn-dim); color: var(--warn); }
    .action-default { background: var(--elevated); color: var(--t2); }
    .signal-reason { font-size: 12px; color: var(--t2); line-height: 1.5; }
    .rotate-detail {
      display: flex; align-items: center; gap: 6px;
      font-size: 12px; color: var(--t3);
    }
    .rotate-detail i { font-size: 12px; color: var(--warn); }
    .empty-signals { display: flex; align-items: center; justify-content: center; min-height: 100px; color: var(--t4); }
  `]
})
export class ActionSignalsComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);

  readonly signals = signal<Signal[]>([]);

  ngOnInit(): void {
    this.api.get<SignalsResponse>('/strategy/signals').subscribe({
      next: d => {
        const sorted = [...(d.signals || [])].sort((a, b) => {
          const oa = ACTION_ORDER[a.action.toUpperCase()] ?? 9;
          const ob = ACTION_ORDER[b.action.toUpperCase()] ?? 9;
          return oa - ob;
        });
        this.signals.set(sorted);
      },
      error: () => this.signals.set([]),
    });
  }

  actionClass(action: string): string {
    const a = action.toUpperCase();
    if (a.includes('COMPRAR') || a === 'BUY') return 'action-buy';
    if (a.includes('VENDER') || a === 'SELL') return 'action-sell';
    if (a.includes('AUMENTAR')) return 'action-increase';
    if (a.includes('ROTACIONAR') || a === 'ROTATE') return 'action-rotate';
    if (a === 'CASH') return 'action-cash';
    return 'action-default';
  }

  goTo(ticker: string): void { this.router.navigate(['/ativo', ticker]); }
}
