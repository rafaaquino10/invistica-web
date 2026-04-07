import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { ThesisConfig } from '../thesis-config';
import { RegimeBadgeComponent } from '../../../shared/components/regime-badge/regime-badge.component';

@Component({
  selector: 'iq-thesis-detail',
  standalone: true,
  imports: [RegimeBadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="detail glass">
      <div class="detail-header">
        <i class="ph ph-{{ thesis().icon }} detail-icon"></i>
        <h2>{{ thesis().name }}</h2>
        @if (regimeLabel()) {
          <iq-regime-badge [label]="regimeLabel()" [regime]="regime()" />
        }
      </div>
      <p class="desc">{{ thesis().description }}</p>
      <div class="criteria">
        @for (c of thesis().criteria; track c) {
          <span class="criterion mono">{{ c }}</span>
        }
        <span class="criterion-note label">Ajustado para regime {{ regimeLabel() || 'atual' }}</span>
      </div>
    </div>
  `,
  styles: [`
    .detail { padding: 20px; border-radius: var(--radius); display: flex; flex-direction: column; gap: 10px; }
    .detail-header { display: flex; align-items: center; gap: 10px; }
    .detail-icon { font-size: 22px; color: var(--volt); }
    h2 { font-family: var(--font-ui); font-size: 17px; font-weight: 600; color: var(--t1); flex: 1; }
    .desc { font-size: 13px; color: var(--t2); line-height: 1.6; }
    .criteria { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
    .criterion {
      padding: 3px 10px; background: var(--elevated); border-radius: var(--radius);
      font-size: 11px; font-weight: 600; color: var(--t1);
    }
    .criterion-note { color: var(--t4); font-size: 10px; }
  `]
})
export class ThesisDetailComponent {
  thesis = input.required<ThesisConfig>();
  regime = input('');
  regimeLabel = input('');
}
