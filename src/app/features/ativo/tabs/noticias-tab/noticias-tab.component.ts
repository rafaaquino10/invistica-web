import { Component, ChangeDetectionStrategy, input, inject, signal, OnInit, DestroyRef } from '@angular/core';
import { DatePipe } from '@angular/common';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { switchMap, forkJoin, catchError, of, filter } from 'rxjs';
import { NewsService } from '../../../../core/services/news.service';
import type { NewsItem, IREvent } from '../../../../core/models/news.model';
import { IqSkeletonComponent } from '../../../../shared/components/iq-skeleton/iq-skeleton.component';
import { IqEmptyStateComponent } from '../../../../shared/components/iq-empty-state/iq-empty-state.component';

@Component({
  selector: 'iq-noticias-tab',
  standalone: true,
  imports: [DatePipe, IqSkeletonComponent, IqEmptyStateComponent],
  template: `
    @if (loading()) {
      <iq-skeleton variant="rect" width="100%" height="200px" />
    } @else {
      <div class="news">
        <h4 class="news__title">Notícias</h4>
        @if (newsItems().length > 0) {
          @for (item of newsItems(); track item.id) {
            <a class="news__item" [href]="item.url" target="_blank" rel="noopener">
              <div class="news__meta">
                <span class="news__source mono">{{ item.source }}</span>
                <span class="news__date mono">{{ item.published_at | date:'dd/MM HH:mm' }}</span>
                @if (item.sentiment) {
                  <span class="news__sentiment" [class]="'news__sentiment--' + item.sentiment">{{ item.sentiment }}</span>
                }
              </div>
              <span class="news__headline">{{ item.title }}</span>
              @if (item.summary) {
                <span class="news__summary">{{ item.summary }}</span>
              }
            </a>
          }
        } @else {
          <iq-empty-state title="Sem notícias recentes" />
        }

        <h4 class="news__title" style="margin-top:24px">Relações com Investidores</h4>
        @if (irEvents().length > 0) {
          @for (ev of irEvents(); track ev.id) {
            <a class="news__item" [href]="ev.url" target="_blank" rel="noopener">
              <div class="news__meta">
                <span class="news__source mono">{{ ev.type }}</span>
                <span class="news__date mono">{{ ev.date | date:'dd/MM/yyyy' }}</span>
              </div>
              <span class="news__headline">{{ ev.title }}</span>
            </a>
          }
        } @else {
          <iq-empty-state title="Sem eventos de RI" />
        }
      </div>
    }
  `,
  styles: [`
    .news { display: flex; flex-direction: column; gap: 8px; }
    .news__title { font-size: 0.75rem; font-weight: 600; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px; }
    .news__item { display: flex; flex-direction: column; gap: 4px; padding: 10px 0; border-bottom: 1px solid var(--border-default); text-decoration: none; color: inherit; &:hover { background: var(--surface-2); } }
    .news__meta { display: flex; align-items: center; gap: 8px; }
    .news__source { font-size: 0.6875rem; font-weight: 600; color: var(--text-tertiary); }
    .news__date { font-size: 0.6875rem; color: var(--text-quaternary); }
    .news__sentiment { font-size: 0.6875rem; font-weight: 600; padding: 1px 6px; border-radius: var(--radius); }
    .news__sentiment--positive { color: var(--positive); background: var(--positive-bg); }
    .news__sentiment--negative { color: var(--negative); background: var(--negative-bg); }
    .news__sentiment--neutral { color: var(--text-tertiary); background: var(--surface-2); }
    .news__headline { font-size: 0.875rem; color: var(--text-primary); line-height: 1.4; }
    .news__summary { font-size: 0.75rem; color: var(--text-tertiary); }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NoticiasTabComponent implements OnInit {
  readonly ticker = input.required<string>();
  private readonly newsService = inject(NewsService);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = signal(true);
  readonly newsItems = signal<NewsItem[]>([]);
  readonly irEvents = signal<IREvent[]>([]);

  ngOnInit(): void {
    const t = this.ticker(); if (!t) return; // direct call
    of(t).pipe(
      
      switchMap(t => forkJoin({
        news: this.newsService.getNews(t, 20).pipe(catchError(() => of({ ticker: t, news: [] }))),
        ir: this.newsService.getIR(t, 10).pipe(catchError(() => of({ ticker: t, events: [] }))),
      })),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(({ news, ir }) => {
      this.newsItems.set(news.news ?? []);
      this.irEvents.set(ir.events ?? []);
      this.loading.set(false);
    });
  }
}
