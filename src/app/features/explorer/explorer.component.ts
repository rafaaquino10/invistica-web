import { Component, ChangeDetectionStrategy, inject, signal, computed, OnInit } from '@angular/core';
import { ApiService } from '../../core/services/api.service';
import { FilterBarComponent, FilterValues } from './components/filter-bar.component';
import { AssetTableComponent, ScreenerAsset } from './components/asset-table.component';

@Component({
  selector: 'iq-explorer',
  standalone: true,
  imports: [FilterBarComponent, AssetTableComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="explorer">
      <h1>Explorar</h1>

      <iq-filter-bar (filterApplied)="onFilter($event)" />

      @if (loading()) {
        <div class="status-msg label">Carregando...</div>
      } @else if (error()) {
        <div class="status-msg label">Falha ao carregar</div>
      } @else {
        <iq-asset-table [assets]="assets()" />

        <div class="status-bar">
          <span class="label">Mostrando <span class="mono">{{ assets().length }}</span> ativos</span>
          @if (activeFilterCount() > 0) {
            <span class="label"> · Filtros ativos: <span class="mono">{{ activeFilterCount() }}</span></span>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .explorer { display: flex; flex-direction: column; gap: 16px; }
    h1 { font-family: var(--font-ui); font-size: 21px; font-weight: 700; color: var(--t1); }
    .status-msg {
      display: flex; align-items: center; justify-content: center;
      min-height: 200px; color: var(--t3);
    }
    .status-bar {
      display: flex; align-items: center; gap: 4px;
      padding: 8px 0; color: var(--t3);
    }
  `]
})
export class ExplorerComponent implements OnInit {
  private readonly api = inject(ApiService);

  readonly assets = signal<ScreenerAsset[]>([]);
  readonly loading = signal(false);
  readonly error = signal(false);
  readonly currentFilters = signal<FilterValues>({});

  readonly activeFilterCount = computed(() => {
    const f = this.currentFilters();
    let count = 0;
    if (f.cluster != null) count++;
    if (f.min_score != null) count++;
    if (f.rating) count++;
    if (f.min_yield != null) count++;
    if (f.min_margin != null) count++;
    return count;
  });

  ngOnInit(): void {
    this.loadScreener({});
  }

  onFilter(filters: FilterValues): void {
    this.currentFilters.set(filters);
    this.loadScreener(filters);
  }

  private loadScreener(filters: FilterValues): void {
    this.loading.set(true);
    this.error.set(false);

    const params: Record<string, string | number | boolean> = {};
    if (filters.cluster != null) params['cluster'] = filters.cluster;
    if (filters.min_score != null) params['min_score'] = filters.min_score;
    if (filters.rating) params['rating'] = filters.rating;
    if (filters.min_yield != null) params['min_yield'] = filters.min_yield;
    if (filters.min_margin != null) params['min_margin'] = filters.min_margin;

    this.api.get<{ count: number; results: ScreenerAsset[] }>('/scores/screener', params).subscribe({
      next: (d) => {
        this.assets.set(d.results || []);
        this.loading.set(false);
      },
      error: () => {
        this.assets.set([]);
        this.loading.set(false);
        this.error.set(true);
      },
    });
  }
}
