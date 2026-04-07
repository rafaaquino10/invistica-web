import { Component, ChangeDetectionStrategy, inject, signal, computed, OnInit } from '@angular/core';
import { forkJoin } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { KpiStripComponent, KpiItem } from '../../shared/components/kpi-strip/kpi-strip.component';
import { EmptyPortfolioComponent } from './components/empty-portfolio.component';
import { AlertsStripComponent } from './components/alerts-strip.component';
import { PositionsTableComponent, EnrichedPosition } from './components/positions-table.component';
import { PositionFormModalComponent } from './components/position-form-modal.component';
import { ConfirmDeleteModalComponent } from './components/confirm-delete-modal.component';
import { SectorDonutComponent } from './components/sector-donut.component';
import { IntradayMiniComponent } from './components/intraday-mini.component';
import { RiskPanelComponent } from './components/risk-panel.component';
import { AttributionPanelComponent } from './components/attribution-panel.component';
import { SmartContributionComponent } from './components/smart-contribution.component';
import { PortfolioDividendsComponent, DividendSummary } from './components/portfolio-dividends.component';
import { EquityCurvePanelComponent } from '../dashboard/components/equity-curve-panel.component';

interface RawPosition {
  id: string; ticker: string; quantity: number; avg_price: number;
  current_price?: number; current_value?: number; weight?: number; change_pct?: number;
}

interface PortfolioData { positions: RawPosition[]; total_value: number; total_cost: number; }
interface PerfData { rentabilidade_12m?: number; alpha_ibov?: number; }
interface IntradayData { change_pct?: number; }
interface ScoreData { iq_cognit: { iq_score: number }; }
interface TickerData { ticker: string; company_name: string; cluster_id: number; quote: { close: number; open: number; volume: number } }

@Component({
  selector: 'iq-portfolio',
  standalone: true,
  imports: [
    KpiStripComponent, EmptyPortfolioComponent, AlertsStripComponent,
    PositionsTableComponent, PositionFormModalComponent, ConfirmDeleteModalComponent,
    SectorDonutComponent, IntradayMiniComponent,
    RiskPanelComponent, AttributionPanelComponent, SmartContributionComponent,
    PortfolioDividendsComponent, EquityCurvePanelComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (!loaded()) {
      <div class="loading label">Carregando...</div>
    } @else if (!hasPositions()) {
      <iq-empty-portfolio (connectBroker)="openPluggy()" (addManual)="showAddModal.set(true)" />
    } @else {
      <div class="portfolio-page">
        <h1>Carteira</h1>

        <!-- KPI Strip -->
        <iq-kpi-strip [items]="kpiItems()" />

        <!-- Alerts -->
        <iq-alerts-strip />

        <!-- Main: Positions + Charts -->
        <div class="main-grid">
          <iq-positions-table
            [positions]="enrichedPositions()"
            (addPosition)="showAddModal.set(true)"
            (connectBroker)="openPluggy()"
            (editPosition)="onEdit($event)"
            (deletePosition)="onDelete($event)" />

          <div class="charts-col">
            <iq-equity-curve-panel />
            <iq-sector-donut [sectorData]="sectorData()" />
            <iq-intraday-mini />
          </div>
        </div>

        <!-- Analytics -->
        <div class="analytics-grid">
          <iq-risk-panel />
          <iq-attribution-panel />
          <iq-smart-contribution />
        </div>

        <!-- Dividends -->
        <iq-portfolio-dividends [summary]="dividendSummary()" />
      </div>
    }

    <!-- Modals -->
    @if (showAddModal()) {
      <iq-position-form-modal (closed)="showAddModal.set(false)" (saved)="onSaved()" />
    }
    @if (editTarget(); as t) {
      <iq-position-form-modal
        [editMode]="true"
        [editPositionId]="t.id"
        [initialTicker]="t.ticker"
        [initialName]="t.company_name"
        [initialQuantity]="t.quantity"
        [initialPrice]="t.avg_price"
        (closed)="editTarget.set(null)"
        (saved)="onSaved()" />
    }
    @if (deleteTarget(); as t) {
      <iq-confirm-delete-modal
        [positionId]="t.id"
        [ticker]="t.ticker"
        [quantity]="t.quantity"
        [avgPrice]="t.avg_price"
        (closed)="deleteTarget.set(null)"
        (deleted)="onSaved()" />
    }
  `,
  styles: [`
    .portfolio-page { display: flex; flex-direction: column; gap: 16px; }
    h1 { font-family: var(--font-ui); font-size: 21px; font-weight: 700; color: var(--t1); }
    .main-grid { display: grid; grid-template-columns: 55fr 45fr; gap: 16px; align-items: start; }
    .charts-col { display: flex; flex-direction: column; gap: 12px; }
    .analytics-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; }
    .loading { text-align: center; padding: 60px; color: var(--t3); }
  `]
})
export class PortfolioComponent implements OnInit {
  private readonly api = inject(ApiService);

  readonly loaded = signal(false);
  readonly portfolio = signal<PortfolioData | null>(null);
  readonly enrichedPositions = signal<EnrichedPosition[]>([]);
  readonly perfData = signal<PerfData | null>(null);
  readonly intradayPct = signal<number | null>(null);
  readonly dividendSummary = signal<DividendSummary>({ total_12m: 0, avg_yield: 0, last_payment: '' });

  readonly showAddModal = signal(false);
  readonly editTarget = signal<EnrichedPosition | null>(null);
  readonly deleteTarget = signal<EnrichedPosition | null>(null);

  readonly hasPositions = computed(() => {
    const p = this.portfolio();
    return p != null && p.positions && p.positions.length > 0;
  });

  readonly sectorData = computed(() =>
    this.enrichedPositions().map(p => ({ cluster_id: p.cluster_id, value: p.current_value }))
  );

  readonly kpiItems = computed<KpiItem[]>(() => {
    const p = this.portfolio();
    const perf = this.perfData();
    const positions = this.enrichedPositions();
    const avgScore = positions.length > 0
      ? Math.round(positions.filter(x => x.iq_score != null).reduce((s, x) => s + (x.iq_score || 0), 0) / positions.filter(x => x.iq_score != null).length)
      : null;

    return [
      { label: 'Patrimônio', value: p ? `R$ ${(p.total_value || 0).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}` : '--' },
      { label: 'Variação Dia', value: this.intradayPct() != null ? `${this.intradayPct()!.toFixed(2)}%` : '--', change: this.intradayPct() },
      { label: 'Rent. 12M', value: perf?.rentabilidade_12m != null ? `${perf.rentabilidade_12m.toFixed(1)}%` : '--' },
      { label: 'Alpha IBOV', value: perf?.alpha_ibov != null ? `${perf.alpha_ibov.toFixed(1)}%` : '--', change: perf?.alpha_ibov },
      { label: 'Score Médio', value: avgScore != null ? String(avgScore) : '--' },
      { label: 'Posições', value: String(positions.length) },
    ];
  });

  ngOnInit(): void { this.loadAll(); }

  openPluggy(): void {
    // Pluggy Connect Widget integration
    // In production: import { PluggyConnect } from 'pluggy-connect-sdk';
    // new PluggyConnect({ connectToken: '...', onSuccess: (data) => { ... } });
    alert('Importação via Pluggy disponível em breve');
  }

  onEdit(pos: EnrichedPosition): void { this.editTarget.set(pos); }
  onDelete(pos: EnrichedPosition): void { this.deleteTarget.set(pos); }

  onSaved(): void {
    this.showAddModal.set(false);
    this.editTarget.set(null);
    this.deleteTarget.set(null);
    this.loadAll();
  }

  private loadAll(): void {
    this.api.get<PortfolioData>('/portfolio').subscribe({
      next: (data) => {
        this.portfolio.set(data);
        this.loaded.set(true);

        if (data.positions && data.positions.length > 0) {
          this.enrichPositions(data);
          this.loadPerformance();
          this.loadDividends(data.positions);
        }
      },
      error: () => {
        this.portfolio.set({ positions: [], total_value: 0, total_cost: 0 });
        this.loaded.set(true);
      },
    });
  }

  private enrichPositions(data: PortfolioData): void {
    const tickers = data.positions.map(p => p.ticker);
    const requests: Record<string, ReturnType<typeof this.api.get<TickerData>>> = {};
    const scoreRequests: Record<string, ReturnType<typeof this.api.get<ScoreData>>> = {};

    for (const t of tickers) {
      requests[t] = this.api.get<TickerData>(`/tickers/${t}`);
      scoreRequests[t] = this.api.get<ScoreData>(`/scores/${t}`);
    }

    forkJoin({ tickers: forkJoin(requests), scores: forkJoin(scoreRequests) }).subscribe({
      next: ({ tickers: tickerData, scores: scoreData }) => {
        const enriched: EnrichedPosition[] = data.positions.map(pos => {
          const td = tickerData[pos.ticker];
          const sd = scoreData[pos.ticker];
          const currentPrice = td?.quote?.close || pos.current_price || pos.avg_price;
          const currentValue = currentPrice * pos.quantity;
          const changePct = td?.quote?.open ? ((currentPrice - td.quote.open) / td.quote.open) * 100 : 0;
          const resultBrl = (currentPrice - pos.avg_price) * pos.quantity;
          const resultPct = pos.avg_price > 0 ? ((currentPrice - pos.avg_price) / pos.avg_price) * 100 : 0;

          return {
            id: pos.id,
            ticker: pos.ticker,
            company_name: td?.company_name || pos.ticker,
            quantity: pos.quantity,
            avg_price: pos.avg_price,
            current_price: currentPrice,
            current_value: currentValue,
            weight: data.total_value > 0 ? currentValue / data.total_value : 0,
            change_pct: changePct,
            result_brl: resultBrl,
            result_pct: resultPct,
            iq_score: sd?.iq_cognit?.iq_score ?? null,
            cluster_id: td?.cluster_id || 1,
            has_alert: false,
          };
        });
        this.enrichedPositions.set(enriched);
      },
      error: () => {
        this.enrichedPositions.set(data.positions.map(pos => ({
          id: pos.id, ticker: pos.ticker, company_name: pos.ticker,
          quantity: pos.quantity, avg_price: pos.avg_price,
          current_price: pos.avg_price, current_value: pos.avg_price * pos.quantity,
          weight: 0, change_pct: 0, result_brl: 0, result_pct: 0,
          iq_score: null, cluster_id: 1, has_alert: false,
        })));
      },
    });
  }

  private loadPerformance(): void {
    forkJoin({
      perf: this.api.get<PerfData>('/portfolio/performance', { months: 12 }),
      intraday: this.api.get<IntradayData>('/portfolio/intraday'),
    }).subscribe({
      next: ({ perf, intraday }) => {
        this.perfData.set(perf);
        this.intradayPct.set(intraday?.change_pct ?? null);
      },
      error: () => {},
    });
  }

  private loadDividends(positions: RawPosition[]): void {
    const requests: Record<string, ReturnType<typeof this.api.get<{ dividends: { value_per_share: number; ex_date: string }[] }>>> = {};
    for (const p of positions) {
      requests[p.ticker] = this.api.get(`/tickers/${p.ticker}/dividends`);
    }
    forkJoin(requests).subscribe({
      next: (results) => {
        let total = 0;
        let lastDate = '';
        const cutoff = new Date();
        cutoff.setFullYear(cutoff.getFullYear() - 1);

        for (const pos of positions) {
          const divs = results[pos.ticker]?.dividends || [];
          for (const d of divs) {
            if (new Date(d.ex_date) >= cutoff) {
              total += d.value_per_share * pos.quantity;
              if (d.ex_date > lastDate) lastDate = d.ex_date;
            }
          }
        }

        const portfolio = this.portfolio();
        const totalValue = portfolio?.total_value || 1;
        this.dividendSummary.set({
          total_12m: total,
          avg_yield: totalValue > 0 ? total / totalValue : 0,
          last_payment: lastDate,
        });
      },
      error: () => {},
    });
  }
}
