import { Component, ChangeDetectionStrategy, inject, signal, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { AssetCellComponent } from '../../../shared/components/asset-cell/asset-cell.component';

export interface SelectedAsset {
  ticker: string;
  company_name: string;
}

interface SearchResult {
  ticker: string;
  name: string;
}

@Component({
  selector: 'iq-asset-selector',
  standalone: true,
  imports: [FormsModule, AssetCellComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="selector">
      @for (asset of selected(); track asset.ticker) {
        <div class="slot filled card">
          <iq-asset-cell [ticker]="asset.ticker" [name]="asset.company_name" />
          <button class="remove-btn" (click)="remove(asset.ticker)">
            <i class="ph ph-x"></i>
          </button>
        </div>
      }

      @if (selected().length < 5) {
        <div class="slot empty" [class.searching]="searching()">
          @if (!searching()) {
            <button class="add-btn" (click)="searching.set(true)">
              <i class="ph ph-plus"></i>
            </button>
          } @else {
            <div class="search-box">
              <input class="search-input" type="text" placeholder="Buscar ticker..."
                     [ngModel]="query()" (ngModelChange)="onSearch($event)"
                     (blur)="onBlur()" autofocus />
              @if (results().length > 0) {
                <div class="search-results">
                  @for (r of results(); track r.ticker) {
                    <button class="result-item" (mousedown)="selectAsset(r)">
                      <span class="ticker mono">{{ r.ticker }}</span>
                      <span class="result-name">{{ r.name }}</span>
                    </button>
                  }
                </div>
              }
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .selector { display: flex; gap: 10px; flex-wrap: wrap; }
    .slot { min-width: 180px; min-height: 52px; display: flex; align-items: center; }
    .filled { padding: 8px 12px; gap: 8px; justify-content: space-between; }
    .empty {
      border: 1px dashed var(--border); border-radius: var(--radius);
      justify-content: center; padding: 0 12px;
    }
    .empty.searching { min-width: 220px; }
    .add-btn {
      width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;
      color: var(--t4); font-size: 18px; transition: color var(--transition-fast);
    }
    .add-btn:hover { color: var(--t2); }
    .remove-btn {
      flex-shrink: 0; width: 24px; height: 24px; display: flex;
      align-items: center; justify-content: center; border-radius: var(--radius);
      color: var(--t3); font-size: 12px; transition: all var(--transition-fast);
    }
    .remove-btn:hover { color: var(--neg); background: var(--neg-dim); }
    .search-box { position: relative; width: 100%; }
    .search-input {
      width: 100%; height: 36px; padding: 0 10px;
      background: var(--bg-alt); border: 1px solid var(--border-active);
      border-radius: var(--radius); font-family: var(--font-ui);
      font-size: 12px; color: var(--t1);
    }
    .search-results {
      position: absolute; top: calc(100% + 4px); left: 0; right: 0;
      background: var(--glass-bg); backdrop-filter: var(--glass-blur);
      border: 1px solid var(--glass-border); border-radius: var(--radius);
      max-height: 200px; overflow-y: auto; z-index: 10;
    }
    .result-item {
      display: flex; align-items: center; gap: 8px; width: 100%;
      padding: 8px 10px; text-align: left; transition: background var(--transition-fast);
    }
    .result-item:hover { background: var(--elevated); }
    .result-item .ticker { font-size: 12px; font-weight: 700; color: var(--volt); min-width: 50px; }
    .result-name { font-size: 11px; color: var(--t2); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  `]
})
export class AssetSelectorComponent {
  private readonly api = inject(ApiService);

  readonly selected = signal<SelectedAsset[]>([]);
  readonly searching = signal(false);
  readonly query = signal('');
  readonly results = signal<SearchResult[]>([]);
  readonly selectionChanged = output<string[]>();

  private timeout: ReturnType<typeof setTimeout> | null = null;

  onSearch(value: string): void {
    this.query.set(value);
    if (this.timeout) clearTimeout(this.timeout);
    if (value.length < 2) { this.results.set([]); return; }

    this.timeout = setTimeout(() => {
      this.api.get<SearchResult[]>('/tickers/search', { q: value }).subscribe({
        next: data => this.results.set(data.filter(r => !this.selected().some(s => s.ticker === r.ticker))),
        error: () => this.results.set([]),
      });
    }, 250);
  }

  selectAsset(result: SearchResult): void {
    const current = this.selected();
    if (current.length >= 5 || current.some(s => s.ticker === result.ticker)) return;
    this.selected.set([...current, { ticker: result.ticker, company_name: result.name }]);
    this.searching.set(false);
    this.query.set('');
    this.results.set([]);
    this.emitChange();
  }

  remove(ticker: string): void {
    this.selected.update(list => list.filter(s => s.ticker !== ticker));
    this.emitChange();
  }

  onBlur(): void {
    setTimeout(() => {
      this.searching.set(false);
      this.query.set('');
      this.results.set([]);
    }, 200);
  }

  private emitChange(): void {
    this.selectionChanged.emit(this.selected().map(s => s.ticker));
  }
}
