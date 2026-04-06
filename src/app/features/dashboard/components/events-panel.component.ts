import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ApiService } from '../../../core/services/api.service';

interface Catalyst {
  type: string;
  title: string;
  date: string;
  ticker?: string;
  source?: string;
}

@Component({
  selector: 'iq-events-panel',
  standalone: true,
  imports: [DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="panel card">
      <div class="panel-header">
        <span class="overline">EVENTOS</span>
        <span class="label count-badge mono">{{ events().length }}</span>
      </div>

      <div class="events-list">
        @for (ev of events(); track $index) {
          <div class="event-row">
            <span class="event-date mono">{{ ev.date | date:'dd/MM' }}</span>
            @if (ev.ticker) {
              <span class="event-ticker mono">{{ ev.ticker }}</span>
            }
            <span class="event-type-badge" [class]="'type-' + ev.type">{{ typeLabel(ev.type) }}</span>
            <span class="event-title">{{ ev.title }}</span>
          </div>
        } @empty {
          <div class="empty-state">
            <span class="label">Nenhum evento recente</span>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .panel { padding: 16px; display: flex; flex-direction: column; gap: 10px; }
    .panel-header { display: flex; align-items: center; justify-content: space-between; }
    .count-badge {
      font-size: 10px; font-weight: 600; color: var(--t3);
      background: var(--elevated); padding: 1px 6px; border-radius: var(--radius);
    }
    .events-list {
      display: flex; flex-direction: column; gap: 1px;
      max-height: 260px; overflow-y: auto;
    }
    .event-row {
      display: flex; align-items: center; gap: 8px;
      padding: 6px 0;
      border-bottom: 1px solid var(--border);
    }
    .event-row:last-child { border-bottom: none; }
    .event-date { font-size: 11px; font-weight: 500; color: var(--t3); min-width: 40px; }
    .event-ticker { font-size: 11px; font-weight: 700; color: var(--volt); min-width: 50px; }
    .event-type-badge {
      font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em;
      padding: 1px 6px; border-radius: var(--radius); flex-shrink: 0;
    }
    .type-noticia { background: var(--elevated); color: var(--t2); }
    .type-dividendo { background: var(--pos-dim); color: var(--pos); }
    .type-fato_relevante, .type-cvm { background: var(--warn-dim); color: var(--warn); }
    .event-title {
      font-size: 12px; color: var(--t2); overflow: hidden;
      text-overflow: ellipsis; white-space: nowrap; min-width: 0;
    }
    .empty-state { display: flex; align-items: center; justify-content: center; min-height: 80px; color: var(--t4); }
  `]
})
export class EventsPanelComponent implements OnInit {
  private readonly api = inject(ApiService);
  readonly events = signal<Catalyst[]>([]);

  ngOnInit(): void {
    this.api.get<{ catalysts: Catalyst[] }>('/scores/catalysts', { days: 7 }).subscribe({
      next: (d) => this.events.set((d.catalysts || []).slice(0, 15)),
      error: () => this.events.set([]),
    });
  }

  typeLabel(type: string): string {
    switch (type) {
      case 'noticia': return 'News';
      case 'dividendo': return 'Div';
      case 'fato_relevante': return 'CVM';
      case 'cvm': return 'CVM';
      default: return type;
    }
  }
}
