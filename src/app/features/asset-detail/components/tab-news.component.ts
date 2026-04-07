import { Component, ChangeDetectionStrategy, inject, input, signal, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ApiService } from '../../../core/services/api.service';
import { SentimentBadgeComponent } from '../../../shared/components/sentiment-badge/sentiment-badge.component';

interface NewsItem { title: string; date: string; source: string; url: string; sentiment?: string; }
interface IRItem { title: string; date: string; url: string; type: string; }

@Component({
  selector: 'iq-tab-news',
  standalone: true,
  imports: [DatePipe, SentimentBadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="news-tab">
      <div class="section">
        <span class="overline">NOTÍCIAS</span>
        @if (news().length > 0) {
          @for (n of news(); track n.url) {
            <a class="news-row card" [href]="n.url" target="_blank" rel="noopener">
              <span class="news-date mono">{{ n.date | date:'dd/MM' }}</span>
              <span class="news-title">{{ n.title }}</span>
              @if (n.sentiment) {
                <iq-sentiment-badge [sentiment]="n.sentiment" />
              }
              <span class="news-source label">{{ n.source }}</span>
            </a>
          }
        } @else {
          <span class="empty label">Sem notícias recentes</span>
        }
      </div>

      <div class="section">
        <span class="overline">RELAÇÕES COM INVESTIDORES</span>
        @if (ir().length > 0) {
          @for (item of ir(); track item.url) {
            <a class="news-row card" [href]="item.url" target="_blank" rel="noopener">
              <span class="news-date mono">{{ item.date | date:'dd/MM' }}</span>
              <span class="news-title">{{ item.title }}</span>
              <span class="ir-type label">{{ item.type }}</span>
            </a>
          }
        } @else {
          <span class="empty label">Sem publicações recentes</span>
        }
      </div>
    </div>
  `,
  styles: [`
    .news-tab { display: flex; flex-direction: column; gap: 20px; }
    .section { display: flex; flex-direction: column; gap: 6px; }
    .news-row {
      display: flex; align-items: center; gap: 10px; padding: 10px 12px;
      transition: background var(--transition-fast); text-decoration: none;
    }
    .news-row:hover { background: var(--card-hover); }
    .news-date { font-size: 11px; color: var(--t3); min-width: 40px; }
    .news-title { flex: 1; font-size: 12px; color: var(--t1); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .news-source { color: var(--t4); flex-shrink: 0; }
    .ir-type {
      padding: 1px 6px; border-radius: var(--radius); background: var(--elevated);
      font-size: 9px; font-weight: 700; text-transform: uppercase; color: var(--t3); flex-shrink: 0;
    }
    .empty { padding: 20px; color: var(--t3); text-align: center; }
  `]
})
export class TabNewsComponent implements OnInit {
  private readonly api = inject(ApiService);
  ticker = input.required<string>();
  readonly news = signal<NewsItem[]>([]);
  readonly ir = signal<IRItem[]>([]);

  ngOnInit(): void {
    const t = this.ticker();
    this.api.get<{ news: NewsItem[] }>(`/news/${t}`, { limit: 10 }).subscribe({
      next: d => this.news.set(d.news || []),
      error: () => {},
    });
    this.api.get<{ items: IRItem[] }>(`/news/${t}/investor-relations`, { limit: 20 }).subscribe({
      next: d => this.ir.set(d.items || []),
      error: () => {},
    });
  }
}
