import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { ApiService } from '../../../core/services/api.service';
import { RegimeBadgeComponent } from '../../../shared/components/regime-badge/regime-badge.component';

interface SectorRotation {
  [sector: string]: { signal: string; tilt_points: number };
}

interface RegimeData {
  regime: string;
  label: string;
  description: string;
  macro: { selic: number; ipca: number; cambio_usd: number; brent: number };
  sector_rotation: SectorRotation;
}

@Component({
  selector: 'iq-regime-panel',
  standalone: true,
  imports: [RegimeBadgeComponent, DecimalPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="panel card">
      <div class="panel-header">
        <span class="overline">REGIME</span>
        @if (data(); as d) {
          <iq-regime-badge [label]="d.label" [regime]="d.regime" />
        }
      </div>

      @if (data(); as d) {
        <p class="regime-desc">{{ d.description }}</p>

        <div class="macro-grid">
          <div class="macro-kpi">
            <span class="macro-label label">SELIC</span>
            <span class="macro-value mono">{{ d.macro.selic | number:'1.2-2' }}%</span>
          </div>
          <div class="macro-kpi">
            <span class="macro-label label">IPCA</span>
            <span class="macro-value mono">{{ d.macro.ipca | number:'1.1-1' }}%</span>
          </div>
          <div class="macro-kpi">
            <span class="macro-label label">Câmbio</span>
            <span class="macro-value mono">R$ {{ d.macro.cambio_usd | number:'1.2-2' }}</span>
          </div>
          <div class="macro-kpi">
            <span class="macro-label label">Brent</span>
            <span class="macro-value mono">US$ {{ d.macro.brent | number:'1.0-0' }}</span>
          </div>
        </div>

        <div class="rotation">
          <span class="overline rotation-title">Rotação Setorial</span>
          @for (sector of favored(); track sector) {
            <div class="rotation-item">
              <i class="ph ph-caret-up pos"></i>
              <span class="label">{{ sector }}</span>
            </div>
          }
          @for (sector of unfavored(); track sector) {
            <div class="rotation-item">
              <i class="ph ph-caret-down neg"></i>
              <span class="label">{{ sector }}</span>
            </div>
          }
        </div>
      } @else {
        <div class="panel-loading"><span class="mono">--</span></div>
      }
    </div>
  `,
  styles: [`
    .panel { padding: 16px; display: flex; flex-direction: column; gap: 12px; }
    .panel-header { display: flex; align-items: center; justify-content: space-between; }
    .regime-desc { font-size: 12px; color: var(--t3); line-height: 1.4; }
    .macro-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
    .macro-kpi {
      display: flex; flex-direction: column; gap: 2px;
      padding: 8px; background: var(--bg-alt); border-radius: var(--radius);
    }
    .macro-label { color: var(--t4); font-size: 10px; }
    .macro-value { font-size: 15px; font-weight: 600; color: var(--t1); }
    .rotation { display: flex; flex-direction: column; gap: 4px; }
    .rotation-title { margin-bottom: 4px; }
    .rotation-item { display: flex; align-items: center; gap: 6px; }
    .rotation-item i { font-size: 12px; }
    .rotation-item .label { font-size: 12px; color: var(--t2); }
    .panel-loading { display: flex; align-items: center; justify-content: center; min-height: 100px; color: var(--t4); }
  `]
})
export class RegimePanelComponent implements OnInit {
  private readonly api = inject(ApiService);

  readonly data = signal<RegimeData | null>(null);
  readonly favored = signal<string[]>([]);
  readonly unfavored = signal<string[]>([]);

  ngOnInit(): void {
    this.api.get<RegimeData>('/analytics/regime').subscribe({
      next: (d) => {
        this.data.set(d);
        const fav: string[] = [];
        const unfav: string[] = [];
        if (d.sector_rotation) {
          for (const [sector, info] of Object.entries(d.sector_rotation)) {
            if (info.signal === 'favorecido') fav.push(sector);
            else if (info.signal === 'desfavorecido') unfav.push(sector);
          }
        }
        this.favored.set(fav);
        this.unfavored.set(unfav);
      },
    });
  }
}
