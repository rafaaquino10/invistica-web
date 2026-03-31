import { Component, ChangeDetectionStrategy, input, signal } from '@angular/core';

@Component({
  selector: 'iq-accordion',
  standalone: true,
  template: `
    <div class="accordion" [class.accordion--open]="isExpanded()">
      <button class="accordion__header" (click)="isExpanded.set(!isExpanded())">
        <span class="accordion__title">{{ title() }}</span>
        <svg class="accordion__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>
      <div class="accordion__body">
        <div class="accordion__content">
          <ng-content />
        </div>
      </div>
    </div>
  `,
  styles: [`
    .accordion {
      border: 1px solid var(--border-default);
      border-radius: var(--radius);
      overflow: hidden;
    }
    .accordion__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      padding: var(--space-3) var(--space-4);
      border: none;
      background: var(--surface-1);
      cursor: pointer;
      font-weight: 500;
      font-size: 0.875rem;
      color: var(--text-primary);
    }
    .accordion__icon {
      color: var(--text-tertiary);
      transition: transform var(--duration-normal) var(--ease);
    }
    .accordion--open .accordion__icon {
      transform: rotate(180deg);
    }
    .accordion__body {
      max-height: 0;
      overflow: hidden;
      transition: max-height var(--duration-normal) var(--ease);
    }
    .accordion--open .accordion__body {
      max-height: 500px;
    }
    .accordion__content {
      padding: var(--space-4);
      border-top: 1px solid var(--border-default);
      font-size: 0.875rem;
      color: var(--text-secondary);
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IqAccordionComponent {
  readonly title = input('');
  readonly expanded = input(false);
  readonly isExpanded = signal(false);

  ngOnInit(): void {
    this.isExpanded.set(this.expanded());
  }
}
