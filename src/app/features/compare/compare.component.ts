import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { ApiService } from '../../core/services/api.service';
import { AssetSelectorComponent } from './components/asset-selector.component';
import { CompareTableComponent, CompareAsset } from './components/compare-table.component';
import { CompareChartComponent } from './components/compare-chart.component';

@Component({
  selector: 'iq-compare',
  standalone: true,
  imports: [AssetSelectorComponent, CompareTableComponent, CompareChartComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="compare-page">
      <h1>Comparar</h1>

      <iq-asset-selector (selectionChanged)="onSelectionChanged($event)" />

      @if (tickers().length < 2) {
        <div class="empty-state">
          <i class="ph ph-columns empty-icon"></i>
          <span class="label">Selecione pelo menos 2 ativos para comparar</span>
        </div>
      } @else if (loading()) {
        <div class="empty-state"><span class="label">Carregando...</span></div>
      } @else if (error()) {
        <div class="empty-state"><span class="label">Falha ao carregar</span></div>
      } @else {
        <iq-compare-table [assets]="compareData()" />
        <iq-compare-chart [tickers]="tickers()" />
      }
    </div>
  `,
  styles: [`
    .compare-page { display: flex; flex-direction: column; gap: 16px; }
    h1 { font-family: var(--font-ui); font-size: 21px; font-weight: 700; color: var(--t1); }
    .empty-state {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      min-height: 300px; gap: 12px; color: var(--t3);
    }
    .empty-icon { font-size: 32px; color: var(--t4); }
  `]
})
export class CompareComponent {
  private readonly api = inject(ApiService);

  readonly tickers = signal<string[]>([]);
  readonly compareData = signal<CompareAsset[]>([]);
  readonly loading = signal(false);
  readonly error = signal(false);

  onSelectionChanged(tickers: string[]): void {
    this.tickers.set(tickers);
    if (tickers.length < 2) {
      this.compareData.set([]);
      return;
    }
    this.loading.set(true);
    this.error.set(false);

    this.api.get<{ tickers: CompareAsset[] }>('/scores/compare', { tickers: tickers.join(',') }).subscribe({
      next: d => {
        this.compareData.set(d.tickers || []);
        this.loading.set(false);
      },
      error: () => {
        this.compareData.set([]);
        this.loading.set(false);
        this.error.set(true);
      },
    });
  }
}
