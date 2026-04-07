import { Component, ChangeDetectionStrategy, inject, signal, computed, OnInit } from '@angular/core';
import { forkJoin } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { YourUpcomingComponent, CalendarEntry } from './components/your-upcoming.component';
import { DividendHealthComponent, SafetyEntry } from './components/dividend-health.component';
import { TrapScannerComponent, TrapEntry } from './components/trap-scanner.component';
import { MarketCalendarComponent } from './components/market-calendar.component';
import { DividendRadarComponent } from './components/dividend-radar.component';
import { DividendSimulatorComponent } from './components/dividend-simulator.component';

interface PortfolioData { positions: { ticker: string; quantity: number; company_name?: string }[]; total_value: number; }
interface SafetyResponse { ticker: string; company_name: string; dividend_safety: number; dividend_yield_proj: number | null; dividend_cagr_5y: number | null; }
interface TrapResponse { ticker: string; company_name: string; is_dividend_trap: boolean; risk_level: string; reasons: string[]; }

@Component({
  selector: 'iq-dividends',
  standalone: true,
  imports: [
    YourUpcomingComponent, DividendHealthComponent, TrapScannerComponent,
    MarketCalendarComponent, DividendRadarComponent, DividendSimulatorComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="dividends-page">
      <h1>Dividendos</h1>

      <!-- Personal sections (with portfolio only) -->
      @if (hasPortfolio()) {
        <iq-your-upcoming [calendar]="calendar()" [portfolioTickers]="tickerQtyMap()" />

        <div class="health-grid">
          <iq-dividend-health [entries]="safetyEntries()" />
          <iq-trap-scanner [entries]="trapEntries()" />
        </div>
      }

      <!-- Market sections (always visible) -->
      <div class="market-section">
        <div class="radar-grid">
          <iq-dividend-radar class="radar-col" [portfolioTickers]="portfolioTickerSet()" />
          <div class="calendar-col">
            <iq-market-calendar [calendar]="calendar()" [portfolioTickers]="portfolioTickerSet()" />
          </div>
        </div>
      </div>

      <!-- Simulator -->
      <iq-dividend-simulator />
    </div>
  `,
  styles: [`
    .dividends-page { display: flex; flex-direction: column; gap: 16px; }
    h1 { font-family: var(--font-ui); font-size: 21px; font-weight: 700; color: var(--t1); }
    .health-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .radar-grid { display: grid; grid-template-columns: 3fr 2fr; gap: 16px; }
  `]
})
export class DividendsComponent implements OnInit {
  private readonly api = inject(ApiService);

  readonly portfolio = signal<PortfolioData | null>(null);
  readonly calendar = signal<CalendarEntry[]>([]);
  readonly safetyEntries = signal<SafetyEntry[]>([]);
  readonly trapEntries = signal<TrapEntry[]>([]);

  readonly hasPortfolio = computed(() => {
    const p = this.portfolio();
    return p != null && p.positions && p.positions.length > 0;
  });

  readonly tickerQtyMap = computed(() => {
    const p = this.portfolio();
    const map = new Map<string, number>();
    if (p?.positions) {
      for (const pos of p.positions) map.set(pos.ticker, pos.quantity);
    }
    return map;
  });

  readonly portfolioTickerSet = computed(() => new Set(this.tickerQtyMap().keys()));

  ngOnInit(): void {
    // Load calendar
    this.api.get<{ calendar: CalendarEntry[] }>('/dividends/calendar', { days: 60 }).subscribe({
      next: d => this.calendar.set(d.calendar || []),
      error: () => {},
    });

    // Load portfolio
    this.api.get<PortfolioData>('/portfolio').subscribe({
      next: data => {
        this.portfolio.set(data);
        if (data.positions && data.positions.length > 0) {
          this.loadSafetyAndTraps(data.positions.map(p => p.ticker));
        }
      },
      error: () => this.portfolio.set({ positions: [], total_value: 0 }),
    });
  }

  private loadSafetyAndTraps(tickers: string[]): void {
    const safetyReqs: Record<string, ReturnType<typeof this.api.get<SafetyResponse>>> = {};
    const trapReqs: Record<string, ReturnType<typeof this.api.get<TrapResponse>>> = {};

    for (const t of tickers) {
      safetyReqs[t] = this.api.get<SafetyResponse>(`/dividends/${t}/safety`);
      trapReqs[t] = this.api.get<TrapResponse>(`/dividends/${t}/trap-risk`);
    }

    forkJoin(safetyReqs).subscribe({
      next: results => {
        this.safetyEntries.set(Object.values(results).filter(r => r != null));
      },
      error: () => {},
    });

    forkJoin(trapReqs).subscribe({
      next: results => {
        this.trapEntries.set(Object.values(results).filter(r => r != null));
      },
      error: () => {},
    });
  }
}
