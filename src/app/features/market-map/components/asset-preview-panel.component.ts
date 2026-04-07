import { Component, ChangeDetectionStrategy, input, output, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { DecimalPipe, PercentPipe } from '@angular/common';
import { AssetCellComponent } from '../../../shared/components/asset-cell/asset-cell.component';
import { ScoreBadgeComponent } from '../../../shared/components/score-badge/score-badge.component';
import { PillarBarComponent } from '../../../shared/components/pillar-bar/pillar-bar.component';

export interface PreviewData {
  ticker: string; company_name: string; close: number; change_pct: number;
  iq_score: number | null; rating_label: string;
  score_quanti: number | null; score_quali: number | null; score_valuation: number | null;
  safety_margin: number | null; dividend_yield_proj: number | null;
  market_cap: number | null; inPortfolio: boolean;
}

@Component({
  selector: 'iq-asset-preview-panel',
  standalone: true,
  imports: [DecimalPipe, PercentPipe, AssetCellComponent, ScoreBadgeComponent, PillarBarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (data(); as d) {
      <div class="preview glass">
        <button class="close-btn" (click)="closed.emit()"><i class="ph ph-x"></i></button>
        <iq-asset-cell [ticker]="d.ticker" [name]="d.company_name" />

        <div class="price-row">
          <span class="price mono">R$ {{ d.close | number:'1.2-2' }}</span>
          <span class="change mono" [class.pos]="d.change_pct >= 0" [class.neg]="d.change_pct < 0">
            {{ d.change_pct >= 0 ? '+' : '' }}{{ d.change_pct | number:'1.2-2' }}%
          </span>
        </div>

        <div class="score-row">
          <span class="score-val mono">{{ d.iq_score ?? '--' }}</span>
          <iq-score-badge [score]="d.iq_score" />
          <span class="label">{{ d.rating_label }}</span>
        </div>

        <div class="pillars">
          <iq-pillar-bar name="Quanti" [score]="d.score_quanti" />
          <iq-pillar-bar name="Quali" [score]="d.score_quali" />
          <iq-pillar-bar name="Valuation" [score]="d.score_valuation" />
        </div>

        <div class="detail-rows">
          <div class="detail-row">
            <span class="label">Margem Seg.</span>
            <span class="mono" [class.pos]="d.safety_margin != null && d.safety_margin > 0" [class.neg]="d.safety_margin != null && d.safety_margin < 0">
              {{ d.safety_margin != null ? (d.safety_margin | percent:'1.1-1') : '--' }}
            </span>
          </div>
          <div class="detail-row">
            <span class="label">DY Proj.</span>
            <span class="mono">{{ d.dividend_yield_proj != null ? (d.dividend_yield_proj | percent:'1.1-1') : '--' }}</span>
          </div>
        </div>

        <div class="actions">
          <button class="btn-volt cta" (click)="goTo(d.ticker)">Ver análise completa →</button>
          @if (d.inPortfolio) {
            <span class="in-portfolio label"><i class="ph-fill ph-check-circle pos"></i> Na carteira</span>
          }
        </div>
      </div>
    }
  `,
  styles: [`
    .preview { position: fixed; bottom: 16px; right: 16px; width: 300px; padding: 16px; border-radius: var(--radius); z-index: 500; display: flex; flex-direction: column; gap: 10px; }
    .close-btn { position: absolute; top: 8px; right: 8px; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; color: var(--t3); border-radius: var(--radius); }
    .close-btn:hover { background: var(--elevated); color: var(--t1); }
    .price-row { display: flex; align-items: baseline; gap: 8px; }
    .price { font-size: 18px; font-weight: 700; color: var(--t1); }
    .change { font-size: 13px; font-weight: 600; }
    .score-row { display: flex; align-items: center; gap: 8px; }
    .score-val { font-size: 22px; font-weight: 700; color: var(--t1); }
    .pillars { display: flex; flex-direction: column; gap: 6px; }
    .detail-rows { display: flex; flex-direction: column; gap: 4px; }
    .detail-row { display: flex; justify-content: space-between; font-size: 12px; }
    .detail-row .mono { font-weight: 600; }
    .btn-volt { padding: 8px 16px; background: var(--volt); color: #050505; border-radius: var(--radius); font-weight: 700; width: 100%; }
    .in-portfolio { display: flex; align-items: center; gap: 4px; color: var(--pos); font-size: 11px; justify-content: center; }
    .in-portfolio i { font-size: 14px; }
  `]
})
export class AssetPreviewPanelComponent {
  private readonly router = inject(Router);
  data = input.required<PreviewData | null>();
  closed = output<void>();
  goTo(ticker: string): void { this.router.navigate(['/ativo', ticker]); }
}
