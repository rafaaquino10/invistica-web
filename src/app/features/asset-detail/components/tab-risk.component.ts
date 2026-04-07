import { Component, ChangeDetectionStrategy, inject, input, signal, OnInit } from '@angular/core';
import { DecimalPipe, PercentPipe } from '@angular/common';
import { ApiService } from '../../../core/services/api.service';
import { RiskBadgeComponent } from '../../../shared/components/risk-badge/risk-badge.component';

interface RiskMetrics {
  risk_metrics: {
    altman_z: number | null;
    altman_z_label: string | null;
    merton_pd: number | null;
    dl_ebitda: number | null;
    icj: number | null;
    piotroski_score: number | null;
    liquidity_ratio: number | null;
  };
  profitability: {
    roe: number | null;
    roic: number | null;
    net_margin: number | null;
    gross_margin: number | null;
  };
}

interface ShortItem { date: string; short_pct: number; }

@Component({
  selector: 'iq-tab-risk',
  standalone: true,
  imports: [DecimalPipe, PercentPipe, RiskBadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="risk-tab">
      @if (data(); as d) {
        <div class="metrics-grid">
          <div class="metric-card card">
            <span class="overline">ALTMAN Z-SCORE</span>
            <span class="metric-val mono">{{ d.risk_metrics.altman_z != null ? (d.risk_metrics.altman_z | number:'1.2-2') : '--' }}</span>
            @if (d.risk_metrics.altman_z_label) {
              <iq-risk-badge [level]="altmanLevel(d.risk_metrics.altman_z_label)" />
            }
          </div>
          <div class="metric-card card">
            <span class="overline">MERTON PD</span>
            <span class="metric-val mono">{{ d.risk_metrics.merton_pd != null ? (d.risk_metrics.merton_pd | percent:'1.2-2') : '--' }}</span>
          </div>
          <div class="metric-card card">
            <span class="overline">DL/EBITDA</span>
            <span class="metric-val mono">{{ d.risk_metrics.dl_ebitda != null ? (d.risk_metrics.dl_ebitda | number:'1.1-1') + 'x' : '--' }}</span>
            @if (d.risk_metrics.dl_ebitda != null) {
              <iq-risk-badge [level]="d.risk_metrics.dl_ebitda < 2 ? 'low' : d.risk_metrics.dl_ebitda < 3.5 ? 'medium' : 'high'" />
            }
          </div>
          <div class="metric-card card">
            <span class="overline">PIOTROSKI</span>
            <span class="metric-val mono">{{ d.risk_metrics.piotroski_score ?? '--' }}/9</span>
            @if (d.risk_metrics.piotroski_score != null) {
              <iq-risk-badge [level]="d.risk_metrics.piotroski_score >= 7 ? 'low' : d.risk_metrics.piotroski_score >= 4 ? 'medium' : 'high'" />
            }
          </div>
          <div class="metric-card card">
            <span class="overline">LIQUIDEZ</span>
            <span class="metric-val mono">{{ d.risk_metrics.liquidity_ratio != null ? (d.risk_metrics.liquidity_ratio | number:'1.2-2') : '--' }}</span>
          </div>
          <div class="metric-card card">
            <span class="overline">COB. JUROS</span>
            <span class="metric-val mono">{{ d.risk_metrics.icj != null ? (d.risk_metrics.icj | number:'1.1-1') + 'x' : '--' }}</span>
          </div>
        </div>
      } @else {
        <div class="loading label">Carregando...</div>
      }

      @if (shorts().length > 0) {
        <div class="shorts-section">
          <span class="overline">POSIÇÕES VENDIDAS</span>
          <div class="shorts-list">
            @for (s of shorts(); track s.date) {
              <div class="short-row">
                <span class="mono">{{ s.date }}</span>
                <span class="mono">{{ (s.short_pct | percent:'1.2-2') }}</span>
              </div>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .risk-tab { display: flex; flex-direction: column; gap: 20px; }
    .metrics-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
    .metric-card { padding: 14px; display: flex; flex-direction: column; gap: 6px; }
    .metric-val { font-size: 18px; font-weight: 700; color: var(--t1); }
    .shorts-section { display: flex; flex-direction: column; gap: 8px; }
    .shorts-list { display: flex; flex-direction: column; gap: 4px; }
    .short-row { display: flex; justify-content: space-between; padding: 6px 8px; background: var(--bg-alt); border-radius: var(--radius); font-size: 12px; }
    .loading { text-align: center; padding: 40px; color: var(--t3); }
  `]
})
export class TabRiskComponent implements OnInit {
  private readonly api = inject(ApiService);
  ticker = input.required<string>();
  readonly data = signal<RiskMetrics | null>(null);
  readonly shorts = signal<ShortItem[]>([]);

  ngOnInit(): void {
    const t = this.ticker();
    this.api.get<RiskMetrics>(`/scores/${t}/risk-metrics`).subscribe({ next: d => this.data.set(d), error: () => {} });
    this.api.get<{ short_interest: ShortItem[] }>(`/tickers/${t}/short-interest`).subscribe({
      next: d => this.shorts.set(d.short_interest || []),
      error: () => {},
    });
  }

  altmanLevel(label: string): 'low' | 'medium' | 'high' {
    if (label === 'safe') return 'low';
    if (label === 'grey') return 'medium';
    return 'high';
  }
}
