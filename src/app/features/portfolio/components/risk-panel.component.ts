import { Component, ChangeDetectionStrategy, inject, signal, input, OnInit } from '@angular/core';
import { DecimalPipe, PercentPipe } from '@angular/common';
import { ApiService } from '../../../core/services/api.service';
import { RiskBadgeComponent } from '../../../shared/components/risk-badge/risk-badge.component';

@Component({
  selector: 'iq-risk-panel',
  standalone: true,
  imports: [DecimalPipe, PercentPipe, RiskBadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="panel card">
      <span class="overline">RISCO</span>
      @if (data(); as d) {
        <div class="metrics">
          <div class="metric">
            <span class="label">HHI</span>
            <span class="mono val">{{ d.hhi != null ? (d.hhi | number:'1.0-0') : '--' }}</span>
            @if (d.hhi != null) { <iq-risk-badge [level]="hhiLevel()" /> }
          </div>
          <div class="metric">
            <span class="label">Top 3</span>
            <span class="mono val">{{ d.top3_concentration != null ? (d.top3_concentration | percent:'1.0-0') : '--' }}</span>
            @if (d.top3_concentration != null) { <iq-risk-badge [level]="top3Level()" /> }
          </div>
          <div class="metric">
            <span class="label">Conc. Setorial</span>
            <span class="mono val">{{ d.max_sector_concentration != null ? (d.max_sector_concentration | percent:'1.0-0') : '--' }}</span>
            @if (d.max_sector_concentration != null) { <iq-risk-badge [level]="sectorLevel()" /> }
          </div>
        </div>
      } @else {
        <span class="empty label">Indisponível</span>
      }
    </div>
  `,
  styles: [`
    .panel { padding: 14px; display: flex; flex-direction: column; gap: 10px; }
    .metrics { display: flex; flex-direction: column; gap: 8px; }
    .metric { display: flex; align-items: center; gap: 8px; }
    .val { font-size: 16px; font-weight: 700; color: var(--t1); min-width: 50px; }
    .empty { color: var(--t4); }
  `]
})
export class RiskPanelComponent implements OnInit {
  private readonly api = inject(ApiService);
  portfolioId = input('default');
  readonly data = signal<{ hhi: number | null; top3_concentration: number | null; max_sector_concentration: number | null } | null>(null);

  hhiLevel = (): 'low' | 'medium' | 'high' => {
    const v = this.data()?.hhi;
    if (v == null) return 'medium';
    return v < 1500 ? 'low' : v < 2500 ? 'medium' : 'high';
  };
  top3Level = (): 'low' | 'medium' | 'high' => {
    const v = this.data()?.top3_concentration;
    if (v == null) return 'medium';
    return v < 0.5 ? 'low' : v < 0.75 ? 'medium' : 'high';
  };
  sectorLevel = (): 'low' | 'medium' | 'high' => {
    const v = this.data()?.max_sector_concentration;
    if (v == null) return 'medium';
    return v < 0.4 ? 'low' : v < 0.6 ? 'medium' : 'high';
  };

  ngOnInit(): void {
    this.api.get<any>(`/analytics/portfolio/${this.portfolioId()}/risk`).subscribe({
      next: d => this.data.set(d),
      error: () => {},
    });
  }
}
