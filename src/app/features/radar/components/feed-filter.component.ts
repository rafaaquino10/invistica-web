import { Component, ChangeDetectionStrategy, input, output, signal } from '@angular/core';

export type FeedFilterType = 'all' | 'news' | 'score' | 'dividend';

@Component({
  selector: 'iq-feed-filter',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="filters">
      <span class="overline">FILTROS DO FEED</span>
      @for (f of filterOptions; track f.value) {
        <button class="filter-btn" [class.active]="active() === f.value" (click)="select(f.value)">
          <span>{{ f.label }}</span>
          <span class="count mono">{{ getCount(f.value) }}</span>
        </button>
      }
      <label class="toggle-row">
        <input type="checkbox" [checked]="myOnly()" (change)="toggleMyOnly()" />
        <span class="label">Minhas posições</span>
      </label>
    </div>
  `,
  styles: [`
    .filters { display: flex; flex-direction: column; gap: 4px; }
    .filter-btn {
      display: flex; justify-content: space-between; align-items: center;
      padding: 8px 10px; border-radius: var(--radius); font-size: 12px; color: var(--t2);
      transition: all var(--transition-fast); text-align: left;
    }
    .filter-btn:hover { background: var(--elevated); color: var(--t1); }
    .filter-btn.active { background: var(--volt-dim); color: var(--volt); font-weight: 700; }
    .count { font-size: 10px; color: var(--t4); }
    .filter-btn.active .count { color: var(--volt); }
    .toggle-row {
      display: flex; align-items: center; gap: 6px; padding: 8px 10px;
      font-size: 12px; cursor: pointer;
    }
    input[type="checkbox"] { accent-color: var(--volt); }
  `]
})
export class FeedFilterComponent {
  counts = input<Record<string, number>>({});
  filterChanged = output<FeedFilterType>();
  myOnlyChanged = output<boolean>();

  readonly active = signal<FeedFilterType>('all');
  readonly myOnly = signal(false);

  readonly filterOptions = [
    { label: 'Todos', value: 'all' as FeedFilterType },
    { label: 'Notícias', value: 'news' as FeedFilterType },
    { label: 'Score', value: 'score' as FeedFilterType },
    { label: 'Dividendos', value: 'dividend' as FeedFilterType },
  ];

  getCount(key: string): number { return this.counts()[key] || 0; }

  select(value: FeedFilterType): void {
    this.active.set(value);
    this.filterChanged.emit(value);
  }

  toggleMyOnly(): void {
    this.myOnly.update(v => !v);
    this.myOnlyChanged.emit(this.myOnly());
  }
}
