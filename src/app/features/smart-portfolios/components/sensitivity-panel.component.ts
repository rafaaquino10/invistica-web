import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { ApiService } from '../../../core/services/api.service';

interface Scenario {
  name: string;
  variable: string;
  description: string;
  impact_score: number;
  affected_sectors: string[];
  benefited_sectors?: string[];
}

@Component({
  selector: 'iq-sensitivity-panel',
  standalone: true,
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (scenarios().length > 0) {
      <div class="panel card">
        <span class="overline">O QUE ACONTECE COM ESTA TESE SE...</span>
        <div class="scenario-grid">
          @for (s of scenarios(); track s.name) {
            <div class="scenario-card">
              <span class="scenario-name label">{{ s.name }}</span>
              <span class="scenario-desc">{{ s.description }}</span>
              <div class="impact-row">
                <span class="impact-label label">Impacto:</span>
                <span class="impact-val mono" [class.pos]="s.impact_score > 0" [class.neg]="s.impact_score < 0">
                  {{ s.impact_score > 0 ? '+' : '' }}{{ s.impact_score }}
                </span>
              </div>
              @if (s.affected_sectors.length > 0) {
                <div class="sectors-row">
                  <span class="sectors-label label neg">Afetados:</span>
                  <span class="sectors-list">{{ s.affected_sectors.join(', ') }}</span>
                </div>
              }
              @if (s.benefited_sectors && s.benefited_sectors.length > 0) {
                <div class="sectors-row">
                  <span class="sectors-label label pos">Beneficiados:</span>
                  <span class="sectors-list">{{ s.benefited_sectors.join(', ') }}</span>
                </div>
              }
            </div>
          }
        </div>
      </div>
    }
  `,
  styles: [`
    .panel { padding: 16px; display: flex; flex-direction: column; gap: 12px; }
    .scenario-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 10px; }
    .scenario-card {
      display: flex; flex-direction: column; gap: 4px;
      padding: 12px; background: var(--bg-alt); border-radius: var(--radius);
      border: 1px solid var(--border);
    }
    .scenario-name { font-size: 12px; font-weight: 700; color: var(--t1); }
    .scenario-desc { font-size: 10px; color: var(--t3); }
    .impact-row { display: flex; align-items: center; gap: 6px; }
    .impact-val { font-size: 14px; font-weight: 700; }
    .sectors-row { display: flex; gap: 4px; flex-wrap: wrap; align-items: baseline; }
    .sectors-label { font-size: 10px; font-weight: 700; flex-shrink: 0; }
    .sectors-list { font-size: 10px; color: var(--t2); }
  `]
})
export class SensitivityPanelComponent implements OnInit {
  private readonly api = inject(ApiService);
  readonly scenarios = signal<Scenario[]>([]);

  ngOnInit(): void {
    this.api.get<{ scenarios: Scenario[] }>('/analytics/sensitivity').subscribe({
      next: d => this.scenarios.set(d.scenarios || []),
      error: () => {},
    });
  }
}
