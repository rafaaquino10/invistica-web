import { Component, ChangeDetectionStrategy, inject, signal, input, output, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { AssetCellComponent } from '../../../shared/components/asset-cell/asset-cell.component';

interface SearchResult { ticker: string; name: string; }

export interface PositionPayload { ticker: string; quantity: number; avg_price: number; }

@Component({
  selector: 'iq-position-form-modal',
  standalone: true,
  imports: [FormsModule, ModalComponent, AssetCellComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <iq-modal (closed)="closed.emit()">
      <h2>{{ editMode() ? 'Editar Posição' : 'Adicionar Posição' }}</h2>

      @if (!editMode()) {
        <div class="field">
          <label class="label">Ticker</label>
          <input class="input" type="text" placeholder="Buscar ticker..." [ngModel]="searchQuery()" (ngModelChange)="onSearch($event)" />
          @if (searchResults().length > 0) {
            <div class="search-dropdown">
              @for (r of searchResults(); track r.ticker) {
                <button class="search-item" (click)="selectTicker(r)">
                  <iq-asset-cell [ticker]="r.ticker" [name]="r.name" />
                </button>
              }
            </div>
          }
          @if (selectedTicker()) {
            <div class="selected-ticker">
              <iq-asset-cell [ticker]="selectedTicker()" [name]="selectedName()" />
            </div>
          }
        </div>
      } @else {
        <div class="selected-ticker">
          <iq-asset-cell [ticker]="selectedTicker()" [name]="selectedName()" />
        </div>
      }

      <div class="field">
        <label class="label">Quantidade</label>
        <input class="input mono" type="number" [(ngModel)]="quantity" min="1" />
      </div>

      <div class="field">
        <label class="label">Preço Médio (R$)</label>
        <input class="input mono" type="number" [(ngModel)]="avgPrice" min="0" step="0.01" />
      </div>

      <div class="actions">
        <button class="btn-outline cta" (click)="closed.emit()">Cancelar</button>
        <button class="btn-volt cta" [disabled]="!canSave()" (click)="save()">
          {{ editMode() ? 'Salvar' : 'Adicionar' }}
        </button>
      </div>
    </iq-modal>
  `,
  styles: [`
    h2 { font-family: var(--font-ui); font-size: 17px; font-weight: 600; color: var(--t1); margin-bottom: 16px; }
    .field { display: flex; flex-direction: column; gap: 4px; margin-bottom: 12px; position: relative; }
    .input {
      height: 36px; padding: 0 10px; background: var(--bg-alt); border: 1px solid var(--border);
      border-radius: var(--radius); color: var(--t1); font-family: var(--font-ui); font-size: 13px;
    }
    .input:focus { border-color: var(--border-active); outline: none; }
    .search-dropdown {
      position: absolute; top: 100%; left: 0; right: 0; background: var(--card);
      border: 1px solid var(--border); border-radius: var(--radius); z-index: 10; max-height: 180px; overflow-y: auto;
    }
    .search-item { display: block; width: 100%; padding: 8px 10px; text-align: left; transition: background var(--transition-fast); }
    .search-item:hover { background: var(--elevated); }
    .selected-ticker { padding: 8px; background: var(--bg-alt); border-radius: var(--radius); margin-bottom: 4px; }
    .actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 16px; }
    .btn-volt { padding: 8px 20px; background: var(--volt); color: #050505; border-radius: var(--radius); font-weight: 700; }
    .btn-volt:disabled { opacity: 0.4; cursor: not-allowed; }
    .btn-outline { padding: 8px 20px; border: 1px solid var(--border); color: var(--t2); border-radius: var(--radius); }
  `]
})
export class PositionFormModalComponent {
  private readonly api = inject(ApiService);

  editMode = input(false);
  editPositionId = input<string | null>(null);
  initialTicker = input('');
  initialName = input('');
  initialQuantity = input(0);
  initialPrice = input(0);

  closed = output<void>();
  saved = output<void>();

  readonly selectedTicker = signal('');
  readonly selectedName = signal('');
  readonly searchQuery = signal('');
  readonly searchResults = signal<SearchResult[]>([]);
  quantity = 0;
  avgPrice = 0;

  private timeout: ReturnType<typeof setTimeout> | null = null;

  ngOnInit(): void {
    if (this.editMode()) {
      this.selectedTicker.set(this.initialTicker());
      this.selectedName.set(this.initialName());
      this.quantity = this.initialQuantity();
      this.avgPrice = this.initialPrice();
    }
  }

  canSave = () => this.selectedTicker() && this.quantity > 0 && this.avgPrice > 0;

  onSearch(val: string): void {
    this.searchQuery.set(val);
    if (this.timeout) clearTimeout(this.timeout);
    if (val.length < 2) { this.searchResults.set([]); return; }
    this.timeout = setTimeout(() => {
      this.api.get<SearchResult[]>('/tickers/search', { q: val }).subscribe({
        next: d => this.searchResults.set(d),
        error: () => this.searchResults.set([]),
      });
    }, 250);
  }

  selectTicker(r: SearchResult): void {
    this.selectedTicker.set(r.ticker);
    this.selectedName.set(r.name);
    this.searchQuery.set('');
    this.searchResults.set([]);
  }

  save(): void {
    if (!this.canSave()) return;
    const payload: PositionPayload = { ticker: this.selectedTicker(), quantity: this.quantity, avg_price: this.avgPrice };

    if (this.editMode() && this.editPositionId()) {
      this.api.put(`/portfolio/positions/${this.editPositionId()}`, payload).subscribe({
        next: () => this.saved.emit(),
        error: () => this.saved.emit(),
      });
    } else {
      this.api.post('/portfolio/positions', payload).subscribe({
        next: () => this.saved.emit(),
        error: () => this.saved.emit(),
      });
    }
  }
}
