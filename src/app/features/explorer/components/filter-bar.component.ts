import { Component, ChangeDetectionStrategy, inject, signal, output, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';

export interface FilterValues {
  cluster?: number;
  min_score?: number;
  rating?: string;
  min_yield?: number;
  min_margin?: number;
}

interface Cluster {
  cluster_id: number;
  name: string;
}

@Component({
  selector: 'iq-filter-bar',
  standalone: true,
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bar">
      <select class="filter-select" [(ngModel)]="cluster" aria-label="Cluster">
        <option [ngValue]="undefined">Todos os clusters</option>
        @for (c of clusters(); track c.cluster_id) {
          <option [ngValue]="c.cluster_id">{{ c.name }}</option>
        }
      </select>

      <input class="filter-input mono" type="number" placeholder="Score mín."
             [(ngModel)]="minScore" min="0" max="100" aria-label="Score mínimo" />

      <select class="filter-select" [(ngModel)]="rating" aria-label="Rating">
        <option [ngValue]="undefined">Todos os ratings</option>
        @for (r of ratings; track r.value) {
          <option [value]="r.value">{{ r.label }}</option>
        }
      </select>

      <input class="filter-input mono" type="number" placeholder="DY mín. %"
             [(ngModel)]="minYield" min="0" step="0.5" aria-label="DY mínimo" />

      <input class="filter-input mono" type="number" placeholder="Margem mín. %"
             [(ngModel)]="minMargin" step="1" aria-label="Margem mínima" />

      <button class="btn-filter cta" (click)="applyFilters()">Filtrar</button>
      <button class="btn-clear cta" (click)="clearFilters()">Limpar</button>
    </div>
  `,
  styles: [`
    .bar {
      display: flex; align-items: center; gap: 8px;
      padding: 10px 16px; background: var(--card);
      border: 1px solid var(--border); border-radius: var(--radius);
      flex-wrap: wrap;
    }
    .filter-select, .filter-input {
      height: 32px; padding: 0 10px;
      background: var(--bg-alt); border: 1px solid var(--border);
      border-radius: var(--radius); color: var(--t1);
      font-family: var(--font-ui); font-size: 12px;
      transition: border-color var(--transition-fast);
    }
    .filter-select { min-width: 140px; }
    .filter-input { width: 100px; }
    .filter-select:focus, .filter-input:focus { border-color: var(--border-active); outline: none; }
    .filter-select option { background: var(--card); color: var(--t1); }
    .btn-filter {
      padding: 6px 16px; background: var(--volt); color: #050505;
      border-radius: var(--radius); font-weight: 700;
      transition: opacity var(--transition-fast);
    }
    .btn-filter:hover { opacity: 0.9; }
    .btn-clear {
      padding: 6px 16px; border: 1px solid var(--border); color: var(--t3);
      border-radius: var(--radius); font-weight: 700;
      transition: border-color var(--transition-fast), color var(--transition-fast);
    }
    .btn-clear:hover { border-color: var(--border-hover); color: var(--t1); }
  `]
})
export class FilterBarComponent implements OnInit {
  private readonly api = inject(ApiService);

  readonly clusters = signal<Cluster[]>([]);
  readonly filterApplied = output<FilterValues>();

  cluster: number | undefined;
  minScore: number | undefined;
  rating: string | undefined;
  minYield: number | undefined;
  minMargin: number | undefined;

  readonly ratings = [
    { value: 'STRONG_BUY', label: 'Compra Forte' },
    { value: 'BUY', label: 'Compra' },
    { value: 'HOLD', label: 'Manter' },
    { value: 'REDUCE', label: 'Reduzir' },
    { value: 'AVOID', label: 'Evitar' },
  ];

  ngOnInit(): void {
    this.api.get<{ clusters: Cluster[] }>('/clusters').subscribe({
      next: (d) => this.clusters.set(d.clusters || []),
    });
  }

  applyFilters(): void {
    const f: FilterValues = {};
    if (this.cluster != null) f.cluster = this.cluster;
    if (this.minScore != null) f.min_score = this.minScore;
    if (this.rating) f.rating = this.rating;
    if (this.minYield != null) f.min_yield = this.minYield / 100;
    if (this.minMargin != null) f.min_margin = this.minMargin / 100;
    this.filterApplied.emit(f);
  }

  clearFilters(): void {
    this.cluster = undefined;
    this.minScore = undefined;
    this.rating = undefined;
    this.minYield = undefined;
    this.minMargin = undefined;
    this.filterApplied.emit({});
  }
}
