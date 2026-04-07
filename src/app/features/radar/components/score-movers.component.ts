import { Component, ChangeDetectionStrategy, input, inject } from '@angular/core';
import { Router } from '@angular/router';
import { FeedItem } from './feed-timeline.component';

@Component({
  selector: 'iq-score-movers',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="panel card">
      <span class="overline">{{ title() }}</span>
      @if (items().length > 0) {
        @for (item of items(); track item.id) {
          <div class="mover-row" (click)="goTo(item.tickers[0])">
            <span class="mover-ticker mono">{{ item.tickers[0] || '' }}</span>
            @if (item.old_score != null && item.new_score != null) {
              <span class="mono score-old">{{ item.old_score }}</span>
              <i class="ph ph-arrow-right arrow"></i>
              <span class="mono score-new" [class.pos]="item.new_score > item.old_score" [class.neg]="item.new_score < item.old_score">{{ item.new_score }}</span>
              <span class="mono delta" [class.pos]="(item.new_score - item.old_score) > 0" [class.neg]="(item.new_score - item.old_score) < 0">
                {{ (item.new_score - item.old_score) > 0 ? '+' : '' }}{{ item.new_score - item.old_score }}
              </span>
            } @else {
              <span class="mono">{{ item.message }}</span>
            }
          </div>
        }
      } @else {
        <span class="empty label">{{ emptyText() }}</span>
      }
    </div>
  `,
  styles: [`
    .panel { padding: 14px; display: flex; flex-direction: column; gap: 6px; }
    .mover-row { display: flex; align-items: center; gap: 6px; padding: 4px 0; cursor: pointer; border-bottom: 1px solid var(--border); transition: background var(--transition-fast); }
    .mover-row:last-child { border-bottom: none; }
    .mover-row:hover { background: var(--card-hover); }
    .mover-ticker { font-size: 11px; font-weight: 700; color: var(--volt); min-width: 45px; }
    .score-old { font-size: 11px; color: var(--t4); }
    .arrow { font-size: 10px; color: var(--t4); }
    .score-new { font-size: 12px; font-weight: 700; }
    .delta { font-size: 10px; font-weight: 600; }
    .empty { color: var(--t4); font-size: 11px; padding: 8px 0; }
  `]
})
export class ScoreMoversComponent {
  private readonly router = inject(Router);
  title = input('SCORE MOVERS');
  items = input.required<FeedItem[]>();
  emptyText = input('Sem mudanças');
  goTo(ticker: string): void { if (ticker) this.router.navigate(['/ativo', ticker]); }
}
