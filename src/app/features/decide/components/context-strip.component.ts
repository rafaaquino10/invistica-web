import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { ApiService } from '../../../core/services/api.service';
import { RegimeBadgeComponent } from '../../../shared/components/regime-badge/regime-badge.component';
import { ConfidenceMeterComponent } from '../../../shared/components/confidence-meter/confidence-meter.component';
import { VolStressBadgeComponent } from '../../../shared/components/vol-stress-badge/vol-stress-badge.component';

interface RiskStatus {
  regime: string;
  vol_stress: { ratio: number; is_stressed: boolean };
  confidence: { level: number; hit_rate: string };
}

interface RegimeData {
  regime: string;
  label: string;
}

@Component({
  selector: 'iq-context-strip',
  standalone: true,
  imports: [RegimeBadgeComponent, ConfidenceMeterComponent, VolStressBadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="strip">
      <div class="strip-item">
        <span class="strip-label label">Regime</span>
        @if (regimeLabel()) {
          <iq-regime-badge [label]="regimeLabel()" [regime]="regime()" />
        } @else {
          <span class="mono">--</span>
        }
      </div>

      <div class="strip-item">
        <iq-confidence-meter [level]="confidence()" />
      </div>

      <div class="strip-item">
        <span class="strip-label label">Vol Stress</span>
        <iq-vol-stress-badge [stressed]="volStressed()" [ratio]="volRatio()" />
      </div>

      <div class="strip-item">
        <span class="strip-label label">Hit Rate</span>
        <span class="mono hit-val">{{ hitRate() }}</span>
      </div>
    </div>
  `,
  styles: [`
    .strip {
      display: flex; align-items: center; justify-content: space-between;
      padding: 10px 20px; background: var(--bg-alt);
      border: 1px solid var(--border); border-radius: var(--radius);
      gap: 16px; flex-wrap: wrap;
    }
    .strip-item { display: flex; align-items: center; gap: 8px; }
    .strip-label { color: var(--t4); white-space: nowrap; }
    .hit-val { font-size: 13px; font-weight: 600; color: var(--t1); }
  `]
})
export class ContextStripComponent implements OnInit {
  private readonly api = inject(ApiService);

  readonly regime = signal('');
  readonly regimeLabel = signal('');
  readonly confidence = signal(0);
  readonly hitRate = signal('--');
  readonly volStressed = signal(false);
  readonly volRatio = signal(1);

  ngOnInit(): void {
    this.api.get<RiskStatus>('/strategy/risk-status').subscribe({
      next: d => {
        this.regime.set(d.regime || '');
        this.confidence.set(d.confidence?.level ?? 0);
        this.hitRate.set(d.confidence?.hit_rate || '--');
        this.volStressed.set(d.vol_stress?.is_stressed ?? false);
        this.volRatio.set(d.vol_stress?.ratio ?? 1);
      },
    });
    this.api.get<RegimeData>('/analytics/regime').subscribe({
      next: d => {
        this.regime.set(d.regime);
        this.regimeLabel.set(d.label);
      },
    });
  }
}
