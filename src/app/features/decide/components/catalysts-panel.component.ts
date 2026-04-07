import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { ApiService } from '../../../core/services/api.service';

interface Catalyst {
  type: string;
  title: string;
  date: string;
  ticker?: string;
}

@Component({
  selector: 'iq-catalysts-panel',
  standalone: true,
  imports: [DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="panel card">
      <div class="panel-header">
        <span class="overline">EVENTOS QUE PODEM MOVER PREÇOS</span>
      </div>

      <div class="events-list">
        @for (ev of events(); track $index) {
          <div class="event-row" [class.clickable]="!!ev.ticker" (click)="ev.ticker ? goTo(ev.ticker) : null">
            <span class="event-date mono">{{ ev.date | date:'dd/MM' }}</span>
            @if (ev.ticker) {
              <span class="event-ticker mono">{{ ev.ticker }}</span>
            }
            <span class="event-type" [class]="'type-' + ev.type">{{ typeLabel(ev.type) }}</span>
            <span class="event-title">{{ ev.title }}</span>
          </div>
        } @empty {
          <div class="empty label">Nenhum catalisador próximo</div>
        }
      </div>
    </div>
  `,
  styles: [`
    .panel { padding: 16px; display: flex; flex-direction: column; gap: 10px; }
    .panel-header { display: flex; align-items: center; }
    .events-list { display: flex; flex-direction: column; gap: 1px; max-height: 300px; overflow-y: auto; }
    .event-row {
      display: flex; align-items: center; gap: 8px; padding: 6px 0;
      border-bottom: 1px solid var(--border); transition: background var(--transition-fast);
    }
    .event-row:last-child { border-bottom: none; }
    .event-row.clickable { cursor: pointer; }
    .event-row.clickable:hover { background: var(--card-hover); }
    .event-date { font-size: 11px; color: var(--t3); min-width: 40px; }
    .event-ticker { font-size: 11px; font-weight: 700; color: var(--volt); min-width: 50px; }
    .event-type {
      font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em;
      padding: 1px 6px; border-radius: var(--radius); flex-shrink: 0;
    }
    .type-noticia { background: var(--elevated); color: var(--t2); }
    .type-dividendo { background: var(--pos-dim); color: var(--pos); }
    .type-fato_relevante, .type-cvm { background: var(--warn-dim); color: var(--warn); }
    .event-title { font-size: 11px; color: var(--t2); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; min-width: 0; }
    .empty { text-align: center; padding: 20px; color: var(--t4); }
  `]
})
export class CatalystsPanelComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  readonly events = signal<Catalyst[]>([]);

  ngOnInit(): void {
    this.api.get<{ catalysts: Catalyst[] }>('/scores/catalysts', { days: 30 }).subscribe({
      next: d => this.events.set((d.catalysts || []).slice(0, 20)),
      error: () => {},
    });
  }

  typeLabel(type: string): string {
    if (type === 'noticia') return 'News';
    if (type === 'dividendo') return 'Div';
    if (type === 'fato_relevante' || type === 'cvm') return 'CVM';
    return type;
  }

  goTo(ticker: string): void { this.router.navigate(['/ativo', ticker]); }
}
