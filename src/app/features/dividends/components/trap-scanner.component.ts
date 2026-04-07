import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { AssetCellComponent } from '../../../shared/components/asset-cell/asset-cell.component';

export interface TrapEntry {
  ticker: string; company_name: string; is_dividend_trap: boolean;
  risk_level: string; reasons: string[];
}

@Component({
  selector: 'iq-trap-scanner',
  standalone: true,
  imports: [AssetCellComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="panel card">
      <span class="overline">DIVIDEND TRAP SCANNER</span>
      @if (hasTraps()) {
        @for (t of entries(); track t.ticker) {
          @if (t.reasons.length > 0) {
            <div class="trap-item">
              <iq-asset-cell [ticker]="t.ticker" [name]="t.company_name" />
              <span class="risk-badge" [class]="'risk-' + t.risk_level">{{ t.risk_level }}</span>
              <div class="reasons">
                @for (r of t.reasons; track $index) { <span class="reason">{{ r }}</span> }
              </div>
            </div>
          }
        }
      } @else {
        <div class="all-clear">
          <i class="ph-fill ph-check-circle pos"></i>
          <span class="label">Nenhuma posição com risco de trap identificado</span>
        </div>
      }
    </div>
  `,
  styles: [`
    .panel { padding: 14px; display: flex; flex-direction: column; gap: 10px; }
    .trap-item { display: flex; flex-direction: column; gap: 4px; padding: 10px; background: var(--bg-alt); border-radius: var(--radius); }
    .risk-badge { align-self: flex-start; padding: 1px 8px; border-radius: var(--radius); font-size: 10px; font-weight: 700; text-transform: uppercase; }
    .risk-baixo { background: var(--pos-dim); color: var(--pos); }
    .risk-moderado { background: var(--warn-dim); color: var(--warn); }
    .risk-alto { background: var(--neg-dim); color: var(--neg); }
    .reasons { display: flex; flex-direction: column; gap: 2px; }
    .reason { font-size: 11px; color: var(--t3); }
    .all-clear { display: flex; align-items: center; gap: 8px; padding: 20px; justify-content: center; }
    .all-clear i { font-size: 20px; }
  `]
})
export class TrapScannerComponent {
  entries = input.required<TrapEntry[]>();
  hasTraps = () => this.entries().some(t => t.reasons.length > 0);
}
