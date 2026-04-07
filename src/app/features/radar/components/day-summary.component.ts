import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { FeedItem } from './feed-timeline.component';

@Component({
  selector: 'iq-day-summary',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="panel card">
      <span class="overline">RESUMO DO DIA</span>
      <span class="total-events mono">{{ totalToday() }}</span>
      <span class="label events-label">eventos hoje</span>
      <div class="breakdown">
        <span class="label">{{ newsCount() }} notícias · {{ scoreCount() }} scores · {{ divCount() }} dividendos</span>
      </div>
    </div>
  `,
  styles: [`
    .panel { padding: 14px; display: flex; flex-direction: column; gap: 4px; align-items: center; }
    .total-events { font-size: 28px; font-weight: 700; color: var(--t1); }
    .events-label { color: var(--t3); }
    .breakdown { color: var(--t4); font-size: 11px; }
  `]
})
export class DaySummaryComponent {
  feed = input.required<FeedItem[]>();

  private todayItems = computed(() => {
    const today = new Date().toISOString().slice(0, 10);
    return this.feed().filter(i => i.date?.startsWith(today));
  });

  totalToday = computed(() => this.todayItems().length);
  newsCount = computed(() => this.todayItems().filter(i => i.type.includes('news') || i.type === 'noticia').length);
  scoreCount = computed(() => this.todayItems().filter(i => i.type.includes('score')).length);
  divCount = computed(() => this.todayItems().filter(i => i.type.includes('dividend') || i.type === 'dividendo').length);
}
