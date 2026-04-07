import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { WatchlistService, WatchlistItem } from '../../../core/services/watchlist.service';
import { ApiService } from '../../../core/services/api.service';
import { AssetCellComponent } from '../../../shared/components/asset-cell/asset-cell.component';

interface SearchResult { ticker: string; name: string; }

@Component({
  selector: 'iq-watchlist-panel',
  standalone: true,
  imports: [FormsModule, AssetCellComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="section">
      <div class="section-header">
        <span class="overline">WATCHLIST</span>
        <button class="add-btn" (click)="showSearch.set(!showSearch())"><i class="ph ph-plus"></i></button>
      </div>

      @if (showSearch()) {
        <div class="search-box">
          <input class="input" type="text" placeholder="Buscar ticker..." [ngModel]="query()" (ngModelChange)="onSearch($event)" />
          @if (results().length > 0) {
            <div class="search-results">
              @for (r of results(); track r.ticker) {
                <button class="result-item" (click)="addToWatchlist(r)">
                  <span class="mono ticker-r">{{ r.ticker }}</span>
                  <span class="name-r">{{ r.name }}</span>
                </button>
              }
            </div>
          }
        </div>
      }

      @for (item of watchlist.items(); track item.ticker) {
        <div class="wl-item" (click)="goTo(item.ticker)">
          <iq-asset-cell [ticker]="item.ticker" [name]="item.company_name" />
          <button class="del-btn" (click)="$event.stopPropagation(); watchlist.remove(item.ticker)"><i class="ph ph-x"></i></button>
        </div>
      } @empty {
        <span class="empty label">Nenhum ativo na watchlist</span>
      }
    </div>
  `,
  styles: [`
    .section { display: flex; flex-direction: column; gap: 4px; }
    .section-header { display: flex; justify-content: space-between; align-items: center; }
    .add-btn { width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; color: var(--t3); font-size: 12px; border-radius: var(--radius); }
    .add-btn:hover { background: var(--elevated); color: var(--t1); }
    .search-box { position: relative; }
    .input { width: 100%; height: 30px; padding: 0 8px; background: var(--bg-alt); border: 1px solid var(--border); border-radius: var(--radius); color: var(--t1); font-size: 11px; }
    .input:focus { border-color: var(--border-active); outline: none; }
    .search-results { position: absolute; top: 100%; left: 0; right: 0; background: var(--card); border: 1px solid var(--border); border-radius: var(--radius); z-index: 10; max-height: 150px; overflow-y: auto; }
    .result-item { display: flex; gap: 6px; width: 100%; padding: 6px 8px; text-align: left; transition: background var(--transition-fast); }
    .result-item:hover { background: var(--elevated); }
    .ticker-r { font-size: 11px; font-weight: 700; color: var(--volt); min-width: 45px; }
    .name-r { font-size: 10px; color: var(--t3); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .wl-item { display: flex; align-items: center; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid var(--border); cursor: pointer; }
    .wl-item:hover { background: var(--card-hover); }
    .del-btn { width: 18px; height: 18px; display: flex; align-items: center; justify-content: center; color: var(--t4); font-size: 9px; border-radius: var(--radius); flex-shrink: 0; }
    .del-btn:hover { background: var(--neg-dim); color: var(--neg); }
    .empty { color: var(--t4); font-size: 11px; padding: 8px 0; }
  `]
})
export class WatchlistPanelComponent {
  readonly watchlist = inject(WatchlistService);
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);

  readonly showSearch = signal(false);
  readonly query = signal('');
  readonly results = signal<SearchResult[]>([]);
  private timeout: ReturnType<typeof setTimeout> | null = null;

  onSearch(val: string): void {
    this.query.set(val);
    if (this.timeout) clearTimeout(this.timeout);
    if (val.length < 2) { this.results.set([]); return; }
    this.timeout = setTimeout(() => {
      this.api.get<SearchResult[]>('/tickers/search', { q: val }).subscribe({
        next: d => this.results.set(d.filter(r => !this.watchlist.has(r.ticker))),
        error: () => this.results.set([]),
      });
    }, 250);
  }

  addToWatchlist(r: SearchResult): void {
    this.watchlist.add({ ticker: r.ticker, company_name: r.name });
    this.showSearch.set(false);
    this.query.set('');
    this.results.set([]);
  }

  goTo(ticker: string): void { this.router.navigate(['/ativo', ticker]); }
}
