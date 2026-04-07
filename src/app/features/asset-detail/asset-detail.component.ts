import { Component, ChangeDetectionStrategy, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { forkJoin } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { AssetHeaderComponent } from './components/asset-header.component';
import { TabScoreComponent } from './components/tab-score.component';
import { TabValuationComponent } from './components/tab-valuation.component';
import { TabFundamentalsComponent } from './components/tab-fundamentals.component';
import { TabDividendsComponent } from './components/tab-dividends.component';
import { TabRiskComponent } from './components/tab-risk.component';
import { TabNewsComponent } from './components/tab-news.component';
import { SidePanelComponent } from './components/side-panel.component';

interface QuoteData {
  open: number; close: number; high: number; low: number; volume: number;
}

interface ScoreData {
  iq_cognit: { iq_score: number; rating: string; rating_label: string };
  valuation?: { current_price: number };
}

interface TickerData {
  ticker: string;
  company_name: string;
  quote: QuoteData;
}

@Component({
  selector: 'iq-asset-detail',
  standalone: true,
  imports: [
    AssetHeaderComponent,
    TabScoreComponent, TabValuationComponent, TabFundamentalsComponent,
    TabDividendsComponent, TabRiskComponent, TabNewsComponent,
    SidePanelComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (ticker(); as t) {
      <div class="asset-page">
        <iq-asset-header
          [ticker]="t"
          [companyName]="companyName()"
          [currentPrice]="currentPrice()"
          [changePct]="changePct()"
          [volume]="volume()"
          [iqScore]="iqScore()"
          [ratingLabel]="ratingLabel()" />

        <div class="content-grid">
          <!-- LEFT: Tabs -->
          <div class="tabs-col">
            <div class="tab-bar">
              @for (tab of tabs; track tab.id) {
                <button class="tab-btn" [class.active]="activeTab() === tab.id" (click)="activeTab.set(tab.id)">
                  {{ tab.label }}
                </button>
              }
            </div>

            <div class="tab-content">
              @switch (activeTab()) {
                @case ('score') { <iq-tab-score [ticker]="t" /> }
                @case ('valuation') { <iq-tab-valuation [ticker]="t" /> }
                @case ('fundamentals') { <iq-tab-fundamentals [ticker]="t" /> }
                @case ('dividends') { <iq-tab-dividends [ticker]="t" /> }
                @case ('risk') { <iq-tab-risk [ticker]="t" /> }
                @case ('news') { <iq-tab-news [ticker]="t" /> }
              }
            </div>
          </div>

          <!-- RIGHT: Side panel -->
          <iq-side-panel class="side-col" [ticker]="t" />
        </div>
      </div>
    }
  `,
  styles: [`
    .asset-page { display: flex; flex-direction: column; gap: 16px; }
    .content-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 20px; align-items: start; }
    .tab-bar {
      display: flex; gap: 2px; border-bottom: 1px solid var(--border); padding-bottom: 0;
    }
    .tab-btn {
      padding: 8px 14px; font-family: var(--font-ui); font-size: 12px; font-weight: 500;
      color: var(--t3); border-bottom: 2px solid transparent;
      transition: color var(--transition-fast), border-color var(--transition-fast);
    }
    .tab-btn:hover { color: var(--t1); }
    .tab-btn.active { color: var(--volt); border-bottom-color: var(--volt); font-weight: 700; }
    .tab-content { padding-top: 16px; }
    .side-col { position: sticky; top: calc(var(--header-h) + 24px); }
  `]
})
export class AssetDetailComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(ApiService);
  private sub: Subscription | null = null;

  readonly ticker = signal('');
  readonly companyName = signal('');
  readonly currentPrice = signal(0);
  readonly changePct = signal<number | null>(null);
  readonly volume = signal<number | null>(null);
  readonly iqScore = signal<number | null>(null);
  readonly ratingLabel = signal('');
  readonly activeTab = signal('score');

  readonly tabs = [
    { id: 'score', label: 'Score' },
    { id: 'valuation', label: 'Valuation' },
    { id: 'fundamentals', label: 'Fundamentos' },
    { id: 'dividends', label: 'Dividendos' },
    { id: 'risk', label: 'Risco' },
    { id: 'news', label: 'Notícias' },
  ];

  ngOnInit(): void {
    this.sub = this.route.paramMap.subscribe(params => {
      const t = params.get('ticker') || '';
      this.ticker.set(t);
      this.activeTab.set('score');
      if (t) this.loadHeaderData(t);
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  private loadHeaderData(t: string): void {
    forkJoin({
      ticker: this.api.get<TickerData>(`/tickers/${t}`),
      score: this.api.get<ScoreData>(`/scores/${t}`),
    }).subscribe({
      next: ({ ticker: td, score: sd }) => {
        this.companyName.set(td.company_name || '');
        if (td.quote) {
          this.currentPrice.set(td.quote.close);
          this.volume.set(td.quote.volume);
          if (td.quote.open && td.quote.close) {
            this.changePct.set(((td.quote.close - td.quote.open) / td.quote.open) * 100);
          }
        }
        if (sd.iq_cognit) {
          this.iqScore.set(sd.iq_cognit.iq_score);
          this.ratingLabel.set(sd.iq_cognit.rating_label || '');
        }
      },
      error: () => {},
    });
  }
}
