import { Component, ChangeDetectionStrategy, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { ApiService } from '../../core/services/api.service';
import { forkJoin } from 'rxjs';

interface TopAsset {
  ticker: string;
  company_name: string;
}

interface Quote {
  ticker: string;
  open: number;
  close: number;
}

interface TapeItem {
  ticker: string;
  name: string;
  price: number;
  change: number;
  logoUrl: string;
  initials: string;
  logoError: boolean;
}

@Component({
  selector: 'iq-ticker-tape',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (items().length > 0) {
      <div class="tape">
        <div class="tape-track">
          @for (item of items(); track item.ticker) {
            <span class="tape-item">
              @if (!item.logoError) {
                <img class="tape-logo"
                     [src]="item.logoUrl"
                     [alt]="item.ticker"
                     (error)="onLogoError(item)"
                     loading="lazy" />
              } @else {
                <span class="tape-logo-fallback">
                  <span>{{ item.initials }}</span>
                </span>
              }
              <span class="tape-ticker mono">{{ item.ticker }}</span>
              <span class="tape-name">{{ item.name }}</span>
              <span class="tape-price mono">{{ formatPrice(item.price) }}</span>
              <span class="tape-change mono"
                    [class.pos]="item.change >= 0"
                    [class.neg]="item.change < 0">
                {{ item.change >= 0 ? '+' : '' }}{{ item.change.toFixed(2) }}%
              </span>
            </span>
          }
          <!-- Duplicate for seamless loop -->
          @for (item of items(); track item.ticker + '-dup') {
            <span class="tape-item">
              @if (!item.logoError) {
                <img class="tape-logo"
                     [src]="item.logoUrl"
                     [alt]="item.ticker"
                     (error)="onLogoError(item)"
                     loading="lazy" />
              } @else {
                <span class="tape-logo-fallback">
                  <span>{{ item.initials }}</span>
                </span>
              }
              <span class="tape-ticker mono">{{ item.ticker }}</span>
              <span class="tape-name">{{ item.name }}</span>
              <span class="tape-price mono">{{ formatPrice(item.price) }}</span>
              <span class="tape-change mono"
                    [class.pos]="item.change >= 0"
                    [class.neg]="item.change < 0">
                {{ item.change >= 0 ? '+' : '' }}{{ item.change.toFixed(2) }}%
              </span>
            </span>
          }
        </div>
      </div>
    }
  `,
  styles: [`
    :host {
      display: block;
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      height: var(--ticker-h);
      z-index: 200;
    }

    .tape {
      height: 100%;
      background: var(--bg-alt);
      border-top: 1px solid var(--border);
      overflow: hidden;
      display: flex;
      align-items: center;
    }

    .tape-track {
      display: flex;
      gap: 28px;
      white-space: nowrap;
      animation: scroll 60s linear infinite;
      padding-left: 16px;
    }

    .tape-item {
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }

    .tape-logo {
      width: 16px;
      height: 16px;
      border-radius: 2px;
      object-fit: cover;
    }

    .tape-logo-fallback {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 16px;
      height: 16px;
      border-radius: 2px;
      background: var(--elevated);
      font-family: var(--font-ui);
      font-size: 7px;
      font-weight: 700;
      color: var(--t3);
    }

    .tape-ticker {
      font-size: 11px;
      font-weight: 700;
      color: var(--t1);
    }

    .tape-name {
      font-family: var(--font-ui);
      font-size: 10px;
      color: var(--t3);
      max-width: 100px;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .tape-price {
      font-size: 11px;
      font-weight: 600;
      color: var(--t1);
    }

    .tape-change {
      font-size: 11px;
      font-weight: 500;
    }

    @keyframes scroll {
      0% { transform: translateX(0); }
      100% { transform: translateX(-50%); }
    }
  `]
})
export class TickerTapeComponent implements OnInit, OnDestroy {
  private readonly api = inject(ApiService);
  private intervalId: ReturnType<typeof setInterval> | null = null;

  readonly items = signal<TapeItem[]>([]);

  ngOnInit(): void {
    this.loadData();
    this.intervalId = setInterval(() => this.loadData(), 60_000);
  }

  ngOnDestroy(): void {
    if (this.intervalId) clearInterval(this.intervalId);
  }

  onLogoError(item: TapeItem): void {
    item.logoError = true;
    this.items.update(list => [...list]);
  }

  formatPrice(price: number): string {
    return price.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  private loadData(): void {
    this.api.get<{ top: TopAsset[] }>('/scores/top', { limit: 15 }).subscribe({
      next: (res) => {
        const tickers = (res.top || []).map(a => a.ticker).filter(Boolean);
        if (tickers.length === 0) return;

        const quoteRequests = tickers.reduce((acc, t) => {
          acc[t] = this.api.get<Quote>(`/tickers/${t}/quote`);
          return acc;
        }, {} as Record<string, ReturnType<typeof this.api.get<Quote>>>);

        forkJoin(quoteRequests).subscribe({
          next: (quotes) => {
            const topMap = new Map(res.top.map(a => [a.ticker, a]));
            const tape: TapeItem[] = [];

            for (const ticker of tickers) {
              const q = quotes[ticker];
              const asset = topMap.get(ticker);
              if (!q || !asset || !q.close || !q.open) continue;

              const change = ((q.close - q.open) / q.open) * 100;
              const baseTicker = ticker.replace(/\d+$/, '');

              tape.push({
                ticker,
                name: this.shortenName(asset.company_name),
                price: q.close,
                change,
                logoUrl: `https://raw.githubusercontent.com/StatusInvest/Content/master/img/company/${ticker}.jpg`,
                initials: baseTicker.slice(0, 2),
                logoError: false,
              });
            }

            if (tape.length > 0) {
              this.items.set(tape);
            }
          },
        });
      },
    });
  }

  private shortenName(name: string): string {
    if (!name) return '';
    return name
      .replace(/\b(S\.?A\.?|LTDA|CIA|HOLDING|PARTICIPACOES|PARTICIPAÇÕES|INVESTIMENTOS)\b\.?/gi, '')
      .replace(/\s{2,}/g, ' ')
      .trim()
      .slice(0, 20);
  }
}
