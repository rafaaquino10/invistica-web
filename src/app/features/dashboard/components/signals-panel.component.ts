import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { ApiService } from '../../../core/services/api.service';
import { SignalBadgeComponent } from '../../../shared/components/signal-badge/signal-badge.component';

interface Signal {
  action: string;
  reason: string;
  ticker?: string;
}

interface SignalsResponse {
  date: string;
  regime: string;
  signals: Signal[];
}

@Component({
  selector: 'iq-signals-panel',
  standalone: true,
  imports: [SignalBadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="panel card">
      <div class="panel-header">
        <span class="overline">SINAIS</span>
        @if (date()) {
          <span class="label mono">{{ date() }}</span>
        }
      </div>

      <div class="signals-list">
        @for (s of signals(); track $index) {
          <div class="signal-row">
            @if (s.ticker) {
              <span class="signal-ticker ticker">{{ s.ticker }}</span>
            }
            <iq-signal-badge [action]="s.action" />
            <span class="signal-reason">{{ s.reason }}</span>
          </div>
        } @empty {
          <div class="empty-state">
            <span class="label">Nenhum sinal ativo</span>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .panel { padding: 16px; display: flex; flex-direction: column; gap: 10px; }
    .panel-header { display: flex; align-items: center; justify-content: space-between; }
    .signals-list { display: flex; flex-direction: column; gap: 6px; }
    .signal-row {
      display: flex; align-items: center; gap: 8px;
      padding: 8px; background: var(--bg-alt); border-radius: var(--radius);
    }
    .signal-ticker { min-width: 50px; }
    .signal-reason { font-size: 12px; color: var(--t2); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .empty-state { display: flex; align-items: center; justify-content: center; min-height: 80px; color: var(--t4); }
  `]
})
export class SignalsPanelComponent implements OnInit {
  private readonly api = inject(ApiService);
  readonly signals = signal<Signal[]>([]);
  readonly date = signal('');

  ngOnInit(): void {
    this.api.get<SignalsResponse>('/strategy/signals').subscribe({
      next: (d) => {
        this.signals.set(d.signals || []);
        this.date.set(d.date || '');
      },
      error: () => this.signals.set([]),
    });
  }
}
