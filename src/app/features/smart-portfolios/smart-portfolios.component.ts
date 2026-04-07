import { Component, ChangeDetectionStrategy, inject, signal, computed, OnInit, effect } from '@angular/core';
import { ApiService } from '../../core/services/api.service';
import { THESIS_CONFIGS, ThesisConfig } from './thesis-config';
import { ThesisSelectorComponent } from './components/thesis-selector.component';
import { ThesisDetailComponent } from './components/thesis-detail.component';
import { ThesisTableComponent, ScreenerAsset } from './components/thesis-table.component';
import { SectorExposureComponent } from './components/sector-exposure.component';
import { SectorRotationComponent } from './components/sector-rotation.component';
import { SensitivityPanelComponent } from './components/sensitivity-panel.component';
import { RegimeBadgeComponent } from '../../shared/components/regime-badge/regime-badge.component';

@Component({
  selector: 'iq-smart-portfolios',
  standalone: true,
  imports: [
    ThesisSelectorComponent, ThesisDetailComponent, ThesisTableComponent,
    SectorExposureComponent, SectorRotationComponent, SensitivityPanelComponent,
    RegimeBadgeComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page">
      <h1>Carteiras IQ</h1>

      <!-- Contexto Macro -->
      <div class="context-strip">
        <span class="label">Regime atual:</span>
        @if (regimeLabel()) {
          <iq-regime-badge [label]="regimeLabel()" [regime]="regime()" />
        }
        <span class="context-note label">{{ regimeInfluence() }}</span>
      </div>

      <!-- Seletor de Tese -->
      <iq-thesis-selector [theses]="theses" [activeId]="activeThesisId()" (thesisChanged)="onThesisChange($event)" />

      <!-- Detalhe da Tese -->
      @if (activeThesis(); as t) {
        <iq-thesis-detail [thesis]="t" [regime]="regime()" [regimeLabel]="regimeLabel()" />

        <!-- Tabela -->
        @if (loading()) {
          <div class="status label">Carregando...</div>
        } @else {
          <iq-thesis-table [assets]="assets()" [thesis]="t" />
        }

        <!-- Inteligência Visual -->
        <div class="intel-grid">
          <iq-sector-exposure [clusterIds]="clusterIds()" />
          <iq-sector-rotation [currentRegime]="regime()" />
        </div>

        <!-- Sensibilidade -->
        <iq-sensitivity-panel />
      }
    </div>
  `,
  styles: [`
    .page { display: flex; flex-direction: column; gap: 16px; }
    h1 { font-family: var(--font-ui); font-size: 21px; font-weight: 700; color: var(--t1); }
    .context-strip {
      display: flex; align-items: center; gap: 10px; padding: 10px 16px;
      background: var(--bg-alt); border: 1px solid var(--border); border-radius: var(--radius);
    }
    .context-note { color: var(--t3); font-style: italic; }
    .intel-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .status { text-align: center; padding: 40px; color: var(--t3); }
  `]
})
export class SmartPortfoliosComponent implements OnInit {
  private readonly api = inject(ApiService);

  readonly theses = THESIS_CONFIGS;
  readonly activeThesisId = signal('valor');
  readonly regime = signal('');
  readonly regimeLabel = signal('');
  readonly assets = signal<ScreenerAsset[]>([]);
  readonly loading = signal(false);

  readonly activeThesis = computed<ThesisConfig | undefined>(
    () => this.theses.find(t => t.id === this.activeThesisId())
  );

  readonly clusterIds = computed(() => this.assets().map(a => a.cluster_id));

  readonly regimeInfluence = computed(() => {
    const r = this.regime().toUpperCase();
    if (r.includes('RISK_ON') || r.includes('RECOVERY')) return 'O motor favorece crescimento e momentum.';
    if (r.includes('RISK_OFF')) return 'O motor favorece valor e dividendos defensivos.';
    if (r.includes('STAGFLATION')) return 'O motor favorece utilities e empresas de caixa.';
    return '';
  });

  constructor() {
    effect(() => {
      const thesis = this.activeThesis();
      if (thesis) this.loadScreener(thesis);
    });
  }

  ngOnInit(): void {
    this.api.get<{ regime: string; label: string }>('/analytics/regime').subscribe({
      next: d => { this.regime.set(d.regime); this.regimeLabel.set(d.label); },
    });
  }

  onThesisChange(id: string): void {
    this.activeThesisId.set(id);
  }

  private loadScreener(thesis: ThesisConfig): void {
    this.loading.set(true);
    this.api.get<{ results: ScreenerAsset[] }>('/scores/screener', thesis.screenerParams).subscribe({
      next: d => {
        this.assets.set((d.results || []).slice(0, 10));
        this.loading.set(false);
      },
      error: () => { this.assets.set([]); this.loading.set(false); },
    });
  }
}
