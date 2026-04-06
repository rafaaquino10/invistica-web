import { Component, ChangeDetectionStrategy, inject, signal, OnInit, computed } from '@angular/core';
import { ApiService } from '../../core/services/api.service';
import { KpiStripComponent, KpiItem } from '../../shared/components/kpi-strip/kpi-strip.component';
import { RegimePanelComponent } from './components/regime-panel.component';
import { MotorPanelComponent } from './components/motor-panel.component';
import { EventsPanelComponent } from './components/events-panel.component';
import { TopOpportunitiesPanelComponent } from './components/top-opportunities-panel.component';
import { SignalsPanelComponent } from './components/signals-panel.component';
import { ImportPanelComponent } from './components/import-panel.component';
import { PortfolioPanelComponent, PortfolioData, IntradayData } from './components/portfolio-panel.component';
import { EquityCurvePanelComponent } from './components/equity-curve-panel.component';
import { forkJoin } from 'rxjs';

interface PerformanceData {
  cagr?: number;
  alpha_ibov?: number;
  rentabilidade_12m?: number;
}

@Component({
  selector: 'iq-dashboard',
  standalone: true,
  imports: [
    KpiStripComponent,
    RegimePanelComponent,
    MotorPanelComponent,
    EventsPanelComponent,
    TopOpportunitiesPanelComponent,
    SignalsPanelComponent,
    ImportPanelComponent,
    PortfolioPanelComponent,
    EquityCurvePanelComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- KPI Strip (only with portfolio) -->
    @if (hasPortfolio()) {
      <iq-kpi-strip [items]="kpiItems()" />
    }

    <div class="dashboard-grid" [class.has-portfolio]="hasPortfolio()">
      <!-- ROW 1: 3 columns -->
      <div class="row-top">
        <iq-regime-panel />
        <iq-motor-panel />
        <iq-events-panel />
      </div>

      <!-- ROW 2: Top Opportunities (+ Equity Curve if portfolio) -->
      <div class="row-mid" [class.with-chart]="hasPortfolio()">
        <iq-top-opportunities-panel
          class="panel-opportunities"
          [showPortfolioCol]="hasPortfolio()"
          [portfolioTickers]="portfolioTickers()" />
        @if (hasPortfolio()) {
          <iq-equity-curve-panel class="panel-chart" />
        }
      </div>

      <!-- ROW 3: Signals + Import/Portfolio -->
      <div class="row-bottom">
        <iq-signals-panel />
        @if (hasPortfolio()) {
          <iq-portfolio-panel [portfolio]="portfolio()!" [intraday]="intraday()" />
        } @else {
          <iq-import-panel />
        }
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }

    .dashboard-grid {
      display: flex;
      flex-direction: column;
      gap: 16px;
      padding: 16px 0;
    }

    .row-top {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 16px;
    }

    .row-mid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 16px;
    }

    .row-mid.with-chart {
      grid-template-columns: 2fr 1fr;
    }

    .row-bottom {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }
  `]
})
export class DashboardComponent implements OnInit {
  private readonly api = inject(ApiService);

  readonly portfolio = signal<PortfolioData | null>(null);
  readonly intraday = signal<IntradayData | null>(null);
  readonly perfData = signal<PerformanceData | null>(null);

  readonly hasPortfolio = computed(() => {
    const p = this.portfolio();
    return p != null && p.positions && p.positions.length > 0;
  });

  readonly portfolioTickers = computed(() => {
    const p = this.portfolio();
    if (!p?.positions) return new Set<string>();
    return new Set(p.positions.map(pos => pos.ticker));
  });

  readonly kpiItems = computed<KpiItem[]>(() => {
    const p = this.portfolio();
    const i = this.intraday();
    const perf = this.perfData();

    return [
      { label: 'Patrimônio', value: p ? `R$ ${(p.total_value || 0).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}` : '--' },
      { label: 'Rent. 12M', value: perf?.rentabilidade_12m != null ? `${perf.rentabilidade_12m.toFixed(1)}%` : '--' },
      { label: 'Alpha IBOV', value: perf?.alpha_ibov != null ? `${perf.alpha_ibov.toFixed(1)}%` : '--', change: perf?.alpha_ibov },
      { label: 'Variação Dia', value: i?.change_pct != null ? `${i.change_pct.toFixed(2)}%` : '--', change: i?.change_pct },
      { label: 'Score Médio', value: '--' },
    ];
  });

  ngOnInit(): void {
    // Load portfolio to decide layout
    this.api.get<PortfolioData>('/portfolio').subscribe({
      next: (d) => {
        this.portfolio.set(d);

        // If portfolio has positions, load additional data
        if (d.positions && d.positions.length > 0) {
          forkJoin({
            intraday: this.api.get<IntradayData>('/portfolio/intraday'),
            perf: this.api.get<PerformanceData>('/portfolio/performance', { months: 12 }),
          }).subscribe({
            next: (res) => {
              this.intraday.set(res.intraday);
              this.perfData.set(res.perf);
            },
          });
        }
      },
      error: () => this.portfolio.set({ positions: [], total_value: 0, total_cost: 0 }),
    });
  }
}
