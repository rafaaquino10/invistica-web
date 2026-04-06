import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { DecimalPipe } from '@angular/common';

export interface KpiItem {
  label: string;
  value: string;
  change?: number | null;
  suffix?: string;
}

@Component({
  selector: 'iq-kpi-strip',
  standalone: true,
  imports: [DecimalPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="strip">
      @for (kpi of items(); track kpi.label) {
        <div class="kpi">
          <span class="kpi-label overline">{{ kpi.label }}</span>
          <span class="kpi-value mono">{{ kpi.value }}{{ kpi.suffix || '' }}</span>
          @if (kpi.change != null) {
            <span class="kpi-change mono" [class.pos]="kpi.change >= 0" [class.neg]="kpi.change < 0">
              {{ kpi.change >= 0 ? '+' : '' }}{{ kpi.change | number:'1.2-2' }}%
            </span>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .strip {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 24px;
      background: var(--bg-alt);
      border-bottom: 1px solid var(--border);
      gap: 16px;
    }
    .kpi {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2px;
      min-width: 0;
    }
    .kpi-label {
      color: var(--t4);
      white-space: nowrap;
    }
    .kpi-value {
      font-size: 18px;
      font-weight: 700;
      color: var(--t1);
    }
    .kpi-change {
      font-size: 11px;
      font-weight: 500;
    }
  `]
})
export class KpiStripComponent {
  items = input.required<KpiItem[]>();
}
