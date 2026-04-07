import { Component, ChangeDetectionStrategy, inject, input, signal, OnInit } from '@angular/core';
import { DecimalPipe, PercentPipe } from '@angular/common';
import { ApiService } from '../../../core/services/api.service';
import { PillarBarComponent } from '../../../shared/components/pillar-bar/pillar-bar.component';

interface SubScore {
  score: number | null;
  detail: Record<string, any>;
}

interface BreakdownData {
  iq_score: number;
  score_quanti: number;
  sub_scores: {
    valuation: SubScore;
    quality: SubScore;
    risk: SubScore;
    dividends: SubScore;
    growth: SubScore;
    momentum: SubScore;
  };
}

interface EvidenceItem {
  criterion_name: string;
  score: number;
  weight: number;
  evidence_text: string;
  bull_points?: string[];
  bear_points?: string[];
}

interface ScoreFullData {
  evidences?: EvidenceItem[];
}

interface MarginData {
  safety_margin: number | null;
  fair_value_final: number | null;
  current_price: number | null;
}

@Component({
  selector: 'iq-tab-score',
  standalone: true,
  imports: [PillarBarComponent, DecimalPipe, PercentPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (breakdown(); as b) {
      <div class="score-tab">
        <div class="main-scores">
          <div class="main-pill">
            <span class="overline">QUANTI</span>
            <span class="score-val mono">{{ b.score_quanti ?? '--' }}</span>
          </div>
          <div class="main-pill">
            <span class="overline">QUALI</span>
            <span class="score-val mono">{{ b.sub_scores.quality.score ?? '--' }}</span>
          </div>
          <div class="main-pill">
            <span class="overline">VALUATION</span>
            <span class="score-val mono">{{ b.sub_scores.valuation.score ?? '--' }}</span>
          </div>
        </div>

        <div class="pillars">
          <iq-pillar-bar name="Valuation" [score]="b.sub_scores.valuation.score" />
          <iq-pillar-bar name="Qualidade" [score]="b.sub_scores.quality.score" />
          <iq-pillar-bar name="Risco" [score]="b.sub_scores.risk.score" />
          <iq-pillar-bar name="Dividendos" [score]="b.sub_scores.dividends.score" />
          <iq-pillar-bar name="Crescimento" [score]="b.sub_scores.growth.score" />
          <iq-pillar-bar name="Momentum" [score]="b.sub_scores.momentum.score" />
        </div>

        @if (margin(); as m) {
          <div class="margin-section card">
            <span class="overline">MARGEM DE SEGURANÇA</span>
            <div class="margin-row">
              <span class="label">Preço Justo</span>
              <span class="mono">{{ m.fair_value_final != null ? 'R$ ' + (m.fair_value_final | number:'1.2-2') : '--' }}</span>
            </div>
            <div class="margin-row">
              <span class="label">Preço Atual</span>
              <span class="mono">{{ m.current_price != null ? 'R$ ' + (m.current_price | number:'1.2-2') : '--' }}</span>
            </div>
            <div class="margin-row">
              <span class="label">Margem</span>
              <span class="mono" [class.pos]="m.safety_margin != null && m.safety_margin > 0"
                    [class.neg]="m.safety_margin != null && m.safety_margin < 0">
                {{ m.safety_margin != null ? (m.safety_margin | percent:'1.1-1') : '--' }}
              </span>
            </div>
          </div>
        }

        @if (evidences().length > 0) {
          <div class="evidences">
            <span class="overline">EVIDÊNCIAS</span>
            @for (ev of evidences(); track ev.criterion_name) {
              <div class="evidence-item card">
                <div class="ev-header">
                  <span class="label">{{ ev.criterion_name }}</span>
                  <span class="mono ev-score">{{ ev.score }}/100</span>
                </div>
                <p class="ev-text">{{ ev.evidence_text }}</p>
                @if (ev.bull_points && ev.bull_points.length > 0) {
                  <div class="ev-points">
                    @for (p of ev.bull_points; track $index) {
                      <span class="ev-point pos"><i class="ph ph-caret-up"></i> {{ p }}</span>
                    }
                  </div>
                }
                @if (ev.bear_points && ev.bear_points.length > 0) {
                  <div class="ev-points">
                    @for (p of ev.bear_points; track $index) {
                      <span class="ev-point neg"><i class="ph ph-caret-down"></i> {{ p }}</span>
                    }
                  </div>
                }
              </div>
            }
          </div>
        }
      </div>
    } @else {
      <div class="loading label">Carregando...</div>
    }
  `,
  styles: [`
    .score-tab { display: flex; flex-direction: column; gap: 20px; }
    .main-scores { display: flex; gap: 12px; }
    .main-pill {
      flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px;
      padding: 12px; background: var(--bg-alt); border-radius: var(--radius);
    }
    .score-val { font-size: 24px; font-weight: 700; color: var(--t1); }
    .pillars { display: flex; flex-direction: column; gap: 12px; }
    .margin-section { padding: 14px; display: flex; flex-direction: column; gap: 8px; }
    .margin-row { display: flex; justify-content: space-between; font-size: 13px; }
    .margin-row .mono { font-weight: 600; }
    .evidences { display: flex; flex-direction: column; gap: 8px; }
    .evidence-item { padding: 12px; display: flex; flex-direction: column; gap: 6px; }
    .ev-header { display: flex; justify-content: space-between; align-items: center; }
    .ev-score { font-size: 13px; font-weight: 700; }
    .ev-text { font-size: 12px; color: var(--t2); line-height: 1.5; }
    .ev-points { display: flex; flex-direction: column; gap: 2px; }
    .ev-point { font-size: 11px; display: flex; align-items: center; gap: 4px; }
    .ev-point i { font-size: 10px; }
    .loading { display: flex; justify-content: center; padding: 40px; color: var(--t3); }
  `]
})
export class TabScoreComponent implements OnInit {
  private readonly api = inject(ApiService);
  ticker = input.required<string>();

  readonly breakdown = signal<BreakdownData | null>(null);
  readonly evidences = signal<EvidenceItem[]>([]);
  readonly margin = signal<MarginData | null>(null);

  ngOnInit(): void {
    const t = this.ticker();
    this.api.get<BreakdownData>(`/scores/${t}/breakdown`).subscribe({
      next: d => this.breakdown.set(d),
    });
    this.api.get<ScoreFullData>(`/scores/${t}`).subscribe({
      next: d => this.evidences.set(d.evidences || []),
    });
    this.api.get<MarginData>(`/valuation/${t}/margin`).subscribe({
      next: d => this.margin.set(d),
      error: () => {},
    });
  }
}
