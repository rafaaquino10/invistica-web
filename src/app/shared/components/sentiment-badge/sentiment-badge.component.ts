import { Component, ChangeDetectionStrategy, input } from '@angular/core';

@Component({
  selector: 'iq-sentiment-badge',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span class="badge" [class]="sentiment()">{{ sentiment() }}</span>`,
  styles: [`
    .badge {
      display: inline-flex; padding: 1px 6px; border-radius: var(--radius);
      font-family: var(--font-ui); font-size: 9px; font-weight: 700;
      text-transform: uppercase; letter-spacing: 0.04em;
    }
    .positivo, .positive { background: var(--pos-dim); color: var(--pos); }
    .negativo, .negative { background: var(--neg-dim); color: var(--neg); }
    .neutro, .neutral { background: var(--warn-dim); color: var(--warn); }
  `]
})
export class SentimentBadgeComponent {
  sentiment = input.required<string>();
}
